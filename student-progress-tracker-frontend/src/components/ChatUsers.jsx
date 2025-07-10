/**
 * Chat oldalsáv (felhasználók listája) komponens.
 * Asztali nézetben fix sidebar, mobilon slide-panelként jelenik meg.
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

export default function ChatUsers({ admins, users, ownNeptun, open = false, onClose, isMobile }) {
  const allUsers = [...admins, ...users];


  // Asztali nézet: fix sidebar, mobilon: slide-panel
  return isMobile ? (
    <aside className={`chat-sidebar slide-panel${open ? " open" : ""}`}>
      {onClose && (
        <button className="slide-close" onClick={onClose} aria-label="Bezárás">×</button>
      )}
      <div className="chat-title">Felhasználók
      <div className="chat-user-list">
        {allUsers.length === 0 && <div className="chat-user">Nincs felhasználó</div>}
        {allUsers.map(u => (
          <div
            key={u.neptun}
            className={`chat-user ${u.neptun === ownNeptun ? "own-user" : ""} ${admins.find(a => a.neptun === u.neptun) ? "admin" : ""}`}
          >
            {u.name} <span>({u.neptun})</span>
          </div>
        ))}
      </div></div>
    </aside>
    
  ) : (
    <aside className="chat-sidebar">
      <div className="chat-title">Felhasználók</div>
      <div className="chat-user-list">
        {allUsers.length === 0 && <div className="chat-user">Nincs felhasználó</div>}
        {allUsers.map(u => (
          <div
            key={u.neptun}
            className={`chat-user ${u.neptun === ownNeptun ? "own-user" : ""} ${admins.find(a => a.neptun === u.neptun) ? "admin" : ""}`}
          >
            {u.name} <span>({u.neptun})</span>
          </div>
        ))}
      </div>
    </aside>
  );
}