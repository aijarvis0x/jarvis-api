import { z } from "zod"

export const loginSchema = z.object({
  address: z
    .string(),
    // .refine((v) => isValidSuiAddress(v), "Invalid sui address"),
  messageHash: z.string(),
  signature: z.string()
})

export const changeUserNameSchema = z.object({
  new_name: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(20, "Username must not exceed 20 characters")
    .regex(/^[a-zA-Z0-9\-_.]+$/, "Name can only contain letters, numbers, and special characters -_."),
});

export const uploadAvatarSchema = z.object({
  mimeType: z.enum(["image/png", "image/jpeg", "image/jpg"]),
  fileSize: z.number()
});