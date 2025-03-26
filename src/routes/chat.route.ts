import { db } from "../lib/pg.js"
import { optionalAuthenticate } from "../plugins/optional-auth.js"
import { createConversationBody, getListConversationSchema, sendMessageBody } from "../schemas/chat.schema.js"
import {
  loginSchema
} from "../schemas/user.schema.js"
import { createConversation, getConversationByUserIdAndBotId, sendMessage } from "../services/chat.service.js"

import type { AppInstance } from "../types.js"


export default async (app: AppInstance) => {

  app.post("/create-conversation", {
    schema: {
      tags: ["Chat"],
      body: createConversationBody
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      const { userId } = request
      const { botId } = request.body;

      try {
        let conversation = await getConversationByUserIdAndBotId(
          userId,
          BigInt(botId)
        )

        if (!conversation) {
          conversation = await createConversation(userId, BigInt(botId))
        }

        return reply.status(200).send({
          message: "OK",
          data: {...conversation, response: "Hello, there!"}
        })
      } catch (error) {
        console.log(error)
        return reply.status(500).send({
          message: "Server error"
        })
      }
    },
  })

  app.get("/list", {
    schema: {
      tags: ["Chat"],
      querystring: getListConversationSchema.querystring,
    },
    onRequest: optionalAuthenticate,
    handler: async (request, reply) => {
      try {
        const { search, page = 1, perPage = 20 } = request.query as {
          search?: string;
          page: number;
          perPage: number;
        };

        const { userId } = request;
        const offset = (page - 1) * perPage;

        let whereClauses: string[] = [];
        let values: (string | number | boolean)[] = [];
        let index = 1;

        if (search) {
          whereClauses.push(`(b.name ILIKE $${index} OR b.tag ILIKE $${index} OR b.sub_tag ILIKE $${index})`);
          values.push(`%${search}%`);
          index++;
        }

        if (userId) {
          whereClauses.push(`c.user_id = $${index}`);
          values.push(String(userId));
          index++;
        }

        const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

        const conversationsQuery = `
          SELECT
            c.id,
            c.conversation_id,
            c.created_at,
            b.name AS bot_name,
            b.avatar AS bot_avatar,
            u.name AS user_name,
            u.avatar AS user_avatar,
            b.id as bot_id,
            b.category_ids
          FROM conversations c
          JOIN bots b ON c.bot_id = b.id
          JOIN users u ON c.user_id = u.id
          ${whereSQL}
          ORDER BY c.created_at DESC
          LIMIT $${index} OFFSET $${index + 1}
        `;

        values.push(perPage, offset);


        const conversationsResult = await db.pool.query(conversationsQuery, values)


        return reply.status(200).send({
          message: "OK",
          data: {
            conversations: conversationsResult.rows,
            pagination: {
              currentPage: page,
              perPage
            },
          },
        });
      } catch (error) {
        console.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
      }
    },
  });


  app.post("/send-message", {
    schema: {
      tags: ["Chat"],
      body: sendMessageBody
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      const { userId, address } = request
      const { conversationId,
        text,
        agentId, categoryId } = request.body

      try {
        const textResponse = await sendMessage(userId, conversationId, text, agentId, categoryId, address)

        return reply.status(200).send({
          message: "OK",
          data: {
            response: textResponse
          }
        })
      } catch (error) {
        console.log(error)
        return reply.status(500).send({
          message: "Server error"
        })
      }
    },
  })
}
