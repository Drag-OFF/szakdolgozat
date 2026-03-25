import FileUpload from "./FileUpload";
import DownloadProgressButton from "./DownloadProgressButton";
import { useLang } from "../context/LangContext";

export default function ProgressToolbar({ search, setSearch, userId, onFileUpload }) {
  const { lang } = useLang();

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
      <div className="progress-input-container">
        <input
          type="text"
          placeholder="Keresés név vagy kód alapján..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="progress-input"
        />
      </div>
      <FileUpload onUpload={onFileUpload} />
      <DownloadProgressButton userId={userId} />
    </div>
  );
}