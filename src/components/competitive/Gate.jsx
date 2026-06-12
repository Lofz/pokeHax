/**
 * Gate.jsx — a porta do modo competitivo: criar conta ou entrar.
 *
 * Sem cadastro: criar = ganhar um CÓDIGO + escolher um PIN. A tela
 * pós-criação martela o único ponto vital deste sistema — GUARDE O LINK,
 * porque não existe recuperação de conta.
 */
import { useState } from "react";
import { createAccount, login, accountLink, validPin } from "../../services/account";

function CopyLink({ code }) {
  const [copied, setCopied] = useState(false);
  const link = accountLink(code);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bloqueado — o jogador ainda pode selecionar o texto */
    }
  }
  return (
    <div className="link-box">
      <code className="link-url">{link}</code>
      <button type="button" className="btn small" onClick={copy}>
        {copied ? "✓ COPIADO" : "COPIAR LINK"}
      </button>
    </div>
  );
}

export function Gate({ prefillCode, onEnter, onBack }) {
  const [tab, setTab] = useState(prefillCode ? "login" : "create");
  const [code, setCode] = useState(prefillCode ?? "");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null); // conta recém-criada

  async function doCreate(e) {
    e.preventDefault();
    setErr(null);
    if (!validPin(pin)) return setErr("O PIN deve ter de 4 a 6 dígitos.");
    if (pin !== pin2) return setErr("Os dois PINs não conferem.");
    setBusy(true);
    try {
      setCreated(await createAccount(name, pin));
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  async function doLogin(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      onEnter(await login(code, pin));
    } catch (ex) {
      setErr(ex.message);
      setBusy(false);
    }
  }

  /* --- pós-criação: a tela do "guarde isto" --- */
  if (created) {
    return (
      <section className="gate">
        <div className="intro-block">
          <div className="intro-eyebrow">CONTA CRIADA · {created.name}</div>
          <p className="gate-warn">
            ⚠ <b>GUARDE ESTE LINK.</b> Ele é a ÚNICA forma de voltar à sua conta
            — não há e-mail nem recuperação de PIN. Salve nos favoritos, mande
            para você mesmo, anote na Pokédex.
          </p>
          <CopyLink code={created.code} />
          <p className="gate-hint">
            Seu código: <b className="gold">{created.code}</b> · Para entrar:
            abra o link e digite seu PIN.
          </p>
          <div className="btn-row">
            <button className="btn btn-gold" onClick={() => onEnter(created)}>
              ENTRAR NA LIGA ▸
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="gate">
      <div className="intro-block">
        <div className="gate-tabs">
          <div className="seg">
            <button
              className={"seg-btn" + (tab === "create" ? " on" : "")}
              onClick={() => setTab("create")}
            >
              Criar conta
            </button>
            <button
              className={"seg-btn" + (tab === "login" ? " on" : "")}
              onClick={() => setTab("login")}
            >
              Já tenho código
            </button>
          </div>
        </div>

        {tab === "create" ? (
          <form onSubmit={doCreate} className="gate-form">
            <p className="gate-hint">
              Sem cadastro: você ganha um <b>código</b> e escolhe um <b>PIN</b>.
              O código + PIN são sua conta inteira.
            </p>
            <label className="pix-label" htmlFor="g-name">
              NOME DE TREINADOR (OPCIONAL)
            </label>
            <input
              id="g-name"
              className="pix-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={18}
              placeholder="EX: CAMPEÃO RED"
            />
            <label className="pix-label" htmlFor="g-pin">
              PIN (4 A 6 DÍGITOS)
            </label>
            <input
              id="g-pin"
              className="pix-input"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
            />
            <label className="pix-label" htmlFor="g-pin2">
              REPITA O PIN
            </label>
            <input
              id="g-pin2"
              className="pix-input"
              value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
            />
            {err && <p className="gate-err">{err}</p>}
            <div className="btn-row">
              <button className="btn btn-gold" type="submit" disabled={busy}>
                GERAR MINHA CONTA ▸
              </button>
              <button className="btn btn-ghost" type="button" onClick={onBack}>
                ◂ VOLTAR
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={doLogin} className="gate-form">
            <p className="gate-hint">
              Use o código do seu link <code>?conta=CODIGO</code> e o PIN que
              você escolheu.
            </p>
            <label className="pix-label" htmlFor="g-code">
              CÓDIGO DA CONTA
            </label>
            <input
              id="g-code"
              className="pix-input mono"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              placeholder="EX: K7M2Q9XW"
              autoComplete="username"
            />
            <label className="pix-label" htmlFor="g-pin-l">
              PIN
            </label>
            <input
              id="g-pin-l"
              className="pix-input"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              inputMode="numeric"
              type="password"
              autoComplete="current-password"
            />
            {err && <p className="gate-err">{err}</p>}
            <div className="btn-row">
              <button className="btn btn-gold" type="submit" disabled={busy}>
                ENTRAR ▸
              </button>
              <button className="btn btn-ghost" type="button" onClick={onBack}>
                ◂ VOLTAR
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
