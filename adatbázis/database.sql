-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2025. Okt 18. 15:08
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
(69, 'Gazdaságinformatikus', 60, 'Sziasztook!', '2025-10-17 22:11:34', 0, NULL, NULL);

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
(25, 67, 17, '🥰', '2025-07-11 19:14:50');

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
(220, 'PE_BADMINTON', 'Tollaslabda', 'Badminton');

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
  `subgroup` varchar(50) DEFAULT NULL,
  `prerequisites` varchar(255) DEFAULT '[]'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `course_major`
--

INSERT INTO `course_major` (`id`, `course_id`, `major_id`, `credit`, `semester`, `type`, `subgroup`, `prerequisites`) VALUES
(4, 64, 1, 2, 1, 'required', NULL, '[]'),
(5, 65, 1, 3, 1, 'required', NULL, '[]'),
(6, 66, 1, 2, 2, 'required', NULL, '[\"MBNXK311E\",\"MBNXK311G\"]'),
(7, 67, 1, 3, 2, 'required', NULL, '[\"MBNXK311E\",\"MBNXK311G\"]'),
(8, 68, 1, 2, 3, 'required', NULL, '[\"MBNXK262E\"]'),
(9, 69, 1, 1, 3, 'required', NULL, '[\"MBNXK262E\"]'),
(10, 70, 1, 2, 1, 'required', NULL, '[]'),
(11, 71, 1, 3, 1, 'required', NULL, '[]'),
(12, 72, 1, 2, 3, 'required', NULL, '[\"IB304e\"]'),
(13, 73, 1, 2, 3, 'required', NULL, '[\"IB304e\"]'),
(14, 74, 1, 2, 4, 'required', NULL, '[\"IBK304e\",\"IBK304g\"]'),
(15, 75, 1, 2, 4, 'required', NULL, '[\"IBK304e\",\"IBK304g\"]'),
(16, 76, 1, 3, 5, 'required', NULL, '[\"MBNX111G\",\"MBNX111E\"]'),
(17, 77, 1, 2, 5, 'required', NULL, '[\"MBNX111G\",\"MBNX111E\"]'),
(18, 78, 1, 2, 1, 'required', NULL, '[]'),
(19, 79, 1, 3, 2, 'required', NULL, '[]'),
(20, 80, 1, 2, 2, 'required', NULL, '[]'),
(21, 81, 1, 3, 3, 'required', NULL, '[\"GKBN04E\"]'),
(22, 82, 1, 3, 2, 'required', NULL, '[]'),
(23, 83, 1, 3, 7, 'required', NULL, '[]'),
(24, 84, 1, 3, 4, 'required', NULL, '[\"GKBN15E\"]'),
(25, 85, 1, 3, 4, 'required', NULL, '[\"GKBN15E\"]'),
(26, 86, 1, 2, 6, 'required', NULL, '[\"GKBN15E\"]'),
(27, 87, 1, 2, 6, 'required', NULL, '[\"GKBN15E\"]'),
(28, 88, 1, 1, 5, 'required', NULL, '[\"GKBN06E\"]'),
(29, 94, 1, 2, 5, 'elective', 'elective_core_credits', '[\"IB104E\",\"IB104L\"]'),
(30, 95, 1, 2, 5, 'elective', 'elective_core_credits', '[\"IB104E\",\"IB104L\"]'),
(31, 96, 1, 2, 5, 'elective', 'elective_core_credits', '[\"IB204L\",\"IB204E\"]'),
(32, 97, 1, 2, 5, 'elective', 'elective_core_credits', '[\"IB204L\",\"IB204E\"]'),
(33, 98, 1, 2, 2, 'elective', 'elective_core_credits', '[\"IB104E\",\"IB104L\"]'),
(34, 99, 1, 2, 2, 'elective', 'elective_core_credits', '[\"IB104E\",\"IB104L\"]'),
(35, 100, 1, 2, 5, 'elective', 'elective_core_credits', '[\"IB204E\",\"MBNX111E\"]'),
(36, 101, 1, 2, 5, 'elective', 'elective_core_credits', '[\"IB204E\",\"MBNX111E\"]'),
(37, 102, 1, 2, 5, 'elective', 'elective_core_credits', '[\"IB104E\",\"IB104L\"]'),
(38, 103, 1, 2, 5, 'elective', 'elective_core_credits', '[\"IB104E\",\"IB104L\"]'),
(39, 104, 1, 3, 1, 'elective', 'elective_core_credits', '[]'),
(40, 105, 1, 2, 2, 'elective', 'elective_core_credits', '[\"MBNX111E\"]'),
(41, 106, 1, 2, 2, 'elective', 'elective_core_credits', '[\"MBNX111E\"]'),
(42, 107, 1, 1, 1, 'elective', 'elective_core_credits', '[]'),
(43, 108, 1, 3, 1, 'elective', 'elective_core_credits', '[]'),
(44, 109, 1, 2, 3, 'elective', 'elective_core_credits', '[\"MBNXK311E\",\"MBNXK111E\"]'),
(45, 110, 1, 2, 3, 'elective', 'elective_core_credits', '[\"MBNXK311E\",\"MBNXK111E\"]'),
(46, 111, 1, 2, 2, 'elective', 'elective_core_credits', '[\"MBNXK111E\"]'),
(47, 112, 1, 2, 2, 'elective', 'elective_core_credits', '[\"MBNXK111E\"]'),
(48, 113, 1, 2, 3, 'elective', 'elective_core_credits', '[\"IB204E\",\"IB204L\"]'),
(49, 114, 1, 2, 3, 'elective', 'elective_core_credits', '[\"IB204E\",\"IB204L\"]'),
(50, 115, 1, 2, 3, 'elective', 'elective_core_credits', '[]'),
(51, 116, 1, 2, 3, 'elective', 'elective_core_credits', '[]'),
(52, 117, 1, 2, 2, 'elective', 'elective_core_credits', '[\"IB162E\"]'),
(53, 118, 1, 2, 2, 'elective', 'elective_core_credits', '[\"IB162E\"]'),
(54, 119, 1, 1, 4, 'elective', 'elective_core_credits', '[\"IB204E\",\"IB204L\"]'),
(55, 120, 1, 2, 4, 'elective', 'elective_core_credits', '[\"IB204E\",\"IB204L\"]'),
(56, 121, 1, 1, 1, 'elective', 'elective_core_credits', '[]'),
(57, 122, 1, 2, 4, 'elective', 'elective_core_credits', '[\"IB204L\",\"IB204E\"]'),
(58, 123, 1, 2, 4, 'elective', 'elective_core_credits', '[\"IB204L\",\"IB204E\"]'),
(59, 124, 1, 2, 5, 'elective', 'elective_core_credits', '[\"IB414-2g\",\"IB414-2e\"]'),
(60, 125, 1, 2, 5, 'elective', 'elective_core_credits', '[\"IB414-2g\",\"IB414-2e\"]'),
(61, 126, 1, 2, 3, 'elective', 'elective_core_credits', '[\"MBNX111E\",\"IB104E\"]'),
(62, 127, 1, 2, 3, 'elective', 'elective_core_credits', '[\"MBNX111E\",\"IB104E\"]'),
(63, 128, 1, 2, 6, 'elective', 'elective_core_credits', '[\"IB153e\",\"IB153l\"]'),
(64, 129, 1, 2, 6, 'elective', 'elective_core_credits', '[\"IB153e\",\"IB153l\"]'),
(65, 130, 1, 2, 4, 'elective', 'elective_core_credits', '[\"IB204E\",\"IB204L\"]'),
(66, 131, 1, 2, 4, 'elective', 'elective_core_credits', '[\"IB204E\",\"IB204L\"]'),
(67, 132, 1, 2, 6, 'elective', 'elective_core_credits', '[\"IB153e\",\"IB407e\",\"IB153e\"]'),
(68, 133, 1, 1, 6, 'elective', 'elective_core_credits', '[\"IB153e\",\"IB407e\",\"IB153e\"]'),
(69, 134, 1, 4, 1, 'elective', 'elective_info_credits', '[]'),
(70, 135, 1, 4, 1, 'elective', 'elective_info_credits', '[]'),
(71, 136, 1, 3, 2, 'elective', 'elective_info_credits', '[\"IB104L\"]'),
(72, 137, 1, 3, 2, 'elective', 'elective_info_credits', '[\"IB104L\"]'),
(73, 138, 1, 2, 1, 'elective', 'elective_info_credits', '[]'),
(74, 139, 1, 3, 1, 'elective', 'elective_info_credits', '[]'),
(75, 140, 1, 2, 2, 'elective', 'elective_info_credits', '[\"IBNa1001L\"]'),
(76, 141, 1, 3, 2, 'elective', 'elective_info_credits', '[\"IBNa1001L\"]'),
(77, 142, 1, 2, 0, 'elective', 'elective_info_credits', '[\"IBNa1001L\"]'),
(78, 143, 1, 2, 0, 'elective', 'elective_info_credits', '[\"IBNa1001L\"]'),
(79, 144, 1, 2, 0, 'elective', NULL, '[]'),
(80, 145, 1, 3, 4, 'elective', NULL, '[\"TT-MBNXK111\"]'),
(81, 146, 1, 1, 4, 'elective', NULL, '[\"TT-MBNXK111\"]'),
(82, 147, 1, 2, 1, 'elective', NULL, '[]'),
(83, 148, 1, 2, 4, 'elective', NULL, '[\"IB501e\",\"IB501g\"]'),
(84, 149, 1, 3, 4, 'elective', NULL, '[\"IB501e\",\"IB501g\"]'),
(85, 150, 1, 2, 1, 'elective', NULL, '[]'),
(86, 151, 1, 2, 1, 'elective', NULL, '[]'),
(87, 152, 1, 4, 0, 'elective', NULL, '[]'),
(88, 153, 1, 3, 0, 'elective', NULL, '[]'),
(89, 154, 1, 3, 0, 'elective', NULL, '[]'),
(90, 155, 1, 4, 0, 'elective', NULL, '[]'),
(91, 156, 1, 0, 0, 'elective', NULL, '[]'),
(92, 157, 1, 5, 0, 'elective', NULL, '[]'),
(93, 158, 1, 0, 0, 'elective', NULL, '[]'),
(94, 159, 1, 4, 0, 'elective', NULL, '[]'),
(95, 160, 1, 0, 0, 'elective', NULL, '[]'),
(96, 161, 1, 3, 0, 'elective', NULL, '[]'),
(97, 162, 1, 0, 0, 'elective', NULL, '[]'),
(98, 163, 1, 5, 0, 'elective', NULL, '[]'),
(99, 164, 1, 0, 0, 'elective', NULL, '[]'),
(100, 165, 1, 4, 0, 'elective', NULL, '[]'),
(101, 166, 1, 2, 0, 'elective', NULL, '[]'),
(102, 167, 1, 2, 0, 'elective', NULL, '[\"IB304e\"]'),
(103, 168, 1, 2, 0, 'elective', NULL, '[\"IB304e\"]'),
(104, 169, 1, 3, 0, 'elective', NULL, '[]'),
(105, 170, 1, 2, 0, 'elective', NULL, '[\"IBK604e\",\"IBK604g\"]'),
(106, 171, 1, 2, 0, 'elective', NULL, '[\"IBK604e\",\"IBK604g\"]'),
(107, 172, 1, 1, 0, 'elective', NULL, '[\"IB162E\"]'),
(108, 173, 1, 1, 0, 'elective', NULL, '[\"IB162E\"]'),
(109, 174, 1, 1, 0, 'elective', NULL, '[]'),
(110, 175, 1, 2, 0, 'elective', NULL, '[]'),
(111, 176, 1, 2, 0, 'elective', NULL, '[\"IB402e\",\"IB402g\"]'),
(112, 177, 1, 2, 0, 'elective', NULL, '[\"IB402e\",\"IB402g\"]'),
(113, 178, 1, 3, 0, 'elective', NULL, '[\"IB204E\"]'),
(114, 179, 1, 3, 0, 'elective', NULL, '[\"IB153e\"]'),
(115, 180, 1, 3, 0, 'elective', NULL, '[\"IB407e\",\"IB204E\"]'),
(116, 181, 1, 3, 0, 'elective', NULL, '[\"IB153e\"]'),
(117, 182, 1, 3, 0, 'elective', NULL, '[\"IB414e\"]'),
(118, 183, 1, 3, 0, 'elective', NULL, '[\"IB104E\"]'),
(119, 184, 1, 3, 0, 'elective', NULL, '[\"IB104E\"]'),
(120, 185, 1, 3, 0, 'elective', NULL, '[]'),
(121, 186, 1, 3, 0, 'elective', NULL, '[\"IB301e\"]'),
(122, 187, 1, 3, 0, 'elective', NULL, '[]'),
(123, 188, 1, 3, 0, 'elective', NULL, '[\"IB204E\",\"IB204L\"]'),
(124, 189, 1, 3, 0, 'elective', NULL, '[]'),
(125, 190, 1, 2, 0, 'elective', NULL, '[\"MBNXK111E\",\"MBNXK111G\"]'),
(126, 191, 1, 3, 0, 'elective', NULL, '[\"MBNXK111E\",\"MBNXK111G\"]'),
(127, 192, 1, 2, 0, 'elective', NULL, '[\"MBNXK112E\",\"MBNXK112G\"]'),
(128, 193, 1, 3, 0, 'elective', NULL, '[\"MBNXK112E\",\"MBNXK112G\"]'),
(129, 194, 1, 2, 0, 'elective', NULL, '[\"MBNXK311E\",\"MBNXK311G\"]'),
(130, 195, 1, 3, 0, 'elective', NULL, '[\"MBNXK311E\",\"MBNXK311G\"]'),
(131, 196, 1, 1, 0, 'elective', NULL, '[\"IB204L\",\"IB204E\"]'),
(132, 197, 1, 2, 0, 'elective', NULL, '[\"IB204L\",\"IB204E\"]'),
(133, 198, 1, 1, 0, 'elective', NULL, '[\"IB370e\",\"IB370g\"]'),
(134, 199, 1, 2, 0, 'elective', NULL, '[\"IB370e\",\"IB370g\"]'),
(135, 200, 1, 3, 0, 'elective', NULL, '[\"IB302e\",\"IB302g\"]'),
(136, 201, 1, 2, 0, 'elective', NULL, '[\"IB153e\",\"IB153l\"]'),
(137, 202, 1, 3, 0, 'elective', NULL, '[\"IB153e\",\"IB153l\"]'),
(138, 203, 1, 1, 0, 'elective', NULL, '[\"IB153e\",\"IB153l\"]'),
(139, 204, 1, 2, 0, 'elective', NULL, '[\"IB153e\",\"IB153l\"]'),
(140, 205, 1, 2, 0, 'elective', NULL, '[\"IB714e\",\"IB714g\"]'),
(141, 206, 1, 2, 0, 'elective', NULL, '[\"IB714e\",\"IB714g\"]'),
(142, 207, 1, 3, 0, 'elective', NULL, '[\"GKBN05E\"]'),
(143, 89, 1, 1, 5, 'required', NULL, '[\"GKBN06E\"]'),
(144, 90, 1, 3, 5, 'required', NULL, '[\"GKBN05E\"]'),
(145, 91, 1, 2, 5, 'required', NULL, '[]'),
(146, 92, 1, 2, 5, 'required', NULL, '[]'),
(147, 93, 1, 3, 0, 'required', NULL, '[]'),
(148, 208, 1, 320, 0, 'required', 'practice_hours', '[\"IB204E\"]'),
(149, 209, 1, 5, 6, 'required', NULL, '[]'),
(150, 210, 1, 10, 7, 'required', NULL, '[]'),
(151, 211, 1, 0, 0, 'optional', 'pe', '[]'),
(152, 212, 1, 0, 0, 'optional', 'pe', '[]'),
(153, 213, 1, 0, 0, 'optional', 'pe', '[]'),
(154, 214, 1, 0, 0, 'optional', 'pe', '[]'),
(155, 215, 1, 0, 0, 'optional', 'pe', '[]'),
(156, 216, 1, 0, 0, 'optional', 'pe', '[]'),
(157, 217, 1, 0, 0, 'optional', 'pe', '[]'),
(158, 218, 1, 0, 0, 'optional', 'pe', '[]'),
(159, 219, 1, 0, 0, 'optional', 'pe', '[]'),
(160, 220, 1, 0, 0, 'optional', 'pe', '[]');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `majors`
--

DROP TABLE IF EXISTS `majors`;
CREATE TABLE `majors` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `majors`
--

INSERT INTO `majors` (`id`, `name`) VALUES
(1, 'Gazdaságinformatikus'),
(2, 'Mérnökinformatikus'),
(3, 'Programtervező informatikus'),
(4, 'Villamosmérnök'),
(5, 'Üzemmérnök-informatikus');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `major_requirements`
--

DROP TABLE IF EXISTS `major_requirements`;
CREATE TABLE `major_requirements` (
  `id` int(11) NOT NULL,
  `major_id` int(11) NOT NULL,
  `total_credits` int(11) NOT NULL,
  `required_credits` int(11) NOT NULL,
  `elective_credits` int(11) NOT NULL,
  `optional_credits` int(11) NOT NULL,
  `elective_info_credits` int(11) DEFAULT 0,
  `elective_math_credits` int(11) DEFAULT 0,
  `pe_semesters` int(11) DEFAULT 0,
  `practice_hours` int(11) DEFAULT 0,
  `elective_non_core_credits` int(11) DEFAULT 0,
  `elective_core_credits` int(11) DEFAULT 0,
  `thesis_credits` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `major_requirements`
--

INSERT INTO `major_requirements` (`id`, `major_id`, `total_credits`, `required_credits`, `elective_credits`, `optional_credits`, `elective_info_credits`, `elective_math_credits`, `pe_semesters`, `practice_hours`, `elective_non_core_credits`, `elective_core_credits`, `thesis_credits`) VALUES
(1, 1, 210, 69, 116, 10, 14, 0, 2, 320, 36, 80, 15);

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
(5, 57, 79, 1, 'completed', 6),
(6, 57, 80, 1, 'completed', 6),
(7, 57, 64, 1, 'completed', 5),
(8, 57, 65, 1, 'completed', 5),
(9, 57, 70, 1, 'completed', 5),
(10, 57, 71, 1, 'completed', 5),
(11, 57, 134, 1, 'completed', 5),
(12, 57, 135, 1, 'completed', 5),
(13, 57, 104, 1, 'completed', 5),
(14, 57, 121, 1, 'completed', 5),
(15, 57, 147, 1, 'completed', 5),
(16, 57, 78, 2, 'completed', 3),
(17, 57, 115, 1, 'completed', 6),
(18, 57, 116, 1, 'completed', 6),
(20, 57, 66, 2, 'in_progress', 2),
(21, 57, 67, 2, 'in_progress', 2),
(22, 57, 136, 2, 'in_progress', 2),
(23, 57, 137, 2, 'in_progress', 2),
(24, 57, 117, 2, 'in_progress', 2),
(25, 57, 118, 2, 'in_progress', 2),
(26, 57, 82, 2, 'in_progress', 2),
(27, 57, 107, 2, 'completed', 2),
(28, 57, 108, 2, 'completed', 2),
(29, 57, 74, 2, 'completed', 6),
(30, 57, 75, 2, 'completed', 6),
(31, 57, 128, 2, 'in_progress', 6),
(32, 57, 129, 2, 'in_progress', 6),
(33, 57, 142, 1, 'completed', 3),
(34, 57, 143, 1, 'completed', 3),
(35, 57, 138, 2, 'completed', 6),
(36, 57, 139, 2, 'completed', 6),
(37, 57, 107, 2, 'completed', 5),
(38, 57, 108, 2, 'completed', 5),
(39, 57, 172, 2, 'completed', 2),
(40, 57, 173, 2, 'completed', 2),
(41, 57, 208, 100, 'in_progress', 2),
(42, 57, 211, 1, 'completed', 2),
(43, 57, 209, 6, 'completed', 5),
(236, 17, 93, 1, 'completed', 3),
(237, 17, 135, 1, 'in_progress', 2),
(238, 17, 104, 1, 'in_progress', 2),
(239, 17, 121, 1, 'in_progress', 2),
(240, 17, 147, 1, 'in_progress', 2),
(241, 17, 138, 1, 'in_progress', 2),
(242, 17, 139, 1, 'in_progress', 2),
(243, 17, 107, 1, 'in_progress', 2),
(244, 17, 108, 1, 'in_progress', 2),
(245, 17, 151, 1, 'in_progress', 2),
(246, 17, 150, 1, 'in_progress', 2),
(247, 17, 127, 1, 'completed', 6);

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
(17, 'HEZUGM', 'harkai.dominik0@gmail.com', '$2b$12$gtV5BB2QxPRgy8J89LbfiuM0Q5ddq/MELLWg1Z9L2C.uwQfK3yINS', 'Harkai Dominik', '2001-11-11', '111111NE', '111111KE', 'Sári Erzsébet', 'Gazdaságinformatikus', 1, 'admin', '2025-06-23 13:00:23', NULL, NULL, NULL, 'Anon#17245'),
(26, 'GBG15D', 'buskristof415@gmail.com', '$2b$12$LB44D11dm2AS9vviNAeJRuDi7OOFPIU8F2RJmmMOLU/z8RA1oZo8u', 'Bús Kristóf', '2010-06-11', '666666AD', '666666AD', 'Lakatos Máriané', 'Mérnökinformatikus', 1, 'user', '2025-06-24 22:42:08', NULL, 'c3222117-8329-4995-b740-114181a6545b', '2025-06-26 19:06:28', NULL),
(52, 'ASDFGH', 'harkai.dominik69@gmail.com', '$2b$12$V0INM6eJi6K7iRVwURKAPOnKmaJcN.QuhBUDp6SVrUgRHgdlc7vqq', 'Pityi Palkó', '2001-11-11', '123456EE', '123456EE', 'Csereeps Virág', 'Gazdaságinformatikus', 1, 'user', '2025-07-06 11:52:49', NULL, NULL, NULL, NULL),
(53, 'GBG16D', 'zsomle401@gmail.com', '$2b$12$uL0o.b9hHlo/XXnh6bMmveEw/oVEcFYIgCwoCrLlyDnSYCBQwlhKm', 'József Mária', '2003-06-04', '666666ZZ', '666666ZZ', 'Mária király', 'Programtervező informatikus', 1, 'user', '2025-07-06 22:58:11', NULL, NULL, NULL, NULL),
(55, 'KUR013', 'racikaw@gmail.com', '$2b$12$rxqdS4vcvvHOVs0zFxo5T.XuKHOXC7qDQxS8/7yUPIyM2TPxEwfia', 'Szeret Elek', '1999-06-11', '123456AB', '123456AB', 'Arika Corba', 'Villamosmérnök', 1, 'user', '2025-07-11 21:10:24', NULL, NULL, NULL, NULL),
(57, 'VALAKI', 'kiss.evelin2007@gmail.com', '$2b$12$lHg1SyXD.83Xq0I/kGyZ2ufX2Lkox7.Pf.CbziCyB9NxtiiAK7ivS', 'Valaki Vagyok', '2001-11-11', '112233AE', '112233AE', 'Nemtudom Ki Ez Te', 'Gazdaságinformatikus', 1, 'user', '2025-07-11 22:13:44', '83c72b35-ddd1-4845-847b-8a33e8cba88c', NULL, NULL, 'Anon#57875'),
(60, 'ASDQWE', 'azulref2@gmail.com', '$2b$12$ES0MpqwrIw4SNMvhWl2FsOvgITbJN.BhZq.FaCQEJfE3WrXnl1wgi', 'Kiss Ágota', '2002-06-06', '456789TE', '216546ZE', 'Valami Anyuka', 'Gazdaságinformatikus', 1, 'user', '2025-10-18 00:10:19', NULL, NULL, NULL, NULL);

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
-- A tábla indexei `major_requirements`
--
ALTER TABLE `major_requirements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `major_id` (`major_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT a táblához `chat_reaction`
--
ALTER TABLE `chat_reaction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT a táblához `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=221;

--
-- AUTO_INCREMENT a táblához `course_equivalence`
--
ALTER TABLE `course_equivalence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT a táblához `course_major`
--
ALTER TABLE `course_major`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=161;

--
-- AUTO_INCREMENT a táblához `majors`
--
ALTER TABLE `majors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT a táblához `major_requirements`
--
ALTER TABLE `major_requirements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `progress`
--
ALTER TABLE `progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=248;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

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
-- Megkötések a táblához `major_requirements`
--
ALTER TABLE `major_requirements`
  ADD CONSTRAINT `major_requirements_ibfk_1` FOREIGN KEY (`major_id`) REFERENCES `majors` (`id`);

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
