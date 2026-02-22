import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
import { loadConfig } from "./config";
import { TokenManager } from "./token";
import { VeeamClient } from "./veeamClient";
import { RepositoriesStatesResponse } from "./types";

const config = loadConfig();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: config.corsOrigin ?? "*",
  }),
);

const tokens = new TokenManager();
const veeam = new VeeamClient(tokens);

app.get("/api/veeam/jobs/states", async (_req, res) => {
  try {
    const data = await veeam.getJobsStates();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream error" });
  }
});

app.get("/api/veeam/repositories/states", async (_req, res) => {
  try {
    const data = await veeam.getRepositoriesStates();
    const normalized: RepositoriesStatesResponse = {
      data: data.data.map((r) => {
        const cap = r.capacityGB ?? 0;
        const used = r.usedSpaceGB ?? (cap && r.freeGB !== undefined ? cap - r.freeGB : undefined);
        return {
          ...r,
          usedSpaceGB: used,
        };
      }),
    };
    res.json(normalized);
  } catch (e) {
    res.status(502).json({ error: "Upstream error" });
  }
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.listen(config.port, () => {
  // no-op
});
