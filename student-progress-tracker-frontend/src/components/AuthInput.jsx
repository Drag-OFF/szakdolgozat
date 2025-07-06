export default function AuthInput({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
  ...props
}) {
  return (
    <div>
      <label htmlFor={id} style={{ fontWeight: 500, marginBottom: 4, display: "block" }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="auth-form-input"
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          ...(error ? { border: "2px solid #e53935", background: "#fff6f6" } : {})
        }}
        {...props}
    />
        {error && (
            <div className="auth-msg" style={{ color: "#e53935", marginTop: 2 }}>
            {error}
        </div>
        )}
        </div>
    );
}