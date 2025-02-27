import { verifySignature } from "../plugins/verify-sign.js"
import {
    loginSchema
} from "../schemas/user.schema.js"
import { login } from "../services/auth.service.js"

import type { AppInstance } from "../types.js"


export default async (app: AppInstance) => {
    //sign up
    app.post("/login", {
        schema: {
            tags: ["Auth"],
            body: loginSchema,
        },
        handler: async (request, reply) => {
            const { address, signature, messageHash } = request.body

            try {

                //verify signature
                const verified = await verifySignature(messageHash, signature, address)

                if(!verified) {
                    return reply.status(401).send({
                        message: "Signature incorrect",
                    })
                }

                //login -> gen token
                let userData = await login(address)

                return reply.status(200).send({
                    message: "OK",
                    data: userData
                })
            } catch (error) {
                throw error
            }
        },
    })

}
