import { z } from "zod";

import { resolvedRepositoryTargetSchema } from "./repository";

export const repositorySnapshotFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  sizeBytes: z.number().int().nonnegative()
});

export const repositorySnapshotSchema = z.object({
  target: resolvedRepositoryTargetSchema,
  files: z.array(repositorySnapshotFileSchema)
});

export const repositoryMetadataManifestSchema = z.object({
  repo: z.object({
    owner: z.string().min(1),
    name: z.string().min(1),
    url: z.string().url(),
    ref: z.string().min(1),
    subpath: z.string().nullable(),
    commitSha: z.string().min(1)
  }),
  stats: z.object({
    fileCount: z.number().int().nonnegative(),
    estimatedTokens: z.number().int().nonnegative(),
    languages: z.array(z.string())
  }),
  folderTree: z.array(z.string()),
  manifests: z.array(z.string()),
  configFiles: z.array(z.string()),
  testFiles: z.array(z.string()),
  entrypointCandidates: z.array(z.string())
});
