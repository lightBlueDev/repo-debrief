import session from "express-session";

import type { PublicSessionState, SavedSessionAiConfig } from "../../shared/types";

declare module "express-session" {
  interface SessionData {
    aiConfig?: SavedSessionAiConfig;
    github?: {
      connected: boolean;
      username: string | null;
      avatarUrl: string | null;
    };
  }
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const sessionMiddleware = session({
  name: "debrief.sid",
  secret: process.env.SESSION_SECRET || "debrief-local-dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DAY_IN_MS
  }
});

export function getPublicSessionState(sessionData: session.Session & Partial<session.SessionData>): PublicSessionState {
  return {
    ai: {
      provider: sessionData.aiConfig?.provider ?? null,
      model: sessionData.aiConfig?.model ?? null,
      apiKeyConfigured: Boolean(sessionData.aiConfig?.apiKey)
    },
    github: {
      connected: sessionData.github?.connected ?? false,
      username: sessionData.github?.username ?? null,
      avatarUrl: sessionData.github?.avatarUrl ?? null
    }
  };
}
