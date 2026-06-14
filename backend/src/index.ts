import cors from "cors";
import express from "express";
import fs from "fs";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import aiRouter from "./routes/ai";
import apiKeysRouter from "./routes/apikeys";
import authRouter from "./routes/auth";
import healthRouter from "./routes/health";
import knowledgeRouter from "./routes/knowledge";
import leadsRouter from "./routes/leads";
import webhooksRouter from "./routes/webhooks";

const app = express();
const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/leads", leadsRouter);
app.use("/webhooks", webhooksRouter);
app.use("/api-keys", apiKeysRouter);
app.use("/ai", aiRouter);
app.use("/knowledge", knowledgeRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
