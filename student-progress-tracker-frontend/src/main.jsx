import "./themeBoot.js";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

if (import.meta.env?.VITE_AUTH_PERSIST !== "local") {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  } catch (_) {}
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
