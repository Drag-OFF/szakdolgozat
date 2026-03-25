/**
 * Chat oldalsáv (felhasználók listája) komponens.
 * Asztali nézetben fix sidebar, mobilon slide-panelként jelenik meg.
 * Nyelvváltás támogatott minden feliraton.
 *
 * @param {Object} props
 * @param {Array} props.admins - Adminisztrátor felhasználók tömbje.
 * @param {Array} props.users - Normál felhasználók tömbje.
 * @param {string} props.ownNeptun - A saját Neptun kód.
 * @param {boolean} [props.open] - Mobilon a panel nyitott-e.
 * @param {function} [props.onClose] - Mobilon a panel zárása.
 * @param {boolean} [props.isMobile] - Mobil nézet-e.
 * @returns {JSX.Element}
 */

import React from "react";
import { useLang } from "../context/LangContext";

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

  // Asztali nézet: fix sidebar, mobilon: slide-panel
  return isMobile ? (
    <aside className={`chat-sidebar slide-panel${open ? " open" : ""}`}>
      {onClose && (
        <button className="slide-close" onClick={onClose} aria-label="Close">×</button>
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