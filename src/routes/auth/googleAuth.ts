import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/api/auth/google/callback"
);

export const getGoogleAuthURL = () => {
    const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/gmail.readonly",
    ];

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
    });
};

export const handleGoogleCallback = async (code: string) => {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
};
