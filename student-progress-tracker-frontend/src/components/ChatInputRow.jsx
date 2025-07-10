import Picker from "emoji-picker-react";
import React, { useRef, useState } from "react";

export default function ChatInputRow({
  input,
  setInput,
  showEmoji,
  setShowEmoji,
  onEmojiClick,
  isAnonymous,
  setIsAnonymous,
  sendMessage,
  replyTo,
  setReplyTo,
  users,
  getUserName,
  shortMsg
}) {
  const emojiBtnRef = useRef(null);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });

  const theme =
    (document.body.getAttribute("data-theme") || "light") === "dark"
      ? "dark"
      : "light";

  // Enter küld, Shift+Enter sortörés
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };




  function handleEmojiBtnClick(e) {
    const pickerWidth = 350;
    const pickerHeight = 400;
    const margin = 16;

    // Az emoji gomb kattintásának pozíciója
    let x = e.clientX;
    let y = e.clientY - 60;

    // Mindig jobbra tolja, mint a reaction picker
    x += 10;
    y-=400;

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
    setShowEmoji(e => !e);
  }

  return (
    <>
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
          <button
            className="chat-reply-bar-close"
            onClick={() => setReplyTo(null)}
            title="Válasz törlése"
          >
            ×
          </button>
        </div>
      )}
      <div className="chat-input-row" style={{ position: "relative" }}>
        <button
          className="chat-emoji-btn"
          ref={emojiBtnRef}
          onClick={handleEmojiBtnClick}
          title="Emoji"
          type="button"
        >
          😊
        </button>
        {showEmoji && (
          <div
            className="chat-emoji-picker-floating"
            style={{
              position: "fixed",
              left: pickerPos.x,
              top: pickerPos.y,
              zIndex: 2000,
            }}
          >
            <Picker onEmojiClick={onEmojiClick} disableAutoFocus native theme={theme} />
          </div>
        )}
        <textarea
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Írj üzenetet..."
          rows={1}
        />

        <div className="chat-input-controllers">
          <button className="chat-send-btn" onClick={sendMessage} type="button">
            Küldés
          </button>
          <label className="chat-anon-label">
            <span className="chat-anon-checkbox">
              <input
                type="checkbox"
                id="anon-checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
              />
              <span className="cbx"></span>
              <span className="flip">
                <span className="front"></span>
                <span className="back">
                  <svg width="14" height="11">
                    <polyline points="1 5.5 5 9 13 1" style={{stroke: "#fff", strokeWidth: 2.5, fill: "none"}} />
                  </svg>
                </span>
              </span>
            </span>
            Anonim
          </label>
        </div>
      </div>
    </>
  );
}