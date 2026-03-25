import React, { useEffect, useMemo, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import Autocomplete from "../common/Autocomplete";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";
import { API_BASE } from "../../config";

const emptyForm = {
  id: null,
  code: "",
  label_hu: "",
  label_en: "",
  requirement_type: "elective",
  subgroup: "",
  value_type: "credits",
  min_value: 0,
  include_in_total: true,
  sort_order: 0
};

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
      subgroup: "Alcsoport (opcionális, pl. physics_core vagy __NULL__)",
      minValue: "Minimum érték",
      order: "Sorrend",
      code: "Kulcs (code)",
      labelHu: "Megjelenő név (HU)",
      labelEn: "Megjelenő név (EN)",
      includeTotal: "Beleszámít az összesítésbe",
      nullSubgroupDisplay: "-",
      cols: ["#", "Kód", "Megnevezés", "Típus", "Alcsoport", "Mérték", "Minimum"]
    },
    en: {
      selectMajor: "Select a major...",
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
      subgroup: "Subgroup (optional, e.g. physics_core or __NULL__)",
      minValue: "Minimum value",
      order: "Sort order",
      code: "Key (code)",
      labelHu: "Display label (HU)",
      labelEn: "Display label (EN)",
      includeTotal: "Include in total summary",
      nullSubgroupDisplay: "No subgroup",
      cols: ["#", "Code", "Label", "Type", "Subgroup", "Metric", "Min"]
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
      subgroup: row.subgroup || "",
      value_type: row.value_type || "credits",
      min_value: row.min_value || 0,
      include_in_total: !!row.include_in_total,
      sort_order: row.sort_order || 0
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
      subgroup: String(form.subgroup || "").trim() || null,
      value_type: form.value_type,
      min_value: Number(form.min_value || 0),
      include_in_total: !!form.include_in_total,
      sort_order: Number(form.sort_order || 0)
    };
    if (!payload.code || !payload.label_hu) {
      alert(lang === "en" ? "Code and HU label are required." : "A code és a HU címke kötelező.");
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
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Autocomplete
            items={majors}
            idKey="id"
            value={selectedMajorId}
            onChange={v => setSelectedMajorId(v)}
            labelFn={m => (lang === "en" ? (m?.name_en || m?.name || "") : (m?.name || m?.name_en || ""))}
            placeholder={t.selectMajor}
            minChars={1}
          />
        </div>
        <button onClick={openCreate}>{t.add}</button>
        <button onClick={openEdit} disabled={!selectedId}>{t.edit}</button>
        <button onClick={remove} disabled={!selectedId}>{t.del}</button>
        <button onClick={() => selectedMajorId && loadRules(selectedMajorId)}>{t.refresh}</button>
      </div>

      <div style={{ marginBottom: 8, color: "#0b4f85", fontWeight: 700 }}>
        {t.title} {selectedMajor ? `- ${lang === "en" ? (selectedMajor.name_en || selectedMajor.name) : (selectedMajor.name || selectedMajor.name_en)}` : ""}
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <input placeholder={t.code} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
          <input placeholder={t.labelHu} value={form.label_hu} onChange={e => setForm(f => ({ ...f, label_hu: e.target.value }))} />
          <input placeholder={t.labelEn} value={form.label_en} onChange={e => setForm(f => ({ ...f, label_en: e.target.value }))} />
          <select value={form.requirement_type} onChange={e => setForm(f => ({ ...f, requirement_type: e.target.value }))}>
            <option value="required">required</option>
            <option value="elective">elective</option>
            <option value="optional">optional</option>
            <option value="pe">pe</option>
            <option value="practice">practice</option>
          </select>
          <input placeholder={t.subgroup} value={form.subgroup} onChange={e => setForm(f => ({ ...f, subgroup: e.target.value }))} style={{ minWidth: 280 }} />
          <select value={form.value_type} onChange={e => setForm(f => ({ ...f, value_type: e.target.value }))}>
            <option value="credits">credits</option>
            <option value="count">count</option>
            <option value="hours">hours</option>
          </select>
          <input type="number" placeholder={t.minValue} value={form.min_value} onChange={e => setForm(f => ({ ...f, min_value: e.target.value }))} />
          <input type="number" placeholder={t.order} value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={!!form.include_in_total} onChange={e => setForm(f => ({ ...f, include_in_total: e.target.checked }))} />
            {t.includeTotal}
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit">{t.save}</button>
            <button type="button" onClick={() => setShowForm(false)}>{t.cancel}</button>
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

