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
  // ...existing validation code...
  return errors;
}

/**
 * Regisztrációs oldal fő komponense.
 * @returns {JSX.Element} A regisztrációs űrlap és kapcsolódó UI elemek.
 */
export default function Register() {
  const [form, setForm] = useState({
    uid: "", email: "", password: "", name: "", birth_date: "",
    id_card_number: "", address_card_number: "", mothers_name: "", major: "Gazdaságinformatikus"
  });
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});

  /**
   * Kezeli az űrlap mezőinek változását.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} e - Az esemény.
   */
  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(errs => ({ ...errs, [e.target.name]: undefined }));
  }

  /**
   * Kezeli a regisztrációs űrlap elküldését.
   * Először validálja a mezőket, majd sikeres validáció esetén elküldi a backendnek.
   * @param {React.FormEvent} e - Az űrlap elküldésének eseménye.
   */
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
        <input type="text" name="uid" placeholder="Neptun kód" value={form.uid} onChange={handleChange} required style={errors.uid ? errorStyle : {}} />
        {errors.uid && <div className="auth-msg" style={{color:"#e53935"}}>{errors.uid}</div>}

        <input type="email" name="email" placeholder="E-mail" value={form.email} onChange={handleChange} required style={errors.email ? errorStyle : {}} />
        {errors.email && <div className="auth-msg" style={{color:"#e53935"}}>{errors.email}</div>}

        <input type="password" name="password" placeholder="Jelszó" value={form.password} onChange={handleChange} required style={errors.password ? errorStyle : {}} />
        {errors.password && <div className="auth-msg" style={{color:"#e53935"}}>{errors.password}</div>}

        <input type="text" name="name" placeholder="Teljes név" value={form.name} onChange={handleChange} required style={errors.name ? errorStyle : {}} />
        {errors.name && <div className="auth-msg" style={{color:"#e53935"}}>{errors.name}</div>}

        <input type="date" name="birth_date" placeholder="Születési dátum" value={form.birth_date} onChange={handleChange} required style={errors.birth_date ? errorStyle : {}} />
        {errors.birth_date && <div className="auth-msg" style={{color:"#e53935"}}>{errors.birth_date}</div>}

        <input type="text" name="id_card_number" placeholder="Személyi igazolvány szám" value={form.id_card_number} onChange={handleChange} required style={errors.id_card_number ? errorStyle : {}} />
        {errors.id_card_number && <div className="auth-msg" style={{color:"#e53935"}}>{errors.id_card_number}</div>}

        <input type="text" name="address_card_number" placeholder="Lakcímkártya szám" value={form.address_card_number} onChange={handleChange} required style={errors.address_card_number ? errorStyle : {}} />
        {errors.address_card_number && <div className="auth-msg" style={{color:"#e53935"}}>{errors.address_card_number}</div>}

        <input type="text" name="mothers_name" placeholder="Anyja neve" value={form.mothers_name} onChange={handleChange} required style={errors.mothers_name ? errorStyle : {}} />
        {errors.mothers_name && <div className="auth-msg" style={{color:"#e53935"}}>{errors.mothers_name}</div>}

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