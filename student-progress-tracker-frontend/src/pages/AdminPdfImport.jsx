import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../context/LangContext";
import { getAccessToken } from "../authStorage";
import useAuthFetch from "../hooks/useAuthFetch";
import { apiUrl } from "../config";
import { authFetch } from "../utils";
import Button from "../components/Button";
import "../styles/AdminPanels.css";

const NEPTUN_MAX_STEPS = 2000;

/** JWT-ből role olvasása admin oldali védéshez. */
function getRoleFromToken() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

/** Stabil kliens oldali azonosító generálása a rules seed táblasorokhoz. */
function genRuleRowId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Seed minimum érték normalizálása: üres -> "", egyébként nemnegatív egész. */
function parseSeedMinValueField(raw) {
  if (raw === undefined || raw === null) return "";
  const s = String(raw).trim();
  if (s === "") return "";
  const x = parseInt(s, 10);
  return Number.isNaN(x) ? "" : Math.max(0, x);
}

/** Fa vagy lapos seed struktúra sorokra lapítása a szerkesztőhöz. */
function flattenSeedToRows(nodes, inheritedParent = "") {
  const rows = [];
  if (!Array.isArray(nodes)) return rows;
  for (const n of nodes) {
    if (!n || typeof n !== "object") continue;
    const rawCode = String(n.code || "").trim();
    const upper = rawCode.toUpperCase();
    const label = String(n.label_hu || "").trim();
    const children = Array.isArray(n.children) ? n.children : [];
    let parentForRow = inheritedParent ? String(inheritedParent).toUpperCase() : "";
    if (n.parent_code != null && String(n.parent_code).trim()) {
      parentForRow = String(n.parent_code).trim().toUpperCase();
    }
    const minVal = parseSeedMinValueField(n.min_value);
    if (upper) {
      rows.push({
        id: genRuleRowId(),
        code: upper,
        label_hu: label || upper,
        parent_code: parentForRow,
        min_value: minVal === "" ? "" : minVal,
        is_specialization_root: !!n.is_specialization_root,
      });
    }
    const walkParent = upper || inheritedParent;
    if (children.length) {
      rows.push(...flattenSeedToRows(children, walkParent));
    }
  }
  return rows;
}

/** Szerkesztett seed sorok backend payload formára alakítása. */
function rowsToRulesSeedPayload(rows) {
  return rows
    .filter((r) => String(r.code || "").trim())
    .map((r) => {
      const code = String(r.code).trim().toUpperCase();
      const o = { code, label_hu: String(r.label_hu || code).trim() || code };
      const p = String(r.parent_code || "").trim().toUpperCase();
      if (p && p !== code) o.parent_code = p;
      const mv = parseSeedMinValueField(r.min_value);
      o.min_value = mv === "" ? null : mv;
      if (r.is_specialization_root) o.is_specialization_root = true;
      return o;
    });
}

function initialRulesSeedRows() {
  return [{ id: genRuleRowId(), code: "", label_hu: "", parent_code: "", min_value: "", is_specialization_root: false }];
}

/** Neptun PDF/tanterv import admin oldal előnézet és mentés lépésekkel. */
export default function AdminPdfImport() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { authFetch } = useAuthFetch();
  const t = {
    hu: {
      title: "Neptun mintatanterv",
      blurb:
        "Csak a teljes Neptun link (https://oktweb.neptun.u-szeged.hu/tanterv/…/tanterv.aspx?kod=…), cél szak. A kódot nem kell külön megadni.",
      backToAdmin: "Vissza az admin felületre",
      importUrlLabel: "Teljes tanterv link",
      importUrlPh: "https://oktweb.neptun.u-szeged.hu/tanterv/tanterv.aspx?kod=…",
      majorLabel: "Szak",
      majorPlaceholder: "Betöltés…",
      rulesSeedTitle: "Saját rule lista",
      rulesSeedRequiredHint: "Kötelező megadni legalább 1 rule sort a szerkesztői tervhez.",
      rulesSeedFillDb: "Betöltés az adatbázisból",
      rulesSeedSaveJsonFile: "JSON fájl mentése",
      rulesSeedCopyRulesJson: "JSON másolása",
      rulesSeedAddRow: "Új szabály",
      rulesSeedRemove: "Törlés",
      rulesSeedColCode: "Kód",
      rulesSeedColLabel: "Megnevezés",
      rulesSeedColParent: "Szülő (üres = gyökér)",
      rulesSeedColMinValue: "Kredit / követelmény",
      rulesSeedColSpec: "Spec.",
      rulesSeedColSpecTitle: "Specializációs fa gyökér (kötelezően egy a párhuzamos ágak közül)",
      rulesSeedMinPlaceholder: "üres = Neptun",
      rulesSeedAdvancedJson: "JSON (haladó)",
      rulesSeedAdvancedHint:
        "Lapos tömb: code, label_hu, opcionális parent_code, opcionális min_value (kézi kredit/követelmény); vagy fa children tömbökkel.",
      rulesSeedPlaceholder: "[]",
      rulesSeedJsonErr: "Érvénytelen JSON (tömb kell).",
      rulesSeedFootNote:
        "A megadott „Kredit / követelmény” érték felülírja a Neptunból olvasott blokk kreditet a tervben és alkalmazáskor; üresen hagyva a Neptun érték marad. A haladás nézetben a szülő elem teljesített kreditje a gyerek blokk alá sorolt tárgyakat is beszámítja.",
      createRulesLabel: "Szabályok létrehozása importnál",
      previewBtn: "Előnézet",
      saveBtn: "Szerkesztői terv",
      importing: "Fut…",
      importResult: "Eredmény",
      copyJson: "JSON másolása",
      copied: "Másolva",
      revertBtn: "Import visszaállítása",
      reverting: "…",
      revertConfirm: "Visszaállítod az utolsó import előtti állapotot?",
    },
    en: {
      title: "Neptun curriculum",
      blurb:
        "Full Neptun URL only (https://oktweb.neptun.u-szeged.hu/tanterv/…/tanterv.aspx?kod=…), target major. Do not enter the kod separately.",
      backToAdmin: "Back to admin",
      importUrlLabel: "Full curriculum URL",
      importUrlPh: "https://oktweb.neptun.u-szeged.hu/tanterv/tanterv.aspx?kod=…",
      majorLabel: "Major",
      majorPlaceholder: "Loading…",
      rulesSeedTitle: "Custom rules list",
      rulesSeedRequiredHint: "At least 1 rules row is required for the editor plan.",
      rulesSeedFillDb: "Load from database",
      rulesSeedSaveJsonFile: "Save JSON file",
      rulesSeedCopyRulesJson: "Copy JSON",
      rulesSeedAddRow: "Add rule",
      rulesSeedRemove: "Remove",
      rulesSeedColCode: "Code",
      rulesSeedColLabel: "Label",
      rulesSeedColParent: "Parent (empty = root)",
      rulesSeedColMinValue: "Credits (requirement)",
      rulesSeedColSpec: "Spec.",
      rulesSeedColSpecTitle: "Mutually exclusive specialization branch root",
      rulesSeedMinPlaceholder: "empty = Neptun",
      rulesSeedAdvancedJson: "JSON (advanced)",
      rulesSeedAdvancedHint:
        "Flat array: code, label_hu, optional parent_code, optional min_value (override); or tree with children.",
      rulesSeedPlaceholder: "[]",
      rulesSeedJsonErr: "Invalid JSON (array required).",
      rulesSeedFootNote:
        "“Credits (requirement)” overrides the Neptun block value in the plan and when applied; leave empty to keep the parsed Neptun value. In progress, a parent rule’s completed credits now include courses under descendant blocks (subtree union).",
      createRulesLabel: "Create rules on import",
      previewBtn: "Preview",
      saveBtn: "Editor plan",
      importing: "Running…",
      importResult: "Result",
      copyJson: "Copy JSON",
      copied: "Copied",
      revertBtn: "Revert import",
      reverting: "…",
      revertConfirm: "Restore state before last import?",
    },
  }[lang === "en" ? "en" : "hu"];

  const [tantervUrl, setTantervUrl] = useState(
    "https://oktweb.neptun.u-szeged.hu/tanterv/tanterv.aspx?kod=BSZKPTI-N1"
  );
  const [majors, setMajors] = useState([]);
  const [majorId, setMajorId] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [importJsonCopied, setImportJsonCopied] = useState(false);
  const [createRules, setCreateRules] = useState(true);
  const [revertLoading, setRevertLoading] = useState(false);
  const [rulesSeedRows, setRulesSeedRows] = useState(initialRulesSeedRows);
  const [rulesSeedShowJson, setRulesSeedShowJson] = useState(false);
  const [rulesSeedJsonDraft, setRulesSeedJsonDraft] = useState("");
  const [rulesSeedJsonCopied, setRulesSeedJsonCopied] = useState(false);

  const rulesSeedPayload = useMemo(() => rowsToRulesSeedPayload(rulesSeedRows), [rulesSeedRows]);
  const hasRulesSeedPayload = rulesSeedPayload.length > 0;

  useEffect(() => {
    const role = getRoleFromToken();
    if (role !== "admin") navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getAccessToken();
        const res = await authFetch(apiUrl("/api/majors?limit=200"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json().catch(() => []);
        if (!cancelled && Array.isArray(data)) setMajors(data);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runNeptunImport = async (dryRun) => {
    setImportError("");
    setImportResult(null);
    const url = String(tantervUrl || "").trim();
    const mid = Number(majorId);
    if (!url) {
      setImportError(lang === "en" ? "Paste the full Neptun curriculum URL." : "Illeszd be a teljes Neptun tanterv linket.");
      return;
    }
    if (!Number.isFinite(mid) || mid < 1) {
      setImportError(lang === "en" ? "Select a major." : "Válassz szakot.");
      return;
    }
    setImportLoading(true);
    try {
      const body = {
        major_id: mid,
        max_steps: NEPTUN_MAX_STEPS,
        create_rules: createRules,
        dry_run: dryRun,
        url,
      };
      const res = await authFetch(apiUrl("/api/admin/tanterv/import"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImportError(
          typeof data?.detail === "string" ? data.detail : data?.detail?.[0] || (lang === "en" ? "Failed." : "Sikertelen.")
        );
        return;
      }
      setImportResult(data);
    } catch (e2) {
      console.error(e2);
      setImportError(lang === "en" ? "Network error." : "Hálózati hiba.");
    } finally {
      setImportLoading(false);
    }
  };

  const createEditorPlan = async () => {
    setImportError("");
    const url = String(tantervUrl || "").trim();
    const mid = Number(majorId);
    if (!url) {
      setImportError(lang === "en" ? "Paste the full Neptun curriculum URL." : "Illeszd be a teljes Neptun tanterv linket.");
      return;
    }
    if (!Number.isFinite(mid) || mid < 1) {
      setImportError(lang === "en" ? "Select a major." : "Válassz szakot.");
      return;
    }
    setImportLoading(true);
    try {
      const body = {
        major_id: mid,
        max_steps: NEPTUN_MAX_STEPS,
        url,
      };
      if (rulesSeedPayload.length === 0) {
        setImportError(lang === "en" ? "Add at least one rule code." : "Legalább egy rule kód kell.");
        setImportLoading(false);
        return;
      }
      body.rules_seed = rulesSeedPayload;
      const res = await authFetch(apiUrl("/api/admin/tanterv/editor-plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImportError(typeof data?.detail === "string" ? data.detail : lang === "en" ? "Plan failed." : "Terv sikertelen.");
        return;
      }
      const pid = String(data?.plan_id || "").trim();
      if (!pid) {
        setImportError(lang === "en" ? "Missing plan id." : "Hiányzó plan_id.");
        return;
      }
      navigate(`/admin/tanterv-plan-editor/${pid}`);
    } catch (e2) {
      console.error(e2);
      setImportError(lang === "en" ? "Network error." : "Hálózati hiba.");
    } finally {
      setImportLoading(false);
    }
  };

  const copyImportJson = async () => {
    if (!importResult) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(importResult, null, 2));
      setImportJsonCopied(true);
      setTimeout(() => setImportJsonCopied(false), 2000);
    } catch {}
  };

  const revertLastImport = async () => {
    const sid = String(importResult?.import_snapshot_id || "").trim();
    const mid = Number(importResult?.major_id || majorId);
    if (!sid || !Number.isFinite(mid) || mid < 1) {
      setImportError(lang === "en" ? "No snapshot." : "Nincs snapshot.");
      return;
    }
    if (!window.confirm(t.revertConfirm)) return;
    setImportError("");
    setRevertLoading(true);
    try {
      const res = await authFetch(apiUrl("/api/admin/tanterv/import-revert"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ major_id: mid, snapshot_id: sid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImportError(typeof data?.detail === "string" ? data.detail : lang === "en" ? "Revert failed." : "Sikertelen.");
        return;
      }
      setImportResult((prev) => ({ ...prev, revert: data }));
    } catch (e2) {
      console.error(e2);
      setImportError(lang === "en" ? "Network error." : "Hálózati hiba.");
    } finally {
      setRevertLoading(false);
    }
  };

  const fillRulesSeedFromMajorDb = async () => {
    const mid = Number(majorId);
    if (!Number.isFinite(mid) || mid < 1) {
      setImportError(lang === "en" ? "Select major first." : "Előbb szak.");
      return;
    }
    setImportError("");
    setImportLoading(true);
    try {
      const res = await authFetch(apiUrl(`/api/admin/tanterv/rule-editor?major_id=${mid}`), { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImportError(typeof data?.detail === "string" ? data.detail : lang === "en" ? "Load failed." : "Betöltés hiba.");
        return;
      }
      const rules = Array.isArray(data?.rules) ? data.rules : [];
      const byCode = new Map(rules.map((r) => [r.code, r]));
      const childLists = new Map();
      for (const r of rules) {
        const p = (r.parent_rule_code || "").trim();
        if (!p || !byCode.has(p)) continue;
        if (!childLists.has(p)) childLists.set(p, []);
        childLists.get(p).push(r);
      }
      const toNode = (r) => {
        const ch = (childLists.get(r.code) || []).slice().sort((a, b) => String(a.code).localeCompare(String(b.code)));
        const node = { code: r.code, label_hu: r.label_hu || r.code };
        if (r.min_value != null && r.min_value !== undefined && String(r.min_value).trim() !== "") {
          const n = Number(r.min_value);
          if (!Number.isNaN(n)) node.min_value = Math.max(0, Math.trunc(n));
        }
        if (r.is_specialization_root) node.is_specialization_root = true;
        if (ch.length) node.children = ch.map(toNode);
        return node;
      };
      const roots = rules
        .filter((r) => {
          const p = (r.parent_rule_code || "").trim();
          return !p || !byCode.has(p);
        })
        .slice()
        .sort((a, b) => String(a.code).localeCompare(String(b.code)));
      const seed = roots.map(toNode);
      const flat = flattenSeedToRows(seed);
      setRulesSeedRows(
        flat.length
          ? flat
          : [{ id: genRuleRowId(), code: "", label_hu: "", parent_code: "", min_value: "", is_specialization_root: false }]
      );
    } catch (e2) {
      console.error(e2);
      setImportError(lang === "en" ? "Network error." : "Hálózati hiba.");
    } finally {
      setImportLoading(false);
    }
  };

  const parentSuggestionCodes = useMemo(() => {
    const s = new Set();
    for (const r of rulesSeedRows) {
      const c = String(r.code || "").trim().toUpperCase();
      if (c) s.add(c);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [rulesSeedRows]);

  const updateRuleRow = (id, patch) => {
    setRulesSeedRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRuleRow = () => {
    setRulesSeedRows((prev) => [
      ...prev,
      { id: genRuleRowId(), code: "", label_hu: "", parent_code: "", min_value: "", is_specialization_root: false },
    ]);
  };

  const removeRuleRow = (id) => {
    const row = rulesSeedRows.find((r) => r.id === id);
    const gone = String(row?.code || "").trim().toUpperCase();
    setRulesSeedRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (!gone) return next;
      return next.map((r) =>
        String(r.parent_code || "").trim().toUpperCase() === gone ? { ...r, parent_code: "" } : r
      );
    });
  };

  const applyRulesSeedJsonDraft = () => {
    try {
      const parsed = JSON.parse(rulesSeedJsonDraft || "[]");
      if (!Array.isArray(parsed)) {
        setImportError(t.rulesSeedJsonErr);
        return;
      }
      const next = flattenSeedToRows(parsed);
      setRulesSeedRows(
        next.length
          ? next
          : [{ id: genRuleRowId(), code: "", label_hu: "", parent_code: "", min_value: "", is_specialization_root: false }]
      );
      setImportError("");
    } catch {
      setImportError(t.rulesSeedJsonErr);
    }
  };

  const rulesSeedPayloadOrAlert = () => {
    const payload = rowsToRulesSeedPayload(rulesSeedRows);
    if (!payload.length) {
      setImportError(lang === "en" ? "Add at least one rule code to export." : "Exporthoz legalább egy rule kód kell.");
      return null;
    }
    setImportError("");
    return payload;
  };

  const downloadRulesSeedJsonFile = () => {
    const payload = rulesSeedPayloadOrAlert();
    if (!payload) return;
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    a.download = `rules-seed-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyRulesSeedJson = async () => {
    const payload = rulesSeedPayloadOrAlert();
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setRulesSeedJsonCopied(true);
      setTimeout(() => setRulesSeedJsonCopied(false), 2000);
    } catch {
      setImportError(lang === "en" ? "Clipboard unavailable." : "A vágólap nem elérhető.");
    }
  };

  const seedBtnStyle = {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid var(--admin-input-border, #cbd5e1)",
    background: "var(--admin-input-bg, #fff)",
    color: "var(--admin-table-fg, #0f172a)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  };

  const pdfActionBtnBase = {
    padding: "10px 14px",
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    border: "1px solid transparent",
    fontFamily: "inherit",
  };

  return (
    <div style={{ padding: 12, marginBottom: 140, maxWidth: 900 }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin" style={{ fontWeight: 700, color: "var(--admin-link-blue, #155a9a)" }}>
          ← {t.backToAdmin}
        </Link>
      </div>
      <h1 className="admin-title" style={{ marginTop: 0 }}>
        {t.title}
      </h1>
      <p style={{ color: "var(--muted, #64748b)", marginTop: 0, fontSize: 14 }}>{t.blurb}</p>

      <div className="admin-card" style={{ marginTop: 16 }}>
        <div className="admin-card-body admin-panel" style={{ padding: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 700, color: "var(--admin-link-blue, #0b4f85)", display: "block", marginBottom: 4 }}>{t.importUrlLabel}</label>
              <input
                className="progress-input"
                style={{ width: "100%", maxWidth: 640 }}
                value={tantervUrl}
                onChange={(e) => setTantervUrl(e.target.value)}
                placeholder={t.importUrlPh}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, color: "var(--admin-link-blue, #0b4f85)", display: "block", marginBottom: 4 }}>{t.majorLabel}</label>
              <select
                className="progress-input"
                style={{ maxWidth: 420, padding: "8px 10px" }}
                value={majorId}
                onChange={(e) => setMajorId(e.target.value)}
              >
                <option value="">{majors.length ? (lang === "en" ? "-" : "-") : t.majorPlaceholder}</option>
                {majors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                padding: 10,
                borderRadius: 8,
                border: "1px solid var(--panel-border, #e2e8f0)",
                background: "var(--admin-sub-btn-bg, var(--panel-bg, #fafafa))",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--admin-table-fg, #0f172a)" }}>{t.rulesSeedTitle}</div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--admin-table-fg, #334155)", lineHeight: 1.45, fontWeight: 600 }}>
                {t.rulesSeedRequiredHint}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted, #64748b)", lineHeight: 1.45 }}>{t.rulesSeedFootNote}</p>
                  <datalist id="rules-seed-parent-suggestions">
                    {parentSuggestionCodes.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <div style={{ marginTop: 10, overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "var(--admin-table-fg, #0f172a)" }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "var(--muted, #475569)" }}>
                          <th style={{ padding: "6px 8px 6px 0", fontWeight: 700 }}>{t.rulesSeedColCode}</th>
                          <th style={{ padding: "6px 8px", fontWeight: 700 }}>{t.rulesSeedColLabel}</th>
                          <th style={{ padding: "6px 8px", fontWeight: 700, minWidth: 140 }}>{t.rulesSeedColParent}</th>
                          <th style={{ padding: "6px 8px", fontWeight: 700, width: 108 }}>{t.rulesSeedColMinValue}</th>
                          <th
                            style={{ padding: "6px 8px", fontWeight: 700, width: 52, textAlign: "center" }}
                            title={t.rulesSeedColSpecTitle}
                          >
                            {t.rulesSeedColSpec}
                          </th>
                          <th style={{ padding: "6px 0 6px 8px", width: 72 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {rulesSeedRows.map((row) => (
                          <tr key={row.id} style={{ borderTop: "1px solid var(--panel-border, #e2e8f0)" }}>
                            <td style={{ padding: "6px 8px 6px 0", verticalAlign: "middle" }}>
                              <input
                                className="progress-input"
                                value={row.code}
                                onChange={(e) => updateRuleRow(row.id, { code: e.target.value.toUpperCase() })}
                                placeholder="MK-…"
                                spellCheck={false}
                                style={{ width: "100%", minWidth: 120, fontSize: 13 }}
                              />
                            </td>
                            <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>
                              <input
                                className="progress-input"
                                value={row.label_hu}
                                onChange={(e) => updateRuleRow(row.id, { label_hu: e.target.value })}
                                style={{ width: "100%", minWidth: 160, fontSize: 13 }}
                              />
                            </td>
                            <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>
                              <input
                                className="progress-input"
                                list="rules-seed-parent-suggestions"
                                value={row.parent_code}
                                onChange={(e) => updateRuleRow(row.id, { parent_code: e.target.value.toUpperCase() })}
                                placeholder="-"
                                spellCheck={false}
                                style={{ width: "100%", minWidth: 120, fontSize: 13 }}
                              />
                            </td>
                            <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>
                              <input
                                className="progress-input"
                                type="text"
                                inputMode="numeric"
                                value={row.min_value === "" || row.min_value === undefined ? "" : String(row.min_value)}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  if (v === "") {
                                    updateRuleRow(row.id, { min_value: "" });
                                    return;
                                  }
                                  const x = parseInt(v, 10);
                                  updateRuleRow(row.id, { min_value: Number.isNaN(x) ? "" : Math.max(0, x) });
                                }}
                                placeholder={t.rulesSeedMinPlaceholder}
                                spellCheck={false}
                                style={{ width: "100%", maxWidth: 96, fontSize: 13 }}
                              />
                            </td>
                            <td style={{ padding: "6px 8px", verticalAlign: "middle", textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={!!row.is_specialization_root}
                                title={t.rulesSeedColSpecTitle}
                                onChange={(e) => updateRuleRow(row.id, { is_specialization_root: e.target.checked })}
                              />
                            </td>
                            <td style={{ padding: "6px 0 6px 8px", verticalAlign: "middle" }}>
                              <Button
                                type="button"
                                onClick={() => removeRuleRow(row.id)}
                                disabled={rulesSeedRows.length <= 1}
                                style={{
                                  ...seedBtnStyle,
                                  color: "#9f1239",
                                  borderColor: "var(--panel-border, #fecaca)",
                                  background: "rgba(244, 63, 94, 0.12)",
                                  opacity: rulesSeedRows.length <= 1 ? 0.45 : 1,
                                  cursor: rulesSeedRows.length <= 1 ? "not-allowed" : "pointer",
                                }}
                              >
                                {t.rulesSeedRemove}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    <Button type="button" disabled={importLoading} onClick={() => addRuleRow()} style={seedBtnStyle} variant="success" size="sm">
                      {t.rulesSeedAddRow}
                    </Button>
                    <Button type="button" disabled={importLoading} onClick={() => fillRulesSeedFromMajorDb()} style={seedBtnStyle} variant="warning" size="sm">
                      {t.rulesSeedFillDb}
                    </Button>
                    <Button type="button" disabled={importLoading} onClick={() => downloadRulesSeedJsonFile()} style={seedBtnStyle} variant="primary" size="sm">
                      {t.rulesSeedSaveJsonFile}
                    </Button>
                    <Button type="button" disabled={importLoading} onClick={() => copyRulesSeedJson()} style={seedBtnStyle} variant="ghost" size="sm">
                      {rulesSeedJsonCopied ? t.copied : t.rulesSeedCopyRulesJson}
                    </Button>
                  </div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      marginTop: 12,
                      color: "var(--muted, #64748b)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={rulesSeedShowJson}
                      onChange={(e) => {
                        const on = e.target.checked;
                        if (on) {
                          setRulesSeedJsonDraft(JSON.stringify(rowsToRulesSeedPayload(rulesSeedRows), null, 2));
                        }
                        setRulesSeedShowJson(on);
                      }}
                    />
                    {t.rulesSeedAdvancedJson}
                  </label>
                  {rulesSeedShowJson ? (
                    <div style={{ marginTop: 8 }}>
                      <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--muted, #64748b)" }}>{t.rulesSeedAdvancedHint}</p>
                      <textarea
                        className="progress-input"
                        value={rulesSeedJsonDraft}
                        onChange={(e) => setRulesSeedJsonDraft(e.target.value)}
                        placeholder={t.rulesSeedPlaceholder}
                        spellCheck={false}
                        style={{
                          width: "100%",
                          minHeight: 140,
                          fontFamily: "ui-monospace, monospace",
                          fontSize: 12,
                        }}
                      />
                      <Button type="button" onClick={() => applyRulesSeedJsonDraft()} style={{ ...seedBtnStyle, marginTop: 6 }} variant="warning" size="sm">
                        {lang === "en" ? "Apply JSON" : "JSON alkalmazása"}
                      </Button>
                    </div>
                  ) : null}
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 14,
                color: "var(--admin-table-fg, #0f172a)",
              }}
            >
              <input type="checkbox" checked={createRules} onChange={(e) => setCreateRules(e.target.checked)} />
              {t.createRulesLabel}
            </label>

            {importError && !importLoading ? (
              <div style={{ color: "var(--req-miss-fg, #b00020)", fontWeight: 700 }}>{importError}</div>
            ) : null}
            {importLoading ? (
              <div style={{ color: "var(--admin-link-blue, #0b4f85)", fontWeight: 600, fontSize: 13 }}>{t.importing}</div>
            ) : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button
                type="button"
                disabled={importLoading}
                onClick={() => runNeptunImport(true)}
                style={{
                  ...pdfActionBtnBase,
                  borderColor: "var(--admin-input-border, #94a3b8)",
                  background: "var(--admin-btn-bg, #f8fafc)",
                  color: "var(--admin-btn-fg, var(--admin-table-fg, #0f172a))",
                  opacity: importLoading ? 0.65 : 1,
                  cursor: importLoading ? "not-allowed" : "pointer",
                }}
              >
                {importLoading ? t.importing : t.previewBtn}
              </button>
              <button
                type="button"
                disabled={importLoading || !hasRulesSeedPayload}
                onClick={() => createEditorPlan()}
                style={{
                  ...pdfActionBtnBase,
                  borderColor: "var(--admin-nav-active-bg, #1e6fbf)",
                  background: "var(--admin-nav-active-bg, #1e6fbf)",
                  color: "var(--admin-nav-active-fg, #ffffff)",
                  opacity: importLoading || !hasRulesSeedPayload ? 0.55 : 1,
                  cursor: importLoading || !hasRulesSeedPayload ? "not-allowed" : "pointer",
                }}
              >
                {importLoading ? t.importing : t.saveBtn}
              </button>
            </div>
          </div>
        </div>
      </div>

      {importResult ? (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="admin-card-body" style={{ padding: 16 }}>
            {Array.isArray(importResult.warnings) && importResult.warnings.length > 0 ? (
              <div
                style={{
                  color: "var(--admin-yellow-row-text, #b45309)",
                  fontWeight: 600,
                  marginBottom: 10,
                  fontSize: 13,
                  padding: 8,
                  background: "var(--admin-yellow-row, #fffbeb)",
                  borderRadius: 6,
                  border: "1px solid var(--admin-toolbar-border, #fde68a)",
                }}
              >
                {importResult.warnings.map((w, i) => (
                  <div key={i}>{w}</div>
                ))}
              </div>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 800, color: "var(--admin-link-blue, #0b4f85)" }}>{t.importResult}</span>
              <Button
                type="button"
                onClick={() => copyImportJson()}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--admin-input-border, #cbd5e1)",
                  background: "var(--admin-input-bg, #fff)",
                  color: "var(--admin-table-fg, #0f172a)",
                }}
                variant="ghost"
                size="sm"
              >
                {importJsonCopied ? t.copied : t.copyJson}
              </Button>
              {importResult?.import_snapshot_id ? (
                <Button
                  type="button"
                  onClick={() => revertLastImport()}
                  disabled={revertLoading || importLoading}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--req-miss-fg, #fecaca)",
                    background: "rgba(248, 113, 113, 0.12)",
                    color: "var(--req-miss-fg, #9f1239)",
                  }}
                  variant="danger"
                  size="sm"
                >
                  {revertLoading ? t.reverting : t.revertBtn}
                </Button>
              ) : null}
            </div>
            <pre
              style={{
                background: "var(--admin-sub-btn-bg, #f8fafc)",
                border: "1px solid var(--panel-border, #e2e8f0)",
                borderRadius: 8,
                padding: 12,
                overflow: "auto",
                maxHeight: 280,
                fontSize: 11,
                color: "var(--admin-table-fg, #0f172a)",
              }}
            >
              {JSON.stringify(importResult, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
      <div style={{ height: 48 }} />
    </div>
  );
}
