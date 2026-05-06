import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  getProviderDefinition,
  OPENROUTER_CUSTOM_MODEL_OPTION,
  PROVIDERS,
  PROVIDER_LINKS,
  type ProviderId
} from "../../shared/constants/providers";
import type { PublicSessionState, SettingsFormInput } from "../../shared/types";
import { InfoPanel } from "../components/InfoPanel";
import { ShellButton } from "../components/ShellButton";

type SettingsScreenProps = {
  sessionState: PublicSessionState;
  saving: boolean;
  onSave: (input: SettingsFormInput) => Promise<void>;
  onClear: () => Promise<void>;
  onBack: () => void;
};

function getInitialProvider(sessionState: PublicSessionState): ProviderId {
  return sessionState.ai.provider ?? "anthropic";
}

function getInitialModel(sessionState: PublicSessionState, provider: ProviderId): string {
  if (sessionState.ai.provider === provider && sessionState.ai.model) {
    const curated = getProviderDefinition(provider).models.some(
      (model) => model.id === sessionState.ai.model
    );

    return curated ? sessionState.ai.model : OPENROUTER_CUSTOM_MODEL_OPTION;
  }

  return (
    getProviderDefinition(provider).models.find((model) => model.recommended)?.id ??
    getProviderDefinition(provider).models[0].id
  );
}

export function SettingsScreen({
  sessionState,
  saving,
  onSave,
  onClear,
  onBack
}: SettingsScreenProps) {
  const [provider, setProvider] = useState<ProviderId>(getInitialProvider(sessionState));
  const [model, setModel] = useState<string>(getInitialModel(sessionState, getInitialProvider(sessionState)));
  const [customModelId, setCustomModelId] = useState(
    sessionState.ai.provider === "openrouter" &&
      sessionState.ai.model &&
      !getProviderDefinition("openrouter").models.some(
        (entry) => entry.id === sessionState.ai.model
      )
      ? sessionState.ai.model
      : ""
  );
  const [apiKey, setApiKey] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const providerDefinition = useMemo(
    () => getProviderDefinition(provider),
    [provider]
  );

  useEffect(() => {
    const nextProvider = getInitialProvider(sessionState);
    setProvider(nextProvider);
    setModel(getInitialModel(sessionState, nextProvider));
    setCustomModelId(
      sessionState.ai.provider === "openrouter" &&
        sessionState.ai.model &&
        !getProviderDefinition("openrouter").models.some(
          (entry) => entry.id === sessionState.ai.model
        )
        ? sessionState.ai.model
        : ""
    );
    setApiKey("");
  }, [sessionState]);

  function handleProviderChange(nextProvider: ProviderId) {
    setProvider(nextProvider);
    const recommendedModel =
      getProviderDefinition(nextProvider).models.find((entry) => entry.recommended)?.id ??
      getProviderDefinition(nextProvider).models[0].id;

    setModel(recommendedModel);
    setCustomModelId("");
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    try {
      await onSave({
        provider,
        model,
        apiKey,
        customModelId
      });
      setApiKey("");
      setFeedback("Settings saved for this session.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save your AI settings."
      );
    }
  }

  async function handleClear() {
    setFeedback(null);
    setError(null);

    try {
      await onClear();
      setApiKey("");
      setFeedback("Session AI settings cleared.");
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Failed to clear your AI settings."
      );
    }
  }

  return (
    <div className="screen-grid">
      <InfoPanel eyebrow="Configuration" title="Configure Your AI Model">
        <p>
          Choose your provider, model, and API key. Your provider bills usage
          directly, and Debrief keeps the key in server session memory only.
        </p>

        <form className="settings-form" onSubmit={handleSubmit}>
          <label className="input-stack" htmlFor="provider">
            <span>Provider</span>
            <select
              id="provider"
              className="shell-input"
              value={provider}
              onChange={(event) => handleProviderChange(event.target.value as ProviderId)}
              disabled={saving}
            >
              {PROVIDERS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <label className="input-stack" htmlFor="model">
            <span>Model</span>
            <select
              id="model"
              className="shell-input"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              disabled={saving}
            >
              {providerDefinition.models.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                  {entry.recommended ? " (Recommended)" : ""}
                </option>
              ))}
            </select>
          </label>

          {provider === "openrouter" && model === OPENROUTER_CUSTOM_MODEL_OPTION ? (
            <label className="input-stack" htmlFor="custom-model">
              <span>Custom OpenRouter model ID</span>
              <input
                id="custom-model"
                type="text"
                className="shell-input"
                placeholder="for example: meta-llama/llama-3.1-405b-instruct"
                value={customModelId}
                onChange={(event) => setCustomModelId(event.target.value)}
                disabled={saving}
              />
            </label>
          ) : null}

          <label className="input-stack" htmlFor="api-key">
            <span>{providerDefinition.apiKeyLabel}</span>
            <input
              id="api-key"
              type="password"
              className="shell-input"
              placeholder={
                sessionState.ai.apiKeyConfigured &&
                sessionState.ai.provider === provider
                  ? "Leave blank to keep the current key for this provider"
                  : "Paste your API key"
              }
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              disabled={saving}
            />
          </label>

          <p className="helper-text">
            Get an API key:{" "}
            <a href={PROVIDER_LINKS[provider]} target="_blank" rel="noreferrer">
              {providerDefinition.label}
            </a>
          </p>

          <p className="helper-text">
            {sessionState.ai.apiKeyConfigured
              ? "An API key is already configured for this session."
              : "No API key is configured for this session yet."}
          </p>

          {feedback ? <p className="success-text">{feedback}</p> : null}
          {error ? <p className="inline-error settings-error">{error}</p> : null}

          <div className="panel-actions">
            <ShellButton onClick={onBack} type="button" variant="ghost">
              Back
            </ShellButton>
            {sessionState.ai.apiKeyConfigured ? (
              <ShellButton
                onClick={() => {
                  void handleClear();
                }}
                type="button"
                variant="ghost"
                disabled={saving}
              >
                Clear Settings
              </ShellButton>
            ) : null}
            <ShellButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </ShellButton>
          </div>
        </form>
      </InfoPanel>

      <InfoPanel eyebrow="Rules" title="Session Safety Rules" tone="navy">
        <ul className="stack-list">
          <li>Provider, model, and API key are required before analysis.</li>
          <li>Raw keys never live in browser storage.</li>
          <li>GitHub auth is optional for public repos.</li>
          <li>All model calls happen on the backend.</li>
          <li>Clearing settings removes the saved key from the active session.</li>
        </ul>
      </InfoPanel>
    </div>
  );
}
