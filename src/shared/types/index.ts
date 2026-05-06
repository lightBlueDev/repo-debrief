import type { z } from "zod";

import type {
  ProviderId,
  ProviderModelOption
} from "../constants/providers";
import type {
  apiErrorSchema,
  publicSessionStateSchema,
  savedSessionAiConfigSchema,
  sessionAiConfigStatusSchema,
  settingsFormInputSchema
} from "../schemas/session";

export type { ProviderId, ProviderModelOption };

export type SessionAiConfigStatus = z.infer<typeof sessionAiConfigStatusSchema>;
export type SettingsFormInput = z.infer<typeof settingsFormInputSchema>;
export type SavedSessionAiConfig = z.infer<typeof savedSessionAiConfigSchema>;
export type PublicSessionState = z.infer<typeof publicSessionStateSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;

export type RepositoryTargetDraft = {
  repoUrl: string;
};
