/**
 * Hub.jsx — o quartel-general competitivo do jogador: perfil, liga,
 * equipe fixa, tentativas do dia e histórico de partidas.
 */
import { useState } from "react";
import { dailyStatus, MAX_DAILY_MATCHES } from "../../services/competitive";
import { leagueOf } from "../../services/ranking";
import { accountLink } from "../../services/account";
import { LeagueBadge, Delta } from "./bits";
import { MonCard } from "../MonCard";

function fmtTime(d) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function Hub({ account, onBuildTeam, onSearch, onLogout }) {
  const [copied, setCopied] = useState(false);
  const comp = account.competitive;
  const daily = comp ? dailyStatus(account) : null;
  const league = comp ? leagueOf(comp.rating) : null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(accountLink(account.code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sem clipboard — segue o jogo */
    }
  }

  return (
    <section className="hub">
      {/* ---- perfil ---- */}
      <div className="intro-block hub-head">
        <div className="hub-id">
          <div className="intro-eyebrow">TREINADOR</div>
          <div className="hub-name">{account.name}</div>
          <div className="hub-code">
            CONTA <b>{account.code}</b>
            <button type="button" className="btn small" onClick={copyLink}>
              {copied ? "✓ COPIADO" : "COPIAR LINK"}
            </button>
          </div>
        </div>
        {comp && (
          <div className="hub-rank">
            <LeagueBadge league={league} />
            <div className="hub-rating">{comp.rating} PTS</div>
            <div className="hub-wl">
              <span className="gold">{comp.wins}V</span> ·{" "}
              <span className="red">{comp.losses}D</span>
            </div>
          </div>
        )}
        <button className="btn btn-ghost small hub-exit" onClick={onLogout}>
          SAIR
        </button>
      </div>

      {/* ---- equipe ---- */}
      {!comp ? (
        <div className="intro-block">
          <div className="intro-eyebrow">SUA EQUIPE COMPETITIVA</div>
          <p className="gate-hint">
            Drafte 6 Pokémon para entrar na Liga. Atenção:{" "}
            <b className="red">a equipe é FIXA</b> — depois de salva, não há
            troca (até existir temporada). Escolha com carinho.
          </p>
          <div className="btn-row">
            <button className="btn btn-gold" onClick={onBuildTeam}>
              MONTAR EQUIPE FIXA ▸
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="intro-block">
            <div className="hub-team-head">
              <div className="intro-eyebrow">EQUIPE FIXA · DESDE {fmtDate(comp.lockedAt)}</div>
              <span className="hub-daily">
                PARTIDAS: <b>{daily.left}</b>/{MAX_DAILY_MATCHES} DISPONÍVEIS
                {daily.left === 0 && daily.nextFreeAt && (
                  <span className="mut"> · LIBERA ÀS {fmtTime(daily.nextFreeAt)}</span>
                )}
              </span>
            </div>
            <div className="team-grid">
              {comp.team.map((m, i) => (
                <MonCard key={m.id + "-" + i} mon={m} lens="rocket" />
              ))}
            </div>
            <div className="btn-row">
              <button
                className="btn btn-gold"
                onClick={onSearch}
                disabled={daily.left === 0}
              >
                BUSCAR ADVERSÁRIO ▸
              </button>
            </div>
            <p className="comp-note">
              Quando OUTRO jogador desafia a sua equipe, a partida{" "}
              <b>não mexe nos seus pontos</b> — você só pontua nas batalhas que
              você mesmo inicia.
            </p>
          </div>

          {/* ---- histórico ---- */}
          {comp.history.length > 0 && (
            <div className="intro-block">
              <div className="intro-eyebrow">SUAS ÚLTIMAS PARTIDAS</div>
              <div className="hist">
                {comp.history.slice(0, 10).map((h, i) => (
                  <div className="hist-row" key={i}>
                    <span className={"hist-res " + (h.win ? "gold" : "red")}>
                      {h.win ? "VITÓRIA" : "DERROTA"}
                    </span>
                    <span className="hist-opp">vs {h.opponentName}</span>
                    <span className="hist-score">
                      {h.score[0]}–{h.score[1]}
                    </span>
                    <Delta value={h.delta} />
                    <span className="hist-date mut">{fmtDate(h.at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
