import { useState } from "react";
import { authFetch, isValidEmail } from "../utils";

/**
 * Megerősítő e-mail újraküldése oldal.
 * Lehetővé teszi a felhasználónak, hogy újra elküldje a regisztrációs megerősítő e-mailt.
 *
 * @returns {JSX.Element} Az oldal tartalma.
 */
export default function ResendVerify() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  /**
   * Beküldi az e-mail címet a backendnek, ha az formailag helyes.
   * Siker esetén visszajelzést ad a felhasználónak.
   * @param {React.FormEvent} e - Az űrlap elküldésének eseménye.
   */
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
        <label htmlFor="resend-email">E-mail cím</label>
        <input
          id="resend-email"
          type="email"
          placeholder="E-mail cím"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={msg && !isValidEmail(email) ? { border: "2px solid #e53935", background: "#fff6f6" } : {}}
        />
        <button type="submit" disabled={sent}>Küldés</button>
        <div className="auth-msg">{msg}</div>
      </form>
    </div>
  );
}