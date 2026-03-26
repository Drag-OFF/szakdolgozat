import React, { useEffect, useMemo, useState } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";
import { API_BASE } from "../../config";

const PAGE_SIZE = 10;

const ADMIN_MAJORS_TEXTS = {
  hu: {
    title: "Szakok",
    searchPlaceholder: "Keresés név alapján...",
    edit: "Szerkeszt",
    remove: "Töröl",
    create: "Létrehoz",
    cancel: "Mégse",
    loading: "Szakok betöltése...",
    name: "Szak megnevezése (HU)",
    nameColHint: "A táblázat szaknév (HU) oszlopába kerül.",
    nameEn: "Szak megnevezése (EN)",
    nameEnColHint: "A táblázat angol név oszlopába kerül (ha kitöltöd).",
    phName: "pl. Informatika BSc",
    phNameEn: "pl. Computer Science BSc",
    tiName: "A szak megnevezése magyarul — a táblázat első név oszlopa.",
    tiNameEn: "Angol megnevezés; a táblázat angol oszlopában jelenik meg.",
    save: "Mentés",
    update: "Frissítés",
    reload: "↻",
    noResults: "Nincs találat",
    pickRow: "Válassz rekordot",
    confirmDelete: "Biztos törlöd?",
    createdOk: "Sikeres létrehozás.",
    updatedOk: "Sikeres frissítés.",
    deletedOk: "Törlés sikeres."
  },
  en: {
    title: "Majors",
    searchPlaceholder: "Search by name...",
    edit: "Edit",
    remove: "Delete",
    create: "Create",
    cancel: "Cancel",
    loading: "Loading majors...",
    name: "Major name (HU)",
    nameColHint: "Maps to the table’s Hungarian name column.",
    nameEn: "Major name (EN)",
    nameEnColHint: "Maps to the English name column when provided.",
    phName: "e.g. Computer Science BSc",
    phNameEn: "e.g. Computer Science BSc",
    tiName: "Hungarian name of the major — shown in the first name column.",
    tiNameEn: "English name; shown in the English column.",
    save: "Save",
    update: "Update",
    reload: "↻",
    noResults: "No results",
    pickRow: "Select a row",
    confirmDelete: "Are you sure you want to delete?",
    createdOk: "Created successfully.",
    updatedOk: "Updated successfully.",
    deletedOk: "Deleted successfully."
  }
};

export default function MajorsPanel() {
  const { authFetch } = useAuthFetch();
  const { lang } = useLang();
  const t = ADMIN_MAJORS_TEXTS[lang] || ADMIN_MAJORS_TEXTS.hu;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: null, name: "", name_en: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/api/majors?limit=10000`);
      const data = await res.json().catch(() => []);
      setItems(Array.isArray(data) ? data : []);
      setPage(0);
      setSelectedId(null);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authFetch]);

  const filtered = useMemo(() => {
    const q = String(query || "").toLowerCase().trim();
    if (!q) return items;
    return items.filter(m =>
      String(m?.name || "").toLowerCase().includes(q) ||
      String(m?.name_en || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const displayed = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => {
    setForm({ id: null, name: "", name_en: "" });
    setShowForm(true);
  };

  const openEdit = () => {
    if (!selectedId) return alert(t.pickRow);
    const m = items.find(x => String(x.id) === String(selectedId));
    if (!m) return alert(lang === "en" ? "No such row." : "Nincs ilyen rekord");
    setForm({ id: m.id, name: m.name || "", name_en: m.name_en || "" });
    setShowForm(true);
  };

  const submit = async (e) => {
    e?.preventDefault();
    try {
      const payload = {
        name: String(form.name || "").trim(),
        name_en: String(form.name_en || "").trim() || null
      };
      if (!payload.name) return alert(lang === "en" ? "Name is required." : "A név kötelező.");

      if (form.id) {
        const res = await authFetch(`${API_BASE}/api/majors/${encodeURIComponent(form.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`PUT failed ${res.status}`);
        alert(t.updatedOk);
      } else {
        const res = await authFetch(`${API_BASE}/api/majors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`POST failed ${res.status}`);
        alert(t.createdOk);
      }

      setShowForm(false);
      await load();
    } catch (e2) {
      console.error(e2);
      alert(lang === "en" ? "Save failed." : "Mentés sikertelen.");
    }
  };

  const remove = async () => {
    if (!selectedId) return alert(t.pickRow);
    if (!confirm(t.confirmDelete)) return;
    try {
      const res = await authFetch(`${API_BASE}/api/majors/${encodeURIComponent(selectedId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`DELETE failed ${res.status}`);
      alert(t.deletedOk);
      setSelectedId(null);
      await load();
    } catch (e) {
      console.error(e);
      alert(lang === "en" ? "Delete failed." : "Törlés sikertelen.");
    }
  };

  return (
    <div className="admin-panel">
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <input
          className="progress-input"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={openCreate} disabled={showForm}>{t.create}</button>
        <button onClick={openEdit} disabled={showForm || !selectedId}>{t.edit}</button>
        <button onClick={remove} disabled={showForm || !selectedId}>{t.remove}</button>
        <button onClick={load} disabled={showForm}>{t.reload}</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="admin-form-grid admin-form-grid--align-start admin-form-grid--fit">
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.name}</div>
            <div className="admin-form-control-wrap">
              <input
                className="progress-input"
                placeholder={t.phName}
                title={t.tiName}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: "100%" }}
              />
            </div>
            <div className="admin-form-col-hint">{t.nameColHint}</div>
          </div>
          <div className="admin-form-field admin-form-field--h">
            <div className="admin-form-label-text">{t.nameEn}</div>
            <div className="admin-form-control-wrap">
              <input
                className="progress-input"
                placeholder={t.phNameEn}
                title={t.tiNameEn}
                value={form.name_en}
                onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                style={{ width: "100%" }}
              />
            </div>
            <div className="admin-form-col-hint">{t.nameEnColHint}</div>
          </div>
          <div className="admin-form-field admin-form-field--actions admin-form-field--h-actions">
            <div className="admin-form-actions-inner" style={{ display: "flex", gap: 8 }}>
              <button type="submit">{form.id ? t.update : t.save}</button>
              <button type="button" onClick={() => setShowForm(false)}>{t.cancel}</button>
            </div>
            <div className="admin-form-hint-spacer" aria-hidden="true">.</div>
          </div>
        </form>
      )}

      {loading ? (
        <div>{t.loading}</div>
      ) : (
        <div className="admin-card">
          <div className="admin-card-body">
            <table className="progress-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t.name}</th>
                  <th>{t.nameEn}</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ color: "#666", padding: 12 }}>
                      {t.noResults}
                    </td>
                  </tr>
                ) : (
                  displayed.map(m => {
                    const isSel = String(m.id) === String(selectedId);
                    return (
                      <tr
                        key={m.id}
                        className={isSel ? "row-selected" : ""}
                        onClick={() => { if (!showForm) setSelectedId(m.id); }}
                        style={{ cursor: showForm ? "default" : "pointer" }}
                      >
                        <td>{m.id}</td>
                        <td>{m.name}</td>
                        <td>{m.name_en || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
          {lang === "en" ? "Prev" : "Előző"}
        </button>
        <div>{`${lang === "en" ? "Page" : "Oldal"} ${page + 1} / ${totalPages}`}</div>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
          {lang === "en" ? "Next" : "Következő"}
        </button>
        <div style={{ marginLeft: "auto" }}>{filtered.length} {lang === "en" ? "records" : "rekord"}</div>
      </div>
    </div>
  );
}

