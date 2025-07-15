import EmailActionForm from "../components/EmailActionForm";

const texts = {
  hu: {
    title: "Elfelejtett jelszó",
    label: "E-mail cím",
    btn: "Küldés",
    emailError: "Az e-mail címnek tartalmaznia kell @ jelet!",
    unknownError: "Ismeretlen hiba történt.",
    reqError: "Hiba történt a kérés során."
  },
  en: {
    title: "Forgot password",
    label: "E-mail address",
    btn: "Send",
    emailError: "Email must contain @ character!",
    unknownError: "Unknown error occurred.",
    reqError: "An error occurred during the request."
  }
};

/**
 * Elfelejtett jelszó oldal.
 * Az e-mail cím megadása után lehetőség van jelszó-visszaállító e-mailt kérni.
 * Csak akkor engedi a kérést, ha az e-mail tartalmaz @ jelet.
 *
 * @returns {JSX.Element} Az elfelejtett jelszó oldal tartalma.
 */
export default function ForgotPassword() {
  return (
    <EmailActionForm
      apiUrl="http://enaploproject.ddns.net:8000/api/users/forgot-password"
      texts={texts}
    />
  );
}