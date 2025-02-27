import {
  loginSchema
} from "../schemas/user.schema.js"

import type { AppInstance } from "../types.js"


export default async (app: AppInstance) => {
  app.addHook("onRequest", app.authenticate)

  





}
