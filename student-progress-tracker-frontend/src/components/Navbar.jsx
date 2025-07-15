/**
 * Navigációs sáv komponens.
 * Nyelvváltó gombbal, dinamikus linkekkel a bejelentkezési állapot és szerepkör szerint.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import Button from "../components/Button";
import { useLang } from "../context/LangContext";

/**
 * Segédfüggvény: JWT dekódolása (payload kinyerése)
 * @returns {string|null} A felhasználó szerepköre vagy null.
 */
function getRoleFromToken() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { lang, setLang } = useLang();

  const texts = {
    hu: {
      home: "Főoldal",
      login: "Bejelentkezés",
      register: "Regisztráció",
      profile: "Profil",
      chat: "Chat",
      progress: "Előrehaladás",
      admin: "Admin",
      logout: "Kijelentkezés"
    },
    en: {
      home: "Home",
      login: "Login",
      register: "Register",
      profile: "Profile",
      chat: "Chat",
      progress: "Progress",
      admin: "Admin",
      logout: "Logout"
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setLoggedIn(!!token);
    setIsAdmin(getRoleFromToken() === "admin");
    const handler = () => {
      const token = localStorage.getItem("access_token");
      setLoggedIn(!!token);
      setIsAdmin(getRoleFromToken() === "admin");
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    setLoggedIn(false);
    setIsAdmin(false);
    setOpen(false);
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="https://u-szeged.hu/site/upload/2020/12/felveteli_weboldal_nyito_1520x864_0000s_0000_ttik2.jpg" alt="SZTE" />
        <span>Hallgatói előrehaladás-követő</span>
      </div>
      <button
        className="navbar-burger"
        aria-label="Menü"
        onClick={() => setOpen(o => !o)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`navbar-links${open ? " open" : ""}`}>
        <Button onClick={() => setLang(lang === "hu" ? "en" : "hu")}>
          {lang === "hu" ? "EN" : "HU"}
        </Button>
        <Link to="/" onClick={() => setOpen(false)}>{texts[lang].home}</Link>
        {isAdmin && (
          <Link to="/admin" onClick={() => setOpen(false)}>{texts[lang].admin}</Link>
        )}
        {loggedIn && (
          <Link to="/chat" onClick={() => setOpen(false)}>{texts[lang].chat}</Link>
        )}
        {loggedIn && (
          <Link to="/progress" onClick={() => setOpen(false)}>{texts[lang].progress}</Link>
        )}
        {loggedIn && (
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="navbar-profile-link"
          >
            {texts[lang].profile}
          </Link>
        )}
        {!loggedIn && (
          <>
            <Link to="/login" onClick={() => setOpen(false)}>{texts[lang].login}</Link>
            <Link to="/register" onClick={() => setOpen(false)}>{texts[lang].register}</Link>
          </>
        )}
        {loggedIn && (
          <Button onClick={handleLogout}>
            {texts[lang].logout}
          </Button>
        )}
      </div>
    </nav>
  );
}