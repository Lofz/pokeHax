/**
 * dex.js — camada de acesso ao dataset.
 *
 * ÚNICA porta de entrada para o pokedex.json. Todo o resto do app
 * consome Pokémon já normalizados por aqui. Se um dia o formato do
 * dataset mudar (outro JSON, uma API, etc.), só este arquivo muda.
 */
import pokedex from "./pokedex.json";

/**
 * As URLs de sprite do dataset apontam para o `raw.githubusercontent.com`, que
 * NÃO é um CDN (rate-limit, sem garantia de cache). Reescrevemos para o
 * jsDelivr, que serve o mesmo repositório via CDN real com CORS — robusto sob
 * tráfego e necessário para o PNG de compartilhar do Hall da Fama.
 */
const RAW = "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master";
const CDN = "https://cdn.jsdelivr.net/gh/Purukitto/pokemon-data.json@master";
const cdn = (url) => (url ? url.replace(RAW, CDN) : null);

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
      sprite: cdn(entry.image?.sprite),
      thumbnail: cdn(entry.image?.thumbnail),
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
