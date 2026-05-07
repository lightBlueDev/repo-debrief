import type {
  ParsedGitHubUrl,
  RepositorySnapshot,
  RepositorySnapshotFile,
  ResolvedRepositoryTarget
} from "../../../shared/types";
import { createGitHubClient, type GitHubRepositoryClient } from "./githubClient";

type SnapshotDependencies = {
  client?: GitHubRepositoryClient;
  fetchImpl?: typeof fetch;
  githubToken?: string;
};

function createParsedRootUrl(target: ResolvedRepositoryTarget): ParsedGitHubUrl {
  return {
    provider: "github",
    kind: "root",
    submittedUrl: target.submittedUrl,
    normalizedUrl: target.repoUrl,
    owner: target.owner,
    repo: target.repo
  };
}

function toScopedPath(path: string, subpath: string | null): string | null {
  if (!subpath) {
    return path;
  }

  const prefix = `${subpath}/`;

  if (!path.startsWith(prefix)) {
    return null;
  }

  return path.slice(prefix.length);
}

function createSnapshotClient(
  dependencies: SnapshotDependencies
): GitHubRepositoryClient {
  return (
    dependencies.client ??
    createGitHubClient({
      fetchImpl: dependencies.fetchImpl,
      githubToken: dependencies.githubToken
    })
  );
}

export async function fetchRepositorySnapshot(
  target: ResolvedRepositoryTarget,
  dependencies: SnapshotDependencies = {}
): Promise<RepositorySnapshot> {
  const client = createSnapshotClient(dependencies);
  const parsedUrl = createParsedRootUrl(target);
  const commitDetails = await client.getCommitDetails(parsedUrl, target.commitSha);
  const treeEntries = await client.listTreeEntries(parsedUrl, commitDetails.treeSha);

  const fileEntries = treeEntries
    .filter((entry) => entry.type === "blob")
    .map((entry) => ({
      repoPath: entry.path,
      scopedPath: toScopedPath(entry.path, target.subpath)
    }))
    .filter(
      (entry): entry is { repoPath: string; scopedPath: string } =>
        entry.scopedPath !== null
    )
    .sort((left, right) => left.scopedPath.localeCompare(right.scopedPath));

  const files: RepositorySnapshotFile[] = [];

  for (const entry of fileEntries) {
    const content = await client.getFileContent(
      parsedUrl,
      entry.repoPath,
      target.commitSha
    );

    files.push({
      path: entry.scopedPath,
      content,
      sizeBytes: Buffer.byteLength(content, "utf8")
    });
  }

  return {
    target,
    files
  };
}
