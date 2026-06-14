import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Sprite } from "./bits";
import { track } from "../analytics/track";

/** Confete fixo (posições determinísticas → o print sai sempre igual). */
const CONFETTI = [
  [4, 16, "#e85145", 18], [13, 5, "#f2b63d", -20], [23, 24, "#58d854", 34],
  [34, 7, "#6890f0", -12], [45, 18, "#f85888", 26], [55, 4, "#f2b63d", -30],
  [64, 22, "#7038f8", 14], [74, 8, "#58d854", -24], [84, 17, "#e85145", 30],
  [92, 6, "#6890f0", -14], [16, 44, "#f85888", 22], [31, 56, "#f2b63d", -18],
  [69, 54, "#58d854", 28], [86, 46, "#7038f8", -22], [9, 64, "#6890f0", 16],
  [90, 64, "#e85145", -28],
];

/**
 * Hall da Fama — card pensado para virar imagem compartilhável. A região
 * capturada é `.hof-card` (via ref); os botões ficam fora dela, então não
 * entram no print. O "Compartilhar" gera um PNG e usa o Web Share API
 * (celular) ou cai num download (desktop).
 */
export function ChampionBox({ team, results, onReset, seed, lens }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const stats = team.map((m) => ({
    ...m,
    ko: results.reduce((s, r) => s + (r.koBy[m.name] || 0), 0),
  }));
  const totalKO = stats.reduce((s, m) => s + m.ko, 0);
  const losses = results.reduce((s, r) => s + r.score[1], 0);
  const mvpIdx = stats.reduce((best, m, i, arr) => (m.ko > arr[best].ko ? i : best), 0);

  async function handleShare() {
    if (!cardRef.current || busy) return;
    track("share_clicked", { mode: lens, seed });
    setBusy(true);
    setMsg("");
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#16122b",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `pokehax-campeao-${seed}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "PokéHax — Campeão de Johto",
          text: "Apliquei o 6 a 0 na Elite dos 4! 🏆",
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = file.name;
        a.click();
        setMsg("Imagem salva! É só postar.");
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error(e);
        setMsg("Não consegui gerar a imagem — tente um print da tela.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hof-wrap">
      <div className="hof-card" ref={cardRef}>
        <span className="hof-eyebrow">
          CAMPEÃO DE JOHTO{losses === 0 ? " · VARRIDA PERFEITA" : ` · ${totalKO} K.O.`}
        </span>

        <div className="hof-stage">
          {CONFETTI.map(([l, t, c, r], i) => (
            <i
              key={i}
              className="confetti"
              style={{ left: `${l}%`, top: `${t}%`, background: c, transform: `rotate(${r}deg)` }}
            />
          ))}
          <div className="hof-band">
            {stats.map((m, i) => (
              <div className="hof-fame-mon" key={m.id + "-" + i}>
                {i === mvpIdx && m.ko > 0 && <span className="hof-fame-mvp">★</span>}
                <Sprite src={m.image.thumbnail} alt={m.name} size={84} className="hof-art" />
                <span className="hof-fame-name">{m.name.toUpperCase()}</span>
                <span className="hof-fame-ko">{m.ko} K.O.</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hof-ribbon">BEM-VINDO AO HALL DA FAMA!</div>

        <div className="hof-strip">
          <span className="hof-strip-item">
            <b>SEED</b>
            {seed}
          </span>
          <span className="hof-strip-item">
            <b>MODO</b>
            {lens === "rocket" ? "ROCKET" : "OAK"}
          </span>
          <span className="hof-brand">PokéHax</span>
        </div>
      </div>

      <div className="hof-actions">
        <button className="btn btn-gold" onClick={handleShare} disabled={busy}>
          {busy ? "GERANDO…" : "COMPARTILHAR ▾"}
        </button>
        <button className="btn btn-ghost" onClick={onReset}>
          NOVA JORNADA ▸
        </button>
      </div>
      {msg && <div className="hof-msg">{msg}</div>}
    </div>
  );
}

export function DefeatBox({ trainer, result, stage, onReset }) {
  return (
    <div className="finale lose-box">
      <div className="finale-eyebrow">FIM DE JORNADA</div>
      <div className="finale-title red">{trainer.name} APAGOU TODAS AS LUZES</div>
      <p className="finale-sub">
        Seu time caiu por {result.score[1]} a {result.score[0]} no confronto {stage} de 5.
      </p>
      <button className="btn btn-gold" onClick={onReset}>
        TENTAR DE NOVO ▸
      </button>
    </div>
  );
}
