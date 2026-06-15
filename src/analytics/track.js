/**
 * Wrapper de analytics — agnóstico de provedor. Trocar de PostHog para outra
 * ferramenta = mexer SÓ neste arquivo (o resto do app só chama `track`).
 *
 * Ligado quando há `VITE_POSTHOG_KEY` E (produção OU opt-in de dev):
 *   - produção (`npm run build`): liga sozinho, desde que haja a chave.
 *   - dev (`npm run dev`): DESLIGADO por padrão (não gasta cota com teste local).
 *     Para ligar em dev, defina `VITE_ANALYTICS=1` no `.env.local`.
 * Desligado → no-op; em dev, os eventos são logados no console p/ conferência.
 *
 * O SDK é carregado por import dinâmico: o bundle principal NÃO o inclui e o
 * `index.html` NÃO faz preload dele. Os ~66kB do posthog só são baixados em
 * runtime quando o analytics está ligado (a carga da página não muda).
 *
 * Variáveis (Vite, prefixo VITE_ obrigatório p/ ir ao bundle):
 *   VITE_POSTHOG_KEY   — project key pública (phc_...). Sem ela → no-op.
 *   VITE_POSTHOG_HOST  — ingest host (US por padrão; UE = https://eu.i.posthog.com).
 *   VITE_ANALYTICS     — opt-in p/ ligar em DEV ('1'). Em produção é ignorado.
 */
const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

// Liga em prod automaticamente; em dev, só com opt-in. Sempre exige a chave.
const ENABLED = !!KEY && (import.meta.env.PROD || import.meta.env.VITE_ANALYTICS === "1");

let ph = null; // instância do posthog quando carregada
let queue = []; // eventos disparados antes do SDK terminar de carregar

/** Inicializa o provedor. Chamar uma vez no boot (main.jsx). */
export function initAnalytics() {
  if (!ENABLED || typeof window === "undefined" || ph) return;
  import("posthog-js").then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: HOST,
      capture_pageview: true, // 1 pageview por carga → base de "sessões"
      capture_pageleave: true,
      autocapture: false, // só os nossos eventos: funil limpo + economiza cota
      persistence: "localStorage+cookie",
    });
    ph = posthog;
    for (const [e, p] of queue) ph.capture(e, p);
    queue = [];
  });
}

/**
 * Dispara um evento. `props` deve conter só dados anônimos de uso.
 * Convenção: nomes de evento em snake_case; `mode` ('rocket'|'oak') em tudo
 * que faz parte do funil de partida.
 */
export function track(event, props = {}) {
  if (!ENABLED) {
    if (import.meta.env.DEV) console.debug("[track:off]", event, props);
    return;
  }
  if (ph) ph.capture(event, props);
  else queue.push([event, props]); // SDK ainda carregando → enfileira
}
