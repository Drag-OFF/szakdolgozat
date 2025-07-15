/**
 * Chat ranglista (leaderboard) komponens.
 * Asztali nézetben fix sidebar, mobilon slide-panelként jelenik meg.
 * Nyelvváltás támogatott minden feliraton.
 *
 * @param {Object} props
 * @param {Array} props.leaderboard - A ranglista felhasználók tömbje.
 * @param {boolean} [props.open] - Mobilon a panel nyitott-e.
 * @param {function} [props.onClose] - Mobilon a panel zárása.
 * @param {boolean} [props.isMobile] - Mobil nézet-e.
 * @returns {JSX.Element}
 */

import React from "react";
import { useLang } from "../context/LangContext";

export default function ChatLeaderboard({ leaderboard, open = false, onClose, isMobile }) {
  const { lang } = useLang();

  const texts = {
    hu: {
      title: "Ranglista",
      points: "pont"
    },
    en: {
      title: "Leaderboard",
      points: "pts"
    }
  };

  // Asztali nézet: fix sidebar, mobilon: slide-panel
  return isMobile ? (
    <aside className={`chat-leaderboard slide-panel right${open ? " open" : ""}`}>
      {onClose && (
        <button className="slide-close" onClick={onClose} aria-label="Bezárás">×</button>
      )}
      <div className="leaderboard-title">{texts[lang].title}</div>
      <div className="leaderboard-list">
        {leaderboard.map((user, i) => (
          <div className="leaderboard-user" key={user.neptun || user.id || i}>
            <span className="leaderboard-rank">{i + 1}.</span>
            {user.name}
            <span className="leaderboard-points">
              {user.points} {texts[lang].points}
            </span>
          </div>
        ))}
      </div>
    </aside>
  ) : (
    <aside className="chat-leaderboard">
      <div className="leaderboard-title">{texts[lang].title}</div>
      <div className="leaderboard-list">
        {leaderboard.map((user, i) => (
          <div className="leaderboard-user" key={user.neptun || user.id || i}>
            <span className="leaderboard-rank">{i + 1}.</span>
            {user.name}
            <span className="leaderboard-points">
              {user.points} {texts[lang].points}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}