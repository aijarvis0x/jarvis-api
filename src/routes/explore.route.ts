import { optionalAuthenticate } from "../plugins/optional-auth.js";
import { addFavoriteBotBody, listTrendingBotQuery } from "../schemas/explore.schema.js";
import { paginationSchema } from "../schemas/generic-schemas.js";
import { loginSchema } from "../schemas/user.schema.js";
import {
  addBotToFavorite,
  getFunAndMemeBot,
  getAutomationAndProductivityBot,
  getTopPickBot,
  getTrendingBot,
  getFavoriteAndTalkedBot,
  getNewListBot,
  getPhotoFilterBot,
} from "../services/explore.service.js";

import type { AppInstance } from "../types.js";

export default async (app: AppInstance) => {

  app.get("/get-photo-filter-bot", {
    schema: {
      tags: ["Explore"],
      querystring: paginationSchema,
    },
    onRequest: optionalAuthenticate,
    handler: async (request, reply) => {
      const { userId } = request;

      try {
        const { page = 1, perPage } = request.query;
        const limit = perPage;
        const offset = (page - 1) * limit;

        const result = await getPhotoFilterBot(userId, limit, offset, page);

        return reply.status(200).send({
          message: "OK",
          data: result,
        });
      } catch (error) {
        console.log(error);
        return reply.status(500).send({
          message: "Server error",
        });
      }
    },
  });

  app.get("/get-trending-bot", {
    schema: {
      tags: ["Explore"],
      querystring: listTrendingBotQuery.querystring,
    },
    onRequest: optionalAuthenticate,
    handler: async (request, reply) => {
      const { userId } = request;
      const { timeTrend = 'all' } = request.query;

      try {
        const { page = 1, perPage } = request.query;
        const limit = perPage;
        const offset = (page - 1) * limit;

        const result = await getTrendingBot(userId, limit, offset, page, timeTrend);

        return reply.status(200).send({
          message: "OK",
          data: result,
        });
      } catch (error) {
        console.log(error);
        return reply.status(500).send({
          message: "Server error",
        });
      }
    },
  });

  app.get("/get-fun-and-meme-bot", {
    schema: {
      tags: ["Explore"],
      querystring: paginationSchema,
    },
    onRequest: optionalAuthenticate,
    handler: async (request, reply) => {
      const { userId } = request;

      try {
        const { page = 1, perPage } = request.query;
        const limit = perPage;
        const offset = (page - 1) * limit;

        const result = await getFunAndMemeBot(
          userId,
          limit,
          offset,
          page
        );

        return reply.status(200).send({
          message: "OK",
          data: result,
        });
      } catch (error) {
        console.log(error);
        return reply.status(500).send({
          message: "Server error",
        });
      }
    },
  });

  app.get("/get-top-pick-bot", {
    schema: {
      tags: ["Explore"],
      querystring: paginationSchema,
    },
    onRequest: optionalAuthenticate,
    handler: async (request, reply) => {
      const { userId } = request;

      try {
        const { page = 1, perPage } = request.query;
        const limit = perPage;
        const offset = (page - 1) * limit;

        const result = await getTopPickBot(
          userId,
          limit,
          offset,
          page
        );

        return reply.status(200).send({
          message: "OK",
          data: result,
        });
      } catch (error) {
        console.log(error);
        return reply.status(500).send({
          message: "Server error",
        });
      }
    },
  });

  app.get("/get-automation-ai", {
    schema: {
      tags: ["Explore"],
      querystring: paginationSchema,
    },
    onRequest: optionalAuthenticate,
    handler: async (request, reply) => {
      const { userId } = request;

      try {
        const { page = 1, perPage } = request.query;
        const limit = perPage;
        const offset = (page - 1) * limit;

        const result = await getAutomationAndProductivityBot(
          userId,
          limit,
          offset,
          page
        );

        return reply.status(200).send({
          message: "OK",
          data: result,
        });
      } catch (error) {
        console.log(error);
        return reply.status(500).send({
          message: "Server error",
        });
      }
    },
  });

  app.get("/new-list-agent", {
    schema: {
      tags: ["Explore"],
      querystring: paginationSchema,
    },
    onRequest: optionalAuthenticate,
    handler: async (request, reply) => {
      const { userId } = request;

      try {
        const { page = 1, perPage } = request.query;
        const limit = perPage;
        const offset = (page - 1) * limit;

        const result = await getNewListBot(
          userId,
          limit,
          offset,
          page
        );

        return reply.status(200).send({
          message: "OK",
          data: result,
        });
      } catch (error) {
        console.log(error);
        return reply.status(500).send({
          message: "Server error",
        });
      }
    },
  });

  app.post("/add-favorite", {
    schema: {
      tags: ["Explore"],
      body: addFavoriteBotBody,
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      const { userId } = request;
      const { botId } = request.body;

      try {
        const result = await addBotToFavorite(userId, botId);

        return reply.status(200).send({
          message: "OK",
          data: result,
        });
      } catch (error) {
        console.log(error);
        return reply.status(500).send({
          message: "Server error",
        });
      }
    },
  });

  app.get("/get-favorite-and-talked-bot", {
    schema: {
      tags: ["Explore"],
      querystring: paginationSchema,
    },
    onRequest: app.authenticate,
    handler: async (request, reply) => {
      const { userId } = request;

      try {
        const { page = 1, perPage } = request.query;
        const limit = perPage;
        const offset = (page - 1) * limit;

        const result = await getFavoriteAndTalkedBot(
          userId,
          limit,
          offset,
          page
        );

        return reply.status(200).send({
          message: "OK",
          data: result,
        });
      } catch (error) {
        console.log(error);
        return reply.status(500).send({
          message: "Server error",
        });
      }
    },
  });
};
