import { z } from "zod"
import { paginationSchema } from "./generic-schemas.js"

export const createDepositNftReqSchema = z.object({
  reciever: z
    .string(),

  xids: z.array(z.number()).max(5, "xids can have a maximum of 5 NFT"),
})

export const listMarketSchema = {
  querystring: paginationSchema.merge(
    z.object({
      search: z.string().optional(),
      isOwner: z.boolean().optional(),
      categoryIds: z.array(z.number().positive()).optional(),
    })
  ),
} as const

export const ordersHistorySchema = {
  querystring: paginationSchema,
} as const
