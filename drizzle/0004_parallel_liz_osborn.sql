CREATE TABLE `guest_room_push_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomCode` varchar(16) NOT NULL,
	`partnerId` enum('beans','princess') NOT NULL,
	`token` varchar(255) NOT NULL,
	`platform` varchar(16) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guest_room_push_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `guest_room_push_tokens_room_partner_token_unique` UNIQUE(`roomCode`,`partnerId`,`token`)
);
