import ChatMessage from "./ChatMessage";
import React, { useRef, useEffect } from "react";

export default function ChatMessagesList({
  messages,
  users,
  currentUser,
  reactingTo,
  setReactingTo,
  hoveredReaction,
  setHoveredReaction,
  replyTo,
  setReplyTo,
  addReaction,
  findMessageById
}) {
  const listRef = useRef();

  function isAtBottom() {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 10;
  }

  // Scroll pozíció visszaállítása csak akkor, ha messages már betöltött
  useEffect(() => {
    const saved = localStorage.getItem("chat-scroll");
    if (listRef.current && saved) {
      listRef.current.scrollTop = parseInt(saved, 10);
    }
  }, [messages.length]); // csak akkor fusson, ha messages renderelve

  // Automatikus scroll, ha a user a legalján volt
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (isAtBottom()) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Scroll pozíció mentése kilépés/frissítés előtt
  useEffect(() => {
    const saveScroll = () => {
      if (listRef.current) {
        localStorage.setItem("chat-scroll", listRef.current.scrollTop);
      }
    };
    window.addEventListener("beforeunload", saveScroll);
    return () => window.removeEventListener("beforeunload", saveScroll);
  }, []);

  return (
    <div className="chat-messages-list" ref={listRef}>
      {messages.map(msg => (
        <ChatMessage
          key={msg.id}
          msg={msg}
          users={users}
          currentUser={currentUser}
          messages={messages}
          reactingTo={reactingTo}
          setReactingTo={setReactingTo}
          hoveredReaction={hoveredReaction}
          setHoveredReaction={setHoveredReaction}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          addReaction={addReaction}
        />
      ))}
    </div>
  );
}
