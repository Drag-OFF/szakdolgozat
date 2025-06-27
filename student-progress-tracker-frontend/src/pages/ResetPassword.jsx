import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Token kinyerése az URL-ből
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  function handleChange(e) {
    if (e.target.name === "password") setPassword(e.target.value);
    else setPassword2(e.target.value);
    setMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      setMsg("A jelszónak legalább 8 karakter hosszúnak kell lennie.");
      return;
    }
    if (password !== password2) {
      setMsg("A két jelszó nem egyezik!");
      return;
    }
    if (!token) {
      setMsg("Hiányzó vagy érvénytelen token.");
      return;
    }
    try {
      const resp = await fetch("http://enaploproject.ddns.net:8000/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await resp.json();
      setMsg(result.message || "Ismeretlen hiba történt.");
      setSuccess(result.success);
      if (result.success) {
        setTimeout(() => navigate("/login"), 3000); 
      }
    } catch (err) {
      setMsg("Hiba történt a kérés során.");
    }
  }

  const errorStyle = password && password2 && password !== password2
    ? { border: "2px solid #e53935", background: "#fff6f6" }
    : {};

  return (
    <div className="auth-container">
      <div className="auth-image">
        <img src="https://u-szeged.hu/site/upload/2020/12/felveteli_weboldal_nyito_1520x864_0000s_0000_ttik2.jpg" alt="SZTE" />
        <h2>Szegedi Tudományegyetem</h2>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h3>Új jelszó megadása</h3>
        <label htmlFor="reset-password">Új jelszó</label>
        <input
          id="reset-password"
          name="password"
          type="password"
          placeholder="Új jelszó"
          value={password}
          onChange={handleChange}
          required
          minLength={8}
        />
        <label htmlFor="reset-password2">Új jelszó ismét</label>
        <input
          id="reset-password2"
          name="password2"
          type="password"
          placeholder="Új jelszó ismét"
          value={password2}
          onChange={handleChange}
          required
          minLength={8}
          style={errorStyle}
        />
        <button
          type="submit"
          disabled={
            !password ||
            !password2 ||
            password !== password2 ||
            password.length < 8 ||
            success
          }
        >
          Jelszó beállítása
        </button>
        <div className="auth-msg" style={{ color: password !== password2 ? "#e53935" : undefined }}>
          {password && password2 && password !== password2
            ? "A két jelszó nem egyezik!"
            : msg}
        </div>
      </form>
    </div>
  );
}