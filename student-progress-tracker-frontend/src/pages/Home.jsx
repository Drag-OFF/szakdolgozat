import { useLang } from "../context/LangContext";
import { HOME_LABELS } from "../translations";
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