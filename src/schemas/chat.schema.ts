import { z } from "zod"
import { paginationSchema } from "./generic-schemas.js"

export const createConversationBody = z.object({
  botId: z.string()
});


export const getListConversationSchema = {
  querystring: paginationSchema.merge(
    z.object({
      search: z.string().optional(),
    })
  ),
} as const


export const sendMessageBody = z.object({
  conversationId: z.string(),
  text: z.string(),
  agentId: z.string(),
  categoryId: z.string().optional().default("1")
});