import { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import fastifyCsrfProtection, {
  type FastifyCsrfProtectionOptions,
} from "@fastify/csrf-protection"

const csrfPlugin: FastifyPluginAsync = async (fastify) => {
  void fastify.register<FastifyCsrfProtectionOptions>(fastifyCsrfProtection, {
    getToken: (req) =>
      (req.body && (req.body as any)._csrf) ||
      ((req.headers["x-csrf-token"] || req.headers["csrf-token"]) as string),
  })

  // All routes should add a CSRF token to the response
  fastify.addHook("onRequest", (_req, reply, done) => {
    const token = reply.generateCsrf()

    // Path is necessary to ensure that only one cookie is set and it is valid
    // for all routes.
    void reply.setCookie("csrf_token", token, {
      path: "/",
      sameSite: "none",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      domain: process.env.NODE_ENV === "production" ? ".aijarvis.xyz" : undefined,
    })

    done()
  })
}

export default fp(csrfPlugin)
