import { z } from "zod";

export const repositoryUrlInputSchema = z.object({
  repoUrl: z.string().trim().min(1, "Paste a GitHub repository URL.")
});

export const parsedGitHubRootUrlSchema = z.object({
  provider: z.literal("github"),
  kind: z.literal("root"),
  submittedUrl: z.string().url(),
  normalizedUrl: z.string().url(),
  owner: z.string().min(1),
  repo: z.string().min(1)
});

export const parsedGitHubTreeUrlSchema = z.object({
  provider: z.literal("github"),
  kind: z.literal("tree"),
  submittedUrl: z.string().url(),
  normalizedUrl: z.string().url(),
  owner: z.string().min(1),
  repo: z.string().min(1),
  treeTail: z.string().min(1),
  treeSegments: z.array(z.string().min(1)).min(2)
});

export const parsedGitHubUrlSchema = z.union([
  parsedGitHubRootUrlSchema,
  parsedGitHubTreeUrlSchema
]);

export const resolvedRepositoryTargetSchema = z.object({
  provider: z.literal("github"),
  owner: z.string().min(1),
  repo: z.string().min(1),
  repoUrl: z.string().url(),
  submittedUrl: z.string().url(),
  ref: z.string().min(1),
  subpath: z.string().nullable(),
  commitSha: z.string().min(1),
  defaultBranch: z.string().min(1),
  visibility: z.literal("public")
});
