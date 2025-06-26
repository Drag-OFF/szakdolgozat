/**
 * Lábléc komponens.
 * Megjeleníti a projekt nevét és a készítő nevét az oldal alján.
 * Statikus tartalom.
 */

/**
 * Footer komponens.
 * @returns {JSX.Element} A lábléc tartalma.
 */
export default function Footer() {
  return (
    <footer className="footer">
      &copy; 2025 Hallgatói előrehaladás-követő | Készítette: <b>Harkai Dominik</b>
    </footer>
  );
}