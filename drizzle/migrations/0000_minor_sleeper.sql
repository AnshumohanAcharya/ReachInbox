CREATE TABLE "oauth_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"provider" varchar(50) NOT NULL,
	"expires_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"created_at" text DEFAULT 'now()'
);
