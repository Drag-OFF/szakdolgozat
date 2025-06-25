# Hallgatói Előrehaladás-követő Webes Alkalmazás – Rendszerterv

## 1. Áttekintés

Ez a dokumentum a „Hallgatói Előrehaladás-követő Webes Alkalmazás” fejlesztéséhez készült rendszerterv, amely részletes technikai és funkcionális specifikációkat tartalmaz egy saját szerveren futó, webes felületű alkalmazáshoz.

### 1.1 Projekt célja

A cél egy modern, reszponzív, intuitív webalkalmazás kifejlesztése, amely lehetővé teszi a hallgatók számára tanulmányi előrehaladásuk követését és a szakhoz kapcsolódó közösségi kommunikációt. Az alkalmazás független az egyetemi rendszerektől (Neptun, Coospace), így önállóan kezelhető.

---

## 2. Funkcionális követelmények

### 2.1 Regisztráció és hitelesítés

- Regisztráció e-mail alapon
- Kötelező adatok:
  - Teljes név
  - Születési dátum
  - Anyja leánykori neve
  - Személyi igazolvány szám
  - Lakcímkártya szám
  - E-mail cím
  - Jelszó
  - Szak (legördülő listából választható – SZTE TTIK szakok)
- E-mail verifikáció
- Bejelentkezés e-mail + jelszó kombinációval
- Jelszóhashelés (pl. bcrypt)

### 2.2 Kurzuskezelés és tanulmányi előrehaladás

- Kurzusok hozzáadása manuálisan vagy Excel feltöltéssel
- Kurzuslista: elvégzett, folyamatban lévő, hátralévő
- Ajánlott félév és teljesített félév nyilvántartás
- Automatikus félév becslés a jelenlegi előrehaladás alapján

### 2.3 Pontszámítási rendszer

- Kurzus teljesítésének időzítése alapján:
  - Korábbi teljesítés: 15 pont
  - Időben teljesítés: 10 pont
  - Későbbi teljesítés: 5 pont
- Összpontszám számítása
- Pontszám közzététel (opcionális)

### 2.4 Közösségi chat

- Szak-specifikus csoportos chat
- Névvel vagy anonim hozzászólás
- Valós idejű üzenetküldés WebSocket alapon
- Admin jogosultságú moderáció

### 2.5 Jogosultságkezelés

| Funkció                      | Felhasználó | Admin |
|-----------------------------|-------------|-------|
| Regisztráció / Bejelentkezés| ✔           | ✔     |
| Kurzusok feltöltése         | ✔           | ✔     |
| Előrehaladás megtekintése   | ✔           | ✔     |
| Chatelés                    | ✔           | ✔     |
| Üzenetek moderálása         | ✘           | ✔     |
| Felhasználók kezelése       | ✘           | ✔     |

---

## 3. Technikai specifikációk

### 3.1 Platform és fejlesztési környezet

- **Frontend:** React + TypeScript (Next.js opcionális)
- **Backend:** Python (FastAPI ajánlott a REST API-hoz)
- **Adatbázis:** MySQL (pl. MariaDB alternatívaként)
- **Hosztolás:** Saját VPS + NGINX reverse proxy + HTTP

### 3.2 Backend szolgáltatások

- RESTful API (FastAPI vagy Django REST Framework)
- JWT-alapú autentikáció
- WebSocket (FastAPI `websockets` vagy Django Channels)
- Excel fájl feldolgozás (pl. `pandas`, `openpyxl`)

---

## 4. Adatmodellek (MySQL táblák)

### 4.1 `users` tábla

| Mező               | Típus         |
|--------------------|---------------|
| id                 | INT (PK)      |
| uid                | VARCHAR(64)   |
| email              | VARCHAR(255)  |
| password_hash      | TEXT          |
| name               | VARCHAR(100)  |
| birth_date         | DATE          |
| id_card_number     | VARCHAR(20)   |
| address_card_number| VARCHAR(20)   |
| mothers_name       | VARCHAR(100)  |
| major              | VARCHAR(100)  |
| verified           | BOOLEAN       |
| role               | ENUM('user', 'admin') |
| created_at         | DATETIME      |

### 4.2 `courses` tábla

| Mező                 | Típus         |
|----------------------|---------------|
| id                   | INT (PK)      |
| course_code          | VARCHAR(50)   |
| name                 | VARCHAR(255)  |
| credit               | INT           |
| recommended_semester | INT           |

### 4.3 `progress` tábla

| Mező               | Típus         |
|--------------------|---------------|
| id                 | INT (PK)      |
| user_id            | INT (FK → users.id) |
| course_id          | INT (FK → courses.id) |
| completed_semester | INT           |
| status             | ENUM('completed', 'in_progress', 'pending') |
| points             | INT           |

### 4.4 `chat_messages` tábla

| Mező       | Típus         |
|------------|---------------|
| id         | INT (PK)      |
| major      | VARCHAR(100)  |
| user_id    | INT (FK)      |
| message    | TEXT          |
| timestamp  | DATETIME      |
| anonymous  | BOOLEAN       |

---

## 5. Felhasználói felület vázlat (React)

### 5.1 Hitelesítés

- **Bejelentkezés:**  
  - NEPTUN azonosító vagy e-mail  
  - Jelszó  
- **Regisztráció:**  
  - Teljes adatlap kitöltése  
  - Jelszabály-ellenőrzés  
  - E-mail verifikáció

### 5.2 Főmenü (navigációs sáv)

- Kurzusaim  
- Haladásom  
- Feltöltés (.xlsx)  
- Közösségi Chat  
- Profil  
- Kijelentkezés

### 5.3 Kurzusaim

- Táblázatos megjelenítés
- Kurzus állapot ikonjai: ✅ / ⏳ / ❌  
- Pontértékek feltüntetése

### 5.4 Haladásom

- Félév-alapú szűrés
- Elvégzett vs. ajánlott félév grafikon (pl. Chart.js vagy Recharts)
- Összpontszám

### 5.5 Előrehaladás feltöltése

- Minta letöltés
- `.xlsx` fájl feltöltés (drag & drop vagy file input)
- Visszajelzés a sikeres vagy hibás importálásról

### 5.6 Chat felület

- Valós idejű WebSocket-alapú chat
- Névtelen / névvel üzenetküldési opció
- Admin üzenetek kiemelve

### 5.7 Admin panel

- Felhasználók listázása, törlése, jogosultság módosítása
- Chat moderálás: jelentett üzenetek kezelése, üzenetek törlése

---

## 6. Jövőbeli fejlesztési lehetőségek

- **Badge rendszer:** Mérföldkövek utáni jelvények
- **Toplista:** Pontszám alapú rangsor
- **Push értesítések:** (pl. Firebase vagy Web Push)
- **Statisztikai modul:** Tanulmányi adatok vizualizációja

---

## 7. Összegzés

Ez a rendszerterv egy teljesen saját infrastruktúrán (VPS) futó, Python backenddel és React frontenddel rendelkező webes alkalmazás technikai alapjait fekteti le. A projekt célja a hallgatók önálló tanulmányi nyomon követésének támogatása, valamint szak-specifikus közösségi platform biztosítása. Az architektúra skálázható, biztonságos, és jól illeszkedik egy szakdolgozati projekt keretébe.