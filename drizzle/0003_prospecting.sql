CREATE TABLE `prospecting_credentials` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`ciphertext` text NOT NULL,
	`iv` text NOT NULL,
	`last_four` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prospecting_searches` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`category` text NOT NULL,
	`location` text NOT NULL,
	`min_rating` real NOT NULL,
	`min_reviews` integer NOT NULL,
	`result_count` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `prospecting_searches_owner_created_idx` ON `prospecting_searches` (`owner_id`, `created_at`);
