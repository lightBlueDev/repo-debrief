import assert from "node:assert/strict";
import test from "node:test";

import { parseGitHubUrl } from "./parseGitHubUrl";

test("parses a root GitHub repository URL", () => {
  const parsed = parseGitHubUrl("https://github.com/lightBlueDev/repo-debrief");

  assert.equal(parsed.kind, "root");
  assert.equal(parsed.owner, "lightBlueDev");
  assert.equal(parsed.repo, "repo-debrief");
  assert.equal(parsed.normalizedUrl, "https://github.com/lightBlueDev/repo-debrief");
});

test("parses a root GitHub repository URL with trailing slash and .git suffix", () => {
  const parsed = parseGitHubUrl("https://github.com/lightBlueDev/repo-debrief.git/");

  assert.equal(parsed.kind, "root");
  assert.equal(parsed.repo, "repo-debrief");
});

test("parses a subdirectory GitHub URL and preserves the full tree tail", () => {
  const parsed = parseGitHubUrl(
    "https://github.com/lightBlueDev/repo-debrief/tree/main/apps/web"
  );

  assert.equal(parsed.kind, "tree");
  assert.equal(parsed.owner, "lightBlueDev");
  assert.equal(parsed.repo, "repo-debrief");
  assert.equal(parsed.treeTail, "main/apps/web");
  assert.deepEqual(parsed.treeSegments, ["main", "apps", "web"]);
});

test("preserves ambiguous ref-with-slashes tails for later resolution", () => {
  const parsed = parseGitHubUrl(
    "https://github.com/lightBlueDev/repo-debrief/tree/feature/ui/apps/web"
  );

  assert.equal(parsed.kind, "tree");
  assert.equal(parsed.treeTail, "feature/ui/apps/web");
  assert.deepEqual(parsed.treeSegments, ["feature", "ui", "apps", "web"]);
});

test("rejects unsupported GitHub link shapes", () => {
  assert.throws(
    () =>
      parseGitHubUrl(
        "https://github.com/lightBlueDev/repo-debrief/blob/main/README.md"
      ),
    /isn't supported yet/
  );
});

test("rejects non-GitHub hosts", () => {
  assert.throws(
    () => parseGitHubUrl("https://gitlab.com/lightBlueDev/repo-debrief"),
    /github\.com/
  );
});
