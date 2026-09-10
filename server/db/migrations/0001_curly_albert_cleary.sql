ALTER TABLE `events` ADD `scope_type` text DEFAULT 'project' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `scope_id` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `type` text DEFAULT 'milestone' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `description` text;