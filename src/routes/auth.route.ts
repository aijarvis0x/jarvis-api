import fastify from "fastify"
import { verifySignature } from "../plugins/verify-sign.js"
import {
    discordCallbackSchema,
    loginSchema,
    xCallbackSchema
} from "../schemas/user.schema.js"
import { login } from "../services/auth.service.js"
import crypto from 'crypto';

import type { AppInstance } from "../types.js"
import { discordClient, DISCORD_SCOPE, DISCORD_CALLBACK_URI, DiscordToken, googleClient, GOOGLE_CALLBACK_URI, GOOGLE_SCOPE, GoogleToken, XClient, X_CALLBACK_URI, X_SCOPE, XToken, X_STATE, X_CODE_CHALLENGE, getXToken } from "../config/o2auth.js"
import HttpClient from "../lib/axios.js"

export default async (app: AppInstance) => {
    //sign up
    app.post("/login", {
        schema: {
            tags: ["Auth"],
            body: loginSchema,
        },
        handler: async (request, reply) => {
            const { address, signature, messageHash } = request.body

            try {

                //verify signature
                const verified = verifySignature(messageHash, signature, address)

                if(!verified) {
                    return reply.status(401).send({
                        message: "Signature incorrect",
                    })
                }

                //login -> gen token
                let userData = await login(address)

                return reply.status(200).send({
                    message: "OK",
                    data: userData
                })
            } catch (error) {
                throw error
            }
        },
    })

    app.get("/discord/get-link", {
        schema: {
            tags: ["Auth"],
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {
            try {
                const uri = discordClient.authorizeURL({
                    redirect_uri: DISCORD_CALLBACK_URI,
                    scope: DISCORD_SCOPE
                });
                return {
                    message: "OK",
                    data: {
                        uri
                    }
                }
            } catch (error) {
                throw error;
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
                const { code } = request.query;
                
                try {
                    const token: DiscordToken = await discordClient.getToken({
                        code,
                        redirect_uri: DISCORD_CALLBACK_URI
                    });

                    const discordServerClient = new HttpClient({
                        baseURL: "https://discord.com",
                        timeout: 100000,
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `${token.token.token_type} ${token.token.access_token}`
                        },
                    })

                    const response = await discordServerClient.get(`/api/users/@me`)

                    if (response.status == 200) {
                        return response.data;
                    } else {
                        throw new Error(`No response from discord server`);
                    }
                } catch (err) {
                    reply.code(500).send({ error: "Authentication failed" });
                }
            } catch (error) {
                throw error;
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
                    state: 'random_string_for_security'
                });
                return {
                    message: "OK",
                    data: {
                        uri
                    }
                }
            } catch (error) {
                throw error;
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
                const { code } = request.query;
                
                try {
                    const token: GoogleToken = await googleClient.getToken({
                        code,
                        redirect_uri: GOOGLE_CALLBACK_URI
                    });
                    console.log(token);
                    
                    const googleServerClient = new HttpClient({
                        baseURL: "https://www.googleapis.com",
                        timeout: 100000,
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `${token.token.token_type} ${token.token.access_token}`
                        },
                    })

                    const response = await googleServerClient.get(`/oauth2/v3/userinfo`)

                    if (response.status == 200) {
                        return response.data;
                    } else {
                        throw new Error(`No response from discord server`);
                    }
                } catch (err) {
                    reply.code(500).send({ error: "Authentication failed" });
                }
            } catch (error) {
                throw error;
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
                    code_challenge_method: 'plain',
                    response_type: 'code'
                });
                return {
                    message: "OK",
                    data: {
                        uri
                    }
                }
            } catch (error) {
                throw error;
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
                const { code, state } = request.query;
                
                try {
                    const token: XToken = await getXToken(code);

                    const XServerClient = new HttpClient({
                        baseURL: "https://api.x.com/2",
                        timeout: 100000,
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `${token.token_type} ${token.access_token}`
                        },
                    })

                    const response = await XServerClient.get(`/users/me`)

                    if (response.status == 200) {
                        return response.data;
                    } else {
                        throw new Error(`No response from discord server`);
                    }
                } catch (err) {
                    console.log(err);
                    
                    reply.code(500).send({ error: "Authentication failed" });
                }
            } catch (error) {
                throw error;
            }
        },
    });

}
