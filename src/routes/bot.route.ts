import { BotState } from "../constants.js"
import { dayjs } from "../lib/date.js"
import { optionalAuthenticate } from "../plugins/optional-auth.js"
import {
  updateBotInfoSchema,
  uploadBotAvatarSchema,
  deployBotReqSchema,
  publishBotSchema
} from "../schemas/bot.schema.js"
import { createBotDraft, findBotById, updateBotBackground, updateBotAvatar, updateBotById, findBotByIdNonOwner, getListBots, publishBot, genSignMintBot, updateStateBot, updateOnlyStateBot } from "../services/bot.service.js"


import type { AppInstance } from "../types.js"
import { configureFileUpload } from "../utils/s3.js"


export default async (app: AppInstance) => {


  await configureFileUpload(app);


  app.post("/create-draft", {
    schema: {
      tags: ["Bot"]
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      const { userId, address } = request

      try {
        const result = await createBotDraft(userId, address)

        return reply.status(200).send({
          message: "OK",
          data: result
        })
      } catch (error) {
        console.log(error)
        return reply.status(500).send({
          message: "Server error"
        })
      }
    },
  })

  app.post("/upload-avatar", {
    schema: {
      tags: ["Bot"],
      body: uploadBotAvatarSchema
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      try {
        const { userId } = request
        const botId = request.body.id;
        const { mimeType, fileSize } = request.body

        const bot = await findBotById(botId, userId)
        if (!bot) {
          return reply.status(400).send({ message: "AI-agent doesn't exist" });
        }

        if (bot.state != BotState.Draft) {
          return reply.status(400).send({ message: "Only upload bot's avatar before deployment" });
        }

        const result = await app.uploadFileToS3(mimeType, 'bots/avatars', botId, fileSize);

        //update avatar bot
        await updateBotAvatar(botId, result.key)

        return reply.status(200).send({
          message: "Avatar uploaded successfully",
          data: result,
        });
      } catch (err) {
        console.error(err);
        return reply.status(500).send({ message: "Failed to upload avatar" });
      }
    }
  })

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
        if(categoryIds && categoryIds.length > 0){
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

  app.post("/deploy-req", {
    schema: {
      tags: ["Bot"],
      body: deployBotReqSchema
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      const { userId, address } = request
      const { id } = request.body

      const now = dayjs.utc().valueOf()
      try {
        const bot = await findBotById(id, userId);
        if (!bot) {
          return reply.status(404).send({ message: "AI-agent not found" });
        }

        if(!bot.name) {
          return reply.status(404).send({ message: "Agent's Name is required" });
        }

        if(!bot.avatar) {
          return reply.status(404).send({ message: "Agent's Avatar is required" });
        }

        if (![BotState.Draft, BotState.Pending].includes(bot.state)) {
          return reply.status(404).send({ message: "Invalid AI-agent status. Only 'Draft' or 'Pending' states are allowed." });
        }

        //
        await updateOnlyStateBot(
          {
            botId: bot.id,
            state: BotState.Pending,
            oldState: BotState.Draft
          }
        )

        //gen msg, signature, nonce
        if (bot?.msg && dayjs.utc(bot?.expired_time).valueOf() > now) {
          return reply.status(200).send({
            message: "OK",
            data: {
              id,
              msg: bot?.msg,
              signature: bot?.signature,
              nonce: bot?.nonce,
              expired_time: bot?.expired_time,
              fee: bot?.fee
            },
          });
        } else {
          //gen
          const { msg, signature, nonce, expired_time, fee } = await genSignMintBot({
            id: userId,
            receiver: address,
            name: bot.name,
            xid: bot.id,
            description: bot.description
          })

          return reply.status(200).send({
            message: "OK",
            data: {
              id,
              msg, signature, nonce, expired_time, fee
            },
          });
        }

      } catch (error) {
        console.log(error)
        return reply.status(500).send({
          message: "Internal Server Error"
        })
      }
    },
  })

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
        if (!!userId && userId == bot.user_id) {
          return reply.status(200).send({
            message: "OK",
            data: bot,
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
            description,
            lastest_price,
            highest_price,
            lowest_price,
            count_conversation,
            state,
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
              sub_tag,
              description,
              lastest_price,
              highest_price,
              lowest_price,
              count_conversation,
              state,
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
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      const { userId } = request
      const { page = 1 } = request.query as any
      const limit = 10
      let bots = await getListBots(userId, page, limit)

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





}
