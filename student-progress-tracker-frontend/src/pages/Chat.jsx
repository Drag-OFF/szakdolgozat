import { useState, useEffect, useRef } from "react";
import "../styles/Chat.css";
import { shortMsg, getUserName, findMessageById, authFetch } from "../utils";
import ChatUsers from "../components/ChatUsers";
import ChatMessagesList from "../components/ChatMessagesList";
import ChatInputRow from "../components/ChatInputRow";
import ChatLeaderboard from "../components/ChatLeaderboard";

/**
 * Egyedi hook, amely figyeli az ablak méretét, és visszaadja, hogy mobil nézetben vagyunk-e.
 * @param {number} [breakpoint=1000] - A mobil/desktop váltás szélessége.
 * @returns {boolean} Igaz, ha mobil nézet.
 */
function useIsMobile(breakpoint = 1000) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/**
 * Chat oldal fő komponense.
 * Itt történik az üzenetek, felhasználók, reakciók, válaszok, ranglista és témaváltás kezelése.
 * Mobil és asztali nézetet is támogat.
 *
 * Főbb funkciók:
 * - Üzenetek lekérése, küldése, reakciók hozzáadása
 * - Felhasználók és adminok listázása
 * - Ranglista megjelenítése
 * - Emoji picker, válasz funkció, anonim üzenetküldés
 * - Téma (sötét/világos) és nyelv váltás
 *
 * @returns {JSX.Element} A chat oldal teljes tartalma.
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const isMobile = useIsMobile();
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const [open, setOpen] = useState(false);
  const chatListRef = useRef(null);

  // Dummy leaderboard, TODO: Fetch from API
  const leaderboard = [
    { name: "Kovács Béla", points: 120, neptun: "ABC123" },
    { name: "Nagy Anna", points: 110, neptun: "DEF456" },
    { name: "Kiss Péter", points: 90, neptun: "GHI789" }
  ];

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  async function fetchMessages() {
    try {
      const res = await authFetch("http://enaploproject.ddns.net:8000/api/messages/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
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
      const res = await authFetch("http://enaploproject.ddns.net:8000/api/users/chat-users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
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

  async function sendMessage() {
    if (!input.trim()) return;
    try {
      const res = await authFetch("http://enaploproject.ddns.net:8000/api/messages/", {
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
      const res = await authFetch("http://enaploproject.ddns.net:8000/api/messages/" + msgId + "/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({ emoji })
      });
      if (!res) return;
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
            <button
              className="chat-header-btn"
              onClick={() => setSidebarOpen(true)}
              title="Bal sáv nyitása"
            >
              ☰
              <span />
              <span />
              <span />
            </button>
            <div className={`navbar-links`}></div>
          </div>

          <div className="chat-header-center">
            <button
              className="chat-header-btn"
              onClick={toggleTheme}
              title="Téma váltás"
            >
              🌙 / ☀️
            </button>
            <button
              className="chat-header-btn"
              onClick={toggleLang}
              title="Nyelv váltás"
            >
              🇭🇺 / 🇬🇧
            </button>
          </div>

          <div className="chat-header-right">
            <button
              className="chat-header-btn"
              onClick={() => setLeaderboardOpen(true)}
              title="Jobb sáv nyitása"
            >
              ⚙️
            </button>
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