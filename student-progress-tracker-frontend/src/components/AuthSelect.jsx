import { useLang } from "../context/LangContext";

/**
 * Egyedi select (legördülő) komponens hitelesítési űrlapokhoz.
 * Megjeleníti a labelt, a selectet, és opcionálisan hibát.
 *
 * @param {Object} props
 * @param {string|Object} props.label - A mező felirata (magyar/angol vagy sima string).
 * @param {string} props.id - A select egyedi azonosítója.
 * @param {string} props.name - A select neve.
 * @param {string} props.value - A kiválasztott érték.
 * @param {function} props.onChange - Változáskezelő függvény.
 * @param {Array} props.options - A választható opciók tömbje (lehet string vagy {hu, en}).
 * @param {string|Object} [props.error] - Hibaszöveg, ha van (magyar/angol vagy sima string).
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