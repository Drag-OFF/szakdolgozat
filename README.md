# Hallgatói előrehaladás-követő rendszer - dokumentáció

Monorepo: **`student-progress-tracker-backend/`** (FastAPI + MySQL) és **`student-progress-tracker-frontend/`** (React + Vite).

---

## Tartalomjegyzék

1. [A projekt célja és hatásköre](#1-a-projekt-célja-és-hatásköre)  
2. [Mit tud a rendszer - funkciók modulonként](#2-mit-tud-a-rendszer--funkciók-modulonként)  
3. [Technológiai architektúra](#3-technológiai-architektúra)  
4. [Előfeltételek és telepítés](#4-előfeltételek-és-telepítés)  
5. [Konfiguráció (`.env`, API URL)](#5-konfiguráció-env-api-url)  
6. [Indítás fejlesztői módban](#6-indítás-fejlesztői-módban)  
7. [Biztonság és adatvédelem](#7-biztonság-és-adatvédelem)  
8. [Skálázhatóság, terhelhetőség, megbízhatóság](#8-skálázhatóság-terhelhetőség-megbízhatóság)  
9. [Tesztelési stratégia](#9-tesztelési-stratégia)  
10. [Ismert korlátok](#10-ismert-korlátok)  
11. [További olvasmány](#11-további-olvasmány)

---

## 1. A projekt célja és hatásköre

**Cél:** olyan webalkalmazás, amely **független az egyetemi Neptun-tól**, de a **kurzusok, szakok és követelmények** adminisztrálható adatbázisára építve segíti a hallgatót a **tanulmányi előrehaladás** és a **diplomakövetelmények** átlátható követésében, emellett **közösségi chat** és **kurzusajánló** funkciókat kínál. Az adminok számára **tanterv / Neptun import**, **PDF ellenőrzések** és **szabályok szerkesztése** biztosított.

**Nem célja a projektnek** (fontos tisztázni):

- Nem helyettesíti a hivatalos egyetemi nyilvántartást.
- A pontosság a **bevitt / importált adattól** és a **követelményszabályok helyes beállításától** függ.
- Éles, több ezer egyidejű felhasználós **nagyvállalati SLA** nem része a jelen kódnak - lásd [§8](#8-skálázhatóság-terhelhetőség-megbízhatóság).

---

## 2. Mit tud a rendszer - funkciók modulonként

### 2.1. Hallgatói / bejelentkezett felhasználói felület

| Terület | Rövid leírás | Frontend útvonal (példa) |
|--------|----------------|----------------------------|
| **Kezdőlap, nyelv** | Bemutatkozás, HU/EN váltás | `/` |
| **Regisztráció, belépés** | Felhasználói fiók, JWT alapú munkamenet | `/register`, `/login` |
| **E-mail verifikáció / jelszó** | Elfelejtett jelszó, reset, újraküldés (Mailjet, ha be van állítva) | `/forgot-password`, `/reset-password`, `/resend-verify` |
| **Profil** | Saját adatok | `/profile` |
| **Előrehaladás** | Kurzusok listája, szűrés, XLSX import/export, **követelmények állapota** | `/progress` |
| **Kurzusajánló** | Ajánlások a haladás és szabályok alapján | `/recommendations` |
| **Chat** | Valós idejű üzenetek (WebSocket a backend felől) | `/chat` |

### 2.2. Adminisztráció

| Terület | Rövid leírás | Frontend útvonal (példa) |
|--------|----------------|----------------------------|
| **Admin összesítő panel** | Szakok, felhasználók, kurzusok, ekvivalenciák, követelmény szabályok, progress kézi szerkesztés | `/admin` |
| **Neptun / PDF tanterv import** | Nyilvános tanterv bővítése, kurzusok és szabályok betöltése | `/admin/pdf-import` |
| **PDF „mi lett volna ha” ellenőrzés** | Hallgatói PDF(ek) elemzése mentés nélkül | `/admin/progress-pdf-check` |
| **Tanterv szerkesztők** | Tanterv és plan szerkesztés | `/admin/tanterv-editor`, `/admin/tanterv-plan-editor/:planId` |

Az admin útvonalak a **frontend routing** szintjén vannak; a **valódi védelem** a backend **JWT + `admin` szerepkör** (`admin_required`) ellenőrzésén múlik.

### 2.3. Backend API modulok (áttekintés)

A **OpenAPI felület** minden végpontot listáz: **http://127.0.0.1:8000/docs** (fejlesztésben).

| Prefix / modul | Funkció |
|----------------|---------|
| `/api` + chat | Chat üzenetek, WebSocket |
| `/api/courses` | Kurzusok CRUD-szerű műveletek |
| `/api/progress` | Hallgatói előrehaladás, import/export, template XLSX |
| `/api/users` | Felhasználók, regisztráció, **elfelejtett jelszó**, reset |
| `/api/course_major`, `/api/course_equivalence` | Kurzus–szak, ekvivalenciák |
| `/api/majors` | Szakok |
| `/api/major_requirement_rules` | Követelmény szabályok |
| `/api/course_recommendations` | Ajánlások |
| `/api/admin/...` | Admin tanterv / PDF ellenőrzés végpontok |

A **pontos jogosultság** (pl. csak saját `user_id` előrehaladása) a megfelelő routerekben van implementálva (`get_current_user`, admin ellenőrzés).

---

## 3. Technológiai architektúra

| Réteg | Technológia | Megjegyzés |
|-------|----------------|------------|
| **Frontend** | React 19, Vite 7, React Router | SPA; API hívások `fetch` + JWT `Authorization` header |
| **Backend** | Python, FastAPI, Uvicorn | REST + WebSocket; OpenAPI generált dokumentáció |
| **Adatbázis** | MySQL (PyMySQL driver, SQLAlchemy) | Relációs modell; pool `pool_pre_ping` |
| **Auth** | JWT (Bearer), jelszó hash (bcrypt/passlib) | Cookie helyett header - lásd CORS beállítás |
| **E-mail** | Mailjet (opcionális) | Üres kulcs esetén küldés kihagyva |
| **Fájlok** | XLSX/CSV import, PDF feldolgozás (admin) | pandas, openpyxl, pypdf/pdfplumber a backend függőségek szerint |

**Adatfolyam (egyszerűsítve):** böngésző → HTTPS/HTTP → **Vite dev** vagy statikus hosting → **FastAPI** → **MySQL**. A JWT minden védett kérésben a kliens által küldött fejlécben érkezik.

---

## 4. Előfeltételek és telepítés

### 4.1. Rendszerkövetelmények (ajánlott)

| Komponens | Minimum / ajánlott |
|-----------|---------------------|
| **Operációs rendszer** | Windows 10/11, Linux, macOS |
| **Python** | 3.11+ |
| **Node.js** | 20+ (npm) |
| **MySQL** | 8.x vagy kompatibilis MariaDB |
| **RAM** | fejlesztéshez 8 GB+ ajánlott (MySQL + IDE + böngésző) |
| **Hálózat** | lokális fejlesztéshez elég a localhost; éleshez reverse proxy + TLS |

### 4.2. Adatbázis

1. **MySQL szerver** telepítése és elindítása.  
2. **Adatbázis** és **felhasználó** létrehozása; a kapcsolódó **`DATABASE_URL`** összeállítása ([§5](#5-konfiguráció-env-api-url)).  
3. **Séma:** előállítás **Alembic migrációkkal**; ha a repóban SQL állomány vagy külön séma-leírás szerepel, az a projekt dokumentációja szerint alkalmazható.

### 4.3. Függőségek telepítése

**Backend:**

```bash
cd student-progress-tracker-backend
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**

```bash
cd student-progress-tracker-frontend
npm install
```

---

## 5. Konfiguráció (`.env`, API URL)

### 5.1. Hol van a `.env`?

A backend `app/config.py` a **monorepo gyökerében** (`szakdolgozat/`) keresi a **`.env`** fájlt - nem a `student-progress-tracker-backend` mappában.

### 5.2. Példa változók (backend, gyökér `.env`)

```env
# Kötelező jellegű: MySQL
DATABASE_URL=mysql+pymysql://felhasznalo:jelszo@127.0.0.1:3306/adatbazis_nev

# JWT - élesben erős, véletlenszerű titok
JWT_SECRET_KEY=...

# CORS - fejlesztésben példa:
# CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Publikus URL (e-mailekben lévő linkek)
PUBLIC_SITE_URL=http://localhost:5173

# Mailjet - opcionális; üres = nincs levélküldés
# MAILJET_API_KEY=
# MAILJET_API_SECRET=
```

További kulcsok (Neptun throttling, probe blokkolás, stb.): **`student-progress-tracker-backend/app/config.py`**.

### 5.3. Frontend API cím

A **`student-progress-tracker-frontend/src/config.js`** a `VITE_API_BASE_URL` és `VITE_API_PORT` változókat olvassa. Fejlesztésben gyakori: **`VITE_API_BASE_URL=http://127.0.0.1:8000`** (`.env` a frontend mappában).

---

## 6. Indítás fejlesztői módban

**1. MySQL** fusson, `DATABASE_URL` helyes legyen.

**2. Backend:**

```bash
cd student-progress-tracker-backend
# venv aktiválva
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Dokumentáció: **http://127.0.0.1:8000/docs**

**3. Frontend:**

```bash
cd student-progress-tracker-frontend
npm run dev
```

- Tipikus cím: **http://localhost:5173**

**4. Ellenőrzés:** regisztráció / bejelentkezés, egy védett oldal (pl. `/progress`), admin funkció admin felhasználóval.

**Éles frontend build:**

```bash
cd student-progress-tracker-frontend
npm run build
```

A `package.json`-ban lévő **`postbuild`** jelenleg **Windows + XAMPP** útvonalra másol - éles szerveren cseréld le vagy távolítsd el.

---

## 7. Biztonság és adatvédelem

| Téma | Megvalósítás / megjegyzés |
|------|---------------------------|
| **Hitelesítés** | JWT access token, `Authorization: Bearer …` |
| **Jelszó** | Nem plain text tárolás; hash (bcrypt jellegű) |
| **Szerepkörök** | Legalább `user` és `admin` (Enum a modellben) |
| **Hozzáférés** | Előrehaladás: admin más userhez is hozzáférhet; hallgató tipikusan csak saját adataihoz (router logika) |
| **CORS** | `allow_credentials=False` + JWT header - összhangban a FastAPI dokumentációval |
| **E-mail** | Verifikáció / jelszó reset linkek; **Mailjet kulcsok** ne kerüljenek verziókezelésbe |
| **`.env`** | **Ne commitold** - `.gitignore`-ban legyen; éles `JWT_SECRET_KEY` rotálása |
| **Adatvédelem / GDPR** | A kód önmagában nem minősül „GDPR tanúsítványnak”: szükséges **jogi háttér**, **adatkezelési tájékoztató**, **retenciós szabályok**, **export/törlés** igények - ezek részben üzleti/folyamat kérdések, nem csak technikai |

**Ajánlott éles környezetben:** HTTPS (TLS), reverse proxy, rate limiting, naplózás, biztonsági frissítések (`pip` / `npm audit`).

---

## 8. Skálázhatóság, terhelhetőség, megbízhatóság

| Szempont | Értékelés |
|----------|-----------|
| **Vertikális skálázás** | A FastAPI + Uvicorn egy gépen növelhető workerrel / erőforrással; MySQL szerver memória / lemez I/O szűk keresztmetszet lehet. |
| **Horizontális skálázás** | Több Uvicorn példány mögött load balancer **session nélkül** működhet, ha az **JWT stateless** marad és az **adatbázis** közös; **WebSocket** (chat) esetén sticky session vagy külön üzenetbusz (Redis stb.) nélkül korlátozott. |
| **Adatbázis** | Egy MySQL példány nagy egyidejű írással bottleneck; olvasás replikáció, sharding - nem része ennek a repónak. |
| **Neptun / külső import** | A backendben **rate limit / késleltetés** (pl. `NEPTUN_INTER_POST_DELAY_MS`, `NEPTUN_MAX_BFS_STEPS`) védi a túl agresszív hívásoktól - skálázhatóság helyett **biztonságos külső használat**. |
| **Statikus frontend** | Jól skálázható CDN-nel; a korlát főleg az **API** és az **adatbázis**. |

**Összegzés:** a rendszer **kis–közepes** egyetemi / oktatási környezetre alkalmas; **nagy létszámú, SLA-s** éles üzemhez további architektúra- és terhelésesztetek szükségesek.

---

## 9. Tesztelési stratégia

A repó **nem tartalmaz kötelező, teljes körű pytest** csomagot minden modulra; az alábbiak **opcionálisan** bevezethetők vagy kiegészíthetők.

### 9.1. Manuális ellenőrzések (átfogás)

- Regisztráció, e-mail link (Mailjet beállítás esetén), bejelentkezés.  
- Hallgatói nézet: előrehaladás, XLSX letöltés / feltöltés.  
- Admin: kurzus / szabály szerkesztés, PDF import útvonalak.  
- Chat: párhuzamos üzenetküldés több kliensen.  
- Jogosultság: nem admin API hozzáférés elutasítása (HTTP 403/401).

### 9.2. Automatizált tesztek (pytest, HTTP kliens)

- **Egységtesztek:** jelszó ellenőrzés, JWT, séma-segédfüggvények.  
- **API tesztek:** FastAPI `TestClient`, teszt adatbázis (in-memory SQLite vagy konténeres MySQL).  
- **Szerződéses tesztek:** OpenAPI séma és HTTP válaszkódok.

### 9.3. Terhelés- és stresszteszt (opcionális)

- **Locust** vagy **k6:** autentikált ismétlődő kérések (pl. GET `/api/progress/...`).  
- **Mérendő:** válaszidő percentilis (p95), hibarát, adatbázis terhelés.  
- Terheléses próbák csak **engedélyezett** tesztkörnyezetben futtathatók.

### 9.4. Biztonsági ellenőrzések

- `npm audit`, `pip audit` / függőség frissítés.  
- JWT titok nem szivárog-e build logba.  
- CORS beállítás éles domainre szűkítve.

---

## 10. Ismert korlátok

- **Adatpontosság:** importált Neptun / PDF adat és admin által bevitt szabályok minőségétől függ.  
- **Skálázás:** lásd [§8](#8-skálázhatóság-terhelhetőség-megbízhatóság); WebSocket és egyetlen MySQL nem „végtelen”.  
- **Közvetlen egyetemi integráció:** nincs hivatalos Neptun API-szerű garantált interfész a repó leírása szerint - külső scraping/import logika változhat.  
- **Deploy:** a frontend `postbuild` gépspecifikus lehet; éles pipeline-t külön kell definiálni.

---

## 11. További olvasmány

| Dokumentum | Tartalom |
|------------|----------|
| [student-progress-tracker-backend/README.md](student-progress-tracker-backend/README.md) | Backend rövid összefoglaló, `uvicorn` parancs |
| **OpenAPI** | `GET /docs` a futó API-n |
| **`app/config.py`** | Összes környezeti változó magyarázata |
| **`app/main.py`** | Routerek listája |

---

*A dokumentáció a tárolt forráskód adott verziójához igazodik.*
