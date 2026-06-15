/**
 * i18n caseiro — sem dependências. Um dicionário JSON por idioma e um Context
 * que entrega a função `t(caminho, vars)`. Trocar de idioma re-renderiza tudo e
 * persiste a escolha em localStorage. Determinístico e alinhado ao "frontend
 * puro" do projeto (ver CLAUDE.md). Para adicionar um idioma: criar o JSON,
 * registrar em DICTS e adicionar o botão no seletor (App.jsx).
 */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import pt from "./pt.json";
import en from "./en.json";

const DICTS = { pt, en };
const FALLBACK = "pt"; // idioma-base: cobre chaves faltantes em outros idiomas
const STORAGE_KEY = "pokehax:lang";

const LangContext = createContext(null);

/** Resolve um caminho com pontos ("intro.step1") dentro do dicionário. */
function resolve(dict, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), dict);
}

/** Substitui {placeholders} pelas variáveis. Mantém {x} se faltar a variável. */
function interpolate(str, vars) {
  if (typeof str !== "string" || !vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Idioma inicial: escolha salva > padrão PT (o seletor é manual). */
function readInitial() {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && DICTS[saved]) return saved;
  } catch {
    /* localStorage indisponível (modo privado): cai no padrão */
  }
  return FALLBACK;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readInitial);

  const setLang = useCallback((next) => {
    if (!DICTS[next]) return;
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignora se não der para persistir */
    }
  }, []);

  const t = useCallback(
    (path, vars) => {
      const val = resolve(DICTS[lang], path) ?? resolve(DICTS[FALLBACK], path) ?? path;
      return interpolate(val, vars);
    },
    [lang]
  );

  /* Mantém <html lang>, o <title> e a meta description em sincronia. */
  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
    document.title = t("meta.title");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta.description"));
  }, [lang, t]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useT precisa estar dentro de <LanguageProvider>");
  return ctx;
}

/**
 * Renderiza texto com marcação leve: **negrito** vira <b> e \n vira quebra de
 * linha. Evita ter que fatiar cada frase com negrito em várias chaves de JSON.
 */
export function Rich({ text }) {
  return String(text)
    .split("\n")
    .map((line, li) => (
      <span key={li}>
        {li > 0 && <br />}
        {line.split("**").map((seg, i) => (i % 2 === 1 ? <b key={i}>{seg}</b> : seg))}
      </span>
    ));
}
