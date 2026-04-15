import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Auth.css";
import "../styles/GlobalBackground.css";
import { authFetch, validateRegisterForm } from "../utils";
import AuthInput from "../components/AuthInput";
import AuthSelect from "../components/AuthSelect";
import { useLang } from "../context/LangContext";
import { API_BASE } from "../config";

export default function Register() {
  const [form, setForm] = useState({
    uid: "", email: "", password: "", name: "", birth_date: "",
    id_card_number: "", address_card_number: "", mothers_name: "", major: ""
  });
  const [majorOptions, setMajorOptions] = useState([]);
  const [loadingMajors, setLoadingMajors] = useState(true);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});
  const { lang } = useLang();

  const texts = {
    hu: {
      title: "Regisztráció",
      uid: "Neptun kód",
      email: "E-mail",
      password: "Jelszó",
      name: "Teljes név",
      birth_date: "Születési dátum",
      id_card_number: "Személyi igazolvány szám",
      address_card_number: "Lakcímkártya szám",
      mothers_name: "Anyja neve",
      major: "Szak",
      btn: "Regisztráció",
      msg: "Kérlek, javítsd a pirossal jelölt mezőket!",
      success: "Sikeres regisztráció! Nézd meg az e-mail fiókodat a megerősítő levélért.",
      already: "Van már fiókod?",
      login: "Jelentkezz be!",
      resend: "Már regisztráltál, de nem kaptál megerősítő e-mailt?",
      resendBtn: "Újra küldés",
      unknown: "Ismeretlen hiba",
      network: "Hálózati hiba: "
    },
    en: {
      title: "Register",
      uid: "Neptun code",
      email: "E-mail",
      password: "Password",
      name: "Full name",
      birth_date: "Date of birth",
      id_card_number: "ID card number",
      address_card_number: "Address card number",
      mothers_name: "Mother's name",
      major: "Major",
      btn: "Register",
      msg: "Please fix the fields marked in red!",
      success: "Registration successful! Check your email for confirmation.",
      already: "Already have an account?",
      login: "Login!",
      resend: "Already registered but didn't get a confirmation email?",
      resendBtn: "Resend",
      unknown: "Unknown error",
      network: "Network error: "
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoadingMajors(true);
    fetch(`${API_BASE}/api/majors?limit=10000`)
      .then(res => res.json().catch(() => []))
      .then(data => {
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : [];
        const opts = arr
          .filter(m => m && (m.name || m.title))
          .map(m => {
            const nameHu = m.name || m.title || "";
            const nameEn = m.name_en || nameHu;
            return { value: nameHu, hu: nameHu, en: nameEn };
          });
        setMajorOptions(opts);
        if (!form.major && opts.length > 0) {
          setForm(f => ({ ...f, major: opts[0].value }));
        }
      })
      .catch(() => {
        if (!mounted) return;
        setMajorOptions([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingMajors(false);
      });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(errs => ({ ...errs, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    const validation = validateRegisterForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setMsg(texts[lang].msg);
      return;
    }
    try {
      const resp = await fetch(`${API_BASE}/api/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp) return;
      const result = await resp.json();
      if (resp.ok) {
        setMsg(texts[lang].success);
      } else if (result.detail) {
        if (Array.isArray(result.detail)) setMsg(result.detail.map(e => e.msg).join("\n"));
        else setMsg(result.detail);
      } else setMsg(texts[lang].unknown);
    } catch (err) {
      setMsg(texts[lang].network + err);
    }
  }

  return (
    
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h3>{texts[lang].title}</h3>
        <AuthInput
          label={texts[lang].uid}
          id="register-uid"
          name="uid"
          value={form.uid}
          onChange={handleChange}
          error={errors.uid}
        />
        <AuthInput
          label={texts[lang].email}
          id="register-email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <AuthInput
          label={texts[lang].password}
          id="register-password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <AuthInput
          label={texts[lang].name}
          id="register-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
        <AuthInput
          label={texts[lang].birth_date}
          id="register-birth_date"
          type="date"
          name="birth_date"
          value={form.birth_date}
          onChange={handleChange}
          error={errors.birth_date}
        />
        <AuthInput
          label={texts[lang].id_card_number}
          id="register-id_card_number"
          name="id_card_number"
          value={form.id_card_number}
          onChange={handleChange}
          error={errors.id_card_number}
        />
        <AuthInput
          label={texts[lang].address_card_number}
          id="register-address_card_number"
          name="address_card_number"
          value={form.address_card_number}
          onChange={handleChange}
          error={errors.address_card_number}
        />
        <AuthInput
          label={texts[lang].mothers_name}
          id="register-mothers_name"
          name="mothers_name"
          value={form.mothers_name}
          onChange={handleChange}
          error={errors.mothers_name}
        />
        <AuthSelect
          label={texts[lang].major}
          id="register-major"
          name="major"
          value={form.major}
          onChange={handleChange}
          options={majorOptions}
          error={errors.major}
        />
        <button type="submit">{texts[lang].btn}</button>
        <div className="auth-msg">{msg}</div>
        <div className="auth-link">
          {texts[lang].already} <Link to="/login">{texts[lang].login}</Link>
        </div>
        <div className="auth-link">
          {texts[lang].resend} <Link to="/resend-verify">{texts[lang].resendBtn}</Link>
        </div>
      </form>
    </div>
  );
}