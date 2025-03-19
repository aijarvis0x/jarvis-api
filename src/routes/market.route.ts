import { BotState } from "../constants.js";
import { db } from "../lib/pg.js";
import { optionalAuthenticate } from "../plugins/optional-auth.js";
import { paginationSchema } from "../schemas/generic-schemas.js";
import { listMarketSchema } from "../schemas/market.schema.js";

import type { AppInstance } from "../types.js"


export default async (app: AppInstance) => {


  app.get("/list", {
    schema: {
      tags: ["Market"],
      querystring: listMarketSchema.querystring,
    },
    onRequest: optionalAuthenticate,
    handler: async (request, reply) => {
      try {
        const { search, isOwner, categoryIds, page = 1, perPage } = request.query as {
          search?: string;
          isOwner?: boolean;
          categoryIds?: number[];
          page: number;
          perPage: number
        };

        const limit = perPage
        const { userId } = request;
        const offset = (page - 1) * limit;

        const preJoinWhereClauses: string[] = ["state = 'listed'"];
        const postJoinWhereClauses: string[] = [];
        const values: (string | number | boolean)[] = [];
        let index = 1;

        if (isOwner && !!userId) {
          preJoinWhereClauses.push(`seller_id = $${index}`);
          values.push(String(userId));
          index++;
        }

        if (search) {
          preJoinWhereClauses.push(`(tag ILIKE $${index} OR sub_tag ILIKE $${index})`);
          values.push(`%${search}%`);
          index++;

          postJoinWhereClauses.push(`(b.name ILIKE $${index})`);
          values.push(`%${search}%`);
          index++;
        }

        if (categoryIds && categoryIds.length > 0) {
          postJoinWhereClauses.push(`(
            SELECT COUNT(*)
            FROM jsonb_array_elements_text(b.category_ids) AS cat_id
            WHERE cat_id::int = ANY(ARRAY[${categoryIds.map((_, i) => `$${index + i}`).join(", ")}])
          ) > 0`);
          values.push(...categoryIds);
          index += categoryIds.length;
        }

        const preJoinWhereSQL = preJoinWhereClauses.length ? `WHERE ${preJoinWhereClauses.join(" AND ")}` : "";
        const postJoinWhereSQL = postJoinWhereClauses.length ? `AND ${postJoinWhereClauses.join(" AND ")}` : "";

        const botsQuery = `
          SELECT b.id, b.name, b.description, b.avatar, o.price, u.follower, u.name AS username, b.nft_id, o.kiosk, b.state
          FROM (
            SELECT * FROM orders
            ${preJoinWhereSQL}
          ) o
          JOIN bots b ON o.bot_id = b.id
          JOIN users u ON b.user_id = u.id
          WHERE 1=1
          ${postJoinWhereSQL}
          ORDER BY o.created_at DESC
          LIMIT $${index} OFFSET $${index + 1}
        `;

        values.push(limit, offset);

        const countQuery = `
          SELECT COUNT(*)
          FROM (
            SELECT * FROM orders
            ${preJoinWhereSQL}
          ) o
          JOIN bots b ON o.bot_id = b.id
          WHERE 1=1
          ${postJoinWhereSQL}
        `;

        const [botsResult, countResult] = await Promise.all([
          db.pool.query(botsQuery, values),
          db.pool.query(countQuery, values.slice(0, index - 1)),
        ]);

        const totalCount = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalCount / limit);

        return reply.status(200).send({
          message: "OK",
          data: {
            bots: botsResult.rows,
            pagination: {
              currentPage: page,
              totalPages,
              totalCount,
            },
          },
        });
      } catch (error) {
        console.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
      }
    },
  });

  app.get("/owner-listed-bot", {
    schema: {
      tags: ["Market"],
      querystring: paginationSchema,
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      try {
        const { page = 1, perPage } = request.query as { page: number, perPage: number };
        const limit = perPage;
        const offset = (page - 1) * limit;
        const {userId} = request;

        // Điều kiện WHERE trước khi JOIN
        const whereClauses: string[] = [
          "o.state = 'listed'",
          "o.seller_id = $1",
        ];
        const values: any[] = [userId];

        const botsQuery = `
          SELECT b.name, b.avatar, o.price, u.follower, u.name AS username, b.nft_id, o.kiosk, b.state, b.id
          FROM orders o
          JOIN bots b ON o.bot_id = b.id
          JOIN users u ON b.user_id = u.id
          WHERE ${whereClauses.join(" AND ")}
          ORDER BY o.created_at DESC
          LIMIT $2 OFFSET $3
        `;

        values.push(limit, offset);

        const countQuery = `
          SELECT COUNT(*) AS total
          FROM orders o
          JOIN bots b ON o.bot_id = b.id
          WHERE ${whereClauses.join(" AND ")}
        `;

        const countValues = values.slice(0, 1);

        const [botsResult, countResult] = await Promise.all([
          db.pool.query(botsQuery, values),
          db.pool.query(countQuery, countValues),
        ]);

        const totalCount = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalCount / limit);

        return reply.status(200).send({
          message: "OK",
          data: {
            bots: botsResult.rows,
            pagination: { currentPage: page, totalPages, totalCount },
          },
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Internal Server Error" });
      }
    },
  });

  app.get("/bag", {
    schema: {
      tags: ["Market"],
      querystring: paginationSchema,
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      try {
        const { page = 1, perPage } = request.query as { page: number, perPage: number };
        const limit = perPage;
        const offset = (page - 1) * limit;
        const {userId} = request;

        // Điều kiện WHERE trước khi JOIN
        const whereClauses: string[] = [
          `b.state = '${BotState.Created}'`,
          "b.user_id = $1",
          `COALESCE(o.state, 'cancelled') != 'listed'`
        ];
        const values: any[] = [userId];

        const botsQuery = `
          SELECT b.name, b.avatar, COALESCE(o.price, 0) AS price, COALESCE(o.price, 0) AS lastest_price, u.follower, u.name AS username, b.nft_id, o.kiosk, b.state, b.id
          FROM bots b
          LEFT JOIN (
            SELECT * FROM (
              SELECT
                *,
                ROW_NUMBER() OVER(PARTITION BY o.nft_id ORDER BY o.updated_at DESC) AS rank
              FROM orders o
            ) o WHERE o.rank = 1
          ) o ON o.bot_id = b.id
          JOIN users u ON b.user_id = u.id
          WHERE ${whereClauses.join(" AND ")}
          ORDER BY b.created_at DESC
          LIMIT $2 OFFSET $3
        `;

        values.push(limit, offset);

        const countQuery = `
          SELECT COUNT(*) AS total
          FROM bots b
          LEFT JOIN (
            SELECT * FROM (
              SELECT
                *,
                ROW_NUMBER() OVER(PARTITION BY o.nft_id ORDER BY o.updated_at DESC) AS rank
              FROM orders o
            ) o WHERE o.rank = 1
          ) o ON o.bot_id = b.id
          JOIN users u ON b.user_id = u.id
          WHERE ${whereClauses.join(" AND ")}
        `;

        const countValues = values.slice(0, 1);

        const [botsResult, countResult] = await Promise.all([
          db.pool.query(botsQuery, values),
          db.pool.query(countQuery, countValues),
        ]);

        const totalCount = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalCount / limit);

        return reply.status(200).send({
          message: "OK",
          data: {
            bots: botsResult.rows,
            pagination: { currentPage: page, totalPages, totalCount },
          },
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Internal Server Error" });
      }
    },
  });
  
  app.get("/activities", {
    schema: {
      tags: ["Market"],
      querystring: paginationSchema,
    },
    onRequest: optionalAuthenticate,
    handler: async (request, reply) => {
      try {
        const { page = 1, perPage } = request.query as { page: number, perPage: number };
        const limit = perPage;
        const offset = (page - 1) * limit;
        const {userId} = request;

        // Điều kiện WHERE trước khi JOIN
        // const whereClauses: string[] = [
        //   `b.state = '${BotState.Created}'`,
        //   "b.user_id = $1",
        //   `COALESCE(o.state, 'cancelled') != 'listed'`
        // ];
        const values: any[] = [];

        const baseQuery = `
          SELECT
            *
          FROM (
            SELECT
              ROW_NUMBER() OVER(PARTITION BY b.id ORDER BY t.confirmed_at DESC) AS rank,
              b.name,
              b.id AS bot_id,
              b.category_ids,
              o.price,
              t.sender,
              t.recipient,
              t.confirmed_at,
              t.event_name,
              t.event_listing_id
            FROM (
              SELECT
                events->>'listingId' AS event_listing_id,
                logs->>'eventName' AS event_name,
                confirmed_at,
                sender,
                recipient
              FROM transactions t 
            ) t 
            INNER JOIN orders o ON t.event_listing_id = o.order_id
            INNER JOIN bots b ON o.nft_id = b.nft_id
          ) a
          WHERE a.rank = 1
        `

        const activitiesQuery = `
          SELECT *
          FROM (${baseQuery}) a
          ORDER BY a.confirmed_at DESC
          LIMIT $1 OFFSET $2
        `;

        values.push(limit, offset);

        const countQuery = `
          SELECT COUNT(*) AS total
          FROM (${baseQuery}) a
        `;

        const countValues = [];

        const [activitiesResult, countResult] = await Promise.all([
          db.pool.query(activitiesQuery, values),
          db.pool.query(countQuery, countValues),
        ]);

        const totalCount = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalCount / limit);

        return reply.status(200).send({
          message: "OK",
          data: {
            activities: activitiesResult.rows,
            pagination: { currentPage: page, totalPages, totalCount },
          },
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Internal Server Error" });
      }
    },
  });

}