import type { FastifyError } from "@fastify/error"
import { ZodError } from "zod"
import { fromError } from "zod-validation-error"
import type { AppInstance } from "../app.js"

const knownAuthErrors = new Set([
  "FST_JWT_NO_AUTHORIZATION_IN_HEADER",
  "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED",
  "FST_JWT_AUTHORIZATION_TOKEN_INVALID",
])

/**
 * The global error handler for all the uncaught exceptions within a request.
 * We try our best to display meaningful information to our users
 * and log any error that occurs
 * @param app
 */
export const setErrorHandler = (app: AppInstance) => {
  app.setErrorHandler((error, _request, reply) => {
    // We assign the error received.
    // it will be logged in the request log plugin
    // reply.executionError = error

    // Validation errors
    if (error instanceof ZodError) {
      if (error?.flatten?.()?.formErrors?.length > 0) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Body should be a JSON object",
        })
      }

      const validationError = fromError(error)
      const statusCode = error.validationContext === "params" ? 404 : 422

      return reply.status(statusCode).send({
        statusCode,
        message: validationError.message,
        errors: error.flatten().fieldErrors,
      })
    }

    // Fastify errors
    if ("statusCode" in error) {
      const err = error as FastifyError
      return reply.status((error as any).statusCode || 500).send({
        statusCode: err.statusCode,
        error: err.name,
        message: err.message,
      })
    }

    // Log the unknown error
    _request.log.error(error)

    reply.status(500).send({
      statusCode: 500,
      error: "Internal",
      message: "Internal Server Error",
    })
  })
}
