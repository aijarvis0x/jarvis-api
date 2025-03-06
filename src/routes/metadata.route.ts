import { optionalAuthenticate } from "../plugins/optional-auth.js"
import { findBotByOnlyNftId } from "../services/bot.service.js";

import type { AppInstance } from "../types.js"


export default async (app: AppInstance) => {

  app.get("/:id", {
    schema: {
      tags: ["Ai-agents"],
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as any

        const bot = await findBotByOnlyNftId(id)

        if (!bot) {
          throw new Error("Not Found")
        }

        return reply.send({
          "description": bot?.description,
          "external_url": `https://app.javis.xyz/ai-agents/${bot.id}`,
          "image": bot?.avatar,
          "name": bot?.name ?? "Test",
          "attributes": bot?.attributes
        })
      } catch (error) {
        console.log(error)
        reply.status(400).send({ error: "Not Found" });
      }
    },
  });

}
