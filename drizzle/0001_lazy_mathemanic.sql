CREATE TABLE `couple_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(80) NOT NULL,
	`avatarEmoji` varchar(12) NOT NULL DEFAULT '💜',
	`accentColor` varchar(16) NOT NULL DEFAULT '#8D5BA6',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `couple_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `couple_members_user_unique` UNIQUE(`userId`),
	CONSTRAINT `couple_members_pair_unique` UNIQUE(`coupleId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `couple_spaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`inviteCode` varchar(16) NOT NULL,
	`settings` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `couple_spaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `couple_spaces_invite_code_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_logs_couple_date_unique` UNIQUE(`coupleId`,`date`)
);
--> statement-breakpoint
CREATE TABLE `media_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`dailyLogId` int,
	`uploadedBy` int NOT NULL,
	`kind` enum('cover','photo') NOT NULL,
	`url` text NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`caption` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`authorId` int NOT NULL,
	`recordType` enum('chat','loveNote','intimacy','habit','dateIdea') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shared_records_id` PRIMARY KEY(`id`)
);
