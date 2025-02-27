import fp from "fastify-plugin";
import * as fs from "fs";
import path from "path";
import type { FastifyPluginAsync } from "fastify";
import { findUserByAddress } from "../services/users.service.js";
import jwt from "jsonwebtoken"; // Use jsonwebtoken for standalone token generation

const publicKEY = fs.readFileSync("./src/keys/public.pem", "utf-8");
const privateKEY = fs.readFileSync("./src/keys/private.pem", "utf-8");

const authPlugin: FastifyPluginAsync = async (fastify) => {
    // ✅ Register Fastify JWT with RS256
    fastify.register(import("@fastify/jwt"), {
        secret: {
            private: privateKEY,
            public: publicKEY,
        },
        sign: { algorithm: "RS256", expiresIn: "1d" },
        verify: { algorithms: ["RS256"] },
    });

    // ✅ Middleware to verify JWT and attach user data
    fastify.decorate("authenticate", async (request, reply) => {
        try {
            const decoded = await request.jwtVerify();

            const { address } = decoded as { address: string };
            if (!address) {
                return reply.status(401).send({ message: "Token does not contain a valid address" });
            }

            // ✅ Find the user by address
            const user = await findUserByAddress(address);
            if (!user) {
                return reply.status(401).send({ message: "Invalid user address" });
            }

            // ✅ Attach user details to request
            request.address = address;
            request.userId = user.id;
            request.name = user.name;

        } catch (error) {
            request.log.warn("Authorization failed:", error);
            return reply.status(401).send({ message: "Token expired or invalid" });
        }
    });
};

// ✅ Function to generate JWT token (exported separately)
export const genAccessToken = (address: string): string => {
    return jwt.sign({ address }, privateKEY, { algorithm: "RS256", expiresIn: "1d" });
};

// ✅ Extend Fastify instance to include authentication functions
declare module "fastify" {
    interface FastifyInstance {
        authenticate: (request: any, reply: any) => Promise<void>;
    }

    interface FastifyRequest {
        address: string;
        userId: bigint;
        name: string;
    }
}


export default fp(authPlugin);
