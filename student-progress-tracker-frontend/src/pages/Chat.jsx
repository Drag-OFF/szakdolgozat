import React, { useState, useEffect, useRef } from "react";
import "../styles/Chat.css";
import Navbar from "../components/Navbar";
import { formatDate, shortMsg, groupReactions, getUserName, findMessageById } from "../utils";
import ChatUsers from "../components/ChatUsers";
import ChatMessagesList from "../components/ChatMessagesList";
import ChatInputRow from "../components/ChatInputRow";
import ChatLeaderboard from "../components/ChatLeaderboard";

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

  // Dummy leaderboard, TODO: Fetch from API
  const leaderboard = [
    { name: "Kovács Béla", points: 120, neptun: "ABC123" },
    { name: "Nagy Anna", points: 110, neptun: "DEF456" },
    { name: "Kiss Péter", points: 90, neptun: "GHI789" }
  ];

  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  function onEmojiClick(emojiObject) {
    setInput(prev => prev + emojiObject.emoji);
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

  const admins = users.filter(u => u.role === "admin");
  const normalUsers = users.filter(u => u.role !== "admin");

  // Téma váltás gomb (body data-theme)
  function toggleTheme() {
    const body = document.body;
    body.setAttribute(
      "data-theme",
      body.getAttribute("data-theme") === "dark" ? "light" : "dark"
    );
  }

  // Nyelv váltás gomb (csak demó)
  function toggleLang() {
    alert("A nyelvváltás funkció csak demó! (Itt lehetne magyar/angol szövegeket cserélni.)");
  }

  return (
    <div className="chat-root">
      <ChatUsers admins={admins} users={normalUsers} />
      <div className="chat-main">
        <div className="chat-header">
          <span>Hallgatói Chat</span>
          <span>
            <button className="theme-switcher" onClick={toggleTheme}>🌙 / ☀️</button>
            <button className="lang-switcher" onClick={toggleLang}>🇭🇺 / 🇬🇧</button>
          </span>
        </div>
        <ChatMessagesList
          messages={messages}
          users={users}
          currentUser={currentUser}
          reactingTo={reactingTo}
          setReactingTo={setReactingTo}
          hoveredReaction={hoveredReaction}
          setHoveredReaction={setHoveredReaction}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          addReaction={addReaction}
          findMessageById={findMessageById}
          chatEndRef={chatEndRef}
        />
        <ChatInputRow
          input={input}
          setInput={setInput}
          showEmoji={showEmoji}
          setShowEmoji={setShowEmoji}
          onEmojiClick={onEmojiClick}
          isAnonymous={isAnonymous}
          setIsAnonymous={setIsAnonymous}
          sendMessage={sendMessage}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          users={users}
          getUserName={getUserName}
          shortMsg={shortMsg}
        />
      </div>
      <ChatLeaderboard leaderboard={leaderboard} />
    </div>
  );
}