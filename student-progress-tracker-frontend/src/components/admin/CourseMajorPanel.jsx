import React, { useEffect, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import Autocomplete from "../common/Autocomplete";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";
import { API_BASE } from "../../config";
import Button from "../Button";
const PAGE_SIZE = 10;

export default function CourseMajorPanel() {
  const { authFetch } = useAuthFetch();
  const { lang } = useLang();
  const t = lang === "en"
    ? {
        search: "Search...",
        prev: "Prev",
        page: "Page",
        next: "Next",
        total: "records total",
        howLinkWorks:
          "To tag a course as e.g. math elective: (1) Add an elective rule with a custom subgroup key (e.g. elective_math). (2) Here set Type = compulsory elective and Subgroup = the same key. Empty subgroup here only matches rules without subgroup filtering.",
        mustMatch: "Spelling must match exactly; typos hide the course from students (even if not completed).",
        fromRules: "Subgroup keys from rules for this major + type (click to fill):",
        noRuleKeys: "No custom subgroup keys in rules for this major and type yet — create the rule first, or type the key manually.",
        lfCourse: "Course",
        lhCourse: "Select the course.",
        tiCourse: "Search by code or name, then pick from the list.",
        lfMajor: "Major",
        lhMajor: "Select the major.",
        tiMajor: "Search and select the major.",
        lfCredit: "Credits",
        lhCredit: "Credit value (integer).",
        tiCredit: "Credit value for this course on this major (whole number).",
        lfSemester: "Semester",
        lhSemester: "Recommended semester.",
        tiSemester: "Recommended semester number for taking this course on this major.",
        lfType: "Type",
        lhType: "Course type (required / elective / optional).",
        tiType: "How this course counts toward the major: compulsory, compulsory elective, or optional.",
        lfSubgroup: "Subgroup (block key)",
        lhSubgroup: "Must match a rule subgroup key.",
        tiSubgroup: "Must match the subgroup key from Major requirement rules for this major and type. See the info box below.",
        phCourse: "Search course…",
        phMajor: "Search major…"
      }
    : {
        search: "Keresés...",
        prev: "Előző",
        page: "Oldal",
        next: "Következő",
        total: "rekord összesen",
        howLinkWorks:
          "Matek (vagy bármilyen) kötvál így kötődik össze: (1) a szabályoknál legyen egy kötvál szabály egyedi alcsoport kulccsal (pl. elective_math). (2) Itt a Típus = kötelezően választható, az Alcsoport mezőbe pedig pontosan ugyanaz a kulcs kerüljön. Üres alcsoport itt csak olyan szabályhoz jó, ahol nincs alcsoport szűrés.",
        mustMatch: "Betűre egyeznie kell; elütésnél a hallgatónál nem látszik elérhetőként (akkor sem, ha még nem teljesítette).",
        fromRules: "Egyedi kulcsok a szabályokból ehhez a szakhoz és típushoz (kattintás = beírás):",
        noRuleKeys: "Ehhez a szakhoz és típushoz még nincs egyedi kulcs a szabályokban — előbb vedd fel a szabályt, vagy írd kézzel az alcsoportot.",
        lfCourse: "Kurzus",
        lhCourse: "Válaszd ki a kurzust.",
        tiCourse: "Keresés kód vagy név alapján, majd választás a listából.",
        lfMajor: "Szak",
        lhMajor: "Válaszd ki a szakot.",
        tiMajor: "Keresés és választás.",
        lfCredit: "Kredit",
        lhCredit: "Kreditérték (egész szám).",
        tiCredit: "Kreditérték ehhez a szakhoz (egész szám).",
        lfSemester: "Félév",
        lhSemester: "Ajánlott félév.",
        tiSemester: "Ajánlott félév száma ehhez a szakhoz.",
        lfType: "Típus",
        lhType: "A kurzus típusa (kötelező / kötvál / választható).",
        tiType: "Hogyan számít a szak felé: kötelező, kötelezően választható vagy választható.",
        lfSubgroup: "Alcsoport (blokk kulcs)",
        lhSubgroup: "Egyezzen a szabály alcsoport kulcsával.",
        tiSubgroup: "Pontosan egyezzen a „Szak követelmény szabályok”-ban megadott alcsoport kulccsal. Lásd az alábbi infó dobozt.",
        phCourse: "Kurzus keresése…",
        phMajor: "Szak keresése…"
      };
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id:null, course_id:"", major_id:"", credit:0, semester:0, type:"required", subgroup:"" });
  const [ruleSubgroupKeys, setRuleSubgroupKeys] = useState([]);

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

  useEffect(() => {
    if (!showForm || !form.major_id) {
      setRuleSubgroupKeys([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch(
          `${API_BASE}/api/major_requirement_rules/by-major/${encodeURIComponent(form.major_id)}`
        );
        const data = await res.json().catch(() => []);
        if (cancelled || !Array.isArray(data)) return;
        const wanted = String(form.type || "");
        const keys = new Set();
        for (const r of data) {
          if (String(r.requirement_type || "") !== wanted) continue;
          const sg = r.subgroup;
          if (sg == null || String(sg).trim() === "") continue;
          if (String(sg).trim() === "__NULL__") continue;
          keys.add(String(sg).trim());
        }
        setRuleSubgroupKeys([...keys].sort((a, b) => a.localeCompare(b)));
      } catch {
        if (!cancelled) setRuleSubgroupKeys([]);
      }
    })();
    return () => { cancelled = true; };
  }, [showForm, form.major_id, form.type, authFetch]);

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

    const direct = [
      String(i.id || ""),
      String(i.course_id || ""),
      String(i.major_id || ""),
      String(i.credit || ""),
      String(i.semester || ""),
      String(i.type || ""),
    ].map(s => String(s).toLowerCase());
    if (direct.some(v => v.includes(q))) return true;

    const courseObj = courses.find(c => String(c.id) === String(i.course_id) || String(c.course_code) === String(i.course_id));
    if (courseObj) {
      const code = String(courseObj.course_code || "").toLowerCase();
      const name = String(courseObj.name || "").toLowerCase();
      if (code.includes(q) || name.includes(q)) return true;
    } else {
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

  const openCreate = () => { setForm({ id:null, course_id:"", major_id:"", credit:0, semester:0, type:"required", subgroup:"" }); setShowForm(true); };
  const openEdit = () => {
    if (!selectedId) return alert("Válassz rekordot");
    const r = items.find(x=>String(x.id)===String(selectedId));
    if (!r) return alert("Nincs ilyen rekord");
    setForm({ id:r.id, course_id:String(r.course_id), major_id:String(r.major_id), credit:r.credit||0, semester:r.semester||0, type:r.type||"required", subgroup:r.subgroup||"" });
    setShowForm(true);
  };

  const submit = async (e) => {
    e?.preventDefault();
    try {
      const payload = {
        course_id: Number(form.course_id),
        major_id: Number(form.major_id),
        credit: Number(form.credit),
        semester: Number(form.semester),
        type: form.type,
        subgroup: form.subgroup || null,
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
        <Button onClick={openCreate} disabled={showForm} variant="success" size="sm">Létrehoz</Button>
        <Button onClick={openEdit} disabled={showForm || !selectedId} variant="warning" size="sm">Szerkeszt</Button>
        <Button onClick={remove} disabled={showForm || !selectedId} variant="danger" size="sm">Töröl</Button>
        <Button onClick={load} disabled={showForm} variant="ghost" size="sm">↻</Button>
      </div>

      {showForm && (
        <form onSubmit={submit}>
          <div className="course-major-form-grid">
            <div className="admin-form-field course-major-field--wide">
              <label className="admin-form-label">
                {t.lfCourse}
                <span className="admin-form-col-hint">{t.lhCourse}</span>
              </label>
              <Autocomplete items={courses} idKey="id" value={form.course_id} onChange={v=>setForm(f=>({...f,course_id:v}))} labelFn={c=>`${c.course_code} — ${c.name||""}`} placeholder={t.phCourse} title={t.tiCourse} minChars={1} />
            </div>
            <div className="admin-form-field course-major-field--wide">
              <label className="admin-form-label">
                {t.lfMajor}
                <span className="admin-form-col-hint">{t.lhMajor}</span>
              </label>
              <Autocomplete items={majors} idKey="id" value={form.major_id} onChange={v=>setForm(f=>({...f,major_id:v}))} labelFn={m=>m.name||m.title} placeholder={t.phMajor} title={t.tiMajor} minChars={1} />
            </div>
            <div className="admin-form-field course-major-field--num">
              <label className="admin-form-label">
                {t.lfCredit}
                <span className="admin-form-col-hint">{t.lhCredit}</span>
              </label>
              <input className="progress-input" type="number" title={t.tiCredit} value={form.credit} onChange={e=>setForm(f=>({...f,credit:e.target.value}))} />
            </div>
            <div className="admin-form-field course-major-field--num">
              <label className="admin-form-label">
                {t.lfSemester}
                <span className="admin-form-col-hint">{t.lhSemester}</span>
              </label>
              <input className="progress-input" type="number" title={t.tiSemester} value={form.semester} onChange={e=>setForm(f=>({...f,semester:e.target.value}))} />
            </div>
            <div className="admin-form-field course-major-field--type">
              <label className="admin-form-label">
                {t.lfType}
                <span className="admin-form-col-hint">{t.lhType}</span>
              </label>
              <select className="progress-input" style={{ minHeight: 36 }} title={t.tiType} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="required">Kötelező</option><option value="elective">Kötelezően választható</option><option value="optional">Választható</option>
              </select>
            </div>
            <div className="admin-form-field course-major-field--subgroup">
              <label className="admin-form-label">
                {t.lfSubgroup}
                <span className="admin-form-col-hint">{t.lhSubgroup}</span>
              </label>
              <input className="progress-input" placeholder={lang === "en" ? "Subgroup (block key)" : "Alcsoport (blokk kulcs)"} title={t.tiSubgroup} value={form.subgroup||""} onChange={e=>setForm(f=>({...f,subgroup:e.target.value||""}))} />
            </div>
          </div>
          <div style={{ width: "100%", fontSize: "0.86rem", color: "#153d5c", lineHeight: 1.45, margin: "4px 0 8px", padding: "10px 12px", background: "#f0f7fc", borderRadius: 8, border: "1px solid #cfe8f5" }}>
            <p style={{ margin: "0 0 8px" }}>{t.howLinkWorks}</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{t.mustMatch}</p>
            {ruleSubgroupKeys.length > 0 ? (
              <>
                <div style={{ marginTop: 10, marginBottom: 6, fontWeight: 600, color: "#0b4f85" }}>{t.fromRules}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ruleSubgroupKeys.map(k => (
                    <Button
                      key={k}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, subgroup: k }))}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid #64b5f6",
                        background: form.subgroup === k ? "#1976d2" : "#e3f2fd",
                        color: form.subgroup === k ? "#fff" : "#0d47a1",
                        cursor: "pointer",
                        fontSize: "0.88rem",
                        fontWeight: 600
                      }}
                      variant={form.subgroup === k ? "primary" : "ghost"}
                      size="sm"
                    >
                      {k}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ marginTop: 10, fontSize: "0.84rem", color: "#5a6b7a" }}>{t.noRuleKeys}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <Button type="submit" variant={form.id ? "warning" : "success"} size="sm">{form.id ? "Módosít" : "Létrehoz"}</Button>
            <Button type="button" onClick={()=>{ setShowForm(false); }} variant="ghost" size="sm">Mégse</Button>
          </div>
        </form>
      )}

      <div className="admin-card">
        <div className="admin-card-body">
          <table className="progress-table">
            <thead><tr><th>#</th><th>{lang === "en" ? "Course" : "Kurzus"}</th><th>{lang === "en" ? "Major" : "Szak"}</th><th>{lang === "en" ? "Credit" : "Kredit"}</th><th>{lang === "en" ? "Semester" : "Félév"}</th><th>{lang === "en" ? "Type" : "Típus"}</th><th>{lang === "en" ? "Subgroup" : "Alcsoport"}</th></tr></thead>
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
