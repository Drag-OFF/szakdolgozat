import { redirectToLogin } from "./authStorage";
import { syntheticUnauthorizedResponse } from "./apiUnauthorizedResponse";
import { REGISTER_I18N } from "./translations";

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

/** Regisztrációs űrlap validálása; mezőnkénti hibaüzenet-objektumot ad vissza (`lang`: hu | en). */
export function validateRegisterForm(form, lang = "hu") {
  const L = lang === "en" ? "en" : "hu";
  const t = REGISTER_I18N.formErrors[L];
  const errors = {};

  if (!isValidNeptun(form.uid)) {
    errors.uid = t.uid;
  }

  if (!isValidEmail(form.email)) {
    errors.email = t.email;
  }

  if (!form.password || form.password.length < 8) {
    errors.password = t.password;
  }

  if (!form.name || form.name.length < 3) {
    errors.name = t.name;
  }

  if (!form.birth_date) {
    errors.birth_date = t.birth_date;
  }

  if (!form.id_card_number) {
    errors.id_card_number = t.id_card_number;
  }

  if (!form.address_card_number) {
    errors.address_card_number = t.address_card_number;
  }

  if (!form.mothers_name) {
    errors.mothers_name = t.mothers_name;
  }

  if (!form.major) {
    errors.major = t.major;
  }

  return errors;
}

/**
 * Regisztrációs API hiba (`detail`) megjelenítése a választott nyelven.
 * A szerver magyar szöveget ad; angol nézetben leképezzük.
 */
export function formatRegisterApiErrorDetail(detail, lang = "hu") {
  const L = lang === "en" ? "en" : "hu";
  const mapHuToEn = REGISTER_I18N.apiHuToEn;
  const fallback = L === "en" ? REGISTER_I18N.apiFallbackEn : REGISTER_I18N.apiFallbackHu;

  const translateOne = (raw) => {
    const msg = typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
    if (!msg) return fallback;
    if (L === "hu") return msg;
    if (mapHuToEn[msg]) return mapHuToEn[msg];
    const prefixHu = REGISTER_I18N.emailSendErrorPrefixHu;
    if (msg.startsWith(prefixHu)) {
      return `${REGISTER_I18N.emailSendErrorPrefixEn} ${msg.slice(prefixHu.length).trim()}`.trim();
    }
    return msg;
  };

  if (detail == null || detail === "") return fallback;
  if (typeof detail === "string") return translateOne(detail);
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      const m =
        item && typeof item === "object"
          ? (item.msg ?? item.message ?? item.detail)
          : item;
      return translateOne(m != null ? m : "");
    });
    return parts.filter(Boolean).join("\n") || fallback;
  }
  return translateOne(String(detail));
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
    ALL: "-",
    NONE: "Spec nélkül",
    "MK-S-MA": "MA",
    "MK-S-BMR": "BMR",
    "MK-S-IIR": "IIR",
    "MK-S-IA": "IA"
  };
  const en = {
    ALL: "-",
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