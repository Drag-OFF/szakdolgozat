/**
 * Elfelejtett jelszó oldal.
 * Az e-mail cím megadása után lehetőség van jelszó-visszaállító e-mailt kérni.
 * Csak akkor engedi a kérést, ha az e-mail tartalmaz @ jelet.
 */

import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!email.includes("@")) {
      setMsg("Az e-mail címnek tartalmaznia kell @ jelet!");
      return;
    }
    try {
      const resp = await fetch("http://enaploproject.ddns.net:8000/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await resp.json();
      setMsg(result.message || "Ismeretlen hiba történt.");
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
        <h3>Elfelejtett jelszó</h3>
        <label htmlFor="forgot-email">E-mail cím</label>
        <input
          id="forgot-email"
          type="email"
          placeholder="E-mail cím"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={msg && !email.includes("@") ? { border: "2px solid #e53935", background: "#fff6f6" } : {}}
        />
        <button type="submit" disabled={sent}>Küldés</button>
        <div className="auth-msg">{msg}</div>
      </form>
      </div>
  );
}