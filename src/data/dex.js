/**
 * dex.js — camada de acesso ao dataset.
 *
 * ÚNICA porta de entrada para o pokedex.json. Todo o resto do app
 * consome Pokémon já normalizados por aqui. Se um dia o formato do
 * dataset mudar (outro JSON, uma API, etc.), só este arquivo muda.
 */
import pokedex from "./pokedex.json";

/**
 * SPRITES (cartas/batalha/banco) são SELF-HOSTED em `public/mons/` — mesma
 * origem do site. No mobile via CGNAT (5G), milhares de aparelhos compartilham
 * um IP e o jsDelivr passava a barrar com 403 (throttle por-IP), deixando
 * sprites quebrados; same-origin não tem esse limite e ainda mantém o canvas
 * "limpo" pro PNG de compartilhar. São só ~250 PNGs de <1 KB.
 *
 * THUMBNAILS (arte maior, usados só no Hall da Fama) seguem no jsDelivr pra não
 * pesar no repo — mas são pré-carregados durante a run (App.jsx) e têm fallback
 * pro sprite local (Finale), então não dependem da sorte do CDN no mobile.
 */
const RAW = "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master";
const CDN = "https://cdn.jsdelivr.net/gh/Purukitto/pokemon-data.json@master";
const cdn = (url) => (url ? url.replace(RAW, CDN) : null);
/** Sprite local: reaproveita o nome do arquivo da URL do dataset (ex: 006.png). */
const BASE = import.meta.env.BASE_URL;
const localSprite = (url) => (url ? `${BASE}mons/${url.split("/").pop()}` : null);

/** Normaliza uma entrada crua do dataset para o formato usado no jogo. */
function normalize(entry) {
  const base = entry.base ?? {};
  const bst =
    (base["HP"] ?? 0) +
    (base["Attack"] ?? 0) +
    (base["Defense"] ?? 0) +
    (base["Sp. Attack"] ?? 0) +
    (base["Sp. Defense"] ?? 0) +
    (base["Speed"] ?? 0);

  return {
    id: entry.id,
    name: entry.name.english,
    types: entry.type,
    stats: {
      hp: base["HP"] ?? 50,
      atk: base["Attack"] ?? 50,
      def: base["Defense"] ?? 50,
      spa: base["Sp. Attack"] ?? 50,
      spd: base["Sp. Defense"] ?? 50,
      spe: base["Speed"] ?? 50,
    },
    bst,
    species: entry.species,
    /** true quando o Pokémon NÃO possui próxima evolução */
    fullyEvolved: !entry?.evolution?.next,
    image: {
      sprite: localSprite(entry.image?.sprite), // self-hosted (public/mons)
      thumbnail: cdn(entry.image?.thumbnail), // jsDelivr (preload + fallback no Finale)
      hires: cdn(entry.image?.hires),
    },
  };
}

/** Mapa id -> Pokémon normalizado */
const byId = new Map(pokedex.map((e) => [e.id, normalize(e)]));

/** Busca por número da Pokédex. Lança erro se o id não existir no dataset. */
export function getMon(id) {
  const mon = byId.get(id);
  if (!mon) throw new Error(`Pokémon #${id} não encontrado no pokedex.json`);
  return mon;
}

/** Lista completa, já normalizada. */
export function allMons() {
  return [...byId.values()];
}
