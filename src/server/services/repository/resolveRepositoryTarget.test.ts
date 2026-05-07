import assert from "node:assert/strict";
import test from "node:test";

import { parseGitHubUrl } from "./parseGitHubUrl";
import { resolveRepositoryTarget } from "./resolveRepositoryTarget";

type MockResponseInit = {
  status: number;
  body?: unknown;
};

function createJsonResponse({ status, body }: MockResponseInit): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function createFetchMock(routes: Array<[string, MockResponseInit]>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const match = routes.find(([route]) => url === route);

    if (!match) {
      throw new Error(`Unexpected fetch request in test: ${url}`);
    }

    return createJsonResponse(match[1]);
  }) as typeof fetch;
}

test("resolves a root repository target using the default branch", async () => {
  const parsed = parseGitHubUrl("https://github.com/lightBlueDev/repo-debrief");
  const fetchMock = createFetchMock([
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief",
      {
        status: 200,
        body: { default_branch: "main", private: false }
      }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/commits/main",
      {
        status: 200,
        body: { sha: "abc123", commit: { tree: { sha: "tree123" } } }
      }
    ]
  ]);

  const resolved = await resolveRepositoryTarget(parsed, { fetchImpl: fetchMock });

  assert.equal(resolved.ref, "main");
  assert.equal(resolved.subpath, null);
  assert.equal(resolved.commitSha, "abc123");
  assert.equal(resolved.repoUrl, "https://github.com/lightBlueDev/repo-debrief");
});

test("resolves a subdirectory target with an unambiguous ref", async () => {
  const parsed = parseGitHubUrl(
    "https://github.com/lightBlueDev/repo-debrief/tree/main/apps/web"
  );
  const fetchMock = createFetchMock([
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief",
      {
        status: 200,
        body: { default_branch: "main", private: false }
      }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/git/ref/heads/main/apps",
      { status: 404 }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/git/ref/tags/main/apps",
      { status: 404 }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/git/ref/heads/main",
      { status: 200, body: { ref: "refs/heads/main" } }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/contents/apps/web?ref=main",
      { status: 200, body: { type: "dir" } }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/commits/main",
      { status: 200, body: { sha: "def456", commit: { tree: { sha: "tree456" } } } }
    ]
  ]);

  const resolved = await resolveRepositoryTarget(parsed, { fetchImpl: fetchMock });

  assert.equal(resolved.ref, "main");
  assert.equal(resolved.subpath, "apps/web");
  assert.equal(resolved.commitSha, "def456");
});

test("resolves a subdirectory target where the ref contains slashes", async () => {
  const parsed = parseGitHubUrl(
    "https://github.com/lightBlueDev/repo-debrief/tree/feature/ui/apps/web"
  );
  const fetchMock = createFetchMock([
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief",
      {
        status: 200,
        body: { default_branch: "main", private: false }
      }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/git/ref/heads/feature/ui/apps",
      { status: 404 }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/git/ref/tags/feature/ui/apps",
      { status: 404 }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/git/ref/heads/feature/ui",
      { status: 200, body: { ref: "refs/heads/feature/ui" } }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/contents/apps/web?ref=feature%2Fui",
      { status: 200, body: { type: "dir" } }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/commits/feature%2Fui",
      { status: 200, body: { sha: "ghi789", commit: { tree: { sha: "tree789" } } } }
    ]
  ]);

  const resolved = await resolveRepositoryTarget(parsed, { fetchImpl: fetchMock });

  assert.equal(resolved.ref, "feature/ui");
  assert.equal(resolved.subpath, "apps/web");
  assert.equal(resolved.commitSha, "ghi789");
});

test("fails clearly when the repo is private or inaccessible", async () => {
  const parsed = parseGitHubUrl("https://github.com/lightBlueDev/repo-debrief");
  const fetchMock = createFetchMock([
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief",
      {
        status: 200,
        body: { default_branch: "main", private: true }
      }
    ]
  ]);

  await assert.rejects(
    () => resolveRepositoryTarget(parsed, { fetchImpl: fetchMock }),
    /repository\. Check that the URL is correct and that the repository is public/
  );
});

test("fails clearly when the subpath does not exist at the resolved ref", async () => {
  const parsed = parseGitHubUrl(
    "https://github.com/lightBlueDev/repo-debrief/tree/main/apps/web"
  );
  const fetchMock = createFetchMock([
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief",
      {
        status: 200,
        body: { default_branch: "main", private: false }
      }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/git/ref/heads/main/apps",
      { status: 404 }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/git/ref/tags/main/apps",
      { status: 404 }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/git/ref/heads/main",
      { status: 200, body: { ref: "refs/heads/main" } }
    ],
    [
      "https://api.github.com/repos/lightBlueDev/repo-debrief/contents/apps/web?ref=main",
      { status: 404 }
    ]
  ]);

  await assert.rejects(
    () => resolveRepositoryTarget(parsed, { fetchImpl: fetchMock }),
    /couldn't find that subdirectory/
  );
});
