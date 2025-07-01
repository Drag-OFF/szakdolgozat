/**
 * Navigációs sáv komponens.
 * Megjeleníti a főoldal, bejelentkezés, regisztráció vagy kijelentkezés linkeket a felhasználó bejelentkezési állapotától függően.
 * A JWT token alapján dinamikusan frissül.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

/**
 * Navbar komponens.
 * @returns {JSX.Element} A navigációs sáv elemei.
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  /**
   * Ellenőrzi, hogy van-e JWT token a localStorage-ben, és frissíti a bejelentkezési állapotot.
   * Figyeli a storage eseményt is, hogy több tab esetén is frissüljön.
   */
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("access_token"));
    const handler = () => setLoggedIn(!!localStorage.getItem("access_token"));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  /**
   * Kijelentkezteti a felhasználót: törli a JWT tokent, frissíti az állapotot, átirányít a login oldalra.
   */
  function handleLogout() {
    localStorage.removeItem("access_token");
    setLoggedIn(false);
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
        <Link to="/" onClick={() => setOpen(false)}>Főoldal</Link>
        {!loggedIn && (
          <>
            <Link to="/login" onClick={() => setOpen(false)}>Bejelentkezés</Link>
            <Link to="/register" onClick={() => setOpen(false)}>Regisztráció</Link>
          </>
        )}
        {loggedIn && (
          <button
            style={{
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "0.4rem 1.1rem",
              fontWeight: 500,
              fontSize: "1.08rem",
              cursor: "pointer",
              marginLeft: "1rem"
            }}
            onClick={handleLogout}
          >
            Kijelentkezés
          </button>
        )}
      </div>
    </nav>
  );
}