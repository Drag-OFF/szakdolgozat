// ...existing code...
import React, { useEffect, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import Autocomplete from "../common/Autocomplete";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";

const API_BASE = "http://enaploproject.ddns.net:8000";
const PAGE_SIZE = 10;

export default function CourseMajorPanel() {
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
  const [form, setForm] = useState({ id:null, course_id:"", major_id:"", credit:0, semester:0, type:"required", subgroup:"", prerequisites:[] });
  const [prereqError, setPrereqError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [cmRes, crRes, mjRes] = await Promise.all([
        authFetch(`${API_BASE}/api/course_major?limit=10000`),
        authFetch(`${API_BASE}/api/courses?limit=10000`),
        authFetch(`${API_BASE}/api/majors?limit=10000`)
      ]);
      const cm = await cmRes.json().catch(()=>[]);
      const cr = await crRes.json().catch(()=>[]);
      const mj = await mjRes.json().catch(()=>[]);
      setItems(Array.isArray(cm)?cm:[]);
      setCourses(Array.isArray(cr)?cr:[]);
      setMajors(Array.isArray(mj)?mj:[]);
      setPage(0);
      setSelectedId(null);
    } catch (e) { console.error(e); setItems([]); } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, [authFetch]);

  // helperok előre, hogy a keresés tudja használni a kurzus/szak neveket a course_id/major_id alapján
  const courseLabel = id => {
    const c = courses.find(x => String(x.id) === String(id) || String(x.course_code) === String(id));
    return c ? `${c.course_code} — ${c.name || ""}` : String(id || "");
  };
  const majorLabel = id => {
    const m = majors.find(x => String(x.id) === String(id));
    return m ? (m.name || m.title || "") : String(id || "");
  };

  const filtered = items.filter(i => {
    const q = String(query || "").toLowerCase().trim();
    if (!q) return true;

    // direct fields
    const prereqStr = Array.isArray(i.prerequisites) ? i.prerequisites.join(", ") : String(i.prerequisites || "");
    const direct = [
      String(i.id || ""),
      String(i.course_id || ""),
      String(i.major_id || ""),
      String(i.credit || ""),
      String(i.semester || ""),
      String(i.type || ""),
      prereqStr
    ].map(s => String(s).toLowerCase());
    if (direct.some(v => v.includes(q))) return true;

    // lookup related course and major objects and search their fields (ez adja az Autocomplete-hez hasonló viselkedést)
    const courseObj = courses.find(c => String(c.id) === String(i.course_id) || String(c.course_code) === String(i.course_id));
    if (courseObj) {
      const code = String(courseObj.course_code || "").toLowerCase();
      const name = String(courseObj.name || "").toLowerCase();
      if (code.includes(q) || name.includes(q)) return true;
    } else {
      // ha a course_id maga tartalmazhat kódot
      if (String(i.course_id || "").toLowerCase().includes(q)) return true;
    }

    const majorObj = majors.find(m => String(m.id) === String(i.major_id));
    if (majorObj) {
      const mname = String(majorObj.name || majorObj.title || "").toLowerCase();
      if (mname.includes(q)) return true;
    } else {
      if (String(i.major_id || "").toLowerCase().includes(q)) return true;
    }

    return false;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(()=>{ if (page >= totalPages) setPage(Math.max(0,totalPages-1)); }, [filtered.length, totalPages]);
  const displayed = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => { setForm({ id:null, course_id:"", major_id:"", credit:0, semester:0, type:"required", subgroup:"", prerequisites:[] }); setShowForm(true); window.scrollTo({top:0}); };
  const openEdit = () => {
    if (!selectedId) return alert("Válassz rekordot");
    const r = items.find(x=>String(x.id)===String(selectedId));
    if (!r) return alert("Nincs ilyen rekord");
    let prereq = [];
    if (Array.isArray(r.prerequisites)) prereq = r.prerequisites;
    else if (typeof r.prerequisites === "string") {
      try { prereq = JSON.parse(r.prerequisites); if (!Array.isArray(prereq)) prereq = String(r.prerequisites).split(",").map(s=>s.trim()).filter(Boolean); }
      catch(e) { prereq = String(r.prerequisites).split(",").map(s=>s.trim()).filter(Boolean); }
    } else if (r.prerequisites) {
      prereq = [String(r.prerequisites)];
    }
    setForm({ id:r.id, course_id:String(r.course_id), major_id:String(r.major_id), credit:r.credit||0, semester:r.semester||0, type:r.type||"required", subgroup:r.subgroup||"", prerequisites: prereq });
    setShowForm(true); window.scrollTo({top:0});
  };

  // validate a single prereq token (allow letters, digits, underscore, hyphen)
  const isValidPrereqToken = (t) => {
    if (!t) return true;
    return /^[A-Za-z0-9_\-]+$/.test(t);
  };

  // sanitize input string -> array: trim spaces around commas and entries, remove empty entries
  const parsePrereqString = (s) => {
    return String(s||"").split(",").map(x=>x.trim()).filter(Boolean);
  };

  // handler for prerequisites input change (keeps array in form and validates)
  const onPrereqChange = (raw) => {
    const arr = Array.isArray(raw) ? raw : parsePrereqString(raw);
    // validate tokens
    const bad = arr.find(token => !isValidPrereqToken(token));
    if (bad) setPrereqError(`Nem megengedett karakter a(z) "${bad}" tokenben. Csak betűk, számok, '_' és '-' engedélyezett.`);
    else setPrereqError("");
    setForm(f => ({ ...f, prerequisites: arr }));
  };

  const submit = async (e) => {
    e?.preventDefault();
    try {
      // final validation before submit
      const cleaned = (form.prerequisites || []).map(s=>String(s).trim()).filter(Boolean);
      const bad = cleaned.find(token => !isValidPrereqToken(token));
      if (bad) {
        setPrereqError(`Nem megengedett karakter a(z) "${bad}" tokenben. Javítsd a mezőt.`);
        return;
      }

      const payload = {
        course_id: Number(form.course_id),
        major_id: Number(form.major_id),
        credit: Number(form.credit),
        semester: Number(form.semester),
        type: form.type,
        subgroup: form.subgroup || null,
        // backend vár stringet: JSON string of array (kezdésként). Ha kell, módosítható join(",")
        prerequisites: JSON.stringify(cleaned)
      };
      const url = form.id ? `${API_BASE}/api/course_major/${encodeURIComponent(form.id)}` : `${API_BASE}/api/course_major`;
      const method = form.id ? "PUT" : "POST";
      const res = await authFetch(url, { method, headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (res.ok) { setShowForm(false); await load(); } else { alert("Mentés sikertelen"); }
    } catch (e) { console.error(e); alert("Hiba"); }
  };

  const remove = async () => {
    if (!selectedId) return alert("Válassz rekordot");
    if (!confirm("Biztos törlöd?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/course_major/${encodeURIComponent(selectedId)}`, { method:"DELETE" });
      if (res.ok) await load(); else alert("Törlés sikertelen");
    } catch (e) { console.error(e); alert("Hiba"); }
  };

  return (
    <div className="admin-panel">
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
          <Autocomplete items={majors} idKey="id" value={form.major_id} onChange={v=>setForm(f=>({...f,major_id:v}))} labelFn={m=>m.name||m.title} placeholder="Szak..." minChars={1} />
          <input placeholder="Credit" type="number" value={form.credit} onChange={e=>setForm(f=>({...f,credit:e.target.value}))} />
          <input placeholder="Félév" type="number" value={form.semester} onChange={e=>setForm(f=>({...f,semester:e.target.value}))} />
          <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
            <option value="required">Kötelező</option><option value="elective">Kötelezően választható</option><option value="optional">Választható</option>
          </select>
          <input placeholder="Alcsoport" value={form.subgroup||""} onChange={e=>setForm(f=>({...f,subgroup:e.target.value||""}))} />
          <input
            placeholder='Előfeltételek (pl.: MBNXK262E, COMP101) — vesszővel'
            value={(form.prerequisites||[]).join(", ")}
            onChange={e=>onPrereqChange(e.target.value)}
            style={{
              height: 46,
              padding: "8px 10px",
              width: "30%",
              maxWidth: 400,
              boxSizing: "border-box",
              borderRadius: 6,
              border: "1px solid #dbeaf8",
            }}
          />
          {prereqError && <div style={{color:"#a33", width:"100%"}}>{prereqError}</div>}
          <div style={{display:"flex",gap:8}}>
            <button type="submit">{form.id ? "Módosít" : "Létrehoz"}</button>
            <button type="button" onClick={()=>{ setShowForm(false); }}>Mégse</button>
          </div>
        </form>
      )}

      <div className="admin-card">
        <div className="admin-card-body">
          <table className="progress-table">
            <thead><tr><th>#</th><th>{lang === "en" ? "Course" : "Kurzus"}</th><th>{lang === "en" ? "Major" : "Szak"}</th><th>{lang === "en" ? "Credit" : "Kredit"}</th><th>{lang === "en" ? "Semester" : "Félév"}</th><th>{lang === "en" ? "Type" : "Típus"}</th><th>{lang === "en" ? "Subgroup" : "Alcsoport"}</th><th>{lang === "en" ? "Prerequisites" : "Előfeltételek"}</th></tr></thead>
            <tbody>
              {displayed.map(i=>{
                const isSel = String(i.id)===String(selectedId);
                return (
                  <tr key={i.id} className={isSel ? "row-selected" : ""} onClick={()=>{ if (!showForm) setSelectedId(prev => (String(prev)===String(i.id)?null:String(i.id))); }} style={{ cursor: showForm ? "default" : "pointer" }}>
                    <td>{i.id}</td>
                    <td>{courseLabel(i.course_id)}</td>
                    <td>{majorLabel(i.major_id)}</td>
                    <td>{i.credit}</td>
                    <td>{i.semester}</td>
                    <td>{i.type}</td>
                    <td>{i.subgroup}</td>
                    <td>{Array.isArray(i.prerequisites)?i.prerequisites.join(", "):(i.prerequisites||"-")}</td>
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