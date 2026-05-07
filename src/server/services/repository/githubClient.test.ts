import assert from "node:assert/strict";
import test from "node:test";

import { parseGitHubUrl } from "./parseGitHubUrl";
import { createGitHubClient } from "./githubClient";

type RecordedRequest = {
  url: string;
  headers: Headers;
};

function createFetchRecorder(
  responder: (url: string) => Response | Promise<Response>
): { fetchImpl: typeof fetch; requests: RecordedRequest[] } {
  const requests: RecordedRequest[] = [];

  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const headers = new Headers(init?.headers);
    requests.push({ url, headers });
    return responder(url);
  }) as typeof fetch;

  return { fetchImpl, requests };
}

test("includes the GitHub token when one is provided", async () => {
  const parsed = parseGitHubUrl("https://github.com/lightBlueDev/repo-debrief");
  const { fetchImpl, requests } = createFetchRecorder(
    () =>
      new Response(JSON.stringify({ default_branch: "main", private: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
  );

  const client = createGitHubClient({
    fetchImpl,
    githubToken: "secret-token"
  });

  await client.getRepositoryMetadata(parsed);

  assert.equal(requests[0]?.headers.get("Authorization"), "Bearer secret-token");
});

test("omits the GitHub token when one is not present", async () => {
  const parsed = parseGitHubUrl("https://github.com/lightBlueDev/repo-debrief");
  const { fetchImpl, requests } = createFetchRecorder(
    () =>
      new Response(JSON.stringify({ default_branch: "main", private: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
  );

  const client = createGitHubClient({ fetchImpl });

  await client.getRepositoryMetadata(parsed);

  assert.equal(requests[0]?.headers.has("Authorization"), false);
});

test("maps GitHub rate limiting to a user-facing message", async () => {
  const parsed = parseGitHubUrl("https://github.com/lightBlueDev/repo-debrief");
  const { fetchImpl } = createFetchRecorder(() => new Response(null, { status: 403 }));
  const client = createGitHubClient({ fetchImpl });

  await assert.rejects(
    () => client.getRepositoryMetadata(parsed),
    /GitHub is limiting requests right now/
  );
});
