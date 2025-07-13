-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2025. Júl 13. 09:18
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
(30, 'Mérnökinformatikus', 26, 'Sziasztok', '2025-07-06 16:03:35', 0, NULL, NULL),
(36, 'Programtervező informatikus', 53, 'Sziasztok, van itt programtervezős?', '2025-07-06 20:59:20', 0, NULL, NULL),
(37, 'Gazdaságinformatikus', 17, 'Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?', '2025-07-06 21:42:21', 0, NULL, NULL),
(38, 'Mérnökinformatikus', 26, 'Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?Sziasztok, van itt programtervezős?', '2025-07-06 22:50:34', 0, NULL, NULL),
(47, 'Mérnökinformatikus', 26, 'Szia hogy vagy?', '2025-07-07 16:15:43', 0, NULL, NULL),
(67, 'Villamosmérnök', 55, 'Remélem az életben nem kapsz diplomát', '2025-07-11 19:09:38', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `courses`
--

DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `course_code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `courses`
--

INSERT INTO `courses` (`id`, `course_code`, `name`) VALUES
(64, 'MBNXK111E', 'Diszkrét matematika I. ea'),
(65, 'MBNXK111G', 'Diszkrét matematika I. gy'),
(66, 'MBNXK262E', 'A sztochasztika alapjai ea'),
(67, 'MBNXK262G', 'A sztochasztika alapjai gy'),
(68, 'MBNX363E', 'Alkalmazott statisztika ea'),
(69, 'MBNX363G', 'Alkalmazott statisztika lab'),
(70, 'MBNLK311E', 'Kalkulus I. ea'),
(71, 'MBNLK311G', 'Kalkulus I. gy'),
(72, 'IBK304e', 'Algoritmusok és adatszerkezetek I. ea'),
(73, 'IBK304g', 'Algoritmusok és adatszerkezetek I. gy'),
(74, 'IBK404e', 'Algoritmusok és adatszerkezetek II. ea'),
(75, 'IBK404g', 'Algoritmusok és adatszerkezetek II. gy'),
(76, 'IB371e', 'Számítástudomány alapjai ea'),
(77, 'IB371g', 'Számítástudomány alapjai gy'),
(78, 'GBN509E', 'EU alapismeretek ea'),
(79, 'GKBN04E', 'Mikroökonómia I. ea'),
(80, 'GKBN04S', 'Mikroökonómia I. gy'),
(81, 'GKBN05E', 'Makroökonómia I. ea'),
(82, 'GKBN06E', 'Menedzsment ea'),
(83, 'GKBN07E', 'Marketing I. ea'),
(84, 'GKBN08E', 'Számvitel alapjai ea'),
(85, 'GKBN08S', 'Számvitel alapjai gy'),
(86, 'GKBN09E', 'Vállalati pénzügyek I. ea'),
(87, 'GKBN09S', 'Vállalati pénzügyek I. gy'),
(88, 'GKBN13E', 'Termelésmenedzsment ea'),
(89, 'GKBN13S', 'Termelésmenedzsment gy'),
(90, 'GKBN15E', 'Pénzügyi alapismeretek ea'),
(91, 'IB1911e', 'Gazdasági informatika ea'),
(92, 'IB1911g', 'Gazdasági informatika lab'),
(93, 'GKBN41E', 'Költségkapcsolatok ea'),
(94, 'IB041e', 'Multimédia ea'),
(95, 'IB041g', 'Multimédia lab'),
(96, 'IB153e', 'Rendszerfejlesztés I. ea'),
(97, 'IB153l', 'Rendszerfejlesztés I. lab'),
(98, 'IBNa1017E', 'Szoftverfejlesztési folyamatok ea'),
(99, 'IBNa1017L', 'Szoftverfejlesztési folyamatok gy'),
(100, 'IBK154e', 'Mesterséges intelligencia I. ea'),
(101, 'IBK154g', 'Mesterséges intelligencia I. gy'),
(102, 'IB155e', 'Számítógépes grafika ea'),
(103, 'IB155l', 'Számítógépes grafika lab'),
(104, 'IB162E', 'Számítógép architektúrák ea'),
(105, 'IBK203e', 'Operációkutatás I. ea'),
(106, 'IBK203g', 'Operációkutatás I. gy'),
(107, 'IBNa1003E', 'Optimalizálási algoritmusok ea'),
(108, 'IBNa1003L', 'Optimalizálási algoritmusok gy'),
(109, 'IBK301e', 'Közelítő és szimbolikus számítások I. ea'),
(110, 'IBK301g', 'Közelítő és szimbolikus számítások I. lab'),
(111, 'IBNa1015E', 'Numerikus számítások ea'),
(112, 'IBNa1015L', 'Numerikus számítások gy'),
(113, 'IB302e', 'Programozás II. ea'),
(114, 'IB302g', 'Programozás II. gy'),
(115, 'IB309e', 'Döntési rendszerek ea'),
(116, 'IB309g', 'Döntési rendszerek gy'),
(117, 'IB402e', 'Operációs rendszerek ea'),
(118, 'IB402g', 'Operációs rendszerek lab'),
(119, 'IB405e', 'Programozási nyelvek ea'),
(120, 'IB405g', 'Programozási nyelvek lab'),
(121, 'IB407e', 'Számítógép-hálózatok ea'),
(122, 'IB414-2e', 'Alkalmazásfejlesztés I. ea'),
(123, 'IB414-2g', 'Alkalmazásfejlesztés I. lab'),
(124, 'IB570e', 'Alkalmazásfejlesztés II. ea'),
(125, 'IB570g', 'Alkalmazásfejlesztés II. lab'),
(126, 'IB501e', 'Adatbázisok ea'),
(127, 'IB501g', 'Adatbázisok lab'),
(128, 'IB611e', 'Rendszerfejlesztés II. ea'),
(129, 'IB611g', 'Rendszerfejlesztés II. gy'),
(130, 'IB714e', 'Web tervezés ea'),
(131, 'IB714g', 'Web tervezés lab'),
(132, 'IB716E', 'Információbiztonság ea'),
(133, 'IB716L', 'Információbiztonság lab'),
(134, 'IB104E', 'Programozás alapjai ea'),
(135, 'IB104L', 'Programozás alapjai lab'),
(136, 'IB204E-00001', 'Programozás I. ea'),
(137, 'IB204L', 'Programozás I. lab'),
(138, 'IBNa1001E', 'Programozás alapjai (ea)'),
(139, 'IBNa1001L', 'Programozás alapjai (gy)'),
(140, 'IBNa1002E', 'Objektumorientált programozás (ea)'),
(141, 'IBNa1002L', 'Objektumorientált programozás (gy)'),
(142, 'IBNa1016E', 'Gépközeli programozás (ea)'),
(143, 'IBNma1016L', 'Gépközeli programozás (ea)'),
(144, 'GBN417E', 'Környezetvédelem és minőségügyi alapismeretek ea'),
(145, 'IB372E', 'Logikai következtetési rendszerek (ea)'),
(146, 'IB372G', 'Logikai következtetési rendszerek (gy)'),
(147, 'IB407g', 'Számítógép-hálózatok lab'),
(148, 'IB152e', 'Adatbázis alapú rendszerek ea'),
(149, 'IB152l', 'Adatbázis alapú rendszerek lab'),
(150, 'IBNa1005E', 'Személyes és szociális készségek'),
(151, 'IBNa1004L', 'Egyetemi informatikai alapok'),
(152, 'IB_SK5e', 'Speciálkollégium (ea_gi) ea'),
(153, 'IB001e', 'Speciálkollégium 1. (ea) ea'),
(154, 'IB001giE', 'Speciálkollégium 1. (ea_gi) ea'),
(155, 'IB002e', 'Speciálkollégium 2. (ea+gy) ea'),
(156, 'IB002g', 'Speciálkollégium 2. (ea+gy) gy'),
(157, 'IB002giE', 'Speciálkollégium 2. (ea+lab_gi) ea'),
(158, 'IB002giL', 'Speciálkollégium 2. (ea+lab_gi) lab'),
(159, 'IB003e', 'Speciálkollégium 3. (ea+lab) ea'),
(160, 'IB003l', 'Speciálkollégium 3. (ea+lab) lab'),
(161, 'IB003giE', 'Speciálkollégium 3. (ea+lab_gi) ea'),
(162, 'IB003giL', 'Speciálkollégium 3. (ea+lab_gi) lab'),
(163, 'IB004e', 'Speciálkollégium 4. (ea+lab_2) ea'),
(164, 'IB004g', 'Speciálkollégium 4. (ea+lab_2) lab'),
(165, 'IB006L', 'Speciálkollégium 6. (lab) lab'),
(166, 'IB009L', 'Speciálkollégium 9. (lab) lab'),
(167, 'IB042e', 'Digitális képfeldolgozás ea'),
(168, 'IB042g', 'Digitális képfeldolgozás lab'),
(169, 'IB411e', 'Számítógéppel támogatott tervezés ea'),
(170, 'IBK615e', 'Hardware és software rendszerek verifikációja ea'),
(171, 'IBK615g', 'Hardware és software rendszerek verifikációja gy'),
(172, 'IB676e', 'Assembly programozás ea'),
(173, 'IB676l', 'Assembly programozás lab'),
(174, 'IB678e', 'Ipari hálózatok ea'),
(175, 'IB678l', 'Ipari hálózatok lab'),
(176, 'IB679e', 'Valós idejű programozás ea'),
(177, 'IB679l', 'Valós idejű programozás lab'),
(178, 'IBT001E', 'Nyíltforrású szoftverfejlesztés ea'),
(179, 'IBT002E', 'Szoftverminőség biztosítása a gyakorlati szoftverfejleszté'),
(180, 'IBT003E', 'Mobil hálózatok és alkalmazásaik ea'),
(181, 'IBT004E', 'Modell alapú szoftverfejlesztés mobil eszközökre ea'),
(182, 'IBT005E', 'SOA alapú skálázható alkalmazások fejlesztése ea'),
(183, 'IBT007E', 'Nyelv- és beszédfeldolgozás ea'),
(184, 'IBT008E', 'Számítógépes képelemzés ea'),
(185, 'IBT009E', 'Modellezés a Matlabban ea'),
(186, 'IBT010E', 'Bevezetés az intervallum-analízisbe ea'),
(187, 'IBT011E', 'Programelemzési módszerek a gyakorlatban ea'),
(188, 'IBT012E', 'Szoftver-visszatervezés és gyakorlati alkalmazásai ea'),
(189, 'IBT013E', 'ACM feladatmegoldás: technikák és trükkök ea'),
(190, 'MBNXK112E', 'Diszkrét matematika II. ea'),
(191, 'MBNXK112G', 'Diszkrét matematika II. gy'),
(192, 'MBNXK114E', 'Diszkrét matematika III. ea'),
(193, 'MBNXK114G', 'Diszkrét matematika III. gy'),
(194, 'MBNXK313E', 'Kalkulus II. ea'),
(195, 'MBNXK313G', 'Kalkulus II. gy'),
(196, 'IB470e', 'Mobil alkalmazásfejlesztés ea'),
(197, 'IB470g', 'Mobil alkalmazásfejlesztés lab'),
(198, 'IB471e', 'Webfejlesztési keretrendszerek ea'),
(199, 'IB471g', 'Webfejlesztési keretrendszerek lab'),
(200, 'IB472', 'Multiplatform alkalmazásfejlesztés C++-ban'),
(201, 'IBK004e', 'Szoftvertesztelés alapjai ea'),
(202, 'IBK004g', 'Szoftvertesztelés alapjai gy'),
(203, 'IB670e', 'Agilis szoftverfejlesztés ea'),
(204, 'IB670g', 'Agilis szoftverfejlesztés lab'),
(205, 'IB370e', 'Szkriptnyelvek ea'),
(206, 'IB370g', 'Szkriptnyelvek lab'),
(207, 'IB913E', 'Ipargazdaságtan ea'),
(208, 'IB000gi14G', 'Szakmai gyakorlat'),
(209, 'IB970', 'Szakdolgozat készítése 1. (gi)'),
(210, 'IB975', 'Szakdolgozat készítése 2. (gi)');

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
  `reset_token_expires` datetime DEFAULT NULL,
  `anonymous_name` varchar(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`id`, `uid`, `email`, `password_hash`, `name`, `birth_date`, `id_card_number`, `address_card_number`, `mothers_name`, `major`, `verified`, `role`, `created_at`, `verify_token`, `reset_token`, `reset_token_expires`, `anonymous_name`) VALUES
(1, 'U001', 'student1@example.com', 'hashed_pw1', 'Kiss Anna', '2000-05-12', '123456AA', '654321BB', 'Nagy Mária', 'Programtervező informatikus', 1, 'user', '2024-06-01 10:00:00', NULL, NULL, NULL, NULL),
(2, 'U002', 'student2@example.com', 'hashed_pw2', 'Nagy Béla', '1999-11-23', '234567BB', '765432CC', 'Kovács Ilona', 'Gazdaságinformatikus', 1, 'user', '2024-06-02 11:00:00', NULL, NULL, NULL, NULL),
(3, 'U003', 'admin@example.com', 'hashed_pw3', 'Admin János', '1985-01-01', '345678CC', '876543DD', 'Szabó Erzsébet', 'Programtervező informatikus', 1, 'admin', '2024-06-03 12:00:00', NULL, NULL, NULL, NULL),
(17, 'HEZUGM', 'harkai.dominik0@gmail.com', '$2b$12$9mrHAsD7an5.LNBOxcJ8T.uGXX7GCtd5sX0fNTCBDmFx0vsQtMxPS', 'Harkai Dominik', '2001-11-11', '111111NE', '111111KE', 'Sári Erzsébet', 'Gazdaságinformatikus', 1, 'admin', '2025-06-23 13:00:23', NULL, NULL, NULL, 'Anon#17245'),
(26, 'GBG15D', 'buskristof415@gmail.com', '$2b$12$LB44D11dm2AS9vviNAeJRuDi7OOFPIU8F2RJmmMOLU/z8RA1oZo8u', 'Bús Kristóf', '2010-06-11', '666666AD', '666666AD', 'Lakatos Máriané', 'Mérnökinformatikus', 1, 'user', '2025-06-24 22:42:08', NULL, 'c3222117-8329-4995-b740-114181a6545b', '2025-06-26 19:06:28', NULL),
(52, 'ASDFGH', 'harkai.dominik69@gmail.com', '$2b$12$V0INM6eJi6K7iRVwURKAPOnKmaJcN.QuhBUDp6SVrUgRHgdlc7vqq', 'Pityi Palkó', '2001-11-11', '123456EE', '123456EE', 'Csereeps Virág', 'Gazdaságinformatikus', 1, 'user', '2025-07-06 11:52:49', NULL, NULL, NULL, NULL),
(53, 'GBG16D', 'zsomle401@gmail.com', '$2b$12$uL0o.b9hHlo/XXnh6bMmveEw/oVEcFYIgCwoCrLlyDnSYCBQwlhKm', 'József Mária', '2003-06-04', '666666ZZ', '666666ZZ', 'Mária király', 'Programtervező informatikus', 1, 'user', '2025-07-06 22:58:11', NULL, NULL, NULL, NULL),
(55, 'KUR013', 'racikaw@gmail.com', '$2b$12$rxqdS4vcvvHOVs0zFxo5T.XuKHOXC7qDQxS8/7yUPIyM2TPxEwfia', 'Szeret Elek', '1999-06-11', '123456AB', '123456AB', 'Arika Corba', 'Villamosmérnök', 1, 'user', '2025-07-11 21:10:24', NULL, NULL, NULL, NULL),
(57, 'VALAKI', 'kiss.evelin2007@gmail.com', '$2b$12$lHg1SyXD.83Xq0I/kGyZ2ufX2Lkox7.Pf.CbziCyB9NxtiiAK7ivS', 'Valaki Vagyok', '2001-11-11', '112233AE', '112233AE', 'Nemtudom Ki Ez Te', 'Gazdaságinformatikus', 0, 'user', '2025-07-11 22:13:44', '83c72b35-ddd1-4845-847b-8a33e8cba88c', NULL, NULL, NULL);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_reply_to_message` (`reply_to_id`),
  ADD KEY `fk_chat_messages_user` (`user_id`);

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
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `anonymous_name` (`anonymous_name`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT a táblához `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=211;

--
-- AUTO_INCREMENT a táblához `progress`
--
ALTER TABLE `progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
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
