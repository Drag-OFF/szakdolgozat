import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import "../styles/Auth.css";
import "../styles/GlobalBackground.css";
import { authFetch, isValidEmail, isValidNeptun } from "../utils";
import AuthInput from "../components/AuthInput";
import { useLang } from "../context/LangContext";
import { apiUrl } from "../config";
import { setAccessToken, setUserJson } from "../authStorage";

export default function Login() {
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useLang();

  function safeNextPath(raw) {
    if (!raw || typeof raw !== "string") return null;
    if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return null;
    return raw;
  }

  const texts = {
    hu: {
      title: "Hallgatói bejelentkezés",
      uidLabel: "E-mail vagy Neptun kód",
      passwordLabel: "Jelszó",
      btn: "Bejelentkezés",
      noAccount: "Nincs fiókod?",
      register: "Regisztráció",
      forgot: "Elfelejtett jelszó?",
      invalidUid: "Adj meg érvényes e-mail címet vagy Neptun kódot!",
      emptyPw: "A jelszó nem lehet üres!",
      success: "Sikeres bejelentkezés!",
      error: "Hiba",
      network: "Hálózati hiba: "
    },
    en: {
      title: "Student login",
      uidLabel: "E-mail or Neptun code",
      passwordLabel: "Password",
      btn: "Login",
      noAccount: "No account?",
      register: "Register",
      forgot: "Forgot password?",
      invalidUid: "Please enter a valid e-mail address or Neptun code!",
      emptyPw: "Password cannot be empty!",
      success: "Login successful!",
      error: "Error",
      network: "Network error: "
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!isValidEmail(uid) && !isValidNeptun(uid)) {
      setMsg(texts[lang].invalidUid);
      return;
    }
    if (!password) {
      setMsg(texts[lang].emptyPw);
      return;
    }
    const data = uid.includes("@") ? { email: uid, password } : { uid, password };
    try {
      const resp = await fetch(apiUrl("/api/users/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp) return;
      const result = await resp.json();
      if (resp.ok && result.access_token) {
        setAccessToken(result.access_token);
        setUserJson(result.user);
        window.dispatchEvent(new Event("user-login"));
        setMsg(texts[lang].success);
        const next = safeNextPath(searchParams.get("next"));
        setTimeout(() => {
          navigate(next || "/", { replace: true });
        }, 600);
      } else if (
        result.detail &&
        (result.detail.includes("erősítsd meg") || result.detail.toLowerCase().includes("verify"))
      ) {
        setMsg(result.detail);
      } else {
        setMsg(result.detail || texts[lang].error);
      }
    } catch (err) {
      setMsg(texts[lang].network + err);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h3>{texts[lang].title}</h3>
        <AuthInput
          label={texts[lang].uidLabel}
          id="login-uid"
          value={uid}
          onChange={e => setUid(e.target.value)}
        />
        <AuthInput
          label={texts[lang].passwordLabel}
          id="login-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">{texts[lang].btn}</button>
        <div className="auth-msg">{msg}</div>
        <div className="auth-link">
          {texts[lang].noAccount} <Link to="/register">{texts[lang].register}</Link>
        </div>
        <div className="auth-link">
          <Link to="/forgot-password">{texts[lang].forgot}</Link>
        </div>
      </form>
      </div>
    </div>
  );
}