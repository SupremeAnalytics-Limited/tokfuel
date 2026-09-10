CREATE TABLE `payment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(100) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`giftId` varchar(64) NOT NULL,
	`link` text NOT NULL,
	`quantity` int NOT NULL,
	`customerAmount` decimal(14,2) NOT NULL,
	`wholesaleAmount` decimal(14,2),
	`tokfuelAmount` decimal(14,2),
	`paystackStatus` varchar(32) NOT NULL DEFAULT 'initialized',
	`orderStatus` varchar(32) NOT NULL DEFAULT 'awaiting_payment',
	`refundStatus` varchar(32) NOT NULL DEFAULT 'not_applicable',
	`sociallyOrderId` varchar(100),
	`transferReference` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_transactions_reference_unique` UNIQUE(`reference`),
	CONSTRAINT `payment_transactions_transferReference_unique` UNIQUE(`transferReference`)
);
--> statement-breakpoint
CREATE TABLE `wallet_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`idempotencyKey` varchar(150) NOT NULL,
	`amount` decimal(14,2) NOT NULL,
	`direction` enum('credit','debit') NOT NULL,
	`reason` varchar(64) NOT NULL,
	`paymentReference` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_ledger_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallet_ledger_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
