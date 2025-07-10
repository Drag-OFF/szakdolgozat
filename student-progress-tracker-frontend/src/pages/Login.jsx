import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../styles/Auth.css";
import "../styles/GlobalBackground.css";
import { authFetch, isValidEmail, isValidNeptun } from "../utils";
import AuthInput from "../components/AuthInput";

/**
 * Bejelentkezési oldal komponens.
 * Lehetővé teszi a felhasználók számára, hogy e-mail vagy Neptun kód és jelszó megadásával bejelentkezzenek.
 * Sikeres bejelentkezéskor JWT tokent tárol a localStorage-ben, és átirányít a főoldalra.
 *
 * @returns {JSX.Element} A bejelentkezési űrlap és kapcsolódó UI elemek.
 */
export default function Login() {
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

    /**
   * Kezeli a bejelentkezési űrlap elküldését.
   * Ellenőrzi a felhasználó adatokat, elküldi a backendnek, és kezeli a választ.
   * Sikeres bejelentkezéskor JWT tokent ment a localStorage-be, majd átirányít a főoldalra.
   * @param {React.FormEvent} e Az űrlap elküldésének eseménye.
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    // Validáció: legyen e-mail vagy neptun
    if (!isValidEmail(uid) && !isValidNeptun(uid)) {
      setMsg("Adj meg érvényes e-mail címet vagy Neptun kódot!");
      return;
    }
    if (!password) {
      setMsg("A jelszó nem lehet üres!");
      return;
    }
    const data = uid.includes("@") ? { email: uid, password } : { uid, password };
    try {
      const resp = await authFetch("http://enaploproject.ddns.net:8000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp) return;
      const result = await resp.json();
      if (resp.ok && result.access_token) {
        localStorage.setItem("access_token", result.access_token);
        localStorage.setItem("user", JSON.stringify(result.user));
        setMsg("Sikeres bejelentkezés!");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setMsg(result.detail || "Hiba");
      }
    } catch (err) {
      setMsg("Hálózati hiba: " + err);
    }
  }

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h3>Hallgatói bejelentkezés</h3>

        <AuthInput
          label="E-mail vagy Neptun kód"
          id="login-uid"
          value={uid}
          onChange={e => setUid(e.target.value)}
        />
        <AuthInput
          label="Jelszó"
          id="login-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button type="submit">Bejelentkezés</button>
        <div className="auth-msg">{msg}</div>
        <div className="auth-link">
          Nincs fiókod? <Link to="/register">Regisztráció</Link>
        </div>
        <div className="auth-link">
          <Link to="/forgot-password">Elfelejtett jelszó?</Link>
        </div>
      </form>
    </div>
  );
}