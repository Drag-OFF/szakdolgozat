import React, { useState, useEffect, useRef } from "react";
import Picker from "emoji-picker-react";
import "../styles/Chat.css";
import { formatDate, shortMsg, groupReactions, getUserName, findMessageById } from "../utils";

/**
 * Chat oldal fő komponense.
 * Üzenetek, felhasználók, reakciók, válasz, emoji, anonim üzenet, stb.
 * @returns {JSX.Element} A chat felület.
 */
export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [reactingTo, setReactingTo] = useState(null);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const chatEndRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  /**
   * Üzenetek és felhasználók lekérése oldal betöltésekor.
   */
  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  /**
   * Automatikus görgetés a chat aljára, ha van új üzenet.
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Lekéri az összes üzenetet a backendről, és beállítja a messages state-et.
   * @async
   * @returns {Promise<void>}
   */
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

  /**
   * Lekéri a chat felhasználókat a backendről, és beállítja a users state-et.
   * @async
   * @returns {Promise<void>}
   */
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

  /**
   * Új üzenet elküldése a backendnek.
   * Siker esetén üríti az inputot, bezárja az emoji pickert, törli a reply-t, és frissíti az üzeneteket.
   * @async
   * @returns {Promise<void>}
   */
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
          user_id: currentUser.id,
          reply_to_id: replyTo ? replyTo.id : null
        })
      });
      if (res.ok) {
        setInput("");
        setShowEmoji(false);
        setReplyTo(null);
        fetchMessages();
      }
    } catch (e) {}
  }

  /**
   * Emoji picker kiválasztott emoji hozzáadása az inputhoz.
   * @param {Object} emojiObject - Az emoji-picker objektuma (emoji property-vel).
   */
  function onEmojiClick(emojiObject) {
    setInput(prev => prev + emojiObject.emoji);
  }

  /**
   * Reakció (emoji) hozzáadása egy üzenethez.
   * @param {number|string} msgId - Az üzenet azonosítója.
   * @param {string} emoji - Az emoji karakter.
   * @async
   * @returns {Promise<void>}
   */
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

  // Admin és normál felhasználók szétválogatása
  const admins = users.filter(u => u.role === "admin");
  const normalUsers = users.filter(u => u.role !== "admin");

  return (
    <div className="chat-container">
      {/* Oldalsáv */}
      <div className="chat-users">
        <div className="chat-users-scroll">
          <div className="chat-users-section">
            <div className="chat-users-title">Adminok</div>
            <div className="chat-users-list">
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
            <div className="chat-users-list">
              {normalUsers.length === 0 && <div className="chat-user">Nincs felhasználó</div>}
              {normalUsers.map(u => (
                <div key={u.neptun} className="chat-user">
                  {u.name} <span className="chat-user-neptun">({u.neptun})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat fő rész */}
      <div className="chat-main">
        <div className="chat-messages-list">
          {messages.map(msg => {
            const reactionsGrouped = groupReactions(msg);
            const isOwn = String(msg.user_id) === String(currentUser.id);
            const repliedMsg = msg.reply_to_id ? findMessageById(messages, msg.reply_to_id) : null;
            return (
              <div
                key={msg.id}
                className={`chat-message${isOwn ? " own" : ""}`}
              >
                {/* Válaszolt üzenet megjelenítése */}
                {repliedMsg && (
                  <div className="chat-reply-preview">
                    <span className="chat-reply-author">
                      {repliedMsg.anonymous
                        ? (repliedMsg.anonymous_name || "Anonim")
                        : getUserName(users, repliedMsg.user_id)
                      }
                    </span>
                    <span className="chat-reply-text">
                      {shortMsg(repliedMsg)}
                    </span>
                  </div>
                )}
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
                        onClick={() => setReplyTo(msg)}
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
                                    <div key={uid}>{getUserName(users, uid)}</div>
                                  ))}
                                </div>
                              )
                            }
                          </span>
                        ))}
                      </div>
                      <span className="chat-message-date">{formatDate(msg.timestamp)}</span>
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
                                    <div key={uid}>{getUserName(users, uid)}</div>
                                  ))}
                                </div>
                              )
                            }
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
        {/* Válaszolt üzenet előnézet az input felett */}
        {replyTo && (
          <div className="chat-reply-bar">
            <span className="chat-reply-bar-label">Válasz:</span>
            <span className="chat-reply-bar-author">
              {replyTo.anonymous
                ? (replyTo.anonymous_name || "Anonim")
                : getUserName(users, replyTo.user_id)
              }
            </span>
            <span className="chat-reply-bar-text">{shortMsg(replyTo)}</span>
            <button className="chat-reply-bar-close" onClick={() => setReplyTo(null)} title="Válasz törlése">×</button>
          </div>
        )}
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