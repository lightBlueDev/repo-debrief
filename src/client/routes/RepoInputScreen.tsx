import { useState, type FormEvent } from "react";

import { getProviderDefinition } from "../../shared/constants/providers";
import type { PublicSessionState } from "../../shared/types";

import { InfoPanel } from "../components/InfoPanel";
import { ShellButton } from "../components/ShellButton";
import { StatusBadge } from "../components/StatusBadge";

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
  const providerLabel = sessionState.ai.provider
    ? getProviderDefinition(sessionState.ai.provider).label
    : "No provider yet";
  const modelLabel = sessionState.ai.model ?? "No model yet";
  const canAnalyze = sessionState.ai.apiKeyConfigured && Boolean(sessionState.ai.model);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

    setMessage(
      "Settings check passed. Repository target resolution and ingestion begin in Milestone 2."
    );
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
            />
          </label>

          <div className="badge-row">
            <StatusBadge label={`Provider: ${providerLabel}`} tone="accent" />
            <StatusBadge label={`Model: ${modelLabel}`} />
          </div>

          {message ? (
            <p className={canAnalyze ? "success-text" : "inline-error settings-error"}>
              {message}
            </p>
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
            <ShellButton type="submit">Debrief This Repo</ShellButton>
          </div>
        </form>
      </InfoPanel>

      <InfoPanel eyebrow="Session State" title="Current Non-Secret State" tone="navy">
        <pre className="state-preview">
          {JSON.stringify(sessionState, null, 2)}
        </pre>
      </InfoPanel>
    </div>
  );
}
