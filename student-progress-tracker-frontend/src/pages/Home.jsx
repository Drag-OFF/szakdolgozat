/**
 * Főoldal komponens.
 * Üdvözlő szöveget és egy képet jelenít meg a felhasználónak.
 */

/**
 * Home komponens.
 * @returns {JSX.Element} A főoldal tartalma.
 */
export default function Home() {
  return (
    <div className="home-container">
      <h1>Hallgatói előrehaladás-követő</h1>
      <p>Üdvözlünk a szakdolgozati projekt főoldalán!</p>
    </div>
  );
}