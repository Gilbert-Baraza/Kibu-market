import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import crypto from "crypto";
import env from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import ApiError from "./utils/ApiError.js";

const app = express();

if (env.isDevelopment) {
  console.info("[startup] Cloudinary config", {
    cloudName: env.cloudinaryCloudName || "<missing>",
    folder: env.cloudinaryFolder,
    useCloudinary: env.useCloudinary,
    uploadMaxBytes: env.uploadMaxBytes,
  });
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  return Boolean(env.clientUrl) && origin === env.clientUrl;
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
