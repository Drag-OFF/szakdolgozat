import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

export default function Admin() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = getRoleFromToken();
    if (!token || role !== "admin") {
      window.location.href = "http://enaploproject.ddns.net/";
    }
  }, []);

  return (
    <div>
      <h2>Admin felület</h2>
      {/* admin tartalom */}
    </div>
  );
}