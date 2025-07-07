import React from "react";

export default function ChatLeaderboard({ leaderboard }) {
  return (
    <aside className="chat-leaderboard">
      <div className="leaderboard-title">Leaderboard</div>
      <div className="leaderboard-list">
        {leaderboard.map((user, i) => (
          <div className="leaderboard-user" key={user.neptun || user.id || i}>
            <span className="leaderboard-rank">{i + 1}.</span>
            {user.name}
            <span className="leaderboard-points">{user.points}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}