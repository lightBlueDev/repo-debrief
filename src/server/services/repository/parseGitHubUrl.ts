import type { ParsedGitHubUrl } from "../../../shared/types";

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    throw new Error("That GitHub URL contains an invalid encoded path segment.");
  }
}

function normalizeRepoSegment(repoSegment: string): string {
  return repoSegment.endsWith(".git") ? repoSegment.slice(0, -4) : repoSegment;
}

function normalizeHost(host: string): string {
  return host.toLowerCase() === "www.github.com" ? "github.com" : host.toLowerCase();
}

export function parseGitHubUrl(submittedUrl: string): ParsedGitHubUrl {
  let url: URL;

  try {
    url = new URL(submittedUrl);
  } catch {
    throw new Error("Enter a valid GitHub repository URL.");
  }

  const normalizedHost = normalizeHost(url.host);

  if (normalizedHost !== "github.com") {
    throw new Error("Use a GitHub repository URL from github.com.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Use an HTTP or HTTPS GitHub URL.");
  }

  const rawSegments = url.pathname.split("/").filter(Boolean);

  if (rawSegments.length < 2) {
    throw new Error("That GitHub URL is missing the owner or repository name.");
  }

  const owner = decodeSegment(rawSegments[0]);
  const repo = decodeSegment(normalizeRepoSegment(rawSegments[1]));

  if (!owner || !repo) {
    throw new Error("That GitHub URL is missing the owner or repository name.");
  }

  if (rawSegments.length === 2) {
    return {
      provider: "github",
      kind: "root",
      submittedUrl: url.toString(),
      normalizedUrl: `https://github.com/${owner}/${repo}`,
      owner,
      repo
    };
  }

  if (rawSegments[2] !== "tree") {
    throw new Error(
      "That GitHub link isn't supported yet. Use a repo URL or a repo subdirectory URL."
    );
  }

  const treeSegments = rawSegments.slice(3).map(decodeSegment);

  if (treeSegments.length < 2) {
    throw new Error(
      "Use a GitHub subdirectory URL in the format github.com/owner/repo/tree/ref/path."
    );
  }

  const treeTail = treeSegments.join("/");

  return {
    provider: "github",
    kind: "tree",
    submittedUrl: url.toString(),
    normalizedUrl: `https://github.com/${owner}/${repo}/tree/${treeTail}`,
    owner,
    repo,
    treeTail,
    treeSegments
  };
}
