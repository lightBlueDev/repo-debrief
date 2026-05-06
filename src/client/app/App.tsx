import { useEffect, useState } from "react";

import type { PublicSessionState, SettingsFormInput } from "../../shared/types";
import { StatusBadge } from "../components/StatusBadge";
import { clearAiSettings, fetchSessionState, saveAiSettings } from "../lib/api";
import { LandingScreen } from "../routes/LandingScreen";
import { RepoInputScreen } from "../routes/RepoInputScreen";
import { SettingsScreen } from "../routes/SettingsScreen";

type ViewKey = "landing" | "settings" | "repo";

const EMPTY_SESSION: PublicSessionState = {
  ai: {
    provider: null,
    model: null,
    apiKeyConfigured: false
  },
  github: {
    connected: false,
    username: null,
    avatarUrl: null
  }
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>("landing");
  const [sessionState, setSessionState] = useState<PublicSessionState>(EMPTY_SESSION);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      try {
        const data = await fetchSessionState();
        if (!ignore) {
          setSessionState(data);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load session state."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleSaveSettings(input: SettingsFormInput) {
    setSavingSettings(true);
    setError(null);

    try {
      const nextState = await saveAiSettings(input);
      setSessionState(nextState);
      setActiveView("repo");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleClearSettings() {
    setSavingSettings(true);
    setError(null);

    try {
      const nextState = await clearAiSettings();
      setSessionState(nextState);
      setActiveView("settings");
    } finally {
      setSavingSettings(false);
    }
  }

  let content = null;
  if (activeView === "landing") {
    content = (
      <LandingScreen
        onPrimaryAction={() => setActiveView("settings")}
        onSecondaryAction={() => setActiveView("repo")}
      />
    );
  } else if (activeView === "settings") {
    content = (
      <SettingsScreen
        sessionState={sessionState}
        saving={savingSettings}
        onSave={handleSaveSettings}
        onClear={handleClearSettings}
        onBack={() => setActiveView("landing")}
      />
    );
  } else {
    content = (
      <RepoInputScreen
        sessionState={sessionState}
        onGoToSettings={() => setActiveView("settings")}
        onBack={() => setActiveView("landing")}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="topbar-brand">Debrief</p>
          <p className="topbar-subtitle">Milestone 1 settings flow</p>
        </div>

        <div className="topbar-status">
          <StatusBadge label="Backend-owned architecture" tone="accent" />
          <StatusBadge
            label={
              sessionState.ai.apiKeyConfigured
                ? "AI settings configured"
                : "AI settings not configured"
            }
          />
        </div>
      </header>

      <main className="page-frame">
        <aside className="sidebar-card">
          <p className="sidebar-label">Build Focus</p>
          <h2>Clean restart for the real product</h2>
          <ul className="stack-list">
            <li>Separate client, server, and shared code.</li>
            <li>Keep secrets server-side from the start.</li>
            <li>Make the Settings-first flow real before ingestion.</li>
          </ul>
        </aside>

        <section className="content-card">
          {loading ? <p className="muted-text">Loading session state...</p> : content}
          {error ? <p className="inline-error">{error}</p> : null}
        </section>
      </main>
    </div>
  );
}
