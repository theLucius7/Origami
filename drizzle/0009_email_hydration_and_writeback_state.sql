ALTER TABLE `emails` ADD `hydration_status` text DEFAULT 'metadata' NOT NULL;
ALTER TABLE `emails` ADD `hydrated_at` integer;
ALTER TABLE `emails` ADD `hydration_error` text;
ALTER TABLE `emails` ADD `read_write_back_status` text DEFAULT 'idle' NOT NULL;
ALTER TABLE `emails` ADD `read_write_back_at` integer;
ALTER TABLE `emails` ADD `read_write_back_error` text;
ALTER TABLE `emails` ADD `star_write_back_status` text DEFAULT 'idle' NOT NULL;
ALTER TABLE `emails` ADD `star_write_back_at` integer;
ALTER TABLE `emails` ADD `star_write_back_error` text;

UPDATE `emails`
SET
  `hydration_status` = CASE
    WHEN (`body_text` IS NOT NULL AND length(`body_text`) >= 0)
      OR (`body_html` IS NOT NULL AND length(`body_html`) >= 0)
    THEN 'hydrated'
    ELSE 'metadata'
  END,
  `hydrated_at` = CASE
    WHEN (`body_text` IS NOT NULL AND length(`body_text`) >= 0)
      OR (`body_html` IS NOT NULL AND length(`body_html`) >= 0)
    THEN COALESCE(`created_at`, unixepoch())
    ELSE NULL
  END,
  `hydration_error` = NULL,
  `read_write_back_status` = 'idle',
  `read_write_back_at` = NULL,
  `read_write_back_error` = NULL,
  `star_write_back_status` = 'idle',
  `star_write_back_at` = NULL,
  `star_write_back_error` = NULL;
