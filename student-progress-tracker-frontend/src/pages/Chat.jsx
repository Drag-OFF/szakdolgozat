import React, { useState, useEffect, useRef } from "react";
import Picker from "emoji-picker-react";
import "../styles/Chat.css";

/**
 * Chat oldal komponens.
 */
export default function Chat() {
  // Állapotok
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [reactingTo, setReactingTo] = useState(null);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const chatEndRef = useRef(null);

  // Bejelentkezett felhasználó adatai
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  // Üzenetek és felhasználók betöltése
  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  async function fetchMessages() {
    try {
      const res = await fetch("http://enaploproject.ddns.net:8000/api/messages/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {}
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users/chat-users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (e) {
      setUsers([]);
    }
  }

  // Görgetés az utolsó üzenethez
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    try {
      const res = await fetch("/api/messages/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({
          message: input,
          major: currentUser.major,
          anonymous: isAnonymous
        })
      });
      if (res.ok) {
        setInput("");
        setShowEmoji(false);
        fetchMessages();
      }
    } catch (e) {}
  }

  function onEmojiClick(event, emojiObject) {
    setInput(input + emojiObject.emoji);
  }

  // Egy felhasználó csak egy reakciót adhat egy üzenetre, cserélheti is
  function addReaction(msgId, emoji) {
    setMessages(msgs =>
      msgs.map(m => {
        if (m.id !== msgId) return m;
        const userReactions = { ...(m.userReactions || {}) };
        const prevEmoji = userReactions[currentUser.id];
        if (prevEmoji && prevEmoji !== emoji) {
          m.reactions[prevEmoji] = (m.reactions[prevEmoji] || 1) - 1;
          if (m.reactions[prevEmoji] <= 0) delete m.reactions[prevEmoji];
        }
        userReactions[currentUser.id] = emoji;
        return {
          ...m,
          reactions: {
            ...m.reactions,
            [emoji]: Object.values(userReactions).filter(e => e === emoji).length,
          },
          userReactions,
        };
      })
    );
    setReactingTo(null);
  }

  function formatDate(date) {
    const now = new Date();
    const d = new Date(date);
    const isToday = now.toDateString() === d.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  const admins = users.filter(u => u.role === "admin");
  const normalUsers = users.filter(u => u.role !== "admin");

  function getUserName(userId) {
    const user = users.find(u => String(u.id) === String(userId));
    return user ? user.name : "Ismeretlen";
  }

  return (
    <div className="chat-container">
      {/* Felhasználók oldalsáv */}
      <div className="chat-users">
        <div className="chat-users-section">
          <div className="chat-users-title">Adminok</div>
          <div className="chat-users-list scrollable">
            {admins.length === 0 && <div className="chat-user">Nincs admin</div>}
            {admins.map(u => (
              <div key={u.neptun} className="chat-user">
                {u.name} <span className="chat-user-neptun">({u.neptun})</span>
              </div>
            ))}
          </div>
        </div>
        <div className="chat-users-section">
          <div className="chat-users-title">Felhasználók</div>
          <div className="chat-users-list scrollable">
            {normalUsers.length === 0 && <div className="chat-user">Nincs felhasználó</div>}
            {normalUsers.map(u => (
              <div key={u.neptun} className="chat-user">
                {u.name} <span className="chat-user-neptun">({u.neptun})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat közép */}
      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-no-messages">Nincs még üzenet.</div>
          )}
          {messages.map(msg => {
            const isOwn = Number(msg.user_id) === Number(currentUser.id);
            const isAdmin = currentUser.role === "admin";
            return (
              <div
                key={msg.id}
                className={`chat-message-row ${isOwn ? "own" : "other"}`}
                style={{ position: "relative" }}
              >
                {/* Más üzenete: név, neptun */}
                {!isOwn && (
                  <div className="chat-message-meta">
                    <span className="chat-message-sender">
                      {msg.display_name}
                      {msg.display_neptun && <> ({msg.display_neptun})</>}
                    </span>
                  </div>
                )}
                <div className={`chat-message-bubble ${isOwn ? "own" : "other"}`}>
                  <span>{msg.message}</span>
                </div>
                {/* Reakciók az üzenet alatt, mindig bal oldalon */}
                <div
                  className={`chat-message-reactions-row`}
                  style={{
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    marginTop: "2px",
                    marginBottom: "2px"
                  }}
                >
                  {msg.reactions &&
                    Object.entries(msg.reactions).map(([emoji, count]) => (
                      <span
                        key={emoji}
                        className="chat-reaction"
                        onMouseEnter={() => setHoveredReaction({ msgId: msg.id, emoji })}
                        onMouseLeave={() => setHoveredReaction(null)}
                        style={{ position: "relative", cursor: "pointer" }}
                      >
                        {emoji} {count}
                        {/* Buborék a nevekkel */}
                        {hoveredReaction &&
                          hoveredReaction.msgId === msg.id &&
                          hoveredReaction.emoji === emoji &&
                          msg.userReactions && (
                            <div className="chat-reaction-tooltip">
                              {Object.entries(msg.userReactions)
                                .filter(([_, e]) => e === emoji)
                                .map(([uid]) => (
                                  <div key={uid}>{getUserName(uid)}</div>
                                ))}
                            </div>
                          )}
                      </span>
                    ))}
                </div>
                {/* Dátum minden üzenetnél bal oldalon */}
                <div className="chat-message-date">
                  {formatDate(msg.timestamp)}
                </div>
                {/* Akció ikonok csak hoverre */}
                <div className="chat-message-actions">
                  {/* Emoji reakció */}
                  <button
                    className="chat-action-btn"
                    title="Reakció"
                    onClick={() => setReactingTo(msg.id)}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    <span role="img" aria-label="emoji">😊</span>
                  </button>
                  {/* Válasz ikon */}
                  <button
                    className="chat-action-btn"
                    title="Válasz"
                    onClick={() => {/* válasz logika */}}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    <img src="https://fonts.gstatic.com/s/i/materialicons/reply/v6/24px.svg" alt="Válasz" />
                  </button>
                  {/* Admin 3 pötty */}
                  {isAdmin && (
                    <button
                      className="chat-action-btn"
                      title="Admin műveletek"
                      onClick={() => {/* admin menü logika */}}
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                      <img src="https://fonts.gstatic.com/s/i/materialicons/more_vert/v6/24px.svg" alt="Továbbiak" />
                    </button>
                  )}
                </div>
                {/* Emoji picker csak ha aktív */}
                {reactingTo === msg.id && (
                  <div className="chat-reaction-picker">
                    <Picker
                      onEmojiClick={(emojiObj) =>
                        addReaction(msg.id, emojiObj.emoji)
                      }
                      disableAutoFocus
                      native
                    />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-row">
          <button
            className="chat-emoji-btn"
            onClick={() => setShowEmoji(e => !e)}
            title="Emoji"
          >
            😊
          </button>
          {showEmoji && (
            <div className="chat-emoji-picker">
              <Picker onEmojiClick={onEmojiClick} disableAutoFocus native />
            </div>
          )}
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Írj üzenetet..."
          />
          <label style={{ marginLeft: 8, marginRight: 8 }}>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
            /> Anonim
          </label>
          <button className="chat-send-btn" onClick={sendMessage}>
            Küldés
          </button>
        </div>
      </div>
    </div>
  );
}