import closeWithGrace from "close-with-grace"
import { bootstrap } from "../bootstrap.js"
import { container } from "../lib/container.js"
import { StartJobs } from "./actions/StartJobs.js"
import { configuration } from "./config.js"
import { logger } from "./logger.js"
import { NFT_PACKAGE_ID } from "../env.js"

async function run(): Promise<void> {
  logger.info(`Started on environment ${configuration.environment}`)
  await bootstrap(container)

  const startJobs = new StartJobs({
    packageId: NFT_PACKAGE_ID,
    initialBlock: 80479178,
  })

  await startJobs.run()

  closeWithGrace(async ({ signal, err }) => {
    if (err) {
      logger.error("server closing with error", err)
    } else {
      logger.info(`${signal} received, process closing`)
    }
  })
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

run().catch((e) => {
  logger.error("Fatal error caused process to exit", e)
})
