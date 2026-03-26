-- =============================================================================
-- Példa szak: összesen 100 kredit követelmény (szabályok)
--
--   30 kötelező (required)
--   40 kötelezően választható (elective):
--      10 – infó blokk  (subgroup: demo_koteval_info)
--      10 – matek blokk (demo_koteval_math)
--      10 – fizika blokk (demo_koteval_physics)
--      10 – „bármilyen” kötvál, nincs konkrét alcsoport (course_major.subgroup IS NULL)
--   30 szabadon választható (optional)
--
-- A hallgató users.major mezője pontosan egyezzen a majors.name értékével.
-- Kurzusok: course_major.type + course_major.subgroup illeszkedjen a szabályokhoz;
-- teljesítés: progress.status = 'completed'.
--
-- Futtatás: phpMyAdmin / mysql — egy adatbázis, ahol a táblák léteznek.
-- Ha újrafuttatod: töröld előtte a szakot és a kapcsolódó sorokat, vagy változtasd a nevet.
-- =============================================================================

START TRANSACTION;

INSERT INTO majors (name, name_en)
VALUES (
  'Példa 100 kredit szak (demo)',
  'Demo major — 100 credits structure'
);
SET @mid = LAST_INSERT_ID();

INSERT INTO major_requirement_rules
  (major_id, code, label_hu, label_en, requirement_type, subgroup, value_type, min_value, include_in_total)
VALUES
  -- 30 kötelező kredit
  (@mid, 'req_core_30', 'Kötelező kreditek', 'Required credits', 'required', NULL, 'credits', 30, 1),

  -- Kötelezően választható: 10+10+10+10 = 40
  (@mid, 'koteval_info_10', 'Kötelezően választható — informatika blokk (10 kr)', 'Elective — IT block (10 cr)', 'elective', 'demo_koteval_info', 'credits', 10, 1),
  (@mid, 'koteval_math_10', 'Kötelezően választható — matematika blokk (10 kr)', 'Elective — math block (10 cr)', 'elective', 'demo_koteval_math', 'credits', 10, 1),
  (@mid, 'koteval_phys_10', 'Kötelezően választható — fizika blokk (10 kr)', 'Elective — physics block (10 cr)', 'elective', 'demo_koteval_physics', 'credits', 10, 1),
  -- „Bármilyen” kötvál: csak azok a tárgyak, ahol course_major.subgroup IS NULL (és type = elective)
  (@mid, 'koteval_barmi_10', 'Kötelezően választható — általános (10 kr, nincs alcsoport)', 'Elective — general pool (10 cr, no subgroup)', 'elective', '__NULL__', 'credits', 10, 1),

  -- 30 szabadon választható
  (@mid, 'szabad_30', 'Szabadon választható kreditek', 'Free elective credits', 'optional', NULL, 'credits', 30, 1);

COMMIT;

-- Összesen min_value: 30+10+10+10+10+30 = 100 (a fő összesítőben is megjelenik, ha include_in_total = 1)

-- =============================================================================
-- Kurzusok hozzárendelése (példa — kommentként; szükség szerint illeszd be)
--
-- 1) courses táblába új tárgyak egyedi course_code-dal.
-- 2) course_major sorok (major_id = a fenti szak id-ja):
--
--    Kötelező:     type = 'required',  subgroup = NULL
--    Infó kötvál:  type = 'elective',  subgroup = 'demo_koteval_info'
--    Matek kötvál: type = 'elective',  subgroup = 'demo_koteval_math'
--    Fizika kötvál:type = 'elective',  subgroup = 'demo_koteval_physics'
--    „Általános” kötvál (bármilyen tárgy, nincs alcsoport):
--                  type = 'elective',  subgroup = NULL
--    Szabvál:      type = 'optional', subgroup = NULL
--
-- Példa course_major (feltételezve @cid_req, @cid_inf, ... kurzus id-kat):
--
-- INSERT INTO course_major (course_id, major_id, credit, semester, type, subgroup, prerequisites) VALUES
--   (@cid_req,  @mid, 3, 1, 'required',  NULL, NULL),
--   (@cid_inf,  @mid, 5, 3, 'elective',  'demo_koteval_info', NULL),
--   (@cid_math, @mid, 5, 2, 'elective',  'demo_koteval_math', NULL),
--   (@cid_phys, @mid, 5, 4, 'elective',  'demo_koteval_physics', NULL),
--   (@cid_any,  @mid, 4, 5, 'elective',  NULL, NULL),
--   (@cid_opt,  @mid, 3, 6, 'optional', NULL, NULL);
-- =============================================================================
