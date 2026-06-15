import { useEffect, useState } from "react";
import { SOCIAL, LINKS_ACTIVE, CONTACT_EMAIL, PRIVACY_UPDATED } from "../data/links";
import { getMon } from "../data/dex";
import { Sprite } from "./bits";
import { track } from "../analytics/track";
import { useT, Rich } from "../i18n";

/** Link de doação configurado (ou null se a URL estiver vazia em links.js). */
const DONATE = SOCIAL.find((s) => s.id === "donate" && s.url) || null;

/**
 * About.jsx — rodapé do site + modal "Sobre / Política de Privacidade".
 *
 * Estilo do jogo (GBC / pixel). Sem roteador: o modal é uma sobreposição
 * controlada por estado local. `SiteFooter` é tudo que o App renderiza; o
 * modal mora aqui dentro para manter o App.jsx enxuto.
 *
 * Ícones de marca = SVG monocromático (currentColor), NÃO emoji — emoji
 * renderizam inconsistente no Windows (ver convenções do projeto).
 */

/** Ícones de marca, 1em, herdam a cor do texto. */
function Icon({ id }) {
  const p = {
    x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    tiktok:
      "M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.1v12.66a2.59 2.59 0 1 1-1.84-2.48V9.99a5.69 5.69 0 1 0 4.94 5.64V9.01a7.35 7.35 0 0 0 4.3 1.38V7.29a4.28 4.28 0 0 1-2.2-1.47z",
    discord:
      "M20.32 4.57A19.8 19.8 0 0 0 15.43 3l-.24.45a16.6 16.6 0 0 1 4.32 1.4 17.5 17.5 0 0 0-13-.01 16.6 16.6 0 0 1 4.34-1.4L10.6 3a19.7 19.7 0 0 0-4.9 1.57C2.6 9.2 1.75 13.7 2.18 18.14a19.9 19.9 0 0 0 6.04 3.06l.49-.69c-.94-.36-1.84-.8-2.68-1.32l.6-.43a14.2 14.2 0 0 0 12.06 0l.6.43c-.85.52-1.75.97-2.69 1.33l.49.68a19.8 19.8 0 0 0 6.04-3.06c.5-5.12-.85-9.58-3.4-13.57zM9.27 15.4c-1.18 0-2.15-1.08-2.15-2.4s.95-2.41 2.15-2.41 2.17 1.09 2.15 2.41c0 1.32-.96 2.4-2.15 2.4zm5.46 0c-1.18 0-2.15-1.08-2.15-2.4s.95-2.41 2.15-2.41 2.17 1.09 2.15 2.41c0 1.32-.95 2.4-2.15 2.4z",
    donate:
      "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z",
  };
  return (
    <svg
      className="soc-svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={p[id]} />
    </svg>
  );
}

/**
 * Lista de redes/apoio, reaproveitada no rodapé e no modal. Com `LINKS_ACTIVE`
 * ligado, cada item é um link real; desligado, vira `<span>` não-clicável (só
 * imagem) — pra subir sem URLs ainda, sem 404.
 */
function SocialRow({ where }) {
  const { t } = useT();
  const items = SOCIAL.filter((s) => s.url);
  if (!items.length) return null;
  return (
    <div className="soc-row">
      {items.map((s) => {
        const cls =
          "soc-link" +
          (s.id === "donate" ? " soc-donate" : "") +
          (LINKS_ACTIVE ? "" : " soc-static");
        // Marcas (X/TikTok/Discord) ficam com o label de links.js (nomes próprios);
        // só o "apoiar" é traduzido.
        const label = s.id === "donate" ? t("about.donateAria") : s.label;
        const inner = (
          <>
            <Icon id={s.id} />
            {s.id === "donate" && <span className="soc-donate-txt">{t("about.support")}</span>}
          </>
        );
        return LINKS_ACTIVE ? (
          <a
            key={s.id}
            className={cls}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            onClick={() => track("outbound_click", { to: s.id, where })}
          >
            {inner}
          </a>
        ) : (
          <span key={s.id} className={cls} role="img" aria-label={label} title={label}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}

/** Conteúdo "Sobre o jogo". */
function AboutBody() {
  const { t } = useT();
  return (
    <div className="modal-body">
      <p><Rich text={t("about.body.p1")} /></p>
      <p><Rich text={t("about.body.p2")} /></p>
      <p className="modal-disclaimer"><Rich text={t("about.body.disclaimer")} /></p>

      <div className="modal-sec-h">{t("about.body.linksTitle")}</div>
      <p className="modal-soft">{t("about.body.linksIntro")}</p>
      <SocialRow where="modal" />
      {CONTACT_EMAIL && (
        <p className="modal-soft">
          {t("about.body.contact")}{" "}
          <a className="modal-a" href={"mailto:" + CONTACT_EMAIL}>
            {CONTACT_EMAIL}
          </a>
        </p>
      )}
    </div>
  );
}

/** Conteúdo "Política de Privacidade". */
function PrivacyBody() {
  const { t, lang } = useT();
  const updated = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(PRIVACY_UPDATED + "T00:00:00"));
  return (
    <div className="modal-body">
      <p className="modal-soft">{t("about.privacy.updated", { date: updated })}</p>
      <p><Rich text={t("about.privacy.p1")} /></p>

      <div className="modal-sec-h">{t("about.privacy.metricsTitle")}</div>
      <p><Rich text={t("about.privacy.metrics")} /></p>

      <div className="modal-sec-h">{t("about.privacy.ageTitle")}</div>
      <p><Rich text={t("about.privacy.age")} /></p>

      <div className="modal-sec-h">{t("about.privacy.changesTitle")}</div>
      <p><Rich text={t("about.privacy.changes")} /></p>

      {CONTACT_EMAIL && (
        <>
          <div className="modal-sec-h">{t("about.privacy.contactTitle")}</div>
          <p>
            {t("about.privacy.contactQ")}{" "}
            <a className="modal-a" href={"mailto:" + CONTACT_EMAIL}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </>
      )}
    </div>
  );
}

/** Modal sobreposto, com abas "Sobre" e "Privacidade". */
function AboutModal({ tab, setTab, onClose }) {
  const { t } = useT();
  // fecha no ESC; trava o scroll do fundo enquanto aberto
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="modal-scrim" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={t("about.modal.title")}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-x" onClick={onClose} aria-label={t("about.modal.close")}>
          ✕
        </button>
        <div className="modal-tabs">
          <button
            className={"modal-tab" + (tab === "about" ? " on" : "")}
            onClick={() => setTab("about")}
            aria-pressed={tab === "about"}
          >
            {t("about.modal.tabAbout")}
          </button>
          <button
            className={"modal-tab" + (tab === "privacy" ? " on" : "")}
            onClick={() => setTab("privacy")}
            aria-pressed={tab === "privacy"}
          >
            {t("about.modal.tabPrivacy")}
          </button>
        </div>
        {tab === "about" ? <AboutBody /> : <PrivacyBody />}
      </div>
    </div>
  );
}

/**
 * Pedacinho de apoio no canto do cabeçalho: Cubone (easter egg) espiando com um
 * balãozinho de diálogo e uma pílula "APOIAR". Compacto e discreto — ocupa o
 * espaço vazio à direita do título. O elemento todo é o link de doação. Só
 * aparece se houver URL de doação em links.js (senão é no-op).
 */
const CUBONE = getMon(104);

export function SupportBanner() {
  const { t } = useT();
  if (!DONATE) return null;
  const inner = (
    <>
      <span className="support-mon">
        <i className="coin coin-a" aria-hidden="true" />
        <i className="coin coin-b" aria-hidden="true" />
        <Sprite src={CUBONE.image.sprite} alt="Cubone" size={46} className="support-spr" />
      </span>
      <span className="support-bubble">
        <b>{t("about.banner.help")}</b>
        <span className="support-cta">{t("about.banner.cta")}</span>
      </span>
    </>
  );
  // LINKS_ACTIVE desligado → mostra o chip como imagem (sem <a>, sem clique).
  return LINKS_ACTIVE ? (
    <a
      className="support"
      href={DONATE.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("about.banner.ariaActive")}
      onClick={() => track("outbound_click", { to: "donate", where: "banner" })}
    >
      {inner}
    </a>
  ) : (
    <div className="support support-static" role="img" aria-label={t("about.banner.aria")}>
      {inner}
    </div>
  );
}

/** Rodapé do site + o modal que ele abre. É só isto que o App renderiza. */
export function SiteFooter() {
  const { t } = useT();
  const [open, setOpen] = useState(null); // null | "about" | "privacy"
  const show = (tab) => {
    track("about_opened", { section: tab });
    setOpen(tab);
  };
  return (
    <footer className="foot">
      <div className="foot-links">
        <button className="foot-btn" onClick={() => show("about")}>
          {t("about.footer.about")}
        </button>
        <span className="foot-dot">·</span>
        <button className="foot-btn" onClick={() => show("privacy")}>
          {t("about.footer.privacy")}
        </button>
      </div>
      <SocialRow where="footer" />
      <div className="foot-fine">{t("about.footer.fine")}</div>
      <div className="foot-credit">{t("about.footer.credit")}</div>
      {open && (
        <AboutModal tab={open} setTab={setOpen} onClose={() => setOpen(null)} />
      )}
    </footer>
  );
}
