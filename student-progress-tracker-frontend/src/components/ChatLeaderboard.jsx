import React from "react";
import { useLang } from "../context/LangContext";
import Button from "./Button";

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

  return isMobile ? (
    <aside className={`chat-leaderboard slide-panel right${open ? " open" : ""}`}>
      {onClose && (
        <Button className="slide-close" onClick={onClose} aria-label="Bezárás" variant="ghost" size="sm">×</Button>
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