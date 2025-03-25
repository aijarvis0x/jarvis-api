import { z } from "zod"
import { paginationSchema } from "./generic-schemas.js";
import { string } from "pg-format";

export const addFavoriteBotBody = z.object({
	botId: z.string()
});

export enum TimeFilterTrend {
	All = "all",
	OneHour = "1h",
	SixHours = "6h",
	TwentyHours = "20h",
	SevenDays = "7d"
}

export enum TrendType {
	Trending = "Trending",
	Top = "Top",
	PriceDesc = "PriceDesc"
}

export const listTrendingBotQuery = {
	querystring: paginationSchema.merge(
		z.object({
			timeFilterTrend: z.enum(Object.values(TimeFilterTrend) as [string, ...string[]]).default(TimeFilterTrend.All).optional(),
			trendType: z.enum(Object.values(TrendType) as [string, ...string[]]).optional().default(TrendType.Trending),
		})
	),
} as const
