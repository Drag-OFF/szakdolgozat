<<<<<<< HEAD
import "../styles/Home.css";
import "../styles/GlobalBackground.css";

=======
/**
 * Főoldal komponens.
 * Üdvözlő szöveget és egy képet jelenít meg a felhasználónak.
 */

/**
 * Home komponens.
 * @returns {JSX.Element} A főoldal tartalma.
 */
>>>>>>> origin/frontend
export default function Home() {
  return (
    <div className="home-container">
      <img
        src="https://www.filepicker.io/api/file/0z7UIwGiSJiiG44XygL0"
        alt="SZTE"
        style={{ width: 120, margin: "2rem auto", display: "block" }}
      />
      <h1>Hallgatói előrehaladás-követő</h1>
      <p>Üdvözlünk a szakdolgozati projekt főoldalán!</p>
    </div>
  );
}