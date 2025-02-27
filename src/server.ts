import "./polyfill.js"
import "./env.js"
import closeWithGrace from "close-with-grace"
import { build } from "./app.js"
import { bootstrap } from "./bootstrap.js"
import { container } from "./lib/container.js"
import { createLogger } from "./lib/logger.js"
import { db } from "./lib/pg.js"
import { isMaxmemoryPolicyNoeviction } from "./lib/redis.js"

const logger = createLogger("Server")

async function preReady() {
  if (!(await isMaxmemoryPolicyNoeviction())) {
    throw new Error(
      "Invalid redis configuration: redis instance must have the setting maxmemory-policy=noeviction"
    )
  }
}

async function start() {
  if (process.env.NODE_ENV === "production") {
    await preReady()
  }

  logger.info("Building the application...")
  await bootstrap(container, logger)

  const app = await build(container, {
    loggerInstance: logger,
    disableRequestLogging: true,
    trustProxy: true,
  })

  // delay is the number of milliseconds for the graceful close to finish
  closeWithGrace(
    {
      delay: Number.parseInt(
        process.env.FASTIFY_CLOSE_GRACE_DELAY ?? "500",
        10
      ),
    },
    async ({ err, signal }) => {
      if (err) {
        app.log.error(err, "server closing with error")
      } else {
        app.log.info(`${signal} received, server closing`)
      }

      app.log.info("Gracefully closing the app...")
      try {
        await Promise.all([
          container.dispose(),
          db.close(),
          app.close(),
        ])
      } catch (err) {
        console.error(err)
      }
    }
  )

  // Wait for the app to be ready before listening
  await app.ready()

  // Init the server
  const port = Number(process.env.PORT || 3000)
  const host = process.env.HOST || "127.0.0.1"

  app.listen({ port, host }, (err) => {
    if (err) {
      app.log.error(err, "Server failed to start")
      process.exit(1)
    }
  })
}

start().catch(console.error)

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
})
