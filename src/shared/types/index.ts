import type { z } from "zod";

import type {
  ProviderId,
  ProviderModelOption
} from "../constants/providers";
import type {
  repositoryMetadataManifestSchema,
  repositorySnapshotFileSchema,
  repositorySnapshotSchema
} from "../schemas/ingestion";
import type {
  parsedGitHubTreeUrlSchema,
  parsedGitHubUrlSchema,
  repositoryUrlInputSchema,
  resolvedRepositoryTargetSchema
} from "../schemas/repository";
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
export type RepositoryUrlInput = z.infer<typeof repositoryUrlInputSchema>;
export type ParsedGitHubUrl = z.infer<typeof parsedGitHubUrlSchema>;
export type ParsedGitHubTreeUrl = z.infer<typeof parsedGitHubTreeUrlSchema>;
export type ResolvedRepositoryTarget = z.infer<typeof resolvedRepositoryTargetSchema>;
export type RepositorySnapshotFile = z.infer<typeof repositorySnapshotFileSchema>;
export type RepositorySnapshot = z.infer<typeof repositorySnapshotSchema>;
export type RepositoryMetadataManifest = z.infer<
  typeof repositoryMetadataManifestSchema
>;
