import { Router } from "express";

import { healthRouter } from "./health";
import { settingsRouter } from "./settings";
import { sessionRouter } from "./session";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/session", sessionRouter);
apiRouter.use("/settings", settingsRouter);

export { apiRouter };
