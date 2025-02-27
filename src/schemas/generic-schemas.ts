import { z } from "zod"

export const responseErrorSchema = z.object({
  statusCode: z.string(),
  error: z.string(),
  message: z.string(),
})

export const paginationSchema = z.object({
  page: z.coerce.number().optional().default(1).catch(1),
  // perPage: z.coerce.number().min(1).max(100).optional().default(10).catch(10),
})

export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
})
