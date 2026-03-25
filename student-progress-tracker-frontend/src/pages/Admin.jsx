import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "../components/admin/AdminDashboard";

/**
 * JWT tokenből visszaadja a felhasználó szerepkörét.
 * @returns {string|null} A szerepkör vagy null.
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


/**
 * Admin oldal komponens.
 * Csak admin jogosultságú felhasználók érhetik el.
 * Ha nem admin a felhasználó, átirányítja a főoldalra.
 *
 * @returns {JSX.Element} Az admin oldal tartalma.
 */

export default function Admin() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = (() => {
      const t = localStorage.getItem("access_token");
      if (!t) return null;
      try { return JSON.parse(atob(t.split(".")[1])).role || null; } catch { return null; }
    })();
    if (!token || role !== "admin") window.location.href = "http://enaploproject.ddns.net/";
  }, []);

  return <AdminDashboard />;
}