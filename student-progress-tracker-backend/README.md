# Hallgatói Előrehaladás-követő Webes Alkalmazás

Ez a projekt egy webes alkalmazás, amely lehetővé teszi a hallgatók számára tanulmányi előrehaladásuk nyomon követését és a szakhoz kapcsolódó közösségi kommunikációt. Az alkalmazás független az egyetemi rendszerektől, így önállóan kezelhető.

## Tartalomjegyzék

1. [Projekt célja](#projekt-célja)
2. [Funkcionális követelmények](#funkcionális-követelmények)
3. [Technikai specifikációk](#technikai-specifikációk)
4. [Adatmodellek](#adatmodellek)
5. [Telepítési útmutató](#telepítési-útmutató)
6. [Jövőbeli fejlesztési lehetőségek](#jövőbeli-fejlesztési-lehetőségek)

## Projekt célja

A cél egy modern, reszponzív, intuitív webalkalmazás kifejlesztése, amely lehetővé teszi a hallgatók számára tanulmányi előrehaladásuk követését és a szakhoz kapcsolódó közösségi kommunikációt.

## Funkcionális követelmények

- Regisztráció és hitelesítés
- Kurzuskezelés
- Tanulmányi előrehaladás nyomon követése
- Közösségi chat
- Jogosultságkezelés

## Technikai specifikációk

- **Frontend:** React + TypeScript
- **Backend:** Python (FastAPI)
- **Adatbázis:** MySQL
- **Hosztolás:** Saját VPS

## Adatmodellek

- **users**: Felhasználói adatok
- **courses**: Kurzusok adatai
- **progress**: Hallgatói előrehaladás
- **chat_messages**: Chat üzenetek

## Telepítési útmutató

1. Klónozd a repót:
   ```
   git clone <repository-url>
   ```
2. Navigálj a projekt mappájába:
   ```
   cd student-progress-tracker-backend
   ```
3. Telepítsd a szükséges csomagokat:
   ```
   pip install -r requirements.txt
   ```
4. Indítsd el az alkalmazást:
   ```
   uvicorn app.main:app --reload
   ```

## Jövőbeli fejlesztési lehetőségek

- Badge rendszer
- Toplista
- Push értesítések
- Statisztikai modul

Ez a README.md fájl tartalmazza a projekt alapvető információit és útmutatót a telepítéshez.