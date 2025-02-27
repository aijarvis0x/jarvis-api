import { isValidSuiAddress } from "@mysten/sui/utils"
import { z } from "zod"
import { paginationSchema } from "./generic-schemas.js";

export const addFavoriteBotBody = z.object({
	botId: z.string()
});

export const listTrendingBotQuery = {
	querystring: paginationSchema.merge(
		z.object({
			timeTrend: z.string().optional(),
		})
	),
} as const
