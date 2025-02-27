import type { FastifyPluginCallback } from "fastify"
import fp from "fastify-plugin"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import { jsonSchemaTransform } from "./fastify-zod.js"

const swaggerPlugin: FastifyPluginCallback = (fastify, _options, done) => {
  if (process.env.NODE_ENV === "production") {
    return done()
  }

  void fastify.register(fastifySwagger, {
    transform: jsonSchemaTransform,
    openapi: {
      info: {
        title: "App API",
        description: "API documentation for Application",
        version: "0.0.1",
      },
      components: {
        securitySchemes: {
          apiKey: {
            type: "apiKey",
            name: "authorization",
            in: "header",
          },
        },
      },
    },
  })

  void fastify.register(fastifySwaggerUi, {
    routePrefix: "/documentation",
  })

  done()
}

export default fp(swaggerPlugin)
