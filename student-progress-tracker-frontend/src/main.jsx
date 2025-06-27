/**
 * A React alkalmazás belépési pontja.
 * Itt történik a BrowserRouter és az App komponens renderelése a gyökérelembe.
 * Ez biztosítja a kliens oldali útvonalkezelést az egész alkalmazásban.
 */

/**
 * A React alkalmazás belépési pontja.
 * Itt történik a BrowserRouter és az App komponens renderelése a gyökérelembe.
 * Ez biztosítja a kliens oldali útvonalkezelést az egész alkalmazásban.
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)