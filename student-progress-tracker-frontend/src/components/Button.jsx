/**
 * Alapértelmezett gomb komponens, amely egységes stílust biztosít az alkalmazásban.
 *
 * @param {Object} props
 * @param {string} [props.type="button"] - A gomb típusa.
 * @param {function} [props.onClick] - Kattintás eseménykezelő.
 * @param {Object} [props.style] - Egyedi stílus objektum.
 * @param {React.ReactNode} props.children - A gomb tartalma.
 * @returns {JSX.Element}
 */
export default function Button({ children, type = "button", onClick, style = {}, ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: "#1976d2",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        padding: "0.4rem 1.1rem",
        fontWeight: 500,
        fontSize: "1.08rem",
        cursor: "pointer",
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
}