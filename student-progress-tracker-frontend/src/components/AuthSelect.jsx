/**
 * Egyedi select (legördülő) komponens hitelesítési űrlapokhoz.
 * Megjeleníti a labelt, a selectet, és opcionálisan hibát.
 *
 * @param {Object} props
 * @param {string} props.label - A mező felirata.
 * @param {string} props.id - A select egyedi azonosítója.
 * @param {string} props.name - A select neve.
 * @param {string} props.value - A kiválasztott érték.
 * @param {function} props.onChange - Változáskezelő függvény.
 * @param {string[]} props.options - A választható opciók tömbje.
 * @param {string} [props.error] - Hibaszöveg, ha van.
 * @returns {JSX.Element}
 */
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