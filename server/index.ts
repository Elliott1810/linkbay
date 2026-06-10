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
import fs from "fs";
import { pushIpLog } from "./ipLog";
import { storage } from "./storage";

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

// Force-logout middleware: if an admin sets force_logout=1 on a user, destroy their session
// the next time they make a request, and clear the flag so they can sign back in.
import Database from 'better-sqlite3';
const FL_DB_PATH = process.env.DB_PATH || "data.db";
app.use((req, _res, next) => {
  try {
    if (req.session && req.session.userId) {
      const db = new Database(FL_DB_PATH);
      const row = db.prepare("SELECT force_logout FROM users WHERE id = ?").get(req.session.userId) as any;
      if (row && row.force_logout === 1) {
        db.prepare("UPDATE users SET force_logout = 0 WHERE id = ?").run(req.session.userId);
        db.close();
        req.session.destroy(() => next());
        return;
      }
      db.close();
    }
  } catch {}
  next();
});

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
  // ── OG meta tag injection helper ─────────────────────────────────────────
  // Escape any string for safe insertion into an HTML attribute value
  function escHtml(str: string): string {
    return (str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Build the OG + Twitter meta block for a profile page
  function buildOgBlock(opts: {
    title: string; description: string; imageUrl: string;
    pageUrl: string; accentColor: string;
  }): string {
    const { title, description, imageUrl, pageUrl, accentColor } = opts;
    const t = escHtml(title);
    const d = escHtml(description);
    const img = escHtml(imageUrl);
    const url = escHtml(pageUrl);
    return [
      `<meta property="og:title" content="${t}" />`,
      `<meta property="og:description" content="${d}" />`,
      `<meta property="og:type" content="profile" />`,
      `<meta property="og:url" content="${url}" />`,
      imageUrl ? `<meta property="og:image" content="${img}" />` : "",
      imageUrl ? `<meta property="og:image:width" content="1200" />` : "",
      imageUrl ? `<meta property="og:image:height" content="630" />` : "",
      `<meta property="og:site_name" content="Linkbay" />`,
      `<meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}" />`,
      `<meta name="twitter:title" content="${t}" />`,
      `<meta name="twitter:description" content="${d}" />`,
      imageUrl ? `<meta name="twitter:image" content="${img}" />` : "",
      `<meta name="theme-color" content="${escHtml(accentColor || "#e06b1a")}" />`,
      // LinkedIn-specific: canonical
      `<link rel="canonical" href="${url}" />`,
    ].filter(Boolean).join("\n    ");
  }

  // Cache the base HTML so we don’t re-read it on every request
  let _baseHtml: string | null = null;
  function getBaseHtml(): string {
    if (!_baseHtml) {
      const htmlPath = path.join(process.cwd(), "dist/public/index.html");
      _baseHtml = fs.readFileSync(htmlPath, "utf8");
    }
    return _baseHtml;
  }

  // Reserved paths that are SPA routes, not profile pages
  const SPA_ROUTES = new Set([
    "", "/", "/login", "/register", "/dashboard", "/builder",
    "/pricing", "/about", "/terms", "/privacy", "/blog",
    "/settings", "/billing", "/upgrade", "/help",
  ]);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);

    // OG injection — intercept /:username before the generic SPA catch-all
    // Only fires for paths that look like a profile slug
    app.get(/^\/([a-z0-9][a-z0-9-]{1,38}[a-z0-9])$/, async (req: Request, res: Response, next) => {
      const username = req.params[0];
      // Skip if this is a known SPA route
      if (SPA_ROUTES.has("/" + username)) return next();

      try {
        const page = await storage.getPageByUsername(username);
        // If no page or unpublished, fall through to the SPA (which shows a 404 UI)
        if (!page || !page.published) return next();

        const owner = await storage.getUserByEmail(page.ownerEmail);

        // Build OG fields
        const pageTitle = page.title
          ? `${page.title} | Linkbay`
          : `${page.ownerName} on Linkbay`;
        const pageDescription = [
          page.bio,
          page.location ? `📍 ${page.location}` : "",
          page.contactEmail ? `✉ ${page.contactEmail}` : "",
          "View my links and get in touch.",
        ].filter(Boolean).join("  ·  ").slice(0, 200);

        const pageUrl = `https://linkbay.ai/${username}`;
        const accentColor = page.accentColor || "#e06b1a";

        // og:image — prefer user's avatar, fall back to a branded placeholder URL
        const avatarUrl = owner?.avatarUrl
          ? (owner.avatarUrl.startsWith("http") ? owner.avatarUrl : `https://linkbay.ai${owner.avatarUrl}`)
          : "";

        const ogBlock = buildOgBlock({
          title: pageTitle,
          description: pageDescription,
          imageUrl: avatarUrl,
          pageUrl,
          accentColor,
        });

        // Inject into the base HTML:
        // 1. Replace default <title> tag
        // 2. Replace the static OG block comment marker (or first og:title)
        // 3. Inject dynamic page <title> and a <meta name="description">
        let html = getBaseHtml();

        // Replace <title>
        html = html.replace(
          /<title>[^<]*<\/title>/,
          `<title>${escHtml(pageTitle)}<\/title>`
        );

        // Replace static og:title (and contiguous OG block) with dynamic version
        // Strategy: inject right after <title> replacement
        html = html.replace(
          /<!-- Open Graph -->[\s\S]*?<!-- Twitter Card -->[\s\S]*?<\/head>/,
          `<!-- Open Graph / Twitter (dynamic) -->
    ${ogBlock}
  <\/head>`
        );

        // Also update the static <meta name="description">
        html = html.replace(
          /<meta name="description" content="[^"]*" \/>/,
          `<meta name="description" content="${escHtml(pageDescription)}" />`
        );

        res.set("Content-Type", "text/html; charset=utf-8");
        // Cache for 5 minutes — enough for crawlers, short enough to pick up profile edits
        res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
        res.send(html);
      } catch {
        // On any error, fall through to the normal SPA handler
        next();
      }
    });

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
