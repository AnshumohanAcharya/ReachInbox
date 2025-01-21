import { OAuth2Client } from "google-auth-library";

export const GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.labels",
];

export const OUTLOOK_SCOPES = ["Mail.Read", "Mail.Send", "Mail.ModifyLabels"];

// Gmail OAuth Configuration
export const gmailOAuth2Client = new OAuth2Client({
    clientId: process.env.GMAIL_CLIENT_ID!,
    clientSecret: process.env.GMAIL_CLIENT_SECRET!,
    redirectUri: `${process.env.BASE_URL}/auth/gmail/callback`,
});
