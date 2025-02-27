import type { AppInstance } from "../types.js"
import marketRoute from "./market.route.js"
import botRoute from "./bot.route.js"
import authRoute from "./auth.route.js"
import userRoute from "./user.route.js"
import chatRoute from "./chat.route.js"
import explore from "./explore.route.js"
import category from "./category.route.js"

export default async (app: AppInstance) => {
  app.register(authRoute, { prefix: "/api/auth" })
  app.register(botRoute, { prefix: "/api/ai-agents" })
  app.register(marketRoute, { prefix: "/api/markets" })
  app.register(userRoute, { prefix: "/api/users" })
  app.register(chatRoute, { prefix: "/api/chats" })
  app.register(explore, { prefix: "/api/explores" })
  app.register(category, { prefix: "/api/categories" })
}
