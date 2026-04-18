import React, { useEffect, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";
import { API_BASE } from "../../config";
import Button from "../Button";
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
        hCourseCode: "Unique course identifier.",
        fNameHu: "Name (HU)",
        hNameHu: "Hungarian course name.",
        fNameEn: "Name (EN)",
        hNameEn: "English course name (optional).",
        phCode: "e.g. ABC123 - unique code",
        phNameHu: "Course title in Hungarian",
        phNameEn: "Course title in English (optional)",
        tiCode: "Short unique identifier for the course.",
        tiNameHu: "Official Hungarian course name.",
        tiNameEn: "English name if available."
      }
    : {
        search: "Keresés kurzus kód / név...",
        prev: "Előző",
        page: "Oldal",
        next: "Következő",
        total: "rekord összesen",
        fCourseCode: "Kurzus kód",
        hCourseCode: "Egyedi kurzusazonosító.",
        fNameHu: "Név (magyar)",
        hNameHu: "A kurzus magyar neve.",
        fNameEn: "Név (angol)",
        hNameEn: "A kurzus angol neve (ha van).",
        phCode: "pl. ABC123 - egyedi azonosító",
        phNameHu: "A kurzus megnevezése magyarul",
        phNameEn: "Angol megnevezés (ha van)",
        tiCode: "Rövid, egyedi kurzuskód.",
        tiNameHu: "A kurzus hivatalos magyar neve.",
        tiNameEn: "A kurzus angol neve, ha van."
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
        <Button onClick={openCreate} disabled={showForm} variant="success" size="sm">Létrehoz</Button>
        <Button onClick={openEdit} disabled={showForm || !selectedId} variant="warning" size="sm">Szerkeszt</Button>
        <Button onClick={remove} disabled={showForm || !selectedId} variant="danger" size="sm">Töröl</Button>
        <Button onClick={load} disabled={showForm} variant="ghost" size="sm">↻</Button>
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
              <Button type="submit" variant={form.id ? "warning" : "success"} size="sm">{form.id ? "Módosít" : "Létrehoz"}</Button>
              <Button type="button" onClick={()=>{ setShowForm(false); setForm({id:null,course_code:"",name:"",name_en:""}); }} variant="ghost" size="sm">Mégse</Button>
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
        <Button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} variant="ghost" size="sm">{t.prev}</Button>
        <div>{`${t.page} ${page+1} / ${totalPages}`}</div>
        <Button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} variant="ghost" size="sm">{t.next}</Button>
        <div style={{marginLeft:"auto"}}>{`${filtered.length} ${t.total}`}</div>
      </div>
    </div>
  );
}
