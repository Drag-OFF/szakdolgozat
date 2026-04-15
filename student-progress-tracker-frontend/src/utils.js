import { redirectToLogin } from "./authStorage";
import { syntheticUnauthorizedResponse } from "./apiUnauthorizedResponse";

/** Dátum megjelenítése: ma esetén csak idő, egyébként teljes timestamp. */
export function formatDate(date) {
  const now = new Date();
  const d = new Date(date);
  const isToday = now.toDateString() === d.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function shortMsg(msg) {
  if (!msg) return "";
  let txt = msg.message.replace(/\s+/g, " ").trim();
  if (txt.length > 60) txt = txt.slice(0, 57) + "...";
  return txt;
}

export function groupReactions(msg) {
  const groups = {};
  if (!msg.reactions || !Array.isArray(msg.reactions)) return groups;
  msg.reactions.forEach(r => {
    if (!groups[r.emoji]) groups[r.emoji] = [];
    groups[r.emoji].push(r.user_id);
  });
  return groups;
}

export function getUserName(users, userId) {
  const user = users.find(u => String(u.id) === String(userId));
  return user ? user.name : "Ismeretlen";
}

export function findMessageById(messages, id) {
  return messages.find(m => String(m.id) === String(id));
}

export function isValidEmail(email) {
  return typeof email === "string" && email.includes("@");
}

export function isValidNeptun(neptun) {
  return typeof neptun === "string" && /^[a-zA-Z0-9]{6}$/.test(neptun) && !neptun.includes("@");
}

/** Regisztrációs űrlap validálása; mezőnkénti hibaüzenet-objektumot ad vissza. */
export function validateRegisterForm(form) {
  const errors = {};

  if (!isValidNeptun(form.uid)) {
    errors.uid = "A Neptun kód 6 karakteres, csak betű és szám lehet.";
  }

  if (!isValidEmail(form.email)) {
    errors.email = "Érvényes e-mail címet adj meg!";
  }

  if (!form.password || form.password.length < 8) {
    errors.password = "A jelszónak legalább 8 karakter hosszúnak kell lennie.";
  }

  if (!form.name || form.name.length < 3) {
    errors.name = "Add meg a teljes neved!";
  }

  if (!form.birth_date) {
    errors.birth_date = "Add meg a születési dátumodat!";
  }

  if (!form.id_card_number) {
    errors.id_card_number = "Add meg a személyi igazolvány számodat!";
  }

  if (!form.address_card_number) {
    errors.address_card_number = "Add meg a lakcímkártya számodat!";
  }

  if (!form.mothers_name) {
    errors.mothers_name = "Add meg az anyád nevét!";
  }

  if (!form.major) {
    errors.major = "Válassz szakot!";
  }

  return errors;
}

export function isValidPassword(pw) {
  return typeof pw === "string" && pw.length >= 8;
}

export function passwordsMatch(pw1, pw2) {
  return pw1 === pw2;
}

// 401-nél törli az auth adatokat, majd loginra irányít.
export async function authFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    redirectToLogin();
    return syntheticUnauthorizedResponse();
  }
  return res;
}

/** Specializációs kód felhasználóbarát címkévé alakítása (HU/EN). */
export function formatChosenSpecDisplay(code, lang = "hu") {
  const c = code == null || String(code).trim() === "" ? null : String(code).trim().toUpperCase();
  const hu = {
    ALL: "—",
    NONE: "Spec nélkül",
    "MK-S-MA": "MA",
    "MK-S-BMR": "BMR",
    "MK-S-IIR": "IIR",
    "MK-S-IA": "IA"
  };
  const en = {
    ALL: "—",
    NONE: "No spec",
    "MK-S-MA": "MA",
    "MK-S-BMR": "BMR",
    "MK-S-IIR": "IIR",
    "MK-S-IA": "IA"
  };
  const m = lang === "en" ? en : hu;
  if (!c) return m.ALL;
  return m[c] || c;
}