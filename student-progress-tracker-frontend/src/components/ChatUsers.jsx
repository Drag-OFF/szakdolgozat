import React from "react";
import { useLang } from "../context/LangContext";
import Button from "./Button";

export default function ChatUsers({ admins, users, ownNeptun, open = false, onClose, isMobile }) {
  const { lang } = useLang();

  const texts = {
    hu: {
      title: "Felhasználók",
      noUsers: "Nincs felhasználó",
      admin: "admin"
    },
    en: {
      title: "Users",
      noUsers: "No users",
      admin: "admin"
    }
  };

  const allUsers = [...admins, ...users];

  return isMobile ? (
    <aside className={`chat-sidebar slide-panel${open ? " open" : ""}`}>
      {onClose && (
        <Button className="slide-close" onClick={onClose} aria-label="Close" variant="ghost" size="sm">×</Button>
      )}
      <div className="chat-title">{texts[lang].title}</div>
      <div className="chat-user-list">
        {allUsers.length === 0 && <div className="chat-user">{texts[lang].noUsers}</div>}
        {allUsers.map(u => (
          <div
            key={u.neptun}
            className={`chat-user ${u.neptun === ownNeptun ? "own-user" : ""} ${admins.find(a => a.neptun === u.neptun) ? "admin" : ""}`}
          >
            {u.name} <span>({u.neptun})</span>
            {admins.find(a => a.neptun === u.neptun) && (
              <span className="chat-user-admin-label"> {texts[lang].admin}</span>
            )}
          </div>
        ))}
      </div>
    </aside>
  ) : (
    <aside className="chat-sidebar">
      <div className="chat-title">{texts[lang].title}</div>
      <div className="chat-user-list">
        {allUsers.length === 0 && <div className="chat-user">{texts[lang].noUsers}</div>}
        {allUsers.map(u => (
          <div
            key={u.neptun}
            className={`chat-user ${u.neptun === ownNeptun ? "own-user" : ""} ${admins.find(a => a.neptun === u.neptun) ? "admin" : ""}`}
          >
            {u.name} <span>({u.neptun})</span>
            {admins.find(a => a.neptun === u.neptun) && (
              <span className="chat-user-admin-label"> {texts[lang].admin}</span>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}