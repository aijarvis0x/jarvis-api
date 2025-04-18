import fastify from "fastify";
import { verifySignature } from "../plugins/verify-sign.js";
import {
    discordCallbackSchema,
    googleCallbackSchema,
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
import jwt from "jsonwebtoken"; 
import * as fs from "fs";
import CryptoJS from 'crypto-js';

const privateKEY = fs.readFileSync("./src/keys/private.pem", "utf-8");

export default async (app: AppInstance) => {
    //sign up
    app.post("/login", {
        schema: {
            tags: ["Auth"],
            body: loginSchema,
        },
        handler: async (request, reply) => {
            const { address, signature, messageHash, userRefCode } = request.body;

            try {
                //verify signature
                // const verified = verifySignature(
                //     messageHash,
                //     signature,
                //     address
                // );

                // if (!verified) {
                //     return reply.status(401).send({
                //         message: "Signature incorrect",
                //     });
                // }

                //login -> gen token
                let userData = await login(address, userRefCode);

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
                const {userId} = request;
                const state = jwt.sign({ userId }, privateKEY, { algorithm: "RS256", expiresIn: "1d" });
                const uri = discordClient.authorizeURL({
                    redirect_uri: DISCORD_CALLBACK_URI,
                    scope: DISCORD_SCOPE,
                    state
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
        handler: async (request, reply) => {
            try {
                const { code, state } = request.query;
                let userId;
                try {
                    const decoded: any = jwt.verify(state, privateKEY);
                    userId = decoded.userId;
                } catch (error) {
                    throw new Error("Invalid or expired state");
                }
                if (userId) {
                    await discordCallback(code, userId);
                    return {
                        message: "OK",
                        data: {},
                    };
                } else {
                    throw new Error("Error when connect discord account")
                }

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
                const {userId} = request;
                const state = jwt.sign({ userId }, privateKEY, { algorithm: "RS256", expiresIn: "1d" });
                const uri = googleClient.authorizeURL({
                    redirect_uri: GOOGLE_CALLBACK_URI,
                    scope: GOOGLE_SCOPE,
                    state,
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
            querystring: googleCallbackSchema,
        },
        handler: async (request, reply) => {
            try {
                const { code, state } = request.query;
                let userId;
                try {
                    const decoded: any = jwt.verify(state, privateKEY);
                    userId = decoded.userId;
                } catch (error) {
                    throw new Error("Invalid or expired state");
                }
                if (userId) {
                    await googleCallback(code, userId);
                    return {
                        message: "OK",
                        data: {},
                    };
                } else {
                    throw new Error("Error when connect google account")
                }
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
                const {userId} = request;
                const userIdJWT = CryptoJS.AES.encrypt(String(userId), privateKEY).toString();
                const uri = XClient.authorizeURL({
                    redirect_uri: X_CALLBACK_URI,
                    scope: X_SCOPE,
                    state: userIdJWT,
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
        handler: async (request, reply) => {
            try {
                const { code, state } = request.query;
                let userId;
                try {
                    const bytes = CryptoJS.AES.decrypt(state, privateKEY);
                    userId = bytes.toString(CryptoJS.enc.Utf8);
                    userId = Number(userId)
                } catch (error) {
                    throw new Error("Invalid or expired state");
                }
                if (userId) {
                    await XCallback(code, userId);
                    return {
                        message: "OK",
                        data: {},
                    };
                } else {
                    throw new Error("Error when connect X account")
                }
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        },
    });

    app.get("/get-ref-code", {
        schema: {
            tags: ["Auth"],
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {
            try {
                const {userId} = request;
                return {
                    message: "OK",
                    data: {
                        refCode: userId
                    },
                };
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        },
    });
};
