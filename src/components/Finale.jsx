import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Sprite } from "./bits";
import { track } from "../analytics/track";
import { useT } from "../i18n";

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
export function ChampionBox({ team, results, onReset, seed, lens, region }) {
  const { t } = useT();
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
      // SEM cacheBust: ele re-baixava todas as imagens (ignorando o cache) na
      // hora de gerar — no 5G isso era um burst que tomava 403 e quebrava o
      // share. Com o cache (preload na run) + crossOrigin, reusa o que já tem.
      // imagePlaceholder: se ainda assim faltar uma imagem, o PNG sai mesmo
      // assim (não lança).
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#16122b",
        imagePlaceholder:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], t("finale.shareFile", { seed }) + ".png", {
        type: "image/png",
      });
      const save = () => {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = file.name;
        a.click();
        setMsg(t("finale.shareSaved"));
      };
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: t("finale.shareTitleOf", { region }),
            text: t("finale.shareText"),
          });
        } catch (err) {
          if (err?.name === "AbortError") return; // usuário cancelou
          save(); // share falhou (ex.: iOS perdeu o gesto do toque) → baixa o PNG
        }
      } else {
        save();
      }
    } catch (e) {
      console.error(e); // toPng/blob falhou
      setMsg(t("finale.shareError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hof-wrap">
      <div className="hof-card" ref={cardRef}>
        <span className="hof-eyebrow">
          {t("finale.championOf", { region })}
          {losses === 0 ? t("finale.perfect") : t("finale.koSummary", { n: totalKO })}
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
                <Sprite
                  src={m.image.thumbnail}
                  fallbackSrc={m.image.sprite}
                  crossOrigin="anonymous"
                  alt={m.name}
                  size={84}
                  className="hof-art"
                />
                <span className="hof-fame-name">{m.name.toUpperCase()}</span>
                <span className="hof-fame-ko">{t("finale.monKO", { n: m.ko })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hof-ribbon">{t("finale.ribbon")}</div>

        <div className="hof-strip">
          <span className="hof-strip-item">
            <b>{t("finale.seed")}</b>
            {seed}
          </span>
          <span className="hof-strip-item">
            <b>{t("finale.mode")}</b>
            {lens === "rocket" ? t("finale.modeRocket") : t("finale.modeOak")}
          </span>
          <span className="hof-brand">PokéHax · Lofz</span>
        </div>
      </div>

      <div className="hof-actions">
        <button className="btn btn-gold" onClick={handleShare} disabled={busy}>
          {busy ? t("finale.shareBusy") : t("finale.shareBtn")}
        </button>
        <button className="btn btn-ghost" onClick={onReset}>
          {t("finale.shareNewJourney")}
        </button>
      </div>
      {msg && <div className="hof-msg">{msg}</div>}
    </div>
  );
}

export function DefeatBox({ trainer, result, stage, onReset }) {
  const { t } = useT();
  return (
    <div className="finale lose-box">
      <div className="finale-eyebrow">{t("finale.defeatEyebrow")}</div>
      <div className="finale-title red">{t("finale.defeatTitle", { name: trainer.name })}</div>
      <p className="finale-sub">
        {t("finale.defeatSub", { loss: result.score[1], win: result.score[0], stage })}
      </p>
      <button className="btn btn-gold" onClick={onReset}>
        {t("finale.defeatRetry")}
      </button>
    </div>
  );
}
