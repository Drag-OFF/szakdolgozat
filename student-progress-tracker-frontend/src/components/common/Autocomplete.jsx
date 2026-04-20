import React, { useEffect, useRef, useState } from "react";

export default function Autocomplete({
  items = [],
  value = "",
  onChange = () => {},
  labelFn = (it) => String(it?.name || it?.title || it?.course_code || it?.id || ""),
  idKey = "id",
  placeholder = "",
  minChars = 1,
  maxResults = 50,
  allowCreate = false,
  createLabelFn = (q) => `Create "${q}"`,
  onCreate = null,
  className = "",
  style: outerStyle = {},
  title = "",
  dropdownMinWidth = 280
}) {
  const [input, setInput] = useState(() => {
    const sel = items.find(x => String(x[idKey]) === String(value));
    return sel ? labelFn(sel) : "";
  });
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const debounceRef = useRef(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const sel = items.find(x => String(x[idKey]) === String(value));
    setInput(sel ? labelFn(sel) : "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, items]);

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const doFilter = (q) => {
    if (!q || q.length < minChars) { setFiltered([]); setOpen(false); return; }
    const s = q.trim().toLowerCase();
    const res = items.filter(it => String(labelFn(it)).toLowerCase().includes(s)).slice(0, maxResults);
    const haveExact = res.some(it => String(it[idKey]) === String(value) || String(labelFn(it)).toLowerCase() === s);
    if (allowCreate && onCreate && q.length >= minChars && !haveExact) {
      const createItem = { __create: true, __q: q, __label: createLabelFn(q) };
      setFiltered([createItem, ...res]);
    } else {
      setFiltered(res);
    }
    setActive(0);
    setOpen((allowCreate && onCreate && q.length >= minChars ? true : res.length > 0) || (allowCreate && onCreate && q.length >= minChars));
  };

  const onInput = (v) => {
    setInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFilter(v), 180);
    onChange("");
  };

  const selectItem = async (it) => {
    if (it && it.__create) {
      if (!onCreate) return;
      try {
        setIsCreating(true);
        const created = await onCreate(it.__q);
        if (!created) { setIsCreating(false); return; }
        if (typeof created === "object") {
          const id = String(created[idKey] ?? created.id ?? created._id ?? "");
          onChange(id);
        } else {
          onChange(String(created));
        }
        setOpen(false);
      } finally { setIsCreating(false); }
      return;
    }

    setInput(labelFn(it));
    setOpen(false);
    onChange(String(it[idKey]));
  };

  const onKey = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      if (filtered.length) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (open && filtered[active]) selectItem(filtered[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div ref={ref} className={className} style={{ position: "relative", minWidth: 0, width: "100%", ...outerStyle }}>
      <input
        type="text"
        title={title || undefined}
        placeholder={placeholder}
        value={input}
        onChange={e => onInput(e.target.value)}
        onKeyDown={onKey}
        onFocus={() => { if (input.length >= minChars) doFilter(input); }}
        style={{
          width: "100%",
          padding: "8px 10px",
          boxSizing: "border-box",
          fontSize: 13,
          minHeight: 36,
          background: "var(--admin-input-bg, #fff)",
          color: "var(--admin-table-fg, #0f172a)",
          border: "1px solid var(--admin-input-border, #cbd5e1)",
          borderRadius: 4
        }}
        aria-autocomplete="list"
      />
      {open && filtered.length > 0 && (
        <div
          className="autocomplete-dropdown"
          style={{
            position: "absolute",
            zIndex: 40,
            left: 0,
            top: "100%",
            marginTop: 2,
            /* Szélesebb, mint a keskeny input - ne vágja el a szöveget */
            width: `min(max(100%, ${Number(dropdownMinWidth) || 280}px), min(560px, calc(100vw - 16px)))`,
            maxHeight: 260,
            overflowY: "auto",
            overflowX: "hidden",
            background: "var(--panel-bg, #fff)",
            border: "1px solid var(--panel-border, #ddd)",
            boxShadow: "0 2px 8px var(--admin-table-shadow, rgba(0,0,0,0.12))",
            boxSizing: "border-box",
            color: "var(--admin-table-fg, #0f172a)"
          }}
        >
          {filtered.map((it, idx) => {
            const label = it.__create ? it.__label : labelFn(it);
            return (
              <div
                key={(it.__create ? "__create_" + it.__q : String(it[idKey])) + "_" + idx}
                onClick={() => selectItem(it)}
                onMouseEnter={() => setActive(idx)}
                style={{
                  padding: "6px 8px",
                  cursor: "pointer",
                  background: idx === active ? "var(--admin-row-hover, #eef6ff)" : "transparent",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere"
                }}
              >
                <span style={{ minWidth: 0 }}>{label}</span>
                {it.__create && isCreating && <span style={{ fontSize: 12, color: "var(--muted, #666)" }}>…</span>}
              </div>
            );
          })}
          {items.length > maxResults && <div style={{ padding: 8, color: "var(--muted, #666)", fontSize: 12 }}>...több találat (limit {maxResults})</div>}
        </div>
      )}
    </div>
  );
}
