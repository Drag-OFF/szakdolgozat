// ...existing code...
import React, { useEffect, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";

const API_BASE = "http://enaploproject.ddns.net:8000";
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
        total: "records total"
      }
    : {
        search: "Keresés kurzus kód / név...",
        prev: "Előző",
        page: "Oldal",
        next: "Következő",
        total: "rekord összesen"
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

  const openCreate = () => { setForm({id:null, course_code:"", name:"", name_en:""}); setShowForm(true); window.scrollTo({top:0}); };
  const openEdit = () => {
    if (!selectedId) return alert("Válassz kurzust");
    const c = items.find(x=>String(x.id)===String(selectedId));
    if (!c) return alert("Nincs ilyen kurzus");
    setForm({ id:c.id, course_code:c.course_code||"", name:c.name||"", name_en:c.name_en||"" });
    setShowForm(true); window.scrollTo({top:0});
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
        <form onSubmit={submit} style={{display:"flex", gap:8, marginBottom:8, flexWrap:"wrap"}}>
          <input placeholder="Kurzus kód" value={form.course_code} onChange={e=>setForm(f=>({...f,course_code:e.target.value}))} />
          <input placeholder="Név (HU)" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
          <input placeholder="Név (EN)" value={form.name_en} onChange={e=>setForm(f=>({...f,name_en:e.target.value}))} />
          <div style={{display:"flex",gap:8}}>
            <button type="submit">{form.id ? "Módosít" : "Létrehoz"}</button>
            <button type="button" onClick={()=>{ setShowForm(false); setForm({id:null,course_code:"",name:"",name_en:""}); }}>Mégse</button>
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
// ...existing code...