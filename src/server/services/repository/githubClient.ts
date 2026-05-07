import type { ParsedGitHubUrl } from "../../../shared/types";

type FetchLike = typeof fetch;

export type GitHubRepositoryMetadata = {
  defaultBranch: string;
  visibility: "public" | "private";
};

export type GitHubRepositoryClient = {
  getRepositoryMetadata(parsedUrl: ParsedGitHubUrl): Promise<GitHubRepositoryMetadata>;
  resolveCommitSha(parsedUrl: ParsedGitHubUrl, ref: string): Promise<string>;
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

      const payload = await readJsonOrThrow<{ sha?: string }>(
        response,
        "GitHub returned invalid commit data."
      );

      if (!payload.sha) {
        throw new Error("GitHub returned a commit response without a SHA.");
      }

      return payload.sha;
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
    }
  };
}
