import type { AxiosResponse } from "axios"
import type { AppReply } from "../app.js"

export function replyAxiosError(reply: AppReply, response: AxiosResponse) {
  reply.log.error(response.data)

  return reply.status(response.status ?? 500).send({
    message:
      response?.data?.msg ?? response?.data?.message ?? "INTERNAL_SERVER_ERROR",
  })
}
