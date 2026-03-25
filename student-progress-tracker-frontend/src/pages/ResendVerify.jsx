import EmailActionForm from "../components/EmailActionForm";
import { apiUrl } from "../config";

const texts = {
  hu: {
    title: "Megerősítő e-mail újraküldése",
    label: "E-mail cím",
    btn: "Küldés",
    emailError: "Érvényes e-mail címet adj meg!",
    unknownError: "Ismeretlen hiba történt.",
    reqError: "Hiba történt a kérés során."
  },
  en: {
    title: "Resend verification email",
    label: "E-mail address",
    btn: "Send",
    emailError: "Please enter a valid e-mail address!",
    unknownError: "Unknown error occurred.",
    reqError: "An error occurred during the request."
  }
};

/**
 * Megerősítő e-mail újraküldése oldal.
 * Lehetővé teszi a felhasználónak, hogy újra elküldje a regisztrációs megerősítő e-mailt.
 * Nyelvváltás támogatott minden feliraton.
 *
 * @returns {JSX.Element} Az oldal tartalma.
 */
export default function ResendVerify() {
  return (
    <EmailActionForm
      apiUrl={apiUrl("/api/users/resend-verification")}
      texts={texts}
    />
  );
}