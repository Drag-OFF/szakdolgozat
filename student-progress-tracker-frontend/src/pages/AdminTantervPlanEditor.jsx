import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useAuthFetch from "../hooks/useAuthFetch";
import { apiUrl } from "../config";
import { getAccessToken } from "../authStorage";
import Button from "../components/Button";
import "../styles/AdminPanels.css";

/** JWT role kinyerése admin route védelemhez. */
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

/** Terv min_value mezőjének biztonságos, nemnegatív egészre normalizálása. */
function coercePlanMinValue(v) {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "number" ? v : parseInt(String(v).trim(), 10);
  return Number.isFinite(n) && !Number.isNaN(n) ? Math.max(0, Math.trunc(n)) : 0;
}

/** Új szabály alapértelmezett "primer" jelölése a szint és prefix alapján. */
function defaultPrimaryFromRule(r) {
  const code = String(r.code || "")
    .toUpperCase()
    .replace(/\s/g, "");
  const d = Number(r.depth) || 0;
  const pc = String(r.parent_code || "").toUpperCase();
  if (code.startsWith("MK-") && d === 0) return true;
  if (d === 1 && pc.startsWith("MK-")) return true;
  return false;
}

/** Tanterv importból készült editor terv (rules + rows) részletes szerkesztője. */
export default function AdminTantervPlanEditor() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuthFetch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [ruleSearch, setRuleSearch] = useState("");
  const [rowSearch, setRowSearch] = useState("");
  const [rowSuspiciousOnly, setRowSuspiciousOnly] = useState(false);
  const [rowPage, setRowPage] = useState(0);
  const rowPageSize = 120;
  const [ruleViewMode, setRuleViewMode] = useState("tree");

  useEffect(() => {
    const role = getRoleFromToken();
    if (role !== "admin") navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!planId) return;
      setLoading(true);
      setError("");
      try {
        const res = await authFetch(apiUrl(`/api/admin/tanterv/editor-plan/${planId}`), { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(typeof data?.detail === "string" ? data.detail : "Terv betöltése sikertelen.");
          return;
        }
        if (!cancelled) {
          const rules = Array.isArray(data.rules)
            ? data.rules.map((r) => ({
                ...r,
                min_value: coercePlanMinValue(r.min_value),
                value_type: r.value_type || "credits",
                include_in_total: r.include_in_total !== false,
                is_primary_group: typeof r.is_primary_group === "boolean" ? r.is_primary_group : defaultPrimaryFromRule(r),
                is_specialization_root: typeof r.is_specialization_root === "boolean" ? r.is_specialization_root : false,
              }))
            : [];
          const rows = Array.isArray(data.rows)
            ? data.rows.map((row) => ({
                ...row,
                import_as_course: row.import_as_course !== false,
                code_shape_course: row.code_shape_course !== false,
                heuristic_neptun_concrete_course:
                  row.heuristic_neptun_concrete_course === undefined ? null : row.heuristic_neptun_concrete_course,
                parent_rule_is_neptun_group: row.parent_rule_is_neptun_group === true,
              }))
            : [];
          setPlan({ ...data, rules, rows });
          const ex = {};
          for (const r of rules) ex[r.code] = true;
          setExpanded(ex);
          setRowPage(0);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Hálózati hiba.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch, planId]);

  // Gyors fa-nézethez parent -> gyerekek index.
  const ruleChildren = useMemo(() => {
    const byParent = {};
    for (const r of plan?.rules || []) {
      const p = r.parent_code || "__root__";
      if (!byParent[p]) byParent[p] = [];
      byParent[p].push(r);
    }
    for (const k of Object.keys(byParent)) {
      byParent[k].sort((a, b) => {
        const da = Number(a.depth) || 0;
        const db = Number(b.depth) || 0;
        if (da !== db) return da - db;
        return (a.code || "").localeCompare(b.code || "");
      });
    }
    return byParent;
  }, [plan]);

  const enabledRuleCodes = useMemo(() => {
    const out = [];
    for (const r of plan?.rules || []) if (r.enabled !== false) out.push(r.code);
    return out;
  }, [plan]);

  const primaryRulesFlat = useMemo(() => {
    const list = (plan?.rules || []).filter((r) => r.is_primary_group === true);
    list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
    return list;
  }, [plan?.rules]);

  const updateRule = (code, patch) => {
    setPlan((prev) => ({
      ...prev,
      rules: (prev?.rules || []).map((r) => (r.code === code ? { ...r, ...patch } : r)),
    }));
  };

  const addRule = (parentCode) => {
    setPlan((prev) => {
      const rules = [...(prev?.rules || [])];
      const parent = parentCode ? rules.find((r) => r.code === parentCode) : null;
      const depth = parent ? Number(parent.depth || 0) + 1 : 0;
      const id = `NEW_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
      rules.push({
        id,
        code: id,
        label_hu: "Új csoport",
        requirement_type: "required",
        value_type: "credits",
        min_value: 0,
        include_in_total: true,
        depth,
        parent_code: parentCode || null,
        enabled: true,
        is_primary_group: true,
        is_specialization_root: false,
      });
      return { ...prev, rules };
    });
  };

  const deleteRule = (code) => {
    setPlan((prev) => {
      const removeSet = new Set([code]);
      let changed = true;
      const rules = prev?.rules || [];
      while (changed) {
        changed = false;
        for (const r of rules) {
          if (r.parent_code && removeSet.has(r.parent_code) && !removeSet.has(r.code)) {
            removeSet.add(r.code);
            changed = true;
          }
        }
      }
      const keptRules = rules.filter((r) => !removeSet.has(r.code));
      const keptCodes = new Set(keptRules.map((r) => r.code));
      const rows = (prev?.rows || []).map((row) => ({
        ...row,
        subgroup: row.subgroup && keptCodes.has(row.subgroup) ? row.subgroup : null,
        subgroup_major:
          row.subgroup_major && keptCodes.has(row.subgroup_major) ? row.subgroup_major : null,
      }));
      return { ...prev, rules: keptRules, rows };
    });
  };

  const updateRowSubgroup = (courseCode, subgroup) => {
    const sg = subgroup || null;
    setPlan((prev) => ({
      ...prev,
      rows: (prev?.rows || []).map((r) =>
        r.course_code === courseCode
          ? {
              ...r,
              subgroup: sg,
              subgroup_major: sg,
            }
          : r
      ),
    }));
  };

  const updateRowImport = (courseCode, importAsCourse) => {
    setPlan((prev) => ({
      ...prev,
      rows: (prev?.rows || []).map((r) =>
        r.course_code === courseCode ? { ...r, import_as_course: importAsCourse } : r
      ),
    }));
  };

  const rowMatchesSearch = (row, q) => {
    const s = (q || "").trim().toLowerCase();
    if (!s) return true;
    return (
      String(row.course_code || "")
        .toLowerCase()
        .includes(s) ||
      String(row.name || "")
        .toLowerCase()
        .includes(s) ||
      String(row.parent_rule_code || "")
        .toLowerCase()
        .includes(s)
    );
  };

  const filteredRows = useMemo(() => {
    const all = plan?.rows || [];
    return all.filter((row) => {
      if (rowSuspiciousOnly) {
        const badShape = row.code_shape_course === false;
        const badHours = row.heuristic_neptun_concrete_course === false;
        if (!badShape && !badHours) return false;
      }
      return rowMatchesSearch(row, rowSearch);
    });
  }, [plan?.rows, rowSearch, rowSuspiciousOnly]);

  const rowPageMax = Math.max(0, Math.ceil(filteredRows.length / rowPageSize) - 1);
  const rowPageSafe = Math.min(rowPage, rowPageMax);

  useEffect(() => {
    if (rowPage !== rowPageSafe) setRowPage(rowPageSafe);
  }, [rowPage, rowPageSafe]);

  const pagedRows = useMemo(() => {
    const start = rowPageSafe * rowPageSize;
    return filteredRows.slice(start, start + rowPageSize);
  }, [filteredRows, rowPageSafe, rowPageSize]);

  useEffect(() => {
    setRowPage(0);
  }, [rowSearch, rowSuspiciousOnly]);

  const setBulkImportForFiltered = (value) => {
    const codes = new Set(filteredRows.map((r) => r.course_code));
    setPlan((prev) => ({
      ...prev,
      rows: (prev?.rows || []).map((r) => (codes.has(r.course_code) ? { ...r, import_as_course: value } : r)),
    }));
  };

  const filteredRulesFlat = useMemo(() => {
    const q = (ruleSearch || "").trim().toLowerCase();
    const rules = plan?.rules || [];
    if (!q) return [];
    return rules.filter(
      (r) =>
        String(r.code || "")
          .toLowerCase()
          .includes(q) ||
        String(r.label_hu || "")
          .toLowerCase()
          .includes(q) ||
        String(r.parent_code || "")
          .toLowerCase()
          .includes(q)
    );
  }, [plan?.rules, ruleSearch]);

  const downloadPlanJson = () => {
    if (!plan || !planId) return;
    const payload = {
      exported_at: new Date().toISOString(),
      plan_id: planId,
      major_id: plan.major_id,
      kod: plan.kod,
      parse: plan.parse,
      expand: plan.expand,
      rules_course_like_discarded: plan.rules_course_like_discarded,
      rules: plan.rules,
      rows: plan.rows,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tanterv-plan-${planId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importBtnStyle = {
    padding: "10px 18px",
    borderRadius: 6,
    border: "1px solid #15803d",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  };

  const applyPlan = async () => {
    if (!plan) return;
    if (!window.confirm("Biztosan alkalmazod a szerkesztett tervet? Ekkor adatok mentése történik az adatbázisba.")) return;
    setSaving(true);
    setError("");
    try {
      const res = await authFetch(apiUrl(`/api/admin/tanterv/editor-plan/${planId}/apply`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          major_id: plan.major_id,
          kod: plan.kod,
          rules: plan.rules,
          rows: plan.rows,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.detail === "string" ? data.detail : "Alkalmazás sikertelen.");
        return;
      }
      navigate("/admin/pdf-import", { replace: true });
    } catch (e) {
      console.error(e);
      setError("Hálózati hiba.");
    } finally {
      setSaving(false);
    }
  };

  const renderRuleTree = (parentCode, level = 0) => {
    const key = parentCode || "__root__";
    const items = ruleChildren[key] || [];
    return items.map((r) => {
      const hasChild = (ruleChildren[r.code] || []).length > 0;
      const isExpanded = expanded[r.code] !== false;
      const indentPx = 6 + level * 18 + (Number(r.depth) || 0) * 3;
      return (
        <React.Fragment key={r.id || r.code}>
          <tr
            className={level === 0 ? "admin-tpv-rule-root" : undefined}
            style={{
              opacity: r.enabled === false ? 0.55 : 1,
            }}
          >
            <td className="admin-tpv-muted" style={{ padding: 6, textAlign: "center", fontSize: 11 }} title="◼ mélység (Neptun)">
              {r.depth != null ? Number(r.depth) : "-"}
            </td>
            <td className="admin-tpv-muted" style={{ padding: 6, fontSize: 11, whiteSpace: "nowrap" }} title="Szülő a Neptun szerint">
              {r.parent_code || "-"}
            </td>
            <td style={{ padding: 6 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginLeft: level * 14,
                }}
              >
                {hasChild ? (
                  <Button type="button" onClick={() => setExpanded((p) => ({ ...p, [r.code]: !isExpanded }))} variant="ghost" size="sm">
                    {isExpanded ? "-" : "+"}
                  </Button>
                ) : (
                  <span style={{ width: 18 }} />
                )}
                <input
                  type="checkbox"
                  checked={r.enabled !== false}
                  onChange={(e) => updateRule(r.code, { enabled: e.target.checked })}
                />
              </div>
            </td>
            <td style={{ padding: 6, textAlign: "center" }}>
              <input
                type="checkbox"
                checked={r.is_primary_group === true}
                onChange={(e) => updateRule(r.code, { is_primary_group: e.target.checked })}
                title="Fő követelménycsoport (kiemelés / szűréshez)"
              />
            </td>
            <td style={{ padding: 6, textAlign: "center" }}>
              <input
                type="checkbox"
                checked={r.is_specialization_root === true}
                onChange={(e) => updateRule(r.code, { is_specialization_root: e.target.checked })}
                title="Specializációs ág gyökere (kölcsönös kizárás); kód prefixe tetszőleges"
              />
            </td>
            <td style={{ padding: 6, paddingLeft: indentPx }}>
              <input
                className="progress-input"
                value={r.code}
                onChange={(e) => {
                  const oldCode = r.code;
                  const newCode = String(e.target.value || "").trim().toUpperCase();
                  if (!newCode) return;
                  setPlan((prev) => {
                    const rules = (prev?.rules || []).map((x) => {
                      if (x.code === oldCode) return { ...x, code: newCode };
                      if (x.parent_code === oldCode) return { ...x, parent_code: newCode };
                      return x;
                    });
                    const rows = (prev?.rows || []).map((row) => {
                      if (row.subgroup !== oldCode && row.subgroup_major !== oldCode) return row;
                      return {
                        ...row,
                        subgroup: row.subgroup === oldCode ? newCode : row.subgroup,
                        subgroup_major: row.subgroup_major === oldCode ? newCode : row.subgroup_major,
                      };
                    });
                    return { ...prev, rules, rows };
                  });
                }}
                style={{
                  width: 150,
                  textDecoration: r.enabled === false ? "line-through" : "none",
                }}
              />
            </td>
            <td style={{ padding: 6 }}>
              <input
                className="progress-input"
                value={r.label_hu || ""}
                onChange={(e) => updateRule(r.code, { label_hu: e.target.value })}
                style={{ width: "100%", textDecoration: r.enabled === false ? "line-through" : "none" }}
              />
            </td>
            <td style={{ padding: 6 }}>
              <select
                className="progress-input"
                value={r.requirement_type || "required"}
                onChange={(e) => {
                  const v = e.target.value;
                  const patch = { requirement_type: v };
                  if (v === "practice") patch.value_type = "hours";
                  else if (v === "pe") patch.value_type = "count";
                  else patch.value_type = "credits";
                  updateRule(r.code, patch);
                }}
              >
                <option value="required">required</option>
                <option value="elective">elective</option>
                <option value="optional">optional</option>
                <option value="practice">practice</option>
                <option value="pe">pe</option>
              </select>
            </td>
            <td style={{ padding: 6, width: 72 }}>
              <input
                type="number"
                min={0}
                step={1}
                className="progress-input"
                value={coercePlanMinValue(r.min_value)}
                onChange={(e) => {
                  const x = parseInt(e.target.value, 10);
                  updateRule(r.code, { min_value: Number.isNaN(x) ? 0 : Math.max(0, x) });
                }}
                title="minimum (kredit / óra / darab)"
                style={{ width: "100%", padding: "4px 6px" }}
              />
            </td>
            <td style={{ padding: 6, whiteSpace: "nowrap" }}>
              <Button type="button" onClick={() => addRule(r.code)} style={{ marginRight: 8 }} variant="success" size="sm">
                + child
              </Button>
              <Button type="button" onClick={() => deleteRule(r.code)} style={{ color: "#b91c1c" }} variant="danger" size="sm">
                delete
              </Button>
            </td>
          </tr>
          {hasChild && isExpanded ? renderRuleTree(r.code, level + 1) : null}
        </React.Fragment>
      );
    });
  };

  return (
    <div
      className="admin-panel admin-tanterv-plan-editor"
      style={{
        padding: 12,
        marginBottom: loading || !plan ? 120 : 100,
        maxWidth: 1250,
        width: "100%",
        boxSizing: "border-box",
        paddingBottom: loading || !plan ? 12 : 88,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <Link to="/admin/pdf-import" style={{ fontWeight: 700, color: "var(--admin-link-blue, #155a9a)" }}>
          ← Vissza az import oldalra
        </Link>
      </div>
      <h1 className="admin-title" style={{ marginTop: 0 }}>
        Tanterv szerkesztő (import előtt)
      </h1>
      {error ? <div style={{ color: "var(--req-miss-fg, #b00020)", fontWeight: 700, marginBottom: 10 }}>{error}</div> : null}
      {loading ? (
        <div style={{ color: "var(--accent-dark, #0b4f85)", fontWeight: 700 }}>Betöltés…</div>
      ) : (
        <>
          <div className="admin-card" style={{ marginBottom: 12 }}>
            <div className="admin-card-body" style={{ padding: 12 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div style={{ fontWeight: 700 }}>Kód: {plan?.kod}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <Button
                    type="button"
                    onClick={() => applyPlan()}
                    disabled={saving}
                    style={{
                      ...importBtnStyle,
                      opacity: saving ? 0.7 : 1,
                      cursor: saving ? "wait" : "pointer",
                    }}
                    variant="success"
                    size="md"
                  >
                    {saving ? "Import folyamatban…" : "Import az adatbázisba"}
                  </Button>
                  <Button
                    type="button"
                    onClick={downloadPlanJson}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--admin-input-border)",
                      background: "var(--admin-input-bg)",
                      color: "var(--accent-dark)",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                    title="rules + rows + parse meta - bemásolható hibajelentéshez / elemzéshez"
                    variant="primary"
                    size="sm"
                  >
                    Terv export (JSON letöltés)
                  </Button>
                </div>
              </div>
              <div className="admin-tpv-muted" style={{ fontSize: 13 }}>
                parsed: {plan?.parse?.parsed_count} | rule: {(plan?.rules || []).length}
                {plan?.parse?.rules_source ? (
                  <span style={{ color: plan.parse.rules_source === "user_seed" ? "var(--req-over-fg, #0f766e)" : "var(--muted)" }}>
                    {" "}
                    · forrás: {plan.parse.rules_source === "user_seed" ? "felhasználói lista (rules_seed)" : "Neptun auto"}
                  </span>
                ) : null}
                {plan?.parse?.rules_candidates_total != null ? (
                  <span>
                    {" "}
                    (parse-ból {plan?.parse?.rules_candidates_total} fejléc) |{" "}
                  </span>
                ) : (
                  " | "
                )}
                tárgy sorok: {(plan?.rows || []).length}
                {plan?.parse?.has_heti_hours_column === false ? (
                  <span style={{ color: "var(--req-miss-fg, #b45309)" }}> · heti óra adata nem ismert (óra alapú becslés kikapcsolva)</span>
                ) : null}
              </div>
              <p className="admin-tpv-muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 0, lineHeight: 1.4 }}>
                ◼ = behúzás; a „szülő” mező mutatja a láncolatot. A szabályfa alapból összecsukva indul.
              </p>
            </div>
          </div>

          <div className="admin-card" style={{ marginBottom: 12 }}>
            <div className="admin-card-body" style={{ padding: "10px 12px" }}>
              <details>
                <summary
                  className="admin-tpv-details-summary"
                  style={{
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 15,
                    listStyle: "none",
                  }}
                >
                  Követelményszabályok (szülő–gyerek láncolat) - {(plan?.rules || []).length} db · fő:{" "}
                  {primaryRulesFlat.length} (kattints a megnyitáshoz)
                </summary>
                <div style={{ marginTop: 10 }}>
              <p className="admin-tpv-muted" style={{ fontSize: 12, lineHeight: 1.45, marginBottom: 10 }}>
                A listában a fő követelményblokkok láthatók. A részletes adatok az exportban továbbra is elérhetők.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Nézet:</span>
                <label style={{ fontSize: 12, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="ruleViewMode"
                    checked={ruleViewMode === "tree"}
                    onChange={() => setRuleViewMode("tree")}
                  />{" "}
                  Teljes fa
                </label>
                <label style={{ fontSize: 12, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="ruleViewMode"
                    checked={ruleViewMode === "primary_only"}
                    onChange={() => setRuleViewMode("primary_only")}
                  />{" "}
                  Csak „fő” csoportok ({primaryRulesFlat.length})
                </label>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <label className="admin-tpv-muted" style={{ fontSize: 12 }}>
                  Keresés:
                  <input
                    className="progress-input"
                    value={ruleSearch}
                    onChange={(e) => setRuleSearch(e.target.value)}
                    placeholder="kód / név / szülő"
                    style={{ marginLeft: 8, minWidth: 180 }}
                  />
                </label>
                <Button type="button" onClick={downloadPlanJson} style={{ fontSize: 12, color: "var(--accent-dark)" }} variant="ghost" size="sm">
                  JSON export
                </Button>
              </div>
              {ruleSearch.trim() ? (
                <div className="admin-tpv-muted" style={{ fontSize: 11, marginBottom: 8 }}>
                  Szűkített lista ({filteredRulesFlat.length} találat).
                </div>
              ) : null}
              {ruleSearch.trim() && filteredRulesFlat.length ? (
                <div
                  className="admin-tpv-table-wrap"
                  style={{
                    overflow: "auto",
                    maxHeight: 140,
                    marginBottom: 10,
                  }}
                >
                  <table className="progress-table admin-tpv-font-11">
                    <thead>
                      <tr>
                        <th>◼</th>
                        <th>szülő</th>
                        <th>code</th>
                        <th>label</th>
                        <th>type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRulesFlat.map((r) => (
                        <tr key={r.code}>
                          <td style={{ textAlign: "center" }}>{r.depth != null ? r.depth : "-"}</td>
                          <td style={{ fontSize: 11 }}>{r.parent_code || "-"}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{r.code}</td>
                          <td>{r.label_hu}</td>
                          <td>{r.requirement_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <Button type="button" onClick={() => addRule(null)} style={{ marginBottom: 6, fontSize: 12 }} variant="success" size="sm">
                + root rule
              </Button>
              {ruleViewMode === "primary_only" ? (
                <div className="admin-tpv-table-wrap" style={{ overflow: "auto", maxHeight: 360 }}>
                  <table className="progress-table admin-tpv-font-11">
                    <thead className="admin-tpv-thead-mint">
                      <tr>
                        <th>code</th>
                        <th>label</th>
                        <th>szülő</th>
                        <th>◼</th>
                        <th>type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {primaryRulesFlat.map((r) => (
                        <tr key={r.code}>
                          <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{r.code}</td>
                          <td>{r.label_hu}</td>
                          <td className="admin-tpv-muted" style={{ fontSize: 11 }}>
                            {r.parent_code || "-"}
                          </td>
                          <td style={{ textAlign: "center" }}>{r.depth != null ? r.depth : "-"}</td>
                          <td>{r.requirement_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {primaryRulesFlat.length === 0 ? (
                    <div className="admin-tpv-muted" style={{ padding: 12, fontSize: 12 }}>
                      Egyik sor sincs „fő”-nak jelölve - pipázz a Teljes fa nézetben.
                    </div>
                  ) : null}
                </div>
              ) : (
              <div className="admin-tpv-table-wrap" style={{ overflow: "auto", maxHeight: 320 }}>
                <table className="progress-table admin-tpv-font-11">
                  <thead>
                    <tr>
                      <th style={{ padding: 4 }} title="Behúzás mélysége (◼ darab)">
                        ◼
                      </th>
                      <th style={{ padding: 4 }}>szülő</th>
                      <th style={{ padding: 4 }}>on</th>
                      <th style={{ padding: 4 }} title="Fő követelménycsoport">
                        fő
                      </th>
                      <th style={{ padding: 4 }} title="Specializációs fa gyökér - hallgatói választó / NONE szűrés">
                        spec
                      </th>
                      <th style={{ padding: 4 }}>code</th>
                      <th style={{ padding: 4 }}>label</th>
                      <th style={{ padding: 4 }}>type</th>
                      <th style={{ padding: 4 }} title="Követelmény minimum (kredit / darab / óra - value_type szerint)">
                        min
                      </th>
                      <th style={{ padding: 4 }}>actions</th>
                    </tr>
                  </thead>
                  <tbody>{renderRuleTree(null, 0)}</tbody>
                </table>
              </div>
              )}
                </div>
              </details>
            </div>
          </div>

          <div className="admin-card" style={{ marginBottom: 12 }}>
            <div className="admin-card-body" style={{ padding: 12 }}>
              <h3 style={{ marginTop: 0, color: "var(--admin-table-fg)" }}>Tárgyak (kurzus import)</h3>
              <div className="admin-tpv-muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Sárga = új kurzus. Halvány narancs = szokatlan tárgykód alak. Halvány kék = heti/féléves óra 0
                (nem ajánlott import). A csoportosító sorok nem valódi tárgykódok.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <label className="admin-tpv-muted" style={{ fontSize: 13 }}>
                  Keresés:
                  <input
                    className="progress-input"
                    value={rowSearch}
                    onChange={(e) => setRowSearch(e.target.value)}
                    placeholder="kód vagy név"
                    style={{ marginLeft: 8, minWidth: 200 }}
                  />
                </label>
                <label className="admin-tpv-muted" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={rowSuspiciousOnly}
                    onChange={(e) => setRowSuspiciousOnly(e.target.checked)}
                  />
                  Csak gyanús (nem klasszikus kód vagy 0 óra)
                </label>
                <Button type="button" onClick={() => setBulkImportForFiltered(true)} variant="success" size="sm">
                  Látható sorok: import BE
                </Button>
                <Button type="button" onClick={() => setBulkImportForFiltered(false)} variant="danger" size="sm">
                  Látható sorok: import KI
                </Button>
              </div>
              <div className="admin-tpv-muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Szűrt sorok: {filteredRows.length} / összes {(plan?.rows || []).length}
                {filteredRows.length > rowPageSize ? (
                  <span>
                    {" "}
                    · oldal: {rowPageSafe + 1} / {rowPageMax + 1} (laponként max. {rowPageSize} sor a böngésző
                    teljesítménye miatt)
                  </span>
                ) : null}
                {" · "}
                Importálva (pipa): {(plan?.rows || []).filter((r) => r.import_as_course !== false).length}
              </div>
              {filteredRows.length > rowPageSize ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <Button
                    type="button"
                    disabled={rowPageSafe <= 0}
                    onClick={() => setRowPage((p) => Math.max(0, p - 1))}
                    variant="ghost"
                    size="sm"
                  >
                    ← Előző {rowPageSize}
                  </Button>
                  <Button
                    type="button"
                    disabled={rowPageSafe >= rowPageMax}
                    onClick={() => setRowPage((p) => Math.min(rowPageMax, p + 1))}
                    variant="ghost"
                    size="sm"
                  >
                    Következő {rowPageSize} →
                  </Button>
                  <span className="admin-tpv-muted" style={{ fontSize: 12 }}>
                    sorok {rowPageSafe * rowPageSize + 1}–
                    {Math.min(filteredRows.length, (rowPageSafe + 1) * rowPageSize)}
                  </span>
                </div>
              ) : null}
              <div className="admin-tpv-table-wrap" style={{ overflow: "auto", maxHeight: 420 }}>
                <table className="progress-table admin-tpv-font-12">
                  <thead>
                    <tr>
                      <th>import</th>
                      <th title="Behúzás (◼)">◼</th>
                      <th>szülő rule</th>
                      <th>heti</th>
                      <th>fél.óra</th>
                      <th>code</th>
                      <th>name</th>
                      <th>type</th>
                      <th>rule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((row, idx) => {
                      const suspicious = row.code_shape_course === false;
                      const badHours = row.heuristic_neptun_concrete_course === false;
                      let rowClass = "";
                      if (row.is_new_course) rowClass = "admin-tpv-row--new";
                      else if (suspicious) rowClass = "admin-tpv-row--suspicious";
                      else if (badHours) rowClass = "admin-tpv-row--badhours";
                      return (
                        <tr key={`${row.course_code}-${rowPageSafe * rowPageSize + idx}`} className={rowClass || undefined}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={row.import_as_course !== false}
                              onChange={(e) => updateRowImport(row.course_code, e.target.checked)}
                              title="Ha ki van kapcsolva, ez a sor nem kerül kurzusként az adatbázisba"
                            />
                          </td>
                          <td className="admin-tpv-muted" style={{ textAlign: "center", fontSize: 11 }}>
                            {row.block_depth != null ? row.block_depth : "-"}
                          </td>
                          <td
                            style={{ fontSize: 11, whiteSpace: "nowrap" }}
                            title={
                              row.parent_rule_is_neptun_group
                                ? "Csoportosító sor: nem tárgykód."
                                : undefined
                            }
                          >
                            {row.parent_rule_code || "-"}
                            {row.parent_rule_is_neptun_group ? (
                              <span className="admin-tpv-muted" style={{ fontWeight: 600, marginLeft: 4 }}>
                                (csoport)
                              </span>
                            ) : null}
                          </td>
                          <td style={{ textAlign: "right", fontSize: 11 }}>
                            {row.weekly_hours != null ? row.weekly_hours : "-"}
                          </td>
                          <td style={{ textAlign: "right", fontSize: 11 }}>
                            {row.semester_hours != null ? row.semester_hours : "-"}
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            {row.course_code}
                            {suspicious ? (
                              <span style={{ color: "var(--req-miss-fg, #c2410c)", fontWeight: 700, marginLeft: 6 }} title="Nem AB123XY alakú">
                                ?
                              </span>
                            ) : null}
                            {badHours ? (
                              <span style={{ color: "var(--accent, #1d4ed8)", fontWeight: 700, marginLeft: 6 }} title="0 heti/féléves óra">
                                ○
                              </span>
                            ) : null}
                          </td>
                          <td>{row.name}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{row.type}</td>
                          <td>
                            <select
                              className="progress-input"
                              value={row.subgroup || ""}
                              onChange={(e) => updateRowSubgroup(row.course_code, e.target.value)}
                              disabled={row.import_as_course === false}
                            >
                              <option value="">- nincs -</option>
                              {enabledRuleCodes.map((code) => (
                                <option key={code} value={code}>
                                  {code}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="admin-tpv-footer-sep" style={{ marginTop: 16, paddingTop: 12 }}>
            <Button
              type="button"
              onClick={() => applyPlan()}
              disabled={saving}
              style={{
                ...importBtnStyle,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? "wait" : "pointer",
              }}
              variant="success"
              size="md"
            >
              {saving ? "Import folyamatban…" : "Import az adatbázisba (jóváhagyás)"}
            </Button>
            <p className="admin-tpv-muted" style={{ margin: "8px 0 0", fontSize: 12 }}>
              Ugyanaz a művelet, mint felül a kártyában és lent a rögzített sávban - a terv íródik az adatbázisba.
            </p>
          </div>

          <div
            role="region"
            aria-label="Import az adatbázisba"
            className="admin-tpv-sticky-bar"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              padding: "12px 16px",
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {plan?.kod} · {(plan?.rows || []).length} tárgy sor · {(plan?.rules || []).length} rule
            </span>
            <Button
              type="button"
              onClick={() => applyPlan()}
              disabled={saving}
              style={{
                ...importBtnStyle,
                padding: "12px 22px",
                fontSize: 15,
                opacity: saving ? 0.75 : 1,
                cursor: saving ? "wait" : "pointer",
              }}
              variant="success"
              size="lg"
            >
              {saving ? "Import…" : "Import az adatbázisba"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
