import { useLang } from "../context/LangContext";

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
  const { lang } = useLang();

  const getText = (obj) =>
    typeof obj === "string" ? obj : obj?.[lang] || "";

  const getOptionValue = (opt) => {
    if (typeof opt === "string") return opt;
    if (opt && Object.prototype.hasOwnProperty.call(opt, "value")) return opt.value;
    return opt?.[lang] || "";
  };

  return (
    <div>
      <label htmlFor={id} style={{ fontWeight: 500, marginBottom: 4, display: "block" }}>
        {getText(label)}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`auth-select${error ? " auth-select--error" : ""}`}
        style={{
          width: "100%",
          padding: "0.5rem",
          borderRadius: 4,
          fontSize: "1rem",
          boxSizing: "border-box",
        }}
        {...props}
      >
        {options.map(opt =>
          <option key={`${getOptionValue(opt)}_${getText(opt)}`} value={getOptionValue(opt)}>
            {getText(opt)}
          </option>
        )}
      </select>
      {error && (
        <div className="auth-msg" style={{ color: "#e53935", marginTop: 2 }}>
          {getText(error)}
        </div>
      )}
    </div>
  );
}