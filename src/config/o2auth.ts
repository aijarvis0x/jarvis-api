import { AuthorizationCode } from "simple-oauth2";
import oauthPlugin from "@fastify/oauth2";
import { number } from "zod";
import HttpClient from "../lib/axios.js";
import { stringify } from "qs";

export const discordClient = new AuthorizationCode({
    client: {
        id: process.env.DISCORD_CLIENT_ID,
        secret: process.env.DISCORD_CLIENT_SECRET,
    },
    auth: oauthPlugin.fastifyOauth2.DISCORD_CONFIGURATION,
});

export const DISCORD_SCOPE = ["identify", "email"];
export const DISCORD_CALLBACK_URI =
    `${process.env.SERVER_URI}/api/auth/discord/callback`;

export type DiscordToken = {
    token: {
        token_type: string;
        access_token: string;
        expires_in: number;
        refresh_token: string;
        scope: string;
        expires_at: string;
    };
};

export type DiscordMeResponse = {
    id: string;
    username: string;
    avatar: string;
    discriminator: string;
    public_flags: number;
    flags: number;
    banner: string;
    accent_color: string;
    global_name: string;
    avatar_decoration_data: string;
    collectibles: string;
    banner_color: string;
    clan: string;
    primary_guild: string;
    mfa_enabled: boolean;
    locale: string;
    premium_type: number;
    email: string;
    verified: boolean;
};

export const googleClient = new AuthorizationCode({
    client: {
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET,
    },
    auth: oauthPlugin.fastifyOauth2.GOOGLE_CONFIGURATION,
    options: {
        authorizationMethod: "body", // Gửi client_id và client_secret trong body
    },
});

export const GOOGLE_SCOPE = ["profile", "email"];
export const GOOGLE_CALLBACK_URI =
    `${process.env.SERVER_URI}/api/auth/google/callback`;
export const GOOGLE_STATE = "random_string_for_security"

export type GoogleToken = {
    token: {
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
        id_token: string;
        expires_at: string;
    };
};

export type GoogleMeResponse = {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
};

export const XClient = new AuthorizationCode({
    client: {
        id: process.env.X_CLIENT_ID,
        secret: process.env.X_CLIENT_SECRET,
    },
    auth: {
        tokenHost: "https://x.com",
        tokenPath: "/i/oauth2/token",
        authorizePath: "/i/oauth2/authorize",
    },
});

export async function getXToken(code: string): Promise<XToken> {
    try {
        const authHeader = Buffer.from(
            `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
        ).toString("base64");
        const XServerClient = new HttpClient({
            baseURL: "https://api.x.com",
            timeout: 100000,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${authHeader}`,
            },
        });

        const response = await XServerClient.post(
            `/2/oauth2/token`,
            stringify({
                code,
                grant_type: "authorization_code",
                client_id: process.env.X_CLIENT_ID,
                redirect_uri: X_CALLBACK_URI,
                code_verifier: X_CODE_CHALLENGE,
            })
        );

        return response.data;
    } catch (error) {
        // console.log(error);
        throw error;
    }
}

export const X_SCOPE = ["tweet.read", "users.read", "offline.access"];
export const X_CALLBACK_URI = `${process.env.SERVER_URI}/api/auth/X/callback`;
export const X_STATE = "state";
export const X_CODE_CHALLENGE = "abc";

export type XToken = {
    token_type: string;
    expires_in: number;
    access_token: string;
    scope: string;
    refresh_token: string;
};

export type XMeResponse = {
    data: {
        id: string;
        name: string;
        username: string;
    };
};
``