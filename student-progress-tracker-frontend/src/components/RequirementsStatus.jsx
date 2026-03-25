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

function DynamicSummaryTable({ rows, lang }) {
  const t = lang === "en"
    ? {
        aria: "Dynamic requirements summary",
        category: "Category",
        completed: "Completed",
        required: "Required",
        missing: "Missing"
      }
    : {
        aria: "Dinamikus követelmények összegzés",
        category: "Kategória",
        completed: "Teljesített",
        required: "Szükséges",
        missing: "Hiányzik"
      };
  const safeRows = Array.isArray(rows) ? rows : [];
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
          {safeRows.map(r => (
            <tr key={r.id || r.code || r.label}>
              <td className="cat">{r.label || r.code}</td>
              <td className="num">{r.completed ?? 0}</td>
              <td className="num">{r.required ?? 0}</td>
              <td className="num missing">{r.missing ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RequirementsStatus() {
  const user = getUserObject();
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
      <div className="requirements-status">
        <h2>{t.title}</h2>
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
    <div className="requirements-status">
      <h2>{t.title}</h2>
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