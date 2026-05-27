import "dotenv/config";
import express, { Response, NextFunction } from 'express';
import type { Request } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import SQLiteStore from 'connect-sqlite3';
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "node:http";
import path from "path";
import { pushIpLog } from "./ipLog";

const app = express();
const httpServer = createServer(app);

// Trust proxy — required for pplx.app reverse proxy (secure cookies + rate limit IPs)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Vite HMR and inline scripts need flexibility
  crossOriginEmbedderPolicy: false,
}));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Serve uploaded avatars statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in 15 minutes." },
  skip: () => process.env.NODE_ENV !== "production", // Only enforce in prod
});

const isProd = process.env.NODE_ENV === "production";

// Fail fast if SESSION_SECRET is not set in production
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && isProd) {
  console.error("FATAL: SESSION_SECRET environment variable is required in production.");
  process.exit(1);
}

// SQLite-backed session store (survives restarts, no memory leak)
const SqliteSessionStore = SQLiteStore(session);

// Use __Host-sid in production: the pplx.app proxy requires cookies prefixed __Host-
// and strips any other cookie names for cross-tenant isolation.
// sameSite:"none" allows the cookie to be sent through the reverse proxy.
app.use(session({
  name: isProd ? "__Host-sid" : "sid",
  secret: sessionSecret || "linkbay-dev-secret-change-in-prod",
  resave: false,
  saveUninitialized: false,
  store: new SqliteSessionStore({ db: "data.db", dir: process.cwd(), table: "sessions" }) as any,
  cookie: {
    secure: isProd,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: isProd ? "none" : "lax",
    path: "/",
  },
}));

// Augment session type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userEmail?: string;
    userName?: string;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// IP log middleware — records every request to in-memory ring buffer
app.use((req, _res, next) => {
  try {
    const ip = ((req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()) || req.ip || "";
    pushIpLog({
      ip,
      path: req.path,
      userAgent: String(req.headers["user-agent"] || "").slice(0, 200),
      timestamp: new Date().toISOString(),
      userEmail: req.session?.userEmail || null,
    });
  } catch {}
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
    // SPA catch-all — serve index.html for all non-API/non-admin/non-uploads paths
    app.get(/(.*)/, (req: Request, res: Response) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/admin")) {
        return res.status(404).json({ error: "Not found" });
      }
      res.sendFile(path.join(process.cwd(), "dist/public/index.html"));
    });
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
