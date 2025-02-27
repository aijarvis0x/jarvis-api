import * as Sentry from "@sentry/node"
import { nodeProfilingIntegration } from "@sentry/profiling-node"

console.log("Instrumenting the application", process.env.NODE_ENV)

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://2c6195f54f08d1197a23847753dffb11@o4506677110571008.ingest.us.sentry.io/4507787901206528",
    integrations: [nodeProfilingIntegration()],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
    // Ignore errors from certain sources
    ignoreErrors: [
      /ZodError/,
      /NotFoundError/,
      /ForbiddenError/,
      /BadRequestError/,
      /UnauthorizedError/,
      "/Rate limit exceeded/",
    ],
  })
}
