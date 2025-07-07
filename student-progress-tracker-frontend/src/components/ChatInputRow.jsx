import Picker from "emoji-picker-react";
import React from "react";

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
    </>
  );
}