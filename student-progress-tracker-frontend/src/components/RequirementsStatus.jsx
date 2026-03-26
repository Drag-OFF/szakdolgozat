import React, { useEffect, useState } from "react";
import CourseList from "./CourseList";
import { authFetch } from "../utils";
import "../styles/RequirementsStatus.css";
import { useLang } from "../context/LangContext";
import { apiUrl } from "../config";
import { getUserObject, getAccessToken } from "../authStorage";

function CreditRow({ title, data }) {
  const d = data || { completed: 0, required: 0, missing: 0 };
  return (
    <tr>
      <td>{title}</td>
      <td>{d.completed}</td>
      <td>{d.required}</td>
      <td>{d.missing}</td>
    </tr>
  );
}

function SummaryTable({ data, lang }) {
  const t = lang === "en"
    ? {
        aria: "Requirements summary",
        category: "Category",
        completed: "Completed",
        required: "Required",
        missing: "Missing",
        total: "Total credits",
        core: "Required",
        coreElective: "Core elective",
        free: "Free elective",
        pe: "Physical education semesters",
        practice: "Internship hours"
      }
    : {
        aria: "Követelmények összegzés",
        category: "Kategória",
        completed: "Teljesített",
        required: "Szükséges",
        missing: "Hiányzik",
        total: "Összes kredit",
        core: "Kötelező",
        coreElective: "Kötelezően választható",
        free: "Szabadon választható",
        pe: "Testnevelés félévek",
        practice: "Szakmai gyakorlat"
      };
  const rows = [
    { key: "total", label: t.total },
    { key: "core", label: t.core },
    { key: "core_elective", label: t.coreElective },
    { key: "free", label: t.free },
    { key: "pe", label: t.pe },
    { key: "practice", label: t.practice }
  ];

  const asNumber = v => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === "number" || typeof v === "string") return v;
    // ha objektum jön (pl. {completed, required} vagy {value: 5}), próbáljuk kihámozni a számot
    if (typeof v === "object") {
      return v.completed ?? v.value ?? v.count ?? v.total ?? undefined;
    }
    return undefined;
  };

  const safe = v => (v === null || v === undefined ? "-" : v);

  return (
    <div className="req-summary">
      <table className="req-summary-table" role="table" aria-label={t.aria}>
        <thead>
          <tr>
            <th>{t.category}</th>
            <th>{t.completed}</th>
            <th>{t.required}</th>
            <th>{t.missing}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const item = data?.[r.key];
            const completed = asNumber(item?.completed ?? item) ?? asNumber(data?.[`completed_${r.key}`]) ?? asNumber(data?.[`completed${r.key}`]);
            const required = asNumber(item?.required) ?? asNumber(data?.[`required_${r.key}`]) ?? asNumber(data?.[`required${r.key}`]);
            const missing = asNumber(item?.missing) ?? (required !== undefined && completed !== undefined ? (required - completed) : undefined);
            return (
              <tr key={r.key}>
                <td className="cat">{r.label}</td>
                <td className="num">{safe(completed)}</td>
                <td className="num">{safe(required)}</td>
                <td className="num missing">{safe(missing)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function hasNamedSubgroup(sg) {
  const s = String(sg ?? "").trim();
  return s.length > 0 && s !== "__NULL__";
}

function excessForRow(r) {
  if (r.excess != null && !Number.isNaN(Number(r.excess))) return Math.max(0, Number(r.excess));
  const c = Number(r.completed ?? 0);
  const req = Number(r.required ?? 0);
  return Math.max(0, c - req);
}

/** Fő csoport a táblázat sorrendjéhez (backend logikával egyezően). */
function displayBucket(r) {
  const rt = String(r.requirement_type || "").trim();
  const sg = String(r.subgroup ?? "").trim();
  if (rt === "practice" || sg === "practice_hours") return "practice";
  return rt || "other";
}

function groupRequirementsBySection(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const groups = [];
  let cur = null;
  for (const r of list) {
    const typeKey = displayBucket(r);
    if (!cur || cur.type !== typeKey) {
      cur = { type: typeKey, rows: [] };
      groups.push(cur);
    }
    cur.rows.push(r);
  }
  return groups;
}

function sectionTitleForType(typeKey, lang) {
  const m = {
    required: { hu: "Kötelező", en: "Required" },
    elective: { hu: "Kötelezően választható", en: "Compulsory elective" },
    optional: { hu: "Szabadon választható", en: "Free elective" },
    pe: { hu: "Testnevelés", en: "Physical education" },
    practice: { hu: "Szakmai gyakorlat", en: "Internship / practice" },
    other: { hu: "Egyéb", en: "Other" }
  };
  const x = m[typeKey] || m.other;
  return lang === "en" ? x.en : x.hu;
}

/** Egy csoporton belüli szabályokhoz: ha mind ugyanaz a mérték, megjeleníthető utótag. */
function unitLabelForGroup(groupRows, lang) {
  if (!groupRows.length) return "";
  const types = [...new Set(groupRows.map(r => String(r.value_type || "credits").toLowerCase()))];
  if (types.length !== 1) return lang === "en" ? " (mixed units)" : " (vegyes mérték)";
  const v = types[0];
  if (v === "hours") return lang === "en" ? " h" : " ó";
  if (v === "count") return lang === "en" ? " (count)" : " db";
  return lang === "en" ? " cr" : " kr";
}

function DynamicGroupSummaryTotals({ rows, lang }) {
  const groups = groupRequirementsBySection(rows);
  const t = lang === "en"
    ? {
        title: "At a glance — main categories",
        missing: "Missing (total)",
        over: "Over (total)",
        noneShort: "Nothing missing",
        foot: "Per-rule breakdown is in the table below."
      }
    : {
        title: "Gyors összesítés — fő kategóriák",
        missing: "Hiány összesen",
        over: "Túlteljesítés összesen",
        noneShort: "Nincs hiány",
        foot: "Szabályonkénti részletek lent a táblázatban."
      };

  const renderRowNums = (r, unit) => {
    const sumMissing = Number(r.missing ?? 0);
    const sumExcess = excessForRow(r);
    return (
      <span className="req-group-totals-nums">
        {sumMissing > 0 ? (
          <span className="req-group-totals-miss">
            {t.missing}: {sumMissing}
            {unit}
          </span>
        ) : (
          <span className="req-group-totals-ok">{t.noneShort}</span>
        )}
        {sumExcess > 0 ? (
          <span className="req-group-totals-over">
            {" · "}
            {t.over}: +{sumExcess}
            {unit}
          </span>
        ) : null}
      </span>
    );
  };

  return (
    <div className="req-group-totals" role="region" aria-label={t.title}>
      <h3 className="req-group-totals-title">{t.title}</h3>
      <ul className="req-group-totals-list">
        {groups.map(g => {
          const sectionLabel = sectionTitleForType(g.type, lang);
          const multi = g.rows.length > 1;

          if (multi) {
            return (
              <li key={g.type} className="req-group-totals-item req-group-totals-item--group">
                <div className="req-group-totals-group-head">{sectionLabel}</div>
                <ul className="req-group-totals-sublist">
                  {g.rows.map(r => {
                    const unit = unitLabelForGroup([r], lang);
                    const rowKey = r.id ?? r.code ?? `${g.type}-${r.label}`;
                    const rowTitle = (r.label || r.code || "").trim() || sectionLabel;
                    return (
                      <li key={rowKey} className="req-group-totals-subitem">
                        <span className="req-group-totals-cat req-group-totals-cat--sub">{rowTitle}</span>
                        {renderRowNums(r, unit)}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          }

          const r = g.rows[0];
          const unit = unitLabelForGroup(g.rows, lang);
          const rowTitle =
            (r.label || r.code || "").trim() || sectionLabel;
          return (
            <li key={g.type} className="req-group-totals-item">
              <span className="req-group-totals-cat">{rowTitle}</span>
              {renderRowNums(r, unit)}
            </li>
          );
        })}
      </ul>
      <p className="req-group-totals-foot">{t.foot}</p>
    </div>
  );
}

/** Rövid alcím csak kötvál sorokhoz — mi számít bele. */
function electiveRowHint(r, lang) {
  if (r.requirement_type !== "elective") return null;
  const raw = r.subgroup;
  if (raw == null || String(raw).trim() === "") {
    return lang === "en" ? "All compulsory-elective courses (no subgroup filter)" : "Minden kötvál kurzus (nincs alcsoport-szűrés)";
  }
  if (String(raw).trim() === "__NULL__") {
    return lang === "en" ? "Only courses with no subgroup tag" : "Csak alcsoport nélküli kötvál kurzusok";
  }
  return lang === "en" ? `Block: ${raw}` : `Blokk: ${raw}`;
}

function DynamicSummaryTable({ rows, lang }) {
  const t = lang === "en"
    ? {
        aria: "Dynamic requirements summary",
        category: "Category",
        completed: "Completed",
        required: "Required",
        missing: "Missing",
        overFulfillment: "over target"
      }
    : {
        aria: "Dinamikus követelmények összegzés",
        category: "Kategória",
        completed: "Teljesített",
        required: "Szükséges",
        missing: "Hiányzik",
        overFulfillment: "túlteljesítés"
      };
  const groups = groupRequirementsBySection(rows);
  return (
    <div className="req-summary">
      <table className="req-summary-table req-summary-table--grouped" role="table" aria-label={t.aria}>
        <thead>
          <tr>
            <th>{t.category}</th>
            <th>{t.completed}</th>
            <th>{t.required}</th>
            <th>{t.missing}</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(g => (
            <React.Fragment key={g.type}>
              <tr className="req-section-header-row">
                <td colSpan={4}>{sectionTitleForType(g.type, lang)}</td>
              </tr>
              {g.rows.map(r => {
                const namedSg = hasNamedSubgroup(r.subgroup);
                const elective = r.requirement_type === "elective";
                const ex = excessForRow(r);
                const hint = electiveRowHint(r, lang);
                const rowClass = [
                  "req-data-row",
                  namedSg ? "req-rule-subgroup-row" : "",
                  elective && namedSg ? "req-rule-elective-block" : "",
                  elective && !namedSg ? "req-rule-elective-inner" : ""
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <tr key={r.id || r.code || r.label} className={rowClass}>
                    <td className={`cat${namedSg ? " req-cat-indent" : ""}${elective && namedSg ? " req-cat-indent--deep" : ""}`}>
                      <div className="req-cat-title">{r.label || r.code}</div>
                      {hint ? <div className="req-cat-hint">{hint}</div> : null}
                    </td>
                    <td className="num">{r.completed ?? 0}</td>
                    <td className="num">{r.required ?? 0}</td>
                    <td className="num">
                      {ex > 0 ? (
                        <span className="req-over-fulfill" title={t.overFulfillment}>
                          +{ex}
                        </span>
                      ) : (
                        <span className={(r.missing ?? 0) > 0 ? "req-missing-short" : "req-missing-ok"}>
                          {r.missing ?? 0}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RequirementsStatus({ embedded = false }) {
  const user = getUserObject();
  const statusRootClass = embedded
    ? "requirements-status requirements-status--embedded"
    : "requirements-status";
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();
  const t = lang === "en"
    ? {
        loginRequired: "Sign in to view requirements.",
        loading: "Loading...",
        loadError: "Failed to load requirements.",
        title: "Requirements status",
        available: "available courses",
        requiredCourses: "Required courses",
        core: "Core elective",
        infoCore: "Core elective - IT core",
        nonCore: "Core elective - Non-core",
        optional: "Free elective",
        pe: "Physical education",
        practice: "Internship",
        thesis1: "Thesis 1",
        thesis2: "Thesis 2"
      }
    : {
        loginRequired: "Jelentkezz be a követelmények megtekintéséhez!",
        loading: "Betöltés...",
        loadError: "Nem sikerült lekérni a követelményeket.",
        title: "Követelmények állapota",
        available: "elérhető kurzusok",
        requiredCourses: "Kötelező tárgyak",
        core: "Kötelezően választható - Törzsanyag",
        infoCore: "Kötelezően választható - Informatikai törzsanyag",
        nonCore: "Kötelezően választható - Nem törzsanyag",
        optional: "Szabadon választható",
        pe: "Testnevelés",
        practice: "Szakmai gyakorlat",
        thesis1: "Szakdolgozat 1",
        thesis2: "Szakdolgozat 2"
      };

  const [openRequired, setOpenRequired] = useState(false);
  const [openCore, setOpenCore] = useState(false);
  const [openInfoCore, setOpenInfoCore] = useState(false);
  const [openNonCore, setOpenNonCore] = useState(false);
  const [openOptional, setOpenOptional] = useState(false);
  const [openPE, setOpenPE] = useState(false);
  const [openPractice, setOpenPractice] = useState(false);
  const [openThesis1, setOpenThesis1] = useState(false);
  const [openThesis2, setOpenThesis2] = useState(false);
  const [openDynamic, setOpenDynamic] = useState({});

  useEffect(() => {
    if (!user.id) return;
    setLoading(true);
    // kérjük a backendet a jelenlegi nyelv szerint, így minden adat lokalizált lesz
    authFetch(apiUrl(`/api/progress/${user.id}/requirements?lang=${lang || "hu"}`), {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    })
      .then(res => res.json().catch(() => null))
      .then(data => {
        setReq(data || null);
        setLoading(false);
      })
      .catch(() => {
        setReq(null);
        setLoading(false);
      });
  }, [user.id, lang]);

  if (!user.id) return <div className="auth-msg">{t.loginRequired}</div>;
  if (loading) return <div>{t.loading}</div>;
  if (!req) return <div>{t.loadError}</div>;

  // Új, dinamikus szabály alapú működés (szakonként eltérő oszlopok/kategóriák).
  if (req.mode === "dynamic" && Array.isArray(req.requirements)) {
    const dynRows = req.requirements;
    return (
      <div className={statusRootClass}>
        {!embedded && <h2>{t.title}</h2>}
        <DynamicGroupSummaryTotals rows={dynRows} lang={lang} />
        <DynamicSummaryTable rows={dynRows} lang={lang} />

        {dynRows.map(r => (
          <CourseList
            key={r.id || r.code}
            courses={r.available_courses || []}
            title={`${r.label || r.code} - ${t.available}`}
            defaultOpen={!!openDynamic[r.id || r.code]}
            setDefaultOpen={(updater) => {
              const key = r.id || r.code;
              setOpenDynamic(prev => {
                const current = !!prev[key];
                const nextValue = typeof updater === "function" ? updater(current) : !!updater;
                return { ...prev, [key]: !!nextValue };
              });
            }}
          />
        ))}
      </div>
    );
  }

  // biztonságos fallback-ek a hiányzó mezőkre
  const safe = {
    total_credits: req.total_credits || { completed: 0, required: 0, missing: 0 },
    required_credits: req.required_credits || { completed: 0, required: 0, missing: 0, available_courses: [] },
    elective_credits: req.elective_credits || {},
    optional_credits: req.optional_credits || { available_courses: [] },
    pe_semesters: req.pe_semesters || { available_courses: [] },
    practice_hours: req.practice_hours || { available_courses: [] },
    available_thesis1: Array.isArray(req.available_thesis1) ? req.available_thesis1 : [],
    available_thesis2: Array.isArray(req.available_thesis2) ? req.available_thesis2 : []
  };

  const electiveCoreCourses = safe.elective_credits.core?.available_courses || [];
  const electiveInfoCoreCourses = safe.elective_credits.core?.info_core?.available_courses || [];
  const electiveNonCoreCourses = safe.elective_credits.non_core?.available_courses || [];

  // debug: ellenőrizzük a backendből érkező struktúrát (távolítsd el később)
  console.log("requirements (raw):", req);

  // normalizált summary objektum a SummaryTable számára (fallback a safe objektumokra)
  const summaryData = {
    total: {
      completed: safe.total_credits.completed,
      required: safe.total_credits.required,
      missing: safe.total_credits.missing
    },
    core: {
      completed: safe.required_credits.completed,
      required: safe.required_credits.required,
      missing: safe.required_credits.missing
    },
    core_elective: {
      completed: (req.elective_credits && req.elective_credits.core && (req.elective_credits.core.completed ?? req.elective_credits.core.count)) ?? (req.core_elective_completed ?? 0),
      required: (req.elective_credits && req.elective_credits.core && (req.elective_credits.core.required ?? req.elective_credits.core.min)) ?? (req.core_elective_required ?? 0)
    },
    free: {
      completed: safe.optional_credits.completed,
      required: safe.optional_credits.required,
      missing: safe.optional_credits.missing
    },
    pe: {
      completed: safe.pe_semesters.completed,
      required: safe.pe_semesters.required,
      missing: safe.pe_semesters.missing
    },
    practice: {
      completed: safe.practice_hours.completed,
      required: safe.practice_hours.required,
      missing: safe.practice_hours.missing
    }
  };

  return (
    <div className={statusRootClass}>
      {!embedded && <h2>{t.title}</h2>}
      {/* összegző táblázat — használd a backend által visszaadott req.summary vagy a fő req objektumot */}
      <SummaryTable data={req?.summary || summaryData} lang={lang} />

      {/* A régi, dupla táblázat eltávolítva - csak a SummaryTable jelenik meg */}

      <CourseList
        courses={safe.required_credits.available_courses || []}
        title={`${t.requiredCourses} - ${t.available}`}
        defaultOpen={openRequired}
        setDefaultOpen={setOpenRequired}
      />
      <CourseList
        courses={electiveCoreCourses}
        title={t.core}
        defaultOpen={openCore}
        setDefaultOpen={setOpenCore}
      />
      <CourseList
        courses={electiveInfoCoreCourses}
        title={t.infoCore}
        defaultOpen={openInfoCore}
        setDefaultOpen={setOpenInfoCore}
      />
      <CourseList
        courses={electiveNonCoreCourses}
        title={t.nonCore}
        defaultOpen={openNonCore}
        setDefaultOpen={setOpenNonCore}
      />
      <CourseList
        courses={safe.optional_credits.available_courses || []}
        title={`${t.optional} - ${t.available}`}
        defaultOpen={openOptional}
        setDefaultOpen={setOpenOptional}
      />
      <CourseList
        courses={safe.pe_semesters.available_courses || []}
        title={`${t.pe} - ${t.available}`}
        defaultOpen={openPE}
        setDefaultOpen={setOpenPE}
      />
      <CourseList
        courses={safe.practice_hours.available_courses || []}
        title={`${t.practice} - ${t.available}`}
        defaultOpen={openPractice}
        setDefaultOpen={setOpenPractice}
      />
      <CourseList
        courses={safe.available_thesis1}
        title={`${t.thesis1} - ${t.available}`}
        defaultOpen={openThesis1}
        setDefaultOpen={setOpenThesis1}
      />
      <CourseList
        courses={safe.available_thesis2}
        title={`${t.thesis2} - ${t.available}`}
        defaultOpen={openThesis2}
        setDefaultOpen={setOpenThesis2}
      />
    </div>
  );
}