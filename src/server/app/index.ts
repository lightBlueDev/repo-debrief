import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import { createServer as createViteServer } from "vite";

import { apiRouter } from "../routes";
import { sessionMiddleware } from "../session/session";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json());
app.use(sessionMiddleware);
app.use("/api", apiRouter);

async function start() {
  if (isProduction) {
    const clientDist = path.resolve(__dirname, "../../../dist/client");
    app.use(express.static(clientDist));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Debrief dev server running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start Debrief app", error);
  process.exit(1);
});
