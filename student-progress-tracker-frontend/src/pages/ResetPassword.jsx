import { useState } from "react";
import { authFetch, isValidEmail } from "../utils";
import AuthInput from "../components/AuthInput";

/**
 * ResendVerify komponens.
 * E-mail cím bekérése, validálása, majd újraküldési kérés a backendnek.
 * @returns {JSX.Element} Az oldal tartalma.
 */
export default function ResendVerify() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!isValidEmail(email)) {
      setMsg("Érvényes e-mail címet adj meg!");
      return;
    }
    try {
      const resp = await authFetch("http://enaploproject.ddns.net:8000/api/users/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!resp) return;
      const result = await resp.json();
      setMsg(result.detail || result.message || "Ismeretlen hiba történt.");
      setSent(result.success);
    } catch (err) {
      setMsg("Hiba történt a kérés során.");
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-image">
        <img src="https://u-szeged.hu/site/upload/2020/12/felveteli_weboldal_nyito_1520x864_0000s_0000_ttik2.jpg" alt="SZTE" />
        <h2>Szegedi Tudományegyetem</h2>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h3>Megerősítő e-mail újraküldése</h3>
        <AuthInput
          label="E-mail cím"
          id="resend-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={msg && !isValidEmail(email) ? "Érvényes e-mail címet adj meg!" : ""}
          required
        />
        <button type="submit" disabled={sent}>Küldés</button>
        <div className="auth-msg">{msg}</div>
      </form>
    </div>
  );
}