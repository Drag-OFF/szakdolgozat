-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2025. Jún 23. 20:34
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
  `anonymous` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `major`, `user_id`, `message`, `timestamp`, `anonymous`) VALUES
(1, 'Programtervező Informatikus', 1, 'Sziasztok! Valaki tud segíteni az adatbázis háziban?', '2024-06-10 14:00:00', 0),
(2, 'Fizikus', 2, 'Üdv mindenkinek!', '2024-06-10 14:05:00', 1),
(3, 'Programtervező Informatikus', 3, 'Kedves hallgatók, ne felejtsétek el a beadandót!', '2024-06-10 15:00:00', 0);

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
  `verify_token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`id`, `uid`, `email`, `password_hash`, `name`, `birth_date`, `id_card_number`, `address_card_number`, `mothers_name`, `major`, `verified`, `role`, `created_at`, `verify_token`) VALUES
(1, 'U001', 'student1@example.com', 'hashed_pw1', 'Kiss Anna', '2000-05-12', '123456AA', '654321BB', 'Nagy Mária', 'Programtervező informatikus', 1, 'user', '2024-06-01 10:00:00', NULL),
(2, 'U002', 'student2@example.com', 'hashed_pw2', 'Nagy Béla', '1999-11-23', '234567BB', '765432CC', 'Kovács Ilona', 'Gazdaságinformatikus', 1, 'user', '2024-06-02 11:00:00', NULL),
(3, 'U003', 'admin@example.com', 'hashed_pw3', 'Admin János', '1985-01-01', '345678CC', '876543DD', 'Szabó Erzsébet', 'Programtervező informatikus', 1, 'admin', '2024-06-03 12:00:00', NULL),
(5, 'gsg15d', 'cintanyer@gmail.com', 'kular1234', 'Lakatos Rómeó', '1886-06-11', '158763ER', '565357AS', 'Lakatos Kleopátra', 'Gazdaságinformatikus', 0, 'user', '2025-06-20 16:42:55', '96972355-d0e3-4488-a6e7-c26b207d153d'),
(6, 'Asdasd', 'betty.channel44@gmail.com', 'asdasd', 'Betty', '2025-06-17', '555555ne', '666666ne', 'Betti anyu', 'Gazdaságinformatikus', 0, 'user', '2025-06-20 22:49:29', 'a3a2c4aa-e03e-4b9b-a437-768f35dbad99'),
(17, 'HEZUGM', 'harkai.dominik0@gmail.com', '$2b$12$D89SEuP582pRUAUipyy/f.K1OZmqhJPq7BaeGF9tioApP3yUbYpOC', 'Harkai Dominik', '2001-11-11', '111111NE', '111111KE', 'Sári Erzsébet', 'Gazdaságinformatikus', 1, 'admin', '2025-06-23 13:00:23', NULL);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

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
