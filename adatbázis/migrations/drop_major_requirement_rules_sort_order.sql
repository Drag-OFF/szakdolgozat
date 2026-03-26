-- Eltávolítja a manuális sort_order mezőt; a sorrendet az alkalmazás határozza meg.
-- Futtatás: phpMyAdmin / mysql az adott adatbázison.

ALTER TABLE `major_requirement_rules` DROP COLUMN `sort_order`;
