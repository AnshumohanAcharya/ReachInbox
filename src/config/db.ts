import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import {
    boolean,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";
dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error(
        "No database connection string provided. Check your environment variables."
    );
}

export const db = drizzle(neon(process.env.DATABASE_URL!));

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(), // google or outlook
    created_at: text("created_at").default("now()"),
});

export const oauthTokens = pgTable("oauth_tokens", {
    id: serial("id").primaryKey(),
    user_id: varchar("user_id", { length: 255 }).notNull(),
    access_token: text("access_token").notNull(),
    refresh_token: text("refresh_token"),
    provider: varchar("provider", { length: 50 }).notNull(), // google or outlook
    expires_at: text("expires_at").notNull(),
});

export const emailAccounts = pgTable("email_accounts", {
    id: text("id").primaryKey(),
    provider: text("provider"),
    email: text("email").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    requiresReauth: boolean("requires_reauth").default(false),
    expiresAt: timestamp("expires_at").notNull(),
});

export const processedEmails = pgTable("processed_emails", {
    id: text("id").primaryKey(),
    accountId: text("account_id").references(() => emailAccounts.id),
    subject: text("subject").notNull(),
    content: text("content").notNull(),
    from: text("from").notNull(),
    labelId: text("label_id").notNull(),
    suggestedResponse: text("suggested_response"),
    processed: boolean("processed").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});
