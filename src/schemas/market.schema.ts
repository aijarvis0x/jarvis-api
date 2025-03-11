import { z } from "zod"
import { paginationSchema } from "./generic-schemas.js"

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
