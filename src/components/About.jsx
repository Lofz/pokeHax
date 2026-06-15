import { useEffect, useState } from "react";
import { SOCIAL, LINKS_ACTIVE, CONTACT_EMAIL, PRIVACY_UPDATED } from "../data/links";
import { getMon } from "../data/dex";
import { Sprite } from "./bits";
import { track } from "../analytics/track";

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
  const items = SOCIAL.filter((s) => s.url);
  if (!items.length) return null;
  return (
    <div className="soc-row">
      {items.map((s) => {
        const cls =
          "soc-link" +
          (s.id === "donate" ? " soc-donate" : "") +
          (LINKS_ACTIVE ? "" : " soc-static");
        const inner = (
          <>
            <Icon id={s.id} />
            {s.id === "donate" && <span className="soc-donate-txt">APOIAR</span>}
          </>
        );
        return LINKS_ACTIVE ? (
          <a
            key={s.id}
            className={cls}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            title={s.label}
            onClick={() => track("outbound_click", { to: s.id, where })}
          >
            {inner}
          </a>
        ) : (
          <span key={s.id} className={cls} role="img" aria-label={s.label} title={s.label}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}

/** Conteúdo "Sobre o jogo". */
function AboutBody() {
  return (
    <div className="modal-body">
      <p>
        <b>PokéHax</b> é um jogo de fã, <b>gratuito e sem fins lucrativos</b>,
        feito de forma independente por fãs da franquia. Você dá um draft num
        time de 6 Pokémon de Johto e Kanto e encara a Elite dos 4 + o Campeão.
        A pergunta é uma só: seu time aplica o <b>6 a 0</b>?
      </p>
      <p>
        Tudo roda no seu navegador — é um site estático, sem cadastro e sem
        login. Feito por <b>Lofz</b>, por amor à franquia, nas horas vagas.
      </p>
      <p className="modal-disclaimer">
        Projeto não-oficial. <b>Não é afiliado, patrocinado nem endossado</b> pela
        Nintendo, Game Freak ou The Pokémon Company. "Pokémon", os nomes das
        criaturas e demais marcas pertencem aos seus respectivos donos. Sprites e
        dados são usados apenas para fins de homenagem e fãs.
      </p>

      <div className="modal-sec-h">REDES E APOIO</div>
      <p className="modal-soft">
        Acompanhe, mande feedback ou ajude o projeto a continuar de pé:
      </p>
      <SocialRow where="modal" />
      {CONTACT_EMAIL && (
        <p className="modal-soft">
          Contato:{" "}
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
  return (
    <div className="modal-body">
      <p className="modal-soft">Última atualização: {PRIVACY_UPDATED}.</p>
      <p>
        O PokéHax é um site simples, sem cadastro e sem login. <b>Não coletamos
        dados pessoais</b> como nome, e-mail ou telefone. Seu time e suas
        escolhas ficam só no seu navegador.
      </p>

      <div className="modal-sec-h">MÉTRICAS DE USO</div>
      <p>
        Para entender como o jogo é usado e melhorá-lo, coletamos{" "}
        <b>estatísticas anônimas</b> (como qual modo foi escolhido e se a
        campanha foi concluída). Elas <b>não identificam você</b>. Para isso, são
        usados cookies — que você pode bloquear no navegador sem prejudicar o
        jogo.
      </p>

      <div className="modal-sec-h">IDADE RECOMENDADA</div>
      <p>
        Recomendamos o jogo para <b>maiores de 13 anos</b>. Não coletamos
        intencionalmente dados de crianças.
      </p>

      <div className="modal-sec-h">MUDANÇAS</div>
      <p>
        Esta política pode ser atualizada. Quando isso acontecer, a data de
        "última atualização" no topo será alterada.
      </p>

      {CONTACT_EMAIL && (
        <>
          <div className="modal-sec-h">CONTATO</div>
          <p>
            Dúvidas sobre privacidade?{" "}
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
        aria-label="Sobre o PokéHax"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-x" onClick={onClose} aria-label="Fechar">
          ✕
        </button>
        <div className="modal-tabs">
          <button
            className={"modal-tab" + (tab === "about" ? " on" : "")}
            onClick={() => setTab("about")}
            aria-pressed={tab === "about"}
          >
            SOBRE
          </button>
          <button
            className={"modal-tab" + (tab === "privacy" ? " on" : "")}
            onClick={() => setTab("privacy")}
            aria-pressed={tab === "privacy"}
          >
            PRIVACIDADE
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
  if (!DONATE) return null;
  const inner = (
    <>
      <span className="support-mon">
        <i className="coin coin-a" aria-hidden="true" />
        <i className="coin coin-b" aria-hidden="true" />
        <Sprite src={CUBONE.image.sprite} alt="Cubone" size={46} className="support-spr" />
      </span>
      <span className="support-bubble">
        <b>me ajuda?</b>
        <span className="support-cta">APOIAR ▸</span>
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
      aria-label="Apoie o PokéHax — feito por um fã só"
      onClick={() => track("outbound_click", { to: "donate", where: "banner" })}
    >
      {inner}
    </a>
  ) : (
    <div className="support support-static" role="img" aria-label="Apoie o PokéHax">
      {inner}
    </div>
  );
}

/** Rodapé do site + o modal que ele abre. É só isto que o App renderiza. */
export function SiteFooter() {
  const [open, setOpen] = useState(null); // null | "about" | "privacy"
  const show = (tab) => {
    track("about_opened", { section: tab });
    setOpen(tab);
  };
  return (
    <footer className="foot">
      <div className="foot-links">
        <button className="foot-btn" onClick={() => show("about")}>
          Sobre
        </button>
        <span className="foot-dot">·</span>
        <button className="foot-btn" onClick={() => show("privacy")}>
          Política de Privacidade
        </button>
      </div>
      <SocialRow where="footer" />
      <div className="foot-fine">
        Jogo de fã, não-comercial. Não afiliado à Nintendo, Game Freak ou The
        Pokémon Company. Dados e sprites são homenagem dos fãs.
      </div>
      <div className="foot-credit">▸ feito por Lofz</div>
      {open && (
        <AboutModal tab={open} setTab={setOpen} onClose={() => setOpen(null)} />
      )}
    </footer>
  );
}
