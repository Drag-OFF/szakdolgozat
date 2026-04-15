import ChatMessage from "./ChatMessage";
import React from "react";
import { useLang } from "../context/LangContext";

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
  findMessageById,
  chatEndRef,
  listRef
}) {
  const { lang } = useLang();
  function getUserNameById(userId) {
    const user = users.find(
      u => String(u.id) === String(userId) || String(u.neptun) === String(userId)
    );
    return user ? `${user.name} (${user.neptun})` : (lang === "en" ? "Unknown" : "Ismeretlen");
  }

  return (
    <div className="chat-messages-list" ref={listRef}>
      {messages.map(msg => (
        <ChatMessage
          userName={getUserNameById(msg.user_id)}
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
      <div ref={chatEndRef} />
    </div>
  );
}