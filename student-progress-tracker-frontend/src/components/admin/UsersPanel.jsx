import React, { useEffect, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";
import { API_BASE } from "../../config";

const PAGE_SIZE = 10;

export default function UsersPanel() {
  const { authFetch } = useAuthFetch();
  const { lang } = useLang();
  const t = lang === "en"
    ? {
        search: "Search...",
        prev: "Prev",
        page: "Page",
        next: "Next",
        total: "records total",
        yes: "Yes",
        no: "No",
        lfEmail: "Email",
        lhEmail: "Maps to table column “Email”.",
        lfName: "Display name",
        lhName: "Maps to table column “Name”.",
        lfAdmin: "Administrator",
        lhAdmin: "Maps to table column “Admin” (role).",
        phEmail: "user@example.com",
        phName: "Name shown in the app",
        tiEmail: "Login email address. Must stay unique. Shown in the “Email” column.",
        tiName: "Display name for this user. Shown in the “Name” column.",
        tiAdmin: "Check to grant admin rights (full access). Reflected in the “Admin” column.",
        grantAdmin: "Grant admin role"
      }
    : {
        search: "Keresés...",
        prev: "Előző",
        page: "Oldal",
        next: "Következő",
        total: "rekord összesen",
        yes: "Igen",
        no: "Nem",
        lfEmail: "E-mail",
        lhEmail: "A táblázat „Email” oszlopába kerül.",
        lfName: "Megjelenő név",
        lhName: "A táblázat „Név” oszlopába kerül.",
        lfAdmin: "Adminisztrátor",
        lhAdmin: "A táblázat „Admin” (szerepkör) oszlopába kerül.",
        phEmail: "pelda@email.hu",
        phName: "A felületen megjelenő név",
        tiEmail: "Bejelentkezési e-mail; egyedinek kell maradnia. Az „Email” oszlopban látszik.",
        tiName: "Felhasználó megjelenő neve. A „Név” oszlopban látszik.",
        tiAdmin: "Pipáld be, ha a felhasználónak admin jogosultság kell (teljes hozzáférés). Az „Admin” oszlopban látszik.",
        grantAdmin: "Admin jogosultság"
      };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: null, email: "", name: "", is_admin: false });

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/api/users?limit=10000`);
      const data = await res.json().catch(()=>[]);
      setItems(Array.isArray(data) ? data : []);
      setPage(0);
      setSelectedId(null);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [authFetch]);

  const filtered = items.filter(u => {
    const q = String(query||"").toLowerCase();
    if (!q) return true;
    return [u.id, u.email, u.name].some(v => v != null && String(v).toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page >= totalPages) setPage(Math.max(0, totalPages - 1)); }, [filtered.length, totalPages]);
  const displayed = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // create from admin UI disabled - no openCreate function

  const openEdit = () => {
    if (!selectedId) return alert("Válassz felhasználót szerkesztéshez");
    const u = items.find(x => String(x.id) === String(selectedId));
    if (!u) return alert("Nincs ilyen felhasználó");
    const isAdmin = Boolean(u.is_admin) || String(u.role || "").toLowerCase() === "admin";
    setForm({ id: u.id, email: u.email||"", name: u.name||"", is_admin: isAdmin });
    setShowForm(true);
  };

  const submit = async (e) => {
    e?.preventDefault();
    // prevent creating users from admin UI
    if (!form.id) { alert("Új felhasználók létrehozása az admin felületről nem engedélyezett."); return; }
    try {
      const payload = { email: form.email, name: form.name, role: form.is_admin ? "admin" : "user" };
      const url = `${API_BASE}/api/users/${encodeURIComponent(form.id)}`;
      const res = await authFetch(url, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (res.ok) { setShowForm(false); await load(); } else { alert("Mentés sikertelen"); }
    } catch (e) { console.error(e); alert("Hiba"); }
  };

  const remove = async () => {
    if (!selectedId) return alert("Válassz rekordot a törléshez");
    if (!confirm("Biztos törlöd?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/users/${encodeURIComponent(selectedId)}`, { method: "DELETE" });
      if (res.ok) { await load(); setSelectedId(null); } else alert("Törlés sikertelen");
    } catch (e) { console.error(e); alert("Hiba"); }
  };

  return (
    <div className="admin-panel">
      <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:8}}>
        <input className="progress-input" placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1}} />
        {/* gombok inaktívak szerkesztés közben */}
        <button onClick={openEdit} disabled={showForm || !selectedId}>Szerkeszt</button>
        <button onClick={remove} disabled={showForm || !selectedId}>Töröl</button>
        <button onClick={load} disabled={showForm}>↻</button>
      </div>

      {showForm && form.id && (  // csak meglévő user szerkesztésekor jelenjen meg az űrlap
        <form onSubmit={submit} className="admin-form-grid admin-form-grid--align-start admin-form-grid--fit">
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.lfEmail}</div>
            <div className="admin-form-control-wrap">
              <input className="progress-input" placeholder={t.phEmail} title={t.tiEmail} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
            </div>
            <div className="admin-form-col-hint">{t.lhEmail}</div>
          </div>
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.lfName}</div>
            <div className="admin-form-control-wrap">
              <input className="progress-input" placeholder={t.phName} title={t.tiName} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div className="admin-form-col-hint">{t.lhName}</div>
          </div>
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.lfAdmin}</div>
            <div className="admin-form-control-wrap" title={t.tiAdmin}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 36 }}>
                <input type="checkbox" checked={form.is_admin} onChange={e=>setForm(f=>({...f,is_admin:e.target.checked}))} />
                {t.grantAdmin}
              </label>
            </div>
            <div className="admin-form-col-hint">{t.lhAdmin}</div>
          </div>
          <div className="admin-form-field admin-form-field--actions admin-form-field--h-actions">
            <div className="admin-form-actions-inner" style={{ display: "flex", gap: 8 }}>
              <button type="submit">Módosít</button>
              <button type="button" onClick={()=>{ setShowForm(false); setForm({id:null,email:"",name:"",is_admin:false}); }}>Mégse</button>
            </div>
            <div className="admin-form-hint-spacer" aria-hidden="true">.</div>
          </div>
        </form>
      )}

      <div className="admin-card">
        <div className="admin-card-body">
          <table className="progress-table">
            <thead>
              <tr><th>#</th><th>Email</th><th>{lang === "en" ? "Name" : "Név"}</th><th>Admin</th></tr>
            </thead>
            <tbody>
              {displayed.map(u => {
                const isSel = String(u.id) === String(selectedId);
                const isAdmin = Boolean(u.is_admin) || String(u.role || "").toLowerCase() === "admin";
                return (
                  <tr
                    key={u.id}
                    className={isSel ? "row-selected" : ""}
                    onClick={() => { if (!showForm) setSelectedId(prev => (String(prev) === String(u.id) ? null : String(u.id))); }}
                    style={{ cursor: showForm ? "default" : "pointer" }}
                  >
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>{u.name}</td>
                    <td>{isAdmin ? t.yes : t.no}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
        <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}>{t.prev}</button>
        <div>{`${t.page} ${page+1} / ${totalPages}`}</div>
        <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}>{t.next}</button>
        <div style={{marginLeft:"auto"}}>{`${filtered.length} ${t.total}`}</div>
      </div>
    </div>
  );
}
