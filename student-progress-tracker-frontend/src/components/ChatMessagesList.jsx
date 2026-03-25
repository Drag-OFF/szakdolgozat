/**
 * Chat üzenetek listája komponens.
 * Megjeleníti az összes üzenetet, minden üzenethez átadja a szükséges propokat.
 * Nyelvváltás támogatott minden feliraton a ChatMessage komponensen keresztül.
 *
 * @param {Object} props
 * @param {Array} props.messages - Az üzenetek tömbje.
 * @param {Array} props.users - Felhasználók tömbje.
 * @param {Object} props.currentUser - A jelenlegi felhasználó.
 * @param {any} props.reactingTo - Melyik üzenetre reagálunk éppen.
 * @param {function} props.setReactingTo - Reakció picker állapotkezelő.
 * @param {any} props.hoveredReaction - Éppen fölé vitt reakció.
 * @param {function} props.setHoveredReaction - Hover állapotkezelő.
 * @param {any} props.replyTo - Melyik üzenetre válaszolunk.
 * @param {function} props.setReplyTo - Válasz picker állapotkezelő.
 * @param {function} props.addReaction - Reakció hozzáadása.
 * @param {function} props.findMessageById - Üzenet keresése id alapján.
 * @param {object} props.chatEndRef - Ref az üzenetlista végéhez.
 * @param {object} props.listRef - Ref az üzenetlista DOM eleméhez.
 * @returns {JSX.Element}
 */

import ChatMessage from "./ChatMessage";
import React from "react";

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
  function getUserNameById(userId) {
    const user = users.find(
      u => String(u.id) === String(userId) || String(u.neptun) === String(userId)
    );
    return user ? `${user.name} (${user.neptun})` : "Ismeretlen";
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