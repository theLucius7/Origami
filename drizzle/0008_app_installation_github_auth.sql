CREATE TABLE `app_installation` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_github_id` text NOT NULL,
  `owner_github_login` text NOT NULL,
  `owner_github_name` text,
  `owner_github_avatar_url` text,
  `setup_completed_at` integer,
  `created_at` integer DEFAULT (unixepoch()),
  `updated_at` integer DEFAULT (unixepoch())
);
