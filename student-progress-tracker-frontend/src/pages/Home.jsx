import { useLang } from "../context/LangContext";
import { HOME_LABELS } from "../translations";
import Button from "../components/Button";
import "../styles/Home.css";

export default function Home() {
  const { lang, setLang } = useLang();
  const t = HOME_LABELS[lang] || HOME_LABELS.hu;

  return (
    <div className="home-page">
      <div className="home-inner">
        <div
          className="home-lang-row"
          role="group"
          aria-label={t.langAria}
        >
          <Button
            type="button"
            variant={lang === "hu" ? "primary" : "neutral"}
            size="sm"
            onClick={() => setLang("hu")}
            aria-pressed={lang === "hu"}
          >
            {t.langHu}
          </Button>
          <Button
            type="button"
            variant={lang === "en" ? "primary" : "neutral"}
            size="sm"
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >
            {t.langEn}
          </Button>
        </div>

        <header className="home-header">
          <h1 className="home-title">{t.title}</h1>
          <p className="home-lead">{t.lead}</p>
        </header>

        <section className="home-section" aria-labelledby="home-about">
          <h2 id="home-about" className="home-h2">
            {t.aboutTitle}
          </h2>
          <p className="home-prose">{t.aboutText}</p>
        </section>

        <section className="home-section" aria-labelledby="home-user">
          <h2 id="home-user" className="home-h2">
            {t.userTitle}
          </h2>
          <ul className="home-list">
            {t.userItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="home-section" aria-labelledby="home-admin">
          <h2 id="home-admin" className="home-h2">
            {t.adminTitle}
          </h2>
          <p className="home-prose">{t.adminText}</p>
        </section>

        <section className="home-section home-section--last" aria-labelledby="home-thesis">
          <h2 id="home-thesis" className="home-h2">
            {t.thesisTitle}
          </h2>
          <p className="home-prose">{t.thesisText}</p>
        </section>
      </div>
    </div>
  );
}
