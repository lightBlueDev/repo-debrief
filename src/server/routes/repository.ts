import { Router } from "express";

import { repositoryUrlInputSchema } from "../../shared/schemas/repository";
import { parseGitHubUrl } from "../services/repository/parseGitHubUrl";
import { resolveRepositoryTarget } from "../services/repository/resolveRepositoryTarget";

const repositoryRouter = Router();

repositoryRouter.post("/resolve", async (req, res) => {
  const parsedInput = repositoryUrlInputSchema.safeParse(req.body);

  if (!parsedInput.success) {
    const firstIssue = parsedInput.error.issues[0];
    res.status(400).json({
      error: firstIssue?.message || "Invalid repository URL payload."
    });
    return;
  }

  try {
    const parsedUrl = parseGitHubUrl(parsedInput.data.repoUrl);
    const resolvedTarget = await resolveRepositoryTarget(parsedUrl, {
      githubToken: req.session.githubToken
    });

    res.json({
      success: true,
      data: resolvedTarget
    });
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "We couldn't resolve that repository target."
    });
  }
});

export { repositoryRouter };
