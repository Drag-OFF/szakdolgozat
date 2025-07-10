import "../styles/Footer.css";

/**
 * Lábléc (footer) komponens.
 * Statikus tartalom, a projekt nevét és a készítő nevét jeleníti meg az oldal alján.
 *
 * @returns {JSX.Element}
 */
export default function Footer() {
  return (
    <footer className="footer">
      &copy; 2025 Hallgatói előrehaladás-követő | Készítette: <b>Harkai Dominik</b>
    </footer>
  );
}