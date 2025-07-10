import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Auth.css";
import "../styles/GlobalBackground.css";
import { authFetch, validateRegisterForm } from "../utils";
import AuthInput from "../components/AuthInput";
import AuthSelect from "../components/AuthSelect";

/**
 * Regisztrációs oldal komponens.
 * Lehetővé teszi a felhasználók számára, hogy új fiókot hozzanak létre.
 * Minden mezőt validál, hibás mezőket pirossal keretez, és csak helyes adatok esetén küldi el a regisztrációs kérést a backendnek.
 *
 * @returns {JSX.Element} A regisztrációs oldal tartalma.
 */

export default function Register() {
  const [form, setForm] = useState({
    uid: "", email: "", password: "", name: "", birth_date: "",
    id_card_number: "", address_card_number: "", mothers_name: "", major: "Gazdaságinformatikus"
  });
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});

  /**
   * Kezeli a mezők változását, frissíti a form state-et és törli az adott mező hibáját.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} e - Az input vagy select mező eseménye.
   */
  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(errs => ({ ...errs, [e.target.name]: undefined }));
  }

  /**
   * Kezeli a regisztrációs űrlap elküldését.
   * Validálja a mezőket, hibák esetén visszajelzést ad, egyébként elküldi a backendnek az adatokat.
   * @param {React.FormEvent} e - Az űrlap elküldésének eseménye.
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    const validation = validateRegisterForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setMsg("Kérlek, javítsd a pirossal jelölt mezőket!");
      return;
    }
    try {
      const resp = await authFetch("http://enaploproject.ddns.net:8000/api/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp) return;
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
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h3>Regisztráció</h3>
        <AuthInput
          label="Neptun kód"
          id="register-uid"
          name="uid"
          value={form.uid}
          onChange={handleChange}
          error={errors.uid}
        />

        <AuthInput
          label="E-mail"
          id="register-email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <AuthInput
          label="Jelszó"
          id="register-password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <AuthInput
          label="Teljes név"
          id="register-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />

        <AuthInput
          label="Születési dátum"
          id="register-birth_date"
          type="date"
          name="birth_date"
          value={form.birth_date}
          onChange={handleChange}
          error={errors.birth_date}
        />

        <AuthInput
          label="Személyi igazolvány szám"
          id="register-id_card_number"
          name="id_card_number"
          value={form.id_card_number}
          onChange={handleChange}
          error={errors.id_card_number}
        />

        <AuthInput
          label="Lakcímkártya szám"
          id="register-address_card_number"
          name="address_card_number"
          value={form.address_card_number}
          onChange={handleChange}
          error={errors.address_card_number}
        />

        <AuthInput
          label="Anyja neve"
          id="register-mothers_name"
          name="mothers_name"
          value={form.mothers_name}
          onChange={handleChange}
          error={errors.mothers_name}
        />

        <AuthSelect
          label="Szak"
          id="register-major"
          name="major"
          value={form.major}
          onChange={handleChange}
          options={[
            "Gazdaságinformatikus",
            "Mérnökinformatikus",
            "Programtervező informatikus",
            "Villamosmérnök",
            "Üzemmérnök-informatikus"
          ]}
          error={errors.major}
        />

        <button type="submit">Regisztráció</button>
        <div className="auth-msg">{msg}</div>
        <div className="auth-link">
          Van már fiókod? <Link to="/login">Jelentkezz be!</Link>
        </div>

      <div className="auth-link">
        Már regisztráltál, de nem kaptál megerősítő e-mailt?{" "}
        <Link to="/resend-verify">Újra küldés</Link>
      </div>
      </form>
    </div>
  );
}