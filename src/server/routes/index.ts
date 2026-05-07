import { Router } from "express";

import { healthRouter } from "./health";
import { repositoryRouter } from "./repository";
import { settingsRouter } from "./settings";
import { sessionRouter } from "./session";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/repository", repositoryRouter);
apiRouter.use("/session", sessionRouter);
apiRouter.use("/settings", settingsRouter);

export { apiRouter };
