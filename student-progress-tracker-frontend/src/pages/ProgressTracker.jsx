import React, { useEffect, useState } from "react";
import ProgressTable from "../components/ProgressTable";
import { authFetch } from "../utils";

export default function ProgressTracker() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [progressFull, setProgressFull] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user.id) return;
    authFetch(`http://enaploproject.ddns.net:8000/api/progress/${user.id}/full`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
    })
      .then(res => res.json())
      .then(data => setProgressFull(data));
  }, [user.id]);

  if (!user.id) {
    return <div className="auth-msg">Jelentkezz be az előrehaladás megtekintéséhez!</div>;
  }

  return (
    <div className="progress-tracker-container">
      <h2 style={{ cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        Kurzusok és előrehaladás {open ? "▲" : "▼"}
      </h2>
      {open && (
        <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid #ccc", borderRadius: 6, padding: 8 }}>
          {progressFull.length === 0 ? (
            <div>Nincs elmentett kurzusod.</div>
          ) : (
            <ProgressTable progressFull={progressFull} />
          )}
        </div>
      )}
    </div>
  );
}