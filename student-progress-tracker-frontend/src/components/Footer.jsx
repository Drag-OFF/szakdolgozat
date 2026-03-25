import "../styles/Footer.css";
import { useLang } from "../context/LangContext";

/**
 * Lábléc (footer) komponens.
 * Statikus tartalom, a projekt nevét és a készítő nevét jeleníti meg az oldal alján.
 *
 * @returns {JSX.Element}
 */
export default function Footer() {
  const { lang } = useLang();

  const texts = {
    hu: {
      main: "Hallgatói előrehaladás-követő | Készítette: ",
      name: "Harkai Dominik"
    },
    en: {
      main: "Student Progress Tracker | Created by: ",
      name: "Dominik Harkai"
    }
  };

  return (
    <footer className="footer">
      &copy; 2025 {texts[lang].main}
      <b>{texts[lang].name}</b>
    </footer>
  );
}