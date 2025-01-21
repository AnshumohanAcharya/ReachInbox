import * as msal from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import {
    OUTLOOK_SCOPES
} from "../config/auth";
import { db, emailAccounts } from "../config/db";
import { EmailAccount } from "../types";
import dotenv from "dotenv";
import { nanoid } from "nanoid";
dotenv.config();

export class AuthService {
    private static instance: AuthService;

    private googleClient: OAuth2Client;

    private constructor() {
        // Initialize the OAuth2 client with your credentials
        this.googleClient = new OAuth2Client({
            clientId: process.env.GMAIL_CLIENT_ID!,
            clientSecret: process.env.GMAIL_CLIENT_SECRET!,
            redirectUri: `${process.env.BASE_URL}/auth/gmail/callback`,
        });
    }
    
    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async getGmailAuthUrl(): Promise<string> {
        return this.googleClient.generateAuthUrl({
            access_type: "offline",
            scope: [
                "https://www.googleapis.com/auth/gmail.readonly",
                "https://www.googleapis.com/auth/gmail.modify",
                "https://www.googleapis.com/auth/gmail.labels",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
            prompt: "consent",
        });
    }

    async handleGmailCallback(code: string): Promise<EmailAccount> {
        try {
            const { tokens } = await this.googleClient.getToken(code);
            this.googleClient.setCredentials(tokens);

            // Get user email using OAuth2 userinfo endpoint
            const oauth2 = google.oauth2({
                version: "v2",
                auth: this.googleClient,
            });
            const { data } = await oauth2.userinfo.get();

            if (!data.email) {
                throw new Error("Email not found in user info");
            }

            const emailAccount: EmailAccount = {
                id: nanoid(),
                provider: "gmail",
                email: data.email,
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token!,
                expiresAt: new Date(
                    Date.now() + (tokens.expiry_date || 3600 * 1000)
                ),
            };

            // Save to database
            await db.insert(emailAccounts).values({
                id: emailAccount.id,
                provider: emailAccount.provider,
                email: emailAccount.email,
                accessToken: emailAccount.accessToken,
                refreshToken: emailAccount.refreshToken,
                expiresAt: emailAccount.expiresAt,
            });

            return emailAccount;
        } catch (error) {
            console.error("Gmail OAuth error:", error);
            throw new Error("Failed to authenticate with Gmail");
        }
    }

    async getOutlookAuthUrl(): Promise<string> {
        const msalConfig = {
            auth: {
                clientId: process.env.OUTLOOK_CLIENT_ID!,
                authority: `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID}`,
                redirectUri: `${process.env.BASE_URL}/auth/outlook/callback`,
            },
        };

        const msalInstance = new msal.ConfidentialClientApplication(msalConfig);
        const authUrl = await msalInstance.getAuthCodeUrl({
            scopes: OUTLOOK_SCOPES,
            prompt: "select_account",
            redirectUri: `${process.env.BASE_URL}/auth/outlook/callback`,
        });

        return authUrl;
    }

    async handleOutlookCallback(code: string): Promise<EmailAccount> {
        try {
            const msalConfig = {
                auth: {
                    clientId: process.env.OUTLOOK_CLIENT_ID!,
                    authority: `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID}`,
                    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
                },
            };

            const msalInstance = new msal.ConfidentialClientApplication(
                msalConfig
            );
            const response = await msalInstance.acquireTokenByCode({
                code,
                scopes: OUTLOOK_SCOPES,
                redirectUri: `${process.env.BASE_URL}/auth/outlook/callback`,
            });

            // Get user email from Microsoft Graph API
            const graphClient = Client.init({
                authProvider: (done) => {
                    done(null, response.accessToken);
                },
            });

            const user = await graphClient.api("/me").get();

            const emailAccount: EmailAccount = {
                id: nanoid(),
                provider: "outlook",
                email: user.mail,
                accessToken: response.accessToken,
                refreshToken: "",
                expiresAt: response.expiresOn
                    ? new Date(response.expiresOn)
                    : new Date(Date.now() + 3600 * 1000),
            };

            // Save to database
            await db.insert(emailAccounts).values(emailAccount);

            return emailAccount;
        } catch (error) {
            console.error("Outlook OAuth error:", error);
            throw new Error("Failed to authenticate with Outlook");
        }
    }
}
