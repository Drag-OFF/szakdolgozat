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
import ProgressTracker from "./pages/ProgressTracker";
import CourseRecommender from "./pages/CourseRecommender";
import AdminPdfImport from "./pages/AdminPdfImport";
import AdminTantervEditor from "./pages/AdminTantervEditor";
import AdminTantervPlanEditor from "./pages/AdminTantervPlanEditor";
import AdminProgressPdfCheck from "./pages/AdminProgressPdfCheck";
import { LangProvider } from "./context/LangContext";
import "./App.css";

export default function App() {
  const location = useLocation();

  return (
    <LangProvider>
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
            <Route path="/admin/pdf-import" element={<AdminPdfImport />} />
            <Route path="/admin/progress-pdf-check" element={<AdminProgressPdfCheck />} />
            <Route path="/admin/tanterv-editor" element={<AdminTantervEditor />} />
            <Route path="/admin/tanterv-plan-editor/:planId" element={<AdminTantervPlanEditor />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/progress" element={<ProgressTracker />} />
            <Route path="/recommendations" element={<CourseRecommender />} />
          </Routes>
        </main>
        {location.pathname !== "/chat" && <Footer />}
      </div>
    </LangProvider>
  );
}