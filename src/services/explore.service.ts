import { db } from "../lib/pg.js";
import { v4 as uuidv4 } from "uuid";
import { client } from "../core-ai/api.lib.js";
import { QueryConfig } from "pg";
import { findBotById, findBotByIdNonOwner } from "./bot.service.js";
import { BotState, OrderState } from "../constants.js";
import { TimeFilterTrend, TrendType } from "../schemas/explore.schema.js";

export const getPhotoFilterBot = async (userId: bigint, limit: number, offset: number, page: number) => {
	try {
		const statement: QueryConfig = {
			name: "findRecommendedBot",
			text: `SELECT b.*, o.price 
						FROM bots b 
						JOIN orders o ON b.id = o.bot_id 
						WHERE o.state = $1 
						ORDER BY RANDOM() 
						LIMIT $2 OFFSET $3`,
			values: [OrderState.Listed, limit, offset],
		};

		const countQuery = `
			SELECT COUNT(*)
			FROM bots b 
			JOIN orders o ON b.id = o.bot_id 
			WHERE o.state = '${OrderState.Listed}'
		`
		
		const [botsResult, countResult] = await Promise.all([
			db.pool.query(statement),
			db.pool.query(countQuery),
		]);

		const totalCount = parseInt(countResult.rows[0].count, 10);
		const totalPages = Math.ceil(totalCount / limit);

		return {
			bots: botsResult.rows,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
			},
		};
	} catch (error) {
		throw error;
	}
};

export const getTrendingBot = async (userId: bigint, limit: number, offset: number, page: number, timeFilterTrend: string, trendType: string) => {
	try {
		let orderState;
		let conditionState = `TRUE`;
		switch (timeFilterTrend) {
			case TimeFilterTrend.All:
				conditionState = `TRUE`
				break;
			case TimeFilterTrend.OneHour:
				conditionState = `order_created_at >= NOW() - INTERVAL '1 hour'`
				break;
			case TimeFilterTrend.SixHours:
				conditionState = `order_created_at >= NOW() - INTERVAL '6 hours'`
				break;
			case TimeFilterTrend.TwentyHours:
				conditionState = `order_created_at >= NOW() - INTERVAL '20 hours'`
				break;
			case TimeFilterTrend.SevenDays:
				conditionState = `order_created_at >= NOW() - INTERVAL '7 days'`
				break;
			default:
				conditionState = `TRUE`;
				break;
		}

		switch (trendType) {
			case TrendType.Trending:
				orderState = `ORDER BY RANDOM()`
				break;
			case TrendType.Top:
				orderState = `ORDER BY RANDOM()`
				break;
			case TrendType.PriceDesc:
				orderState = `ORDER BY price DESC`
			default:
				orderState = `ORDER BY RANDOM()`
				break;
		}
		const baseQuery = `
			SELECT
				*
			FROM (
				SELECT 
					b.*, 
					o.price,
					ROW_NUMBER() OVER (PARTITION BY b.id ORDER BY b.created_at DESC) AS rank,
					o.created_at as order_created_at
				FROM bots b 
				JOIN orders o ON b.id = o.bot_id 
				WHERE o.state = '${OrderState.Listed}'
			) a
			WHERE a.rank = 1 AND ${conditionState}
		`

		const statement = `
		SELECT *
		FROM (${baseQuery}) a
		${orderState}
		LIMIT $1 OFFSET $2
		`
		const countQuery = `
			SELECT COUNT(*)
			FROM (${baseQuery}) a
		`
		
		const [botsResult, countResult] = await Promise.all([
			db.pool.query(statement, [limit, offset]),
			db.pool.query(countQuery),
		]);

		const totalCount = parseInt(countResult.rows[0].count, 10);
		const totalPages = Math.ceil(totalCount / limit);

		return {
			bots: botsResult.rows,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
			},
		};
	} catch (error) {
		throw error;
	}
};

export const getFunAndMemeBot = async (userId: bigint, limit: number, offset: number, page: number) => {
	try {
		const statement: QueryConfig = {
			name: "getAIDevelopmentAndWeb3Bot",
			text: `SELECT b.*, o.price 
						FROM bots b 
						JOIN orders o ON b.id = o.bot_id 
						WHERE o.state = $1 
						ORDER BY RANDOM() 
						LIMIT $2 OFFSET $3`,
			values: [OrderState.Listed, limit, offset],
		};

		const countQuery = `
			SELECT COUNT(*)
			FROM bots b 
			JOIN orders o ON b.id = o.bot_id 
			WHERE o.state = '${OrderState.Listed}'
		`
		
		const [botsResult, countResult] = await Promise.all([
			db.pool.query(statement),
			db.pool.query(countQuery),
		]);

		const totalCount = parseInt(countResult.rows[0].count, 10);
		const totalPages = Math.ceil(totalCount / limit);

		return {
			bots: botsResult.rows,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
			},
		};
	} catch (error) {
		throw error;
	}
};

export const getTopPickBot = async (userId: bigint, limit: number, offset: number, page: number) => {
	try {
		const statement: QueryConfig = {
			name: "getContentAndCreativityBot",
			text: `SELECT b.*, o.price 
						FROM bots b 
						JOIN orders o ON b.id = o.bot_id 
						WHERE o.state = $1 
						ORDER BY RANDOM() 
						LIMIT $2 OFFSET $3`,
			values: [OrderState.Listed, limit, offset],
		};

		const countQuery = `
			SELECT COUNT(*)
			FROM bots b 
			JOIN orders o ON b.id = o.bot_id 
			WHERE o.state = '${OrderState.Listed}'
		`
		
		const [botsResult, countResult] = await Promise.all([
			db.pool.query(statement),
			db.pool.query(countQuery),
		]);

		const totalCount = parseInt(countResult.rows[0].count, 10);
		const totalPages = Math.ceil(totalCount / limit);

		return {
			bots: botsResult.rows,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
			},
		};
	} catch (error) {
		throw error;
	}
};

export const getAutomationAndProductivityBot = async (userId: bigint, limit: number, offset: number, page: number) => {
	try {
		const statement: QueryConfig = {
			name: "getAutomationAndProductivityBot",
			text: `SELECT b.*, o.price 
						FROM bots b 
						JOIN orders o ON b.id = o.bot_id 
						WHERE o.state = $1 
						ORDER BY RANDOM() 
						LIMIT $2 OFFSET $3`,
			values: [OrderState.Listed, limit, offset],
		};

		const countQuery = `
			SELECT COUNT(*)
			FROM bots b 
			JOIN orders o ON b.id = o.bot_id 
			WHERE o.state = '${OrderState.Listed}'
		`
		
		const [botsResult, countResult] = await Promise.all([
			db.pool.query(statement),
			db.pool.query(countQuery),
		]);

		const totalCount = parseInt(countResult.rows[0].count, 10);
		const totalPages = Math.ceil(totalCount / limit);

		return {
			bots: botsResult.rows,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
			},
		};
	} catch (error) {
		throw error;
	}
};

export const getNewListBot = async (userId: bigint, limit: number, offset: number, page: number) => {
	try {
		const statement: QueryConfig = {
			name: "getNewListBot",
			text: `SELECT b.*, o.price 
						FROM orders o 
						JOIN bots b ON b.id = o.bot_id 
						WHERE o.state = $1 
						ORDER BY o.updated_at DESC 
						LIMIT $2 OFFSET $3`,
			values: [OrderState.Listed, limit, offset],
		};

		const countQuery = `
			SELECT COUNT(*)
			FROM orders o 
			JOIN bots b ON b.id = o.bot_id 
			WHERE o.state = '${OrderState.Listed}'
		`
		
		const [botsResult, countResult] = await Promise.all([
			db.pool.query(statement),
			db.pool.query(countQuery),
		]);

		const totalCount = parseInt(countResult.rows[0].count, 10);
		const totalPages = Math.ceil(totalCount / limit);

		return {
			bots: botsResult.rows,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
			},
		};
	} catch (error) {
		throw error;
	}
};

export const addBotToFavorite = async (userId: bigint, botId: string) => {
	try {
		const query = `
    INSERT INTO favorite_bot (
      user_id,
			bot_id,
			created_at
    ) VALUES (
      $1,
			$2,
			NOW()
    ) RETURNING *;
  `;

  const values = [
    userId,
    botId
  ];

  const result = await db.pool.query(query, values);

  const favoriteBot = result.rows?.[0] ?? null;

		return favoriteBot;
	} catch (error) {
		throw error;
	}
};

export const getFavoriteAndTalkedBot = async (userId: bigint, limit: number, offset: number, page: number) => {
	try {
		const statement: QueryConfig = {
			name: "getFavoriteAndTalkedBot",
			text: `SELECT b.*, k.bot_type
						FROM (
							SELECT * FROM
							(
								SELECT bot_id::BIGINT, 'talked_bot' AS bot_type FROM conversations WHERE user_id = $1
							) UNION ALL (
								SELECT bot_id::BIGINT, 'favorite_bot' AS bot_type FROM favorite_bot WHERE user_id = $1
							)
						) k
						JOIN bots b on k.bot_id = b.id
						ORDER BY k.bot_type, b.updated_at DESC 
						LIMIT $2 OFFSET $3`,
			values: [userId, limit, offset],
		};

		const countQuery = `
			SELECT COUNT(*)
			FROM (
				SELECT * FROM
				(
					SELECT bot_id::BIGINT, 'talked_bot' AS bot_type FROM conversations WHERE user_id = $1
				) UNION ALL (
					SELECT bot_id::BIGINT, 'favorite_bot' AS bot_type FROM favorite_bot WHERE user_id = $1
				)
			) k
			JOIN bots b on k.bot_id = b.id
		`
		
		const [botsResult, countResult] = await Promise.all([
			db.pool.query(statement),
			db.pool.query(countQuery, [userId]),
		]);

		const totalCount = parseInt(countResult.rows[0].count, 10);
		const totalPages = Math.ceil(totalCount / limit);

		return {
			bots: botsResult.rows,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
			},
		};
	} catch (error) {
		throw error;
	}
};



