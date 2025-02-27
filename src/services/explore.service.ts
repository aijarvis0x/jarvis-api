import { db } from "../lib/pg.js";
import { v4 as uuidv4 } from "uuid";
import { client } from "../core-ai/api.lib.js";
import { QueryConfig } from "pg";
import { findBotById, findBotByIdNonOwner } from "./bot.service.js";
import { BotState, OrderState } from "../constants.js";

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

export const getTrendingBot = async (userId: bigint, limit: number, offset: number, page: number, timeTrend: string) => {
	try {
		const statement: QueryConfig = {
			name: "getConversationalBot",
			text: `
						SELECT *
						FROM (
							SELECT b.*, o.price,
							ROW_NUMBER() OVER (ORDER BY b.id) AS rank
							FROM bots b 
							JOIN orders o ON b.id = o.bot_id 
							WHERE o.state = $1 
							ORDER BY RANDOM() 
							LIMIT $2 OFFSET $3
						)
						ORDER BY rank`,
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



