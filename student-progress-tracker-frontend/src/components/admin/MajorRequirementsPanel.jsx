import React, { useEffect, useMemo, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import Autocomplete from "../common/Autocomplete";
import Button from "../Button";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";
import { API_BASE } from "../../config";

const emptyForm = {
  id: null,
  code: "",
  label_hu: "",
  label_en: "",
  parent_rule_code: "",
  requirement_type: "elective",
  subgroupMode: "none",
  subgroupCustom: "",
  value_type: "credits",
  min_value: 0,
  include_in_total: true,
  is_specialization_root: false
};

/** Backend subgroup érték -> űrlapmezők (none/sqlNull/custom) leképezés. */
function subgroupToFormFields(subgroup) {
  const raw = subgroup == null ? "" : String(subgroup).trim();
  if (!raw) return { subgroupMode: "none", subgroupCustom: "" };
  if (raw === "__NULL__") return { subgroupMode: "sqlNull", subgroupCustom: "" };
  return { subgroupMode: "custom", subgroupCustom: raw };
}

/** Űrlap subgroup mezők -> backend kompatibilis érték (null / "__NULL__" / string). */
function formFieldsToSubgroup(subgroupMode, subgroupCustom) {
  if (subgroupMode === "sqlNull") return "__NULL__";
  if (subgroupMode === "custom") {
    const s = String(subgroupCustom || "").trim();
    return s || null;
  }
  return null;
}

/** Szakonkénti dinamikus követelmény szabályok admin szerkesztője. */
export default function MajorRequirementsPanel() {
  const { authFetch } = useAuthFetch();
  const { lang } = useLang();
  const [majors, setMajors] = useState([]);
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const t = {
    hu: {
      selectMajor: "Szak kiválasztása...",
      majorFilterLabel: "Szak (szabálylista)",
      hMajorFilter: "Csak a kiválasztott szak szabályai láthatók.",
      title: "Dinamikus szak követelmény szabályok",
      add: "Új szabály",
      edit: "Szerkeszt",
      del: "Töröl",
      clearAll: "Összes törlése",
      refresh: "↻",
      save: "Mentés",
      cancel: "Mégse",
      noMajor: "Válassz szakot.",
      noRow: "Válassz egy szabály sort.",
      delConfirm: "Biztos törlöd a szabályt?",
      clearAllConfirm:
        "Biztos törlöd a kiválasztott szak összes szabályát és kapcsolódó beállítását? Ez a művelet nem vonható vissza.",
      clearAllDone: "A kiválasztott szak szabályai és kapcsolódó beállításai törölve.",
      clearAllHint:
        "Figyelem: ez a művelet a kiválasztott szakhoz tartozó kapcsolódó szabályokat és beállításokat is törli.",
      noRulesToDelete: "Nincs törölhető szabály ennél a szaknál.",
      subgroupHelp: "Alcsoport",
      subgroupNone: "Nincs alcsoport szűrés (általános)",
      subgroupSqlNull: "Csak alcsoport nélküliek",
      subgroupCustom: "Egyedi kulcs (pl. infó / matek blokk)",
      subgroupCustomPh: "pl. demo_koteval_info",
      metricCredits: "Kredit",
      metricCount: "Darab (tárgyak)",
      metricHours: "Óra (spec.)",
      typeRequired: "Kötelező",
      typeElective: "Kötelezően választható",
      typeOptional: "Szabadon választható",
      typePe: "Testnevelés",
      typePractice: "Gyakorlat / szakmai",
      minValue: "Minimum érték",
      code: "Kulcs (code)",
      labelHu: "Megjelenő név (HU)",
      labelEn: "Megjelenő név (EN)",
      includeTotal: "Beleszámít az összesítésbe",
      specRoot: "Spec. fa gyökér",
      specRootHint: "Kölcsönösen kizáró specializációs ág (hallgatói választó); a kód bármi lehet (MK-S-*, SP-*, …).",
      nullSubgroupDisplay: "-",
      cols: ["#", "Kód", "Szülő (fa)", "Megnevezés", "Típus", "Alcsoport", "Mérték", "Minimum", "Spec"],
      parentRule: "Szülő szabály (rollup fa)",
      hParentRule:
        "Üres = gyökér (nincs szülő a követelményfában). Ez más, mint az alcsoport: a fa a haladás összesítőben látszik. Törléshez üresen hagyd és ments.",
      hCode: "Egyedi azonosító.",
      hLabelHu: "Megjelenő név magyarul.",
      hLabelEn: "Megjelenő név angolul (ha van).",
      hType: "Szabály típusa.",
      hMetric: "Mérték típusa (kredit / darab / óra).",
      hMin: "Elvárt minimum érték.",
      hSubgroupBlock: "Alcsoport beállítása.",
      hInclude: "Beleszámít az összesítésbe.",
      typeReq: "Követelmény típusa",
      metricLabel: "Mérték (érték típus)"
    },
    en: {
      selectMajor: "Select a major...",
      majorFilterLabel: "Major (rule list)",
      hMajorFilter: "Only rules of the selected major are shown.",
      title: "Dynamic major requirement rules",
      add: "Add rule",
      edit: "Edit",
      del: "Delete",
      clearAll: "Delete all",
      refresh: "↻",
      save: "Save",
      cancel: "Cancel",
      noMajor: "Select a major first.",
      noRow: "Select a rule row.",
      delConfirm: "Delete this rule?",
      clearAllConfirm:
        "Delete all rules and related settings for the selected major? This cannot be undone.",
      clearAllDone: "Rules and related settings were deleted for the selected major.",
      clearAllHint:
        "Warning: this operation also removes related settings for the selected major.",
      noRulesToDelete: "No rules to delete for this major.",
      subgroupHelp: "Subgroup",
      subgroupNone: "No subgroup filter (general)",
      subgroupSqlNull: "Only items without subgroup",
      subgroupCustom: "Custom key (e.g. IT / math block)",
      subgroupCustomPh: "e.g. demo_koteval_info",
      metricCredits: "Credits",
      metricCount: "Count (courses)",
      metricHours: "Hours (special)",
      typeRequired: "Required",
      typeElective: "Elective (compulsory pool)",
      typeOptional: "Optional (free)",
      typePe: "Physical education",
      typePractice: "Practice / internship",
      minValue: "Minimum value",
      code: "Key (code)",
      labelHu: "Display label (HU)",
      labelEn: "Display label (EN)",
      includeTotal: "Include in total summary",
      specRoot: "Spec. tree root",
      specRootHint: "Mutually exclusive specialization branch (student picker); code can be any prefix.",
      nullSubgroupDisplay: "No subgroup",
      cols: ["#", "Code", "Parent (tree)", "Label", "Type", "Subgroup", "Metric", "Min", "Spec"],
      parentRule: "Parent rule (rollup tree)",
      hParentRule:
        "Empty = root (no parent in the requirement tree). Not the same as subgroup. Clear the field and save to remove parent.",
      hCode: "Unique identifier.",
      hLabelHu: "Display label in Hungarian.",
      hLabelEn: "Display label in English (optional).",
      hType: "Rule type.",
      hMetric: "Metric type (credits / count / hours).",
      hMin: "Minimum required value.",
      hSubgroupBlock: "Subgroup setting.",
      hInclude: "Included in summary totals.",
      typeReq: "Requirement type",
      metricLabel: "Metric (value type)"
    }
  }[lang] || {};

  const formatSubgroup = (value) => {
    const raw = String(value || "").trim();
    if (!raw || raw === "__NULL__") return t.nullSubgroupDisplay || "-";
    return raw;
  };

  const selectedMajor = useMemo(
    () => majors.find(m => String(m.id) === String(selectedMajorId)),
    [majors, selectedMajorId]
  );

  const subgroupSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          (items || [])
            .map((x) => String(x?.subgroup || "").trim())
            .filter((x) => x && x !== "__NULL__")
        )
      ).sort((a, b) => a.localeCompare(b)),
    [items]
  );

  /** Más szabály kódjai szülőválasztáshoz (önmaga kizárva). */
  const parentRuleSuggestions = useMemo(() => {
    const self = String(form.code || "")
      .trim()
      .toUpperCase();
    return (items || [])
      .map((x) => String(x?.code || "").trim().toUpperCase())
      .filter((c) => c && (!self || c !== self))
      .sort((a, b) => a.localeCompare(b));
  }, [items, form.code]);

  const loadMajors = async () => {
    const res = await authFetch(`${API_BASE}/api/majors?limit=10000`);
    const data = await res.json().catch(() => []);
    const arr = Array.isArray(data) ? data : [];
    setMajors(arr);
    if (!selectedMajorId && arr.length > 0) setSelectedMajorId(String(arr[0].id));
  };

  const loadRules = async (majorId) => {
    if (!majorId) return;
    const res = await authFetch(`${API_BASE}/api/major_requirement_rules/by-major/${encodeURIComponent(majorId)}`);
    const data = await res.json().catch(() => []);
    setItems(Array.isArray(data) ? data : []);
    setSelectedId(null);
  };

  useEffect(() => {
    loadMajors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authFetch]);

  useEffect(() => {
    if (!selectedMajorId) return;
    loadRules(selectedMajorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMajorId]);

  const openCreate = () => {
    if (!selectedMajorId) return alert(t.noMajor);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = () => {
    if (!selectedId) return alert(t.noRow);
    const row = items.find(x => String(x.id) === String(selectedId));
    if (!row) return alert(t.noRow);
    setForm({
      id: row.id,
      code: row.code || "",
      label_hu: row.label_hu || "",
      label_en: row.label_en || "",
      parent_rule_code: row.parent_rule_code ? String(row.parent_rule_code).trim().toUpperCase() : "",
      requirement_type: row.requirement_type || "elective",
      ...subgroupToFormFields(row.subgroup),
      value_type: row.requirement_type === "pe" ? "count" : (row.value_type || "credits"),
      min_value: row.min_value || 0,
      include_in_total: !!row.include_in_total,
      is_specialization_root: !!row.is_specialization_root
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!selectedMajorId) return alert(t.noMajor);
    const codeUpper = String(form.code || "").trim().toUpperCase();
    const parentRaw = String(form.parent_rule_code || "").trim().toUpperCase();
    if (parentRaw && parentRaw === codeUpper) {
      alert(lang === "en" ? "Parent rule cannot be the same as the rule code." : "A szülő nem lehet ugyanaz, mint a szabály kódja.");
      return;
    }
    const payload = {
      major_id: Number(selectedMajorId),
      code: String(form.code || "").trim(),
      label_hu: String(form.label_hu || "").trim(),
      label_en: String(form.label_en || "").trim() || null,
      requirement_type: form.requirement_type,
      subgroup: formFieldsToSubgroup(form.subgroupMode, form.subgroupCustom),
      parent_rule_code: parentRaw || null,
      value_type: form.requirement_type === "pe" ? "count" : form.value_type,
      min_value: Number(form.min_value || 0),
      include_in_total: !!form.include_in_total,
      is_specialization_root: !!form.is_specialization_root
    };
    if (!payload.code || !payload.label_hu) {
      alert(lang === "en" ? "Code and HU label are required." : "A code és a HU címke kötelező.");
      return;
    }
    if (form.subgroupMode === "custom" && !String(form.subgroupCustom || "").trim()) {
      alert(lang === "en" ? "Enter a subgroup key or choose another subgroup option." : "Adj meg egyedi alcsoport kulcsot, vagy válassz másik alcsoport módot.");
      return;
    }

    const url = form.id
      ? `${API_BASE}/api/major_requirement_rules/${encodeURIComponent(form.id)}`
      : `${API_BASE}/api/major_requirement_rules`;
    const method = form.id ? "PUT" : "POST";
    const res = await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.detail || (lang === "en" ? "Save failed." : "Mentés sikertelen."));
      return;
    }
    setShowForm(false);
    await loadRules(selectedMajorId);
  };

  const remove = async () => {
    if (!selectedId) return alert(t.noRow);
    if (!confirm(t.delConfirm)) return;
    const res = await authFetch(`${API_BASE}/api/major_requirement_rules/${encodeURIComponent(selectedId)}`, { method: "DELETE" });
    if (res.ok) await loadRules(selectedMajorId);
    else alert(lang === "en" ? "Delete failed." : "Törlés sikertelen.");
  };

  const removeAllForMajor = async () => {
    if (!selectedMajorId) return alert(t.noMajor);
    if (!items.length) return alert(t.noRulesToDelete);
    if (!confirm(t.clearAllConfirm)) return;
    setBulkDeleteLoading(true);
    try {
      const res = await authFetch(
        `${API_BASE}/api/major_requirement_rules/bulk/by-major/${encodeURIComponent(selectedMajorId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.detail || (lang === "en" ? "Bulk delete failed." : "Összes törlése sikertelen."));
        return;
      }
      const data = await res.json().catch(() => ({}));
      await loadRules(selectedMajorId);
      const rulesN = Number(data?.deleted_rules_count || 0);
      const cmN = Number(data?.deleted_course_major_count || 0);
      alert(`${t.clearAllDone} (${rulesN} rule, ${cmN} course-major)`);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap" }}>
        <div className="admin-form-field admin-form-field--h" style={{ flex: 1, minWidth: 260 }}>
          <div className="admin-form-label-text">{t.majorFilterLabel}</div>
          <div className="admin-form-control-wrap">
            <Autocomplete
              items={majors}
              idKey="id"
              value={selectedMajorId}
              onChange={v => setSelectedMajorId(v)}
              labelFn={m => (lang === "en" ? (m?.name_en || m?.name || "") : (m?.name || m?.name_en || ""))}
              placeholder={t.selectMajor}
              title={t.hMajorFilter}
              minChars={1}
            />
          </div>
          <div className="admin-form-col-hint">{t.hMajorFilter}</div>
        </div>
        <div className="admin-form-field admin-form-field--actions admin-form-field--h-actions" style={{ flex: "0 0 auto" }}>
          <div className="admin-form-actions-inner" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button type="button" onClick={openCreate} variant="success" size="sm">{t.add}</Button>
            <Button type="button" onClick={openEdit} disabled={!selectedId} variant="warning" size="sm">{t.edit}</Button>
            <Button type="button" onClick={remove} disabled={!selectedId} variant="danger" size="sm">{t.del}</Button>
            <Button
              type="button"
              onClick={removeAllForMajor}
              disabled={!selectedMajorId || bulkDeleteLoading || items.length === 0}
              variant="danger"
              size="sm"
            >
              {t.clearAll}
            </Button>
            <Button type="button" onClick={() => selectedMajorId && loadRules(selectedMajorId)} variant="ghost" size="sm">{t.refresh}</Button>
          </div>
          <div className="admin-form-hint-spacer" aria-hidden="true">.</div>
        </div>
      </div>
      <div className="major-rules-clear-hint">
        {t.clearAllHint}
      </div>

      <div className="major-rules-section-title">
        {t.title} {selectedMajor ? `- ${lang === "en" ? (selectedMajor.name_en || selectedMajor.name) : (selectedMajor.name || selectedMajor.name_en)}` : ""}
      </div>

      {showForm && (
        <form onSubmit={submit} className="major-rules-form major-rules-form--editor">
          <div className="major-rules-form__grid major-rules-form__grid--codes">
            <div className="admin-form-field admin-form-field--h">
              <div className="admin-form-label-text">{t.code}</div>
              <div className="admin-form-control-wrap">
                <input className="progress-input" placeholder={t.code} title={t.hCode} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>
              <div className="admin-form-col-hint">{t.hCode}</div>
            </div>
            <div className="admin-form-field admin-form-field--h">
              <div className="admin-form-label-text">{t.labelHu}</div>
              <div className="admin-form-control-wrap">
                <input className="progress-input" placeholder={t.labelHu} title={t.hLabelHu} value={form.label_hu} onChange={e => setForm(f => ({ ...f, label_hu: e.target.value }))} />
              </div>
              <div className="admin-form-col-hint">{t.hLabelHu}</div>
            </div>
            <div className="admin-form-field admin-form-field--h">
              <div className="admin-form-label-text">{t.labelEn}</div>
              <div className="admin-form-control-wrap">
                <input className="progress-input" placeholder={t.labelEn} title={t.hLabelEn} value={form.label_en} onChange={e => setForm(f => ({ ...f, label_en: e.target.value }))} />
              </div>
              <div className="admin-form-col-hint">{t.hLabelEn}</div>
            </div>
          </div>
          <div className="major-rules-form__grid major-rules-form__grid--metrics">
            <div className="admin-form-field admin-form-field--h">
              <div className="admin-form-label-text">{t.typeReq}</div>
              <div className="admin-form-control-wrap">
                <select
                  className="progress-input"
                  style={{ minHeight: 40 }}
                  value={form.requirement_type}
                  onChange={e => {
                    const v = e.target.value;
                    setForm(f => ({
                      ...f,
                      requirement_type: v,
                      ...(v === "pe" ? { value_type: "count" } : {})
                    }));
                  }}
                  aria-label="requirement type"
                  title={t.hType}
                >
                  <option value="required">{t.typeRequired}</option>
                  <option value="elective">{t.typeElective}</option>
                  <option value="optional">{t.typeOptional}</option>
                  <option value="pe">{t.typePe}</option>
                  <option value="practice">{t.typePractice}</option>
                </select>
              </div>
              <div className="admin-form-col-hint">{t.hType}</div>
            </div>
            <div className="admin-form-field admin-form-field--h">
              <div className="admin-form-label-text">{t.metricLabel}</div>
              <div className="admin-form-control-wrap">
                <select
                  className="progress-input"
                  style={{ minHeight: 40 }}
                  value={form.requirement_type === "pe" ? "count" : form.value_type}
                  onChange={e => setForm(f => ({ ...f, value_type: e.target.value }))}
                  disabled={form.requirement_type === "pe"}
                  aria-label="value type"
                  title={form.requirement_type === "pe" ? (lang === "en" ? "PE is always counted as completed courses/semesters, not credits." : "A testnevelés mindig teljesített tárgyak/félévek szerint számol, nem kredit szerint.") : t.hMetric}
                >
                  <option value="credits">{t.metricCredits}</option>
                  <option value="count">{t.metricCount}</option>
                  <option value="hours">{t.metricHours}</option>
                </select>
              </div>
              <div className="admin-form-col-hint">{t.hMetric}</div>
            </div>
            <div className="admin-form-field admin-form-field--h major-rules-field--min">
              <div className="admin-form-label-text">{t.minValue}</div>
              <div className="admin-form-control-wrap">
                <input
                  className="progress-input"
                  type="number"
                  step="any"
                  placeholder={t.minValue}
                  title={t.hMin}
                  value={form.min_value}
                  onChange={e => setForm(f => ({ ...f, min_value: e.target.value }))}
                />
              </div>
              <div className="admin-form-col-hint">{t.hMin}</div>
            </div>
          </div>
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.parentRule}</div>
            <div className="admin-form-control-wrap">
              <input
                className="progress-input"
                list="mrp-parent-suggestions"
                placeholder={lang === "en" ? "empty = root" : "üres = gyökér"}
                title={t.hParentRule}
                value={form.parent_rule_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parent_rule_code: e.target.value.toUpperCase() }))
                }
                spellCheck={false}
                autoComplete="off"
              />
              <datalist id="mrp-parent-suggestions">
                {parentRuleSuggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="admin-form-col-hint">{t.hParentRule}</div>
          </div>
          <fieldset className="major-rules-form__fieldset">
            <legend className="major-rules-form__fieldset-legend">
              {t.subgroupHelp}
              <span className="admin-form-col-hint" style={{ display: "block", fontWeight: 500, marginTop: 4 }}>{t.hSubgroupBlock}</span>
            </legend>
            <div style={{ display: "grid", gap: 8 }}>
              <select
                className="progress-input"
                value={form.subgroupMode}
                onChange={(e) => setForm((f) => ({ ...f, subgroupMode: e.target.value }))}
                title={t.hSubgroupBlock}
              >
                <option value="none">{t.subgroupNone}</option>
                <option value="sqlNull">{t.subgroupSqlNull}</option>
                <option value="custom">{t.subgroupCustom}</option>
              </select>
              {form.subgroupMode === "custom" && (
                <>
                  <input
                    className="progress-input"
                    list="mrp-subgroup-suggestions"
                    placeholder={t.subgroupCustomPh}
                    value={form.subgroupCustom}
                    onChange={e => setForm(f => ({ ...f, subgroupCustom: e.target.value, subgroupMode: "custom" }))}
                  />
                  <datalist id="mrp-subgroup-suggestions">
                    {subgroupSuggestions.map((sg) => (
                      <option key={sg} value={sg} />
                    ))}
                  </datalist>
                </>
              )}
            </div>
          </fieldset>
          <label className="major-rules-form__check-label">
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={!!form.include_in_total} onChange={e => setForm(f => ({ ...f, include_in_total: e.target.checked }))} />
              <span className="major-rules-form__check-title">{t.includeTotal}</span>
            </span>
            <span className="admin-form-col-hint" style={{ paddingLeft: 28 }}>{t.hInclude}</span>
          </label>
          <label className="major-rules-form__check-label">
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={!!form.is_specialization_root}
                onChange={(e) => setForm((f) => ({ ...f, is_specialization_root: e.target.checked }))}
              />
              <span className="major-rules-form__check-title">{t.specRoot}</span>
            </span>
            <span className="admin-form-col-hint" style={{ paddingLeft: 28 }}>{t.specRootHint}</span>
          </label>
          <div className="admin-form-field admin-form-field--actions admin-form-field--h-actions" style={{ flex: "0 0 auto" }}>
            <div className="admin-form-actions-inner" style={{ display: "flex", gap: 8 }}>
              <Button type="submit" variant="success" size="sm">{t.save}</Button>
              <Button type="button" onClick={() => setShowForm(false)} variant="ghost" size="sm">{t.cancel}</Button>
            </div>
            <div className="admin-form-hint-spacer" aria-hidden="true">.</div>
          </div>
        </form>
      )}

      <div className="admin-card">
        <div className="admin-card-body">
          <div className="major-rules-table-wrap">
          <table className="progress-table major-rules-table">
            <thead>
              <tr>
                {t.cols.map(c => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {items.map(r => {
                const isSel = String(r.id) === String(selectedId);
                return (
                  <tr key={r.id} className={isSel ? "row-selected" : ""} onClick={() => setSelectedId(isSel ? null : r.id)} style={{ cursor: "pointer" }}>
                    <td>{r.id}</td>
                    <td>{r.code}</td>
                    <td>{r.parent_rule_code || "—"}</td>
                    <td>{lang === "en" ? (r.label_en || r.label_hu) : r.label_hu}</td>
                    <td>{r.requirement_type}</td>
                    <td>{formatSubgroup(r.subgroup)}</td>
                    <td>{r.value_type}</td>
                    <td>{r.min_value}</td>
                    <td title={t.specRootHint}>{r.is_specialization_root ? "✓" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>

    </div>
  );
}

