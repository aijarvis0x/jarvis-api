import fastify, {
  type ContextConfigDefault,
  type FastifyBaseLogger,
  type FastifyHttpOptions,
  type FastifyInstance,
  type FastifyPluginAsync,
  type FastifyPluginCallback,
  type FastifyPluginOptions,
  type FastifyReply,
  type FastifyRequest,
  type FastifySchema,
  type RawReplyDefaultExpression,
  type RawRequestDefaultExpression,
  type RawServerBase,
  type RawServerDefault,
  type RouteGenericInterface,
} from "fastify"
import fastifyCookie from "@fastify/cookie"
import cors from "@fastify/cors"
import fastifySensible from "@fastify/sensible"
import * as Sentry from "@sentry/node"
import type { AwilixContainer } from "awilix"
import * as env from "./env.js"
import type { Container } from "./lib/container.js"
import authPlugin from "./plugins/auth.js"
import csrfPlugin from "./plugins/csrf.js"
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "./plugins/fastify-zod.js"
import rateLimitPlugin from "./plugins/rate-limit.js"
import securityHeaders from "./plugins/security-headers.js"
import swaggerPlugin from "./plugins/swagger.js"
import routes from "./routes/index.js"
import { setErrorHandler } from "./utils/error-handler.js"

export type AppInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ZodTypeProvider
>

export type AppPluginCallback<
  Options extends FastifyPluginOptions = Record<never, never>,
  Server extends RawServerBase = RawServerDefault,
> = FastifyPluginCallback<Options, Server, ZodTypeProvider>

export type AppPluginAsync<
  Options extends FastifyPluginOptions = Record<never, never>,
  Server extends RawServerBase = RawServerDefault,
> = FastifyPluginAsync<Options, Server, ZodTypeProvider>

export type AppRequest<SchemaCompiler extends FastifySchema> = FastifyRequest<
  RouteGenericInterface,
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  SchemaCompiler,
  ZodTypeProvider
>

export type AppReply<SchemaCompiler extends FastifySchema = any> = FastifyReply<
  RouteGenericInterface,
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  ContextConfigDefault,
  SchemaCompiler,
  ZodTypeProvider
>

declare module "fastify" {
  interface FastifyInstance {
    container: Container
  }

  interface FastifyRequest {
    scope: Container
  }
}

/**
 * Top-level wrapper to instantiate the API server. This is where all middleware and
 * routes should be mounted.
 */
export const build = async (
  container: AwilixContainer,
  options: FastifyHttpOptions<RawServerDefault> = {}
): Promise<AppInstance> => {
  const app = fastify({
    ...options,
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // app.register(cors, {
  //   origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://test.5son.ai", "https://api.5son.ai", "https://5son.ai"],
  //   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  //   credentials: true,
  // });

  app.register(cors, {
    origin: ["https://test.5son.ai", "https://app.5son.ai"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  });

  app.register(fastifySensible)
  app.register(fastifyCookie, {
    secret: env.ENCRYPTION_KEY,
  })

  app.register(securityHeaders)
  app.register(swaggerPlugin)
  app.register(authPlugin)
  app.register(rateLimitPlugin)

  // Fastify decorate
  app.decorate("container", {
    getter: () => container,
  })

  app.addHook("onRequest", (request, _reply, done) => {
    request.scope = container.createScope()
    done()
  })
  app.addHook("onResponse", async (request, _reply) => {
    if (request.scope) {
      await request.scope.dispose()
    }
  })

  // Routes
  app.get("/", async () => ({ hello: "world!" }))
  app.register(routes)

  Sentry.setupFastifyErrorHandler(app)
  setErrorHandler(app)

  return app
}
