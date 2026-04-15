-- Villamosmérnök (és más) MK fa: egyidejűleg csak egy specializációs ág követelménye érvényes.
ALTER TABLE `users`
  ADD COLUMN `chosen_specialization_code` VARCHAR(80) NULL DEFAULT NULL
  AFTER `major`;
