import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);

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
        <Link to="/login" onClick={() => setOpen(false)}>Bejelentkezés</Link>
        <Link to="/register" onClick={() => setOpen(false)}>Regisztráció</Link>
      </div>
    </nav>
  );
}