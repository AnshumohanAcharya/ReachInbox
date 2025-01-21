CREATE TABLE "email_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text,
	"email" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_emails" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"from" text NOT NULL,
	"label_id" text NOT NULL,
	"suggested_response" text,
	"processed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "processed_emails" ADD CONSTRAINT "processed_emails_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE no action ON UPDATE no action;