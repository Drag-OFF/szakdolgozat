import useFileDownload from "./useFileDownload";

export default function useTemplateDownload() {
  const { download } = useFileDownload();

  const downloadTemplate = async (userId, lang = "hu") => {
    return download(`http://enaploproject.ddns.net:8000/api/progress/${userId}/template-xlsx?lang=${encodeURIComponent(lang)}`);
  };

  return { downloadTemplate };
}