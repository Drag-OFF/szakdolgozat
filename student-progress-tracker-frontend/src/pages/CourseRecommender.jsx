import React, { useMemo, useState } from "react";
import { useLang } from "../context/LangContext";
import useAuthFetch from "../hooks/useAuthFetch";
import "../styles/ProgressTable.css";
import "../styles/CourseRecommender.css";
import { COURSE_RECOMMENDER_LABELS } from "../translations";
import { API_BASE } from "../config";
import { getUserObject } from "../authStorage";
import Button from "../components/Button";

/** Szabad szövegben megadott tárgykódok normalizálása tömbbé. */
function splitCodes(raw) {
  return String(raw || "")
    .split(/[,;\n]/g)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.toUpperCase());
}

/** Kurzusajánló oldal: inputkódok és szűrők alapján rangsorolt ajánlás kérés. */
export default function CourseRecommender() {
  const user = useMemo(() => getUserObject(), []);
  const userId = user?.id;
  const { lang } = useLang();
  const { authFetch } = useAuthFetch();
  const t = COURSE_RECOMMENDER_LABELS[lang] || COURSE_RECOMMENDER_LABELS.hu;

  const [courseCodesRaw, setCourseCodesRaw] = useState("");
  const [parity, setParity] = useState("any"); // any | even | odd
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [courseTypeFilter, setCourseTypeFilter] = useState("all"); // all | required | elective | optional

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

    setLoading(true);
    try {
      const res = await authFetch(
        `${API_BASE}/api/course_recommendations/${encodeURIComponent(userId)}?lang=${encodeURIComponent(lang || "hu")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_codes,
            semester_parity: parity,
            due_scope: overdueOnly ? "due_only" : "all",
            course_type_filter: courseTypeFilter
          })
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
  const visibleRows = recommendedRows;

  /** Backend reason kulcsok — ismeretlen / belső kulcsot nem mutatunk nyersen */
  const reasonLabel = (reasonKey) => {
    const map = {
      overdue_by_recommended_semester: lang === "en" ? "Recommended semester is due" : "Ajánlott félév alapján esedékes",
      name_similarity: lang === "en" ? "Similar topic by name" : "Név alapján hasonló témakör",
      category_similarity: lang === "en" ? "Similar category/subgroup" : "Hasonló kategória/alcsoport",
      major_curriculum_candidate: lang === "en" ? "Fits your curriculum" : "Illeszkedik a szakod mintatantervéhez"
    };
    return map[reasonKey] ?? "";
  };

  const typeLabel = (typeKey) => {
    const key = String(typeKey || "").toLowerCase();
    if (key === "required") return t.requiredLabel;
    if (key === "elective") return t.electiveLabel;
    if (key === "optional") return t.optionalLabel;
    return typeKey || "-";
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
          <div className="course-rec-hint">{t.inputHint}</div>
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
          <label className="course-rec-choice">
            <span>{t.typeFilterLabel}</span>
            <select value={courseTypeFilter} onChange={e => setCourseTypeFilter(e.target.value)} className="course-rec-select">
              <option value="all">{t.typeAll}</option>
              <option value="required">{t.typeRequired}</option>
              <option value="elective">{t.typeElective}</option>
              <option value="optional">{t.typeOptional}</option>
            </select>
          </label>
        </div>

        <div className="course-rec-actions">
          <Button type="submit" disabled={loading} variant="success" size="md">
            {loading ? t.recommending : t.submit}
          </Button>
          <Button type="button" disabled={loading} onClick={() => { setCourseCodesRaw(""); setResult(null); setErrorMsg(""); }} variant="ghost" size="md">
            {t.clear}
          </Button>
        </div>

        {errorMsg && <div className="course-rec-error">{errorMsg}</div>}
      </form>

      {result && (
        <div className="course-rec-result-card">
          <div className="course-rec-header-row">
            <div style={{ fontWeight: 800 }}>
              {t.recommendedTitle}{" "}
              <span className="course-rec-parity-note">
                (
                {(
                  {
                    any: t.anySemester,
                    even: t.evenSemester,
                    odd: t.oddSemester
                  }[result?.semester_parity] ?? result?.semester_parity)
                }
                )
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
            <table className="progress-table course-rec-table course-rec-table--spaced">
              <thead>
                <tr>
                  <th>{t.kód}</th>
                  <th>{t.név}</th>
                  <th>{t.semester}</th>
                  <th>{t.credit}</th>
                  <th>{t.category}</th>
                  <th>{t.urgency}</th>
                  <th>{t.similarity}</th>
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
                    <td>{typeLabel(r.normalized_type || r.category)}</td>
                    <td>{r.urgency_score ?? 0}</td>
                    <td className="course-rec-cell-right">{r.similarity_score ?? 0}</td>
                    <td>
                      {Array.isArray(r.reasons)
                        ? r.reasons.map(reasonLabel).filter(Boolean).join(", ") || "-"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

