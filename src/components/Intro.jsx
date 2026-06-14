import { useState } from "react";
import { getMon } from "../data/dex";
import { ELITE } from "../data/elite";
import { MODE_SPRITE } from "../data/modes";
import { MonCard } from "./MonCard";
import { TypeChip, Sprite } from "./bits";
import { track } from "../analytics/track";

/** Pokémon de vitrine do tutorial (Typhlosion, com um potencial alto de exemplo). */
const DEMO = { ...getMon(157), potential: 84 };

export function Intro({ lens, setLens, onStart }) {
  const [openElite, setOpenElite] = useState(null);
  /** Troca o modo e registra a escolha (só quando muda de fato). */
  function choose(m) {
    if (m !== lens) track("mode_selected", { mode: m });
    setLens(m);
  }
  return (
    <section className="intro">
      <div className="intro-block">
        <div className="intro-eyebrow">COMO SE JOGA</div>
        <ol className="how-steps">
          <li>
            <b>Drafte seu time.</b> Seis rodadas: em cada uma saem 3 Pokémon
            (dos 251 de Johto e Kanto) e você escolhe 1 para a vaga.
          </li>
          <li>
            <b>Não curtiu os 3? Pule.</b> O pulo re-sorteia os candidatos da
            rodada — mas é limitado, e quantos você tem depende do modo.
          </li>
          <li>
            <b>Monte a ordem.</b> Com as 6 vagas preenchidas, arraste as cartas
            para decidir quem entra primeiro. A sequência é estratégia.
          </li>
          <li>
            <b>Varra a Elite dos 4 + o Campeão.</b> Cinco confrontos, e os
            inimigos ficam mais fortes a cada um — o Lance é a parede final.
            Aplique o <b>6 a 0</b>, ou seja varrido.
          </li>
        </ol>
      </div>

      <div className="intro-block intro-split">
        <MonCard mon={DEMO} lens={lens} />
        <div className="intro-copy">
          <div className="intro-eyebrow">A CARTA</div>
          <p>
            <b>PODER</b> é a força-base do Pokémon (a soma dos status). Quanto
            maior, mais forte ele é por natureza.
          </p>
          <p>
            <b>CONDIÇÃO</b> é a forma daquele indivíduo nesta campanha — de RUIM
            a EXCELENTE, indicada por uma seta colorida (estilo Winning Eleven).
            Um azarão em condição excelente pode surpreender a Elite — por isso
            <b> todo Pokémon é jogável</b>.
          </p>
          <p className="intro-tip">
            A carta acima muda conforme o modo escolhido abaixo. ↓
          </p>
        </div>
      </div>

      <div className="intro-block">
        <div className="intro-eyebrow">QUEM VOCÊ VAI ENFRENTAR</div>
        <div className="elite-lineup">
          {ELITE.map((t, i) => {
            const open = openElite === i;
            return (
              <button
                key={t.name}
                className={
                  "elite-card" +
                  (t.title === "CAMPEÃO" ? " champ" : "") +
                  (open ? " open" : "")
                }
                onClick={() => setOpenElite(open ? null : i)}
                aria-expanded={open}
              >
                <Sprite src={t.sprite} alt={t.name} size={64} className="trainer-spr" />
                <div className="elite-title">
                  {t.title === "CAMPEÃO" ? "👑 CAMPEÃO 👑" : t.title}
                </div>
                <div className="elite-name">{t.name}</div>
                <TypeChip t={t.spec} />
                <span className="elite-toggle">{open ? "▲ FECHAR" : "▼ VER TIME"}</span>
              </button>
            );
          })}
        </div>

        {openElite != null && (
          <div className="elite-team">
            {ELITE[openElite].team.map((m, j) => (
              <div className="elite-mon" key={j}>
                <Sprite src={m.image.sprite} alt={m.name} size={48} />
                <span className="elite-mon-name">{m.name.toUpperCase()}</span>
                <span className="elite-mon-pow">PODER {m.bst}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="intro-block">
        <div className="intro-eyebrow">ESCOLHA O MODO</div>
        <div className="mode-grid">
          <button
            className={"mode-card" + (lens === "rocket" ? " on" : "")}
            onClick={() => choose("rocket")}
            aria-pressed={lens === "rocket"}
          >
            <div className="mode-head">
              <Sprite src={MODE_SPRITE.rocket} alt="Giovanni" size={56} className="trainer-spr" />
              <div className="mode-name">EQUIPE ROCKET</div>
            </div>
            <p>
              Você espia os dados: poder e condição à mostra. Decisões com
              informação completa.
            </p>
            <span className="mode-skip">↻ 1 PULO POR RODADA</span>
          </button>
          <button
            className={"mode-card" + (lens === "oak" ? " on" : "")}
            onClick={() => choose("oak")}
            aria-pressed={lens === "oak"}
          >
            <div className="mode-head">
              <Sprite src={MODE_SPRITE.oak} alt="Professor Oak" size={56} className="trainer-spr" />
              <div className="mode-name">PROFESSOR OAK</div>
            </div>
            <p>
              O poder vira "?" (a condição você ainda vê). Vale o seu
              conhecimento Pokémon para montar o time.
            </p>
            <span className="mode-skip">↻ 1 PULO NO DRAFT TODO</span>
          </button>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-gold" onClick={onStart}>
          MONTAR MEU TIME ▸
        </button>
      </div>
    </section>
  );
}
