import sanitize from "sanitize-filename"
import sanitizeHtml from "sanitize-html"

/**
 * Sanitizes a filename by removing any invalid characters.
 */
export const sanitizeFilename = (filename: string): string => {
  const extension = filename.split(".").pop()

  const name = sanitize(
    `${filename.substring(0, filename.lastIndexOf(".")) || filename}`
  )

  return extension ? `${name}.${extension}` : name
}

/**
 * Normalizes HTML by removing any unwanted tags and attributes.
 *
 * @param html
 * @param context
 */
export const normalizeHtml = (
  html: string | null,
  context?: "description" | "content" | undefined
): string => {
  if (!html || typeof html !== "string") {
    return ""
  }

  const trimParagraphs = (str: string) => {
    const paragraph = "<p></p>"
    const escapedParagraph = "<p>\\s*?</p>"

    const startReg = new RegExp(`^(${escapedParagraph})+`)
    const endReg = new RegExp(`(${escapedParagraph})+$`)
    const duplicates = new RegExp(`(${escapedParagraph})+`)

    return str
      .replace(startReg, "")
      .replace(endReg, "")
      .replace(duplicates, paragraph)
  }

  return trimParagraphs(
    sanitizeHtml(html, {
      allowedTags:
        context === "description"
          ? ["p", "br", "a", "blockquote"]
          : [...sanitizeHtml.defaults.allowedTags, "img"],
      allowedAttributes: {
        a: ["href", "target", "rel"],
        img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
      },
      selfClosing: ["br"],
      // Enforce _blank and safe URLs
      transformTags: {
        a: sanitizeHtml.simpleTransform("a", {
          target: "_blank",
          rel: "ugc noopener noreferrer nofollow",
        }),
      },
    })
  ).trim()
}

/**
 * Sanitizes input by removing HTML tags.
 * Refer : http://stackoverflow.com/a/430240/1932901
 *
 * @param _value A string to sanitize.
 * @returns A string with HTML tags removed.
 */
export const trimTags = (_value: string): string => {
  let value = _value

  const tagBody = "(?:[^\"'>]|\"[^\"]*\"|'[^']*')*"
  const tagOrComment = new RegExp(
    // biome-ignore lint/style/useTemplate: <explanation>
    "<(?:" +
      // Comment body.
      "!--(?:(?:-*[^->])*--+|-?)" +
      // Special "raw text" elements whose content should be elided.
      "|script\\b" +
      tagBody +
      ">[\\s\\S]*?</script\\s*" +
      "|style\\b" +
      tagBody +
      ">[\\s\\S]*?</style\\s*" +
      // Regular name
      "|/?[a-z]" +
      tagBody +
      ")>",
    "gi"
  )

  let rawValue: string
  do {
    rawValue = value
    value = value.replace(tagOrComment, "")
  } while (value !== rawValue)

  return value.replace(/</g, "&lt;")
}
