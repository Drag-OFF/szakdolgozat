import React, { useEffect, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";
import { API_BASE } from "../../config";
const PAGE_SIZE = 10;

export default function CoursesPanel() {
  const { authFetch } = useAuthFetch();
  const { lang } = useLang();
  const t = lang === "en"
    ? {
        search: "Search course code / name...",
        prev: "Prev",
        page: "Page",
        next: "Next",
        total: "records total",
        fCourseCode: "Course code",
        hCourseCode: "Maps to table column “Course code”.",
        fNameHu: "Name (HU)",
        hNameHu: "Maps to table column “Name (HU)”.",
        fNameEn: "Name (EN)",
        hNameEn: "Maps to table column “Name (EN)”.",
        phCode: "e.g. ABC123 — unique code",
        phNameHu: "Course title in Hungarian",
        phNameEn: "Course title in English (optional)",
        tiCode: "Short unique identifier for the course. Shown in the “Course code” column.",
        tiNameHu: "Official Hungarian name. Shown in the “Name (HU)” column.",
        tiNameEn: "English name if available. Shown in the “Name (EN)” column."
      }
    : {
        search: "Keresés kurzus kód / név...",
        prev: "Előző",
        page: "Oldal",
        next: "Következő",
        total: "rekord összesen",
        fCourseCode: "Kurzus kód",
        hCourseCode: "A táblázat „Kurzus kód” oszlopába kerül.",
        fNameHu: "Név (magyar)",
        hNameHu: "A táblázat „Név (HU)” oszlopába kerül.",
        fNameEn: "Név (angol)",
        hNameEn: "A táblázat „Név (EN)” oszlopába kerül.",
        phCode: "pl. ABC123 — egyedi azonosító",
        phNameHu: "A kurzus megnevezése magyarul",
        phNameEn: "Angol megnevezés (ha van)",
        tiCode: "Rövid, egyedi kurzuskód. A „Kurzus kód” oszlopban jelenik meg.",
        tiNameHu: "A kurzus hivatalos magyar neve. A „Név (HU)” oszlopban látszik.",
        tiNameEn: "Angol név, ha van. A „Név (EN)” oszlopban látszik."
      };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id:null, course_code:"", name:"", name_en:"" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/api/courses?limit=10000`);
      const data = await res.json().catch(()=>[]);
      setItems(Array.isArray(data) ? data : []);
      setPage(0);
      setSelectedId(null);
    } catch (e) { console.error(e); setItems([]); } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, [authFetch]);

  const filtered = items.filter(c => {
    const q = String(query||"").toLowerCase();
    if (!q) return true;
    return [c.course_code, c.name, c.name_en, c.id].some(v => v != null && String(v).toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(()=>{ if (page >= totalPages) setPage(Math.max(0,totalPages-1)); }, [filtered.length, totalPages]);
  const displayed = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => { setForm({id:null, course_code:"", name:"", name_en:""}); setShowForm(true); };
  const openEdit = () => {
    if (!selectedId) return alert("Válassz kurzust");
    const c = items.find(x=>String(x.id)===String(selectedId));
    if (!c) return alert("Nincs ilyen kurzus");
    setForm({ id:c.id, course_code:c.course_code||"", name:c.name||"", name_en:c.name_en||"" });
    setShowForm(true);
  };

  const submit = async (e) => {
    e?.preventDefault();
    try {
      const payload = { course_code: form.course_code, name: form.name, name_en: form.name_en };
      const url = form.id ? `${API_BASE}/api/courses/${encodeURIComponent(form.id)}` : `${API_BASE}/api/courses`;
      const method = form.id ? "PUT" : "POST";
      const res = await authFetch(url, { method, headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (res.ok) { setShowForm(false); await load(); } else alert("Mentés sikertelen");
    } catch (e) { console.error(e); alert("Hiba"); }
  };

  const remove = async () => {
    if (!selectedId) return alert("Válassz kurzust");
    if (!confirm("Biztos törlöd?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/courses/${encodeURIComponent(selectedId)}`, { method: "DELETE" });
      if (res.ok) { await load(); setSelectedId(null); } else alert("Törlés sikertelen");
    } catch (e) { console.error(e); alert("Hiba"); }
  };

  return (
    <div className="admin-panel">
      <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:8}}>
        <input className="progress-input" placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1}} />
        <button onClick={openCreate} disabled={showForm}>Létrehoz</button>
        <button onClick={openEdit} disabled={showForm || !selectedId}>Szerkeszt</button>
        <button onClick={remove} disabled={showForm || !selectedId}>Töröl</button>
        <button onClick={load} disabled={showForm}>↻</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="admin-form-grid admin-form-grid--align-start admin-form-grid--fit">
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.fCourseCode}</div>
            <div className="admin-form-control-wrap">
              <input className="progress-input" placeholder={t.phCode} title={t.tiCode} value={form.course_code} onChange={e=>setForm(f=>({...f,course_code:e.target.value}))} />
            </div>
            <div className="admin-form-col-hint">{t.hCourseCode}</div>
          </div>
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.fNameHu}</div>
            <div className="admin-form-control-wrap">
              <input className="progress-input" placeholder={t.phNameHu} title={t.tiNameHu} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div className="admin-form-col-hint">{t.hNameHu}</div>
          </div>
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.fNameEn}</div>
            <div className="admin-form-control-wrap">
              <input className="progress-input" placeholder={t.phNameEn} title={t.tiNameEn} value={form.name_en} onChange={e=>setForm(f=>({...f,name_en:e.target.value}))} />
            </div>
            <div className="admin-form-col-hint">{t.hNameEn}</div>
          </div>
          <div className="admin-form-field admin-form-field--actions admin-form-field--h-actions">
            <div className="admin-form-actions-inner" style={{ display: "flex", gap: 8 }}>
              <button type="submit">{form.id ? "Módosít" : "Létrehoz"}</button>
              <button type="button" onClick={()=>{ setShowForm(false); setForm({id:null,course_code:"",name:"",name_en:""}); }}>Mégse</button>
            </div>
            <div className="admin-form-hint-spacer" aria-hidden="true">.</div>
          </div>
        </form>
      )}

      <div className="admin-card">
        <div className="admin-card-body">
          <table className="progress-table">
            <thead><tr><th>#</th><th>{lang === "en" ? "Course code" : "Kurzus kód"}</th><th>{lang === "en" ? "Name (HU)" : "Név (HU)"}</th><th>{lang === "en" ? "Name (EN)" : "Név (EN)"}</th></tr></thead>
            <tbody>
              {displayed.map(c => {
                const isSel = String(c.id) === String(selectedId);
                return (
                  <tr key={c.id} className={isSel ? "row-selected" : ""} onClick={()=>{ if(!showForm) setSelectedId(prev => (String(prev)===String(c.id) ? null : String(c.id))); }} style={{ cursor: showForm ? "default" : "pointer" }}>
                     <td>{c.id}</td>
                     <td>{c.course_code}</td>
                     <td>{c.name}</td>
                     <td>{c.name_en}</td>
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
