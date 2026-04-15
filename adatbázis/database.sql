-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Már 25. 20:37
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
(67, 'Villamosmérnök', 55, 'Remélem az életben nem kapsz diplomát', '2025-07-11 19:09:38', 0, NULL, NULL),
(68, 'Gazdaságinformatikus', 57, 'Kys', '2025-07-23 12:55:41', 1, 'Anon#57875', NULL),
(69, 'Gazdaságinformatikus', 60, 'Sziasztook!', '2025-10-17 22:11:34', 0, NULL, NULL),
(70, 'Gazdaságinformatikus', 17, 'Csumika', '2025-12-18 21:14:55', 0, NULL, 69),
(71, 'Gazdaságinformatikus', 17, 'Ez egy anonim üzenet', '2025-12-18 21:15:08', 1, 'Anon#17245', NULL),
(72, 'Gazdaságinformatikus', 17, '😅😅😅', '2025-12-18 21:16:06', 0, NULL, NULL),
(73, 'Gazdaságinformatikus', 57, 'asd', '2026-03-24 10:26:58', 1, 'Anon#57875', NULL),
(74, 'Gazdaságinformatikus', 57, 'asd', '2026-03-24 10:27:01', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `chat_reaction`
--

DROP TABLE IF EXISTS `chat_reaction`;
CREATE TABLE `chat_reaction` (
  `id` int(11) NOT NULL,
  `message_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `emoji` varchar(32) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `chat_reaction`
--

INSERT INTO `chat_reaction` (`id`, `message_id`, `user_id`, `emoji`, `created_at`) VALUES
(3, 1, 17, '🦊', '2025-07-02 19:29:17'),
(7, 1, 26, '🦊', '2025-07-03 14:21:38'),
(13, 30, 26, '😃', '2025-07-06 20:47:10'),
(19, 36, 53, '🦊', '2025-07-06 21:31:50'),
(25, 67, 17, '🤪', '2025-07-11 19:14:50'),
(26, 74, 57, '😂', '2026-03-24 10:27:09');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `courses`
--

DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `course_code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `name_en` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `courses`
--

INSERT INTO `courses` (`id`, `course_code`, `name`, `name_en`) VALUES
(64, 'MBNXK111E', 'Diszkrét matematika I. ea', 'Discrete Mathematics I. lecture'),
(65, 'MBNXK111G', 'Diszkrét matematika I. gy', 'Discrete Mathematics I. practice'),
(66, 'MBNXK262E', 'A sztochasztika alapjai ea', 'Basics of Stochastics lecture'),
(67, 'MBNXK262G', 'A sztochasztika alapjai gy', 'Basics of Stochastics practice'),
(68, 'MBNX363E', 'Alkalmazott statisztika ea', 'Applied Statistics lecture'),
(69, 'MBNX363G', 'Alkalmazott statisztika lab', 'Applied Statistics lab'),
(70, 'MBNLK311E', 'Kalkulus I. ea', 'Calculus I. lecture'),
(71, 'MBNLK311G', 'Kalkulus I. gy', 'Calculus I. practice'),
(72, 'IBK304e', 'Algoritmusok és adatszerkezetek I. ea', 'Algorithms and Data Structures I. lecture'),
(73, 'IBK304g', 'Algoritmusok és adatszerkezetek I. gy', 'Algorithms and Data Structures I. practice'),
(74, 'IBK404e', 'Algoritmusok és adatszerkezetek II. ea', 'Algorithms and Data Structures II. lecture'),
(75, 'IBK404g', 'Algoritmusok és adatszerkezetek II. gy', 'Algorithms and Data Structures II. practice'),
(76, 'IB371e', 'Számítástudomány alapjai ea', 'Foundations of Computer Science lecture'),
(77, 'IB371g', 'Számítástudomány alapjai gy', 'Foundations of Computer Science practice'),
(78, 'GBN509E', 'EU alapismeretek ea', 'EU Basics lecture'),
(79, 'GKBN04E', 'Mikroökonómia I. ea', 'Microeconomics I. lecture'),
(80, 'GKBN04S', 'Mikroökonómia I. gy', 'Microeconomics I. practice'),
(81, 'GKBN05E', 'Makroökonómia I. ea', 'Macroeconomics I. lecture'),
(82, 'GKBN06E', 'Menedzsment ea', 'Management lecture'),
(83, 'GKBN07E', 'Marketing I. ea', 'Marketing I. lecture'),
(84, 'GKBN08E', 'Számvitel alapjai ea', 'Basics of Accounting lecture'),
(85, 'GKBN08S', 'Számvitel alapjai gy', 'Basics of Accounting practice'),
(86, 'GKBN09E', 'Vállalati pénzügyek I. ea', 'Corporate Finance I. lecture'),
(87, 'GKBN09S', 'Vállalati pénzügyek I. gy', 'Corporate Finance I. practice'),
(88, 'GKBN13E', 'Termelésmenedzsment ea', 'Production Management lecture'),
(89, 'GKBN13S', 'Termelésmenedzsment gy', 'Production Management practice'),
(90, 'GKBN15E', 'Pénzügyi alapismeretek ea', 'Basics of Finance lecture'),
(91, 'IB1911e', 'Gazdasági informatika ea', 'Business Informatics lecture'),
(92, 'IB1911g', 'Gazdasági informatika lab', 'Business Informatics lab'),
(93, 'GKBN41E', 'Költségkapcsolatok ea', 'Cost Relations lecture'),
(94, 'IB041e', 'Multimédia ea', 'Multimedia lecture'),
(95, 'IB041g', 'Multimédia lab', 'Multimedia lab'),
(96, 'IB153e', 'Rendszerfejlesztés I. ea', 'System Development I. lecture'),
(97, 'IB153l', 'Rendszerfejlesztés I. lab', 'System Development I. lab'),
(98, 'IBNa1017E', 'Szoftverfejlesztési folyamatok ea', 'Software Development Processes lecture'),
(99, 'IBNa1017L', 'Szoftverfejlesztési folyamatok gy', 'Software Development Processes practice'),
(100, 'IBK154e', 'Mesterséges intelligencia I. ea', 'Artificial Intelligence I. lecture'),
(101, 'IBK154g', 'Mesterséges intelligencia I. gy', 'Artificial Intelligence I. practice'),
(102, 'IB155e', 'Számítógépes grafika ea', 'Computer Graphics lecture'),
(103, 'IB155l', 'Számítógépes grafika lab', 'Computer Graphics lab'),
(104, 'IB162E', 'Számítógép architektúrák ea', 'Computer Architectures lecture'),
(105, 'IBK203e', 'Operációkutatás I. ea', 'Operations Research I. lecture'),
(106, 'IBK203g', 'Operációkutatás I. gy', 'Operations Research I. practice'),
(107, 'IBNa1003E', 'Optimalizálási algoritmusok ea', 'Optimization Algorithms lecture'),
(108, 'IBNa1003L', 'Optimalizálási algoritmusok gy', 'Optimization Algorithms practice'),
(109, 'IBK301e', 'Közelítő és szimbolikus számítások I. ea', 'Approximate and Symbolic Computations I. lecture'),
(110, 'IBK301g', 'Közelítő és szimbolikus számítások I. lab', 'Approximate and Symbolic Computations I. lab'),
(111, 'IBNa1015E', 'Numerikus számítások ea', 'Numerical Computations lecture'),
(112, 'IBNa1015L', 'Numerikus számítások gy', 'Numerical Computations practice'),
(113, 'IB302e', 'Programozás II. ea', 'Programming II. lecture'),
(114, 'IB302g', 'Programozás II. gy', 'Programming II. practice'),
(115, 'IB309e', 'Döntési rendszerek ea', 'Decision Systems lecture'),
(116, 'IB309g', 'Döntési rendszerek gy', 'Decision Systems practice'),
(117, 'IB402e', 'Operációs rendszerek ea', 'Operating Systems lecture'),
(118, 'IB402g', 'Operációs rendszerek lab', 'Operating Systems lab'),
(119, 'IB405e', 'Programozási nyelvek ea', 'Programming Languages lecture'),
(120, 'IB405g', 'Programozási nyelvek lab', 'Programming Languages lab'),
(121, 'IB407e', 'Számítógép-hálózatok ea', 'Computer Networks lecture'),
(122, 'IB414-2e', 'Alkalmazásfejlesztés I. ea', 'Application Development I. lecture'),
(123, 'IB414-2g', 'Alkalmazásfejlesztés I. lab', 'Application Development I. lab'),
(124, 'IB570e', 'Alkalmazásfejlesztés II. ea', 'Application Development II. lecture'),
(125, 'IB570g', 'Alkalmazásfejlesztés II. lab', 'Application Development II. lab'),
(126, 'IB501e', 'Adatbázisok ea', 'Databases lecture'),
(127, 'IB501g', 'Adatbázisok lab', 'Databases lab'),
(128, 'IB611e', 'Rendszerfejlesztés II. ea', 'System Development II. lecture'),
(129, 'IB611g', 'Rendszerfejlesztés II. gy', 'System Development II. practice'),
(130, 'IB714e', 'Web tervezés ea', 'Web Design lecture'),
(131, 'IB714g', 'Web tervezés lab', 'Web Design lab'),
(132, 'IB716E', 'Információbiztonság ea', 'Information Security lecture'),
(133, 'IB716L', 'Információbiztonság lab', 'Information Security lab'),
(134, 'IB104E', 'Programozás alapjai ea', 'Basics of Programming lecture'),
(135, 'IB104L', 'Programozás alapjai lab', 'Basics of Programming lab'),
(136, 'IB204E-00001', 'Programozás I. ea', 'Programming I. lecture'),
(137, 'IB204L', 'Programozás I. lab', 'Programming I. lab'),
(138, 'IBNa1001E', 'Programozás alapjai (ea)', 'Basics of Programming (lecture)'),
(139, 'IBNa1001L', 'Programozás alapjai (gy)', 'Basics of Programming (practice)'),
(140, 'IBNa1002E', 'Objektumorientált programozás (ea)', 'Object-Oriented Programming (lecture)'),
(141, 'IBNa1002L', 'Objektumorientált programozás (gy)', 'Object-Oriented Programming (practice)'),
(142, 'IBNa1016E', 'Gépközeli programozás (ea)', 'Low-level Programming (lecture)'),
(143, 'IBNma1016L', 'Gépközeli programozás (ea)', 'Low-level Programming (lecture)'),
(144, 'GBN417E', 'Környezetvédelem és minőségügyi alapismeretek ea', 'Environmental Protection and Quality Management lecture'),
(145, 'IB372E', 'Logikai következtetési rendszerek (ea)', 'Logical Reasoning Systems (lecture)'),
(146, 'IB372G', 'Logikai következtetési rendszerek (gy)', 'Logical Reasoning Systems (practice)'),
(147, 'IB407g', 'Számítógép-hálózatok lab', 'Computer Networks lab'),
(148, 'IB152e', 'Adatbázis alapú rendszerek ea', 'Database-based Systems lecture'),
(149, 'IB152l', 'Adatbázis alapú rendszerek lab', 'Database-based Systems lab'),
(150, 'IBNa1005E', 'Személyes és szociális készségek', 'Personal and Social Skills'),
(151, 'IBNa1004L', 'Egyetemi informatikai alapok', 'University IT Basics'),
(152, 'IB_SK5e', 'Speciálkollégium (ea_gi) ea', 'Special College (ea_gi) lecture'),
(153, 'IB001e', 'Speciálkollégium 1. (ea) ea', 'Special College 1. (lecture) lecture'),
(154, 'IB001giE', 'Speciálkollégium 1. (ea_gi) ea', 'Special College 1. (ea_gi) lecture'),
(155, 'IB002e', 'Speciálkollégium 2. (ea+gy) ea', 'Special College 2. (lecture+practice) lecture'),
(156, 'IB002g', 'Speciálkollégium 2. (ea+gy) gy', 'Special College 2. (lecture+practice) practice'),
(157, 'IB002giE', 'Speciálkollégium 2. (ea+lab_gi) ea', 'Special College 2. (lecture+lab_gi) lecture'),
(158, 'IB002giL', 'Speciálkollégium 2. (ea+lab_gi) lab', 'Special College 2. (lecture+lab_gi) lab'),
(159, 'IB003e', 'Speciálkollégium 3. (ea+lab) ea', 'Special College 3. (lecture+lab) lecture'),
(160, 'IB003l', 'Speciálkollégium 3. (ea+lab) lab', 'Special College 3. (lecture+lab) lab'),
(161, 'IB003giE', 'Speciálkollégium 3. (ea+lab_gi) ea', 'Special College 3. (lecture+lab_gi) lecture'),
(162, 'IB003giL', 'Speciálkollégium 3. (ea+lab_gi) lab', 'Special College 3. (lecture+lab_gi) lab'),
(163, 'IB004e', 'Speciálkollégium 4. (ea+lab_2) ea', 'Special College 4. (lecture+lab_2) lecture'),
(164, 'IB004g', 'Speciálkollégium 4. (ea+lab_2) lab', 'Special College 4. (lecture+lab_2) lab'),
(165, 'IB006L', 'Speciálkollégium 6. (lab) lab', 'Special College 6. (lab) lab'),
(166, 'IB009L', 'Speciálkollégium 9. (lab) lab', 'Special College 9. (lab) lab'),
(167, 'IB042e', 'Digitális képfeldolgozás ea', 'Digital Image Processing lecture'),
(168, 'IB042g', 'Digitális képfeldolgozás lab', 'Digital Image Processing lab'),
(169, 'IB411e', 'Számítógéppel támogatott tervezés ea', 'Computer-Aided Design lecture'),
(170, 'IBK615e', 'Hardware és software rendszerek verifikációja ea', 'Hardware and Software Systems Verification lecture'),
(171, 'IBK615g', 'Hardware és software rendszerek verifikációja gy', 'Hardware and Software Systems Verification practice'),
(172, 'IB676e', 'Assembly programozás ea', 'Assembly Programming lecture'),
(173, 'IB676l', 'Assembly programozás lab', 'Assembly Programming lab'),
(174, 'IB678e', 'Ipari hálózatok ea', 'Industrial Networks lecture'),
(175, 'IB678l', 'Ipari hálózatok lab', 'Industrial Networks lab'),
(176, 'IB679e', 'Valós idejű programozás ea', 'Real-Time Programming lecture'),
(177, 'IB679l', 'Valós idejű programozás lab', 'Real-Time Programming lab'),
(178, 'IBT001E', 'Nyíltforrású szoftverfejlesztés ea', 'Open Source Software Development lecture'),
(179, 'IBT002E', 'Szoftverminőség biztosítása a gyakorlati szoftverfejleszté', 'Software Quality Assurance in Practical Software Development lecture'),
(180, 'IBT003E', 'Mobil hálózatok és alkalmazásaik ea', 'Mobile Networks and Applications lecture'),
(181, 'IBT004E', 'Modell alapú szoftverfejlesztés mobil eszközökre ea', 'Model-Based Software Development for Mobile Devices lecture'),
(182, 'IBT005E', 'SOA alapú skálázható alkalmazások fejlesztése ea', 'SOA-based Scalable Application Development lecture'),
(183, 'IBT007E', 'Nyelv- és beszédfeldolgozás ea', 'Language and Speech Processing lecture'),
(184, 'IBT008E', 'Számítógépes képelemzés ea', 'Computer Image Analysis lecture'),
(185, 'IBT009E', 'Modellezés a Matlabban ea', 'Modeling in Matlab lecture'),
(186, 'IBT010E', 'Bevezetés az intervallum-analízisbe ea', 'Introduction to Interval Analysis lecture'),
(187, 'IBT011E', 'Programelemzési módszerek a gyakorlatban ea', 'Program Analysis Methods in Practice lecture'),
(188, 'IBT012E', 'Szoftver-visszatervezés és gyakorlati alkalmazásai ea', 'Software Reverse Engineering and Practical Applications lecture'),
(189, 'IBT013E', 'ACM feladatmegoldás: technikák és trükkök ea', 'ACM Problem Solving: Techniques and Tricks lecture'),
(190, 'MBNXK112E', 'Diszkrét matematika II. ea', 'Discrete Mathematics II. lecture'),
(191, 'MBNXK112G', 'Diszkrét matematika II. gy', 'Discrete Mathematics II. practice'),
(192, 'MBNXK114E', 'Diszkrét matematika III. ea', 'Discrete Mathematics III. lecture'),
(193, 'MBNXK114G', 'Diszkrét matematika III. gy', 'Discrete Mathematics III. practice'),
(194, 'MBNXK313E', 'Kalkulus II. ea', 'Calculus II. lecture'),
(195, 'MBNXK313G', 'Kalkulus II. gy', 'Calculus II. practice'),
(196, 'IB470e', 'Mobil alkalmazásfejlesztés ea', 'Mobile Application Development lecture'),
(197, 'IB470g', 'Mobil alkalmazásfejlesztés lab', 'Mobile Application Development lab'),
(198, 'IB471e', 'Webfejlesztési keretrendszerek ea', 'Web Development Frameworks lecture'),
(199, 'IB471g', 'Webfejlesztési keretrendszerek lab', 'Web Development Frameworks lab'),
(200, 'IB472', 'Multiplatform alkalmazásfejlesztés C++-ban', 'Multiplatform Application Development in C++'),
(201, 'IBK004e', 'Szoftvertesztelés alapjai ea', 'Software Testing Basics lecture'),
(202, 'IBK004g', 'Szoftvertesztelés alapjai gy', 'Software Testing Basics practice'),
(203, 'IB670e', 'Agilis szoftverfejlesztés ea', 'Agile Software Development lecture'),
(204, 'IB670g', 'Agilis szoftverfejlesztés lab', 'Agile Software Development lab'),
(205, 'IB370e', 'Szkriptnyelvek ea', 'Scripting Languages lecture'),
(206, 'IB370g', 'Szkriptnyelvek lab', 'Scripting Languages lab'),
(207, 'IB913E', 'Ipargazdaságtan ea', 'Industrial Economics lecture'),
(208, 'IB000gi14G', 'Szakmai gyakorlat', 'Professional Practice'),
(209, 'IB970', 'Szakdolgozat készítése 1. (gi)', 'Thesis Preparation 1. (gi)'),
(210, 'IB975', 'Szakdolgozat készítése 2. (gi)', 'Thesis Preparation 2. (gi)'),
(211, 'PE_BASKET', 'Kosárlabda', 'Basketball'),
(212, 'PE_FOOTBALL', 'Labdarúgás', 'Football'),
(213, 'PE_VOLLEY', 'Röplabda', 'Volleyball'),
(214, 'PE_SWIM', 'Úszás', 'Swimming'),
(215, 'PE_TENNIS', 'Tenisz', 'Tennis'),
(216, 'PE_TABLETENNIS', 'Asztalitenisz', 'Table Tennis'),
(217, 'PE_RUN', 'Futás', 'Running'),
(218, 'PE_GYM', 'Tornatermi edzés', 'Gym Training'),
(219, 'PE_YOGA', 'Jóga', 'Yoga'),
(220, 'PE_BADMINTON', 'Tollaslabda', 'Badminton'),
(222, 'VALAMI', 'Valami', 'Something');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `course_equivalence`
--

DROP TABLE IF EXISTS `course_equivalence`;
CREATE TABLE `course_equivalence` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `equivalent_course_id` int(11) NOT NULL,
  `major_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `course_equivalence`
--

INSERT INTO `course_equivalence` (`id`, `course_id`, `equivalent_course_id`, `major_id`) VALUES
(1, 96, 98, 1),
(2, 97, 99, 1),
(3, 105, 107, 1),
(4, 106, 108, 1),
(5, 111, 109, 1),
(6, 112, 110, 1);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `course_major`
--

DROP TABLE IF EXISTS `course_major`;
CREATE TABLE `course_major` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `major_id` int(11) NOT NULL,
  `credit` int(11) NOT NULL DEFAULT 0,
  `semester` int(11) NOT NULL DEFAULT 0,
  `type` varchar(50) DEFAULT NULL,
  `subgroup` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `course_major`
--

INSERT INTO `course_major` (`id`, `course_id`, `major_id`, `credit`, `semester`, `type`, `subgroup`) VALUES
(4, 64, 1, 2, 1, 'required', NULL),
(5, 65, 1, 3, 1, 'required', NULL),
(6, 66, 1, 2, 2, 'required', NULL),
(7, 67, 1, 3, 2, 'required', NULL),
(8, 68, 1, 2, 3, 'required', NULL),
(9, 69, 1, 1, 3, 'required', NULL),
(10, 70, 1, 2, 1, 'required', NULL),
(11, 71, 1, 3, 1, 'required', NULL),
(12, 72, 1, 2, 3, 'required', NULL),
(13, 73, 1, 2, 3, 'required', NULL),
(14, 74, 1, 2, 4, 'required', NULL),
(15, 75, 1, 2, 4, 'required', NULL),
(16, 76, 1, 3, 5, 'required', NULL),
(17, 77, 1, 2, 5, 'required', NULL),
(18, 78, 1, 2, 1, 'required', NULL),
(19, 79, 1, 3, 2, 'required', NULL),
(20, 80, 1, 2, 2, 'required', NULL),
(21, 81, 1, 3, 3, 'required', NULL),
(22, 82, 1, 3, 2, 'required', NULL),
(23, 83, 1, 3, 7, 'required', NULL),
(24, 84, 1, 3, 4, 'required', NULL),
(25, 85, 1, 3, 4, 'required', NULL),
(26, 86, 1, 2, 6, 'required', NULL),
(27, 87, 1, 2, 6, 'required', NULL),
(28, 88, 1, 1, 5, 'required', NULL),
(29, 94, 1, 2, 5, 'elective', 'elective_core_credits'),
(30, 95, 1, 2, 5, 'elective', 'elective_core_credits'),
(31, 96, 1, 2, 5, 'elective', 'elective_core_credits'),
(32, 97, 1, 2, 5, 'elective', 'elective_core_credits'),
(33, 98, 1, 2, 2, 'elective', 'elective_core_credits'),
(34, 99, 1, 2, 2, 'elective', 'elective_core_credits'),
(35, 100, 1, 2, 5, 'elective', 'elective_core_credits'),
(36, 101, 1, 2, 5, 'elective', 'elective_core_credits'),
(37, 102, 1, 2, 5, 'elective', 'elective_core_credits'),
(38, 103, 1, 2, 5, 'elective', 'elective_core_credits'),
(39, 104, 1, 3, 1, 'elective', 'elective_core_credits'),
(40, 105, 1, 2, 2, 'elective', 'elective_core_credits'),
(41, 106, 1, 2, 2, 'elective', 'elective_core_credits'),
(42, 107, 1, 1, 1, 'elective', 'elective_core_credits'),
(43, 108, 1, 3, 1, 'elective', 'elective_core_credits'),
(44, 109, 1, 2, 3, 'elective', 'elective_core_credits'),
(45, 110, 1, 2, 3, 'elective', 'elective_core_credits'),
(46, 111, 1, 2, 2, 'elective', 'elective_core_credits'),
(47, 112, 1, 2, 2, 'elective', 'elective_core_credits'),
(48, 113, 1, 2, 3, 'elective', 'elective_core_credits'),
(49, 114, 1, 2, 3, 'elective', 'elective_core_credits'),
(50, 115, 1, 2, 3, 'elective', 'elective_core_credits'),
(51, 116, 1, 2, 3, 'elective', 'elective_core_credits'),
(52, 117, 1, 2, 2, 'elective', 'elective_core_credits'),
(53, 118, 1, 2, 2, 'elective', 'elective_core_credits'),
(54, 119, 1, 1, 4, 'elective', 'elective_core_credits'),
(55, 120, 1, 2, 4, 'elective', 'elective_core_credits'),
(56, 121, 1, 1, 1, 'elective', 'elective_core_credits'),
(57, 122, 1, 2, 4, 'elective', 'elective_core_credits'),
(58, 123, 1, 2, 4, 'elective', 'elective_core_credits'),
(59, 124, 1, 2, 5, 'elective', 'elective_core_credits'),
(60, 125, 1, 2, 5, 'elective', 'elective_core_credits'),
(61, 126, 1, 2, 3, 'elective', 'elective_core_credits'),
(62, 127, 1, 2, 3, 'elective', 'elective_core_credits'),
(63, 128, 1, 2, 6, 'elective', 'elective_core_credits'),
(64, 129, 1, 2, 6, 'elective', 'elective_core_credits'),
(65, 130, 1, 2, 4, 'elective', 'elective_core_credits'),
(66, 131, 1, 2, 4, 'elective', 'elective_core_credits'),
(67, 132, 1, 2, 6, 'elective', 'elective_core_credits'),
(68, 133, 1, 1, 6, 'elective', 'elective_core_credits'),
(69, 134, 1, 4, 1, 'elective', 'elective_info_credits'),
(70, 135, 1, 4, 1, 'elective', 'elective_info_credits'),
(71, 136, 1, 3, 2, 'elective', 'elective_info_credits'),
(72, 137, 1, 3, 2, 'elective', 'elective_info_credits'),
(73, 138, 1, 2, 1, 'elective', 'elective_info_credits'),
(74, 139, 1, 3, 1, 'elective', 'elective_info_credits'),
(75, 140, 1, 2, 2, 'elective', 'elective_info_credits'),
(76, 141, 1, 3, 2, 'elective', 'elective_info_credits'),
(77, 142, 1, 2, 0, 'elective', 'elective_info_credits'),
(78, 143, 1, 2, 0, 'elective', 'elective_info_credits'),
(79, 144, 1, 2, 0, 'elective', NULL),
(80, 145, 1, 3, 4, 'elective', NULL),
(81, 146, 1, 1, 4, 'elective', NULL),
(82, 147, 1, 2, 1, 'elective', NULL),
(83, 148, 1, 2, 4, 'elective', NULL),
(84, 149, 1, 3, 4, 'elective', NULL),
(85, 150, 1, 2, 1, 'elective', NULL),
(86, 151, 1, 2, 1, 'elective', NULL),
(87, 152, 1, 4, 0, 'elective', NULL),
(88, 153, 1, 3, 0, 'elective', NULL),
(89, 154, 1, 3, 0, 'elective', NULL),
(90, 155, 1, 4, 0, 'elective', NULL),
(91, 156, 1, 0, 0, 'elective', NULL),
(92, 157, 1, 5, 0, 'elective', NULL),
(93, 158, 1, 0, 0, 'elective', NULL),
(94, 159, 1, 4, 0, 'elective', NULL),
(95, 160, 1, 0, 0, 'elective', NULL),
(96, 161, 1, 3, 0, 'elective', NULL),
(97, 162, 1, 0, 0, 'elective', NULL),
(98, 163, 1, 5, 0, 'elective', NULL),
(99, 164, 1, 0, 0, 'elective', NULL),
(100, 165, 1, 4, 0, 'elective', NULL),
(101, 166, 1, 2, 0, 'elective', NULL),
(102, 167, 1, 2, 0, 'elective', NULL),
(103, 168, 1, 2, 0, 'elective', NULL),
(104, 169, 1, 3, 0, 'elective', NULL),
(105, 170, 1, 2, 0, 'elective', NULL),
(106, 171, 1, 2, 0, 'elective', NULL),
(107, 172, 1, 1, 0, 'elective', NULL),
(108, 173, 1, 1, 0, 'elective', NULL),
(109, 174, 1, 1, 0, 'elective', NULL),
(110, 175, 1, 2, 0, 'elective', NULL),
(111, 176, 1, 2, 0, 'elective', NULL),
(112, 177, 1, 2, 0, 'elective', NULL),
(113, 178, 1, 3, 0, 'elective', NULL),
(114, 179, 1, 3, 0, 'elective', NULL),
(115, 180, 1, 3, 0, 'elective', NULL),
(116, 181, 1, 3, 0, 'elective', NULL),
(117, 182, 1, 3, 0, 'elective', NULL),
(118, 183, 1, 3, 0, 'elective', NULL),
(119, 184, 1, 3, 0, 'elective', NULL),
(120, 185, 1, 3, 0, 'elective', NULL),
(121, 186, 1, 3, 0, 'elective', NULL),
(122, 187, 1, 3, 0, 'elective', NULL),
(123, 188, 1, 3, 0, 'elective', NULL),
(124, 189, 1, 3, 0, 'elective', NULL),
(125, 190, 1, 2, 0, 'elective', NULL),
(126, 191, 1, 3, 0, 'elective', NULL),
(127, 192, 1, 2, 0, 'elective', NULL),
(128, 193, 1, 3, 0, 'elective', NULL),
(129, 194, 1, 2, 0, 'elective', NULL),
(130, 195, 1, 3, 0, 'elective', NULL),
(131, 196, 1, 1, 0, 'elective', NULL),
(132, 197, 1, 2, 0, 'elective', NULL),
(133, 198, 1, 1, 0, 'elective', NULL),
(134, 199, 1, 2, 0, 'elective', NULL),
(135, 200, 1, 3, 0, 'elective', NULL),
(136, 201, 1, 2, 0, 'elective', NULL),
(137, 202, 1, 3, 0, 'elective', NULL),
(138, 203, 1, 1, 0, 'elective', NULL),
(139, 204, 1, 2, 0, 'elective', NULL),
(140, 205, 1, 2, 0, 'elective', NULL),
(141, 206, 1, 2, 0, 'elective', NULL),
(142, 207, 1, 3, 0, 'elective', NULL),
(143, 89, 1, 1, 5, 'required', NULL),
(144, 90, 1, 3, 5, 'required', NULL),
(145, 91, 1, 2, 5, 'required', NULL),
(146, 92, 1, 2, 5, 'required', NULL),
(147, 93, 1, 3, 0, 'required', NULL),
(148, 208, 1, 320, 0, 'required', 'practice_hours'),
(149, 209, 1, 5, 6, 'required', NULL),
(150, 210, 1, 10, 7, 'required', NULL),
(151, 211, 1, 0, 0, 'optional', 'pe'),
(152, 212, 1, 0, 0, 'optional', 'pe'),
(153, 213, 1, 0, 0, 'optional', 'pe'),
(154, 214, 1, 0, 0, 'optional', 'pe'),
(155, 215, 1, 0, 0, 'optional', 'pe'),
(156, 216, 1, 0, 0, 'optional', 'pe'),
(157, 217, 1, 0, 0, 'optional', 'pe'),
(158, 218, 1, 0, 0, 'optional', 'pe'),
(159, 219, 1, 0, 0, 'optional', 'pe'),
(160, 220, 1, 0, 0, 'optional', 'pe'),
(164, 222, 1, 2, 3, 'required', 'semmilyen'),
(165, 64, 2, 1, 1, 'required', 'lective_core_credit');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `majors`
--

DROP TABLE IF EXISTS `majors`;
CREATE TABLE `majors` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_en` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `majors`
--

INSERT INTO `majors` (`id`, `name`, `name_en`) VALUES
(1, 'Gazdaságinformatikus', 'Business Informatics'),
(2, 'Mérnökinformatikus', 'Computer Engineering'),
(3, 'Programtervező informatikus', 'Computer Science'),
(4, 'Villamosmérnök', 'Electrical Engineering'),
(5, 'Üzemmérnök-informatikus', 'Engineering Informatics');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `major_requirement_rules`
--

DROP TABLE IF EXISTS `major_requirement_rules`;
CREATE TABLE `major_requirement_rules` (
  `id` int(11) NOT NULL,
  `major_id` int(11) NOT NULL,
  `code` varchar(80) NOT NULL,
  `label_hu` varchar(255) NOT NULL,
  `label_en` varchar(255) DEFAULT NULL,
  `requirement_type` varchar(50) NOT NULL,
  `subgroup` varchar(80) DEFAULT NULL,
  `value_type` varchar(20) NOT NULL DEFAULT 'credits',
  `min_value` int(11) NOT NULL DEFAULT 0,
  `include_in_total` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `major_requirement_rules`
--

INSERT INTO `major_requirement_rules` (`id`, `major_id`, `code`, `label_hu`, `label_en`, `requirement_type`, `subgroup`, `value_type`, `min_value`, `include_in_total`) VALUES
(1, 1, 'required_credits', 'Kotelezo kreditek', 'Required credits', 'required', NULL, 'credits', 69, 1),
(2, 1, 'elective_core_credits', 'Kotelezoen valaszthato torzs', 'Core elective credits', 'elective', 'elective_core_credits', 'credits', 80, 1),
(3, 1, 'elective_info_credits', 'Informatikai torzs', 'IT core credits', 'elective', 'elective_info_credits', 'credits', 44, 1),
(4, 1, 'elective_non_core_credits', 'Kotelezoen valaszthato nem torzs', 'Non-core elective credits', 'elective', '__NULL__', 'credits', 36, 1),
(5, 1, 'optional_credits', 'Szabadon valaszthato kreditek', 'Optional credits', 'optional', NULL, 'credits', 10, 1),
(6, 1, 'pe_semesters', 'Testneveles felevek', 'PE semesters', 'pe', 'pe', 'count', 2, 0),
(7, 1, 'practice_hours', 'Szakmai gyakorlat orak', 'Practice hours', 'required', 'practice_hours', 'hours', 320, 0),
(8, 5, 'required_credits', 'Kötelező kreditek', 'Elective Creditss', 'elective', NULL, 'credits', 80, 1),
(9, 4, 'required_credits', 'Kötelező kreditek', 'Required credits', 'required', NULL, 'credits', 100, 1);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `progress`
--

DROP TABLE IF EXISTS `progress`;
CREATE TABLE `progress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `completed_semester` int(11) NOT NULL DEFAULT 0,
  `status` enum('completed','in_progress','pending') NOT NULL,
  `points` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `progress`
--

INSERT INTO `progress` (`id`, `user_id`, `course_id`, `completed_semester`, `status`, `points`) VALUES
(252, 60, 204, 0, 'completed', 5),
(253, 60, 74, 3, 'completed', 6),
(254, 57, 172, 2, 'completed', 3),
(255, 57, 173, 2, 'completed', 3),
(256, 57, 142, 1, 'completed', 3),
(257, 57, 143, 1, 'completed', 3),
(258, 57, 211, 1, 'completed', 3),
(259, 57, 208, 100, 'in_progress', 2),
(260, 57, 134, 1, 'completed', 5),
(261, 57, 135, 1, 'completed', 5),
(262, 57, 104, 1, 'completed', 5),
(263, 57, 121, 1, 'completed', 5),
(264, 57, 147, 1, 'completed', 5),
(265, 57, 138, 2, 'completed', 3),
(266, 57, 139, 2, 'completed', 3),
(267, 57, 107, 2, 'completed', 3),
(268, 57, 108, 2, 'completed', 3),
(269, 57, 78, 2, 'completed', 3),
(270, 57, 70, 1, 'completed', 5),
(271, 57, 71, 1, 'completed', 5),
(272, 57, 64, 1, 'completed', 5),
(273, 57, 65, 1, 'completed', 5),
(274, 57, 136, 2, 'in_progress', 2),
(275, 57, 137, 2, 'in_progress', 2),
(276, 57, 117, 2, 'in_progress', 2),
(277, 57, 118, 2, 'in_progress', 2),
(278, 57, 79, 1, 'completed', 6),
(279, 57, 80, 1, 'completed', 6),
(280, 57, 82, 2, 'in_progress', 2),
(281, 57, 66, 2, 'in_progress', 2),
(282, 57, 67, 2, 'in_progress', 2),
(283, 57, 115, 1, 'completed', 6),
(284, 57, 116, 1, 'completed', 6),
(285, 57, 74, 2, 'completed', 6),
(286, 57, 75, 2, 'completed', 6),
(287, 57, 128, 2, 'in_progress', 2),
(288, 57, 129, 2, 'in_progress', 2),
(289, 57, 209, 6, 'completed', 5),
(290, 17, 93, 1, 'completed', 3),
(291, 17, 135, 1, 'in_progress', 2),
(292, 17, 104, 1, 'in_progress', 2),
(293, 17, 121, 1, 'in_progress', 2),
(294, 17, 147, 1, 'in_progress', 2),
(295, 17, 138, 1, 'in_progress', 2),
(296, 17, 139, 1, 'in_progress', 2),
(297, 17, 107, 1, 'in_progress', 2),
(298, 17, 108, 1, 'in_progress', 2),
(299, 17, 151, 1, 'in_progress', 2),
(300, 17, 150, 1, 'in_progress', 2),
(301, 17, 126, 3, 'completed', 5),
(302, 17, 127, 1, 'completed', 6);

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
  `major` varchar(255) NOT NULL,
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
(17, 'HEZUGM', 'harkai.dominik0@gmail.com', '$2b$12$bUnc8Yf3LS.Mk72TUimTDuRoNDbmgRmPh4nLloC5scMFgS65NT17O', 'Harkai Dominik', '2001-11-11', '111111NE', '111111KE', 'Sári Erzsébet', 'Gazdaságinformatikus', 1, 'admin', '2025-06-23 13:00:23', NULL, NULL, NULL, 'Anon#17245'),
(26, 'GBG15D', 'buskristof415@gmail.com', '$2b$12$LB44D11dm2AS9vviNAeJRuDi7OOFPIU8F2RJmmMOLU/z8RA1oZo8u', 'Bús Kristóf', '2010-06-11', '666666AD', '666666AD', 'Lakatos Máriané', 'Mérnökinformatikus', 1, 'user', '2025-06-24 22:42:08', NULL, 'c3222117-8329-4995-b740-114181a6545b', '2025-06-26 19:06:28', NULL),
(52, 'ASDFGH', 'harkai.dominik69@gmail.com', '$2b$12$V0INM6eJi6K7iRVwURKAPOnKmaJcN.QuhBUDp6SVrUgRHgdlc7vqq', 'Pityi Palkó', '2001-11-11', '123456EE', '123456EE', 'Csereeps Virág', 'Gazdaságinformatikus', 1, 'user', '2025-07-06 11:52:49', NULL, NULL, NULL, NULL),
(53, 'GBG16D', 'zsomle401@gmail.com', '$2b$12$uL0o.b9hHlo/XXnh6bMmveEw/oVEcFYIgCwoCrLlyDnSYCBQwlhKm', 'József Mária', '2003-06-04', '666666ZZ', '666666ZZ', 'Mária király', 'Programtervező informatikus', 1, 'user', '2025-07-06 22:58:11', NULL, NULL, NULL, NULL),
(55, 'KUR013', 'racikaw@gmail.com', '$2b$12$rxqdS4vcvvHOVs0zFxo5T.XuKHOXC7qDQxS8/7yUPIyM2TPxEwfia', 'Szeret Elek', '1999-06-11', '123456AB', '123456AB', 'Arika Corba', 'Villamosmérnök', 1, 'user', '2025-07-11 21:10:24', NULL, NULL, NULL, NULL),
(57, 'VALAKI', 'kiss.evelin2007@gmail.com', '$2b$12$lHg1SyXD.83Xq0I/kGyZ2ufX2Lkox7.Pf.CbziCyB9NxtiiAK7ivS', 'Valaki Vagyokk', '2001-11-11', '112233AE', '112233AE', 'Nemtudom Ki Ez Te', 'Gazdaságinformatikus', 1, 'user', '2025-07-11 22:13:44', '83c72b35-ddd1-4845-847b-8a33e8cba88c', NULL, NULL, 'Anon#57875'),
(60, 'ASDQWE', 'azulref2@gmail.com', '$2b$12$ES0MpqwrIw4SNMvhWl2FsOvgITbJN.BhZq.FaCQEJfE3WrXnl1wgi', 'Kiss Ágota', '2002-06-06', '456789TE', '216546ZE', 'Valami Anyuka', 'Gazdaságinformatikus', 1, 'user', '2025-10-18 00:10:19', NULL, NULL, NULL, NULL),
(62, 'U062', 'user62@example.com', 'hashed_pw62', 'Nagy Bence', '1999-07-01', 'ID062345', 'AC062345', 'Nagy Mária', 'Gazdaságinformatikus', 1, 'user', '2024-02-05 11:20:00', NULL, NULL, NULL, NULL),
(63, 'U063', 'admin63@example.com', 'hashed_pw63', 'Szabó Csilla', '1988-03-22', 'ID063456', 'AC063456', 'Szabóné Ilona', 'Gazdaságinformatikus', 1, 'admin', '2024-03-12 14:30:00', NULL, NULL, NULL, NULL),
(64, 'U064', 'user64@example.com', 'hashed_pw64', 'Tóth Dániel', '2001-11-05', 'ID064567', 'AC064567', 'Tóthné Erika', 'Mérnökinformatikus', 1, 'user', '2024-03-20 08:45:00', NULL, NULL, NULL, NULL),
(65, 'U065', 'user65@example.com', 'hashed_pw65', 'Horváth Eszter', '2000-06-18', 'ID065678', 'AC065678', 'Horváthné Katalin', 'Programtervező informatikus', 1, 'user', '2024-04-01 10:00:00', NULL, NULL, NULL, NULL),
(66, 'U066', 'user66@example.com', 'hashed_pw66', 'Balogh Fanni', '2002-09-09', 'ID066789', 'AC066789', 'Baloghnė Zsuzsa', 'Villamosmérnök', 0, 'user', '2024-04-15 12:10:00', NULL, NULL, NULL, NULL),
(67, 'U067', 'user67@example.com', 'hashed_pw67', 'Kiss Gergő', '1998-12-30', 'ID067890', 'AC067890', 'Kiss Mária', 'Üzemmérnök-informatikus', 1, 'user', '2024-05-02 09:05:00', NULL, NULL, NULL, NULL),
(68, 'U068', 'user68@example.com', 'hashed_pw68', 'Molnár Hanna', '2001-01-17', 'ID068901', 'AC068901', 'Molnárné Anikó', 'Gazdaságinformatikus', 1, 'user', '2024-05-18 16:25:00', NULL, NULL, NULL, NULL),
(69, 'U069', 'user69@example.com', 'hashed_pw69', 'Farkas István', '1997-04-11', 'ID069012', 'AC069012', 'Farkasnė Ágnes', 'Mérnökinformatikus', 1, 'user', '2024-06-01 13:40:00', NULL, NULL, NULL, NULL),
(70, 'U070', 'user70@example.com', 'hashed_pw70', 'Varga Júlia', '2000-08-23', 'ID070123', 'AC070123', 'Vargáné Olga', 'Programtervező informatikus', 0, 'user', '2024-06-10 11:11:00', NULL, NULL, NULL, NULL),
(71, 'U071', 'user71@example.com', 'hashed_pw71', 'Papp Katalin', '1999-05-05', 'ID071234', 'AC071234', 'Pappné Mária', 'Villamosmérnök', 1, 'user', '2024-06-20 09:00:00', NULL, NULL, NULL, NULL),
(72, 'U072', 'user72@example.com', 'hashed_pw72', 'Kerekes Levente', '2001-10-30', 'ID072345', 'AC072345', 'Kerekesné Ilona', 'Gazdaságinformatikus', 1, 'user', '2024-07-01 17:22:00', NULL, NULL, NULL, NULL),
(73, 'U073', 'user73@example.com', 'hashed_pw73', 'Németh Réka', '2002-02-14', 'ID073456', 'AC073456', 'Némethné Zsuzsa', 'Programtervező informatikus', 1, 'user', '2024-07-10 08:30:00', NULL, NULL, NULL, NULL),
(74, 'U074', 'user74@example.com', 'hashed_pw74', 'Sipos Tamás', '1996-09-12', 'ID074567', 'AC074567', 'Siposné Éva', 'Üzemmérnök-informatikus', 1, 'user', '2024-07-20 12:00:00', NULL, NULL, NULL, NULL),
(75, 'U075', 'user75@example.com', 'hashed_pw75', 'Lakatos Réka', '2000-03-03', 'ID075678', 'AC075678', 'Lakatosné Anna', 'Mérnökinformatikus', 0, 'user', '2024-08-05 15:15:00', NULL, NULL, NULL, NULL),
(76, 'U076', 'user76@example.com', 'hashed_pw76', 'Kovács Roland', '1998-07-07', 'ID076789', 'AC076789', 'Kovácsné Erika', 'Gazdaságinformatikus', 1, 'user', '2024-08-12 10:50:00', NULL, NULL, NULL, NULL),
(77, 'U077', 'admin77@example.com', 'hashed_pw77', 'Fekete Zoltán', '1989-11-11', 'ID077890', 'AC077890', 'Feketéné Ilona', 'Villamosmérnök', 1, 'admin', '2024-08-30 09:09:00', NULL, NULL, NULL, NULL),
(78, 'U078', 'user78@example.com', 'hashed_pw78', 'Rácz Dóra', '2001-12-01', 'ID078901', 'AC078901', 'Ráczné Katalin', 'Programtervező informatikus', 1, 'user', '2024-09-05 14:00:00', NULL, NULL, NULL, NULL),
(79, 'U079', 'user79@example.com', 'hashed_pw79', 'Péter Gábor', '1997-01-20', 'ID079012', 'AC079012', 'Péterné Anna', 'Mérnökinformatikus', 1, 'user', '2024-09-15 18:30:00', NULL, NULL, NULL, NULL),
(80, 'U080', 'user80@example.com', 'hashed_pw80', 'Lukács Emese', '2000-04-09', 'ID080123', 'AC080123', 'Lukácsné Erzsébet', 'Gazdaságinformatikus', 0, 'user', '2024-09-25 07:45:00', NULL, NULL, NULL, NULL),
(81, 'U081', 'user81@example.com', 'hashed_pw81', 'Petőfi Máté', '1998-06-06', 'ID081234', 'AC081234', 'Petőfiné Mária', 'Üzemmérnök-informatikus', 1, 'user', '2024-10-01 13:13:00', NULL, NULL, NULL, NULL),
(82, 'U082', 'user82@example.com', 'hashed_pw82', 'Soltész Noémi', '2002-08-18', 'ID082345', 'AC082345', 'Soltészné Erika', 'Programtervező informatikus', 1, 'user', '2024-10-10 09:40:00', NULL, NULL, NULL, NULL),
(83, 'U083', 'user83@example.com', 'hashed_pw83', 'Csomor Lajos', '1995-05-25', 'ID083456', 'AC083456', 'Csomorné Ilona', 'Villamosmérnök', 1, 'user', '2024-10-18 16:00:00', NULL, NULL, NULL, NULL),
(84, 'U084', 'user84@example.com', 'hashed_pw84', 'Bíró Ágnes', '1999-09-29', 'ID084567', 'AC084567', 'Bíróné Zsuzsa', 'Gazdaságinformatikus', 1, 'user', '2024-11-01 12:00:00', NULL, NULL, NULL, NULL),
(85, 'U085', 'admin85@example.com', 'hashed_pw85', 'Székely Levente', '1987-02-02', 'ID085678', 'AC085678', 'Székelyné Mária', 'Mérnökinformatikus', 1, 'admin', '2024-11-15 08:20:00', NULL, NULL, NULL, NULL),
(86, 'U086', 'user86@example.com', 'hashed_pw86', 'Máté Zsófia', '2001-03-27', 'ID086789', 'AC086789', 'Máténé Kata', 'Programtervező informatikus', 1, 'user', '2024-11-25 11:30:00', NULL, NULL, NULL, NULL),
(87, 'U087', 'user87@example.com', 'hashed_pw87', 'Vámosi Péter', '1996-10-10', 'ID087890', 'AC087890', 'Vámosiné Éva', 'Üzemmérnök-informatikus', 0, 'user', '2024-12-01 15:45:00', NULL, NULL, NULL, NULL),
(88, 'U088', 'user88@example.com', 'hashed_pw88', 'Kovácsné Rita', '1995-12-12', 'ID088901', 'AC088901', 'Némethné Ilona', 'Villamosmérnök', 1, 'user', '2024-12-10 09:55:00', NULL, NULL, NULL, NULL),
(89, 'U089', 'user89@example.com', 'hashed_pw89', 'Bárány Roland', '2000-01-01', 'ID089012', 'AC089012', 'Bárányné Mária', 'Gazdaságinformatikus', 1, 'user', '2024-12-20 10:10:00', NULL, NULL, NULL, NULL),
(90, 'U090', 'user90@example.com', 'hashed_pw90', 'Koltai Ivett', '2002-07-07', 'ID090123', 'AC090123', 'Koltainé Zsuzsa', 'Programtervező informatikus', 1, 'user', '2025-01-05 14:14:00', NULL, NULL, NULL, NULL),
(91, 'U091', 'user91@example.com', 'hashed_pw91', 'Szalai Márk', '1999-11-11', 'ID091234', 'AC091234', 'Szalainé Ágnes', 'Mérnökinformatikus', 1, 'user', '2025-01-20 08:08:00', NULL, NULL, NULL, NULL),
(92, 'U092', 'user92@example.com', 'hashed_pw92', 'Mészáros Eszter', '2000-05-30', 'ID092345', 'AC092345', 'Mészárosné Anna', 'Villamosmérnök', 1, 'user', '2025-02-01 12:00:00', NULL, NULL, NULL, NULL),
(93, 'U093', 'user93@example.com', 'hashed_pw93', 'Bognár Zoltán', '1998-04-04', 'ID093456', 'AC093456', 'Bognárné Ilona', 'Gazdaságinformatikus', 0, 'user', '2025-02-14 09:09:00', NULL, NULL, NULL, NULL),
(94, 'U094', 'user94@example.com', 'hashed_pw94', 'Barta Kinga', '2001-06-06', 'ID094567', 'AC094567', 'Bartáné Katalin', 'Programtervező informatikus', 1, 'user', '2025-02-28 16:16:00', NULL, NULL, NULL, NULL),
(95, 'U095', 'user95@example.com', 'hashed_pw95', 'Takács Leila', '2000-10-10', 'ID095678', 'AC095678', 'Takácsné Mária', 'Üzemmérnök-informatikus', 1, 'user', '2025-03-10 10:00:00', NULL, NULL, NULL, NULL),
(96, 'U096', 'user96@example.com', 'hashed_pw96', 'Király Norbert', '1997-08-08', 'ID096789', 'AC096789', 'Királynė Zsuzsa', 'Mérnökinformatikus', 1, 'user', '2025-03-20 11:11:00', NULL, NULL, NULL, NULL),
(97, 'U097', 'user97@example.com', 'hashed_pw97', 'Fazekas Dóra', '2002-01-15', 'ID097890', 'AC097890', 'Fazekasné Éva', 'Gazdaságinformatikus', 1, 'user', '2025-04-01 09:30:00', NULL, NULL, NULL, NULL),
(98, 'U098', 'user98@example.com', 'hashed_pw98', 'Gulyás Márta', '1996-03-03', 'ID098901', 'AC098901', 'Gulyásné Ágnes', 'Programtervező informatikus', 1, 'user', '2025-04-12 13:13:00', NULL, NULL, NULL, NULL),
(99, 'U099', 'user99@example.com', 'hashed_pw99', 'Vincze Péter', '1998-09-09', 'ID099012', 'AC099012', 'Vinczené Mária', 'Villamosmérnök', 0, 'user', '2025-04-20 15:15:00', NULL, NULL, NULL, NULL),
(100, 'U100', 'user100@example.com', 'hashed_pw100', 'Rudolf Anita', '2000-12-12', 'ID100123', 'AC100123', 'Rudolfné Ilona', 'Mérnökinformatikus', 1, 'user', '2025-05-01 08:08:00', NULL, NULL, NULL, NULL),
(101, 'U101', 'user101@example.com', 'hashed_pw101', 'Hajdu Olivér', '1999-02-02', 'ID101234', 'AC101234', 'Hajduné Katalin', 'Gazdaságinformatikus', 1, 'user', '2025-05-10 10:10:00', NULL, NULL, NULL, NULL),
(102, 'U102', 'user102@example.com', 'hashed_pw102', 'Szalay Ildikó', '2001-07-07', 'ID102345', 'AC102345', 'Szalaynė Erzsébet', 'Programtervező informatikus', 1, 'user', '2025-05-18 12:00:00', NULL, NULL, NULL, NULL),
(103, 'U103', 'user103@example.com', 'hashed_pw103', 'Vörös Tamás', '1997-11-11', 'ID103456', 'AC103456', 'Vörösné Anna', 'Mérnökinformatikus', 1, 'user', '2025-05-25 14:14:00', NULL, NULL, NULL, NULL),
(104, 'U104', 'user104@example.com', 'hashed_pw104', 'Szőke Petra', '2000-08-08', 'ID104567', 'AC104567', 'Szőkené Zsuzsa', 'Villamosmérnök', 1, 'user', '2025-06-01 09:00:00', NULL, NULL, NULL, NULL),
(105, 'U105', 'user105@example.com', 'hashed_pw105', 'Takács Márton', '1996-05-05', 'ID105678', 'AC105678', 'Takácsné Éva', 'Gazdaságinformatikus', 0, 'user', '2025-06-08 11:11:00', NULL, NULL, NULL, NULL),
(106, 'U106', 'user106@example.com', 'hashed_pw106', 'Orbán Kincső', '2002-10-10', 'ID106789', 'AC106789', 'Orbánné Mária', 'Programtervező informatikus', 1, 'user', '2025-06-15 16:16:00', NULL, NULL, NULL, NULL),
(107, 'U107', 'user107@example.com', 'hashed_pw107', 'Illés Bence', '1998-01-21', 'ID107890', 'AC107890', 'Illésné Ilona', 'Mérnökinformatikus', 1, 'user', '2025-06-20 09:09:00', NULL, NULL, NULL, NULL),
(108, 'U108', 'user108@example.com', 'hashed_pw108', 'Herczeg Réka', '2001-04-04', 'ID108901', 'AC108901', 'Herczegné Katalin', 'Villamosmérnök', 1, 'user', '2025-06-25 12:12:00', NULL, NULL, NULL, NULL),
(109, 'U109', 'user109@example.com', 'hashed_pw109', 'Bálint Ákos', '1999-09-09', 'ID109012', 'AC109012', 'Bálintné Éva', 'Gazdaságinformatikus', 1, 'user', '2025-07-01 10:10:00', NULL, NULL, NULL, NULL),
(110, 'U110', 'user110@example.com', 'hashed_pw110', 'Gál Dóra', '2000-03-03', 'ID110123', 'AC110123', 'Gálné Zsuzsa', 'Programtervező informatikus', 1, 'user', '2025-07-05 14:00:00', NULL, NULL, NULL, NULL),
(111, 'U111', 'user111@example.com', 'hashed_pw111', 'Sári Roland', '1997-06-06', 'ID111234', 'AC111234', 'Sáriné Anna', 'Mérnökinformatikus', 1, 'user', '2025-07-10 09:00:00', NULL, NULL, NULL, NULL),
(112, 'U112', 'user112@example.com', 'hashed_pw112', 'Bakos Helga', '1998-12-12', 'ID112345', 'AC112345', 'Bakosné Éva', 'Villamosmérnök', 0, 'user', '2025-07-12 11:11:00', NULL, NULL, NULL, NULL),
(113, 'U113', 'user113@example.com', 'hashed_pw113', 'Fülöp Tamara', '2001-02-02', 'ID113456', 'AC113456', 'Fülöpné Mária', 'Gazdaságinformatikus', 1, 'user', '2025-07-15 13:13:00', NULL, NULL, NULL, NULL),
(114, 'U114', 'user114@example.com', 'hashed_pw114', 'Major Levente', '1996-08-08', 'ID114567', 'AC114567', 'Majoré Katalin', 'Programtervező informatikus', 1, 'user', '2025-07-18 15:15:00', NULL, NULL, NULL, NULL),
(115, 'U115', 'user115@example.com', 'hashed_pw115', 'Simon Edit', '1999-01-01', 'ID115678', 'AC115678', 'Simoné Ilona', 'Mérnökinformatikus', 1, 'user', '2025-07-20 10:10:00', NULL, NULL, NULL, NULL),
(116, 'U116', 'user116@example.com', 'hashed_pw116', 'Bíró Tamás', '2000-11-11', 'ID116789', 'AC116789', 'Bíróné Erzsébet', 'Gazdaságinformatikus', 1, 'user', '2025-07-22 09:45:00', NULL, NULL, NULL, NULL),
(117, 'U117', 'user117@example.com', 'hashed_pw117', 'Dudás Kata', '2002-05-05', 'ID117890', 'AC117890', 'Dudásné Zsuzsa', 'Programtervező informatikus', 0, 'user', '2025-07-24 11:11:00', NULL, NULL, NULL, NULL),
(118, 'U118', 'user118@example.com', 'hashed_pw118', 'Vári Gergely', '1998-10-10', 'ID118901', 'AC118901', 'Váriné Mária', 'Villamosmérnök', 1, 'user', '2025-07-26 08:08:00', NULL, NULL, NULL, NULL),
(119, 'U119', 'user119@example.com', 'hashed_pw119', 'Kovács Lilla', '2001-09-09', 'ID119012', 'AC119012', 'Kovácsné Anikó', 'Mérnökinformatikus', 1, 'user', '2025-07-28 14:14:00', NULL, NULL, NULL, NULL),
(120, 'U120', 'user120@example.com', 'hashed_pw120', 'Nagy Róbert', '1997-03-03', 'ID120123', 'AC120123', 'Nagyné Ilona', 'Gazdaságinformatikus', 1, 'user', '2025-07-30 12:00:00', NULL, NULL, NULL, NULL),
(121, 'U121', 'user121@example.com', 'hashed_pw121', 'Péterfy Zsóka', '2000-06-06', 'ID121234', 'AC121234', 'Péterfyné Katalin', 'Programtervező informatikus', 1, 'user', '2025-08-01 09:09:00', NULL, NULL, NULL, NULL),
(122, 'U122', 'user122@example.com', 'hashed_pw122', 'Gulyás Tamás', '1999-12-12', 'ID122345', 'AC122345', 'Gulyásné Éva', 'Villamosmérnök', 1, 'user', '2025-08-03 10:10:00', NULL, NULL, NULL, NULL),
(123, 'U123', 'user123@example.com', 'hashed_pw123', 'Réti Noémi', '2001-01-10', 'ID123456', 'AC123456', 'Rétiné Mária', 'Mérnökinformatikus', 1, 'user', '2025-08-05 13:13:00', NULL, NULL, NULL, NULL),
(124, 'U124', 'user124@example.com', 'hashed_pw124', 'Császár Bence', '1996-04-04', 'ID124567', 'AC124567', 'Császárné Ilona', 'Gazdaságinformatikus', 1, 'user', '2025-08-07 11:11:00', NULL, NULL, NULL, NULL),
(125, 'U125', 'user125@example.com', 'hashed_pw125', 'Füredi Kata', '2002-02-20', 'ID125678', 'AC125678', 'Fürediné Zsuzsa', 'Programtervező informatikus', 1, 'user', '2025-08-10 09:00:00', NULL, NULL, NULL, NULL),
(126, 'U126', 'user126@example.com', 'hashed_pw126', 'Szántó Lajos', '1998-07-17', 'ID126789', 'AC126789', 'Szántóné Éva', 'Üzemmérnök-informatikus', 0, 'user', '2025-08-12 15:15:00', NULL, NULL, NULL, NULL),
(127, 'U127', 'user127@example.com', 'hashed_pw127', 'Kovács Enikő', '2000-09-09', 'ID127890', 'AC127890', 'Kovácsné Anna', 'Gazdaságinformatikus', 1, 'user', '2025-08-15 10:10:00', NULL, NULL, NULL, NULL),
(128, 'U128', 'user128@example.com', 'hashed_pw128', 'Pál Gergő', '1997-11-03', 'ID128901', 'AC128901', 'Pálné Katalin', 'Mérnökinformatikus', 1, 'user', '2025-08-18 09:09:00', NULL, NULL, NULL, NULL),
(129, 'U129', 'user129@example.com', 'hashed_pw129', 'Boros Réka', '2001-05-05', 'ID129012', 'AC129012', 'Borosné Ilona', 'Programtervező informatikus', 1, 'user', '2025-08-20 13:13:00', NULL, NULL, NULL, NULL),
(130, 'U130', 'user130@example.com', 'hashed_pw130', 'Jakab Miklós', '1996-02-02', 'ID130123', 'AC130123', 'Jakabné Zsuzsa', 'Villamosmérnök', 1, 'user', '2025-08-22 11:11:00', NULL, NULL, NULL, NULL),
(131, 'U131', 'user131@example.com', 'hashed_pw131', 'Makrai Dóra', '2000-12-24', 'ID131234', 'AC131234', 'Makrainé Mária', 'Gazdaságinformatikus', 1, 'user', '2025-08-25 16:16:00', NULL, NULL, NULL, NULL),
(132, 'U132', 'user132@example.com', 'hashed_pw132', 'Csemer Levente', '1999-03-03', 'ID132345', 'AC132345', 'Csemernė Ilona', 'Programtervező informatikus', 1, 'user', '2025-08-27 09:09:00', NULL, NULL, NULL, NULL),
(133, 'U133', 'user133@example.com', 'hashed_pw133', 'Benedek Anna', '2002-06-06', 'ID133456', 'AC133456', 'Benedekné Éva', 'Mérnökinformatikus', 0, 'user', '2025-08-30 10:10:00', NULL, NULL, NULL, NULL),
(134, 'U134', 'user134@example.com', 'hashed_pw134', 'Varga Zsolt', '1998-10-10', 'ID134567', 'AC134567', 'Vargáné Katalin', 'Villamosmérnök', 1, 'user', '2025-09-02 12:12:00', NULL, NULL, NULL, NULL),
(135, 'U135', 'user135@example.com', 'hashed_pw135', 'Kovács Dóra', '2001-01-19', 'ID135678', 'AC135678', 'Kovácsné Mária', 'Gazdaságinformatikus', 1, 'user', '2025-09-05 14:14:00', NULL, NULL, NULL, NULL),
(136, 'U136', 'user136@example.com', 'hashed_pw136', 'Pintér Balázs', '1997-07-07', 'ID136789', 'AC136789', 'Pintérné Ilona', 'Programtervező informatikus', 1, 'user', '2025-09-10 09:00:00', NULL, NULL, NULL, NULL),
(137, 'U137', 'user137@example.com', 'hashed_pw137', 'Varga Petra', '2000-04-04', 'ID137890', 'AC137890', 'Vargáné Éva', 'Mérnökinformatikus', 1, 'user', '2025-09-15 11:11:00', NULL, NULL, NULL, NULL),
(138, 'U138', 'user138@example.com', 'hashed_pw138', 'Szakács Bence', '1996-05-05', 'ID138901', 'AC138901', 'Szakácsné Katalin', 'Gazdaságinformatikus', 1, 'user', '2025-09-20 13:13:00', NULL, NULL, NULL, NULL),
(139, 'U139', 'user139@example.com', 'hashed_pw139', 'Tóth Erika', '2002-09-09', 'ID139012', 'AC139012', 'Tóthné Ilona', 'Villamosmérnök', 1, 'user', '2025-09-25 09:09:00', NULL, NULL, NULL, NULL),
(140, 'U140', 'user140@example.com', 'hashed_pw140', 'Kiss Gábor', '1999-11-11', 'ID140123', 'AC140123', 'Kissné Mária', 'Programtervező informatikus', 1, 'user', '2025-09-30 10:10:00', NULL, NULL, NULL, NULL),
(141, 'U141', 'user141@example.com', 'hashed_pw141', 'Fekete Anikó', '2000-02-02', 'ID141234', 'AC141234', 'Feketéné Katalin', 'Gazdaságinformatikus', 0, 'user', '2025-10-05 12:12:00', NULL, NULL, NULL, NULL),
(142, 'U142', 'user142@example.com', 'hashed_pw142', 'Szőke Levente', '1998-06-06', 'ID142345', 'AC142345', 'Szőkené Ilona', 'Mérnökinformatikus', 1, 'user', '2025-10-10 08:08:00', NULL, NULL, NULL, NULL),
(143, 'U143', 'user143@example.com', 'hashed_pw143', 'Bodnár Réka', '2001-08-08', 'ID143456', 'AC143456', 'Bodnárné Mária', 'Villamosmérnök', 1, 'user', '2025-10-12 14:14:00', NULL, NULL, NULL, NULL),
(144, 'U144', 'user144@example.com', 'hashed_pw144', 'Mészáros Lilla', '1999-03-03', 'ID144567', 'AC144567', 'Mészárosné Éva', 'Programtervező informatikus', 1, 'user', '2025-10-15 09:09:00', NULL, NULL, NULL, NULL),
(145, 'U145', 'user145@example.com', 'hashed_pw145', 'Kövér Dávid', '1996-12-12', 'ID145678', 'AC145678', 'Kövérné Ilona', 'Gazdaságinformatikus', 1, 'user', '2025-10-17 16:16:00', NULL, NULL, NULL, NULL),
(146, 'U146', 'user146@example.com', 'hashed_pw146', 'Barta Ilona', '2000-05-05', 'ID146789', 'AC146789', 'Bartané Katalin', 'Mérnökinformatikus', 1, 'user', '2025-10-18 08:00:00', NULL, NULL, NULL, NULL),
(147, 'U147', 'user147@example.com', 'hashed_pw147', 'Szilágyi Ákos', '1998-01-01', 'ID147890', 'AC147890', 'Szilágyné Mária', 'Villamosmérnök', 1, 'user', '2025-10-18 09:00:00', NULL, NULL, NULL, NULL),
(148, 'U148', 'user148@example.com', 'hashed_pw148', 'Gereben Nóra', '2001-09-09', 'ID148901', 'AC148901', 'Gerebenné Ilona', 'Programtervező informatikus', 1, 'user', '2025-10-18 10:00:00', NULL, NULL, NULL, NULL),
(149, 'U149', 'user149@example.com', 'hashed_pw149', 'Vincze László', '1997-07-07', 'ID149012', 'AC149012', 'Vinczené Ágnes', 'Gazdaságinformatikus', 1, 'user', '2025-10-18 11:00:00', NULL, NULL, NULL, NULL),
(150, 'U150', 'user150@example.com', 'hashed_pw150', 'Fülöp Orsolya', '2000-02-20', 'ID150123', 'AC150123', 'Fülöpné Mária', 'Mérnökinformatikus', 1, 'user', '2025-10-18 12:00:00', NULL, NULL, NULL, NULL),
(151, 'U151', 'user151@example.com', 'hashed_pw151', 'Boros Gábor', '1998-04-04', 'ID151234', 'AC151234', 'Borosné Ilona', 'Villamosmérnök', 1, 'user', '2025-10-18 13:00:00', NULL, NULL, NULL, NULL),
(152, 'U152', 'user152@example.com', 'hashed_pw152', 'Sárközi Éva', '2001-06-06', 'ID152345', 'AC152345', 'Sárköziné Katalin', 'Programtervező informatikus', 1, 'user', '2025-10-18 14:00:00', NULL, NULL, NULL, NULL),
(153, 'U153', 'user153@example.com', 'hashed_pw153', 'Rácz Bence', '1999-08-08', 'ID153456', 'AC153456', 'Ráczné Mária', 'Gazdaságinformatikus', 0, 'user', '2025-10-18 15:00:00', NULL, NULL, NULL, NULL),
(154, 'U154', 'user154@example.com', 'hashed_pw154', 'Móricz Anna', '2002-11-11', 'ID154567', 'AC154567', 'Móriczné Ilona', 'Mérnökinformatikus', 1, 'user', '2025-10-18 16:00:00', NULL, NULL, NULL, NULL),
(155, 'U155', 'user155@example.com', 'hashed_pw155', 'Szabados Lilla', '2000-01-05', 'ID155678', 'AC155678', 'Szabadosné Éva', 'Programtervező informatikus', 1, 'user', '2025-10-18 17:00:00', NULL, NULL, NULL, NULL),
(156, 'U156', 'user156@example.com', 'hashed_pw156', 'Kelemen Tamás', '1997-02-02', 'ID156789', 'AC156789', 'Kelemenéné Mária', 'Villamosmérnök', 1, 'user', '2025-10-18 18:00:00', NULL, NULL, NULL, NULL),
(157, 'U157', 'user157@example.com', 'hashed_pw157', 'Huber Rita', '1999-03-03', 'ID157890', 'AC157890', 'Huberné Ilona', 'Gazdaságinformatikus', 1, 'user', '2025-10-18 19:00:00', NULL, NULL, NULL, NULL),
(158, 'U158', 'user158@example.com', 'hashed_pw158', 'Takács Gábor', '1998-05-05', 'ID158901', 'AC158901', 'Takácsné Katalin', 'Mérnökinformatikus', 1, 'user', '2025-10-18 20:00:00', NULL, NULL, NULL, NULL),
(159, 'U159', 'user159@example.com', 'hashed_pw159', 'Molnár Réka', '2001-07-07', 'ID159012', 'AC159012', 'Molnárné Éva', 'Programtervező informatikus', 1, 'user', '2025-10-18 21:00:00', NULL, NULL, NULL, NULL),
(160, 'U160', 'user160@example.com', 'hashed_pw160', 'Kovács Bálint', '1996-09-09', 'ID160123', 'AC160123', 'Kovácsné Ilona', 'Üzemmérnök-informatikus', 1, 'user', '2025-10-18 22:00:00', NULL, NULL, NULL, NULL),
(161, 'QAWSED', 'azulraidshadowlegends@gmail.com', '$2b$12$LTE5xrDwFQudFsFgEIAZFObSTHiQPv61jZJdHQ6PErBrFxinh.70K', 'Harkai Dominik', '2026-03-05', '123654RE', '123215RE', 'Azul Anyuka', 'Villamosmérnök', 1, 'user', '2026-03-24 08:50:23', NULL, NULL, NULL, NULL);

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
-- A tábla indexei `chat_reaction`
--
ALTER TABLE `chat_reaction`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `message_id` (`message_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- A tábla indexei `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `course_code` (`course_code`);

--
-- A tábla indexei `course_equivalence`
--
ALTER TABLE `course_equivalence`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `equivalent_course_id` (`equivalent_course_id`),
  ADD KEY `major_id` (`major_id`);

--
-- A tábla indexei `course_major`
--
ALTER TABLE `course_major`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_course` (`course_id`),
  ADD KEY `fk_major` (`major_id`);

--
-- A tábla indexei `majors`
--
ALTER TABLE `majors`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `major_requirement_rules`
--
ALTER TABLE `major_requirement_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_major_requirement_rules_major_id` (`major_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT a táblához `chat_reaction`
--
ALTER TABLE `chat_reaction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT a táblához `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=223;

--
-- AUTO_INCREMENT a táblához `course_equivalence`
--
ALTER TABLE `course_equivalence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT a táblához `course_major`
--
ALTER TABLE `course_major`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=166;

--
-- AUTO_INCREMENT a táblához `majors`
--
ALTER TABLE `majors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT a táblához `major_requirement_rules`
--
ALTER TABLE `major_requirement_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT a táblához `progress`
--
ALTER TABLE `progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=303;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=162;

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
-- Megkötések a táblához `chat_reaction`
--
ALTER TABLE `chat_reaction`
  ADD CONSTRAINT `chat_reaction_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `chat_messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_reaction_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `course_equivalence`
--
ALTER TABLE `course_equivalence`
  ADD CONSTRAINT `course_equivalence_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_equivalence_ibfk_2` FOREIGN KEY (`equivalent_course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_equivalence_ibfk_3` FOREIGN KEY (`major_id`) REFERENCES `majors` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `course_major`
--
ALTER TABLE `course_major`
  ADD CONSTRAINT `fk_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_major` FOREIGN KEY (`major_id`) REFERENCES `majors` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `major_requirement_rules`
--
ALTER TABLE `major_requirement_rules`
  ADD CONSTRAINT `fk_major_requirement_rules_major` FOREIGN KEY (`major_id`) REFERENCES `majors` (`id`) ON DELETE CASCADE;

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
