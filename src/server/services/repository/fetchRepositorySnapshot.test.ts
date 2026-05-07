import assert from "node:assert/strict";
import test from "node:test";

import type {
  RepositorySnapshot,
  ResolvedRepositoryTarget
} from "../../../shared/types";
import type {
  GitHubCommitDetails,
  GitHubRepositoryClient,
  GitHubRepositoryMetadata,
  GitHubTreeEntry
} from "./githubClient";
import { fetchRepositorySnapshot } from "./fetchRepositorySnapshot";

function createResolvedTarget(
  overrides: Partial<ResolvedRepositoryTarget> = {}
): ResolvedRepositoryTarget {
  return {
    provider: "github",
    owner: "lightBlueDev",
    repo: "repo-debrief",
    repoUrl: "https://github.com/lightBlueDev/repo-debrief",
    submittedUrl: "https://github.com/lightBlueDev/repo-debrief",
    ref: "main",
    subpath: null,
    commitSha: "abc123",
    defaultBranch: "main",
    visibility: "public",
    ...overrides
  };
}

function createSnapshotClientMock(): {
  client: GitHubRepositoryClient;
  calls: {
    commitRefs: string[];
    fileRefs: string[];
    filePaths: string[];
  };
} {
  const calls = {
    commitRefs: [] as string[],
    fileRefs: [] as string[],
    filePaths: [] as string[]
  };

  const client: GitHubRepositoryClient = {
    async getRepositoryMetadata(): Promise<GitHubRepositoryMetadata> {
      return {
        defaultBranch: "main",
        visibility: "public"
      };
    },
    async resolveCommitSha(): Promise<string> {
      return "abc123";
    },
    async getCommitDetails(_parsedUrl, ref): Promise<GitHubCommitDetails> {
      calls.commitRefs.push(ref);
      return {
        commitSha: "abc123",
        treeSha: "tree123"
      };
    },
    async refExists(): Promise<boolean> {
      return true;
    },
    async pathExistsAtRef(): Promise<boolean> {
      return true;
    },
    async listTreeEntries(): Promise<GitHubTreeEntry[]> {
      return [
        { path: "README.md", type: "blob", size: 10 },
        { path: "src/app.ts", type: "blob", size: 25 },
        { path: "src", type: "tree" },
        { path: "docs/guide.md", type: "blob", size: 15 }
      ];
    },
    async getFileContent(_parsedUrl, path, ref): Promise<string> {
      calls.filePaths.push(path);
      calls.fileRefs.push(ref);
      return `content:${path}`;
    }
  };

  return { client, calls };
}

function toSnapshotMap(snapshot: RepositorySnapshot): Record<string, string> {
  return Object.fromEntries(snapshot.files.map((file) => [file.path, file.content]));
}

test("fetches a deterministic full-repo snapshot from the resolved commit", async () => {
  const { client, calls } = createSnapshotClientMock();
  const snapshot = await fetchRepositorySnapshot(createResolvedTarget(), {
    client
  });

  assert.deepEqual(snapshot.files.map((file) => file.path), [
    "docs/guide.md",
    "README.md",
    "src/app.ts"
  ]);
  assert.deepEqual(toSnapshotMap(snapshot), {
    "README.md": "content:README.md",
    "docs/guide.md": "content:docs/guide.md",
    "src/app.ts": "content:src/app.ts"
  });
  assert.deepEqual(calls.commitRefs, ["abc123"]);
  assert.deepEqual(calls.fileRefs, ["abc123", "abc123", "abc123"]);
});

test("scopes a subdirectory snapshot and rewrites paths relative to the target root", async () => {
  const { client } = createSnapshotClientMock();
  const snapshot = await fetchRepositorySnapshot(
    createResolvedTarget({
      submittedUrl: "https://github.com/lightBlueDev/repo-debrief/tree/main/src",
      subpath: "src"
    }),
    { client }
  );

  assert.deepEqual(snapshot.files.map((file) => file.path), ["app.ts"]);
  assert.deepEqual(toSnapshotMap(snapshot), {
    "app.ts": "content:src/app.ts"
  });
});
