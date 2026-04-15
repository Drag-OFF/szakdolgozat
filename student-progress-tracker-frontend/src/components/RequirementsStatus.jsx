import React, { useCallback, useEffect, useState } from "react";
import CourseList from "./CourseList";
import { authFetch } from "../utils";
import "../styles/RequirementsStatus.css";
import { useLang } from "../context/LangContext";
import { apiUrl } from "../config";
import { getUserObject, getAccessToken, setUserJson } from "../authStorage";

/**
 * Követelmény nézet:
 * szabályösszegzés + dinamikus kurzuslisták renderelése és frissítése.
 */
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

function displayBucket(r) {
  const rt = String(r.requirement_type || "").trim();
  const sg = String(r.subgroup ?? "").trim();
  if (rt === "practice" || sg === "practice_hours") return "practice";
  return rt || "other";
}

/** Nyers követelménysorok blokkosítása típus szerint, megjelenítési sorrendben. */
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

/** Szabálysorokból fa kapcsolat építése (gyökerek + gyereklista map). */
function buildRuleTreeForRows(rows) {
  const list = Array.isArray(rows) ? [...rows] : [];
  const orderIdx = new Map();
  list.forEach((r, i) => orderIdx.set(r, i));
  const byCode = new Map();
  for (const r of list) {
    const c = String(r.code || "").trim().toUpperCase();
    if (c) byCode.set(c, r);
  }
  const childLists = new Map();
  for (const r of list) {
    const self = String(r.code || "").trim().toUpperCase();
    const pc = String(r.parent_rule_code || "").trim().toUpperCase();
    if (!self) continue;
    if (pc && byCode.has(pc) && pc !== self) {
      if (!childLists.has(pc)) childLists.set(pc, []);
      childLists.get(pc).push(r);
    }
  }
  for (const ch of childLists.values()) {
    ch.sort((a, b) => (orderIdx.get(a) ?? 0) - (orderIdx.get(b) ?? 0));
  }
  const roots = list.filter((r) => {
    const self = String(r.code || "").trim().toUpperCase();
    const pc = String(r.parent_rule_code || "").trim().toUpperCase();
    return !pc || !byCode.has(pc) || pc === self;
  });
  roots.sort((a, b) => (orderIdx.get(a) ?? 0) - (orderIdx.get(b) ?? 0));
  return { roots, childLists };
}

/** Rekurzív render helper a szabályfához tartozó kurzuslistákhoz. */
function renderDynamicCourseListNodes(r, childLists, depth, lang, labels, embedded, openDynamic, setOpenDynamic) {
  const code = String(r.code || "").trim().toUpperCase();
  const kids = code ? childLists.get(code) || [] : [];
  const key = r.id ?? r.code;
  const courses = r.available_courses || [];
  const out = [];
  const isOpen = !!openDynamic[key];

  if (courses.length > 0) {
    out.push(
      <div
        key={`cl-${key}`}
        className={depth > 0 ? "req-dynamic-courselist-nested" : undefined}
      >
        <CourseList
          courses={courses}
          title={`${r.label || r.code} - ${labels.available}`}
          defaultOpen={isOpen}
          setDefaultOpen={(updater) => {
            setOpenDynamic((prev) => {
              const cur = !!prev[key];
              const nextVal = typeof updater === "function" ? updater(cur) : !!updater;
              return { ...prev, [key]: !!nextVal };
            });
          }}
        />
      </div>
    );
  } else if (depth === 0 && kids.length === 0 && Number(r.missing) > 0) {
    out.push(
      <div key={`noc-${key}`} className="req-rule-no-courses" style={{ marginLeft: Math.min(depth * 14, 42) }}>
        <span className="req-rule-no-courses-label">{r.label || r.code}</span>
        {" — "}
        {lang === "en"
          ? "No courses are currently listed for this rule."
          : "Ehhez a szabályhoz jelenleg nincs listázható kurzus."}
      </div>
    );
  }

  for (const k of kids) {
    out.push(
      ...renderDynamicCourseListNodes(k, childLists, depth + 1, lang, labels, embedded, openDynamic, setOpenDynamic)
    );
  }
  return out;
}

function renderDynamicCourseListsInTreeOrder(rows, lang, labels, embedded, openDynamic, setOpenDynamic) {
  const groups = groupRequirementsBySection(rows);
  const blocks = [];
  for (const g of groups) {
    const tree = buildRuleTreeForRows(g.rows);
    for (const root of tree.roots) {
      blocks.push(
        ...renderDynamicCourseListNodes(root, tree.childLists, 0, lang, labels, embedded, openDynamic, setOpenDynamic)
      );
    }
  }
  return blocks;
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

function unitLabelForGroup(groupRows, lang) {
  if (!groupRows.length) return "";
  const types = [...new Set(groupRows.map(r => String(r.value_type || "credits").toLowerCase()))];
  if (types.length !== 1) return lang === "en" ? " (mixed units)" : " (vegyes mérték)";
  const v = types[0];
  if (v === "hours") return lang === "en" ? " h" : " ó";
  if (v === "count") return lang === "en" ? " (count)" : " db";
  return lang === "en" ? " cr" : " kr";
}

function renderTotalsTreeNode(r, childLists, lang, renderRowNums, unitLabelForGroup) {
  const code = String(r.code || "").trim().toUpperCase();
  const kids = code ? childLists.get(code) || [] : [];
  const unit = unitLabelForGroup([r], lang);
  const rowTitle = (r.label || r.code || "").trim();
  const rowKey = r.id ?? r.code ?? rowTitle;

  if (kids.length === 0) {
    return (
      <li key={rowKey} className="req-group-totals-subitem">
        <span className="req-group-totals-cat req-group-totals-cat--sub">{rowTitle}</span>
        {renderRowNums(r, unit)}
      </li>
    );
  }
  return (
    <li key={rowKey} className="req-group-totals-nest">
      <div className="req-group-totals-subitem req-group-totals-subitem--parent">
        <span className="req-group-totals-cat req-group-totals-cat--sub">{rowTitle}</span>
        {renderRowNums(r, unit)}
      </div>
      <ul className="req-group-totals-sublist req-group-totals-sublist--nested">
        {kids.map((k) => renderTotalsTreeNode(k, childLists, lang, renderRowNums, unitLabelForGroup))}
      </ul>
    </li>
  );
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
        {groups.map((g) => {
          const sectionLabel = sectionTitleForType(g.type, lang);
          const tree = buildRuleTreeForRows(g.rows);
          const hasNesting = tree.roots.some((r) => {
            const c = String(r.code || "").trim().toUpperCase();
            return c && (tree.childLists.get(c) || []).length > 0;
          });
          const multi = g.rows.length > 1 || hasNesting;

          if (multi) {
            return (
              <li key={g.type} className="req-group-totals-item req-group-totals-item--group">
                <div className="req-group-totals-group-head">{sectionLabel}</div>
                <ul className="req-group-totals-sublist">
                  {tree.roots.map((r) =>
                    renderTotalsTreeNode(r, tree.childLists, lang, renderRowNums, unitLabelForGroup)
                  )}
                </ul>
              </li>
            );
          }

          const r = g.rows[0];
          const unit = unitLabelForGroup(g.rows, lang);
          const rowTitle = (r.label || r.code || "").trim() || sectionLabel;
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

function renderDynamicTableRuleRows(r, childLists, lang, t, depth) {
  const code = String(r.code || "").trim().toUpperCase();
  const kids = code ? childLists.get(code) || [] : [];
  const namedSg = hasNamedSubgroup(r.subgroup);
  const elective = r.requirement_type === "elective";
  const ex = excessForRow(r);
  const hint = electiveRowHint(r, lang);
  const rowClass = [
    "req-data-row",
    depth > 0 ? "req-rule-nested-child" : "",
    kids.length > 0 ? "req-rule-nested-parent" : "",
    namedSg ? "req-rule-subgroup-row" : "",
    elective && namedSg ? "req-rule-elective-block" : "",
    elective && !namedSg ? "req-rule-elective-inner" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const indentExtra =
    depth > 0 ? " req-cat-indent req-cat-indent-dynamic" : namedSg ? " req-cat-indent" : "";
  const deepElective = elective && namedSg ? " req-cat-indent--deep" : "";
  const out = [
    <tr key={r.id || r.code || r.label} className={rowClass}>
      <td className={`cat${indentExtra}${deepElective}`}>
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
  ];
  for (const k of kids) {
    out.push(...renderDynamicTableRuleRows(k, childLists, lang, t, depth + 1));
  }
  return out;
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
          {groups.map((g) => {
            const tree = buildRuleTreeForRows(g.rows);
            return (
              <React.Fragment key={g.type}>
                <tr className="req-section-header-row">
                  <td colSpan={4}>{sectionTitleForType(g.type, lang)}</td>
                </tr>
                {tree.roots.flatMap((r) => renderDynamicTableRuleRows(r, tree.childLists, lang, t, 0))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Hallgatói követelményteljesítés és hiánylista fő komponense. */
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
        thesis2: "Thesis 2",
        specLegend: "Specialization (MK tree)",
        specHint: "Only one branch applies. Pick the track you follow; requirements from other branches are hidden.",
        specAll: "All branches (no filter)",
        specNone: "No specialization (common differentiated only)",
        specSaveError: "Could not save specialization.",
        specSaving: "Saving…"
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
        thesis2: "Szakdolgozat 2",
        specLegend: "Specializáció (MK fa)",
        specHint: "Egyszerre csak egy ág érvényes. Válaszd a saját szakirányod; a többi ág követelményei elrejtődnek.",
        specAll: "Minden ág (nincs szűrés)",
        specNone: "Specializáció nélkül (csak közös differenciált)",
        specSaveError: "A specializáció mentése sikertelen.",
        specSaving: "Mentés…"
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
  const [specSaving, setSpecSaving] = useState(false);
  const [specErr, setSpecErr] = useState("");

  const loadRequirements = useCallback(
    (opts) => {
      if (!user.id) return Promise.resolve();
      const silent = !!(opts && opts.silent);
      if (!silent) setLoading(true);
      return authFetch(apiUrl(`/api/progress/${user.id}/requirements?lang=${lang || "hu"}`), {
        headers: { Authorization: `Bearer ${getAccessToken()}` }
      })
        .then(res => res.json().catch(() => null))
        .then(data => {
          setReq(data || null);
          if (!silent) setLoading(false);
        })
        .catch(() => {
          setReq(null);
          if (!silent) setLoading(false);
        });
    },
    [user.id, lang]
  );

  useEffect(() => {
    if (!user.id) return;
    loadRequirements();
  }, [user.id, lang, loadRequirements]);

  async function saveSpecializationChoice(code) {
    if (!user.id) return;
    setSpecErr("");
    setSpecSaving(true);
    try {
      const body = code == null ? {} : { code };
      const res = await authFetch(apiUrl("/api/users/me/specialization"), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSpecErr((data && data.detail) || t.specSaveError);
        setSpecSaving(false);
        return;
      }
      const u = getUserObject();
      setUserJson({
        ...u,
        chosen_specialization_code: data.chosen_specialization_code ?? null
      });
      await loadRequirements({ silent: true });
    } catch {
      setSpecErr(t.specSaveError);
    } finally {
      setSpecSaving(false);
    }
  }

  if (!user.id) return <div className="auth-msg">{t.loginRequired}</div>;
  if (loading) return <div>{t.loading}</div>;
  if (!req) return <div>{t.loadError}</div>;

  if (req.mode === "dynamic" && Array.isArray(req.requirements)) {
    const dynRows = req.requirements;
    const specValue = req.chosen_specialization_code ?? null;
    const branches = Array.isArray(req.specialization_branches) ? req.specialization_branches : [];
    const showSpecPicker = branches.length > 0;
    const specOptions = showSpecPicker
      ? [
          { code: null, label: t.specAll },
          { code: "NONE", label: t.specNone },
          ...branches.map((b) => ({
            code: b.code,
            label: lang === "en" && b.label_en ? b.label_en : (b.label_hu || b.code)
          }))
        ]
      : [];
    return (
      <div className={statusRootClass}>
        {!embedded && <h2>{t.title}</h2>}
        {showSpecPicker ? (
          <fieldset className="req-spec-fieldset" disabled={specSaving}>
            <legend>{t.specLegend}</legend>
            <p className="req-spec-hint">{t.specHint}</p>
            {specOptions.map((opt) => (
              <label key={String(opt.code)} className="req-spec-option">
                <input
                  type="radio"
                  name="chosen-mk-spec"
                  checked={
                    (specValue == null && opt.code == null) ||
                    (specValue != null && opt.code != null && String(specValue) === String(opt.code))
                  }
                  onChange={() => saveSpecializationChoice(opt.code)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
            {specSaving ? <div className="req-spec-saving">{t.specSaving}</div> : null}
            {specErr ? <div className="req-spec-err">{specErr}</div> : null}
          </fieldset>
        ) : null}
        <DynamicGroupSummaryTotals rows={dynRows} lang={lang} />
        <DynamicSummaryTable rows={dynRows} lang={lang} />

        <div className="req-dynamic-courselists">
          {renderDynamicCourseListsInTreeOrder(dynRows, lang, t, embedded, openDynamic, setOpenDynamic)}
        </div>
      </div>
    );
  }

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
      <SummaryTable data={req?.summary || summaryData} lang={lang} />

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