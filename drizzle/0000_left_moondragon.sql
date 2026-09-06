CREATE TABLE `admin_session` (
	`token` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_session_expires_idx` ON `admin_session` (`expires_at`);--> statement-breakpoint
CREATE TABLE `admin_user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`salt` text NOT NULL,
	`password_hash` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `page_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`referrer` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'direct' NOT NULL,
	`device` text DEFAULT 'desktop' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`visitor_hash` text NOT NULL,
	`day` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `page_views_day_idx` ON `page_views` (`day`);--> statement-breakpoint
CREATE INDEX `page_views_path_idx` ON `page_views` (`path`);--> statement-breakpoint
CREATE INDEX `page_views_source_idx` ON `page_views` (`source`);--> statement-breakpoint
-- 임시 관리자 비밀번호(PBKDF2-SHA256, 150,000회). 평문은 저장하지 않습니다.
-- 첫 로그인 후 /admin 에서 반드시 변경하세요. 변경하면 새 해시가 여기 덮어써지고
-- 저장소에는 남지 않습니다.
INSERT INTO `admin_user` (`id`, `salt`, `password_hash`) VALUES
  (1, '06e815fb5a8f1e378b919f9c97e89e52', '4234d4d3cef37c4fd9de21aef0685c05f310b563e97221ae50b25c488ff201f8');
