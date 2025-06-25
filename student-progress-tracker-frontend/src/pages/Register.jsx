import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Auth.css";
import "../styles/GlobalBackground.css";

export default function Register() {
  const [form, setForm] = useState({
    uid: "", email: "", password: "", name: "", birth_date: "",
    id_card_number: "", address_card_number: "", mothers_name: "", major: "Gazdaságinformatikus"
  });
  const [msg, setMsg] = useState("");

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    try {
      const resp = await fetch("http://enaploproject.ddns.net:8000/api/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await resp.json();
      if (resp.ok) {
        setMsg("Sikeres regisztráció! Nézd meg az e-mail fiókodat a megerősítő levélért.");
      } else if (result.detail) {
        if (Array.isArray(result.detail)) setMsg(result.detail.map(e => e.msg).join("\n"));
        else setMsg(result.detail);
      } else setMsg("Ismeretlen hiba");
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
        <h3>Regisztráció</h3>
        <input type="text" name="uid" placeholder="Neptun kód" value={form.uid} onChange={handleChange} required />
        <input type="email" name="email" placeholder="E-mail" value={form.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Jelszó" value={form.password} onChange={handleChange} required />
        <input type="text" name="name" placeholder="Teljes név" value={form.name} onChange={handleChange} required />
        <input type="date" name="birth_date" placeholder="Születési dátum" value={form.birth_date} onChange={handleChange} required />
        <input type="text" name="id_card_number" placeholder="Személyi igazolvány szám" value={form.id_card_number} onChange={handleChange} required />
        <input type="text" name="address_card_number" placeholder="Lakcímkártya szám" value={form.address_card_number} onChange={handleChange} required />
        <input type="text" name="mothers_name" placeholder="Anyja neve" value={form.mothers_name} onChange={handleChange} required />
        <select name="major" value={form.major} onChange={handleChange} required>
          <option value="Gazdaságinformatikus">Gazdaságinformatikus</option>
          <option value="Mérnökinformatikus">Mérnökinformatikus</option>
          <option value="Programtervező informatikus">Programtervező informatikus</option>
          <option value="Villamosmérnök">Villamosmérnök</option>
          <option value="Üzemmérnök-informatikus">Üzemmérnök-informatikus</option>
        </select>
        <button type="submit">Regisztráció</button>
        <div className="auth-msg">{msg}</div>
        <div className="auth-link">
          Van már fiókod? <Link to="/login">Jelentkezz be!</Link>
        </div>
      </form>
    </div>
    
  );
}