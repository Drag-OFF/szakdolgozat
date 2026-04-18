import React, { useEffect, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";
import { API_BASE } from "../../config";
import { formatChosenSpecDisplay } from "../../utils";
import Button from "../Button";

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
        lhEmail: "User email address.",
        lfName: "Display name",
        lhName: "Displayed full name.",
        lfAdmin: "Administrator",
        lhAdmin: "Admin role setting.",
        phEmail: "user@example.com",
        phName: "Name shown in the app",
        tiEmail: "Login email address. Must stay unique.",
        tiName: "Display name for this user.",
        tiAdmin: "Check to grant admin rights (full access).",
        grantAdmin: "Grant admin role",
        lfSpec: "MK specialization",
        lhSpec: "From major requirement rules (same as student picker). Empty = no filter.",
        specOptAll: "- Not set (show all branches)",
        specOptNone: "No specialization (NONE)",
        specNoBranches: "No MK specialization roots in rules for this major.",
        colSpec: "MK spec"
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
        lhEmail: "A felhasználó e-mail címe.",
        lfName: "Megjelenő név",
        lhName: "A felhasználó megjelenő neve.",
        lfAdmin: "Adminisztrátor",
        lhAdmin: "Admin jogosultság beállítása.",
        phEmail: "pelda@email.hu",
        phName: "A felületen megjelenő név",
        tiEmail: "Bejelentkezési e-mail; egyedinek kell maradnia.",
        tiName: "A felhasználó megjelenő neve.",
        tiAdmin: "Pipáld be, ha a felhasználónak admin jogosultság kell (teljes hozzáférés).",
        grantAdmin: "Admin jogosultság",
        lfSpec: "MK specializáció",
        lhSpec: "A szakhoz importált szabályokból (ugyanaz, mint a hallgatói választó). Üres = nincs szűrés.",
        specOptAll: "- Nincs megadva (minden ág)",
        specOptNone: "Specializáció nélkül (NONE)",
        specNoBranches: "Ehhez a szakhoz nincs MK specializáció a szabályokban.",
        colSpec: "MK spec"
      };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    email: "",
    name: "",
    is_admin: false,
    chosen_specialization_code: ""
  });
  const [specBranches, setSpecBranches] = useState([]);

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

  const openEdit = async () => {
    if (!selectedId) return alert("Válassz felhasználót szerkesztéshez");
    const u = items.find(x => String(x.id) === String(selectedId));
    if (!u) return alert("Nincs ilyen felhasználó");
    const isAdmin = Boolean(u.is_admin) || String(u.role || "").toLowerCase() === "admin";
    const spec = u.chosen_specialization_code != null && String(u.chosen_specialization_code).trim()
      ? String(u.chosen_specialization_code).trim().toUpperCase()
      : "";
    let branches = [];
    try {
      const majorsRes = await authFetch(`${API_BASE}/api/majors?limit=10000`);
      const majors = await majorsRes.json().catch(() => []);
      const mid = Array.isArray(majors) ? majors.find((m) => m.name === u.major)?.id : undefined;
      if (mid != null) {
        const brRes = await authFetch(`${API_BASE}/api/majors/${mid}/specialization-branches`);
        if (brRes.ok) {
          const body = await brRes.json().catch(() => ({}));
          branches = Array.isArray(body.branches) ? body.branches : [];
        }
      }
    } catch (e) {
      console.error(e);
    }
    setSpecBranches(branches);
    let specCode = spec;
    if (
      branches.length > 0 &&
      spec &&
      !branches.some((b) => String(b.code || "").toUpperCase() === spec)
    ) {
      specCode = "";
    }
    setForm({ id: u.id, email: u.email || "", name: u.name || "", is_admin: isAdmin, chosen_specialization_code: specCode });
    setShowForm(true);
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!form.id) { alert("Új felhasználók létrehozása az admin felületről nem engedélyezett."); return; }
    try {
      const payload = {
        email: form.email,
        name: form.name,
        role: form.is_admin ? "admin" : "user",
        chosen_specialization_code:
          specBranches.length > 0 && form.chosen_specialization_code
            ? form.chosen_specialization_code
            : null
      };
      const url = `${API_BASE}/api/users/${encodeURIComponent(form.id)}`;
      const res = await authFetch(url, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (res.ok) {
        setShowForm(false);
        setSpecBranches([]);
        await load();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.detail ? (typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail)) : "Mentés sikertelen");
      }
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
      <div className="users-panel-toolbar" style={{display:"flex", gap:8, alignItems:"center", marginBottom:8}}>
        <input className="progress-input" placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1}} />
        <Button onClick={openEdit} disabled={showForm || !selectedId} variant="warning" size="sm">Szerkeszt</Button>
        <Button onClick={remove} disabled={showForm || !selectedId} variant="danger" size="sm">Töröl</Button>
        <Button onClick={load} disabled={showForm} variant="ghost" size="sm">↻</Button>
      </div>

      {showForm && form.id && (
        <form onSubmit={submit} className="admin-form-grid admin-form-grid--align-start users-edit-form">
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
          <div className="admin-form-field admin-form-field--h users-edit-form__field--full">
            <div className="admin-form-label-text">{t.lfSpec}</div>
            <div className="admin-form-control-wrap">
              {specBranches.length > 0 ? (
                <select
                  className="progress-input"
                  style={{ width: "100%", maxWidth: 420, padding: 8 }}
                  title={t.lhSpec}
                  value={form.chosen_specialization_code}
                  onChange={(e) => setForm((f) => ({ ...f, chosen_specialization_code: e.target.value }))}
                >
                  <option value="">{t.specOptAll}</option>
                  <option value="NONE">{t.specOptNone}</option>
                  {specBranches.map((b) => (
                    <option key={b.code} value={b.code}>
                      {lang === "en" && b.label_en ? b.label_en : (b.label_hu || b.code)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="progress-input" style={{ maxWidth: 420, padding: 8, opacity: 0.85 }}>
                  {t.specNoBranches}
                </div>
              )}
            </div>
            <div className="admin-form-col-hint">{t.lhSpec}</div>
          </div>
          <div className="admin-form-field admin-form-field--actions admin-form-field--h-actions users-edit-form__actions">
            <div className="admin-form-actions-inner" style={{ display: "flex", gap: 8 }}>
              <Button type="submit" variant="warning" size="sm">Módosít</Button>
              <Button type="button" onClick={()=>{ setShowForm(false); setSpecBranches([]); setForm({ id: null, email: "", name: "", is_admin: false, chosen_specialization_code: "" }); }} variant="ghost" size="sm">Mégse</Button>
            </div>
            <div className="admin-form-hint-spacer" aria-hidden="true">.</div>
          </div>
        </form>
      )}

      <div className="admin-card">
        <div className="admin-card-body">
          <table className="progress-table">
            <thead>
              <tr><th>#</th><th>Email</th><th>{lang === "en" ? "Name" : "Név"}</th><th>{t.colSpec}</th><th>Admin</th></tr>
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
                    <td title={u.chosen_specialization_code || ""}>{formatChosenSpecDisplay(u.chosen_specialization_code, lang)}</td>
                    <td>{isAdmin ? t.yes : t.no}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
        <Button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} variant="ghost" size="sm">{t.prev}</Button>
        <div>{`${t.page} ${page+1} / ${totalPages}`}</div>
        <Button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} variant="ghost" size="sm">{t.next}</Button>
        <div style={{marginLeft:"auto"}}>{`${filtered.length} ${t.total}`}</div>
      </div>
    </div>
  );
}
