import { getItemMetadata } from "../config/items.js";
import { optionalAuthenticate } from "../plugins/optional-auth.js"
import { findBotByOnlyNftId } from "../services/bot.service.js";

import type { AppInstance } from "../types.js"


export default async (app: AppInstance) => {

  app.get("/ai-agents/:id", {
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
          "id": bot?.id,
          "nft_id": bot?.nft_id,
          "description": bot?.description,
          "external_url": `https://app.aijarvis.xyz/ai-agents/${bot.id}`,
          "image": bot?.avatar,
          "background": bot?.background,
          "name": bot?.name ?? "...",
          "attributes": bot?.attributes,
          "category_ids": bot?.category_ids,
          "avatar": bot?.avatar
        })
      } catch (error) {
        console.log(error)
        reply.status(400).send({ error: "Not Found" });
      }
    },
  });

  app.get("/fragment/:id", {
    schema: {
      tags: ["Ai-agents"],
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as any

        const itemMetadata = getItemMetadata(id)

        if (!itemMetadata) {
          throw new Error("Not Found")
        }

        return reply.send({
          ...itemMetadata
        })
      } catch (error) {
        console.log(error)
        reply.status(400).send({ error: "Not Found" });
      }
    },
  });



}
