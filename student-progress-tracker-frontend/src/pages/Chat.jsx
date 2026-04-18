import { useState, useEffect, useRef } from "react";
import "../styles/Chat.css";
import { shortMsg, getUserName, findMessageById, authFetch } from "../utils";
import ChatUsers from "../components/ChatUsers";
import ChatMessagesList from "../components/ChatMessagesList";
import ChatInputRow from "../components/ChatInputRow";
import ChatLeaderboard from "../components/ChatLeaderboard";
import Button from "../components/Button";
import { useLang } from "../context/LangContext";
import { apiUrl } from "../config";
import { getAccessToken, getUserObject } from "../authStorage";

/** Egyszerű viewport hook a chat mobil/desktop elrendezéséhez. */
function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/** Chat oldal: üzenetfolyam, reakciók, user lista és toplista kezelése. */
export default function Chat() {
  const { lang } = useLang();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [reactingTo, setReactingTo] = useState(null);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const chatEndRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const isMobile = useIsMobile();
  const currentUser = getUserObject();
  const [open, setOpen] = useState(false);
  const chatListRef = useRef(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchMessages();
    fetchUsers();
    fetchLeaderboard();
  }, []);

  async function fetchMessages() {
    try {
      const res = await authFetch(apiUrl("/api/messages/"), {
        headers: { Authorization: `Bearer ${getAccessToken()}` }
      });
      if (!res.ok) return;
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {}
  }

  async function fetchUsers() {
    try {
      const res = await authFetch(apiUrl("/api/users/chat-users"), {
        headers: { Authorization: `Bearer ${getAccessToken()}` }
      });
      if (!res.ok) return;
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

  async function fetchLeaderboard() {
    try {
      const res = await authFetch(apiUrl("/api/users/chat-leaderboard"), {
        headers: { Authorization: `Bearer ${getAccessToken()}` }
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => []);
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (e) {
      setLeaderboard([]);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;
    try {
      const res = await authFetch(apiUrl("/api/messages/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`
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
      if (!res.ok) return;
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
      const res = await authFetch(apiUrl(`/api/messages/${msgId}/reactions`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({ emoji })
      });
      if (!res.ok) return;
      await fetchMessages();
    } catch (e) {}
    setReactingTo(null);
  }

  const admins = users.filter(u => u.role === "admin");
  const normalUsers = users.filter(u => u.role !== "admin");

  useEffect(() => {
    const el = chatListRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);
  
  return (
    <div className="chat-root">
      <ChatUsers
        admins={admins}
        users={normalUsers}
        ownNeptun={currentUser.neptun}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-left">
            <Button
              className="chat-header-btn"
              onClick={() => setSidebarOpen(true)}
              title={lang === "en" ? "Open users panel" : "Bal sáv nyitása"}
              variant="ghost"
              size="sm"
            >
              ☰
              <span />
              <span />
              <span />
            </Button>
          </div>

          <div className="chat-header-right">
            <Button
              className="chat-header-btn"
              onClick={() => setLeaderboardOpen(true)}
              title={lang === "en" ? "Open leaderboard panel" : "Jobb sáv nyitása"}
              variant="ghost"
              size="sm"
            >
              ⚙️
            </Button>
          </div>
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
          listRef={chatListRef}
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
      <ChatLeaderboard
        leaderboard={leaderboard}
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        isMobile={isMobile}
      />
    </div>
  );
}