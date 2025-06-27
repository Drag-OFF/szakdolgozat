/**
 * Az alkalmazás fő komponense.
 * Betölti a navigációs sávot, a fő tartalmat (útvonalak alapján), valamint a láblécet.
 * A <Routes> komponens határozza meg, hogy melyik oldal jelenjen meg az aktuális útvonal alapján.
 */

import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResendVerify from "./pages/ResendVerify";

/**
 * App komponens.
 * @returns {JSX.Element} Az alkalmazás teljes szerkezete.
 */
export default function App() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/resend-verify" element={<ResendVerify />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}