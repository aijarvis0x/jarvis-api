import type { Redis } from "./lib/redis.js"

/* Core */
export type { AppInstance, AppRequest, AppReply } from "./app.js"

/* Container */
declare module "./lib/container.js" {
  interface ContainerRegistry {
    redis: Redis
  }
}
