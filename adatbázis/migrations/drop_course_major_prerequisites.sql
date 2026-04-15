-- Removes course_major.prerequisites (előfeltétel mező) — no longer used by the app.
ALTER TABLE `course_major` DROP COLUMN `prerequisites`;
