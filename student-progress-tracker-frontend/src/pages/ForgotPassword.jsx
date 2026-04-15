import EmailActionForm from "../components/EmailActionForm";
import { apiUrl } from "../config";

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

export default function ForgotPassword() {
  return (
    <EmailActionForm
      apiUrl={apiUrl("/api/users/forgot-password")}
      texts={texts}
    />
  );
}