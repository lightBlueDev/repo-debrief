import { useState, type FormEvent } from "react";

import { getProviderDefinition } from "../../shared/constants/providers";
import type { PublicSessionState, ResolvedRepositoryTarget } from "../../shared/types";

import { InfoPanel } from "../components/InfoPanel";
import { ShellButton } from "../components/ShellButton";
import { StatusBadge } from "../components/StatusBadge";
import { resolveRepositoryTarget } from "../lib/api";

type RepoInputScreenProps = {
  sessionState: PublicSessionState;
  onGoToSettings: () => void;
  onBack: () => void;
};

export function RepoInputScreen({
  sessionState,
  onGoToSettings,
  onBack
}: RepoInputScreenProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resolvedTarget, setResolvedTarget] = useState<ResolvedRepositoryTarget | null>(null);
  const [resolving, setResolving] = useState(false);
  const providerLabel = sessionState.ai.provider
    ? getProviderDefinition(sessionState.ai.provider).label
    : "No provider yet";
  const modelLabel = sessionState.ai.model ?? "No model yet";
  const canAnalyze = sessionState.ai.apiKeyConfigured && Boolean(sessionState.ai.model);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setResolvedTarget(null);

    if (!canAnalyze) {
      setMessage(
        "No AI model is configured yet. Go to Settings to choose a provider, model, and API key before running an analysis."
      );
      return;
    }

    if (!repoUrl.trim()) {
      setMessage("Paste a GitHub repository URL before continuing.");
      return;
    }

    setResolving(true);

    try {
      const target = await resolveRepositoryTarget({ repoUrl });
      setResolvedTarget(target);
      setMessage(
        "Repository target resolved. This is the exact repo/ref/path scope the deterministic ingestion pipeline will use next."
      );
    } catch (resolveError) {
      setMessage(
        resolveError instanceof Error
          ? resolveError.message
          : "We couldn't resolve that repository target."
      );
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="screen-grid">
      <InfoPanel eyebrow="Repository Input" title="Repo Intake Shell">
        <p>
          This screen now enforces the Settings requirement. In Milestone 2 it
          will hand off into exact GitHub target resolution and ingestion.
        </p>

        <form className="settings-form" onSubmit={handleSubmit}>
          <label className="input-stack" htmlFor="repo-url">
            <span>GitHub repository URL</span>
            <input
              id="repo-url"
              type="text"
              className="shell-input"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              disabled={resolving}
            />
          </label>

          <div className="badge-row">
            <StatusBadge label={`Provider: ${providerLabel}`} tone="accent" />
            <StatusBadge label={`Model: ${modelLabel}`} />
          </div>

          {message ? (
            <p
              className={
                resolvedTarget ? "success-text" : "inline-error settings-error"
              }
            >
              {message}
            </p>
          ) : null}

          {resolvedTarget ? (
            <div className="resolved-target-card">
              <div className="resolved-target-grid">
                <div>
                  <span className="resolved-target-label">Repository</span>
                  <strong>{resolvedTarget.owner}/{resolvedTarget.repo}</strong>
                </div>
                <div>
                  <span className="resolved-target-label">Ref</span>
                  <strong>{resolvedTarget.ref}</strong>
                </div>
                <div>
                  <span className="resolved-target-label">Subpath</span>
                  <strong>{resolvedTarget.subpath ?? "Entire repository"}</strong>
                </div>
                <div>
                  <span className="resolved-target-label">Commit</span>
                  <strong>{resolvedTarget.commitSha}</strong>
                </div>
              </div>
            </div>
          ) : null}

          <div className="panel-actions">
            <ShellButton variant="ghost" onClick={onBack} type="button">
              Back
            </ShellButton>
            {!canAnalyze ? (
              <ShellButton variant="ghost" onClick={onGoToSettings} type="button">
                Go to Settings
              </ShellButton>
            ) : null}
            <ShellButton type="submit" disabled={resolving}>
              {resolving ? "Resolving..." : "Debrief This Repo"}
            </ShellButton>
          </div>
        </form>
      </InfoPanel>

      <InfoPanel
        eyebrow="Resolution State"
        title={resolvedTarget ? "Resolved Repository Target" : "Current Non-Secret State"}
        tone="navy"
      >
        <pre className="state-preview">
          {JSON.stringify(resolvedTarget ?? sessionState, null, 2)}
        </pre>
      </InfoPanel>
    </div>
  );
}
