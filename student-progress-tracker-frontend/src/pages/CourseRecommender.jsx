import React, { useMemo, useState } from "react";
import { useLang } from "../context/LangContext";
import useAuthFetch from "../hooks/useAuthFetch";
import "../styles/ProgressTable.css";
import "../styles/CourseRecommender.css";
import { COURSE_RECOMMENDER_LABELS } from "../translations";
import { API_BASE } from "../config";
import { getUserObject } from "../authStorage";

function splitCodes(raw) {
  return String(raw || "")
    .split(/[,;\n]/g)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.toUpperCase());
}

export default function CourseRecommender() {
  const user = useMemo(() => getUserObject(), []);
  const userId = user?.id;
  const { lang } = useLang();
  const { authFetch } = useAuthFetch();
  const t = COURSE_RECOMMENDER_LABELS[lang] || COURSE_RECOMMENDER_LABELS.hu;

  const [courseCodesRaw, setCourseCodesRaw] = useState("");
  const [parity, setParity] = useState("any"); // any | even | odd
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!userId) {
    return <div className="auth-msg">{t.requiresLogin}</div>;
  }

  const onSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg("");
    setResult(null);

    const course_codes = splitCodes(courseCodesRaw);
    if (!course_codes.length) {
      setErrorMsg(lang === "en" ? "Enter at least one course code." : "Add meg legalább egy kurzuskódot.");
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(
        `${API_BASE}/api/course_recommendations/${encodeURIComponent(userId)}?lang=${encodeURIComponent(lang || "hu")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_codes, semester_parity: parity })
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data?.detail || (lang === "en" ? "Request failed." : "Kérés sikertelen."));
        return;
      }
      setResult(data);
    } catch (e2) {
      console.error(e2);
      setErrorMsg(lang === "en" ? "Network error." : "Hálózati hiba.");
    } finally {
      setLoading(false);
    }
  };

  const recommendedRows = Array.isArray(result?.recommended) ? result.recommended : [];
  const visibleRows = overdueOnly ? recommendedRows.filter(r => r?.is_overdue) : recommendedRows;

  const reasonLabel = (reasonKey) => {
    const map = {
      overdue_by_recommended_semester: lang === "en" ? "Recommended semester is due" : "Ajánlott félév alapján esedékes",
      matches_input_prerequisites: lang === "en" ? "Matches your selected course prerequisites" : "Egyezik a megadott tárgyak előfeltételeivel",
      matches_completed_prerequisites: lang === "en" ? "Builds on your completed subjects" : "A teljesített tárgyaidra épít",
      name_similarity: lang === "en" ? "Similar topic by name" : "Név alapján hasonló témakör",
      category_similarity: lang === "en" ? "Similar category/subgroup" : "Hasonló kategória/alcsoport",
      major_curriculum_candidate: lang === "en" ? "Fits your curriculum" : "Illeszkedik a szakod mintatantervéhez"
    };
    return map[reasonKey] || reasonKey;
  };

  return (
    <div className="progress-tracker-container course-rec-container">
      <h2 className="panel-header-inline">{t.title}</h2>

      <form onSubmit={onSubmit} className="course-rec-form">
        <div>
          <label className="course-rec-label">
            {t.inputLabel}
          </label>
          <textarea
            value={courseCodesRaw}
            onChange={e => setCourseCodesRaw(e.target.value)}
            rows={4}
            placeholder={t.inputPlaceholder}
            className="course-rec-textarea"
          />
        </div>

        <div className="course-rec-filters">
          <label className="course-rec-choice">
            <input type="radio" checked={parity === "any"} onChange={() => setParity("any")} />
            {t.anySemester}
          </label>
          <label className="course-rec-choice">
            <input type="radio" checked={parity === "even"} onChange={() => setParity("even")} />
            {t.evenSemester}
          </label>
          <label className="course-rec-choice">
            <input type="radio" checked={parity === "odd"} onChange={() => setParity("odd")} />
            {t.oddSemester}
          </label>
          <label className="course-rec-choice">
            <input type="checkbox" checked={overdueOnly} onChange={e => setOverdueOnly(e.target.checked)} />
            {t.overdueOnly}
          </label>
        </div>

        <div className="course-rec-actions">
          <button type="submit" disabled={loading}>
            {loading ? t.recommending : t.submit}
          </button>
          <button type="button" disabled={loading} onClick={() => { setCourseCodesRaw(""); setResult(null); setErrorMsg(""); }}>
            {t.clear}
          </button>
        </div>

        {errorMsg && <div style={{ color: "#b00020", fontWeight: 700 }}>{errorMsg}</div>}
      </form>

      {result && (
        <div className="course-rec-result-card">
          <div className="course-rec-header-row">
            <div style={{ fontWeight: 800 }}>
            {t.recommendedTitle}{" "}
            <span style={{ fontWeight: 500, color: "#555" }}>
              ({result?.semester_parity})
            </span>
            </div>
            <div className="course-rec-estimate">
              {t.estimatedSemester}: {result?.current_semester_estimate ?? "-"}
            </div>
          </div>

          {visibleRows.length === 0 ? (
            <div>{t.noRecommendations}</div>
          ) : (
            <div className="course-rec-table-wrap">
            <table className="progress-table" style={{ marginTop: 8, minWidth: 1320 }}>
              <thead>
                <tr>
                  <th>{t.kód}</th>
                  <th>{t.név}</th>
                  <th>{t.semester}</th>
                  <th>{t.credit}</th>
                  <th>{t.category}</th>
                  <th>{t.urgency}</th>
                  <th>{t.similarity}</th>
                  <th>{t.score}</th>
                  <th>{t.why}</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(r => (
                  <tr key={r.course_id}>
                    <td>{r.course_code}</td>
                    <td>
                      {r.course_name || "-"}{" "}
                      {r.is_overdue && (
                        <span className="course-rec-overdue-badge">
                          {t.overdueBadge}
                        </span>
                      )}
                    </td>
                    <td>{r.semester ?? "-"}</td>
                    <td>{r.credit ?? "-"}</td>
                    <td>{r.category || "-"}</td>
                    <td>{r.urgency_score ?? 0}</td>
                    <td>{r.similarity_score ?? 0}</td>
                    <td>{r.score ?? 0}</td>
                    <td>{Array.isArray(r.reasons) ? r.reasons.map(reasonLabel).join(", ") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          {result?.reason && (
            <div style={{ marginTop: 8, color: "#666" }}>
              {t.reason} {result.reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

