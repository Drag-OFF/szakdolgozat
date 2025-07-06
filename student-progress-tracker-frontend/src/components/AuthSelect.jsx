export default function AuthSelect({
  label,
  id,
  name,
  value,
  onChange,
  options,
  error,
  ...props
}) {
  return (
    <div>
      <label htmlFor={id} style={{ fontWeight: 500, marginBottom: 4, display: "block" }}>
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "0.5rem",
          border: error ? "2px solid #e53935" : "1px solid #bdbdbd",
          background: error ? "#fff6f6" : "#fff",
          borderRadius: 4,
          fontSize: "1rem"
        }}
        {...props}
      >
        {options.map(opt =>
          <option key={opt} value={opt}>{opt}</option>
        )}
      </select>
      {error && (
        <div className="auth-msg" style={{ color: "#e53935", marginTop: 2 }}>
          {error}
        </div>
      )}
    </div>
  );
}