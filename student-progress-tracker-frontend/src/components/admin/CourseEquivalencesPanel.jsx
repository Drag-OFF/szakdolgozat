// ...existing code...
import React, { useEffect, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import Autocomplete from "../common/Autocomplete";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";

const API_BASE = "http://enaploproject.ddns.net:8000";
const PAGE_SIZE = 10;

export default function CourseEquivalencesPanel() {
  const { authFetch } = useAuthFetch();
  const { lang } = useLang();
  const t = lang === "en"
    ? { search: "Search...", prev: "Prev", page: "Page", next: "Next", total: "records total" }
    : { search: "Keresés...", prev: "Előző", page: "Oldal", next: "Következő", total: "rekord összesen" };
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id:null, course_id:"", equivalent_course_id:"", major_id:"" });

  const load = async () => {
    setLoading(true);
    try {
      const [res, cr, mj] = await Promise.all([
        authFetch(`${API_BASE}/api/course_equivalence?limit=10000`),
        authFetch(`${API_BASE}/api/courses?limit=10000`),
        authFetch(`${API_BASE}/api/majors?limit=10000`)
      ]);
      const data = await res.json().catch(()=>[]);
      const crs = await cr.json().catch(()=>[]);
      const mjs = await mj.json().catch(()=>[]);
      setItems(Array.isArray(data)?data:[]);
      setCourses(Array.isArray(crs)?crs:[]);
      setMajors(Array.isArray(mjs)?mjs:[]);
      setPage(0); setSelectedId(null);
    } catch (e) { console.error(e); setItems([]); } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, [authFetch]);


  const courseLabel = id => {
    const c = courses.find(x=>String(x.id)===String(id)||String(x.course_code)===String(id));
    return c ? `${c.course_code} — ${c.name||""}` : "";
  };
  const majorLabel = id => {
    const m = majors.find(x=>String(x.id)===String(id));
    return m ? (m.name||m.title||"") : "";
  };
  
  const filtered = items.filter(i => {
    const q = String(query || "").toLowerCase().trim();
    if (!q) return true;
    const prereqStr = Array.isArray(i.prerequisites) ? i.prerequisites.join(", ") : String(i.prerequisites || "");
    const candidates = [
      String(i.id || ""),
      String(i.course_id || ""),
      String(i.major_id || ""),
      String(i.credit || ""),
      String(i.semester || ""),
      String(i.type || ""),
      prereqStr,
      courseLabel(i.course_id),
      majorLabel(i.major_id)
    ].map(s => String(s).toLowerCase());
    return candidates.some(v => v.includes(q));
  });


  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(()=>{ if (page >= totalPages) setPage(Math.max(0,totalPages-1)); }, [filtered.length, totalPages]);
  const displayed = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => { setForm({ id:null, course_id:"", equivalent_course_id:"", major_id:"" }); setShowForm(true); window.scrollTo({top:0}); };
  const openEdit = () => {
    if (!selectedId) return alert("Válassz rekordot");
    const r = items.find(x=>String(x.id)===String(selectedId));
    if (!r) return alert("Nincs ilyen rekord");
    setForm({ id:r.id, course_id:String(r.course_id), equivalent_course_id:String(r.equivalent_course_id), major_id:String(r.major_id) }); setShowForm(true); window.scrollTo({top:0});
  };

  const submit = async (e) => {
    e?.preventDefault();
    try {
      const payload = { course_id:Number(form.course_id), equivalent_course_id:Number(form.equivalent_course_id), major_id: Number(form.major_id) || null };
      const url = form.id ? `${API_BASE}/api/course_equivalence/${encodeURIComponent(form.id)}` : `${API_BASE}/api/course_equivalence`;
      const method = form.id ? "PUT" : "POST";
      const res = await authFetch(url, { method, headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (res.ok) { setShowForm(false); await load(); } else alert("Mentés sikertelen");
    } catch (e) { console.error(e); alert("Hiba"); }
  };

  const remove = async () => {
    if (!selectedId) return alert("Válassz rekordot");
    if (!confirm("Biztos törlöd?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/course_equivalence/${encodeURIComponent(selectedId)}`, { method: "DELETE" });
      if (res.ok) await load(); else alert("Törlés sikertelen");
    } catch (e) { console.error(e); alert("Hiba"); }
  };

  return (
    <div className="admin-panel">
      {/* debug: ha nincs adat, jelezzük egyértelműen */}
      {!loading && Array.isArray(items) && items.length === 0 && (
        <div style={{ color: "#666", marginBottom: 8 }}>
          Nincs ekvivalencia rekord — ellenőrizd az API választ a DevTools Network fülén (GET /api/course_equivalence).
        </div>
           )}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
        <input className="progress-input" placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1}} />
        <button onClick={openCreate} disabled={showForm}>Létrehoz</button>
        <button onClick={openEdit} disabled={showForm || !selectedId}>Szerkeszt</button>
        <button onClick={remove} disabled={showForm || !selectedId}>Töröl</button>
        <button onClick={load} disabled={showForm}>↻</button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
          <Autocomplete items={courses} idKey="id" value={form.course_id} onChange={v=>setForm(f=>({...f,course_id:v}))} labelFn={c=>`${c.course_code} — ${c.name||""}`} placeholder="Kurzus..." minChars={1} />
          <Autocomplete items={courses} idKey="id" value={form.equivalent_course_id} onChange={v=>setForm(f=>({...f,equivalent_course_id:v}))} labelFn={c=>`${c.course_code} — ${c.name||""}`} placeholder="Ekvivalens kurzus..." minChars={1} />
          <Autocomplete items={majors} idKey="id" value={form.major_id} onChange={v=>setForm(f=>({...f,major_id:v}))} labelFn={m=>m.name||m.title} placeholder="Szak (opcionális)" minChars={1} />
          <div style={{display:"flex",gap:8}}>
            <button type="submit">{form.id ? "Módosít" : "Létrehoz"}</button>
            <button type="button" onClick={()=>setShowForm(false)}>Mégse</button>
          </div>
        </form>
      )}

      <div className="admin-card">
        <div className="admin-card-body">
          <table className="progress-table">
            <thead><tr><th>#</th><th>{lang === "en" ? "Course" : "Kurzus"}</th><th>{lang === "en" ? "Equivalent" : "Ekvivalens"}</th><th>{lang === "en" ? "Major" : "Szak"}</th></tr></thead>
            <tbody>
              {displayed.map(i=>{
                const isSel = String(i.id)===String(selectedId);
                return (
                  <tr key={i.id} className={isSel ? "row-selected" : ""} onClick={()=>{ if(!showForm) setSelectedId(prev => (String(prev)===String(i.id)?null:String(i.id))); }} style={{ cursor: showForm ? "default" : "pointer" }}>
                    <td>{i.id}</td>
                    <td>{courseLabel(i.course_id)}</td>
                    <td>{courseLabel(i.equivalent_course_id)}</td>
                    <td>{majorLabel(i.major_id)}</td>
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