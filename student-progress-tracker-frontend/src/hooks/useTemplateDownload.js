import useFileDownload from "./useFileDownload";
import { apiUrl } from "../config";

/** Progress sablonfájl letöltése adott felhasználóhoz és nyelvhez. */
export default function useTemplateDownload() {
  const { download } = useFileDownload();

  const downloadTemplate = async (userId, lang = "hu") => {
    return download(apiUrl(`/api/progress/${userId}/template-xlsx?lang=${encodeURIComponent(lang)}`));
  };

  return { downloadTemplate };
}