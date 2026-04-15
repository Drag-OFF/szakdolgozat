import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import Button from "../components/Button";
import { useLang } from "../context/LangContext";
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
  const IDLE_WINDOW_MS = 60 * 60 * 1000; // 1 óra
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tokenExpMs, setTokenExpMs] = useState(null);
  const [idleDeadlineMs, setIdleDeadlineMs] = useState(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const lastActivityTouchMsRef = useRef(0);
  const tokenRefreshInFlightRef = useRef(false);
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
      recommendations: "Kurzusajánló",
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
      recommendations: "Course recommendations",
      admin: "Admin",
      logout: "Logout"
    }
  };

useEffect(() => {
  // Auth állapot szinkronizálása tabok között és app eseményekből.
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

  // Felhasználói aktivitáskor csendes token frissítés.
  const refreshTokenSilently = async () => {
    if (tokenRefreshInFlightRef.current) return;
    const token = getAccessToken();
    if (!token) return;

    tokenRefreshInFlightRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/api/users/refresh-token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          clearAuth();
          setLoggedIn(false);
          setIsAdmin(false);
          setTokenExpMs(null);
          setIdleDeadlineMs(null);
          setRemainingSec(0);
          setOpen(false);
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

  // Lokális aktivitás figyelése (egér/billentyű/scroll/érintés).
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
    setOpen(false);
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
    setOpen(false);
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
    setOpen(false);
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
    setOpen(false);
    navigate("/login", { replace: true });
  }, msLeft);
  return () => window.clearTimeout(timeoutId);
}, [loggedIn, tokenExpMs, navigate]);

  function handleLogout() {
    clearAuth();
    setLoggedIn(false);
    setIsAdmin(false);
    setTokenExpMs(null);
    setIdleDeadlineMs(null);
    setRemainingSec(0);
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
        <Button
          onClick={() => setLang(lang === "hu" ? "en" : "hu")}
          className="navbar-link-btn"
          variant="primary"
          size="sm"
        >
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
          <Link to="/recommendations" onClick={() => setOpen(false)}>{texts[lang].recommendations}</Link>
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
          <span className="navbar-session-timer">({formatMmSs(remainingSec)})</span>
        )}
        {loggedIn && (
          <Button
            onClick={handleLogout}
            className="navbar-link-btn"
            variant="primary"
            size="sm"
          >
            {texts[lang].logout}
          </Button>
        )}
      </div>
    </nav>
  );
}