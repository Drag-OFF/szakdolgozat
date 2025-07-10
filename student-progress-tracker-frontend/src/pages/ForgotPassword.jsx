import { useState } from "react";
import { authFetch, isValidEmail } from "../utils";
import AuthInput from "../components/AuthInput";

/**
 * Elfelejtett jelszó oldal.
 * Az e-mail cím megadása után lehetőség van jelszó-visszaállító e-mailt kérni.
 * Csak akkor engedi a kérést, ha az e-mail tartalmaz @ jelet.
 *
 * @returns {JSX.Element} Az elfelejtett jelszó oldal tartalma.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!isValidEmail(email)) {
      setMsg("Az e-mail címnek tartalmaznia kell @ jelet!");
      return;
    }
    try {
      const resp = await authFetch("http://enaploproject.ddns.net:8000/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res) return;
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
        <AuthInput
          label="E-mail cím"
          id="forgot-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={msg && !isValidEmail(email) ? "Az e-mail címnek tartalmaznia kell @ jelet!" : ""}
          required
        />
        <button type="submit" disabled={sent}>Küldés</button>
        <div className="auth-msg">{msg}</div>
      </form>
    </div>
  );
}