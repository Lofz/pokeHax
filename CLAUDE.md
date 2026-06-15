# PokéHax — guia para o agente

Jogo de fã (não-comercial), **frontend puro** (React + Vite, SPA estática, sem backend).
Você rola/draft um time de 6 Pokémon de Johto/Kanto e enfrenta a Elite dos 4 + Campeão.
Pergunta-tema: "seu time aplica o **6 a 0**?". Tudo em **PT-BR**.

## Stack & comandos
- React 18 + Vite 5. Deps de runtime extra: `html-to-image` (PNG do Hall da Fama) e `posthog-js` (analytics, **carregado sob demanda** — só baixa se houver chave).
- `npm run dev` (raiz `/`), `npm run build` (gera `dist/`, base `/pokeHax/`). **Mantenha o build verde.**
- Sem testes. A validação é `npm run build` + checagem visual pelo usuário.

## Arquitetura (onde mexer)
- `src/data/pokedex.json` — dataset (251 mons). **Fonte única.**
- `src/data/dex.js` — normaliza o dataset; reescreve URLs de sprite p/ **jsDelivr** (CDN). Porta de entrada.
- `src/data/pool.js` — **draft**: `rollCandidates(seed, rodada, jaEscolhidos, nonce)`. `TEAM_SIZE=6`, `CANDIDATES_PER_ROUND=3`, faixa de potencial 50–100. Determinístico por seed.
- `src/data/elite.js` — times da Elite (ids/níveis GSC) + `buff` por treinador (multiplica HP/ataque) + sprites de treinador. **Os buffs foram calibrados (ver sim.mjs); são não-monotônicos de propósito.**
- `src/data/typeChart.js` — efetividade Gen 2 + **Fada** (retroativo). Cores/nomes PT dos tipos.
- `src/data/modes.js` — sprites dos modos (Giovanni = Rocket, Oak), via `import.meta.env.BASE_URL`.
- `src/engine/rng.js` — RNG por seed (mulberry32 + hashSeed).
- `src/engine/battle.js` — `simulateBattle` (gera timeline de eventos). `PLAYER_LVL=46`, `TUNING`, e `POTENTIAL` (**rubber-band**: lança os fracos pro teto, fortes ganham só +15% global). `buff` do treinador multiplica HP/atk do inimigo.
- `src/components/MonCard.jsx` — carta. **CONDIÇÃO** (estilo Winning Eleven: triângulo ▲ girado + cor) no lugar do número de potencial. Alça de arraste `.reorder`.
- `src/components/Intro.jsx` — tutorial, carta-exemplo, scouting da Elite (expansível), escolha de modo (com chip de pulos).
- `src/components/Arena.jsx` — batalha ao vivo: **VOCÊ à esquerda, Elite à direita** (orientação autêntica), bandejas de Pokébolas acima de cada mon. Também exporta `Bench`.
- `src/components/MatchRow.jsx` — resumo do confronto. Ao vivo: head inverte (você←esq, pause centro, Elite→dir) com deslize; concluído: badge GANHOU/PERDEU + KOs; pendente: "A SEGUIR".
- `src/components/Finale.jsx` — **Hall da Fama compartilhável** (estilo GSC: palco + confete + arte `thumbnail` + faixa "BEM-VINDO..."). Botão exporta PNG via `html-to-image` (Web Share no mobile, download no desktop). `DefeatBox` simples.
- `src/components/bits.jsx` — `TypeChip`, `HPBar`, `Sprite`, `Pokeball`, `BallTray`.
- `src/analytics/track.js` — **wrapper de analytics agnóstico** (PostHog). Trocar de provedor = mexer só aqui. `initAnalytics()` no boot (`main.jsx`); `track(evento, props)` no resto. Liga só com `VITE_POSTHOG_KEY` E (produção OU `VITE_ANALYTICS=1` em dev) — senão é no-op. O SDK entra por import dinâmico (não vai no bundle principal nem é pré-carregado; baixa em runtime só quando ligado).
- `src/App.jsx` — orquestra fases: `intro | roll(draft) | run | champion | defeat`. Draft, **reordenação por Pointer Events**, pause do playback, e o debug `?win`.
- `src/styles/global.css` — TODO o estilo. Tema "noite de Johto" / Game Boy Color.
- `sim.mjs` — **ferramenta de balanceamento** (Monte Carlo). Roda via: `./node_modules/.bin/esbuild sim.mjs --bundle --platform=node --format=esm --outfile=sim.bundle.mjs && node sim.bundle.mjs 4000`.

## Convenções (IMPORTANTE)
- **Copy em PT-BR**, voz ativa, concisa.
- Estética **pixel/GBC**; fontes "Press Start 2P" (labels) + "VT323" (corpo).
- **Ícones = glifos geométricos de texto** (`▲ ★ ❚❚ ⠿ ▸`), **NÃO emoji** — emoji renderizam inconsistente no Windows e quebram o canvas do compartilhar. (Exceção tolerada: 👑 no título do Campeão na intro.)
- **Determinismo por seed**: draft e potenciais derivam da seed.
- **Dificuldade**: ajuste pelos campos `buff` em `elite.js`; recalibre com `sim.mjs` (alvo do bot esperto ~14% campeão; humano joga melhor).

## Gotchas
- **Reordenação (drag)**: usa **Pointer Events** (mouse+toque, funciona no iOS). A captura do ponteiro fica no **container do grid** (estável) — capturar na carta perde a captura quando o reorder move o DOM. Alça `.reorder` tem `touch-action: none`. NÃO usar HTML5 drag nativo (não dispara em touch).
- **`?win`**: força a tela de campeão p/ dev; só funciona em `import.meta.env.DEV`.
- **Sprites de Pokémon**: via jsDelivr (CORS ok). Sprites de treinador: locais em `public/trainers/`, referenciadas com `import.meta.env.BASE_URL`.
- **Deploy**: GitHub Pages em `lofz.github.io/pokeHax/` → `vite.config.js` usa `base: "/pokeHax/"` só no build. **Se migrar p/ domínio próprio (raiz), trocar a base p/ `/`.** Workflow: `.github/workflows/deploy.yml` (push na `main`).
- **Analytics em produção**: a chave vem de **repo secrets** (`VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`) injetados no passo `npm run build` do workflow. Local: `.env.local` (ver `.env.example`). Sem secret → deploy normal, analytics desligado.

## Estado do git
- Repo: `github.com/Lofz/pokeHax`. Branch principal: `main`.
- `versao-alfa` — checkpoint alfa (+ deploy). `fix/mobile-ordering` — reorder via Pointer Events.

## Analytics (PostHog) — eventos instrumentados
Wrapper em `src/analytics/track.js` (`autocapture: false` — só os eventos abaixo). Todos os do funil de partida carregam `mode` (`'rocket'|'oak'`).
**Liga/desliga:** produção liga sozinha (se houver chave); **dev fica DESLIGADO** por padrão (não gasta cota) e só loga `[track:off]` no console — pra enviar de verdade em dev, `VITE_ANALYTICS=1` no `.env.local`.
- `mode_selected{mode}` — troca de modo na intro (só quando muda).
- `challenge_started{mode,seed,run_number,skips_used,team[]}` — clicou em DESAFIAR A ELITE. `run_number` = nª partida da sessão (→ "partidas em sequência").
- `stage_result{mode,seed,run_number,stage,trainer,win,score_for,score_against}` — fim de cada confronto (etapa 1..5).
- `champion{mode,seed,run_number}` / `defeat{mode,seed,run_number,stage,trainer}` — desfecho (→ win rate; abandono = `challenge_started` sem desfecho).
- `play_again{from,mode}` — NOVA JORNADA / TENTAR DE NOVO (não dispara no clique do logo = goHome).
- `share_clicked{mode,seed}` — botão Compartilhar do Hall da Fama.
- `about_opened{section}` — abriu o modal do rodapé (`'about'|'privacy'`).
- `outbound_click{to,where}` — clique em link externo (`to`: `x|tiktok|discord|donate`; `where`: `footer|modal|banner`).

## Sobre / rodapé / links
- `src/components/About.jsx` — `SupportBanner` (pedacinho de apoio compacto no canto sup. direito do cabeçalho: **Cubone** [easter egg] + balãozinho GB com pílula APOIAR; o `<a>` todo é o link de doação; só renderiza se houver URL `donate` em links.js) + `SiteFooter` (rodapé) + modal "Sobre / Privacidade" (abas, fecha no ESC/scrim, trava scroll). Ícones de marca são **SVG monocromático** (`currentColor`), não emoji; moedas são glifos CSS.
- `src/data/links.js` — **fonte única** dos links externos: `SOCIAL` (x/tiktok/discord/donate — itens com `url` vazio somem; item com **`active: true`** vira link clicável mesmo com `LINKS_ACTIVE` off, pra liberar um link por vez — ex.: o Ko-fi de apoio já é `active`), `LINKS_ACTIVE` (liga os cliques de **todos** de uma vez; **`false`** = o que não for `active` aparece mas sem `<a>`/sem clique = "só imagem", pra subir com URLs placeholder sem 404), `CONTACT_EMAIL`, `PRIVACY_UPDATED`.

## Roadmap / ideias em aberto
- Error boundary no topo (evitar tela branca em produção).
- Reordenação por teclado (a11y) — a alça já existe.
- Seed digitável/compartilhável via URL (`?seed=`).
- Domínio próprio (lembrar de trocar a `base`).
