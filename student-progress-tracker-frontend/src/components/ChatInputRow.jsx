import Picker from "emoji-picker-react";
import React, { useRef, useState } from "react";
import { useLang } from "../context/LangContext";

/**
 * Chat üzenet beküldő sor komponens.
 * Emoji picker, szövegmező, küldés gomb, anonim checkbox, válasz sáv.
 * Nyelvváltás támogatott minden feliraton.
 *
 * @param {Object} props
 * @param {string} props.input - Üzenet szövege.
 * @param {function} props.setInput - Üzenet setter.
 * @param {boolean} props.showEmoji - Emoji picker láthatóság.
 * @param {function} props.setShowEmoji - Emoji picker setter.
 * @param {function} props.onEmojiClick - Emoji kiválasztás handler.
 * @param {boolean} props.isAnonymous - Anonim mód.
 * @param {function} props.setIsAnonymous - Anonim mód setter.
 * @param {function} props.sendMessage - Üzenet küldése.
 * @param {Object|null} props.replyTo - Válaszolt üzenet.
 * @param {function} props.setReplyTo - Válasz törlése.
 * @param {Array} props.users - Felhasználók tömbje.
 * @param {function} props.getUserName - User név lekérdezése.
 * @param {function} props.shortMsg - Rövidített üzenet szöveg.
 * @returns {JSX.Element}
 */
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
  const { lang } = useLang();

  const texts = {
    hu: {
      reply: "Válasz:",
      replyClose: "Válasz törlése",
      send: "Küldés",
      anon: "Anonim",
      placeholder: "Írj üzenetet...",
      emoji: "Emoji"
    },
    en: {
      reply: "Reply:",
      replyClose: "Remove reply",
      send: "Send",
      anon: "Anonymous",
      placeholder: "Type a message...",
      emoji: "Emoji"
    }
  };

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

    let x = e.clientX;
    let y = e.clientY - 60;
    x += 10;
    y -= 400;

    if (x + pickerWidth / 2 > window.innerWidth - margin) {
      x = window.innerWidth - pickerWidth / 2 - margin;
    }
    if (x - pickerWidth / 2 < margin) {
      x = pickerWidth / 2 + margin;
    }
    if (y < margin) {
      y = margin;
    }
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
          <span className="chat-reply-bar-label">{texts[lang].reply}</span>
          <span className="chat-reply-bar-author">
            {replyTo.anonymous
              ? (replyTo.anonymous_name || texts[lang].anon)
              : getUserName(users, replyTo.user_id)
            }
          </span>
          <span className="chat-reply-bar-text">{shortMsg(replyTo)}</span>
          <button
            className="chat-reply-bar-close"
            onClick={() => setReplyTo(null)}
            title={texts[lang].replyClose}
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
          title={texts[lang].emoji}
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
          placeholder={texts[lang].placeholder}
          rows={1}
        />

        <div className="chat-input-controllers">
          <button className="chat-send-btn" onClick={sendMessage} type="button">
            {texts[lang].send}
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
            {texts[lang].anon}
          </label>
        </div>
      </div>
    </>
  );
}