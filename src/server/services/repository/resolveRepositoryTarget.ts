import type {
  ParsedGitHubTreeUrl,
  ParsedGitHubUrl,
  ResolvedRepositoryTarget
} from "../../../shared/types";
import {
  createGitHubClient,
  type GitHubRepositoryClient,
  type GitHubRepositoryMetadata
} from "./githubClient";

type FetchLike = typeof fetch;

type ResolutionDependencies = {
  client?: GitHubRepositoryClient;
  fetchImpl?: FetchLike;
  githubToken?: string;
};

function getClient(dependencies: ResolutionDependencies): GitHubRepositoryClient {
  return (
    dependencies.client ??
    createGitHubClient({
      fetchImpl: dependencies.fetchImpl,
      githubToken: dependencies.githubToken
    })
  );
}

async function resolveTreeTarget(
  parsedUrl: ParsedGitHubTreeUrl,
  metadata: GitHubRepositoryMetadata,
  client: GitHubRepositoryClient
): Promise<ResolvedRepositoryTarget> {
  const { treeSegments } = parsedUrl;

  for (let refSegmentCount = treeSegments.length - 1; refSegmentCount >= 1; refSegmentCount -= 1) {
    const candidateRef = treeSegments.slice(0, refSegmentCount).join("/");
    const candidatePath = treeSegments.slice(refSegmentCount).join("/");

    const branchExists = await client.refExists(parsedUrl, candidateRef, "heads");
    const tagExists = branchExists || (await client.refExists(parsedUrl, candidateRef, "tags"));

    if (!branchExists && !tagExists) {
      continue;
    }

    const subpathExists = await client.pathExistsAtRef(parsedUrl, candidatePath, candidateRef);

    if (!subpathExists) {
      throw new Error(
        "We couldn't find that subdirectory at the selected branch or ref."
      );
    }

    const commitSha = await client.resolveCommitSha(parsedUrl, candidateRef);

    return {
      provider: "github",
      owner: parsedUrl.owner,
      repo: parsedUrl.repo,
      repoUrl: `https://github.com/${parsedUrl.owner}/${parsedUrl.repo}`,
      submittedUrl: parsedUrl.submittedUrl,
      ref: candidateRef,
      subpath: candidatePath,
      commitSha,
      defaultBranch: metadata.defaultBranch,
      visibility: "public"
    };
  }

  throw new Error("We couldn't resolve that branch or ref on GitHub.");
}

async function resolveRootTarget(
  parsedUrl: Extract<ParsedGitHubUrl, { kind: "root" }>,
  metadata: GitHubRepositoryMetadata,
  client: GitHubRepositoryClient
): Promise<ResolvedRepositoryTarget> {
  const commitSha = await client.resolveCommitSha(parsedUrl, metadata.defaultBranch);

  return {
    provider: "github",
    owner: parsedUrl.owner,
    repo: parsedUrl.repo,
    repoUrl: `https://github.com/${parsedUrl.owner}/${parsedUrl.repo}`,
    submittedUrl: parsedUrl.submittedUrl,
    ref: metadata.defaultBranch,
    subpath: null,
    commitSha,
    defaultBranch: metadata.defaultBranch,
    visibility: "public"
  };
}

export async function resolveRepositoryTarget(
  parsedUrl: ParsedGitHubUrl,
  dependencies: ResolutionDependencies = {}
): Promise<ResolvedRepositoryTarget> {
  const client = getClient(dependencies);
  const metadata = await client.getRepositoryMetadata(parsedUrl);

  if (metadata.visibility !== "public") {
    throw new Error(
      "We couldn't access this repository. Check that the URL is correct and that the repository is public."
    );
  }

  if (parsedUrl.kind === "root") {
    return resolveRootTarget(parsedUrl, metadata, client);
  }

  return resolveTreeTarget(parsedUrl, metadata, client);
}
