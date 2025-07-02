-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2025. Júl 02. 21:26
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `database`
--
CREATE DATABASE IF NOT EXISTS `database` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `database`;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `major` varchar(100) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `anonymous_name` varchar(64) DEFAULT NULL,
  `reply_to_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `major`, `user_id`, `message`, `timestamp`, `anonymous`, `anonymous_name`, `reply_to_id`) VALUES
(1, 'Gazdaságinformatikus', 17, 'Sziasztok Hallgatók!', '2025-07-02 11:23:01', 0, NULL, NULL),
(2, 'Gazdaságinformatikus', 51, 'Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! Szia! ', '2025-07-02 11:25:59', 0, NULL, NULL),
(4, 'Gazdaságinformatikus', 17, 'Igen', '2025-07-02 13:00:39', 0, NULL, NULL),
(5, 'Gazdaságinformatikus', 17, 'Szaisztok!', '2025-07-02 13:02:09', 0, NULL, NULL),
(9, 'Gazdaságinformatikus', 17, 'asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd', '2025-07-02 17:17:38', 0, NULL, NULL),
(10, 'Gazdaságinformatikus', 17, 'asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd', '2025-07-02 17:17:40', 0, NULL, NULL),
(11, 'Gazdaságinformatikus', 17, 'asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd', '2025-07-02 17:17:41', 0, NULL, NULL),
(12, 'Gazdaságinformatikus', 17, 'asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd', '2025-07-02 17:17:43', 0, NULL, NULL),
(13, 'Gazdaságinformatikus', 17, 'Szerinted működik a válasz funkció?', '2025-07-02 19:18:58', 0, NULL, 2),
(14, 'Gazdaságinformatikus', 17, 'Nézzük tudunk-e emojit beszúrni 🥰', '2025-07-02 19:23:23', 0, NULL, NULL),
(15, 'Gazdaságinformatikus', 17, 'Igeeen! 🫠', '2025-07-02 19:23:40', 0, NULL, 13);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `courses`
--

DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `course_code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `credit` int(11) NOT NULL,
  `recommended_semester` int(11) NOT NULL,
  `prerequisites` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`prerequisites`)),
  `allow_parallel_prerequisite` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `courses`
--

INSERT INTO `courses` (`id`, `course_code`, `name`, `credit`, `recommended_semester`, `prerequisites`, `allow_parallel_prerequisite`) VALUES
(1, 'INF101', 'Bevezetés a programozásba', 5, 1, NULL, 0),
(2, 'INF102', 'Adatbázisok alapjai', 5, 2, NULL, 0),
(3, 'FIZ101', 'Klasszikus mechanika', 4, 1, NULL, 0);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `progress`
--

DROP TABLE IF EXISTS `progress`;
CREATE TABLE `progress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `completed_semester` int(11) DEFAULT NULL,
  `status` enum('completed','in_progress','pending') NOT NULL,
  `points` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `progress`
--

INSERT INTO `progress` (`id`, `user_id`, `course_id`, `completed_semester`, `status`, `points`) VALUES
(1, 1, 1, 1, 'completed', 15),
(2, 1, 2, 3, 'completed', 5),
(3, 2, 3, 1, 'completed', 15),
(4, 2, 1, NULL, 'pending', 0);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `uid` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` text NOT NULL,
  `name` varchar(100) NOT NULL,
  `birth_date` date NOT NULL,
  `id_card_number` varchar(20) NOT NULL,
  `address_card_number` varchar(20) NOT NULL,
  `mothers_name` varchar(100) NOT NULL,
  `major` enum('Gazdaságinformatikus','Mérnökinformatikus','Programtervező informatikus','Villamosmérnök','Üzemmérnök-informatikus') NOT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT 0,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `verify_token` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`id`, `uid`, `email`, `password_hash`, `name`, `birth_date`, `id_card_number`, `address_card_number`, `mothers_name`, `major`, `verified`, `role`, `created_at`, `verify_token`, `reset_token`, `reset_token_expires`) VALUES
(1, 'U001', 'student1@example.com', 'hashed_pw1', 'Kiss Anna', '2000-05-12', '123456AA', '654321BB', 'Nagy Mária', 'Programtervező informatikus', 1, 'user', '2024-06-01 10:00:00', NULL, NULL, NULL),
(2, 'U002', 'student2@example.com', 'hashed_pw2', 'Nagy Béla', '1999-11-23', '234567BB', '765432CC', 'Kovács Ilona', 'Gazdaságinformatikus', 1, 'user', '2024-06-02 11:00:00', NULL, NULL, NULL),
(3, 'U003', 'admin@example.com', 'hashed_pw3', 'Admin János', '1985-01-01', '345678CC', '876543DD', 'Szabó Erzsébet', 'Programtervező informatikus', 1, 'admin', '2024-06-03 12:00:00', NULL, NULL, NULL),
(17, 'HEZUGM', 'harkai.dominik0@gmail.com', '$2b$12$9mrHAsD7an5.LNBOxcJ8T.uGXX7GCtd5sX0fNTCBDmFx0vsQtMxPS', 'Harkai Dominik', '2001-11-11', '111111NE', '111111KE', 'Sári Erzsébet', 'Gazdaságinformatikus', 1, 'admin', '2025-06-23 13:00:23', NULL, NULL, NULL),
(26, 'GBG15D', 'buskristof415@gmail.com', '$2b$12$LB44D11dm2AS9vviNAeJRuDi7OOFPIU8F2RJmmMOLU/z8RA1oZo8u', 'Bús Kristóf', '2010-06-11', '666666AD', '666666AD', 'Lakatos Máriané', 'Mérnökinformatikus', 1, 'user', '2025-06-24 22:42:08', NULL, 'c3222117-8329-4995-b740-114181a6545b', '2025-06-26 19:06:28'),
(51, 'HEZUGN', 'kiss.evelin2007@gmail.com', '$2b$12$X/Wz53SVyRwruJkvOqaVAOSWS7b0arOYozOCOmLpq8s3FVBxD.XzC', 'Harkai Dominik', '2001-11-01', '111111NE', '111111KE', 'Sári Erzsébet', 'Gazdaságinformatikus', 1, 'user', '2025-07-01 15:43:15', NULL, '96e48bfa-532d-4e1f-856d-70a15cc4d29b', '2025-07-01 16:18:57');

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_reply_to_message` (`reply_to_id`);

--
-- A tábla indexei `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `course_code` (`course_code`);

--
-- A tábla indexei `progress`
--
ALTER TABLE `progress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `course_id` (`course_id`);

--
-- A tábla indexei `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT a táblához `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `progress`
--
ALTER TABLE `progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_reply_to_message` FOREIGN KEY (`reply_to_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL;

--
-- Megkötések a táblához `progress`
--
ALTER TABLE `progress`
  ADD CONSTRAINT `progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `progress_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
