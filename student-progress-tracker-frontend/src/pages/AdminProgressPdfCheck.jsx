import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAccessToken } from "../authStorage";
import { useLang } from "../context/LangContext";
import { apiUrl } from "../config";
import useAuthFetch from "../hooks/useAuthFetch";
import Button from "../components/Button";
import "../styles/AdminProgressPdfCheck.css";

/** JWT role kinyerése az admin oldal hozzáférés-ellenőrzéséhez. */
function getRoleFromToken() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]))?.role || null;
  } catch {
    return null;
  }
}

/** Kurzuskódok összehasonlításához agresszív normalizálás (A-Z0-9). */
function compactCourseKey(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** PDF táblázatsor stabil kulcsa (személy + sorindex); mentés / ellenőrzés állapot. */
function pdfCheckRowKey(personKey, idx) {
  return `${personKey}:${idx}`;
}

/** PDF alapú "mi-lenne-ha" ellenőrzés és progress mentés admin felülete. */
export default function AdminProgressPdfCheck() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { authFetch } = useAuthFetch();
  const t = useMemo(
    () =>
      (lang === "en"
        ? {
            title: "PDF Progress What-if Check",
            backToAdmin: "Back to admin",
            blurb:
              "Upload one or more student PDFs. The what-if check does not write by default; after matching a student, “Save to progress” stores the courses for that student.",
            inputLabel: "PDF files (multiple)",
            run: "Analyze PDFs",
            running: "Analyzing...",
            empty: "No files selected.",
            resultTitle: "Result",
            noResult: "No result yet.",
            matchedUser: "Matched user",
            status: "Status",
            notMatched: "No user match by filename.",
            extracted: "Extracted course codes",
            known: "Recognized in database",
            missingCodes: "Unknown course codes",
            beforeMissing: "Missing before",
            afterMissing: "Missing after what-if",
            ready: "Diploma ready after what-if",
            yes: "Yes",
            no: "No",
            missingRules: "Still missing requirements",
            noneMissing: "No missing requirement rows.",
            debugTitle: "Debug (extracted vs database)",
            debugPresent: "Found in database",
            debugMissing: "Missing from database",
            debugExtracted: "Extracted",
            debugNear: "Similar matches in database",
            codeCol: "Code",
            nameCol: "Course name",
            wRows: "Rows with W:x/x/x",
            debugJson: "Extracted JSON",
            copyJson: "Copy JSON",
            copied: "Copied",
            unknownRows: "Not found in database (action needed)",
            allCoursesTitle: "All extracted courses",
            statusCol: "Status",
            inDbStatus: "In database",
            inDbNameMismatchStatus: "Code matches, name differs (database name is used)",
            dbNameLabel: "Database name",
            pdfNameLabel: "PDF name",
            missingStatus: "Missing",
            majorCol: "Major",
            creditCol: "Credit",
            semesterCol: "Semester",
            typeCol: "Type",
            subgroupCol: "Subgroup",
            actionCol: "Action",
            saveRow: "Save course + mapping",
            saving: "Saving...",
            saved: "Saved",
            editRow: "Edit",
            cancelEdit: "Cancel",
            editingNow: "Editing now",
            closeEdit: "Close",
            subgroupHint: "Type new subgroup or pick existing",
            subgroupPlaceholder: "Or type a new subgroup name",
            subgroupPick: "Pick subgroup…",
            unknownOnly: "Only missing from database",
            allRows: "All extracted rows",
            summaryBefore: "Missing before",
            summaryAfter: "Missing after what-if",
            summaryReady: "Diploma status",
            debugDetails: "Technical details (optional)",
            manualNameLabel: "Manual user match",
            manualNamePlaceholder: "Type full student name",
            manualFindBtn: "Search by name parts",
            manualAssignBtn: "Assign selected user",
            manualAssigning: "Assigning...",
            manualFinding: "Searching...",
            manualAssignHint: "Only this person block is recalculated.",
            manualSelectLabel: "Select user",
            manualMotherLabel: "mother's name",
            manualNoCandidates: "No users found (try different words; all parts must match).",
            manualSelectRequired: "Select a user from the list first.",
            errorPrefix: "Error",
            docKindLabel: "Document type (from filename)",
            docKindCompleted: "Completed credits",
            docKindEnrolled: "Enrolled credits",
            docKindMixed: "Mixed",
            docKindUnknown: "Unknown",
            importCompletedBtn: "Save to progress as completed",
            importEnrolledBtn: "Save to progress as in progress",
            importing: "Saving...",
            imported: "Saved to progress",
            importNeedCourses: "Only courses already in the database can be imported; fix missing codes first.",
            importNeedUser: "Match a user first.",
            importDone: "Saved: {created} new, {skipped} skipped (already in progress).",
            rowsShown: "Rows shown",
            rowsShownMissingSuffix: "missing only",
            nameMismatchWarning: "Name mismatch on {count} matched course(s): database names are used when saving.",
            checkRow: "Verify code",
            checkingRow: "Checking...",
            checkAgain: "Verify again",
            checkCodeEmpty: "Enter a course code first.",
            checkFoundConflictHint:
              "Conflict: this code already exists in the database ({code}: {name}). ({match}) Do not create a duplicate; use “Align row” to update this row to the DB record (no new course write).",
            checkNotFoundHint:
              "No such course in the database yet; the first save will create it and the major mapping.",
            saveAfterCheckHint: "Save course + mapping",
            syncRowFromDb: "Align row to database",
            rowSyncedFromDb: "Row aligned (no new course saved).",
            matchExact: "exact code match",
            matchCompact: "relaxed match (format differs)",
          }
        : {
            title: "PDF Progress Mi-lenne-ha ellenőrzés",
            backToAdmin: "Vissza az admin felületre",
            blurb:
              "Tölts fel egy vagy több hallgatói PDF-et. A mi-lenne-ha ellenőrzés alapból nem ír adatbázisba; a párosított hallgatónál a „Mentés progressbe” gombok ténylegesen rögzítik a kurzusokat.",
            inputLabel: "PDF fájlok (több is lehet)",
            run: "PDF-ek elemzése",
            running: "Elemzés folyamatban...",
            empty: "Nincs fájl kiválasztva.",
            resultTitle: "Eredmény",
            noResult: "Még nincs eredmény.",
            matchedUser: "Párosított felhasználó",
            status: "Státusz",
            notMatched: "Nincs felhasználó párosítás fájlnév alapján.",
            extracted: "Kinyert kurzuskódok",
            known: "Adatbázisban felismert",
            missingCodes: "Ismeretlen kurzuskódok",
            beforeMissing: "Hiányzó előtte",
            afterMissing: "Hiányzó mi-lenne-ha után",
            ready: "Diploma teljesülne mi-lenne-ha után",
            yes: "Igen",
            no: "Nem",
            missingRules: "Még hiányzó követelmények",
            noneMissing: "Nincs hiányzó szabálysor.",
            debugTitle: "Debug (kinyert vs adatbázis)",
            debugPresent: "Adatbázisban megtalálható",
            debugMissing: "Adatbázisból hiányzó",
            debugExtracted: "Kinyert",
            debugNear: "Hasonló találatok az adatbázisban",
            codeCol: "Kód",
            nameCol: "Kurzus neve",
            wRows: "W:x/x/x sorok",
            debugJson: "Kinyert JSON",
            copyJson: "JSON másolása",
            copied: "Másolva",
            unknownRows: "Adatbázisban nem található (teendő)",
            allCoursesTitle: "Összes kinyert kurzus",
            statusCol: "Státusz",
            inDbStatus: "Adatbázisban",
            inDbNameMismatchStatus: "A kód egyezik, de a név eltér (mentésnél az adatbázis neve lesz használva)",
            dbNameLabel: "Adatbázis név",
            pdfNameLabel: "PDF név",
            missingStatus: "Hiányzik",
            majorCol: "Szak",
            creditCol: "Kredit",
            semesterCol: "Félév",
            typeCol: "Típus",
            subgroupCol: "Alcsoport",
            actionCol: "Művelet",
            saveRow: "Kurzus + kapcsolat mentése",
            saving: "Mentés...",
            saved: "Mentve",
            editRow: "Szerkesztés",
            cancelEdit: "Mégse",
            editingNow: "Épp szerkeszted",
            closeEdit: "Bezárás",
            subgroupHint: "Új alcsoport írható, vagy választhatsz meglévőt",
            subgroupPlaceholder: "Vagy írj be új alcsoportnevet",
            subgroupPick: "Válassz alcsoportot…",
            unknownOnly: "Csak az adatbázisból hiányzó sorok",
            allRows: "Összes kinyert sor",
            summaryBefore: "Hiányzó előtte",
            summaryAfter: "Hiányzó mi-lenne-ha után",
            summaryReady: "Diploma állapot",
            debugDetails: "Technikai részletek (opcionális)",
            manualNameLabel: "Kézi felhasználó párosítás",
            manualNamePlaceholder: "Írd be a hallgató teljes nevét",
            manualFindBtn: "Névrészek keresése",
            manualAssignBtn: "Kiválasztott user párosítása",
            manualAssigning: "Párosítás...",
            manualFinding: "Keresés...",
            manualAssignHint: "Csak ennél a személynél fut újra a számolás.",
            manualSelectLabel: "Felhasználó választása",
            manualMotherLabel: "anyja neve",
            manualNoCandidates: "Nincs találat (minden névrésznek illeszkednie kell; próbálj más szavakat).",
            manualSelectRequired: "Előbb válassz felhasználót a listából.",
            errorPrefix: "Hiba",
            docKindLabel: "Dokumentum típus (fájlnév alapján)",
            docKindCompleted: "Teljesített kreditek",
            docKindEnrolled: "Felvett kreditek",
            docKindMixed: "Vegyes",
            docKindUnknown: "Ismeretlen",
            importCompletedBtn: "Mentés progressbe (teljesített)",
            importEnrolledBtn: "Mentés progressbe (folyamatban / felvéve)",
            importing: "Mentés...",
            imported: "Elmentve a progress táblába",
            importNeedCourses: "Csak adatbázisban lévő kurzusok menthetők; előbb pótold a hiányzó kódokat.",
            importNeedUser: "Előbb párosíts felhasználót.",
            importDone: "Mentve: {created} új, {skipped} kihagyva (már volt progressben).",
            rowsShown: "Megjelenített sorok",
            rowsShownMissingSuffix: "csak hiányzó",
            nameMismatchWarning: "{count} egyező kurzusnál eltér a név: mentésnél az adatbázis neve lesz használva.",
            checkRow: "Kód ellenőrzése",
            checkingRow: "Ellenőrzés...",
            checkAgain: "Újraellenőrzés",
            checkCodeEmpty: "Előbb írj be kurzuskódot.",
            checkFoundConflictHint:
              "Ütközés: ez a kód már az adatbázisban van ({code}: {name}). ({match}) Ne hozz létre duplikátumot; az „Sor igazítása” gombbal ehhez a DB sorhoz igazíthatod a táblázatot (új kurzus mentése nélkül).",
            checkNotFoundHint:
              "Nincs ilyen kurzus az adatbázisban; az első mentés létrehozza a kurzust és a szak-kapcsolatot.",
            saveAfterCheckHint: "Kurzus + kapcsolat mentése",
            syncRowFromDb: "Sor igazítása az adatbázishoz",
            rowSyncedFromDb: "Sor igazítva (új kurzus nem lett mentve).",
            matchExact: "pontos kódegyezés",
            matchCompact: "laza egyezés (más formátum)",
          }),
    [lang]
  );

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState("");
  const [majors, setMajors] = useState([]);
  const [rowEdits, setRowEdits] = useState({});
  const [rowSaving, setRowSaving] = useState({});
  const [rowStatus, setRowStatus] = useState({});
  /** Hiányzó sor szerkesztés: kód ellenőrzés eredménye mentés előtt */
  const [rowCourseCheck, setRowCourseCheck] = useState({});
  const [rowEditing, setRowEditing] = useState({});
  const [showOnlyMissing, setShowOnlyMissing] = useState(true);
  const [subgroupOptions, setSubgroupOptions] = useState({});
  const [subgroupLoading, setSubgroupLoading] = useState({});
  /** major_id → már lekérdeztük-e az alcsoportokat (üres lista is „kész”) */
  const subgroupMajorsFetchedRef = useRef(new Set());
  const [manualNames, setManualNames] = useState({});
  const [manualLoading, setManualLoading] = useState({});
  const [manualStatus, setManualStatus] = useState({});
  const [manualCandidates, setManualCandidates] = useState({});
  const [manualSelectedUser, setManualSelectedUser] = useState({});
  const [importLoading, setImportLoading] = useState({});
  const [importStatus, setImportStatus] = useState({});
  const [analysisSeq, setAnalysisSeq] = useState(0);

  useEffect(() => {
    if (getRoleFromToken() !== "admin") navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const res = await authFetch(apiUrl("/api/majors?limit=500"));
        const data = await res.json().catch(() => []);
        if (!dead && Array.isArray(data)) setMajors(data);
      } catch {}
    })();
    return () => {
      dead = true;
    };
  }, [authFetch]);

  useEffect(() => {
    const initial = {};
    for (const p of result?.people || []) {
      const pKey = p.person_key || "unknown";
      const byCode = {};
      const tRows = Array.isArray(p.debug?.table_debug_rows) ? p.debug.table_debug_rows : [];
      for (const tr of tRows) {
        const k = tr.code_display || tr.code;
        if (!k || byCode[k]) continue;
        byCode[k] = tr;
      }
      const presentList = Array.isArray(p.debug?.present_in_db_rows) ? p.debug.present_in_db_rows : [];
      const missingRows = Array.isArray(p.debug?.missing_in_db_rows) ? p.debug.missing_in_db_rows : [];
      const presentByCode = new Map(presentList.map((r) => [r.code, r]));
      const missingByCode = new Map(missingRows.map((r) => [r.code, r]));
      const extractedOrder = Array.isArray(p.debug?.extracted_codes) ? p.debug.extracted_codes : [];
      const merged = [];
      const seen = new Set();
      const pushRowForCode = (code) => {
        if (!code || seen.has(code)) return;
        seen.add(code);
        const pr = presentByCode.get(code);
        const mr = missingByCode.get(code);
        const tr = byCode[code] || {};
        if (pr) {
          merged.push({
            inDb: true,
            slotCode: code,
            code: pr.code || code,
            name: pr.db_name || pr.name || tr.name || "",
            db_name: pr.db_name || pr.name || "",
            pdf_name: pr.pdf_name || tr.name || "",
            name_mismatch: !!pr.name_mismatch,
            course_id: pr.course_id,
            credit: Number.isFinite(tr.credit) ? tr.credit : 0,
            semester: Number.isFinite(tr.semester) && tr.semester > 0 ? tr.semester : 1,
            type: String(tr.type || "").trim(),
            subgroup: String(tr.subgroup || "").trim(),
            major_id: p.matched_user?.major_id || "",
          });
        } else if (mr) {
          merged.push({
            inDb: false,
            slotCode: code,
            code: mr.code || code,
            name: mr.name || tr.name || "",
            credit: Number.isFinite(tr.credit) ? tr.credit : 0,
            semester: Number.isFinite(tr.semester) && tr.semester > 0 ? tr.semester : 1,
            type: "required",
            subgroup: "",
            major_id: p.matched_user?.major_id || "",
          });
        } else {
          merged.push({
            inDb: false,
            slotCode: code,
            code,
            name: tr.name || "",
            credit: Number.isFinite(tr.credit) ? tr.credit : 0,
            semester: Number.isFinite(tr.semester) && tr.semester > 0 ? tr.semester : 1,
            type: "required",
            subgroup: "",
            major_id: p.matched_user?.major_id || "",
          });
        }
      };
      for (const c of extractedOrder) pushRowForCode(c);
      for (const r of presentList) pushRowForCode(r.code);
      for (const r of missingRows) pushRowForCode(r.code);
      initial[pKey] = merged;
    }
    setRowEdits(initial);
    setRowSaving({});
    setRowCourseCheck({});
    setRowEditing({});
    const initialManual = {};
    for (const p of result?.people || []) {
      const key = p.person_key || "unknown";
      initialManual[key] = String(p.matched_user?.name || p.person_key || "").trim();
    }
    setManualNames(initialManual);
    setManualLoading({});
    setManualStatus({});
    setManualCandidates({});
    setManualSelectedUser({});
  }, [result]);

  useEffect(() => {
    setRowStatus({});
    setImportStatus({});
  }, [analysisSeq]);

  const updateRowField = (personKey, idx, field, value) => {
    setRowEdits((prev) => ({
      ...prev,
      [personKey]: (prev[personKey] || []).map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    }));
    if (field === "code" || field === "major_id") {
      const rk = pdfCheckRowKey(personKey, idx);
      setRowCourseCheck((prev) => {
        if (!prev[rk]) return prev;
        const next = { ...prev };
        delete next[rk];
        return next;
      });
    }
  };

  const upsertKnownSubgroup = (majorId, subgroupValue) => {
    const mid = Number(majorId || 0);
    const subgroup = String(subgroupValue || "").trim();
    if (mid < 1 || !subgroup) return;
    setSubgroupOptions((prev) => {
      const current = Array.isArray(prev[mid]) ? prev[mid] : [];
      if (current.some((x) => String(x).toLowerCase() === subgroup.toLowerCase())) return prev;
      return { ...prev, [mid]: [...current, subgroup].sort((a, b) => String(a).localeCompare(String(b))) };
    });
  };

  const ensureSubgroups = async (majorId) => {
    const mid = Number(majorId || 0);
    if (mid < 1) return;
    if (subgroupMajorsFetchedRef.current.has(mid)) return;
    if (subgroupLoading[mid]) return;
    setSubgroupLoading((s) => ({ ...s, [mid]: true }));
    try {
      const res = await authFetch(apiUrl(`/api/admin/progress/major-subgroups/${mid}`));
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        subgroupMajorsFetchedRef.current.add(mid);
        setSubgroupOptions((s) => ({ ...s, [mid]: Array.isArray(body?.subgroups) ? body.subgroups : [] }));
      }
    } catch {} finally {
      setSubgroupLoading((s) => ({ ...s, [mid]: false }));
    }
  };

  const toggleEditRow = async (personKey, idx, on) => {
    const key = pdfCheckRowKey(personKey, idx);
    setRowEditing((s) => ({ ...s, [key]: !!on }));
    if (!on) {
      setRowCourseCheck((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (on) {
      const row = (rowEdits[personKey] || [])[idx];
      if (row?.major_id) await ensureSubgroups(row.major_id);
    }
  };

  const clearCourseRowVerify = (personKey, idx) => {
    const rk = pdfCheckRowKey(personKey, idx);
    setRowCourseCheck((prev) => {
      if (!prev[rk]) return prev;
      const next = { ...prev };
      delete next[rk];
      return next;
    });
  };

  const checkCourseCodeRow = async (personKey, idx) => {
    const row = (rowEdits[personKey] || [])[idx];
    if (!row || row.inDb) return;
    const key = pdfCheckRowKey(personKey, idx);
    const code = String(row.code || "").trim();
    if (!code) {
      setRowCourseCheck((prev) => ({
        ...prev,
        [key]: { status: "error", message: t.checkCodeEmpty },
      }));
      return;
    }
    setRowCourseCheck((prev) => ({ ...prev, [key]: { status: "loading" } }));
    try {
      const res = await authFetch(
        apiUrl(`/api/admin/progress/check-course-code?${new URLSearchParams({ code })}`)
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = typeof body?.detail === "string" ? body.detail : res.statusText;
        setRowCourseCheck((prev) => ({
          ...prev,
          [key]: { status: "error", message: detail },
        }));
        return;
      }
      if (body.found) {
        setRowCourseCheck((prev) => ({
          ...prev,
          [key]: {
            status: "found",
            course_id: body.course_id,
            course_code: body.course_code,
            course_name: body.course_name,
            match_kind: body.match_kind || "exact",
          },
        }));
      } else {
        setRowCourseCheck((prev) => ({ ...prev, [key]: { status: "not_found" } }));
      }
    } catch (e) {
      setRowCourseCheck((prev) => ({
        ...prev,
        [key]: { status: "error", message: String(e) },
      }));
    }
  };

  /**
   * PDF debug állapot frissítése, ha egy kurzus már létezik a DB-ben (POST nélkül is).
   * @returns {boolean} sikerült-e a merge
   */
  const mergeResolvedCourseIntoResult = (
    personKey,
    {
      savedCodeDisplay,
      courseId,
      courseName,
      courseCodeDb,
      pdfNameForMismatch,
      removeMissingForSlotCodes,
    }
  ) => {
    const person = (result?.people || []).find((p) => (p.person_key || "unknown") === personKey);
    if (!person?.debug) return false;
    const slotNorm = (c) => String(c ?? "").trim();
    const display = slotNorm(savedCodeDisplay);
    const ck = compactCourseKey(display);
    const cid = Number(courseId || 0);
    const cname = String(courseName || "").trim();
    const ccodeDb = String(courseCodeDb || "").trim();
    const pdfN = String(pdfNameForMismatch ?? "").trim();
    const nameMismatch =
      pdfN.length > 0 && pdfN.toLowerCase() !== cname.toLowerCase();

    const slotCompactsRem = new Set(
      (removeMissingForSlotCodes || [])
        .map((c) => compactCourseKey(slotNorm(c)))
        .filter((x) => x.length > 0)
    );

    const dbg = { ...person.debug };
    const prevMissing = dbg.missing_in_db_rows || [];
    const missingRemovesRow = (r) => {
      const rc = slotNorm(r.code);
      if (!rc) return false;
      const rck = compactCourseKey(rc);
      if (rck === ck || rc === display) return true;
      if (slotCompactsRem.has(rck)) return true;
      return false;
    };
    const missRows = prevMissing.filter((r) => !missingRemovesRow(r));
    const removedMissingN = prevMissing.length - missRows.length;

    const alreadyPresent = (dbg.present_in_db_rows || []).some(
      (r) => (cid > 0 && Number(r.course_id) === cid) || compactCourseKey(r.code) === ck
    );
    const newPresent = {
      code: display,
      name: cname,
      db_name: cname,
      pdf_name: pdfN,
      name_mismatch: nameMismatch,
      course_id: cid,
      in_db: true,
    };
    const presentRows = alreadyPresent
      ? [...(dbg.present_in_db_rows || [])]
      : [...(dbg.present_in_db_rows || []), newPresent];

    dbg.missing_in_db_rows = missRows;
    dbg.present_in_db_rows = presentRows;
    dbg.missing_in_db_count = Math.max(0, (dbg.missing_in_db_count || 0) - removedMissingN);
    if (!alreadyPresent) {
      dbg.present_in_db_count = Math.max(0, (dbg.present_in_db_count || 0) + 1);
    }

    dbg.extracted_codes = (dbg.extracted_codes || []).filter((c) => {
      const cc = compactCourseKey(slotNorm(c));
      if (!cc) return true;
      if (slotCompactsRem.has(cc)) return false;
      return true;
    });

    const pcodes = [...(dbg.present_in_db_codes || [])];
    if (ccodeDb && !pcodes.some((x) => compactCourseKey(x) === compactCourseKey(ccodeDb))) {
      pcodes.push(ccodeDb);
    }
    dbg.present_in_db_codes = pcodes;
    dbg.missing_in_db_codes = (dbg.missing_in_db_codes || []).filter((x) => {
      const xc = compactCourseKey(String(x || ""));
      if (!xc) return true;
      if (xc === ck || xc === compactCourseKey(ccodeDb)) return false;
      if (slotCompactsRem.has(xc)) return false;
      return true;
    });

    const nm = { ...(dbg.near_matches_for_missing || {}) };
    for (const k of Object.keys(nm)) {
      const kk = compactCourseKey(String(k || ""));
      if (kk === ck || slotCompactsRem.has(kk)) delete nm[k];
    }
    dbg.near_matches_for_missing = nm;

    const nextPerson = {
      ...person,
      debug: dbg,
      known_course_codes_count: Math.max(
        0,
        (person.known_course_codes_count || 0) + (alreadyPresent ? 0 : 1)
      ),
      missing_course_codes: (person.missing_course_codes || []).filter((c) => {
        const cc = compactCourseKey(String(c || ""));
        if (cc === ck) return false;
        if (slotCompactsRem.has(cc)) return false;
        return true;
      }),
    };

    setResult((prev) => ({
      ...prev,
      people: (prev.people || []).map((p) =>
        (p.person_key || "unknown") === personKey ? nextPerson : p
      ),
    }));

    if (person.status === "ok" && person.matched_user?.id && cid > 0) {
      const ids = new Set(presentRows.map((r) => Number(r.course_id || 0)).filter((x) => x > 0));
      (async () => {
        try {
          const hr = await authFetch(apiUrl("/api/admin/progress/refresh-hypothetical"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: Number(person.matched_user.id),
              pdf_resolved_course_ids: [...ids],
              lang: lang === "en" ? "en" : "hu",
            }),
          });
          const hBody = await hr.json().catch(() => ({}));
          if (hr.ok) {
            setResult((prev) => ({
              ...prev,
              people: (prev.people || []).map((p) =>
                (p.person_key || "unknown") === personKey
                  ? {
                      ...p,
                      hypothetical_summary: hBody.hypothetical_summary ?? p.hypothetical_summary,
                      diploma_ready_hypothetical:
                        hBody.diploma_ready_hypothetical ?? p.diploma_ready_hypothetical,
                      missing_rules_hypothetical:
                        hBody.missing_rules_hypothetical ?? p.missing_rules_hypothetical,
                    }
                  : p
              ),
            }));
          }
        } catch {}
      })();
    }
    return true;
  };

  const applyDbMatchToRow = (personKey, idx) => {
    const key = pdfCheckRowKey(personKey, idx);
    const chk = rowCourseCheck[key];
    if (!chk || chk.status !== "found") return;
    const row = (rowEdits[personKey] || [])[idx];
    if (!row || row.inDb) return;
    const display = String(chk.course_code || "").trim();
    const ok = mergeResolvedCourseIntoResult(personKey, {
      savedCodeDisplay: display,
      courseId: Number(chk.course_id || 0),
      courseName: String(chk.course_name || "").trim(),
      courseCodeDb: String(chk.course_code || ""),
      pdfNameForMismatch: row.name,
      removeMissingForSlotCodes: [row.slotCode, row.code].filter((c) => String(c || "").trim()),
    });
    if (!ok) return;
    clearCourseRowVerify(personKey, idx);
    setRowEditing((s) => ({ ...s, [key]: false }));
    setRowStatus((s) => ({ ...s, [key]: t.rowSyncedFromDb }));
  };

  const saveMissingRow = async (personKey, idx) => {
    const row = (rowEdits[personKey] || [])[idx];
    if (!row || row.inDb) return;
    const key = pdfCheckRowKey(personKey, idx);
    if (rowCourseCheck[key]?.status !== "not_found") return;
    setRowSaving((s) => ({ ...s, [key]: true }));
    setRowStatus((s) => ({ ...s, [key]: "" }));
    try {
      const payload = {
        course_code: String(row.code || "").trim(),
        name: String(row.name || "").trim(),
        major_id: Number(row.major_id || 0),
        credit: Number(row.credit || 0),
        semester: Number(row.semester || 1),
        type: String(row.type || "required").trim() || "required",
        subgroup: String(row.subgroup || "").trim() || null,
      };
      const res = await authFetch(apiUrl("/api/admin/progress/upsert-course-major"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRowStatus((s) => ({ ...s, [key]: `${t.errorPrefix}: ${body?.detail || res.statusText}` }));
        return;
      }
      if (payload.subgroup) upsertKnownSubgroup(payload.major_id, payload.subgroup);

      const savedCodeDisplay = String(body.course_code || row.code || "").trim();
      const courseId = Number(body.course_id || 0);
      const courseName = String(body.course_name || row.name || "").trim();
      const courseCodeDb = String(body.course_code || "");

      mergeResolvedCourseIntoResult(personKey, {
        savedCodeDisplay,
        courseId,
        courseName,
        courseCodeDb,
        pdfNameForMismatch: row.name,
        removeMissingForSlotCodes: [row.slotCode, row.code].filter((c) => String(c || "").trim()),
      });

      setRowStatus((s) => ({ ...s, [key]: t.saved }));
      setRowEditing((s) => ({ ...s, [key]: false }));
    } catch (e) {
      setRowStatus((s) => ({ ...s, [key]: `${t.errorPrefix}: ${String(e)}` }));
    } finally {
      setRowSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const run = async () => {
    setError("");
    setResult(null);
    if (!files.length) {
      setError(t.empty);
      return;
    }
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    fd.append("lang", lang === "en" ? "en" : "hu");
    setLoading(true);
    try {
      const res = await authFetch(apiUrl("/api/admin/progress/pdf-simulate"), {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(`${t.errorPrefix}: ${data?.detail || res.statusText}`);
        return;
      }
      setResult(data);
      setAnalysisSeq((s) => s + 1);
    } catch (e) {
      setError(`${t.errorPrefix}: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const getResolvedCourseIdsFromPerson = (person) => {
    const rows = person?.debug?.present_in_db_rows || [];
    return Array.from(new Set(rows.map((r) => Number(r?.course_id || 0)).filter((x) => x > 0)));
  };

  const formatDocKind = (kind) => {
    if (kind === "completed_credits") return t.docKindCompleted;
    if (kind === "enrolled_credits") return t.docKindEnrolled;
    if (kind === "mixed") return t.docKindMixed;
    return t.docKindUnknown;
  };

  const mismatchTooltip = (row) => {
    const dbName = String(row?.db_name || row?.name || "").trim();
    const pdfName = String(row?.pdf_name || "").trim();
    return `${t.inDbNameMismatchStatus}\n${t.dbNameLabel}: ${dbName}\n${t.pdfNameLabel}: ${pdfName}`;
  };

  const importPdfProgress = async (personKey, statusStr) => {
    const person = (result?.people || []).find((p) => (p.person_key || "unknown") === personKey);
    const uid = Number(person?.matched_user?.id || 0);
    const ids = getResolvedCourseIdsFromPerson(person);
    if (uid < 1) {
      setImportStatus((s) => ({ ...s, [personKey]: `${t.errorPrefix}: ${t.importNeedUser}` }));
      return;
    }
    if (!ids.length) {
      setImportStatus((s) => ({ ...s, [personKey]: `${t.errorPrefix}: ${t.importNeedCourses}` }));
      return;
    }
    setImportLoading((s) => ({ ...s, [personKey]: true }));
    setImportStatus((s) => ({ ...s, [personKey]: "" }));
    try {
      const res = await authFetch(apiUrl("/api/admin/progress/import-from-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: uid,
          course_ids: ids,
          status: statusStr,
          skip_if_exists: true,
          points: 0,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = typeof body?.detail === "string" ? body.detail : body?.detail?.message || res.statusText;
        setImportStatus((s) => ({ ...s, [personKey]: `${t.errorPrefix}: ${detail}` }));
        return;
      }
      const c = body?.created ?? 0;
      const sk = body?.skipped_existing ?? 0;
      setImportStatus((s) => ({
        ...s,
        [personKey]: String(t.importDone || "").replace("{created}", String(c)).replace("{skipped}", String(sk)),
      }));
    } catch (e) {
      setImportStatus((s) => ({ ...s, [personKey]: `${t.errorPrefix}: ${String(e)}` }));
    } finally {
      setImportLoading((s) => ({ ...s, [personKey]: false }));
    }
  };

  const manualFindCandidates = async (personKey) => {
    const name = String(manualNames[personKey] || "").trim();
    if (!name) {
      setManualStatus((s) => ({ ...s, [personKey]: `${t.errorPrefix}: ${t.manualNamePlaceholder}` }));
      return;
    }
    setManualLoading((s) => ({ ...s, [personKey]: true }));
    setManualStatus((s) => ({ ...s, [personKey]: "" }));
    try {
      const res = await authFetch(apiUrl("/api/admin/progress/manual-match-candidates"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: name }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = typeof body?.detail === "string" ? body.detail : body?.detail?.message || res.statusText;
        setManualStatus((s) => ({ ...s, [personKey]: `${t.errorPrefix}: ${detail}` }));
        setManualCandidates((s) => ({ ...s, [personKey]: [] }));
        return;
      }
      const candidates = Array.isArray(body?.candidates) ? body.candidates : [];
      setManualCandidates((s) => ({ ...s, [personKey]: candidates }));
      setManualSelectedUser((s) => ({
        ...s,
        [personKey]: candidates.length === 1 ? String(candidates[0].id) : "",
      }));
      setManualStatus((s) => ({
        ...s,
        [personKey]: candidates.length ? "" : t.manualNoCandidates,
      }));
    } catch (e) {
      setManualStatus((s) => ({ ...s, [personKey]: `${t.errorPrefix}: ${String(e)}` }));
      setManualCandidates((s) => ({ ...s, [personKey]: [] }));
    } finally {
      setManualLoading((s) => ({ ...s, [personKey]: false }));
    }
  };

  const manualAssignPerson = async (personKey) => {
    const selectedUserId = Number(manualSelectedUser[personKey] || 0);
    if (selectedUserId < 1) {
      setManualStatus((s) => ({ ...s, [personKey]: `${t.errorPrefix}: ${t.manualSelectRequired}` }));
      return;
    }
    const person = (result?.people || []).find((p) => (p.person_key || "unknown") === personKey);
    if (!person) return;
    setManualLoading((s) => ({ ...s, [personKey]: true }));
    setManualStatus((s) => ({ ...s, [personKey]: "" }));
    try {
      const res = await authFetch(apiUrl("/api/admin/progress/manual-match-and-refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          pdf_resolved_course_ids: getResolvedCourseIdsFromPerson(person),
          lang: lang === "en" ? "en" : "hu",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = typeof body?.detail === "string" ? body.detail : body?.detail?.message || res.statusText;
        setManualStatus((s) => ({ ...s, [personKey]: `${t.errorPrefix}: ${detail}` }));
        return;
      }
      const matched = body?.matched_user || null;
      setResult((prev) => ({
        ...prev,
        people: (prev?.people || []).map((p) =>
          (p.person_key || "unknown") === personKey
            ? {
                ...p,
                status: "ok",
                matched_user: matched,
                baseline_summary: body?.baseline_summary ?? p.baseline_summary,
                hypothetical_summary: body?.hypothetical_summary ?? p.hypothetical_summary,
                diploma_ready_hypothetical:
                  body?.diploma_ready_hypothetical ?? p.diploma_ready_hypothetical,
                missing_rules_hypothetical:
                  body?.missing_rules_hypothetical ?? p.missing_rules_hypothetical,
              }
            : p
        ),
      }));
      setRowEdits((prev) => {
        const rows = prev[personKey] || [];
        return {
          ...prev,
          [personKey]: rows.map((r) => ({
            ...r,
            major_id: r.major_id || matched?.major_id || "",
          })),
        };
      });
      setManualStatus((s) => ({ ...s, [personKey]: t.saved }));
    } catch (e) {
      setManualStatus((s) => ({ ...s, [personKey]: `${t.errorPrefix}: ${String(e)}` }));
    } finally {
      setManualLoading((s) => ({ ...s, [personKey]: false }));
    }
  };

  const activeEdit = useMemo(() => {
    const personList = result?.people || [];
    for (const [k, isOn] of Object.entries(rowEditing)) {
      if (!isOn) continue;
      const [personKey, idxRaw] = String(k).split(":");
      const idx = Number(idxRaw);
      if (!Number.isInteger(idx)) continue;
      const row = (rowEdits[personKey] || [])[idx];
      if (!row) continue;
      const person = personList.find((p) => (p.person_key || "unknown") === personKey);
      return {
        key: k,
        personKey,
        idx,
        personLabel: person?.person_key || personKey,
        code: String(row.code || "").trim(),
        name: String(row.name || "").trim(),
      };
    }
    return null;
  }, [rowEditing, rowEdits, result]);

  const getRowStatusClass = (msg) => {
    const text = String(msg || "").toLowerCase();
    return text.startsWith(String(t.errorPrefix || "").toLowerCase()) ? "error" : "success";
  };

  return (
    <div className="progress-tracker-container admin-pdf-check-page">
      <h1 className="panel-header-inline admin-title">{t.title}</h1>
      <div className="admin-pdf-check-backlink-wrap">
        <Link to="/admin" className="admin-pdf-check-backlink">
          {t.backToAdmin}
        </Link>
      </div>
      <section className="admin-card admin-pdf-check-hero">
        <div className="admin-card-body admin-pdf-check-hero-body">
          <p className="admin-pdf-check-blurb">{t.blurb}</p>
          <label className="admin-pdf-check-label">{t.inputLabel}</label>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="admin-pdf-check-file-input"
          />
          <div className="admin-pdf-check-actions">
            <Button type="button" onClick={run} disabled={loading} variant="primary" size="md" className="admin-pdf-check-btn admin-pdf-check-btn-primary">
              {loading ? t.running : t.run}
            </Button>
          </div>
          {files.length > 0 && (
            <div className="admin-pdf-check-file-list">{files.map((f) => f.name).join(", ")}</div>
          )}
          {error && <div className="admin-pdf-check-error">{error}</div>}
        </div>
      </section>

      <section className="admin-card admin-pdf-check-results-card">
        <div className="admin-card-body">
          <div className="admin-pdf-check-results-header">
            <h2 className="admin-pdf-check-results-title">{t.resultTitle}</h2>
            {result && (
              <label className="admin-pdf-check-toggle">
                <input
                  type="checkbox"
                  checked={showOnlyMissing}
                  onChange={(e) => setShowOnlyMissing(e.target.checked)}
                />
                <span>{showOnlyMissing ? t.unknownOnly : t.allRows}</span>
              </label>
            )}
          </div>
          {!result && <div className="admin-pdf-check-muted">{t.noResult}</div>}
          {result?.people?.map((p, idx) => (
            <div key={`${p.person_key}-${idx}`} className={`admin-pdf-check-person ${idx ? "with-top-border" : ""}`}>
              <div className="admin-pdf-check-person-head">
                <div className="admin-pdf-check-person-name">{p.person_key || "(ismeretlen név)"}</div>
                <div className={`admin-pdf-check-status-pill ${p.status === "ok" ? "ok" : "warn"}`}>
                  {t.status}: {p.status}
                </div>
              </div>
              <div className="admin-pdf-check-userline">
                <strong>{t.matchedUser}:</strong>{" "}
                {p.matched_user ? `${p.matched_user.name} (#${p.matched_user.id})` : t.notMatched}
              </div>
              <div className="admin-pdf-check-doc-kind-line">
                <strong>{t.docKindLabel}:</strong> {formatDocKind(p.document_kind)}{" "}
                {Array.isArray(p.document_kinds) && p.document_kinds.length > 1 ? (
                  <span className="admin-pdf-check-muted">({(p.document_kinds || []).join(", ")})</span>
                ) : null}
              </div>
              {p.matched_user && (
                <div className="admin-pdf-check-import-block">
                  <div className="admin-pdf-check-import-actions">
                    <Button
                      type="button"
                      className="admin-pdf-check-btn admin-pdf-check-btn-success"
                      disabled={!!importLoading[p.person_key || "unknown"]}
                      variant="success"
                      size="md"
                      onClick={() => importPdfProgress(p.person_key || "unknown", "completed")}
                    >
                      {importLoading[p.person_key || "unknown"] ? t.importing : t.importCompletedBtn}
                    </Button>
                    <Button
                      type="button"
                      className="admin-pdf-check-btn admin-pdf-check-btn-primary"
                      disabled={!!importLoading[p.person_key || "unknown"]}
                      variant="primary"
                      size="md"
                      onClick={() => importPdfProgress(p.person_key || "unknown", "in_progress")}
                    >
                      {importLoading[p.person_key || "unknown"] ? t.importing : t.importEnrolledBtn}
                    </Button>
                  </div>
                  {importStatus[p.person_key || "unknown"] && (
                    <div
                      className={`admin-pdf-check-row-status ${getRowStatusClass(importStatus[p.person_key || "unknown"])}`}
                    >
                      {importStatus[p.person_key || "unknown"]}
                    </div>
                  )}
                </div>
              )}
              {!p.matched_user && (
                <div className="admin-pdf-check-manual-match">
                  <label className="admin-pdf-check-manual-label">{t.manualNameLabel}</label>
                  <div className="admin-pdf-check-manual-row">
                    <input
                      className="admin-pdf-check-input"
                      value={manualNames[p.person_key || "unknown"] || ""}
                      placeholder={t.manualNamePlaceholder}
                      onChange={(e) =>
                        setManualNames((prev) => ({
                          ...prev,
                          [p.person_key || "unknown"]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      className="admin-pdf-check-btn admin-pdf-check-btn-primary"
                      onClick={() => manualFindCandidates(p.person_key || "unknown")}
                      disabled={!!manualLoading[p.person_key || "unknown"]}
                      variant="primary"
                      size="md"
                    >
                      {manualLoading[p.person_key || "unknown"] ? t.manualFinding : t.manualFindBtn}
                    </Button>
                  </div>
                  {(manualCandidates[p.person_key || "unknown"] || []).length > 0 && (
                    <div className="admin-pdf-check-manual-row admin-pdf-check-manual-row-secondary">
                      <select
                        className="admin-pdf-check-input"
                        value={manualSelectedUser[p.person_key || "unknown"] || ""}
                        onChange={(e) =>
                          setManualSelectedUser((prev) => ({
                            ...prev,
                            [p.person_key || "unknown"]: e.target.value,
                          }))
                        }
                      >
                        <option value="">{t.manualSelectLabel}</option>
                        {(manualCandidates[p.person_key || "unknown"] || []).map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} - {t.manualMotherLabel}: {u.mothers_name || ""} (#{u.id})
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        className="admin-pdf-check-btn admin-pdf-check-btn-success"
                        onClick={() => manualAssignPerson(p.person_key || "unknown")}
                        disabled={!!manualLoading[p.person_key || "unknown"]}
                        variant="success"
                        size="md"
                      >
                        {manualLoading[p.person_key || "unknown"] ? t.manualAssigning : t.manualAssignBtn}
                      </Button>
                    </div>
                  )}
                  <div className="admin-pdf-check-hint">{t.manualAssignHint}</div>
                  {manualStatus[p.person_key || "unknown"] && (
                    <div className={`admin-pdf-check-row-status ${getRowStatusClass(manualStatus[p.person_key || "unknown"])}`}>
                      {manualStatus[p.person_key || "unknown"]}
                    </div>
                  )}
                </div>
              )}
              {!!(p.missing_course_codes || []).length && (
                <div className="admin-pdf-check-warning-line">
                  <strong>{t.missingCodes}:</strong> {(p.missing_course_codes || []).join(", ")}
                </div>
              )}
              {(() => {
                const rows = rowEdits[p.person_key || "unknown"] || [];
                const mismatchCount = rows.filter((r) => r.inDb && r.name_mismatch).length;
                if (!mismatchCount) return null;
                return (
                  <div className="admin-pdf-check-warning-line admin-pdf-check-warning-line-amber">
                    {String(t.nameMismatchWarning || "")
                      .replace("{count}", String(mismatchCount))}
                  </div>
                );
              })()}
              {p.debug && (
                <div className="admin-pdf-check-edit-zone">
                  <div className="admin-pdf-check-edit-title">{t.allCoursesTitle}</div>
                  <div className="admin-pdf-check-hint">
                    {(() => {
                      const allRows = rowEdits[p.person_key || "unknown"] || [];
                      const shownRows = allRows.filter((r) => (showOnlyMissing ? !r.inDb : true));
                      return `${t.rowsShown}: ${shownRows.length}/${allRows.length}${showOnlyMissing ? ` (${t.rowsShownMissingSuffix})` : ""}`;
                    })()}
                  </div>
                  {(rowEdits[p.person_key || "unknown"] || []).filter((r) => (showOnlyMissing ? !r.inDb : true)).length > 0 && (
                    <div className="admin-pdf-check-table-wrap">
                      <table className="admin-table admin-pdf-check-table">
                      <thead>
                        <tr>
                          <th>{t.codeCol}</th>
                          <th>{t.nameCol}</th>
                          <th>{t.statusCol}</th>
                          <th>{t.majorCol}</th>
                          <th>{t.creditCol}</th>
                          <th>{t.semesterCol}</th>
                          <th>{t.typeCol}</th>
                          <th>{t.subgroupCol}</th>
                          <th>{t.actionCol}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rowEdits[p.person_key || "unknown"] || [])
                          .map((row, i3) => ({ row, i3 }))
                          .filter(({ row }) => (showOnlyMissing ? !row.inDb : true))
                          .map(({ row, i3 }) => {
                          const key = pdfCheckRowKey(p.person_key || "unknown", i3);
                          const isDb = !!row.inDb;
                          const isEditing = !isDb && !!rowEditing[key];
                          const majorId = Number(row.major_id || 0);
                          const subgroups = Array.isArray(subgroupOptions[majorId]) ? subgroupOptions[majorId] : [];
                          const chk = rowCourseCheck[key];
                          const chkFound = chk?.status === "found";
                          const chkNotFound = chk?.status === "not_found";
                          const chkErr = chk?.status === "error";
                          const showCheckBannerRow =
                            isEditing && !isDb && (chkFound || chkNotFound || chkErr);
                          const mkConflictBannerText = () => {
                            if (!chkFound) return "";
                            const mkLabel = chk.match_kind === "compact" ? t.matchCompact : t.matchExact;
                            return String(t.checkFoundConflictHint)
                              .replace("{code}", String(chk.course_code || ""))
                              .replace("{name}", String(chk.course_name || ""))
                              .replace("{match}", mkLabel);
                          };
                          return (
                          <Fragment key={`course-${row.slotCode || row.code}-${i3}`}>
                          <tr
                            className={isDb ? "admin-pdf-check-row-indb" : "admin-pdf-check-row-missing"}
                          >
                            <td>
                              {!isDb && isEditing ? (
                                <input
                                  className="admin-pdf-check-input"
                                  value={row.code}
                                  onChange={(e) => updateRowField(p.person_key || "unknown", i3, "code", e.target.value)}
                                />
                              ) : (
                                <span>{row.code}</span>
                              )}
                            </td>
                            <td>
                              {!isDb && isEditing ? (
                                <input
                                  className="admin-pdf-check-input"
                                  value={row.name}
                                  onChange={(e) => updateRowField(p.person_key || "unknown", i3, "name", e.target.value)}
                                />
                              ) : (
                                <span>
                                  {row.name || ""}
                                  {isDb && row.name_mismatch ? (
                                    <span className="admin-pdf-check-name-mismatch-badge" title={mismatchTooltip(row)}>!</span>
                                  ) : null}
                                </span>
                              )}
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: isDb ? "#047857" : "#b91c1c" }}>
                                {isDb ? (row.name_mismatch ? t.inDbNameMismatchStatus : t.inDbStatus) : t.missingStatus}
                              </span>
                            </td>
                            <td>
                              {!isDb && isEditing ? (
                                <select
                                  className="admin-pdf-check-input"
                                  value={row.major_id}
                                  onChange={async (e) => {
                                    const v = e.target.value;
                                    updateRowField(p.person_key || "unknown", i3, "major_id", v);
                                    await ensureSubgroups(v);
                                  }}
                                >
                                  <option value=""></option>
                                  {majors.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span>{majors.find((m) => String(m.id) === String(row.major_id))?.name || ""}</span>
                              )}
                            </td>
                            <td>
                              {!isDb && isEditing ? (
                                <input
                                  className="admin-pdf-check-input admin-pdf-check-input-small"
                                  type="number"
                                  value={row.credit}
                                  onChange={(e) => updateRowField(p.person_key || "unknown", i3, "credit", e.target.value)}
                                />
                              ) : (
                                <span>{Number.isFinite(Number(row.credit)) ? Number(row.credit) : ""}</span>
                              )}
                            </td>
                            <td>
                              {!isDb && isEditing ? (
                                <input
                                  className="admin-pdf-check-input admin-pdf-check-input-small"
                                  type="number"
                                  value={row.semester}
                                  onChange={(e) => updateRowField(p.person_key || "unknown", i3, "semester", e.target.value)}
                                />
                              ) : (
                                <span>{Number.isFinite(Number(row.semester)) ? Number(row.semester) : ""}</span>
                              )}
                            </td>
                            <td>
                              {!isDb && isEditing ? (
                                <select
                                  className="admin-pdf-check-input"
                                  value={row.type}
                                  onChange={(e) => updateRowField(p.person_key || "unknown", i3, "type", e.target.value)}
                                >
                                  <option value="required">required</option>
                                  <option value="elective">elective</option>
                                  <option value="optional">optional</option>
                                  <option value="practice">practice</option>
                                  <option value="pe">pe</option>
                                </select>
                              ) : (
                                <span>{row.type || ""}</span>
                              )}
                            </td>
                            <td>
                              {!isDb && isEditing ? (
                                <div className="admin-pdf-check-subgroup-cell">
                                  {subgroups.length > 0 && (
                                    <select
                                      className="admin-pdf-check-input admin-pdf-check-subgroup-select"
                                      aria-label={t.subgroupCol}
                                      title={t.subgroupHint}
                                      value={
                                        subgroups.some((sg) => String(sg) === String(row.subgroup ?? ""))
                                          ? String(row.subgroup ?? "")
                                          : ""
                                      }
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updateRowField(p.person_key || "unknown", i3, "subgroup", v);
                                        if (v) upsertKnownSubgroup(majorId, v);
                                      }}
                                    >
                                      <option value="">{t.subgroupPick}</option>
                                      {subgroups.map((sg) => (
                                        <option key={String(sg)} value={String(sg)}>
                                          {sg}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  <input
                                    type="text"
                                    className="admin-pdf-check-input admin-pdf-check-subgroup-text"
                                    value={row.subgroup ?? ""}
                                    title={t.subgroupHint}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      updateRowField(p.person_key || "unknown", i3, "subgroup", v);
                                      upsertKnownSubgroup(majorId, v);
                                    }}
                                    placeholder={t.subgroupPlaceholder}
                                    autoComplete="off"
                                  />
                                </div>
                              ) : (
                                <span>{row.subgroup || ""}</span>
                              )}
                            </td>
                            <td>
                              {isDb ? (
                                <span className="admin-pdf-check-cell-empty" aria-hidden="true" />
                              ) : (
                                <div className="admin-pdf-check-row-actions">
                                  {!isEditing ? (
                                    <Button
                                      type="button"
                                      onClick={() => toggleEditRow(p.person_key || "unknown", i3, true)}
                                      title={t.editRow}
                                      className="admin-pdf-check-btn admin-pdf-check-btn-icon"
                                      variant="ghost"
                                      size="sm"
                                    >
                                      ✎
                                    </Button>
                                  ) : (
                                    <div className="admin-pdf-check-row-actions-edit-wrap">
                                      <div className="admin-pdf-check-row-actions-edit">
                                        <Button
                                          type="button"
                                          onClick={() => toggleEditRow(p.person_key || "unknown", i3, false)}
                                          className="admin-pdf-check-btn admin-pdf-check-btn-ghost"
                                          variant="ghost"
                                          size="sm"
                                        >
                                          {t.cancelEdit}
                                        </Button>
                                        {!(chkFound || chkNotFound) && chk?.status !== "loading" && (
                                          <Button
                                            type="button"
                                            onClick={() => checkCourseCodeRow(p.person_key || "unknown", i3)}
                                            className="admin-pdf-check-btn admin-pdf-check-btn-primary"
                                            variant="primary"
                                            size="sm"
                                          >
                                            {t.checkRow}
                                          </Button>
                                        )}
                                        {chk?.status === "loading" && (
                                          <Button
                                            type="button"
                                            disabled
                                            className="admin-pdf-check-btn"
                                            variant="neutral"
                                            size="sm"
                                          >
                                            {t.checkingRow}
                                          </Button>
                                        )}
                                        {chkNotFound && (
                                          <>
                                            <Button
                                              type="button"
                                              disabled={!!rowSaving[key]}
                                              onClick={() => saveMissingRow(p.person_key || "unknown", i3)}
                                              className="admin-pdf-check-btn admin-pdf-check-btn-success"
                                              variant="success"
                                              size="sm"
                                            >
                                              {rowSaving[key] ? t.saving : t.saveAfterCheckHint}
                                            </Button>
                                            <Button
                                              type="button"
                                              onClick={() => clearCourseRowVerify(p.person_key || "unknown", i3)}
                                              className="admin-pdf-check-btn admin-pdf-check-btn-ghost"
                                              variant="ghost"
                                              size="sm"
                                            >
                                              {t.checkAgain}
                                            </Button>
                                          </>
                                        )}
                                        {chkFound && (
                                          <>
                                            <Button
                                              type="button"
                                              onClick={() => applyDbMatchToRow(p.person_key || "unknown", i3)}
                                              className="admin-pdf-check-btn admin-pdf-check-btn-warning"
                                              variant="warning"
                                              size="sm"
                                            >
                                              {t.syncRowFromDb}
                                            </Button>
                                            <Button
                                              type="button"
                                              onClick={() => clearCourseRowVerify(p.person_key || "unknown", i3)}
                                              className="admin-pdf-check-btn admin-pdf-check-btn-ghost"
                                              variant="ghost"
                                              size="sm"
                                            >
                                              {t.checkAgain}
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {isEditing && subgroupLoading[majorId] && (
                                    <div className="admin-pdf-check-hint admin-pdf-check-hint--inline">subgroups...</div>
                                  )}
                                  {rowStatus[key] && (
                                    <div className={`admin-pdf-check-row-status ${getRowStatusClass(rowStatus[key])}`}>
                                      {rowStatus[key]}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                          {showCheckBannerRow && (
                            <tr className="admin-pdf-check-verify-banner-tr admin-pdf-check-verify-banner-tr--missing">
                              <td colSpan={9} className="admin-pdf-check-verify-banner-td">
                                {chkFound && (
                                  <div className="admin-pdf-check-verify-banner admin-pdf-check-verify-banner--conflict">
                                    {mkConflictBannerText()}
                                  </div>
                                )}
                                {chkNotFound && (
                                  <div className="admin-pdf-check-verify-banner admin-pdf-check-verify-banner--new">
                                    {t.checkNotFoundHint}
                                  </div>
                                )}
                                {chkErr && (
                                  <div className="admin-pdf-check-row-status error">{chk.message}</div>
                                )}
                              </td>
                            </tr>
                          )}
                          </Fragment>
                        )})}
                      </tbody>
                    </table>
                    </div>
                  )}
                  <details className="admin-pdf-check-debug-details">
                    <summary>{t.debugDetails}</summary>
                    <textarea
                      className="admin-pdf-check-debug-textarea"
                      readOnly
                      value={JSON.stringify(
                        {
                          extracted_codes: p.debug.extracted_codes || [],
                          table_w_rows_count: p.debug.table_w_rows_count || 0,
                          table_rows_count: p.debug.table_rows_count || 0,
                          table_debug_rows: p.debug.table_debug_rows || [],
                        },
                        null,
                        2
                      )}
                    />
                    <div className="admin-pdf-check-debug-actions">
                      <Button
                        type="button"
                        className="admin-pdf-check-btn admin-pdf-check-btn-ghost"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const key = `${p.person_key}-${idx}`;
                          const txt = JSON.stringify(
                            {
                              extracted_codes: p.debug.extracted_codes || [],
                              table_w_rows_count: p.debug.table_w_rows_count || 0,
                              table_rows_count: p.debug.table_rows_count || 0,
                              table_debug_rows: p.debug.table_debug_rows || [],
                            },
                            null,
                            2
                          );
                          try {
                            await navigator.clipboard.writeText(txt);
                            setCopiedKey(key);
                            setTimeout(() => setCopiedKey((curr) => (curr === key ? "" : curr)), 1500);
                          } catch {}
                        }}
                      >
                        {copiedKey === `${p.person_key}-${idx}` ? t.copied : t.copyJson}
                      </Button>
                    </div>
                  </details>
                </div>
              )}
              {p.status === "ok" && (
                <>
                  <div className="admin-pdf-check-summary-grid">
                    <div className="admin-pdf-check-summary-item">
                      <span>{t.summaryBefore}</span>
                      <strong>{p.baseline_summary?.missing_total ?? "-"}</strong>
                    </div>
                    <div className="admin-pdf-check-summary-item">
                      <span>{t.summaryAfter}</span>
                      <strong>{p.hypothetical_summary?.missing_total ?? "-"}</strong>
                    </div>
                    <div className={`admin-pdf-check-summary-item ${p.diploma_ready_hypothetical ? "ready" : "not-ready"}`}>
                      <span>{t.summaryReady}</span>
                      <strong>{p.diploma_ready_hypothetical ? t.yes : t.no}</strong>
                    </div>
                  </div>
                  <div className="admin-pdf-check-missing-title">{t.missingRules}</div>
                  {Array.isArray(p.missing_rules_hypothetical) && p.missing_rules_hypothetical.length > 0 ? (
                    <ul className="admin-pdf-check-missing-list">
                      {p.missing_rules_hypothetical.slice(0, 12).map((r, i2) => (
                        <li key={`${r.code || "r"}-${i2}`}>
                          [{r.code}] {r.label} - {r.missing} ({r.value_type})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>{t.noneMissing}</div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </section>
      {activeEdit && (
        <div className="admin-pdf-check-sticky-edit">
          <div className="admin-pdf-check-sticky-text">
            <strong>{t.editingNow}:</strong> {activeEdit.personLabel} - {activeEdit.code || ""} {activeEdit.name ? `(${activeEdit.name})` : ""}
          </div>
          <Button
            type="button"
            className="admin-pdf-check-btn admin-pdf-check-btn-ghost"
            variant="ghost"
            size="sm"
            onClick={() => setRowEditing((prev) => ({ ...prev, [activeEdit.key]: false }))}
          >
            {t.closeEdit}
          </Button>
        </div>
      )}
      <div className="admin-pdf-check-bottom-space" />
    </div>
  );
}

