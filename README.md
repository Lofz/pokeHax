# PokéHax — Você varre a Elite dos 4 na sorte?

Role o dado: saem 6 Pokémon entre os 251 de Johto e Kanto. Cada um vem com um
**potencial** aleatório — a sua *hax* daquela campanha — capaz de transformar um
azarão em terror. Encare a Elite dos 4 de Johto e o Campeão Lance em simulações
"ao vivo" no estilo do [7a0](https://7a0.com.br/).

No competitivo, **"hax"** é vencer na sorte (o crítico na hora certa, a rolagem
afortunada); **"levar 6 a 0"** é ser varrido sem derrubar ninguém. O jogo junta
os dois: **você aplica o 6 a 0 — nem que seja na hax?**

## Rodando

```bash
npm install
npm run dev      # desenvolvimento (http://localhost:5173)
npm run build    # build de produção em dist/
```

## Estrutura

```
src/
├── services/           ← MODO COMPETITIVO (Liga Pokémon)
│   ├── db.js           ← persistência (hoje localStorage; API async pensada
│   │                     para ser trocada por um backend real sem tocar na UI)
│   ├── account.js      ← conta sem cadastro: código de 8 chars + PIN (4–6
│   │                     dígitos, hash SHA-256). Acesso via ?conta=CODIGO
│   ├── ranking.js      ← Elo (K=32) + divisões (Liga Poké → Liga Lendária)
│   ├── competitive.js  ← equipe fixa (snapshot), 5 partidas/24h, batalha
│   │                     assíncrona vs equipe salva, regra "desafiado não pontua"
│   └── bots.js         ← 24 bots determinísticos espalhados pelas divisões
├── components/competitive/
│   ├── Gate.jsx        ← criar conta / entrar (código + PIN)
│   ├── Hub.jsx         ← perfil, liga, equipe fixa, tentativas, histórico
│   ├── OpponentSearch.jsx ← lista de adversários (equipe visível, condição não)
│   ├── CompResult.jsx  ← veredito ranqueado (±pontos, promoção/rebaixamento)
│   └── bits.jsx        ← LeagueBadge, Delta, TeamPeek
├── data/
│   ├── pokedex.json    ← O DATASET. Única fonte de verdade: nomes, tipos,
│   │                     stats base e URLs das sprites (251 Pokémon, Gen 1+2)
│   ├── dex.js          ← camada de acesso: normaliza e indexa o JSON.
│   │                     Se o formato do dataset mudar, só este arquivo muda
│   ├── pool.js         ← regras de sorteio do time (derivadas do dataset,
│   │                     sem nomes hardcoded): todos os 251 com peso igual +
│   │                     potencial sorteado por indivíduo (a "sorte" do bicho)
│   ├── elite.js        ← times da Elite dos 4 (ids da Pokédex + níveis de Gold/Silver)
│   └── typeChart.js    ← tabela de efetividade Gen 2, cores e nomes PT dos tipos
├── engine/
│   ├── rng.js          ← RNG determinístico por seed (campanhas reproduzíveis)
│   └── battle.js       ← motor de simulação; gera a timeline de eventos
├── components/
│   ├── bits.jsx        ← TypeChip, HPBar, Sprite
│   ├── MonCard.jsx     ← carta do Pokémon sorteado
│   ├── Arena.jsx       ← banco do time + arena viva (sprites, HP, feed)
│   ├── MatchRow.jsx    ← linha de confronto da campanha
│   └── Finale.jsx      ← Hall da Fama / derrota
├── App.jsx             ← fases do jogo e playback da timeline
├── main.jsx
└── styles/global.css   ← tema "noite de Johto" (Game Boy Color)
```

## De onde vêm os dados

Tudo sai do `src/data/pokedex.json`:

- **Sorteio do time** (`pool.js`): TODOS os 251 Pokémon entram com peso igual —
  inclusive não-evoluídos e fraquinhos. Cada slot ainda ganha um **potencial**
  (50–100) derivado da seed: a "sorte" daquele indivíduo naquela campanha.
- **Potencial** (`battle.js`, objeto `POTENTIAL`): é *rubber-band*. Os fortes
  ganham só um bônus suave; os fracos recuperam parte da lacuna até um "teto de
  campeão". É isso que dá ao Charmander sortudo uma chance de varrer a Elite — e
  mantém o Dragonite sendo Dragonite. O time inimigo não tem potencial (= 50).
- **Elite dos 4** (`elite.js`): cada slot referencia o número da Pokédex e o
  nível de Gold/Silver; nome, tipos, stats e sprite são hidratados pelo `dex.js`.
- **Batalha** (`battle.js`): usa os stats reais — HP base vira pontos de vida,
  `max(Attack, Sp. Attack)` vira poder de ataque e `Speed` disputa a ordem do
  turno. A efetividade segue a tabela da Gen 2.
- **Sprites**: o JSON aponta para `image.sprite` / `thumbnail` / `hires`
  (hospedadas no repositório do dataset). Para jogar offline, baixe as imagens
  e troque as URLs no JSON por caminhos locais em `public/`.

## Onde mexer no balanceamento

- `pool.js` → `POTENTIAL_MIN`, `POTENTIAL_MAX`, `TEAM_SIZE`
- `battle.js` → objeto `TUNING` (dano, crítico, HP, ritmo) e `POTENTIAL`
  (amplitude do potencial: `global`, `rubber`, tetos por stat) e `PLAYER_LVL`
- `elite.js` → trocar times/níveis da Elite

## Modos e estratégia (fase de seleção)

- **Reordenar o time**: antes de desafiar, use ◀ ▶ em cada carta para definir
  quem entra primeiro (a ordem do array é a ordem de batalha em `battle.js`).
- **Lente** (`App.jsx`, estado `lens`):
  - *Equipe Rocket* — revela poder (BST) e potencial (IV) de cada um.
  - *Professor Oak* — oculta os números com "?": vale só o seu conhecimento.

## Modo competitivo — Liga Pokémon

- **Conta sem cadastro**: na primeira vez você ganha um CÓDIGO único (8
  caracteres) e define um PIN numérico. O acesso é pelo link
  `seusite.com/jogo?conta=CODIGO` + PIN. **Não há recuperação** — guardar o
  link é responsabilidade do jogador (a UI avisa com insistência).
- **Equipe fixa**: drafta-se 6 Pokémon uma única vez; depois de salva, a
  equipe não muda (gancho para "temporadas" no futuro).
- **5 partidas por dia**: janela móvel de 24h, contada por partida iniciada.
- **Batalha assíncrona**: você enfrenta o *snapshot* salvo da equipe do
  adversário — ninguém precisa estar online. O resultado é simulado e
  **persistido no ato do desafio**; o playback é só a reprise (fechar a aba
  não desfaz uma derrota).
- **Visibilidade**: a composição da equipe alheia (quais 6, tipos, poder) é
  pública; a CONDIÇÃO (potencial individual) é segredo do dono.
- **Ranking Elo** (K=32): vencer rival mais forte rende mais, perder para
  rival mais fraco dói mais. Divisões: Liga Poké (<1000), Grande (1000+),
  Ultra (1200+), Master (1400+) e Lendária (1600+).
- **Só o desafiante pontua**: ser escolhido como adversário não mexe nos seus
  pontos — sua equipe serve apenas de "dado" para a batalha do outro.
- **Bots de teste**: 24 contas-bot determinísticas (`services/bots.js`)
  populam todas as divisões enquanto não há jogadores/backend de verdade.

**Persistência**: tudo vive no `localStorage` (chave `pokehax:db:v1`). A API
do `services/db.js` é assíncrona de propósito — para virar multiplayer real,
reimplemente essas funções com `fetch()` contra um backend (Supabase, Express
etc.) mantendo as assinaturas; UI e regras não mudam. O hash do PIN no
cliente é só inibidor: a verificação séria nasce com o servidor.

## Próximos passos planejados

- Reordenar o time também **antes de cada batalha** (hoje só antes do desafio)
- Seed digitável/compartilhável via URL (`?seed=K7M2Q`)
- Regras de sorteio com restrições (máx. 1 raro, sem tipos repetidos)
- Skillset por Pokémon (4 golpes), substituindo o "melhor tipo" do motor

---

Projeto de fã, sem fins comerciais. Pokémon é marca da Nintendo/Game Freak/Creatures.
Dataset: [Purukitto/pokemon-data.json](https://github.com/Purukitto/pokemon-data.json).
