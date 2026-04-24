import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import env from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import ApiError from "./utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = new Set(env.clientUrls);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  if (env.clientOriginRegexes.some((pattern) => pattern.test(origin))) {
    return true;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1):(51\d{2}|4173)$/.test(origin);
}

app.disable("x-powered-by");
app.set("trust proxy", env.trustProxy);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new ApiError(403, `CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: env.isProduction
      ? {
          maxAge: 15552000,
          includeSubDomains: true,
        }
      : false,
    referrerPolicy: { policy: "no-referrer" },
    permissionsPolicy: {
      features: {
        camera: [],
        geolocation: [],
        microphone: [],
        payment: [],
      },
    },
  }),
);

if (env.nodeEnv !== "test") {
  app.use(morgan(env.isProduction ? "combined" : "dev"));
}

app.use(express.json({ limit: env.bodySizeLimit }));
app.use(
  express.urlencoded({
    extended: true,
    limit: env.bodySizeLimit,
    parameterLimit: 100,
  }),
);

app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  res.setHeader(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(), payment=()",
  );

  if (req.path === "/health" || req.path.startsWith("/api/auth")) {
    res.setHeader("Cache-Control", "no-store");
  }

  next();
});

app.use(
  `/${env.uploadsDir}`,
  express.static(path.resolve(__dirname, "..", env.uploadsDir), {
    fallthrough: false,
    index: false,
    maxAge: env.isProduction ? "1d" : 0,
  }),
);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "kibu-market-backend",
    environment: env.nodeEnv,
  });
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
