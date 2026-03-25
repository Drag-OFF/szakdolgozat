import { useState } from "react";
import AuthInput from "./AuthInput";
import { isValidEmail } from "../utils";
import { useLang } from "../context/LangContext";

export default function EmailActionForm({
  apiUrl,
  texts
}) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const { lang } = useLang();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!isValidEmail(email)) {
      setMsg(texts[lang].emailError);
      return;
    }
    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!resp) return;
      const result = await resp.json();
      setMsg(result.detail || result.message || texts[lang].unknownError);
      setSent(result.success);
    } catch (err) {
      setMsg(texts[lang].reqError);
    }
  }

  return (
    <div className="auth-container" style={{ justifyContent: "center", alignItems: "center" }}>
      <form className="auth-form" onSubmit={handleSubmit} style={{ margin: "0 auto" }}>
        <h3>{texts[lang].title}</h3>
        <AuthInput
          label={texts[lang].label}
          id="email-action"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={msg && !isValidEmail(email) ? texts[lang].emailError : ""}
          required
        />
        <button type="submit" disabled={sent}>{texts[lang].btn}</button>
        <div className="auth-msg">{msg}</div>
      </form>
    </div>
  );
}