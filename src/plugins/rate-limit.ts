import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import fastifyRateLimit from "@fastify/rate-limit"
import { Redis } from "ioredis"
import { getRedisClientOptions } from "../lib/redis.js"

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  void fastify.register(fastifyRateLimit, {
    global: false, // disable rate limiting run on all routes
    max: 60, // limit 60 requests per minute by default
    timeWindow: "1 minute",
    nameSpace: "rate-limit:",
    redis: new Redis(getRedisClientOptions("RateLimit", { db: 11 })),
    keyGenerator: (request) => {
      const ip =
        request.headers["x-real-ip"] ||
        request.headers["x-client-ip"] ||
        request.ip

      return request?.userId
        ? `userId:${request?.userId} - address: ${request?.address}`
        : `ip:${ip}`
    },
  })
}

export default fp(rateLimitPlugin)
