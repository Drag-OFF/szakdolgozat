import { useLang } from "../context/LangContext";
import { HOME_LABELS } from "../translations";
/**
 * Főoldal komponens.
 * Üdvözlő szöveget és egy képet jelenít meg a felhasználónak.
 */

/**
 * Home komponens.
 * @returns {JSX.Element} A főoldal tartalma.
 */
export default function Home() {
  const { lang } = useLang();
  const t = HOME_LABELS[lang] || HOME_LABELS.hu;
  return (
    <div className="home-container">
      <h1>{t.title}</h1>
      <p>{t.subtitle}</p>
    </div>
  );
}