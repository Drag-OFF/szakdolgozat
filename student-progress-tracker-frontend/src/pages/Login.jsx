/**
 * Bejelentkezési oldal komponens.
 * Lehetővé teszi a felhasználók számára, hogy e-mail vagy Neptun kód és jelszó megadásával bejelentkezzenek.
 * Sikeres bejelentkezéskor JWT tokent tárol a localStorage-ben, és átirányít a főoldalra.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../styles/Auth.css";
import "../styles/GlobalBackground.css";

/**
 * Login komponens.
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
    const data = uid.includes("@") ? { email: uid, password } : { uid, password };
    try {
      const resp = await fetch("http://enaploproject.ddns.net:8000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await resp.json();
      if (resp.ok && result.access_token) {
        localStorage.setItem("access_token", result.access_token);
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
      <div className="auth-image">
        <img src="https://u-szeged.hu/site/upload/2020/12/felveteli_weboldal_nyito_1520x864_0000s_0000_ttik2.jpg" alt="SZTE" />
        <h2>Szegedi Tudományegyetem</h2>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h3>Hallgatói bejelentkezés</h3>
        <input type="text" placeholder="Azonosító (Neptun vagy e-mail)" value={uid} onChange={e => setUid(e.target.value)} required />
        <input type="password" placeholder="Jelszó" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Bejelentkezés</button>
        <div className="auth-msg">{msg}</div>
        <div className="auth-link">
          Nincs fiókod? <Link to="/register">Regisztráció</Link>
        </div>
      </form>
    </div>
  );
}