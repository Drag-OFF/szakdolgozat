import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getAccessToken } from "../authStorage";
import useAuthFetch from "../hooks/useAuthFetch";
import { apiUrl } from "../config";

/** JWT-ből role olvasása admin route védelemhez. */
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

/** Import utáni gyors rulesubgroup szerkesztő kurzus szinten. */
export default function AdminTantervEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { authFetch } = useAuthFetch();
  const majorId = Number(searchParams.get("major_id") || 0);

  const createdCodes = useMemo(() => {
    const arr = location.state?.createdCourseCodes;
    return Array.isArray(arr) ? new Set(arr.map((x) => String(x || "").toUpperCase())) : new Set();
  }, [location.state]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [savingCourseId, setSavingCourseId] = useState(null);

  useEffect(() => {
    const role = getRoleFromToken();
    if (role !== "admin") navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!Number.isFinite(majorId) || majorId < 1) {
        setError("Hiányzó vagy hibás major_id.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await authFetch(apiUrl(`/api/admin/tanterv/rule-editor?major_id=${majorId}`), {
          method: "GET",
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(typeof j?.detail === "string" ? j.detail : "Betöltés sikertelen.");
          return;
        }
        if (!cancelled) setData(j);
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
  }, [authFetch, majorId]);

  /** Egy kurzus szabálycsoportját menti, majd lokális táblát frissít. */
  const setCourseSubgroup = async (courseId, subgroup) => {
    setSavingCourseId(courseId);
    setError("");
    try {
      const res = await authFetch(apiUrl("/api/admin/tanterv/rule-editor/set-subgroup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          major_id: majorId,
          course_id: courseId,
          subgroup: subgroup || null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.detail === "string" ? j.detail : "Mentés sikertelen.");
        return;
      }
      setData((prev) => ({
        ...prev,
        rows: (prev?.rows || []).map((r) =>
          r.course_id === courseId
            ? {
                ...r,
                subgroup: j.subgroup,
                type: j.type,
              }
            : r
        ),
      }));
    } catch (e) {
      console.error(e);
      setError("Hálózati hiba.");
    } finally {
      setSavingCourseId(null);
    }
  };

  return (
    <div style={{ padding: 12, marginBottom: 140, maxWidth: 1200 }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin/pdf-import" style={{ fontWeight: 700, color: "#155a9a" }}>
          ← Vissza az import oldalra
        </Link>
      </div>
      <h1 className="admin-title" style={{ marginTop: 0 }}>
        Tanterv editor
      </h1>
      <p style={{ color: "#4b5563" }}>
        Itt tudod beállítani, melyik tárgy melyik fő rule-hoz tartozzon. A sárga sorok az utolsó import során újonnan létrejött
        kurzusok.
      </p>

      {error ? <div style={{ color: "#b00020", fontWeight: 700, marginBottom: 10 }}>{error}</div> : null}
      {loading ? (
        <div style={{ color: "#0b4f85", fontWeight: 600 }}>Betöltés…</div>
      ) : (
        <div style={{ overflow: "auto", maxHeight: 650, border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e2e8f0" }}>code</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e2e8f0" }}>name</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e2e8f0" }}>type</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e2e8f0" }}>rule code</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows || []).map((r) => {
                const isNew = createdCodes.has(String(r.course_code || "").toUpperCase());
                return (
                  <tr key={r.course_id} style={isNew ? { background: "#fef9c3" } : undefined}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{r.course_code}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{r.name}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{r.type}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9", minWidth: 240 }}>
                      <select
                        className="progress-input"
                        value={r.subgroup || ""}
                        disabled={savingCourseId === r.course_id}
                        onChange={(e) => setCourseSubgroup(r.course_id, e.target.value)}
                        style={{ width: "100%", padding: "6px 8px" }}
                      >
                        <option value="">- nincs -</option>
                        {(data?.rules || []).map((rr) => (
                          <option key={rr.code} value={rr.code}>
                            {rr.code} - {rr.label_hu}
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
      )}
    </div>
  );
}
