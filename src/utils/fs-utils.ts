import * as fs from "node:fs"

export function parseFileToArraySync(filePath: string) {
  if (!fs.existsSync(filePath)) return []

  const fileContent = fs.readFileSync(filePath, "utf-8")

  return fileContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line, index, lines) => lines.indexOf(line) === index)
}
