/**
 * Új jelszó beállító űrlap komponens.
 * Két input mezőt jelenít meg: új jelszó és megerősítés.
 * Realtime validációval ellenőrzi, hogy a jelszó legalább 8 karakter és egyezik a megerősítéssel.
 * Hibás mezőknél piros keret és hibaüzenet jelenik meg.
 * Sikeres beküldés után a submit gomb inaktív lesz.
 *
 * Props:
 * - onSubmit: (password, setMsg) => void - Beküldési függvény, a szülő adja át.
 * - texts: lokalizált szövegek objektuma.
 * - sent: bool, sikeres beküldés után true.
 */
import { useState } from "react";
import AuthInput from "./AuthInput";
import { useLang } from "../context/LangContext";

export default function PasswordResetForm({ onSubmit, texts, sent }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const { lang } = useLang();

  const confirmError =
    confirm && password !== confirm
      ? texts[lang].pwError
      : "";

  function handleFormSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!password || password.length < 8 || password !== confirm) {
      setMsg(texts[lang].pwError);
      return;
    }
    onSubmit(password, setMsg);
  }

  return (
    <form className="auth-form" onSubmit={handleFormSubmit} style={{ margin: "0 auto" }}>
      <h3>{texts[lang].title}</h3>
      <AuthInput
        label={texts[lang].password}
        id="reset-password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <AuthInput
        label={texts[lang].confirm}
        id="reset-confirm"
        type="password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        error={confirmError}
        required
      />
      <button type="submit" disabled={sent}>{texts[lang].btn}</button>
      <div className="auth-msg">{msg}</div>
    </form>
  );
}