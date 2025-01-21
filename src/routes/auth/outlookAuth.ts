import { AuthorizationCode } from "simple-oauth2";
import dotenv from "dotenv";

dotenv.config();

const client = new AuthorizationCode({
    client: {
        id: process.env.OUTLOOK_CLIENT_ID!,
        secret: process.env.OUTLOOK_CLIENT_SECRET!,
    },
    auth: {
        tokenHost: "https://login.microsoftonline.com",
        authorizePath: "/common/oauth2/v2.0/authorize",
        tokenPath: "/common/oauth2/v2.0/token",
    },
});

export const getOutlookAuthURL = () => {
    const url = client.authorizeURL({
        redirect_uri: "http://localhost:3000/api/auth/outlook/callback",
        scope: ["openid", "profile", "offline_access", "Mail.Read"],
    });
    return url;
};

export const handleOutlookCallback = async (code: string) => {
    const tokenParams = {
        code,
        redirect_uri: "http://localhost:3000/api/auth/outlook/callback",
    };

    const accessToken = await client.getToken(tokenParams);
    return accessToken.token;
};
