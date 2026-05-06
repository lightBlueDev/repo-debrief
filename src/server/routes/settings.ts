import { Router } from "express";

import {
  getProviderDefinition,
  isCuratedModel,
  OPENROUTER_CUSTOM_MODEL_OPTION
} from "../../shared/constants/providers";
import { settingsFormInputSchema } from "../../shared/schemas/session";
import { getPublicSessionState } from "../session/session";

const settingsRouter = Router();

settingsRouter.post("/ai", (req, res) => {
  const parsed = settingsFormInputSchema.safeParse(req.body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    res.status(400).json({
      error: firstIssue?.message || "Invalid settings payload."
    });
    return;
  }

  const { provider, model, customModelId } = parsed.data;
  const submittedApiKey = parsed.data.apiKey?.trim() ?? "";
  const existingConfig = req.session.aiConfig;
  const providerDefinition = getProviderDefinition(provider);

  if (!isCuratedModel(provider, model)) {
    res.status(400).json({
      error: `The selected model is not available for ${providerDefinition.label}.`
    });
    return;
  }

  const resolvedModel =
    provider === "openrouter" && model === OPENROUTER_CUSTOM_MODEL_OPTION
      ? customModelId?.trim() ?? ""
      : model;

  if (!resolvedModel) {
    res.status(400).json({
      error: "Choose a valid model before saving your settings."
    });
    return;
  }

  const canReuseExistingKey =
    Boolean(existingConfig?.apiKey) && existingConfig?.provider === provider;

  if (!submittedApiKey && !canReuseExistingKey) {
    res.status(400).json({
      error: `Enter your ${providerDefinition.apiKeyLabel} before saving.`
    });
    return;
  }

  req.session.aiConfig = {
    provider,
    model: resolvedModel,
    apiKey: submittedApiKey || existingConfig?.apiKey || null
  };

  res.json({
    success: true,
    data: getPublicSessionState(req.session)
  });
});

settingsRouter.post("/ai/clear", (req, res) => {
  req.session.aiConfig = {
    provider: null,
    model: null,
    apiKey: null
  };

  res.json({
    success: true,
    data: getPublicSessionState(req.session)
  });
});

export { settingsRouter };
