import type { AwilixContainer } from "awilix"
import { asFunction } from "./lib/container.js"
import type { Logger } from "./lib/logger.js"
import { Redis } from "./lib/redis.js"

export async function bootstrap(container: AwilixContainer, logger?: Logger) {
  Redis.Instance.init()
  container.register(
    "redis",
    asFunction(() => Redis.Instance)
      .singleton()
      .disposer(() => Redis.Instance.close())
  )
}
