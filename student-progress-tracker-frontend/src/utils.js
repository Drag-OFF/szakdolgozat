import { clearAuth } from "./authStorage";

/**
 * Dátumot formáz emberi olvasható formára.
 * Ha a dátum ma van, csak az időt adja vissza, különben teljes dátumot és időt.
 * @param {string|Date} date - A formázandó dátum.
 * @returns {string} Formázott dátum szöveg.
 */
export function formatDate(date) {
  const now = new Date();
  const d = new Date(date);
  const isToday = now.toDateString() === d.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/**
 * Egy üzenet szövegét rövidíti, ha túl hosszú.
 * @param {Object} msg - Az üzenet objektum, amiben van message property.
 * @returns {string} Rövidített üzenet szöveg.
 */
export function shortMsg(msg) {
  if (!msg) return "";
  let txt = msg.message.replace(/\s+/g, " ").trim();
  if (txt.length > 60) txt = txt.slice(0, 57) + "...";
  return txt;
}

/**
 * Egy üzenet reakcióit csoportosítja emoji szerint.
 * @param {Object} msg - Az üzenet objektum, amiben van reactions tömb.
 * @returns {Object} Objektum, ahol a kulcs az emoji, az érték a user_id-k tömbje.
 */
export function groupReactions(msg) {
  const groups = {};
  if (!msg.reactions || !Array.isArray(msg.reactions)) return groups;
  msg.reactions.forEach(r => {
    if (!groups[r.emoji]) groups[r.emoji] = [];
    groups[r.emoji].push(r.user_id);
  });
  return groups;
}

/**
 * Egy felhasználó nevét adja vissza az id alapján.
 * @param {Array} users - Felhasználók tömbje.
 * @param {string|number} userId - A keresett felhasználó id-ja.
 * @returns {string} A felhasználó neve vagy "Ismeretlen".
 */
export function getUserName(users, userId) {
  const user = users.find(u => String(u.id) === String(userId));
  return user ? user.name : "Ismeretlen";
}

/**
 * Egy üzenetet keres az id alapján.
 * @param {Array} messages - Üzenetek tömbje.
 * @param {string|number} id - A keresett üzenet id-ja.
 * @returns {Object|undefined} Az üzenet objektum vagy undefined, ha nincs ilyen.
 */
export function findMessageById(messages, id) {
  return messages.find(m => String(m.id) === String(id));
}

/**
 * Ellenőrzi, hogy egy e-mail cím formailag helyes-e (tartalmaz-e @ jelet).
 * @param {string} email - Az ellenőrizendő e-mail cím.
 * @returns {boolean} Igaz, ha helyes az e-mail cím.
 */
export function isValidEmail(email) {
  return typeof email === "string" && email.includes("@");
}

/**
 * Ellenőrzi, hogy egy Neptun kód helyes-e (6 karakter, betű/szám, nincs benne @).
 * @param {string} neptun - Az ellenőrizendő Neptun kód.
 * @returns {boolean} Igaz, ha helyes a Neptun kód.
 */
export function isValidNeptun(neptun) {
  // Egyszerű példa: 6 karakter, betű/szám, nem tartalmaz @
  return typeof neptun === "string" && /^[a-zA-Z0-9]{6}$/.test(neptun) && !neptun.includes("@");
}

/**
 * Regisztrációs űrlap validációja, hibák összegyűjtése.
 * @param {Object} form - Az űrlap adatai (uid, email, password, name, stb.).
 * @returns {Object} Hibák objektuma, ahol a kulcs a mező neve, az érték a hibaüzenet.
 */
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

/**
 * Ellenőrzi, hogy egy jelszó legalább 8 karakter hosszú-e.
 * @param {string} pw - Az ellenőrizendő jelszó.
 * @returns {boolean} Igaz, ha a jelszó elég hosszú.
 */
export function isValidPassword(pw) {
  return typeof pw === "string" && pw.length >= 8;
}

/**
 * Ellenőrzi, hogy két jelszó egyezik-e.
 * @param {string} pw1 - Első jelszó.
 * @param {string} pw2 - Második jelszó.
 * @returns {boolean} Igaz, ha a két jelszó megegyezik.
 */
export function passwordsMatch(pw1, pw2) {
  return pw1 === pw2;
}

/**
 * API hívás wrapper, amely automatikusan kezeli a lejárt vagy érvénytelen tokeneket.
 *
 * Ha a szerver 401-es (Unauthorized) választ ad, törli a bejelentkezési adatokat,
 * majd átirányítja a felhasználót a főoldalra ("/").
 * Egyébként ugyanúgy viselkedik, mint a fetch: visszaadja a Response objektumot.
 *
 * @param {string} url - Az API végpont URL-je.
 * @param {Object} [options={}] - A fetch opciói (headers, method, body, stb.).
 * @returns {Promise<Response|null>} A fetch válasza, vagy null ha átirányítás történt.
 *
 * @example
 * import { authFetch } from "./utils";
 * const res = await authFetch("/api/messages", { headers: { Authorization: "Bearer ..." } });
 * if (!res) return; // Token lejárt, átirányítás történt
 * const data = await res.json();
 */
export async function authFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    clearAuth();
    window.location.href = "/";
    return null;
  }
  return res;
}