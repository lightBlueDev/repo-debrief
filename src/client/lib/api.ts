import type { PublicSessionState, SettingsFormInput } from "../../shared/types";

type SessionResponse = {
  success: true;
  data: PublicSessionState;
};

type ApiErrorResponse = {
  error: string;
};

async function parseResponse(response: Response): Promise<PublicSessionState> {
  const payload = (await response.json()) as SessionResponse | ApiErrorResponse;

  if (!response.ok) {
    if ("error" in payload) {
      throw new Error(payload.error);
    }

    throw new Error("Request failed.");
  }

  if (!("data" in payload)) {
    throw new Error("Response payload was missing session data.");
  }

  return payload.data;
}

export async function fetchSessionState(): Promise<PublicSessionState> {
  const response = await fetch("/api/session");

  try {
    return await parseResponse(response);
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to load session state.");
  }
}

export async function saveAiSettings(
  input: SettingsFormInput
): Promise<PublicSessionState> {
  const response = await fetch("/api/settings/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return parseResponse(response);
}

export async function clearAiSettings(): Promise<PublicSessionState> {
  const response = await fetch("/api/settings/ai/clear", {
    method: "POST"
  });

  return parseResponse(response);
}
