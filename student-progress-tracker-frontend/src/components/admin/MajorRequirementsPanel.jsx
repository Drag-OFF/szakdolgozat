import React, { useEffect, useMemo, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import Autocomplete from "../common/Autocomplete";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";
import { API_BASE } from "../../config";

/** subgroupMode: none = nincs alcsoport szűrés (NULL); sqlNull = csak course_major.subgroup IS NULL (__NULL__); custom = egyedi kulcs */
const emptyForm = {
  id: null,
  code: "",
  label_hu: "",
  label_en: "",
  requirement_type: "elective",
  subgroupMode: "none",
  subgroupCustom: "",
  value_type: "credits",
  min_value: 0,
  include_in_total: true
};

function subgroupToFormFields(subgroup) {
  const raw = subgroup == null ? "" : String(subgroup).trim();
  if (!raw) return { subgroupMode: "none", subgroupCustom: "" };
  if (raw === "__NULL__") return { subgroupMode: "sqlNull", subgroupCustom: "" };
  return { subgroupMode: "custom", subgroupCustom: raw };
}

function formFieldsToSubgroup(subgroupMode, subgroupCustom) {
  if (subgroupMode === "sqlNull") return "__NULL__";
  if (subgroupMode === "custom") {
    const s = String(subgroupCustom || "").trim();
    return s || null;
  }
  return null;
}

export default function MajorRequirementsPanel() {
  const { authFetch } = useAuthFetch();
  const { lang } = useLang();
  const [majors, setMajors] = useState([]);
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);

  const t = {
    hu: {
      selectMajor: "Szak kiválasztása...",
      majorFilterLabel: "Szak (szabálylista)",
      hMajorFilter: "A táblázat csak ehhez a szakhoz tartozó szabályokat mutatja",
      title: "Dinamikus szak követelmény szabályok",
      add: "Új szabály",
      edit: "Szerkeszt",
      del: "Töröl",
      refresh: "↻",
      save: "Mentés",
      cancel: "Mégse",
      noMajor: "Válassz szakot.",
      noRow: "Válassz egy szabály sort.",
      delConfirm: "Biztos törlöd a szabályt?",
      subgroupHelp: "Alcsoport",
      subgroupNone: "Nincs alcsoport szűrés (általános)",
      subgroupSqlNull: "Csak „alcsoport nélküli” kurzusok (subgroup üres a táblában)",
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
      nullSubgroupDisplay: "-",
      cols: ["#", "Kód", "Megnevezés", "Típus", "Alcsoport", "Mérték", "Minimum"],
      hCode: "Táblázat oszlop: Kód",
      hLabelHu: "Táblázat: megjelenő név (magyar) — „Megnevezés” oszlop",
      hLabelEn: "Táblázat: angol felirat (ha van)",
      hType: "Táblázat oszlop: Típus (választó)",
      hMetric: "Táblázat oszlop: Mérték (kredit / darab / óra)",
      hMin: "Táblázat oszlop: Minimum (számmező)",
      hSubgroupBlock: "Táblázat oszlop: Alcsoport — a választott mód szerint",
      hInclude: "Nem külön oszlop; az összesítő számításnál számít",
      typeReq: "Követelmény típusa",
      metricLabel: "Mérték (érték típus)"
    },
    en: {
      selectMajor: "Select a major...",
      majorFilterLabel: "Major (rule list)",
      hMajorFilter: "The table below shows rules for this major only",
      title: "Dynamic major requirement rules",
      add: "Add rule",
      edit: "Edit",
      del: "Delete",
      refresh: "↻",
      save: "Save",
      cancel: "Cancel",
      noMajor: "Select a major first.",
      noRow: "Select a rule row.",
      delConfirm: "Delete this rule?",
      subgroupHelp: "Subgroup",
      subgroupNone: "No subgroup filter (general)",
      subgroupSqlNull: "Only courses with empty subgroup in DB",
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
      nullSubgroupDisplay: "No subgroup",
      cols: ["#", "Code", "Label", "Type", "Subgroup", "Metric", "Min"],
      hCode: "Table column: Code",
      hLabelHu: "Table: display label (HU) — „Label” column",
      hLabelEn: "Table: English label (optional)",
      hType: "Table column: Type (dropdown)",
      hMetric: "Table column: Metric (credits / count / hours)",
      hMin: "Table column: Min (number)",
      hSubgroupBlock: "Table column: Subgroup — depends on mode below",
      hInclude: "Not a separate column; used in total summary logic",
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
      requirement_type: row.requirement_type || "elective",
      ...subgroupToFormFields(row.subgroup),
      value_type: row.requirement_type === "pe" ? "count" : (row.value_type || "credits"),
      min_value: row.min_value || 0,
      include_in_total: !!row.include_in_total
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!selectedMajorId) return alert(t.noMajor);
    const payload = {
      major_id: Number(selectedMajorId),
      code: String(form.code || "").trim(),
      label_hu: String(form.label_hu || "").trim(),
      label_en: String(form.label_en || "").trim() || null,
      requirement_type: form.requirement_type,
      subgroup: formFieldsToSubgroup(form.subgroupMode, form.subgroupCustom),
      value_type: form.requirement_type === "pe" ? "count" : form.value_type,
      min_value: Number(form.min_value || 0),
      include_in_total: !!form.include_in_total
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
            <button type="button" onClick={openCreate}>{t.add}</button>
            <button type="button" onClick={openEdit} disabled={!selectedId}>{t.edit}</button>
            <button type="button" onClick={remove} disabled={!selectedId}>{t.del}</button>
            <button type="button" onClick={() => selectedMajorId && loadRules(selectedMajorId)}>{t.refresh}</button>
          </div>
          <div className="admin-form-hint-spacer" aria-hidden="true">.</div>
        </div>
      </div>

      <div style={{ marginBottom: 8, color: "#0b4f85", fontWeight: 700 }}>
        {t.title} {selectedMajor ? `- ${lang === "en" ? (selectedMajor.name_en || selectedMajor.name) : (selectedMajor.name || selectedMajor.name_en)}` : ""}
      </div>

      {showForm && (
        <form onSubmit={submit} className="major-rules-form" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12, padding: 12, background: "#f6f9fc", borderRadius: 8, border: "1px solid #cfe0f5" }}>
          <div className="admin-form-grid admin-form-grid--align-start admin-form-grid--fit">
            <div className="admin-form-field admin-form-field--h" style={{ flex: "0 1 260px", minWidth: 160, maxWidth: 300 }}>
              <div className="admin-form-label-text">{t.code}</div>
              <div className="admin-form-control-wrap">
                <input className="progress-input" placeholder={t.code} title={t.hCode} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>
              <div className="admin-form-col-hint">{t.hCode}</div>
            </div>
            <div className="admin-form-field admin-form-field--h admin-form-field--grow">
              <div className="admin-form-label-text">{t.labelHu}</div>
              <div className="admin-form-control-wrap">
                <input className="progress-input" placeholder={t.labelHu} title={t.hLabelHu} value={form.label_hu} onChange={e => setForm(f => ({ ...f, label_hu: e.target.value }))} />
              </div>
              <div className="admin-form-col-hint">{t.hLabelHu}</div>
            </div>
            <div className="admin-form-field admin-form-field--h admin-form-field--grow">
              <div className="admin-form-label-text">{t.labelEn}</div>
              <div className="admin-form-control-wrap">
                <input className="progress-input" placeholder={t.labelEn} title={t.hLabelEn} value={form.label_en} onChange={e => setForm(f => ({ ...f, label_en: e.target.value }))} />
              </div>
              <div className="admin-form-col-hint">{t.hLabelEn}</div>
            </div>
          </div>
          <div className="admin-form-grid admin-form-grid--align-start admin-form-grid--fit">
            <div className="admin-form-field admin-form-field--h" style={{ flex: "0 1 280px", minWidth: 220, maxWidth: 320 }}>
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
            <div className="admin-form-field admin-form-field--h" style={{ flex: "0 1 240px", minWidth: 200, maxWidth: 300 }}>
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
            <div className="admin-form-field admin-form-field--h" style={{ flex: "0 1 140px", minWidth: 120, maxWidth: 180 }}>
              <div className="admin-form-label-text">{t.minValue}</div>
              <div className="admin-form-control-wrap">
                <input className="progress-input" type="number" placeholder={t.minValue} title={t.hMin} value={form.min_value} onChange={e => setForm(f => ({ ...f, min_value: e.target.value }))} />
              </div>
              <div className="admin-form-col-hint">{t.hMin}</div>
            </div>
          </div>
          <fieldset style={{ margin: 0, padding: "8px 12px", border: "1px solid #bcd", borderRadius: 6 }}>
            <legend style={{ fontWeight: 600 }}>
              {t.subgroupHelp}
              <span className="admin-form-col-hint" style={{ display: "block", fontWeight: 500, marginTop: 4 }}>{t.hSubgroupBlock}</span>
            </legend>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="subgroupMode"
                  checked={form.subgroupMode === "none"}
                  onChange={() => setForm(f => ({ ...f, subgroupMode: "none" }))}
                />
                <span>{t.subgroupNone}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="subgroupMode"
                  checked={form.subgroupMode === "sqlNull"}
                  onChange={() => setForm(f => ({ ...f, subgroupMode: "sqlNull" }))}
                />
                <span>{t.subgroupSqlNull}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="subgroupMode"
                  checked={form.subgroupMode === "custom"}
                  onChange={() => setForm(f => ({ ...f, subgroupMode: "custom" }))}
                />
                <span>{t.subgroupCustom}</span>
                <input
                  placeholder={t.subgroupCustomPh}
                  value={form.subgroupCustom}
                  onChange={e => setForm(f => ({ ...f, subgroupCustom: e.target.value, subgroupMode: "custom" }))}
                  disabled={form.subgroupMode !== "custom"}
                  style={{ minWidth: 200, flex: 1 }}
                />
              </label>
            </div>
          </fieldset>
          <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, cursor: "pointer" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={!!form.include_in_total} onChange={e => setForm(f => ({ ...f, include_in_total: e.target.checked }))} />
              <span style={{ fontWeight: 600 }}>{t.includeTotal}</span>
            </span>
            <span className="admin-form-col-hint" style={{ paddingLeft: 28 }}>{t.hInclude}</span>
          </label>
          <div className="admin-form-field admin-form-field--actions admin-form-field--h-actions" style={{ flex: "0 0 auto" }}>
            <div className="admin-form-actions-inner" style={{ display: "flex", gap: 8 }}>
              <button type="submit">{t.save}</button>
              <button type="button" onClick={() => setShowForm(false)}>{t.cancel}</button>
            </div>
            <div className="admin-form-hint-spacer" aria-hidden="true">.</div>
          </div>
        </form>
      )}

      <div className="admin-card">
        <div className="admin-card-body">
          <table className="progress-table">
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
                    <td>{lang === "en" ? (r.label_en || r.label_hu) : r.label_hu}</td>
                    <td>{r.requirement_type}</td>
                    <td>{formatSubgroup(r.subgroup)}</td>
                    <td>{r.value_type}</td>
                    <td>{r.min_value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

