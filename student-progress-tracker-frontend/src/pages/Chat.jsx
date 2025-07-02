import React, { useState, useEffect, useRef } from "react";
import Picker from "emoji-picker-react";
import "../styles/Chat.css";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [reactingTo, setReactingTo] = useState(null);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const chatEndRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

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
      const res = await fetch("http://enaploproject.ddns.net:8000/api/users/chat-users", {
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    try {
      const res = await fetch("http://enaploproject.ddns.net:8000/api/messages/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({
          message: input,
          major: currentUser.major,
          anonymous: isAnonymous,
          timestamp: new Date().toISOString(),
          user_id: currentUser.id
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

  async function addReaction(msgId, emoji) {
    try {
      await fetch("http://enaploproject.ddns.net:8000/api/messages/" + msgId + "/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({ emoji })
      });
      await fetchMessages();
    } catch (e) {}
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

  function groupReactions(msg) {
    const groups = {};
    if (!msg.reactions) return groups;
    msg.reactions.forEach(r => {
      if (!groups[r.emoji]) groups[r.emoji] = [];
      groups[r.emoji].push(r.user_id);
    });
    return groups;
  }

  return (
    <div className="chat-container">
      {/* Oldalsáv */}
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

      {/* Chat fő rész */}
      <div className="chat-main">
        <div className="chat-messages-list">
          {messages.map(msg => {
            const reactionsGrouped = groupReactions(msg);
            const isOwn = String(msg.user_id) === String(currentUser.id);
            return (
              <div
                key={msg.id}
                className={`chat-message${isOwn ? " own" : ""}`}
              >
                <div className="chat-message-header">
                  {msg.display_name}
                  {msg.display_neptun && (
                    <span className="chat-message-neptun"> ({msg.display_neptun})</span>
                  )}
                </div>
                <div
                  className="chat-message-row"
                  style={{ justifyContent: isOwn ? "flex-end" : "flex-start" }}
                >
                  <div className="chat-bubble-actions-wrapper">
                    <div className="chat-message-bubble">
                      <span className="chat-message-text">{msg.message}</span>
                    </div>
                    <div className={`chat-message-actions${isOwn ? " left" : " right"}`}>
                      <button
                        className="chat-action-btn"
                        title="Reakció"
                        onClick={() => setReactingTo(msg.id)}
                      >
                        <span role="img" aria-label="emoji">😊</span>
                      </button>
                      <button
                        className="chat-action-btn"
                        title="Válasz"
                        onClick={() => {/* válasz logika */}}
                      >
                        <img src="https://fonts.gstatic.com/s/i/materialicons/reply/v6/24px.svg" alt="Válasz" />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Dátum + reakciók */}
                <div className={`chat-message-footer${isOwn ? " own" : ""}`}>
                  {isOwn ? (
                    <>
                      <div className="chat-message-reactions-row own">
                        {Object.entries(reactionsGrouped).map(([emoji, userIds]) => (
                          <span
                            key={emoji}
                            className="chat-reaction"
                            onMouseEnter={() => setHoveredReaction({ msgId: msg.id, emoji })}
                            onMouseLeave={() => setHoveredReaction(null)}
                          >
                            {emoji} <span className="chat-reaction-count">{userIds.length}</span>
                            {hoveredReaction &&
                              hoveredReaction.msgId === msg.id &&
                              hoveredReaction.emoji === emoji && (
                                <div className="chat-reaction-tooltip">
                                  {userIds.map(uid => (
                                    <div key={uid}>{getUserName(uid)}</div>
                                  ))}
                                </div>
                              )}
                          </span>
                        ))}
                      </div>
                      <span className="chat-message-date" style={{marginLeft: "auto"}}>{formatDate(msg.timestamp)}</span>
                    </>
                  ) : (
                    <>
                      <span className="chat-message-date">{formatDate(msg.timestamp)}</span>
                      <div className="chat-message-reactions-row">
                        {Object.entries(reactionsGrouped).map(([emoji, userIds]) => (
                          <span
                            key={emoji}
                            className="chat-reaction"
                            onMouseEnter={() => setHoveredReaction({ msgId: msg.id, emoji })}
                            onMouseLeave={() => setHoveredReaction(null)}
                          >
                            {emoji} <span className="chat-reaction-count">{userIds.length}</span>
                            {hoveredReaction &&
                              hoveredReaction.msgId === msg.id &&
                              hoveredReaction.emoji === emoji && (
                                <div className="chat-reaction-tooltip">
                                  {userIds.map(uid => (
                                    <div key={uid}>{getUserName(uid)}</div>
                                  ))}
                                </div>
                              )}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
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
          <label className="chat-anon-label">
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