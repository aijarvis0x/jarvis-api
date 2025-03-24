import { z } from "zod"
import { AdjectivesType, ModelProvider, PluginType, VoiceType } from "../services/bot.service.js";
import { paginationSchema } from "./generic-schemas.js";
import { MarketFilter } from "../constants.js";

const MAX_BIO_LORE_LENGTH = 30;
const MAX_KNOWLEDGE_LENGTH = 100;
const MAX_MESSAGE_EXAMPLES_LENGTH = 100;
const MAX_POST_EXAMPLES_LENGTH = 30;
const MAX_WORDS_PER_BIO_LORE_KNOWLEDGE = 50;
const MAX_WORDS_PER_MESSAGE_CONTENT = 500;
const MAX_WORDS_PER_POST_EXAMPLE = 50;

const wordCount = (str: string) => str.trim().split(/\s+/).length;

export const BotSettingModeSchema = z.object({
  modelProvider: z.nativeEnum(ModelProvider),
  settings: z.object({
    secrets: z.record(z.any()).optional(),
    voice: z.object({
      model: z.nativeEnum(VoiceType).optional(),
    }).optional(),
  }).optional(),
  plugins: z.array(z.nativeEnum(PluginType)).optional(),
  adjectives: z.array(z.nativeEnum(AdjectivesType)).optional(),
  bio: z
    .array(z.string().refine((str) => wordCount(str) <= MAX_WORDS_PER_BIO_LORE_KNOWLEDGE, {
      message: `Each bio must not exceed ${MAX_WORDS_PER_BIO_LORE_KNOWLEDGE} words`,
    }))
    .max(MAX_BIO_LORE_LENGTH, `Bio must not exceed ${MAX_BIO_LORE_LENGTH} items`)
    .optional(),
  lore: z
    .array(z.string().refine((str) => wordCount(str) <= MAX_WORDS_PER_BIO_LORE_KNOWLEDGE, {
      message: `Each lore must not exceed ${MAX_WORDS_PER_BIO_LORE_KNOWLEDGE} words`,
    }))
    .max(MAX_BIO_LORE_LENGTH, `Lore must not exceed ${MAX_BIO_LORE_LENGTH} items`)
    .optional(),
  knowledge: z
    .array(z.string().refine((str) => wordCount(str) <= MAX_WORDS_PER_BIO_LORE_KNOWLEDGE, {
      message: `Each knowledge must not exceed ${MAX_WORDS_PER_BIO_LORE_KNOWLEDGE} words`,
    }))
    .max(MAX_KNOWLEDGE_LENGTH, `Knowledge must not exceed ${MAX_KNOWLEDGE_LENGTH} items`)
    .optional(),
  messageExamples: z
    .array(
      z.array(
        z.object({
          user: z.string(),
          content: z.object({
            text: z.string().refine((str) => wordCount(str) <= MAX_WORDS_PER_MESSAGE_CONTENT, {
              message: `Message content must not exceed ${MAX_WORDS_PER_MESSAGE_CONTENT} words`,
            }),
          }),
        })
      )
    )
    .max(MAX_MESSAGE_EXAMPLES_LENGTH, `MessageExamples must not exceed ${MAX_MESSAGE_EXAMPLES_LENGTH} items`)
    .optional(),
  postExamples: z
    .array(z.string().refine((str) => wordCount(str) <= MAX_WORDS_PER_POST_EXAMPLE, {
      message: `Each post example must not exceed ${MAX_WORDS_PER_POST_EXAMPLE} words`,
    }))
    .max(MAX_POST_EXAMPLES_LENGTH, `PostExamples must not exceed ${MAX_POST_EXAMPLES_LENGTH} items`)
    .optional(),
  topics: z.array(z.string()).optional()
});

export const updateBotInfoSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  categoryIds: z.array(z.number().positive()).max(3).optional(),
  nsfw: z.boolean().optional(),
  tag: z.string().optional(),
  sub_tag: z.string().optional(),
  description: z.string().optional(),
  introMsg: z.string().optional(),
  prompt: z.string().optional(),
  setting_mode: BotSettingModeSchema.optional(),
});


export const uploadBotAvatarSchema = z.object({
  id: z.string(),
  mimeType: z.enum(["image/png", "image/jpeg", "image/jpg"]),
  fileSize: z.number()
})

export const deployBotReqSchema = z.object({
  id: z.string()
})

export const publishBotSchema = z.object({
  id: z.string()
})

export const myAgentQuery = {
  querystring: paginationSchema.merge(
    z.object({
      filterType: z.enum([MarketFilter.All, MarketFilter.Listed, MarketFilter.InBag]).default(MarketFilter.All),
    })
  ),
} as const

export const commentBotSchema = z.object({
  text: z.string()
})

export const getCommentsQuery = {
  querystring: paginationSchema
} as const