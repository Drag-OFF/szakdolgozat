import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResendVerify from "./pages/ResendVerify";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import "./App.css";

/**
 * App komponens.
 * @returns {JSX.Element} Az alkalmazás teljes szerkezete.
 */
export default function App() {
  const location = useLocation();

  return (
    <div className="app-wrapper">
      <Navbar />
      <main className={location.pathname === "/chat" ? "chat-main-padding" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/resend-verify" element={<ResendVerify />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      {location.pathname !== "/chat" && <Footer />}
    </div>
  );
}