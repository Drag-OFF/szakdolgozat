/**
 * Regisztrációs oldal komponens.
 * Lehetővé teszi a felhasználók számára, hogy új fiókot hozzanak létre.
 * Minden mezőt validál, hibás mezőket pirossal keretez, és csak helyes adatok esetén küldi el a regisztrációs kérést a backendnek.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Auth.css";
import "../styles/GlobalBackground.css";

/**
 * Validálja a regisztrációs űrlap mezőit.
 * @param {Object} form - Az űrlap aktuális állapota.
 * @returns {Object} Hibák objektuma, ahol a kulcs a mező neve, az érték a hibaüzenet.
 */
function validate(form) {
  const errors = {};

  // Neptun kód: 6 karakter, betű/szám
  if (!form.uid || !/^[A-Za-z0-9]{6}$/.test(form.uid)) {
    errors.uid = "A Neptun kód 6 karakteres, csak betű és szám lehet.";
  }

  // E-mail: @ és .
  if (!form.email || !form.email.includes("@") || !form.email.includes(".")) {
    errors.email = "Érvényes e-mail címet adj meg!";
  }

  // Jelszó: min. 8 karakter
  if (!form.password || form.password.length < 8) {
    errors.password = "A jelszónak legalább 8 karakter hosszúnak kell lennie.";
  }

  // Név: nem lehet üres
  if (!form.name || form.name.length < 3) {
    errors.name = "Add meg a teljes neved!";
  }

  // Születési dátum: nem lehet üres
  if (!form.birth_date) {
    errors.birth_date = "Add meg a születési dátumodat!";
  }

  // Személyi igazolvány szám: nem lehet üres
  if (!form.id_card_number) {
    errors.id_card_number = "Add meg a személyi igazolvány számodat!";
  }

  // Lakcímkártya szám: nem lehet üres
  if (!form.address_card_number) {
    errors.address_card_number = "Add meg a lakcímkártya számodat!";
  }

  // Anyja neve: nem lehet üres
  if (!form.mothers_name) {
    errors.mothers_name = "Add meg az anyád nevét!";
  }

  // Szak: nem lehet üres
  if (!form.major) {
    errors.major = "Válassz szakot!";
  }

  return errors;
}

export default function Register() {
  const [form, setForm] = useState({
    uid: "", email: "", password: "", name: "", birth_date: "",
    id_card_number: "", address_card_number: "", mothers_name: "", major: "Gazdaságinformatikus"
  });
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(errs => ({ ...errs, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setMsg("Kérlek, javítsd a pirossal jelölt mezőket!");
      return;
    }
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

  const errorStyle = { border: "2px solid #e53935", background: "#fff6f6" };

  return (
    <div className="auth-container">
      <div className="auth-image">
        <img src="https://u-szeged.hu/site/upload/2020/12/felveteli_weboldal_nyito_1520x864_0000s_0000_ttik2.jpg" alt="SZTE" />
        <h2>Szegedi Tudományegyetem</h2>
      </div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h3>Regisztráció</h3>
        <label htmlFor="register-uid">Neptun kód</label>
        <input id="register-uid" type="text" name="uid" placeholder="Neptun kód" value={form.uid} onChange={handleChange} required style={errors.uid ? errorStyle : {}} />
        {errors.uid && <div className="auth-msg" style={{color:"#e53935"}}>{errors.uid}</div>}

        <label htmlFor="register-email">E-mail</label>
        <input id="register-email" type="email" name="email" placeholder="E-mail" value={form.email} onChange={handleChange} required style={errors.email ? errorStyle : {}} />
        {errors.email && <div className="auth-msg" style={{color:"#e53935"}}>{errors.email}</div>}

        <label htmlFor="register-password">Jelszó</label>
        <input id="register-password" type="password" name="password" placeholder="Jelszó" value={form.password} onChange={handleChange} required style={errors.password ? errorStyle : {}} />
        {errors.password && <div className="auth-msg" style={{color:"#e53935"}}>{errors.password}</div>}

        <label htmlFor="register-name">Teljes név</label>
        <input id="register-name" type="text" name="name" placeholder="Teljes név" value={form.name} onChange={handleChange} required style={errors.name ? errorStyle : {}} />
        {errors.name && <div className="auth-msg" style={{color:"#e53935"}}>{errors.name}</div>}

        <label htmlFor="register-birth_date">Születési dátum</label>
        <input id="register-birth_date" type="date" name="birth_date" placeholder="Születési dátum" value={form.birth_date} onChange={handleChange} required style={errors.birth_date ? errorStyle : {}} />
        {errors.birth_date && <div className="auth-msg" style={{color:"#e53935"}}>{errors.birth_date}</div>}

        <label htmlFor="register-id_card_number">Személyi igazolvány szám</label>
        <input id="register-id_card_number" type="text" name="id_card_number" placeholder="Személyi igazolvány szám" value={form.id_card_number} onChange={handleChange} required style={errors.id_card_number ? errorStyle : {}} />
        {errors.id_card_number && <div className="auth-msg" style={{color:"#e53935"}}>{errors.id_card_number}</div>}

        <label htmlFor="register-address_card_number">Lakcímkártya szám</label>
        <input id="register-address_card_number" type="text" name="address_card_number" placeholder="Lakcímkártya szám" value={form.address_card_number} onChange={handleChange} required style={errors.address_card_number ? errorStyle : {}} />
        {errors.address_card_number && <div className="auth-msg" style={{color:"#e53935"}}>{errors.address_card_number}</div>}

        <label htmlFor="register-mothers_name">Anyja neve</label>
        <input id="register-mothers_name" type="text" name="mothers_name" placeholder="Anyja neve" value={form.mothers_name} onChange={handleChange} required style={errors.mothers_name ? errorStyle : {}} />
        {errors.mothers_name && <div className="auth-msg" style={{color:"#e53935"}}>{errors.mothers_name}</div>}

        <label htmlFor="register-major">Szak</label>
        <select id="register-major" name="major" value={form.major} onChange={handleChange} required>
          <option value="Gazdaságinformatikus">Gazdaságinformatikus</option>
          <option value="Mérnökinformatikus">Mérnökinformatikus</option>
          <option value="Programtervező informatikus">Programtervező informatikus</option>
          <option value="Villamosmérnök">Villamosmérnök</option>
          <option value="Üzemmérnök-informatikus">Üzemmérnök-informatikus</option>
        </select>
        {errors.major && <div className="auth-msg" style={{color:"#e53935"}}>{errors.major}</div>}

        <button type="submit">Regisztráció</button>
        <div className="auth-msg">{msg}</div>
        <div className="auth-link">
          Van már fiókod? <Link to="/login">Jelentkezz be!</Link>
        </div>
      </form>
    </div>
  );
}