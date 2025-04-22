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
import { getMyItems } from "../services/item.service.js";
import { getItemConfig } from "../config/items.js";

const privateKEY = fs.readFileSync("./src/keys/private.pem", "utf-8");

export default async (app: AppInstance) => {
    //sign up
    app.get("/my-items", {
        schema: {
            tags: ["Item"],
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {
            try {
                const {userId} = request;
                const result = await getMyItems(userId)
                return {
                    message: "OK",
                    data: {
                        items: result
                    },
                };
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        },
    });

    app.get("/items-config", {
        schema: {
            tags: ["Item"],
        },
        handler: async (request, reply) => {
            try {
                return {
                    message: "OK",
                    data: {
                        itemConfigs: getItemConfig()
                    },
                };
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        },
    });

};
