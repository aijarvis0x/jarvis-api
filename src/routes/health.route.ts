import type { AppInstance } from "../types.js"

export default async (app: AppInstance) => {
  app.get("/health", {
    handler: async () => {
      return { date: new Date() }
    },
  })
}
