import React, { useEffect, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import Autocomplete from "../common/Autocomplete";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";
import { API_BASE } from "../../config";
const PAGE_SIZE = 10;

export default function CourseEquivalencesPanel() {
  const { authFetch } = useAuthFetch();
  const { lang } = useLang();
  const t = lang === "en"
    ? {
        search: "Search...",
        prev: "Prev",
        page: "Page",
        next: "Next",
        total: "records total",
        lfCourse: "Course",
        lhCourse: "Maps to table column “Course”.",
        lfEq: "Equivalent course",
        lhEq: "Maps to table column “Equivalent”.",
        lfMajor: "Major",
        lhMajor: "Maps to table column “Major”.",
        phCourse: "Type code or name, pick from list…",
        phEq: "Other course treated as equivalent…",
        phMajor: "Major this pair applies to (required)…",
        tiCourse: "Search by course code or name. The selected course appears in the “Course” column.",
        tiEq: "Pick the course that counts as equivalent. Appears in the “Equivalent” column.",
        tiMajor: "Choose the major (specialization) this equivalence applies to. Required."
      }
    : {
        search: "Keresés...",
        prev: "Előző",
        page: "Oldal",
        next: "Következő",
        total: "rekord összesen",
        lfCourse: "Kurzus",
        lhCourse: "A táblázat „Kurzus” oszlopába kerül.",
        lfEq: "Ekvivalens kurzus",
        lhEq: "A táblázat „Ekvivalens” oszlopába kerül.",
        lfMajor: "Szak",
        lhMajor: "A táblázat „Szak” oszlopába kerül.",
        phCourse: "Kurzus kód vagy név, válassz a listából…",
        phEq: "Melyik kurzus számít ekvivalensnek…",
        phMajor: "Melyik szakra vonatkozik (kötelező)…",
        tiCourse: "Keresés kurzus kód vagy név alapján; a kiválasztott kurzus a „Kurzus” oszlopban jelenik meg.",
        tiEq: "Az a kurzus, amelyik ekvivalensként számít; az „Ekvivalens” oszlopban látszik.",
        tiMajor: "Válaszd ki a szakot, amelyre ez az ekvivalencia vonatkozik. Kötelező mező."
      };
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
    const candidates = [
      String(i.id || ""),
      String(i.course_id || ""),
      String(i.equivalent_course_id || ""),
      String(i.major_id || ""),
      courseLabel(i.course_id),
      courseLabel(i.equivalent_course_id),
      majorLabel(i.major_id)
    ].map(s => String(s).toLowerCase());
    return candidates.some(v => v.includes(q));
  });


  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(()=>{ if (page >= totalPages) setPage(Math.max(0,totalPages-1)); }, [filtered.length, totalPages]);
  const displayed = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => { setForm({ id:null, course_id:"", equivalent_course_id:"", major_id:"" }); setShowForm(true); };
  const openEdit = () => {
    if (!selectedId) return alert("Válassz rekordot");
    const r = items.find(x=>String(x.id)===String(selectedId));
    if (!r) return alert("Nincs ilyen rekord");
    setForm({ id:r.id, course_id:String(r.course_id), equivalent_course_id:String(r.equivalent_course_id), major_id:String(r.major_id) }); setShowForm(true);
  };

  const apiErrorText = async (res) => {
    try {
      const body = await res.json();
      const d = body?.detail;
      if (Array.isArray(d)) return d.map(x => x.msg || String(x)).join("; ");
      if (d != null) return String(d);
    } catch (_) { /* ignore */ }
    return res.statusText || "Hiba";
  };

  const submit = async (e) => {
    e?.preventDefault();
    const cid = Number(form.course_id);
    const eqid = Number(form.equivalent_course_id);
    const mid = Number(form.major_id);
    if (!cid || !eqid || !mid) {
      alert(lang === "en" ? "Select course, equivalent course, and major." : "Válassz kurzust, ekvivalens kurzust és szakot (mind kötelező).");
      return;
    }
    if (cid === eqid) {
      alert(lang === "en" ? "Course and equivalent must be different." : "A két kurzus nem lehet ugyanaz.");
      return;
    }
    try {
      const payload = { course_id: cid, equivalent_course_id: eqid, major_id: mid };
      const url = form.id ? `${API_BASE}/api/course_equivalence/${encodeURIComponent(form.id)}` : `${API_BASE}/api/course_equivalence`;
      const method = form.id ? "PUT" : "POST";
      const res = await authFetch(url, { method, headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (res.ok) { setShowForm(false); await load(); } else alert(`${lang === "en" ? "Save failed" : "Mentés sikertelen"}: ${await apiErrorText(res)}`);
    } catch (err) { console.error(err); alert(lang === "en" ? "Error" : "Hiba"); }
  };

  const remove = async () => {
    if (!selectedId) return alert("Válassz rekordot");
    if (!confirm("Biztos törlöd?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/course_equivalence/${encodeURIComponent(selectedId)}`, { method: "DELETE" });
      if (res.ok) await load(); else alert(`${lang === "en" ? "Delete failed" : "Törlés sikertelen"}: ${await apiErrorText(res)}`);
    } catch (e) { console.error(e); alert("Hiba"); }
  };

  return (
    <div className="admin-panel">
      {!loading && Array.isArray(items) && items.length === 0 && (
        <div style={{ color: "#666", marginBottom: 8 }}>
          {lang === "en" ? "No equivalence rows yet." : "Még nincs ekvivalencia rekord."}
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
        <form onSubmit={submit} className="admin-form-grid admin-form-grid--align-start admin-form-grid--fit">
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.lfCourse}</div>
            <div className="admin-form-control-wrap">
              <Autocomplete items={courses} idKey="id" value={form.course_id} onChange={v=>setForm(f=>({...f,course_id:v}))} labelFn={c=>`${c.course_code} — ${c.name||""}`} placeholder={t.phCourse} title={t.tiCourse} minChars={1} />
            </div>
            <div className="admin-form-col-hint">{t.lhCourse}</div>
          </div>
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.lfEq}</div>
            <div className="admin-form-control-wrap">
              <Autocomplete items={courses} idKey="id" value={form.equivalent_course_id} onChange={v=>setForm(f=>({...f,equivalent_course_id:v}))} labelFn={c=>`${c.course_code} — ${c.name||""}`} placeholder={t.phEq} title={t.tiEq} minChars={1} />
            </div>
            <div className="admin-form-col-hint">{t.lhEq}</div>
          </div>
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.lfMajor}</div>
            <div className="admin-form-control-wrap">
              <Autocomplete items={majors} idKey="id" value={form.major_id} onChange={v=>setForm(f=>({...f,major_id:v}))} labelFn={m=>m.name||m.title} placeholder={t.phMajor} title={t.tiMajor} minChars={1} />
            </div>
            <div className="admin-form-col-hint">{t.lhMajor}</div>
          </div>
          <div className="admin-form-field admin-form-field--actions admin-form-field--h-actions">
            <div className="admin-form-actions-inner" style={{ display: "flex", gap: 8 }}>
              <button type="submit">{form.id ? "Módosít" : "Létrehoz"}</button>
              <button type="button" onClick={()=>setShowForm(false)}>Mégse</button>
            </div>
            <div className="admin-form-hint-spacer" aria-hidden="true">.</div>
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
