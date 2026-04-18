import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import { useLang } from "../context/LangContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE } from "../config";
import { getAccessToken, setAccessToken, clearAuth } from "../authStorage";

/** JWT-ből szerepkör kinyerése a menü elemek jogosultságához. */
function getRoleFromToken() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

/** JWT lejárati idejének kinyerése ezredmásodpercben. */
function getTokenExpMs() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = Number(payload?.exp);
    if (!Number.isFinite(exp) || exp <= 0) return null;
    return exp * 1000;
  } catch {
    return null;
  }
}

function formatMmSs(totalSeconds) {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function Navbar() {
  const IDLE_WINDOW_MS = 60 * 60 * 1000;
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tokenExpMs, setTokenExpMs] = useState(null);
  const [idleDeadlineMs, setIdleDeadlineMs] = useState(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const lastActivityTouchMsRef = useRef(0);
  const tokenRefreshInFlightRef = useRef(false);
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const texts = {
    hu: {
      home: "Főoldal",
      login: "Bejelentkezés",
      register: "Regisztráció",
      profile: "Profil",
      chat: "Chat",
      progress: "Előrehaladás",
      recommendations: "Kurzusajánló",
      admin: "Admin",
      logout: "Kijelentkezés",
      brand: "Hallgatói előrehaladás-követő",
      menuToggle: "Menü megnyitása",
      menuClose: "Menü bezárása",
      navLabel: "Fő navigáció",
      langHu: "HU",
      langEn: "EN",
      themeToLight: "Világos téma",
      themeToDark: "Sötét téma",
    },
    en: {
      home: "Home",
      login: "Login",
      register: "Register",
      profile: "Profile",
      chat: "Chat",
      progress: "Progress",
      recommendations: "Recommendations",
      admin: "Admin",
      logout: "Logout",
      brand: "Student progress tracker",
      menuToggle: "Open menu",
      menuClose: "Close menu",
      navLabel: "Main navigation",
      langHu: "HU",
      langEn: "EN",
      themeToLight: "Light theme",
      themeToDark: "Dark theme",
    },
  };
  const t = texts[lang] || texts.hu;

  useEffect(() => {
    const refreshIdleDeadline = () => {
      if (!getAccessToken()) return;
      setIdleDeadlineMs(Date.now() + IDLE_WINDOW_MS);
    };

    const updateAuth = () => {
      const token = getAccessToken();
      setLoggedIn(!!token);
      setIsAdmin(getRoleFromToken() === "admin");
      setTokenExpMs(getTokenExpMs());
      setIdleDeadlineMs(token ? Date.now() + IDLE_WINDOW_MS : null);
    };
    updateAuth();
    window.addEventListener("storage", updateAuth);
    window.addEventListener("user-login", updateAuth);
    window.addEventListener("auth-activity", refreshIdleDeadline);
    return () => {
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("user-login", updateAuth);
      window.removeEventListener("auth-activity", refreshIdleDeadline);
    };
  }, [IDLE_WINDOW_MS]);

  useEffect(() => {
    if (!loggedIn) return;

    const refreshTokenSilently = async () => {
      if (tokenRefreshInFlightRef.current) return;
      const token = getAccessToken();
      if (!token) return;

      tokenRefreshInFlightRef.current = true;
      try {
        const res = await fetch(`${API_BASE}/api/users/refresh-token`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401) {
            clearAuth();
            setLoggedIn(false);
            setIsAdmin(false);
            setTokenExpMs(null);
            setIdleDeadlineMs(null);
            setRemainingSec(0);
            setMenuOpen(false);
            navigate("/login", { replace: true });
          }
          return;
        }
        const data = await res.json().catch(() => null);
        const nextToken = data?.access_token;
        if (nextToken) {
          setAccessToken(nextToken);
          setTokenExpMs(getTokenExpMs());
          window.dispatchEvent(new Event("user-login"));
        }
      } catch {
        /* hálózati hiba: következő aktivitásnál újra próbálkozik */
      } finally {
        tokenRefreshInFlightRef.current = false;
      }
    };

    const handleAuthActivity = () => {
      setIdleDeadlineMs(Date.now() + IDLE_WINDOW_MS);
      void refreshTokenSilently();
    };

    window.addEventListener("auth-activity", handleAuthActivity);
    return () => window.removeEventListener("auth-activity", handleAuthActivity);
  }, [loggedIn, IDLE_WINDOW_MS, navigate]);

  useEffect(() => {
    if (!loggedIn) return;

    const markActivity = () => {
      const now = Date.now();
      if (now - lastActivityTouchMsRef.current < 5000) return;
      lastActivityTouchMsRef.current = now;
      setIdleDeadlineMs(now + IDLE_WINDOW_MS);
      window.dispatchEvent(new Event("auth-activity"));
    };

    const events = ["click", "keydown", "scroll", "touchstart"];
    for (const evt of events) window.addEventListener(evt, markActivity, { passive: true });
    return () => {
      for (const evt of events) window.removeEventListener(evt, markActivity);
    };
  }, [loggedIn, IDLE_WINDOW_MS]);

  useEffect(() => {
    if (!loggedIn) {
      setRemainingSec(0);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const effectiveDeadline = idleDeadlineMs || now;
      const next = Math.floor((effectiveDeadline - now) / 1000);
      setRemainingSec(Math.max(0, next));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [loggedIn, idleDeadlineMs]);

  useEffect(() => {
    if (!loggedIn) return;

    const now = Date.now();
    const effectiveDeadline = idleDeadlineMs || now;
    const msLeft = effectiveDeadline - now;
    if (msLeft <= 0) {
      clearAuth();
      setLoggedIn(false);
      setIsAdmin(false);
      setTokenExpMs(null);
      setIdleDeadlineMs(null);
      setRemainingSec(0);
      setMenuOpen(false);
      navigate("/login", { replace: true });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearAuth();
      setLoggedIn(false);
      setIsAdmin(false);
      setTokenExpMs(null);
      setIdleDeadlineMs(null);
      setRemainingSec(0);
      setMenuOpen(false);
      navigate("/login", { replace: true });
    }, msLeft);

    return () => window.clearTimeout(timeoutId);
  }, [loggedIn, idleDeadlineMs, navigate]);

  useEffect(() => {
    if (!loggedIn || !tokenExpMs) return;
    const msLeft = tokenExpMs - Date.now();
    if (msLeft <= 0) {
      clearAuth();
      setLoggedIn(false);
      setIsAdmin(false);
      setTokenExpMs(null);
      setIdleDeadlineMs(null);
      setRemainingSec(0);
      setMenuOpen(false);
      navigate("/login", { replace: true });
      return;
    }
    const timeoutId = window.setTimeout(() => {
      clearAuth();
      setLoggedIn(false);
      setIsAdmin(false);
      setTokenExpMs(null);
      setIdleDeadlineMs(null);
      setRemainingSec(0);
      setMenuOpen(false);
      navigate("/login", { replace: true });
    }, msLeft);
    return () => window.clearTimeout(timeoutId);
  }, [loggedIn, tokenExpMs, navigate]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.classList.toggle("app-nav--scroll-lock", menuOpen);
    return () => document.body.classList.remove("app-nav--scroll-lock");
  }, [menuOpen]);

  function handleLogout() {
    clearAuth();
    setLoggedIn(false);
    setIsAdmin(false);
    setTokenExpMs(null);
    setIdleDeadlineMs(null);
    setRemainingSec(0);
    setMenuOpen(false);
    navigate("/login");
  }

  const primaryLinks = [
    { to: "/", label: t.home, show: true },
    { to: "/admin", label: t.admin, show: isAdmin },
    { to: "/chat", label: t.chat, show: loggedIn },
    { to: "/progress", label: t.progress, show: loggedIn },
    { to: "/recommendations", label: t.recommendations, show: loggedIn },
    { to: "/profile", label: t.profile, show: loggedIn },
  ].filter((item) => item.show);

  const authLinks = loggedIn
    ? []
    : [
        { to: "/login", label: t.login, variant: "solid" },
        { to: "/register", label: t.register, variant: "ghost" },
      ];

  function renderNavLink(item) {
    const v = item.variant === "solid" ? " app-nav__link--cta" : "";
    return (
      <Link
        key={item.to}
        to={item.to}
        className={`app-nav__link${v}`}
        onClick={closeMenu}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <header className={`app-nav${menuOpen ? " app-nav--open" : ""}`}>
      <div className="app-nav__bar">
        <Link to="/" className="app-nav__brand" onClick={closeMenu}>
          <span className="app-nav__title">{t.brand}</span>
        </Link>

        <nav className="app-nav__desktop" aria-label={t.navLabel}>
          <div className="app-nav__links">
            {primaryLinks.map((item) => renderNavLink(item))}
            {!loggedIn && authLinks.map((item) => renderNavLink(item))}
          </div>

          <div className="app-nav__tools">
            <button
              type="button"
              className="app-nav__theme-btn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t.themeToLight : t.themeToDark}
              title={theme === "dark" ? t.themeToLight : t.themeToDark}
            >
              {theme === "dark" ? "☀" : "🌙"}
            </button>
            <div className="app-nav__lang" role="group" aria-label="Language">
              <button
                type="button"
                className={`app-nav__lang-btn${lang === "hu" ? " is-active" : ""}`}
                onClick={() => setLang("hu")}
              >
                {t.langHu}
              </button>
              <button
                type="button"
                className={`app-nav__lang-btn${lang === "en" ? " is-active" : ""}`}
                onClick={() => setLang("en")}
              >
                {t.langEn}
              </button>
            </div>
            {loggedIn && (
              <span className="app-nav__timer" title="Session idle">
                {formatMmSs(remainingSec)}
              </span>
            )}
            {loggedIn && (
              <button type="button" className="app-nav__btn app-nav__btn--danger" onClick={handleLogout}>
                {t.logout}
              </button>
            )}
          </div>
        </nav>

        <button
          type="button"
          className={`app-nav__burger${menuOpen ? " is-open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls="app-nav-drawer"
          aria-label={menuOpen ? t.menuClose : t.menuToggle}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="app-nav__burger-line" />
          <span className="app-nav__burger-line" />
          <span className="app-nav__burger-line" />
        </button>
      </div>

      <button
        type="button"
        className="app-nav__backdrop"
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
        onClick={closeMenu}
      />

      <div id="app-nav-drawer" className="app-nav__drawer" aria-hidden={!menuOpen}>
        <nav className="app-nav__drawer-inner" aria-label={t.navLabel}>
          <div className="app-nav__drawer-section">
            {primaryLinks.map((item) => renderNavLink(item))}
            {!loggedIn && authLinks.map((item) => renderNavLink(item))}
          </div>

          <div className="app-nav__drawer-section app-nav__drawer-section--tools">
            <button
              type="button"
              className="app-nav__theme-btn app-nav__theme-btn--block"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t.themeToLight : t.themeToDark}
            >
              {theme === "dark" ? `☀ ${t.themeToLight}` : `🌙 ${t.themeToDark}`}
            </button>
            <div className="app-nav__lang app-nav__lang--block" role="group" aria-label="Language">
              <button
                type="button"
                className={`app-nav__lang-btn${lang === "hu" ? " is-active" : ""}`}
                onClick={() => {
                  setLang("hu");
                  closeMenu();
                }}
              >
                {t.langHu}
              </button>
              <button
                type="button"
                className={`app-nav__lang-btn${lang === "en" ? " is-active" : ""}`}
                onClick={() => {
                  setLang("en");
                  closeMenu();
                }}
              >
                {t.langEn}
              </button>
            </div>
            {loggedIn && (
              <div className="app-nav__drawer-timer-row">
                <span className="app-nav__timer-label">Session</span>
                <span className="app-nav__timer">{formatMmSs(remainingSec)}</span>
              </div>
            )}
            {loggedIn && (
              <button type="button" className="app-nav__btn app-nav__btn--danger app-nav__btn--block" onClick={handleLogout}>
                {t.logout}
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
