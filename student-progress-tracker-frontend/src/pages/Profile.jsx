import React, { useEffect, useState } from "react";
import useAuthFetch from "../hooks/useAuthFetch";
import "../styles/Profile.css";
import { useLang } from "../context/LangContext";
import { PROFILE_LABELS } from "../translations";
import { API_BASE } from "../config";
import { getUserObject, setUserJson, clearAuth } from "../authStorage";

/**
 * Profil oldal komponens.
 * Olvashatóan megjeleníti a bejelentkezett felhasználó adatait.
 * A felhasználó nem szerkesztheti a nevét/email-jét itt — csak jelszót módosíthat.
 */
export default function Profile() {
  const { authFetch } = useAuthFetch();
  const { lang } = useLang();
  const t = PROFILE_LABELS[lang] || PROFILE_LABELS.hu;
  const stored = getUserObject();
  const [user, setUser] = useState(stored);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);

  // password form
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPassConfirm, setNewPassConfirm] = useState("");
  const [pwStatus, setPwStatus] = useState("");
  const [pwOk, setPwOk] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [deletePass, setDeletePass] = useState("");
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");
  const [deleteOk, setDeleteOk] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`${API_BASE}/api/users/me`);
        if (res.ok) {
          const data = await res.json().catch(()=>null);
          if (data) {
            setUser(data);
            setUserJson(data);
          }
        }
      } catch (e) { /* ignore */ } finally { setLoading(false); }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/api/majors?limit=10000`)
      .then(r => r.json().catch(() => []))
      .then(data => {
        if (!mounted) return;
        setMajors(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setMajors([]);
      });
    return () => { mounted = false; };
  }, []);

  if (!user?.id) {
    return <div className="auth-msg">{t.loginRequired}</div>;
  }

  const onChangePassword = async (e) => {
    e?.preventDefault();
    setPwStatus("");
    setPwOk(false);
    if (!oldPass || !newPass) { setPwStatus(t.msgMissing); return; }
    if (newPass.length < 8) { setPwStatus(t.msgShort); return; }
    if (newPass !== newPassConfirm) { setPwStatus(t.msgMismatch); return; }

    setSavingPw(true);
    try {
      const res = await authFetch(`${API_BASE}/api/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass })
      });
      if (res.ok) {
        setPwStatus(t.msgSuccess);
        setPwOk(true);
        setOldPass(""); setNewPass(""); setNewPassConfirm("");
      } else {
        const err = await res.json().catch(()=>null);
        setPwStatus(err?.detail || `${lang === "en" ? "Failed" : "Sikertelen"} (${res.status})`);
        setPwOk(false);
      }
    } catch (e) {
      setPwStatus(t.msgNetwork);
      setPwOk(false);
    } finally {
      setSavingPw(false);
    }
  };

  const onDeleteProfile = async (e) => {
    e?.preventDefault();
    setDeleteStatus("");
    setDeleteOk(false);

    if (!deletePass) {
      setDeleteStatus(t.deleteNeedPassword);
      return;
    }
    if (!deleteChecked) {
      setDeleteStatus(t.deleteNeedCheck);
      return;
    }
    if (!window.confirm(t.deleteConfirmDialog)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await authFetch(`${API_BASE}/api/users/delete-me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePass })
      });
      if (res.ok) {
        setDeleteStatus(t.deleteSuccess);
        setDeleteOk(true);
        clearAuth();
        setTimeout(() => {
          window.location.href = "/login";
        }, 700);
      } else {
        const err = await res.json().catch(() => null);
        setDeleteStatus(err?.detail || t.deleteFailed);
        setDeleteOk(false);
      }
    } catch (e) {
      setDeleteStatus(t.msgNetwork);
      setDeleteOk(false);
    } finally {
      setDeleting(false);
    }
  };

  const fmtDate = (iso) => { try { return iso ? new Date(iso).toLocaleString() : ""; } catch { return iso; } };
  const majorDisplay = (() => {
    const majorName = user.major || "";
    const majorObj = majors.find(m => String(m?.name || "") === String(majorName));
    if (!majorObj) return majorName || "-";
    return lang === "en"
      ? (majorObj.name_en || majorObj.name || "-")
      : (majorObj.name || majorObj.name_en || "-");
  })();

  return (
    <div className="admin-panel profile-panel">
      <h2>{t.title}</h2>

      <div className="profile-grid" style={{ marginBottom:12 }}>
        <div className="profile-main">
          <div className="info-row"><b>{t.name}</b> {user.name || "-"}</div>
          <div className="info-row"><b>{t.email}</b> {user.email || "-"}</div>
          <div className="info-row"><b>{t.neptun}</b> {user.neptun || user.uid || user.id}</div>
          <div className="info-row"><b>{t.major}</b> {majorDisplay}</div>
          <div className="info-row"><b>{t.created}</b> {fmtDate(user.created_at || user.created)}</div>

          <div style={{ marginTop:8 }}>
            {/* nem engedünk szerkesztést név/email mezőkben */}
            <button onClick={() => { clearAuth(); window.location.reload(); }}>
              {t.logout}
            </button>
          </div>
        </div>

        <div className="profile-side">
          <h3>{t.passwordChange}</h3>
          <form onSubmit={onChangePassword} style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <input type="password" placeholder={t.oldPassword} value={oldPass} onChange={e=>setOldPass(e.target.value)} />
            <input type="password" placeholder={t.newPassword} value={newPass} onChange={e=>setNewPass(e.target.value)} />
            <input type="password" placeholder={t.newPasswordConfirm} value={newPassConfirm} onChange={e=>setNewPassConfirm(e.target.value)} />
            <div style={{ display:"flex", gap:8 }}>
              <button type="submit" disabled={savingPw}>{t.submit}</button>
              <button type="button" onClick={()=>{ setOldPass(""); setNewPass(""); setNewPassConfirm(""); setPwStatus(""); setPwOk(false); }} disabled={savingPw}>{t.clear}</button>
            </div>
            {pwStatus && <div className={pwOk ? "status-ok" : "status-err"}>{pwStatus}</div>}
          </form>
        </div>
      </div>

      <div className="profile-delete-card">
        <h3>{t.deleteProfileTitle}</h3>
        <div className="profile-delete-warning">{t.deleteProfileWarning}</div>
        <form onSubmit={onDeleteProfile} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <input
            type="password"
            placeholder={t.deletePassword}
            value={deletePass}
            onChange={e => setDeletePass(e.target.value)}
          />
          <label className="profile-delete-check">
            <input
              type="checkbox"
              checked={deleteChecked}
              onChange={e => setDeleteChecked(e.target.checked)}
            />
            {t.deleteConfirmCheck}
          </label>
          <div>
            <button className="danger-btn" type="submit" disabled={deleting}>
              {t.deleteButton}
            </button>
          </div>
          {deleteStatus && <div className={deleteOk ? "status-ok" : "status-err"}>{deleteStatus}</div>}
        </form>
      </div>
    </div>
  );
}