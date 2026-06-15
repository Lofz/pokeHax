/**
 * links.js — fonte única dos links externos (rodapé + "Sobre").
 *
 * PREENCHA com as URLs reais. Cada item com `url` vazio (null/"") é ignorado e
 * NÃO aparece no rodapé — assim dá para deixar o "Apoiar" desligado até decidir
 * o provedor (Patreon, Ko-fi, etc.).
 *
 * `id` casa com o ícone desenhado em components/About.jsx (x | tiktok | discord
 * | donate). `label` é o texto acessível (aria-label / tooltip).
 *
 * `active: true` num item o torna um LINK clicável de verdade, mesmo com
 * LINKS_ACTIVE global desligado — assim dá para subir um link por vez (ex.: só
 * o Ko-fi pronto, redes ainda placeholder). Sem `active`, o item segue o
 * LINKS_ACTIVE.
 */
export const SOCIAL = [
  { id: "x", label: "X (Twitter)", url: "https://x.com/SEU_PERFIL" },
  { id: "tiktok", label: "TikTok", url: "https://tiktok.com/@SEU_PERFIL" },
  { id: "discord", label: "Discord", url: "https://discord.gg/SEU_CONVITE" },
  // Apoio: Ko-fi do projeto, já ativo (clicável) mesmo com LINKS_ACTIVE off.
  { id: "donate", label: "Apoiar o projeto", url: "https://ko-fi.com/pokehaxofc", active: true },
];

/**
 * Liga os CLIQUES de TODOS os links externos de uma vez (redes + apoio).
 * Enquanto as URLs acima forem placeholders, deixe `false`: o que não tiver
 * `active: true` continua VISÍVEL mas sem clique (imagem, sem `<a>` → sem 404).
 * Para liberar um link sozinho, use `active: true` no item (ver SOCIAL acima).
 */
export const LINKS_ACTIVE = false;

/** Contato para feedback/erros. Deixe "" para esconder a linha no "Sobre". */
export const CONTACT_EMAIL = "";

/** Data da última revisão da Política de Privacidade (exibida no texto). */
export const PRIVACY_UPDATED = "14 de junho de 2026";
