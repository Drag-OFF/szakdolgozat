import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PasswordResetForm from "../components/PasswordResetForm";
import { useLang } from "../context/LangContext";
import "../styles/Auth.css";
import { authFetch } from "../utils";
import { apiUrl } from "../config";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [sent, setSent] = useState(false);
  const { lang } = useLang();
  const navigate = useNavigate();

  const texts = {
    hu: {
      title: "Új jelszó beállítása",
      password: "Új jelszó",
      confirm: "Jelszó megerősítése",
      btn: "Mentés",
      pwError: "A jelszavak nem egyeznek vagy túl rövid!",
      success: "Sikeres jelszócsere! Most már bejelentkezhetsz.",
      unknownError: "Ismeretlen hiba történt.",
      reqError: "Hiba történt a kérés során."
    },
    en: {
      title: "Set new password",
      password: "New password",
      confirm: "Confirm password",
      btn: "Save",
      pwError: "Passwords do not match or too short!",
      success: "Password changed successfully! You can now log in.",
      unknownError: "Unknown error occurred.",
      reqError: "An error occurred during the request."
    }
  };

  async function handlePasswordReset(password, setMsg) {
    try {
      const resp = await authFetch(apiUrl("/api/users/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!resp) return;
      const result = await resp.json();
      if (resp.ok) {
        setMsg(texts[lang].success);
        setSent(true);
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        setMsg(result.detail || texts[lang].unknownError);
      }
    } catch (err) {
      setMsg(texts[lang].reqError);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ justifyContent: "center", alignItems: "center" }}>
        <PasswordResetForm
          onSubmit={handlePasswordReset}
          texts={texts}
          sent={sent}
        />
      </div>
    </div>
  );
}