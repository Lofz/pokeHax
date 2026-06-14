/**
 * links.js — fonte única dos links externos (rodapé + "Sobre").
 *
 * PREENCHA com as URLs reais. Cada item com `url` vazio (null/"") é ignorado e
 * NÃO aparece no rodapé — assim dá para deixar o "Apoiar" desligado até decidir
 * o provedor (Patreon, Ko-fi, etc.).
 *
 * `id` casa com o ícone desenhado em components/About.jsx (x | tiktok | discord
 * | donate). `label` é o texto acessível (aria-label / tooltip).
 */
export const SOCIAL = [
  { id: "x", label: "X (Twitter)", url: "https://x.com/SEU_PERFIL" },
  { id: "tiktok", label: "TikTok", url: "https://tiktok.com/@SEU_PERFIL" },
  { id: "discord", label: "Discord", url: "https://discord.gg/SEU_CONVITE" },
  // Apoiar/doação: troque pela URL do provedor escolhido (ex.: Patreon).
  // Deixe "" para esconder o botão enquanto não decide.
  { id: "donate", label: "Apoiar o projeto", url: "https://patreon.com/SEU_PERFIL" },
];

/**
 * Liga os CLIQUES dos links externos (redes + chip de doação).
 * Enquanto as URLs acima forem placeholders, deixe `false`: tudo continua
 * VISÍVEL na página, mas sem clique (renderiza como imagem, sem `<a>` → sem
 * 404). Quando preencher as URLs reais, troque para `true`.
 */
export const LINKS_ACTIVE = false;

/** Contato para feedback/erros. Deixe "" para esconder a linha no "Sobre". */
export const CONTACT_EMAIL = "";

/** Data da última revisão da Política de Privacidade (exibida no texto). */
export const PRIVACY_UPDATED = "14 de junho de 2026";
