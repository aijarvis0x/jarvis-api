import fastify from "fastify";
import { verifySignature } from "../plugins/verify-sign.js";
import {
    discordCallbackSchema,
    loginSchema,
    xCallbackSchema,
} from "../schemas/user.schema.js";
import {
    discordCallback,
    googleCallback,
    login,
    XCallback,
} from "../services/auth.service.js";
import crypto from "crypto";

import type { AppInstance } from "../types.js";
import {
    discordClient,
    DISCORD_SCOPE,
    DISCORD_CALLBACK_URI,
    DiscordToken,
    googleClient,
    GOOGLE_CALLBACK_URI,
    GOOGLE_SCOPE,
    GoogleToken,
    XClient,
    X_CALLBACK_URI,
    X_SCOPE,
    XToken,
    X_STATE,
    X_CODE_CHALLENGE,
    getXToken,
    GOOGLE_STATE,
} from "../config/o2auth.js";
import HttpClient from "../lib/axios.js";

export default async (app: AppInstance) => {
    //sign up
    app.post("/login", {
        schema: {
            tags: ["Auth"],
            body: loginSchema,
        },
        handler: async (request, reply) => {
            const { address, signature, messageHash } = request.body;

            try {
                //verify signature
                const verified = verifySignature(
                    messageHash,
                    signature,
                    address
                );

                if (!verified) {
                    return reply.status(401).send({
                        message: "Signature incorrect",
                    });
                }

                //login -> gen token
                let userData = await login(address);

                return reply.status(200).send({
                    message: "OK",
                    data: userData,
                });
            } catch (error) {
                throw error;
            }
        },
    });

    app.get("/discord/get-link", {
        schema: {
            tags: ["Auth"],
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {
            try {
                const uri = discordClient.authorizeURL({
                    redirect_uri: DISCORD_CALLBACK_URI,
                    scope: DISCORD_SCOPE,
                });
                return {
                    message: "OK",
                    data: {
                        uri,
                    },
                };
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        },
    });

    app.get("/discord/callback", {
        schema: {
            tags: ["Auth"],
            querystring: discordCallbackSchema,
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {
            try {
                const {userId} = request;
                const { code } = request.query;
                await discordCallback(code, userId);
                return {
                    message: "OK",
                    data: {},
                };
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        },
    });

    app.get("/google/get-link", {
        schema: {
            tags: ["Auth"],
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {
            try {
                const uri = googleClient.authorizeURL({
                    redirect_uri: GOOGLE_CALLBACK_URI,
                    scope: GOOGLE_SCOPE,
                    state: GOOGLE_STATE,
                });
                return {
                    message: "OK",
                    data: {
                        uri,
                    },
                };
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        },
    });

    app.get("/google/callback", {
        schema: {
            tags: ["Auth"],
            querystring: discordCallbackSchema,
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {
            try {
                const {userId} = request;
                const { code } = request.query;
                await googleCallback(code, userId);
                return {
                    message: "OK",
                    data: {},
                };
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        },
    });

    app.get("/X/get-link", {
        schema: {
            tags: ["Auth"],
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {
            try {
                const uri = XClient.authorizeURL({
                    redirect_uri: X_CALLBACK_URI,
                    scope: X_SCOPE,
                    state: X_STATE,
                    code_challenge: X_CODE_CHALLENGE,
                    code_challenge_method: "plain",
                    response_type: "code",
                });
                return {
                    message: "OK",
                    data: {
                        uri,
                    },
                };
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        },
    });

    app.get("/X/callback", {
        schema: {
            tags: ["Auth"],
            querystring: xCallbackSchema,
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {
            try {
                const {userId} = request;
                const { code, state } = request.query;
                await XCallback(code, userId);
                return {
                    message: "OK",
                    data: {},
                };
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        },
    });
};
