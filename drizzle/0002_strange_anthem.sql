CREATE TABLE `guest_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomCode` varchar(16) NOT NULL,
	`journalState` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guest_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `guest_rooms_room_code_unique` UNIQUE(`roomCode`)
);
