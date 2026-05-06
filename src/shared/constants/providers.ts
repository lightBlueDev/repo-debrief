export const PROVIDER_IDS = ["anthropic", "gemini", "openrouter"] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ProviderModelOption = {
  id: string;
  label: string;
  recommended?: boolean;
};

export type ProviderDefinition = {
  id: ProviderId;
  label: string;
  models: ProviderModelOption[];
  apiKeyLabel: string;
};

export const OPENROUTER_CUSTOM_MODEL_OPTION = "__custom_openrouter_model__";

export const PROVIDERS: ProviderDefinition[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    apiKeyLabel: "Anthropic API Key",
    models: [
      { id: "claude-sonnet-4-0", label: "Claude Sonnet 4", recommended: true },
      { id: "claude-haiku-3-5", label: "Claude Haiku 3.5" }
    ]
  },
  {
    id: "gemini",
    label: "Google Gemini",
    apiKeyLabel: "Google Gemini API Key",
    models: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", recommended: true },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" }
    ]
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    apiKeyLabel: "OpenRouter API Key",
    models: [
      { id: "openai/gpt-4o", label: "OpenAI GPT-4o", recommended: true },
      { id: "anthropic/claude-3.7-sonnet", label: "Claude Sonnet via OpenRouter" },
      { id: OPENROUTER_CUSTOM_MODEL_OPTION, label: "Use a custom model ID" }
    ]
  }
];

export const PROVIDER_LINKS: Record<ProviderId, string> = {
  anthropic: "https://console.anthropic.com/settings/keys",
  gemini: "https://aistudio.google.com/app/apikey",
  openrouter: "https://openrouter.ai/keys"
};

export function getProviderDefinition(providerId: ProviderId): ProviderDefinition {
  const match = PROVIDERS.find((provider) => provider.id === providerId);

  if (!match) {
    throw new Error(`Unsupported provider: ${providerId}`);
  }

  return match;
}

export function isCuratedModel(providerId: ProviderId, modelId: string): boolean {
  return getProviderDefinition(providerId).models.some((model) => model.id === modelId);
}
