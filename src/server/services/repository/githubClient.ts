import type { ParsedGitHubUrl } from "../../../shared/types";

type FetchLike = typeof fetch;

export type GitHubRepositoryMetadata = {
  defaultBranch: string;
  visibility: "public" | "private";
};

export type GitHubCommitDetails = {
  commitSha: string;
  treeSha: string;
};

export type GitHubTreeEntry = {
  path: string;
  type: "blob" | "tree" | "commit";
  size?: number;
};

export type GitHubRepositoryClient = {
  getRepositoryMetadata(parsedUrl: ParsedGitHubUrl): Promise<GitHubRepositoryMetadata>;
  resolveCommitSha(parsedUrl: ParsedGitHubUrl, ref: string): Promise<string>;
  getCommitDetails(parsedUrl: ParsedGitHubUrl, ref: string): Promise<GitHubCommitDetails>;
  refExists(
    parsedUrl: ParsedGitHubUrl,
    ref: string,
    type: "heads" | "tags"
  ): Promise<boolean>;
  pathExistsAtRef(
    parsedUrl: ParsedGitHubUrl,
    subpath: string,
    ref: string
  ): Promise<boolean>;
  listTreeEntries(
    parsedUrl: ParsedGitHubUrl,
    treeSha: string
  ): Promise<GitHubTreeEntry[]>;
  getFileContent(
    parsedUrl: ParsedGitHubUrl,
    path: string,
    ref: string
  ): Promise<string>;
};

type CreateGitHubClientOptions = {
  fetchImpl?: FetchLike;
  githubToken?: string;
};

function createHeaders(githubToken?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Debrief-App"
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  return headers;
}

function getRepoApiBase(parsedUrl: ParsedGitHubUrl): string {
  return `https://api.github.com/repos/${parsedUrl.owner}/${parsedUrl.repo}`;
}

async function readJsonOrThrow<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}

function getFetchImpl(fetchImpl?: FetchLike): FetchLike {
  return fetchImpl ?? fetch;
}

function mapRepoAccessError(status: number): Error {
  if (status === 404) {
    return new Error(
      "We couldn't access this repository. Check that the URL is correct and that the repository is public."
    );
  }

  if (status === 403) {
    return new Error(
      "GitHub is limiting requests right now. Connect GitHub and try again."
    );
  }

  return new Error(
    "We couldn't access this repository. Check that the URL is correct and that the repository is public."
  );
}

export function createGitHubClient({
  fetchImpl,
  githubToken
}: CreateGitHubClientOptions = {}): GitHubRepositoryClient {
  const request = getFetchImpl(fetchImpl);
  const headers = createHeaders(githubToken);

  return {
    async getRepositoryMetadata(parsedUrl) {
      const response = await request(getRepoApiBase(parsedUrl), { headers });

      if (!response.ok) {
        throw mapRepoAccessError(response.status);
      }

      const payload = await readJsonOrThrow<{
        default_branch?: string;
        private?: boolean;
      }>(response, "GitHub returned invalid repository metadata.");

      return {
        defaultBranch: payload.default_branch || "main",
        visibility: payload.private ? "private" : "public"
      };
    },

    async resolveCommitSha(parsedUrl, ref) {
      const details = await this.getCommitDetails(parsedUrl, ref);
      return details.commitSha;
    },

    async getCommitDetails(parsedUrl, ref) {
      const response = await request(
        `${getRepoApiBase(parsedUrl)}/commits/${encodeURIComponent(ref)}`,
        { headers }
      );

      if (response.status === 404) {
        throw new Error("We couldn't resolve that branch or ref on GitHub.");
      }

      if (!response.ok) {
        throw new Error("GitHub could not resolve the requested commit.");
      }

      const payload = await readJsonOrThrow<{
        sha?: string;
        commit?: {
          tree?: {
            sha?: string;
          };
        };
      }>(
        response,
        "GitHub returned invalid commit data."
      );

      if (!payload.sha || !payload.commit?.tree?.sha) {
        throw new Error("GitHub returned commit data without the required tree details.");
      }

      return {
        commitSha: payload.sha,
        treeSha: payload.commit.tree.sha
      };
    },

    async refExists(parsedUrl, ref, type) {
      const response = await request(
        `${getRepoApiBase(parsedUrl)}/git/ref/${type}/${ref
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`,
        { headers }
      );

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        throw new Error("GitHub could not verify the requested branch or tag.");
      }

      return true;
    },

    async pathExistsAtRef(parsedUrl, subpath, ref) {
      const response = await request(
        `${getRepoApiBase(parsedUrl)}/contents/${subpath
          .split("/")
          .map(encodeURIComponent)
          .join("/")}?ref=${encodeURIComponent(ref)}`,
        { headers }
      );

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        throw new Error("GitHub could not verify the requested repository path.");
      }

      return true;
    },

    async listTreeEntries(parsedUrl, treeSha) {
      const response = await request(
        `${getRepoApiBase(parsedUrl)}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("GitHub could not read the repository tree for this target.");
      }

      const payload = await readJsonOrThrow<{
        tree?: Array<{
          path?: string;
          type?: "blob" | "tree" | "commit";
          size?: number;
        }>;
      }>(response, "GitHub returned invalid repository tree data.");

      return (payload.tree ?? [])
        .filter((entry): entry is { path: string; type: "blob" | "tree" | "commit"; size?: number } =>
          Boolean(entry.path && entry.type)
        )
        .map((entry) => ({
          path: entry.path,
          type: entry.type,
          size: entry.size
        }));
    },

    async getFileContent(parsedUrl, path, ref) {
      const response = await request(
        `${getRepoApiBase(parsedUrl)}/contents/${path
          .split("/")
          .map(encodeURIComponent)
          .join("/")}?ref=${encodeURIComponent(ref)}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub could not read the file contents for ${path}.`);
      }

      const payload = await readJsonOrThrow<{
        type?: string;
        encoding?: string;
        content?: string;
      }>(response, "GitHub returned invalid file content data.");

      if (payload.type !== "file" || !payload.content) {
        throw new Error(`GitHub did not return readable file contents for ${path}.`);
      }

      if (payload.encoding === "base64") {
        return Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8");
      }

      return payload.content;
    }
  };
}
