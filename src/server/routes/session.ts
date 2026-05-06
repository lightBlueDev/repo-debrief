import { Router } from "express";

import { getPublicSessionState } from "../session/session";

const sessionRouter = Router();

sessionRouter.get("/", (req, res) => {
  res.json({
    success: true,
    data: getPublicSessionState(req.session)
  });
});

export { sessionRouter };
