import { z } from "zod";

import {
  OPENROUTER_CUSTOM_MODEL_OPTION,
  PROVIDER_IDS
} from "../constants/providers";

export const providerIdSchema = z.enum(PROVIDER_IDS);

export const sessionAiConfigStatusSchema = z.object({
  provider: providerIdSchema.nullable(),
  model: z.string().nullable(),
  apiKeyConfigured: z.boolean()
});

export const publicSessionStateSchema = z.object({
  ai: sessionAiConfigStatusSchema,
  github: z.object({
    connected: z.boolean(),
    username: z.string().nullable(),
    avatarUrl: z.string().url().nullable()
  })
});

export const settingsFormInputSchema = z.object({
  provider: providerIdSchema,
  model: z.string().min(1),
  apiKey: z.string().trim().optional().default(""),
  customModelId: z.string().trim().optional()
}).superRefine((value, ctx) => {
  if (
    value.provider === "openrouter" &&
    value.model === OPENROUTER_CUSTOM_MODEL_OPTION &&
    !value.customModelId
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a custom OpenRouter model ID.",
      path: ["customModelId"]
    });
  }
});

export const savedSessionAiConfigSchema = z.object({
  provider: providerIdSchema.nullable(),
  model: z.string().nullable(),
  apiKey: z.string().nullable()
});

export const apiErrorSchema = z.object({
  error: z.string()
});

export const apiSuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.literal(true),
    data
  });
