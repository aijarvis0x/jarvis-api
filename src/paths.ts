import path from "node:path"

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export const root = () => path.resolve(__dirname, "..")
