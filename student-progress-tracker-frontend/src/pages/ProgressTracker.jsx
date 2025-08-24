import React, { useEffect, useState } from "react";
import RequirementsStatus from "../components/RequirementsStatus";
import ProgressTable from "../components/ProgressTable";
import DownloadProgressButton from "../components/DownloadProgressButton";
import FileUpload from "../components/FileUpload";
import ProgressToolbar from "../components/ProgressToolbar";
import { authFetch } from "../utils";
import "../styles/ProgressTable.css";

export default function ProgressTracker() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [progressFull, setProgressFull] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [semester, setSemester] = useState("");
  const [points, setPoints] = useState("");
  const [open, setOpen] = useState(false);      // alapból csukva
  const [reqOpen, setReqOpen] = useState(false); // alapból csukva

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

  const filtered = progressFull.filter(p =>
    (
      (p.course_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.course_code?.toLowerCase() || "").includes(search.toLowerCase())
    ) &&
    (category ? (p.category || "").toLowerCase() === category : true) &&
    (status ? (p.status || "") === status : true) &&
    (semester ? String(p.completed_semester || "") === semester : true) &&
    (points ? String(p.points || "") === points : true)
  );

  return (
    <div className="progress-tracker-container">
      <h2 style={{ cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        Kurzusok és előrehaladás {open ? "▲" : "▼"}
      </h2>
      {open && (
        <div style={{
            maxHeight: 600,
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: 8,
            width: "90%",
            maxWidth: 1800, 
            margin: "0 auto",
            background: "#fff" 
        }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <div className="progress-input-container">
              <input
                type="text"
                placeholder="Keresés név vagy kód alapján..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="progress-input"
              />
            </div>
            {/* Fájl feltöltő komponens */}
            <FileUpload
              userId={user.id}
              onUpload={file => {
                const formData = new FormData();
                formData.append("file", file);
                fetch(`http://enaploproject.ddns.net:8000/api/progress/${user.id}/import`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                  },
                  body: formData,
                })
                  .then(res => res.json())
                  .then(data => {
                    setProgressFull(data);
                    alert("Sikeres feltöltés!");
                  })
                  .catch(() => alert("Hiba történt a feltöltés során!"));
              }}
            />
            {/* ...selectek, inputok... */}
            <DownloadProgressButton userId={user.id} />
          </div>
          {filtered.length === 0 ? (
            <div>Nincs elmentett kurzusod.</div>
          ) : (
            <ProgressTable progressFull={filtered} />
          )}
        </div>
      )}
      <div style={{ marginTop: 32 }}>
        <h2
          style={{ cursor: "pointer", marginBottom: 0 }}
          onClick={() => setReqOpen(o => !o)}
        >
          Követelmények állapota {reqOpen ? "▲" : "▼"}
        </h2>
        {reqOpen && (
          <div style={{
            maxHeight: 600,
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: 8,
            width: "90%",
            maxWidth: 1800, 
            margin: "0 auto",
            background: "#fff" 
          }}>
            <RequirementsStatus />
          </div>
        )}
      </div>
    </div>
  );
}