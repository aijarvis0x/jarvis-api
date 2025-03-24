import { BotState, MarketFilter } from "../constants.js"
import { dayjs } from "../lib/date.js"
import { optionalAuthenticate } from "../plugins/optional-auth.js"
import {
  updateBotInfoSchema,
  uploadBotAvatarSchema,
  publishBotSchema,
  myAgentQuery,
  commentBotSchema,
  getCommentsQuery
} from "../schemas/bot.schema.js"
import { findBotById, updateBotBackground, updateBotById, findBotByIdNonOwner, getListBots, publishBot, getListBotInBag, getListBotListed, insertComment, getAllCommentBot } from "../services/bot.service.js"
import { findOrderListedOfBot } from "../services/order.service.js"


import type { AppInstance } from "../types.js"
import { configureFileUpload } from "../utils/s3.js"


export default async (app: AppInstance) => {


  await configureFileUpload(app);



  app.post("/upload-background", {
    schema: {
      tags: ["Bot"],
      body: uploadBotAvatarSchema
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      try {
        const { mimeType, fileSize } = request.body
        const { userId } = request
        const botId = request.body.id;

        const bot = await findBotById(botId, userId)
        if (!bot) {
          return reply.status(400).send({ message: "AI-agent doesn't exist" });
        }

        const result = await app.uploadFileToS3(mimeType, 'bots/backgrounds', botId, fileSize);

        //update background bot
        await updateBotBackground(botId, result.key)

        return reply.status(200).send({
          message: "Background uploaded successfully",
          data: result,
        });
      } catch (err) {
        console.error(err);
        return reply.status(500).send({ message: "Failed to upload background" });
      }
    },
  })


  app.put("/update-info", {
    schema: {
      tags: ["Bot"],
      body: updateBotInfoSchema,
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      try {
        const { userId } = request;
        const { id, name, nsfw, tag, sub_tag, description, setting_mode, categoryIds, introMsg, prompt } = request.body;


        const bot = await findBotById(id, userId);
        if (!bot) {
          return reply.status(404).send({ message: "AI-agent not found" });
        }

        if (bot.user_id !== userId) {
          return reply.status(403).send({ message: "You do not have permission to update this AI-agent" });
        }

        if (bot.state !== 'draft') {
          return reply.status(400).send({
            message: "Only AI-agents in 'draft' state can have their name and setting_mode updated",
          });
        }

        const updateData: Partial<typeof bot> = {};
        //only update when state = draft
        if (name !== undefined) {
          updateData.name = name;
        }

        console.log(setting_mode)
        if (setting_mode !== undefined) {
          updateData.setting_mode = {
            ...setting_mode,
            "style": {
              "all": [
                "maintain technical accuracy",
                "be approachable and clear",
                "use concise and professional language"
              ],
              "chat": [
                "ask clarifying questions when needed",
                "provide examples to explain complex concepts",
                "maintain a friendly and helpful tone"
              ],
              "post": [
                "share insights concisely",
                "focus on practical applications",
                "use engaging and professional language"
              ]
            }
          };
        }

        //update at everytime
        if (nsfw !== undefined) {
          updateData.nsfw = nsfw;
        }

        if (tag !== undefined) {
          updateData.tag = tag;
        }

        if (sub_tag !== undefined) {
          updateData.sub_tag = sub_tag;
        }

        if (description !== undefined) {
          updateData.description = description;
        }

        if (introMsg !== undefined) {
          updateData.intro_msg = introMsg;
        }

        if (prompt !== undefined) {
          updateData.prompt = prompt;
        }

        //@todo update condition
        if (categoryIds && categoryIds.length > 0) {
          updateData.category_ids = categoryIds
        }



        const updatedBot = await updateBotById(id, updateData);

        return reply.status(200).send({
          message: "Bot updated successfully",
          data: updatedBot,
        });
      } catch (error) {
        console.error("Error updating bot:", error);
        return reply.status(500).send({ message: "Internal Server Error" });
      }
    },
  });



  app.get("/agent/:id", {
    schema: {
      tags: ["Bot"],
    },
    onRequest: optionalAuthenticate,
    handler: async (request, reply) => {
      const { id } = request.params as any;
      let { userId } = request;
      try {
        const bot = await findBotByIdNonOwner(id);
        if (!bot) {
          return reply.status(404).send({ message: "AI-agent not found" });
        }


        const order = await findOrderListedOfBot(bot.id)

        const orderData = {
          orderId: order?.order_id,
          price: order?.price,
          state: order?.state
        }

        if (!!userId && userId == bot.user_id) {
          return reply.status(200).send({
            message: "OK",
            data: { ...bot, order: orderData, setting_mode: null },
          });
        } else {
          let {
            name,
            user_id,
            agent_id,
            nft_id,
            avatar,
            background,
            nsfw,
            tag,
            sub_tag,
            attributes,
            description,
            lastest_price,
            highest_price,
            lowest_price,
            count_conversation,
            state,
            owner,
            category_ids,
          } = bot;
          return reply.status(200).send({
            message: "OK",
            data: {
              id,
              name,
              user_id,
              agent_id,
              nft_id,
              avatar,
              background,
              nsfw,
              tag,
              attributes,
              sub_tag,
              description,
              lastest_price,
              highest_price,
              lowest_price,
              count_conversation,
              state,
              owner,
              order: orderData,
              category_ids,

            },
          });
        }
      } catch (error) {
        throw error;
      }
    },
  });

  app.get("/my-agents", {
    schema: {
      tags: ["Bot"],
      querystring: myAgentQuery.querystring
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      const { userId } = request
      const { page = 1, perPage, filterType = MarketFilter.All } = request.query as any
      const limit = perPage
      let bots;

      switch (filterType) {
        case MarketFilter.All:
          bots = await getListBots(userId, page, limit);
          break;

        case MarketFilter.InBag:
          bots = await getListBotInBag(userId, page, limit);
          break;
        
        case MarketFilter.Listed:
          bots = await getListBotListed(userId, page, limit);
          break;
      
        default:
          bots = await getListBots(userId, page, limit);
          break;
      }

      return reply.status(200).send({
        message: "OK",
        data: {
          bots,
          page,
          limit
        }
      })
    }
  })



  app.post("/publish", {
    schema: {
      tags: ["Bot"],
      body: publishBotSchema
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      const { id } = request.body
      const { userId } = request

      let bot = await findBotById(id, userId)
      if (!bot) {
        return reply.status(404).send({ message: "AI-agent is not found" });
      }

      if (bot.state != BotState.Created) {
        return reply.status(404).send({ message: "AI-agent is not created" });
      }

      if (bot.is_published) {
        return reply.status(404).send({ message: "AI-agent was published" });
      }

      await publishBot(bot.id)
      return reply.status(200).send({
        message: "OK"
      })
    },
  })

  app.post("/create-comments/:botId", {
    schema: {
      tags: ["Bot"],
      body: commentBotSchema
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      const { botId } = request.params as any;
      let { userId } = request;
      const {text} = request.body;

      let comment = await insertComment(userId, text, botId)
      return reply.status(200).send({
        message: "OK",
        data: {
          commentId: comment
        }
      })
    },
  })

  app.get("/get-comments/:botId", {
    schema: {
      tags: ["Bot"],
      querystring: getCommentsQuery.querystring
    },
    onRequest: optionalAuthenticate,
    handler: async (request, reply) => {
      const { botId } = request.params as any;
      const { page = 1, perPage } = request.query as any
      const limit = perPage

      let comments = await getAllCommentBot(botId, page, limit)
      return reply.status(200).send({
        message: "OK",
        data: {
          comments: comments,
          page, 
          limit
        }
      })
    },
  })





}
