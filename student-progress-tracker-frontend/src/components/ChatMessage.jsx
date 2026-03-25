/**
 * Egyetlen chat üzenet megjelenítéséért felelős komponens.
 * Kezeli a válasz (reply), reakció (emoji), saját üzenet kiemelését, és a reakció picker pozícionálását.
 * Nyelvváltás támogatott minden feliraton.
 *
 * @param {Object} props
 * @param {Object} props.msg - Az üzenet objektum.
 * @param {Array} props.users - Felhasználók tömbje.
 * @param {Object} props.currentUser - A jelenlegi felhasználó.
 * @param {Array} props.messages - Az összes üzenet tömbje.
 * @param {any} props.reactingTo - Melyik üzenetre van éppen nyitva a reakció picker.
 * @param {function} props.setReactingTo - Picker állapotkezelő.
 * @param {any} props.hoveredReaction - Fölé vitt reakció.
 * @param {function} props.setHoveredReaction - Hover állapotkezelő.
 * @param {any} props.replyTo - Melyik üzenetre válaszolunk.
 * @param {function} props.setReplyTo - Válasz picker állapotkezelő.
 * @param {function} props.addReaction - Reakció hozzáadása.
 * @param {string} props.userName - Az üzenet szerzőjének neve.
 * @returns {JSX.Element}
 */

import { shortMsg, getUserName, findMessageById, groupReactions, formatDate } from "../utils";
import Picker from "emoji-picker-react";
import React, { useState, useEffect } from "react";
import { useLang } from "../context/LangContext";

export default function ChatMessage({
  msg,
  users,
  currentUser,
  messages,
  reactingTo,
  setReactingTo,
  hoveredReaction,
  setHoveredReaction,
  replyTo,
  setReplyTo,
  addReaction,
  userName
}) {
  const { lang } = useLang();

  const texts = {
    hu: {
      replyAnon: "Anonim: ",
      reply: "Válasz",
      reaction: "Reakció",
      replyBtn: "Válasz",
      close: "Bezárás"
    },
    en: {
      replyAnon: "Anonymous: ",
      reply: "Reply",
      reaction: "Reaction",
      replyBtn: "Reply",
      close: "Close"
    }
  };

  const reactionsGrouped = groupReactions(msg);
  const isOwn = String(msg.user_id) === String(currentUser.id);
  const repliedMsg = msg.reply_to_id ? findMessageById(messages, msg.reply_to_id) : null;
  const [hovered, setHovered] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // Emoji picker theme
  const theme =
    (document.body.getAttribute("data-theme") || "light") === "dark"
      ? "dark"
      : "light";

  /**
   * Reakció picker megjelenítése és pozícionálása.
   * A gomb kattintásának helyétől függően jobbra vagy balra tolja a pickert,
   * és nem engedi, hogy kilógjon a képernyőről.
   * @param {MouseEvent} e
   */
  function handleReactionBtn(e) {
    const pickerWidth = 350;
    const pickerHeight = 400;
    const margin = 16;

    let x = e.clientX;
    let y = e.clientY - 60;

    // Jobb vagy bal oldalra tolás
    if (isOwn) {
      x -= pickerWidth / 2 + 24; // saját üzenetnél balra tol
    } else {
      x += pickerWidth / 2 + 24; // más üzenetnél jobbra tol
    }

    // Jobb szélre ne lógjon ki
    if (x + pickerWidth / 2 > window.innerWidth - margin) {
      x = window.innerWidth - pickerWidth / 2 - margin;
    }
    // Bal szélre se lógjon ki
    if (x - pickerWidth / 2 < margin) {
      x = pickerWidth / 2 + margin;
    }
    // Felső szélre ne lógjon ki
    if (y < margin) {
      y = margin;
    }
    // Alsó szélre se lógjon ki
    if (y + pickerHeight > window.innerHeight - margin) {
      y = window.innerHeight - pickerHeight - margin;
    }

    setPickerPos({ x, y });
    setReactingTo(reactingTo === msg.id ? null : msg.id);
  }

  useEffect(() => {
    if (!reactingTo) return;
    function onKeyDown(e) {
      if (e.key === "Escape") setReactingTo(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reactingTo, setReactingTo]);

  return (
    <div className={`chat-message${isOwn ? " own" : ""}`}>
      {repliedMsg && (
        <div className="chat-reply-preview">
          <span className="chat-reply-author">
            {repliedMsg.anonymous
              ? (repliedMsg.anonymous_name || texts[lang].replyAnon)
              : getUserName(users, repliedMsg.user_id) + ": "
            }
          </span>
          <span className="chat-reply-text">
            {shortMsg(repliedMsg)}
          </span>
        </div>
      )}
      {/* FELHASZNÁLÓ NÉV KIÍRÁSA */}
      <div className="chat-message-header">
        {msg.display_name}
        {msg.display_neptun && !msg.anonymous && (
          <span style={{ marginLeft: 6, color: "#888", fontSize: "0.95em" }}>
            ({msg.display_neptun})
          </span>
        )}
      </div>
      <div
        className="chat-message-row"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {isOwn && (
          <div className={`chat-message-toolbar${hovered ? " visible" : ""}`}>
            <button
              className="chat-action-btn"
              title={texts[lang].reaction}
              onClick={handleReactionBtn}
            >
              😊
            </button>
            <button
              className="chat-action-btn"
              title={texts[lang].replyBtn}
              onClick={() => setReplyTo(msg)}
            >
              ↩️
            </button>
          </div>
        )}
        <div className="chat-message-bubble">
          <span className="chat-message-text">{msg.message}</span>
        </div>
        {!isOwn && (
          <div className={`chat-message-toolbar${hovered ? " visible" : ""}`}>
            <button
              className="chat-action-btn"
              title={texts[lang].reaction}
              onClick={handleReactionBtn}
            >
              😊
            </button>
            <button
              className="chat-action-btn"
              title={texts[lang].replyBtn}
              onClick={() => setReplyTo(msg)}
            >
              ↩️
            </button>
          </div>
        )}
      </div>
      {/* Footer: own - reakciók, idő; nem own - idő, reakciók */}
      <div className={`chat-message-footer${isOwn ? " own" : ""}`}>
        {isOwn ? (
          <>
            <div className={`chat-message-reactions-row own`}>
              {Object.entries(reactionsGrouped).map(([emoji, userIds]) => (
                <span
                  key={emoji}
                  className="chat-reaction"
                  onMouseEnter={() => setHoveredReaction({ msgId: msg.id, emoji })}
                  onMouseLeave={() => setHoveredReaction(null)}
                >
                  {emoji}
                  <span className="chat-reaction-count">{userIds.length}</span>
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
                  {emoji}
                  <span className="chat-reaction-count">{userIds.length}</span>
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
        <div
          className="chat-reaction-picker"
          style={{
            '--picker-x': `${pickerPos.x}px`,
            '--picker-y': `${pickerPos.y}px`
          }}
        >
          <Picker
            onEmojiClick={(emojiObj) =>
              addReaction(msg.id, emojiObj.emoji)
            }
            disableAutoFocus
            native
            theme={theme}
          />
        </div>
      )}
    </div>
  );
}