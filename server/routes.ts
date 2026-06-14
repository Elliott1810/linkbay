import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { storage, getUserLicence, setUserLicence, getUserByStripeCustomerId, getUserByStripeSubscriptionId, setUserTrial, getUserEffectiveTier, createPasswordResetToken, consumePasswordResetToken, updateUserName } from "./storage";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Database from "better-sqlite3";
import Stripe from "stripe";
import OpenAI from "openai";
import https from "https";
import http from "http";

// ─── Tier limits ─────────────────────────────────────────────────────────────
const TIER_LIMITS: Record<string, { pages: number; blocks: number; analytics: boolean; contacts: boolean; csvExport: boolean; qrCode: boolean; removebranding: boolean; priorityAiRpm: number; leadNotifyEmail: boolean }> = {
  free:     { pages: 1,   blocks: 5,        analytics: false, contacts: false, csvExport: false, qrCode: false,  removebranding: false, priorityAiRpm: 5,   leadNotifyEmail: false },
  pro:      { pages: 3,   blocks: Infinity, analytics: true,  contacts: true,  csvExport: false, qrCode: true,   removebranding: false, priorityAiRpm: 20,  leadNotifyEmail: true  },
  business: { pages: Infinity, blocks: Infinity, analytics: true, contacts: true, csvExport: true, qrCode: true, removebranding: true,  priorityAiRpm: 100, leadNotifyEmail: true  },
};
function getLimits(tier: string) { return TIER_LIMITS[tier] || TIER_LIMITS.free; }

// ─── Price ID → tier mapping ─────────────────────────────────────────────────────
function tierFromPriceId(priceId: string): { tier: "pro" | "business"; interval: "month" | "year" } | null {
  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID)      return { tier: "pro",      interval: "month" };
  if (priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID)        return { tier: "pro",      interval: "year"  };
  if (priceId === process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID) return { tier: "business", interval: "month" };
  if (priceId === process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID)  return { tier: "business", interval: "year"  };
  return null;
}

// ─── AI rate limiter (in-memory) ────────────────────────────────────────────────────
const aiRateLimit = new Map<number | string, { count: number; resetAt: number }>();
// ─── AI analysis cache (in-memory, keyed by pageId:date, invalidates daily) ────────
const aiAnalysisCache = new Map<string, { result: string; date: string }>();

const DB_PATH = process.env.DB_PATH || "data.db";
import {
  insertWaitlistSchema, insertDemoRequestSchema,
  insertPageSchema,
  insertLeadSchema, insertUserSchema,
  insertContactSchema, insertContactActivitySchema,
} from "../shared/schema";
import { z } from "zod";
import { authLimiter } from "./index";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";

// ─── Auth middleware ─────────────────────────────────────────────────────────
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  next();
}

/** Verify the session user owns a page. Rejects with 403 if not. */
async function assertOwnsPage(req: Request, res: Response, pageId: number): Promise<boolean> {
  const page = await storage.getPageById(pageId);
  if (!page) { res.status(404).json({ error: "Page not found" }); return false; }
  if (page.ownerEmail !== req.session.userEmail) { res.status(403).json({ error: "Forbidden" }); return false; }
  return true;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Register licence, Stripe, and AI routes first (webhook needs to run before express.json parses body)
  registerLicenceRoutes(app);

  // ─────────────────────────────────────────────────
  //  AUTH
  // ─────────────────────────────────────────────────

  // Sign up
  app.post("/api/auth/signup", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, name, password } = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(409).json({ error: "An account with this email already exists." });
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await storage.createUser(email, name, passwordHash);
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userName = user.name;
      req.session.save((err) => {
        if (err) return res.status(500).json({ error: "Session error" });
        res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message || "Invalid data" });
      res.status(500).json({ error: "Server error" });
    }
  });

  // Sign in
  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ error: "Invalid email or password." });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid email or password." });
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userName = user.name;
      try { await storage.updateLastSignIn(user.email); } catch {}
      req.session.save((err) => {
        if (err) return res.status(500).json({ error: "Session error" });
        res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message || "Invalid data" });
      res.status(500).json({ error: "Server error" });
    }
  });

  // Sign out
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  // Get current session
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) return res.status(401).json({ user: null });
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ user: null });
    // Also return their pages
    const pages = await storage.getPagesByOwner(user.email);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        onboardingDismissed: !!(user as any).onboardingDismissed,
        onboardingSharedLink: !!(user as any).onboardingSharedLink,
        lastSignIn: (user as any).lastSignIn ?? null,
        newsletterOptin: !!(user as any).newsletterOptin,
        // Impersonation context — lets client show the admin banner
        isImpersonating: req.session.impersonatedBy === "admin",
      },
      pages,
    });
  });

  // Onboarding flag endpoints (Goal 7)
  app.post("/api/account/onboarding/shared", requireAuth as any, async (req, res) => {
    try {
      await storage.updateUserOnboarding(req.session.userEmail!, "shared_link", 1);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server error" }); }
  });
  app.post("/api/account/onboarding/dismiss", requireAuth as any, async (req, res) => {
    try {
      await storage.updateUserOnboarding(req.session.userEmail!, "dismissed", 1);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // ─────────────────────────────────────────────────
  //  FORGOT PASSWORD / RESET PASSWORD
  // ─────────────────────────────────────────────────

  /**
   * POST /api/auth/forgot-password
   * Body: { email: string }
   * Generates a cryptographically secure 32-byte token, stores its SHA-256
   * hash in the DB (never the raw token), and returns the reset URL.
   * In production you would email this URL; here we return it in the response
   * so the frontend can redirect the user directly (no email infra required).
   * Always responds 200 to prevent user enumeration.
   */
  app.post("/api/auth/forgot-password", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      const user = await storage.getUserByEmail(email);
      // Always 200 — don’t reveal whether the email exists
      if (!user) return res.json({ success: true, message: "If that email exists, a reset link has been generated." });

      // Generate 32-byte URL-safe token
      const rawToken = crypto.randomBytes(32).toString("hex"); // 64 hex chars
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      createPasswordResetToken(user.id, tokenHash);

      // Build reset URL (token is raw — user presents it, we hash + compare)
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

      // Return the URL — in a real deployment this would be emailed
      res.json({ success: true, resetUrl, message: "Reset link generated. In production this would be emailed." });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Please provide a valid email address." });
      res.status(500).json({ error: "Server error" });
    }
  });

  /**
   * POST /api/auth/reset-password
   * Body: { token: string; newPassword: string }
   * Validates the raw token (hashes it, looks up DB), updates password,
   * marks token used. Single-use, expires in 1 hour.
   */
  app.post("/api/auth/reset-password", authLimiter, async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = z.object({
        token: z.string().min(64).max(64),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }).parse(req.body);

      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const result = consumePasswordResetToken(tokenHash);

      if (!result) {
        return res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await storage.updateUser(result.userId, { passwordHash });

      // Invalidate all existing sessions for this user by checking force_logout
      // (session store is cookie-based — we just acknowledge success; user must log in again)
      res.json({ success: true, message: "Password updated successfully. Please log in with your new password." });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message || "Invalid data" });
      res.status(500).json({ error: "Server error" });
    }
  });

  // ─────────────────────────────────────────────────
  //  ACCOUNT SETTINGS
  // ─────────────────────────────────────────────────

  /**
   * GET /api/account
   * Returns the current user’s profile (name, email, avatarUrl, createdAt).
   * Requires auth.
   */
  app.get("/api/account", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? null,
        createdAt: user.createdAt,
      });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  /**
   * PUT /api/account
   * Body: { name?: string }
   * Updates the user’s display name.
   * Email changes are intentionally excluded (would require re-verification).
   * Requires auth.
   */
  app.put("/api/account", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { name } = z.object({
        name: z.string().min(1, "Name is required").max(80, "Name too long"),
      }).parse(req.body);

      updateUserName(req.session.userId!, name);
      // Refresh session name so /api/auth/me reflects the change immediately
      req.session.userName = name;
      await new Promise<void>((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));

      const updated = await storage.getUserById(req.session.userId!);
      res.json({ success: true, user: { id: updated!.id, email: updated!.email, name: updated!.name, avatarUrl: updated!.avatarUrl ?? null } });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message || "Invalid data" });
      res.status(500).json({ error: "Server error" });
    }
  });

  /**
   * PUT /api/account/password
   * Body: { currentPassword: string; newPassword: string }
   * Verifies current password before allowing the change.
   * Hashes new password with bcrypt cost 12.
   * Requires auth.
   */
  app.put("/api/account/password", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
      }).parse(req.body);

      const user = await storage.getUserById(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(400).json({ error: "Current password is incorrect." });

      if (currentPassword === newPassword) {
        return res.status(400).json({ error: "New password must be different from your current password." });
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      await storage.updateUser(user.id, { passwordHash: newHash });

      res.json({ success: true, message: "Password changed successfully." });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message || "Invalid data" });
      res.status(500).json({ error: "Server error" });
    }
  });

  // ─────────────────────────────────────────────────
  //  WAITLIST & DEMO
  // ─────────────────────────────────────────────────

  app.post("/api/waitlist", async (req, res) => {
    try {
      const data = insertWaitlistSchema.parse(req.body);
      const entry = await storage.addWaitlist(data);
      res.json({ success: true, entry });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: err.errors });
      if ((err as any)?.message?.includes("UNIQUE")) return res.status(409).json({ error: "You're already on the waitlist!" });
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/waitlist/count", async (_req, res) => {
    try {
      const count = await storage.getWaitlistCount();
      res.json({ count });
    } catch { res.json({ count: 847 }); }
  });

  app.post("/api/demo", async (req, res) => {
    try {
      const data = insertDemoRequestSchema.parse(req.body);
      const entry = await storage.addDemoRequest(data);
      res.json({ success: true, entry });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: err.errors });
      res.status(500).json({ error: "Server error" });
    }
  });

  // ─────────────────────────────────────────────────
  //  PAGES — public routes
  // ─────────────────────────────────────────────────

  // GET a published page by username (public — used by ProfilePage)
  // G1/G2 FIX: NO view tracking here — tracking moved to POST /api/pages/public/:username/view
  // This prevents double/triple counts from TanStack Query refetches.
  app.get("/api/pages/public/:username", async (req, res) => {
    try {
      const page = await storage.getPageByUsername(req.params.username);
      if (!page) return res.status(404).json({ error: "Page not found" });
      const isPreview = req.query.preview === "1";
      if (!page.published && !isPreview) return res.status(404).json({ error: "Page not found" });
      const owner = await storage.getUserByEmail(page.ownerEmail);
      const { ownerEmail: _redacted, ...publicPage } = page as any;
      // #6: include ownerTier so ProfilePage can hide Linkbay branding for Pro/Business users
      const ownerTier = owner?.id ? getUserEffectiveTier(owner.id).tier : "free";
      res.json({ page: { ...publicPage, avatarUrl: owner?.avatarUrl ?? null, ownerTier } });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // POST record a single page view — called once per page mount by ProfilePage
  // G1/G2 FIX: Separated from GET so refetches don't inflate view counts.
  app.post("/api/pages/public/:username/view", async (req, res) => {
    try {
      const page = await storage.getPageByUsername(req.params.username);
      if (!page || !page.published) return res.status(404).json({ error: "Not found" });

      // S6 #2: Never count a view when the page owner is viewing their own page
      if (req.session?.userEmail && req.session.userEmail === page.ownerEmail) {
        return res.json({ skipped: true });
      }

      const rawIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "";
      const visitorId = crypto.createHash("sha256").update(rawIp).digest("hex").slice(0, 16);
      const cfCountry = ((req.headers["cf-ipcountry"] as string) || "").toUpperCase() || null;
      const ua = String(req.headers["user-agent"] || "");
      const device = /Mobile|Android|iPhone/i.test(ua) ? "mobile" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop";
      await storage.incrementViewCount(page.id);
      await storage.recordEvent({ pageId: page.id, type: "view", referrer: req.headers.referer || null, device, visitorId, country: cfCountry } as any);
      // Best-effort async country lookup
      if (!cfCountry && rawIp && rawIp !== "127.0.0.1" && !rawIp.startsWith("192.168") && !rawIp.startsWith("10.") && !rawIp.startsWith("::1")) {
        try {
          fetch(`https://ipapi.co/${rawIp}/country/`)
            .then(r => r.text())
            .then(c => {
              const code = (c || "").trim().toUpperCase();
              if (code && code.length === 2 && /^[A-Z]{2}$/.test(code)) {
                try {
                  const db2 = new Database(DB_PATH);
                  db2.prepare("UPDATE page_events SET country = ? WHERE page_id = ? AND visitor_id = ? AND country IS NULL").run(code, page.id, visitorId);
                  db2.close();
                } catch {}
              }
            }).catch(() => {});
        } catch {}
      }
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // POST a lead from a public page form
  app.post("/api/pages/:pageId/leads", async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      const { customFields, ...rest } = req.body || {};
      const data = insertLeadSchema.parse({ ...rest, pageId });
      // Detect device type
      const ua = String(req.headers["user-agent"] || "");
      let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
      if (/iPad|Tablet/i.test(ua)) deviceType = "tablet";
      else if (/Mobile|Android|iPhone/i.test(ua)) deviceType = "mobile";
      // Detect Linkbay user
      const matchingUser = data.email ? await storage.getUserByEmail(data.email) : undefined;
      const isLinkbayUser = !!matchingUser;
      // Serialize customFields if provided (object)
      const customFieldsJson = customFields && typeof customFields === "object" ? JSON.stringify(customFields) : null;
      const lead = await storage.createLead({
        ...data,
        customFields: customFieldsJson,
        deviceType,
        isLinkbayUser,
      } as any);
      // Track event
      await storage.recordEvent({ pageId, type: "lead_submit", device: deviceType } as any);
      res.json({ success: true, lead });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: err.errors });
      res.status(500).json({ error: "Server error" });
    }
  });

  // POST track a generic block interaction (button / social link) (Goal 15)
  app.post("/api/pages/:pageId/track-click", async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      // S6 #2: Skip tracking for page owner
      const page = await storage.getPageById(pageId);
      if (req.session?.userEmail && page?.ownerEmail === req.session.userEmail) return res.json({ skipped: true });
      const ua = String(req.headers["user-agent"] || "");
      const device = /Mobile|Android|iPhone/i.test(ua) ? "mobile" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop";
      // Accept optional blockId so clicks on block-type links appear in block analytics
      const { blockId, blockType } = (req.body || {}) as { blockId?: string; blockType?: string };
      await storage.recordEvent({ pageId, type: "link_click", device, blockId: blockId || null, blockType: blockType || null } as any);
      res.json({ success: true });
    } catch { res.json({ success: false }); }
  });

  // POST track a block interaction (poll vote, FAQ expand, video play, countdown view, etc.)
  app.post("/api/pages/:pageId/track-block", async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      // S6 #2: Skip tracking for page owner
      const page = await storage.getPageById(pageId);
      if (req.session?.userEmail && page?.ownerEmail === req.session.userEmail) return res.json({ skipped: true });
      const { blockId, blockType, eventType, blockSubId } = req.body as { blockId?: string; blockType?: string; eventType?: string; blockSubId?: string };
      const ua = String(req.headers["user-agent"] || "");
      const device = /Mobile|Android|iPhone/i.test(ua) ? "mobile" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop";
      await storage.recordEvent({
        pageId,
        type: eventType || "block_interact",
        device,
        blockId: blockId || null,
        blockType: blockType || null,
        blockSubId: blockSubId || null,
      } as any);
      res.json({ success: true });
    } catch { res.json({ success: false }); }
  });

  // GET block analytics for a page (for Block Analysis dashboard tab)
  app.get("/api/pages/:pageId/block-analytics", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      const days = parseInt(req.query.days as string) || 30;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const DB_PATH_LOCAL = process.env.DB_PATH || "data.db";
      const sqliteLocal = new Database(DB_PATH_LOCAL);
      // Get all block-level events grouped by blockId + blockType + type + block_sub_id
      // block_sub_id carries the platform name for social-links clicks (needed for per-platform split)
      const blockEvents = sqliteLocal.prepare(`
        SELECT block_id, block_type, type, block_sub_id, COUNT(*) as count
        FROM page_events
        WHERE page_id = ? AND block_id IS NOT NULL AND created_at >= ?
        GROUP BY block_id, block_type, type, block_sub_id
        ORDER BY count DESC
      `).all(pageId, since) as Array<{ block_id: string; block_type: string; type: string; block_sub_id: string | null; count: number }>;

      // Also get all-time block events (no date filter) for historical data
      const allTimeBlockEvents = sqliteLocal.prepare(`
        SELECT block_id, block_type, type, block_sub_id, COUNT(*) as count
        FROM page_events
        WHERE page_id = ? AND block_id IS NOT NULL
        GROUP BY block_id, block_type, type, block_sub_id
        ORDER BY count DESC
      `).all(pageId) as Array<{ block_id: string; block_type: string; type: string; block_sub_id: string | null; count: number }>;

      // Aggregate by blockId across event types
      // block_view = per-block IntersectionObserver view (distinct from page-level "view") — NOT an interaction
      const BLOCK_INTERACTION_EVENTS = new Set(["submit", "click", "vote", "expand", "play", "link_click"]);
      const blockMap = new Map<string, { blockId: string; blockType: string; totalInteractions: number; totalViews: number; byEventType: Record<string, number> }>();
      for (const e of allTimeBlockEvents) {
        const key = e.block_id;
        if (!blockMap.has(key)) blockMap.set(key, { blockId: e.block_id, blockType: e.block_type, totalInteractions: 0, totalViews: 0, byEventType: {} });
        const b = blockMap.get(key)!;
        b.byEventType[e.type] = (b.byEventType[e.type] || 0) + e.count;
        if (e.type === "block_view") b.totalViews += e.count;          // per-block passive impression — NOT interaction
        else if (e.type === "view") { /* legacy page-level view — skip */ }
        else if (BLOCK_INTERACTION_EVENTS.has(e.type) || e.type.startsWith("block_interact")) b.totalInteractions += e.count;
        // unknown event types: do NOT add to interactions to avoid inflating counts
      }

      sqliteLocal.close();
      res.json({
        periodEvents: blockEvents,
        allTimeBlocks: Array.from(blockMap.values()).sort((a, b) => b.totalInteractions - a.totalInteractions),
        days,
      });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
  });

  // ─────────────────────────────────────────────────
  //  PAGES — owner/builder routes
  // ─────────────────────────────────────────────────

  // Check email availability (used by /builder Step 1 before account creation)
  app.get("/api/auth/check-email", async (req, res) => {
    try {
      const email = String(req.query.email || "").trim().toLowerCase();
      if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) return res.json({ available: true });
      const db = new Database(process.env.DB_PATH || "data.db");
      const user = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(email);
      db.close();
      return res.json({ available: !user });
    } catch { return res.json({ available: true }); }
  });

  // Check username availability
  app.get("/api/pages/check/:username", async (req, res) => {
    try {
      const existing = await storage.getPageByUsername(req.params.username);
      res.json({ available: !existing });
    } catch { res.json({ available: false }); }
  });

  // Create a new page (auth required — ties the page to the session user)
  app.post("/api/pages", requireAuth as any, async (req, res) => {
    try {
      // Force ownership from the session — body ownerEmail/ownerName are ignored for security.
      const data = insertPageSchema.parse({
        ...req.body,
        ownerEmail: req.session.userEmail!,
        ownerName: req.session.userName!,
      });
      // Validate username format
      if (!/^[a-z0-9-]{3,40}$/.test(data.username)) {
        return res.status(400).json({ error: "Username must be 3–40 lowercase letters, numbers, or hyphens." });
      }
      // Block reserved slugs (same set as builder wizard + PATCH)
      const CREATE_RESERVED = new Set(["admin","dashboard","login","register","builder","api","blog","pricing","about","terms","privacy","r","static","assets","health","settings","upgrade","billing","help","support","contact","home","index","app","www","mail","email","auth","oauth","callback","404","500","features","docs","download","downloads","signin","signup","logout","legal","cookies","security","status","press","careers","jobs","partners","affiliate","refer","invite","search","explore","discover","feed","notifications","messages","inbox","account","profile","public","private","me","user","users","pages","page"]);
      if (CREATE_RESERVED.has(data.username)) {
        return res.status(400).json({ error: "That username is reserved. Please choose a different one." });
      }
      const existing = await storage.getPageByUsername(data.username);
      if (existing) return res.status(409).json({ error: "That username is already taken." });
      // Tie page to the authenticated user (force ownership)
      const page = await storage.createPage({
        ...data,
        ownerEmail: req.session.userEmail!,
        ownerName: req.session.userName!,
      });
      res.json({ success: true, page });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: err.errors });
      if ((err as any)?.message?.includes("UNIQUE")) return res.status(409).json({ error: "Username is already taken." });
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get page by ID (owner view — auth + ownership required)
  app.get("/api/pages/:id", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.id);
      if (!await assertOwnsPage(req, res, pageId)) return;
      const page = await storage.getPageById(pageId);
      res.json(page);
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // Update page settings (auth + ownership)
  app.patch("/api/pages/:id", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.id);
      if (!await assertOwnsPage(req, res, pageId)) return;
      // Allowlist fields — prevent mass-assignment of ownerEmail, viewCount, etc.
      const allowedFields = z.object({
        username: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/).optional(),
        title: z.string().min(1).max(100).optional(),
        bio: z.string().max(300).optional(),
        location: z.string().max(80).optional(),
        accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        theme: z.string().max(40).optional(),
        background: z.string().max(400).optional(),
        avatarShape: z.enum(["circle", "rounded", "square"]).optional(),
        textColor: z.enum(["auto", "light", "dark"]).optional(),
        blocks: z.string().optional(),
        phone: z.string().max(40).optional(),
        contactEmail: z.string().max(200).optional(),
        pageFont: z.string().max(60).optional(),
        archivedBlockIds: z.string().optional(),
        hiddenBlockIds: z.string().optional(),
        headerImageUrl: z.string().nullable().optional(),
      });
      const data = allowedFields.parse(req.body);
      // If username is being changed, validate uniqueness + reserved words
      if (data.username) {
        const RESERVED_NAMES = new Set(["admin","dashboard","login","register","builder","api","blog","pricing","about","terms","privacy","r","static","assets","health","settings","upgrade","billing","help","support","contact","home","index","app","www","mail","email","auth","oauth","callback","404","500","features","docs","download","downloads","signin","signup","logout","legal","cookies","security","status","press","careers","jobs","partners","affiliate","refer","invite","search","explore","discover","feed","notifications","messages","inbox","account","profile","public","private","me","user","users","pages","page"]);
        if (RESERVED_NAMES.has(data.username)) return res.status(400).json({ error: "That username is reserved." });
        const existing = await storage.getPageByUsername(data.username);
        if (existing && existing.id !== pageId) return res.status(409).json({ error: "That URL is already taken." });
      }
      const page = await storage.updatePage(pageId, data);
      res.json({ success: true, page });
      // Fire-and-forget SEO generation (non-blocking — runs after response is sent)
      if (process.env.OPENAI_API_KEY) {
        generateSeoForPage(page as Record<string, unknown>).catch(() => {/* silent */});
      }
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: err.errors });
      res.status(500).json({ error: "Server error" });
    }
  });

  // Publish / unpublish (auth + ownership)
  app.post("/api/pages/:id/publish", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.id);
      if (!await assertOwnsPage(req, res, pageId)) return;
      const page = await storage.updatePage(pageId, { published: true });
      res.json({ success: true, page });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  app.post("/api/pages/:id/unpublish", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.id);
      if (!await assertOwnsPage(req, res, pageId)) return;
      const page = await storage.updatePage(pageId, { published: false });
      res.json({ success: true, page });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // ── GET /api/pages/:id/blocks/:blockId/history ────────────────────────────────
  // Returns the block's live-period history records from block_history table
  app.get("/api/pages/:id/blocks/:blockId/history", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(String(req.params.id));
      if (!await assertOwnsPage(req, res, pageId)) return;
      const blockId = req.params.blockId;
      const db = new Database(process.env.DB_PATH || "data.db");
      const rows = db.prepare(
        "SELECT * FROM block_history WHERE page_id = ? AND block_id = ? ORDER BY created_at ASC"
      ).all(pageId, blockId);
      // Compute current live-period stats (block is currently live — no end yet)
      const today = new Date().toISOString();
      const lastLive = (rows as any[]).filter((r: any) => r.event === "went_live").slice(-1)[0];
      // If no went_live record, fall back to page created_at so new installs show data
      let liveStart: string | null = lastLive?.went_live_at || null;
      if (!liveStart) {
        const pageRow = db.prepare("SELECT created_at FROM pages WHERE id = ?").get(pageId) as any;
        liveStart = pageRow?.created_at || null;
      }

      // Current period:
      // - "Block views" = block_view events (IntersectionObserver fires once per block per visit)
      // - "Interactions" = all other non-view events for this block since liveStart
      let currentPeriodViews = 0, currentPeriodInteractions = 0;
      if (liveStart) {
        const blockEventRows = db.prepare(
          "SELECT type, COUNT(*) as cnt FROM page_events WHERE page_id = ? AND block_id = ? AND created_at >= ? GROUP BY type"
        ).all(pageId, blockId, liveStart) as any[];
        for (const e of blockEventRows) {
          if (e.type === "block_view") currentPeriodViews += e.cnt;
          else if (e.type !== "view") currentPeriodInteractions += e.cnt; // skip legacy page-level view
        }
      }

      // All-time totals for this block
      const allTime = db.prepare(
        "SELECT type, COUNT(*) as cnt FROM page_events WHERE page_id = ? AND block_id = ? GROUP BY type"
      ).all(pageId, blockId) as any[];
      let totalViews = 0, totalInteractions = 0;
      for (const e of allTime) {
        if (e.type === "block_view") totalViews += e.cnt;
        else if (e.type !== "view") totalInteractions += e.cnt; // skip legacy page-level view
      }
      db.close();
      return res.json({
        history: rows,
        liveStart,
        currentPeriodViews,
        currentPeriodInteractions,
        totalViews,
        totalInteractions,
        now: today,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // ── POST /api/pages/:id/blocks/:blockId/record-archive ────────────────────────
  // Called client-side when archiving a block — writes a history snapshot
  app.post("/api/pages/:id/blocks/:blockId/record-archive", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(String(req.params.id));
      if (!await assertOwnsPage(req, res, pageId)) return;
      const blockId = req.params.blockId;
      const { blockType, blockTitle, periodViews, periodInteractions, totalViews, totalInteractions, wentLiveAt } = req.body;
      const db = new Database(process.env.DB_PATH || "data.db");
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO block_history (page_id, block_id, block_type, block_title, event, went_live_at, went_archived_at, period_views, period_interactions, total_views_alltime, total_interactions_alltime, created_at)
        VALUES (?, ?, ?, ?, 'archived', ?, ?, ?, ?, ?, ?, ?)
      `).run(pageId, blockId, blockType || null, blockTitle || null, wentLiveAt || null, now, periodViews || 0, periodInteractions || 0, totalViews || 0, totalInteractions || 0, now);
      // Also write a "went_live" seed record if this is the first archive and no history exists
      const existingLive = db.prepare("SELECT id FROM block_history WHERE page_id = ? AND block_id = ? AND event = 'went_live' LIMIT 1").get(pageId, blockId);
      if (!existingLive && wentLiveAt) {
        db.prepare(`
          INSERT INTO block_history (page_id, block_id, block_type, block_title, event, went_live_at, created_at)
          VALUES (?, ?, ?, ?, 'went_live', ?, ?)
        `).run(pageId, blockId, blockType || null, blockTitle || null, wentLiveAt, wentLiveAt);
      }
      db.close();
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // ── POST /api/pages/:id/blocks/:blockId/record-live ───────────────────────────
  // Called when a block goes live for the first time (or is restored from archive)
  app.post("/api/pages/:id/blocks/:blockId/record-live", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(String(req.params.id));
      if (!await assertOwnsPage(req, res, pageId)) return;
      const blockId = req.params.blockId;
      const { blockType, blockTitle } = req.body;
      const db = new Database(process.env.DB_PATH || "data.db");
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO block_history (page_id, block_id, block_type, block_title, event, went_live_at, created_at)
        VALUES (?, ?, ?, ?, 'went_live', ?, ?)
      `).run(pageId, blockId, blockType || null, blockTitle || null, now, now);
      db.close();
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Delete page (auth + ownership)
  app.delete("/api/pages/:id", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.id);
      if (!await assertOwnsPage(req, res, pageId)) return;
      await storage.deletePage(pageId);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // ─────────────────────────────────────────────────
  //  LEADS — owner view (auth + ownership)
  // ─────────────────────────────────────────────────

  app.get("/api/pages/:pageId/leads", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      if (!await assertOwnsPage(req, res, pageId)) return;
      const leads = await storage.getLeadsByPage(pageId);
      res.json(leads);
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  app.patch("/api/leads/:id/status", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const lead = await storage.getLeadById(id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      if (!await assertOwnsPage(req, res, lead.pageId)) return;
      const allowedStatuses = ["new", "contacted", "qualified", "proposal", "won", "lost", "archived", "closed"] as const;
      if (!allowedStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });
      const updated = await storage.updateLeadStatus(id, status);
      res.json({ success: true, lead: updated });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // Delete a lead (auth + ownership)
  app.delete("/api/leads/:id", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLeadById(id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      if (!await assertOwnsPage(req, res, lead.pageId)) return;
      await storage.deleteLead(id);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  app.patch("/api/leads/:id/notes", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      const lead = await storage.getLeadById(id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      if (!await assertOwnsPage(req, res, lead.pageId)) return;
      const updated = await storage.updateLeadNotes(id, notes ?? "");
      res.json({ success: true, lead: updated });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // ─────────────────────────────────────────────────
  //  ANALYTICS — owner view (auth + ownership)
  // ─────────────────────────────────────────────────

  // Convert a lead to a contact (auth + ownership)
  app.post("/api/leads/:id/convert-to-contact", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLeadById(id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      if (!await assertOwnsPage(req, res, lead.pageId)) return;
      const contact = await storage.convertLeadToContact(id, req.session.userEmail!);
      res.json({ success: true, contact });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // ──────────────────────────────────────────────
  //  CONTACTS — CRM (auth + ownership)
  // ──────────────────────────────────────────────
  app.get("/api/contacts", requireAuth as any, async (req, res) => {
    try {
      const contacts = await storage.getContactsByOwner(req.session.userEmail!);
      res.json(contacts);
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  app.post("/api/contacts", requireAuth as any, async (req, res) => {
    try {
      const data = insertContactSchema.parse({ ...req.body, ownerEmail: req.session.userEmail! });
      const contact = await storage.createContact(data);
      res.json({ success: true, contact });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: err.errors });
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/contacts/:id", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContactById(id);
      if (!contact) return res.status(404).json({ error: "Contact not found" });
      if (contact.ownerEmail !== req.session.userEmail) return res.status(403).json({ error: "Forbidden" });
      const activities = await storage.getContactActivities(id);
      res.json({ contact, activities });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  app.patch("/api/contacts/:id", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getContactById(id);
      if (!existing) return res.status(404).json({ error: "Contact not found" });
      if (existing.ownerEmail !== req.session.userEmail) return res.status(403).json({ error: "Forbidden" });
      const allowed = z.object({
        name: z.string().min(1).max(100).optional(),
        email: z.string().email().optional(),
        company: z.string().max(120).optional(),
        phone: z.string().max(40).optional(),
        address: z.string().max(300).optional(),
        website: z.string().max(300).optional(),
        notes: z.string().max(5000).optional(),
        tags: z.string().optional(),
        source: z.string().max(80).optional(),
        followUpDate: z.string().nullable().optional(),
        followUpNote: z.string().max(2000).nullable().optional(),
        followUpDone: z.union([z.number(), z.boolean()]).optional().transform(v => typeof v === "boolean" ? (v ? 1 : 0) : v),
      });
      const data = allowed.parse(req.body);
      // If marking follow-up done, log a history activity snapshot before clearing
      const becomingDone = (data as any).followUpDone === 1 && !existing.followUpDone;
      if (becomingDone && (existing.followUpNote || existing.followUpDate)) {
        try {
          const due = existing.followUpDate ? new Date(existing.followUpDate).toLocaleString() : "no date";
          await storage.addContactActivity({
            contactId: id,
            type: "follow-up-completed",
            body: `✅ Follow-up completed: ${existing.followUpNote || "(no note)"} (due: ${due})`,
          } as any);
        } catch {}
      }
      const contact = await storage.updateContact(id, data as any);
      res.json({ success: true, contact });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: err.errors });
      res.status(500).json({ error: "Server error" });
    }
  });

  app.delete("/api/contacts/:id", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getContactById(id);
      if (!existing) return res.status(404).json({ error: "Contact not found" });
      if (existing.ownerEmail !== req.session.userEmail) return res.status(403).json({ error: "Forbidden" });
      await storage.deleteContact(id);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // Update a contact activity (e.g. edit a note body)
  app.patch("/api/contacts/:id/activities/:activityId", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activityId = parseInt(req.params.activityId);
      const contact = await storage.getContactById(id);
      if (!contact) return res.status(404).json({ error: "Contact not found" });
      if (contact.ownerEmail !== req.session.userEmail) return res.status(403).json({ error: "Forbidden" });
      const activity = await storage.getContactActivityById(activityId);
      if (!activity || activity.contactId !== id) return res.status(404).json({ error: "Activity not found" });
      const { body } = z.object({ body: z.string().max(5000) }).parse(req.body);
      const updated = await storage.updateContactActivity(activityId, body);
      res.json({ success: true, activity: updated });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: err.errors });
      res.status(500).json({ error: "Server error" });
    }
  });

  // Delete a contact activity
  app.delete("/api/contacts/:id/activities/:activityId", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activityId = parseInt(req.params.activityId);
      const contact = await storage.getContactById(id);
      if (!contact) return res.status(404).json({ error: "Contact not found" });
      if (contact.ownerEmail !== req.session.userEmail) return res.status(403).json({ error: "Forbidden" });
      const activity = await storage.getContactActivityById(activityId);
      if (!activity || activity.contactId !== id) return res.status(404).json({ error: "Activity not found" });
      await storage.deleteContactActivity(activityId);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  app.post("/api/contacts/:id/activities", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getContactById(id);
      if (!existing) return res.status(404).json({ error: "Contact not found" });
      if (existing.ownerEmail !== req.session.userEmail) return res.status(403).json({ error: "Forbidden" });
      const data = insertContactActivitySchema.parse({ ...req.body, contactId: id });
      const activity = await storage.addContactActivity(data);
      res.json({ success: true, activity });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: err.errors });
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/pages/:pageId/analytics", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      if (!await assertOwnsPage(req, res, pageId)) return;
      const days = parseInt(req.query.days as string) || 30;
      // S7 #8: for All-time (days=3650), fetch from page creation date not 10yrs ago
      const pageForDate = await storage.getPageById(pageId);
      const allTimeSince = (pageForDate?.createdAt || undefined) as string | undefined;
      const eventsSinceOverride = days >= 3650 ? allTimeSince : undefined;
      const [page, events, dailyViews, prevEvents] = await Promise.all([
        Promise.resolve(pageForDate),
        storage.getEventsByPage(pageId, days, eventsSinceOverride),
        storage.getDailyViews(pageId, days, days >= 3650 ? allTimeSince : undefined),
        // Previous period: same window shifted back by `days`
        days < 3650 ? storage.getEventsByPage(pageId, days * 2).then((allE: any[]) => {
          const periodStart = new Date(Date.now() - days * 2 * 86400000).toISOString();
          const periodEnd = new Date(Date.now() - days * 86400000).toISOString();
          return allE.filter((e: any) => {
            const t = e.createdAt || e.created_at || "";
            return t >= periodStart && t < periodEnd;
          });
        }) : Promise.resolve([]),
      ]);

      // Build dailyClicks and dailyLeads arrays aligned to the same date range as dailyViews
      const dailyClicks = dailyViews.map(({ date }: { date: string }) => ({
        date,
        count: events.filter((e: any) => e.type === "link_click" && new Date(e.createdAt || e.created_at).toISOString().startsWith(date)).length,
      }));
      const dailyLeads = dailyViews.map(({ date }: { date: string }) => ({
        date,
        count: events.filter((e: any) => e.type === "lead_submit" && new Date(e.createdAt || e.created_at).toISOString().startsWith(date)).length,
      }));

      const views = events.filter(e => e.type === "view").length;
      const clicks = events.filter(e => e.type === "link_click").length;
      const formLeads = events.filter(e => e.type === "lead_submit").length;
      const devices = events.reduce((acc: any, e) => {
        if (e.device) acc[e.device] = (acc[e.device] || 0) + 1;
        return acc;
      }, {});
      // Unique vs repeat visitor calculation
      const viewEvents = events.filter(e => e.type === "view");
      // Count occurrences per visitorId
      const visitorCounts = new Map<string, number>();
      for (const e of viewEvents) {
        const vid = (e as any).visitorId ?? (e as any).visitor_id;
        if (vid) visitorCounts.set(vid, (visitorCounts.get(vid) || 0) + 1);
      }
      const uniqueVisitors = visitorCounts.size;
      // Repeat visitors = distinct visitor_ids that have viewed more than once
      let repeatVisitors = 0;
      visitorCounts.forEach(c => { if (c > 1) repeatVisitors++; });

      // Top countries from view events
      const countryMap = new Map<string, number>();
      for (const e of viewEvents) {
        const c = (e as any).country;
        if (c) countryMap.set(c, (countryMap.get(c) || 0) + 1);
      }
      const topCountries = Array.from(countryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Best day (highest-view day in the period)
      const bestDayEntry = dailyViews.reduce((best: any, d: any) => (
        !best || d.count > best.count ? d : best
      ), null as any);
      const bestDay = bestDayEntry ? {
        date: bestDayEntry.date,
        count: bestDayEntry.count,
        label: new Date(bestDayEntry.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      } : null;

      // Leads captured count for the period
      const DB_SQLITE = new Database(DB_PATH);
      const leadsCountRow = days >= 3650
        ? DB_SQLITE.prepare("SELECT COUNT(*) as c FROM leads WHERE page_id = ?").get(pageId) as any
        : DB_SQLITE.prepare("SELECT COUNT(*) as c FROM leads WHERE page_id = ? AND created_at >= ?").get(pageId, new Date(Date.now() - days * 86400000).toISOString()) as any;
      const leadsCount = leadsCountRow?.c ?? 0;
      DB_SQLITE.close();

      // Device percentages
      const totalDeviceEvents = Object.values(devices as Record<string, number>).reduce((a, b) => a + b, 0) || 1;
      const devicePct: Record<string, number> = {};
      for (const [k, v] of Object.entries(devices as Record<string, number>)) {
        devicePct[k] = Math.round((v / totalDeviceEvents) * 100);
      }

      res.json({
        totalViews: views,
        totalClicks: clicks,
        allTimeViews: (page?.viewCount || 0),
        periodViews: views,
        periodClicks: clicks,
        periodLeads: formLeads,
        leadsCount,
        clickRate: views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0,
        uniqueVisitors,
        repeatVisitors,
        avgSessionViews: uniqueVisitors > 0 ? Math.round((views / uniqueVisitors) * 10) / 10 : 0,
        devices,
        devicePct,
        topCountries,
        dailyViews,
        dailyClicks,
        dailyLeads,
        bestDay,
        // S7 #8: expose page creation date for All-time label
        pageCreatedAt: page?.createdAt ?? (page as any)?.created_at ?? null,
        // Top interactions: merge link clicks (by linkId→block) with block-level events
        // G3: build a blockTitle lookup from the page's blocks JSON so we show real titles
        topInteractions: (() => {
          // Platform label map for social-links per-platform breakdown
          const SOCIAL_PLATFORM_LABEL_MAP: Record<string, string> = {
            facebook: "Facebook", twitter: "Twitter / X", instagram: "Instagram", linkedin: "LinkedIn",
            youtube: "YouTube", tiktok: "TikTok", github: "GitHub", pinterest: "Pinterest",
            snapchat: "Snapchat", spotify: "Spotify", whatsapp: "WhatsApp", telegram: "Telegram",
            twitch: "Twitch", behance: "Behance", dribbble: "Dribbble", threads: "Threads",
            discord: "Discord", reddit: "Reddit", substack: "Substack", medium: "Medium",
          };
          // S7 #9: normalise block titles — preserve original casing for user-entered titles
          // Build blockId → { title, type, platforms? } map from page.blocks JSON
          const blockMeta = new Map<string, { title: string; type: string; platforms?: Array<{ platform: string; url: string }> }>();
          try {
            const rawBlocks: any[] = JSON.parse((page as any)?.blocks || "[]");
            const BLOCK_TYPE_LABELS: Record<string, string> = {
              "lead-form": "Lead Form", "button": "Button", "poll": "Poll", "faq": "FAQ",
              "countdown": "Countdown", "video": "Video", "image": "Image", "text": "Text",
              "testimonial": "Testimonial", "social-links": "Social Links", "divider": "Divider",
            };
            for (const b of rawBlocks) {
              const typeLabel = BLOCK_TYPE_LABELS[b.type] || (b.type ? b.type.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Block");
              // S7 #9: use the block's own title as-is (user-entered, preserve case)
              const rawTitle = b.title || b.label || b.question || "";
              const displayLabel = rawTitle ? `${typeLabel} — ${rawTitle}` : typeLabel;
              const platforms = b.type === "social-links" ? (b.platforms || b.socials || []) : undefined;
              blockMeta.set(b.id, { title: displayLabel, type: typeLabel, platforms });
            }
          } catch {}

          const interMap = new Map<string, { id: string; label: string; type: string; total: number; isLink: boolean; views?: number; interactions?: number }>();
          // Block events — split into views vs interactions per block
          const INTERACTION_EVENTS = new Set(["submit", "click", "vote", "expand", "play"]);
          // block_view = IntersectionObserver passive impression — NEVER counts as interaction
          const VIEW_EVENTS = new Set(["view", "block_view"]);
          // S7 #7: per-social-platform map
          const socialPlatformMap = new Map<string, { label: string; views: number; interactions: number }>();
          const blockEventMap = new Map<string, { label: string; type: string; views: number; interactions: number }>();
          for (const e of events) {
            const bid = (e as any).blockId ?? (e as any).block_id;
            const btype = (e as any).blockType ?? (e as any).block_type;
            const etype = (e as any).type ?? "";
            const bSubId = (e as any).blockSubId ?? (e as any).block_sub_id ?? null;
            if (!bid) continue;
            const key = `block-${bid}`;
            const meta = blockMeta.get(bid);
            const label = meta?.title || (btype ? btype.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Block");
            const isInteract = INTERACTION_EVENTS.has(etype) || etype.startsWith("block_interact") || etype === "link_click";
            const isView = VIEW_EVENTS.has(etype);
            // S7 #7: social-links block → expand into per-platform entries
            if ((btype === "social-links" || meta?.type === "Social Links") && bSubId) {
              // block_view has no bSubId — handled by the general block path below
              const platKey = `block-${bid}-${bSubId}`; // use block- prefix so client topInteractionsMap finds it
              const platLabel = `${bSubId.charAt(0).toUpperCase()}${bSubId.slice(1)}`;
              if (!socialPlatformMap.has(platKey)) socialPlatformMap.set(platKey, { label: `${SOCIAL_PLATFORM_LABEL_MAP[bSubId] || platLabel}`, views: 0, interactions: 0 });
              const pe = socialPlatformMap.get(platKey)!;
              if (isView) pe.views++; else pe.interactions++;
              continue; // don't also add to blockEventMap — avoid double counting
            }
            if (!blockEventMap.has(key)) blockEventMap.set(key, { label, type: meta?.type || btype || "block", views: 0, interactions: 0 });
            const entry = blockEventMap.get(key)!;
            if (isView) entry.views++;
            else if (isInteract) entry.interactions++;
            // block_view + other unknown events: already handled by VIEW_EVENTS check above — do nothing extra
          }
          blockEventMap.forEach((v, k) => {
            const total = v.views + v.interactions;
            interMap.set(k, { id: k, label: v.label, type: v.type, total, views: v.views, interactions: v.interactions, isLink: false } as any);
          });
          // S7 #7: merge per-platform social entries (key is block-{bid}-{platform})
          socialPlatformMap.forEach((v, k) => {
            const total = v.views + v.interactions;
            if (total > 0) interMap.set(k, { id: k, label: v.label, type: "social", total, views: v.views, interactions: v.interactions, isLink: false } as any);
          });
          return Array.from(interMap.values()).sort((a: any, b: any) => b.total - a.total).slice(0, 10);
        })(),
        // Sum of all block interaction events (excludes block_view passive impressions)
        // Used by Overview and Analytics panels for the "Block interactions" stat card
        totalBlockInteractions: (() => {
          const INTERACTION_EVENTS_BI = new Set(["submit", "click", "vote", "expand", "play", "link_click"]);
          let sum = 0;
          for (const e of events) {
            const bid = (e as any).blockId ?? (e as any).block_id;
            if (!bid) continue;
            const etype = (e as any).type ?? "";
            // Exclude passive impressions (block_view) and page-level views
            if (etype === "block_view" || etype === "view") continue;
            sum++;
          }
          return sum;
        })(),
        events: events.slice(-200),
        // Previous period comparison (for % change cards) — omitted when days=0 (all-time)
        prevPeriod: days < 3650 ? (() => {
          const pViews = (prevEvents as any[]).filter((e: any) => e.type === "view").length;
          const pClicks = (prevEvents as any[]).filter((e: any) => e.type === "link_click").length;
          const pLeads = (prevEvents as any[]).filter((e: any) => e.type === "lead_submit").length;
          const pUniqueVisitors = (() => {
            const s = new Set<string>();
            (prevEvents as any[]).filter((e: any) => e.type === "view").forEach((e: any) => { const v = e.visitorId ?? e.visitor_id; if (v) s.add(v); });
            return s.size;
          })();
          const pRepeatVisitorMap = new Map<string, number>();
          (prevEvents as any[]).filter((e: any) => e.type === "view").forEach((e: any) => { const v = e.visitorId ?? e.visitor_id; if (v) pRepeatVisitorMap.set(v, (pRepeatVisitorMap.get(v) || 0) + 1); });
          let pRepeatVisitors = 0;
          pRepeatVisitorMap.forEach(c => { if (c > 1) pRepeatVisitors++; });
          return {
            views: pViews,
            clicks: pClicks,
            leads: pLeads,
            uniqueVisitors: pUniqueVisitors,
            repeatVisitors: pRepeatVisitors,
            clickRate: pViews > 0 ? Math.round((pClicks / pViews) * 1000) / 10 : 0,
          };
        })() : null,
      });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // ─────────────────────────────────────────────────
  //  PAGE BUILDER — create from signup wizard
  // ─────────────────────────────────────────────────

  // Full wizard: creates user account + page + establishes session in one step
  app.post("/api/builder/create", authLimiter, async (req, res) => {
    try {
      const { email, name, password, username, title, bio, location, accentColor, useCase, phone, contactEmail, blocks: rawBlocks, links: rawLinks } = req.body;

      if (!email || !name || !password || !username || !title) {
        return res.status(400).json({ error: "Missing required fields: email, name, password, username, title" });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
      }
      if (!/^[a-z0-9-]{3,40}$/.test(username)) {
        return res.status(400).json({ error: "Username must be 3–40 lowercase letters, numbers, or hyphens." });
      }

      // #10: Block reserved usernames
      const RESERVED_NAMES = new Set(["admin","dashboard","login","register","builder","api","blog","pricing","about","terms","privacy","r","static","assets","health","settings","upgrade","billing","help","support","contact","home","index","app","www","mail","email","auth","oauth","callback","404","500","features","docs","download","downloads","signin","signup","logout","legal","cookies","security","status","press","careers","jobs","partners","affiliate","refer","invite","search","explore","discover","feed","notifications","messages","inbox","account","profile","public","private","me","user","users","pages","page"]);
      if (RESERVED_NAMES.has(username)) {
        return res.status(400).json({ error: "That username is reserved. Please choose a different one." });
      }

      const existingPage = await storage.getPageByUsername(username);
      if (existingPage) return res.status(409).json({ error: "That username is already taken. Try another." });

      // Create or find user account
      let user = await storage.getUserByEmail(email);
      if (!user) {
        const passwordHash = await bcrypt.hash(password, 12);
        user = await storage.createUser(email, name, passwordHash);
      } else {
        // User already exists — verify password
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(409).json({ error: "An account with this email already exists. Please log in instead." });
      }

      // Validate blocks JSON if provided
      let blocksJson = "[]";
      if (rawBlocks) {
        try { JSON.parse(rawBlocks); blocksJson = rawBlocks; } catch {}
      }

      // #11a/#12: Also convert rawLinks into type:"link" blocks and prepend to blocksJson
      // This ensures builder links appear in the Page Editor under content blocks.
      const safeUrlRegex = /^(https?:\/\/|mailto:)/i;
      if (rawLinks && rawLinks.length > 0) {
        const genBlockId = () => "blk-" + Math.random().toString(36).slice(2, 8);
        const linkBlocks = rawLinks
          .filter((l: any) => l.url && safeUrlRegex.test(l.url))
          .map((l: any, i: number) => ({
            id: genBlockId(),
            type: "link",
            title: l.label || l.title || "Link",
            url: l.url,
            description: l.description || "",
            icon: l.icon || "🔗",
            linkStyle: l.style || "default",
          }));
        if (linkBlocks.length > 0) {
          try {
            const existingBlocks = JSON.parse(blocksJson);
            blocksJson = JSON.stringify([...linkBlocks, ...existingBlocks]);
          } catch { blocksJson = JSON.stringify(linkBlocks); }
        }
      }

      // Create page
      // Validate font value if provided
      const VALID_FONTS = new Set(["general-sans","cabinet-grotesk","inter","merriweather","playfair","mono"]);
      const rawFont = req.body.font as string | undefined;
      const safeFont = rawFont && VALID_FONTS.has(rawFont) ? rawFont : "inter";

      const page = await storage.createPage({
        username,
        ownerEmail: user.email,
        ownerName: user.name,
        title,
        bio: bio || "",
        location: location || "",
        accentColor: accentColor || "#e06b1a",
        theme: "default",
        background: req.body.background || "none",
        pageFont: safeFont,
        blocks: blocksJson,
        phone: phone || "",
        contactEmail: contactEmail || "",
        published: true,
      });

      // Establish session — user is now logged in
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userName = user.name;

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => err ? reject(err) : resolve());
      });

      res.json({ success: true, page, pageUrl: `/${page.username}`, user: { id: user.id, email: user.email, name: user.name } });
    } catch (err) {
      if ((err as any)?.message?.includes("UNIQUE")) return res.status(409).json({ error: "Username is already taken." });
      res.status(500).json({ error: "Server error" });
    }
  });

  // ───────────────────────────────────────────────
  //  POLL VOTES (auth required to vote)
  // ───────────────────────────────────────────────

  // Get votes for a poll block on a page
  app.get("/api/pages/:pageId/polls/:pollId/votes", async (req, res) => {
    try {
      const { pageId, pollId } = req.params;
      const votes = await storage.getPollVotes(parseInt(pageId), pollId);
      // S6 #10: check if this visitor already voted
      const voterEmail = (req.session as any)?.userEmail || null;
      const voterToken = (req.query.voterToken as string) || null;
      const hasVoted = await storage.hasVoted(pollId, voterEmail, voterToken);
      res.json({ votes, hasVoted });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // Cast a vote — S6 #10: open to all visitors, deduplicated by email (signed-in) or IP hash (anonymous)
  app.post("/api/pages/:pageId/polls/:pollId/vote", async (req, res) => {
    try {
      const { pageId, pollId } = req.params;
      const { optionIndex, voterToken } = req.body;
      if (typeof optionIndex !== "number" || optionIndex < 0) {
        return res.status(400).json({ error: "Invalid option" });
      }
      const page = await storage.getPageById(parseInt(pageId));
      if (!page) return res.status(404).json({ error: "Page not found" });

      const voterEmail = req.session?.userEmail || null;
      // Derive a stable anonymous token from IP + user-agent hash if not signed in
      // Use multiple headers to build a reliable fingerprint even behind Railway's proxy
      const rawIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
        || (req.headers["x-real-ip"] as string)
        || req.socket?.remoteAddress
        || req.ip
        || "anon";
      const ua = String(req.headers["user-agent"] || "");
      // Use client-supplied voterToken (localStorage UUID) first, then fall back to IP+UA hash
      // Guarantee a non-empty token so castVote never hits the "voter identity required" branch
      const ipHash = crypto.createHash("sha256").update(rawIp + ua + "linkbay-poll").digest("hex").slice(0, 32);
      const anonToken = (voterToken && String(voterToken).length > 0) ? String(voterToken) : ipHash;

      await storage.castVote({
        pageId: parseInt(pageId),
        pollId,
        voterEmail,
        voterToken: voterEmail ? null : anonToken,
        optionIndex,
      });
      const votes = await storage.getPollVotes(parseInt(pageId), pollId);
      res.json({ success: true, votes });
    } catch (err: any) {
      if (err?.message?.includes("already voted")) return res.status(409).json({ error: "You have already voted in this poll." });
      res.status(500).json({ error: "Server error" });
    }
  });

  // ─────────────────────────────────────────────────
  //  ACCOUNT — avatar upload
  // ─────────────────────────────────────────────────

  const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      cb(null, allowed.includes(file.mimetype));
    },
  });

  app.post("/api/account/avatar", requireAuth as any, avatarUpload.single("avatar"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      // #16: Convert to base64 and store in DB instead of filesystem
      // Compress to WebP 200x200 first, then encode as base64
      const webpBuffer = await sharp(req.file.buffer)
        .resize(200, 200, { fit: "cover", position: "centre" })
        .webp({ quality: 82 })
        .toBuffer();
      const base64 = `data:image/webp;base64,${webpBuffer.toString("base64")}`;
      const user = await storage.updateUserAvatar(req.session.userId!, base64);
      req.session.save(() => {});
      res.json({ success: true, avatarUrl: base64, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
    } catch (err) {
      console.error("Avatar upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  app.delete("/api/account/avatar", requireAuth as any, async (req, res) => {
    try {
      // #16: base64 stored in DB — no filesystem cleanup needed
      await storage.updateUserAvatar(req.session.userId!, null);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  });

  // ─────────────────────────────────────────────────
  //  PAGES — header image upload / remove
  // ─────────────────────────────────────────────────

  const headerImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB max
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      cb(null, allowed.includes(file.mimetype));
    },
  });

  app.post("/api/pages/:id/header-image", requireAuth as any, headerImageUpload.single("headerImage"), async (req: any, res) => {
    try {
      const pageId = parseInt(req.params.id);
      if (!await assertOwnsPage(req, res, pageId)) return;
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      // Resize to 1200×400, cover crop, WebP 85 quality, then base64
      const webpBuffer = await sharp(req.file.buffer)
        .resize(1200, 400, { fit: "cover", position: "centre" })
        .webp({ quality: 85 })
        .toBuffer();
      const base64 = `data:image/webp;base64,${webpBuffer.toString("base64")}`;
      await storage.updatePage(pageId, { headerImageUrl: base64 });
      res.json({ success: true, headerImageUrl: base64 });
    } catch (err) {
      console.error("Header image upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  app.delete("/api/pages/:id/header-image", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.id);
      if (!await assertOwnsPage(req, res, pageId)) return;
      await storage.updatePage(pageId, { headerImageUrl: null });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  });

  // ─────────────────────────────────────────────────
  //  ACCOUNT — update profile + change password
  // ─────────────────────────────────────────────────

  app.patch("/api/account/profile", requireAuth as any, async (req, res) => {
    try {
      const { name, newsletterOptin } = req.body;
      if (newsletterOptin !== undefined) {
        // Just update newsletter opt-in
        const nlDb = new Database(process.env.DB_PATH || "data.db");
        nlDb.prepare("UPDATE users SET newsletter_optin = ? WHERE id = ?").run(newsletterOptin ? 1 : 0, req.session.userId!);
        const user = await storage.getUserById(req.session.userId!);
        return res.json({ success: true, user: { id: user?.id, email: user?.email, name: user?.name } });
      }
      if (!name || !name.trim()) return res.status(400).json({ error: "Name is required." });
      const user = await storage.updateUser(req.session.userId!, { name: name.trim() });
      req.session.userName = user.name;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => err ? reject(err) : resolve());
      });
      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.patch("/api/account/password", requireAuth as any, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both current and new password are required." });
      if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters." });
      const user = await storage.getUserById(req.session.userId!);
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Current password is incorrect." });
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await storage.updateUser(user.id, { passwordHash });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Delete account (cascade delete all user data)
  app.delete("/api/account", requireAuth as any, async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) return res.status(400).json({ error: "Password confirmation required." });
      const user = await storage.getUserById(req.session.userId!);
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Incorrect password." });
      await storage.deleteUserCascade(user.id, user.email);
      req.session.destroy(() => res.json({ success: true }));
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  });

  // ─────────────────────────────────
  //  DASHBOARD STATS
  // ─────────────────────────────────

  // Aggregate stats across all pages for the authenticated user
  app.get("/api/dashboard/stats", requireAuth as any, async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : undefined;
      const stats = await storage.getDashboardStats(req.session.userEmail!, days);
      res.json(stats);
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  });

  // ─────────────────────────────────
  //  ADMIN PANEL (password-protected, server-rendered)
  // ─────────────────────────────────

  function requireAdmin(req: Request, res: Response, next: Function) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) return res.status(403).send("Admin access not configured. Set ADMIN_PASSWORD env var.");
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Basic ")) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Linkbay Admin"');
      return res.status(401).send("Unauthorised");
    }
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    if (user !== "admin" || pass !== adminPassword) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Linkbay Admin"');
      return res.status(401).send("Unauthorised");
    }
    next();
  }

  // ── POST /admin/reset-sim-stats ─────────────────────────────────────────
  // Clears all analytics data (page_events, block_history, poll_votes, leads,
  // view_count) for every page EXCEPT those owned by the owner account.
  // Blocks, page settings, and user accounts are untouched.
  app.post("/admin/reset-sim-stats", requireAdmin as any, async (req: Request, res: Response) => {
    try {
      const ownerEmail = "myzjjzk8vs@privaterelay.appleid.com";
      const db2 = new Database(process.env.DB_PATH || "data.db");
      // Get all page IDs that don't belong to the owner
      const simPages = db2.prepare(
        "SELECT id FROM pages WHERE owner_email != ?"
      ).all(ownerEmail) as any[];
      const ids = simPages.map((p: any) => p.id);
      let cleared = 0;
      for (const pageId of ids) {
        db2.prepare("DELETE FROM page_events WHERE page_id = ?").run(pageId);
        db2.prepare("DELETE FROM block_history WHERE page_id = ?").run(pageId);
        db2.prepare("DELETE FROM poll_votes WHERE page_id = ?").run(pageId);
        db2.prepare("DELETE FROM leads WHERE page_id = ?").run(pageId);
        db2.prepare("UPDATE pages SET view_count = 0 WHERE id = ?").run(pageId);
        cleared++;
      }
      db2.close();
      return res.json({ success: true, pagesCleared: cleared, pageIds: ids });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Admin delete actions (Basic Auth protected)
  app.post("/admin/delete-user", requireAdmin as any, async (req, res) => {
    try {
      const id = parseInt(req.query.id as string);
      if (!id) return res.status(400).send("Missing id");
      const u = await storage.getUserById(id);
      if (u) await storage.deleteUserCascade(u.id, u.email);
      res.redirect("/admin");
    } catch { res.status(500).send("Delete failed"); }
  });
  app.post("/admin/delete-page", requireAdmin as any, async (req, res) => {
    try {
      const id = parseInt(req.query.id as string);
      if (!id) return res.status(400).send("Missing id");
      // Cascade-delete page-related rows
      const sqlite2 = require("better-sqlite3")(process.env.DB_PATH || "data.db");
      sqlite2.prepare("DELETE FROM page_events WHERE page_id = ?").run(id);
      sqlite2.prepare("DELETE FROM leads WHERE page_id = ?").run(id);
      sqlite2.prepare("DELETE FROM pages WHERE id = ?").run(id);
      sqlite2.close();
      res.redirect("/admin");
    } catch { res.status(500).send("Delete failed"); }
  });
  app.post("/admin/delete-lead", requireAdmin as any, async (req, res) => {
    try {
      const id = parseInt(req.query.id as string);
      if (!id) return res.status(400).send("Missing id");
      await storage.deleteLead(id);
      res.redirect("/admin");
    } catch { res.status(500).send("Delete failed"); }
  });

  // Force a user to be signed out (sets force_logout flag; session middleware will destroy session on next request)
  app.post("/admin/signout-user", requireAdmin as any, async (req, res) => {
    try {
      const email = String(req.body?.email || "").trim();
      if (!email) return res.status(400).send("Missing email");
      const db2 = new Database(DB_PATH);
      db2.prepare("UPDATE users SET force_logout = 1 WHERE email = ?").run(email);
      db2.close();
      res.redirect("/admin?signoutDone=" + encodeURIComponent(email));
    } catch { res.status(500).send("Sign-out failed"); }
  });

  // Reset a user's password to a freshly-generated random string and return it via query param
  app.post("/admin/reset-password", requireAdmin as any, async (req, res) => {
    try {
      const email = String(req.body?.email || "").trim();
      if (!email) return res.status(400).send("Missing email");
      const newPassword =
        Math.random().toString(36).slice(2, 6) +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      const hash = await bcrypt.hash(newPassword, 12);
      const db2 = new Database(DB_PATH);
      db2.prepare("UPDATE users SET password_hash = ?, force_logout = 1 WHERE email = ?").run(hash, email);
      db2.close();
      res.redirect(
        "/admin?resetDone=" + encodeURIComponent(email) + "&newPass=" + encodeURIComponent(newPassword)
      );
    } catch { res.status(500).send("Reset failed"); }
  });

  app.post("/admin/set-licence", requireAdmin as any, async (req, res) => {
    try {
      const userId = Number(req.body?.userId);
      const tier = String(req.body?.tier || "free").trim();
      if (!userId || !["free", "pro", "business"].includes(tier)) return res.status(400).send("Invalid input");
      // Use users.licence column — no separate licences table needed
      setUserLicence(userId, tier, null);
      res.redirect("/admin");
    } catch (e) { res.status(500).send("Failed to update licence"); }
  });

  // Sprint 8: Set free trial (tier + expiry date)
  app.post("/admin/set-trial", requireAdmin as any, async (req, res) => {
    try {
      const userId = Number(req.body?.userId);
      const tier = String(req.body?.trialTier || "").trim();
      const expiry = String(req.body?.trialExpiry || "").trim();
      if (!userId || !["pro", "business"].includes(tier) || !expiry) {
        return res.status(400).send("Invalid input — userId, tier (pro/business), and expiry date required");
      }
      // Store as ISO date end-of-day
      const expiryIso = new Date(expiry + "T23:59:59Z").toISOString();
      setUserTrial(userId, tier, expiryIso);
      res.redirect("/admin?trialSet=" + encodeURIComponent(userId));
    } catch (e) { res.status(500).send("Failed to set trial"); }
  });

  // ── POST /admin/impersonate — log in as a user (admin-only, HTTP Basic auth) ──
  app.post("/admin/impersonate", requireAdmin as any, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(String(req.body?.userId || ""), 10);
      if (!userId) return res.status(400).send("userId required");
      const user = await storage.getUserById(userId);
      if (!user) return res.redirect("/admin?err=userNotFound");
      // Write user's credentials into session + flag as impersonated
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userName = user.name ?? user.email;
      req.session.impersonatedBy = "admin";
      req.session.save((err) => {
        if (err) return res.status(500).send("Session save failed");
        // Redirect into the dashboard as this user
        res.redirect("/dashboard");
      });
    } catch (e) { res.status(500).send("Impersonation failed"); }
  });

  // ── POST /api/auth/stop-impersonation — exit impersonation mode — no auth needed ──
  // Called by the client-side impersonation banner. Destroys current session and
  // redirects to /admin (browser picks up HTTP Basic credentials from browser cache).
  app.post("/api/auth/stop-impersonation", (req: Request, res: Response) => {
    if (req.session.impersonatedBy !== "admin") {
      return res.status(400).json({ error: "Not in impersonation mode" });
    }
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/admin", requireAdmin as any, async (req: Request, res: Response) => {
    // Read directly from SQLite for admin view
    const sqlite = require("better-sqlite3")(process.env.DB_PATH || "data.db") as import("better-sqlite3").Database;

    const users = sqlite.prepare(`
      SELECT id, email, name, created_at, last_sign_in,
        (SELECT COUNT(*) FROM pages WHERE owner_email = users.email) as page_count
      FROM users ORDER BY created_at DESC
    `).all() as any[];

    const pages = sqlite.prepare(`
      SELECT p.id, p.username, p.owner_name, p.owner_email, p.title, p.published,
        p.view_count, p.created_at,
        (SELECT COUNT(*) FROM leads WHERE page_id = p.id) as lead_count,
        (SELECT COUNT(*) FROM page_events WHERE page_id = p.id AND type = 'link_click') as total_clicks
      FROM pages p
      WHERE p.owner_email NOT IN ('sarah@example.com','alex@example.com','mark@example.com','amara@example.com','studio@example.com','kai@example.com','lena@example.com','jordan@example.com','priya@example.com')
      ORDER BY p.created_at DESC
    `).all() as any[];

    const totalEvents = (sqlite.prepare("SELECT COUNT(*) as c FROM page_events").get() as any).c;
    const totalLeads = (sqlite.prepare("SELECT COUNT(*) as c FROM leads").get() as any).c;
    const totalClicks = (sqlite.prepare("SELECT COUNT(*) as c FROM page_events WHERE type = 'link_click'").get() as any).c || 0;
    // Use SUM(view_count) as the canonical view total — server-side counter, consistent with per-page view figures
    const totalViews = (sqlite.prepare("SELECT SUM(view_count) as c FROM pages").get() as any).c || 0;

    // Event-type breakdown (Goal 2)
    const eventsByType = sqlite.prepare("SELECT type, COUNT(*) as c FROM page_events GROUP BY type").all() as Array<{ type: string; c: number }>;
    const viewEvents = eventsByType.find(e => e.type === "view")?.c || 0;
    const linkClickEvents = eventsByType.find(e => e.type === "link_click")?.c || 0;
    const leadSubmitEvents = eventsByType.find(e => e.type === "lead_submit")?.c || 0;

    // Platform stats (Goal 4)
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 86400000).toISOString();
    const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();
    const signupsWeek = (sqlite.prepare("SELECT COUNT(*) as c FROM users WHERE created_at >= ?").get(sevenDaysAgo) as any).c;
    const signupsMonth = (sqlite.prepare("SELECT COUNT(*) as c FROM users WHERE created_at >= ?").get(thirtyDaysAgo) as any).c;
    const pagesPublished = (sqlite.prepare("SELECT COUNT(*) as c FROM pages WHERE published = 1").get() as any).c;
    const pagesDraft = (sqlite.prepare("SELECT COUNT(*) as c FROM pages WHERE published = 0").get() as any).c;
    const mostActivePages = sqlite.prepare(`
      SELECT username, owner_name, view_count
      FROM pages
      ORDER BY view_count DESC LIMIT 5
    `).all() as any[];
    const topLeadPages = sqlite.prepare(`
      SELECT p.username, p.owner_name, COUNT(l.id) as lead_count
      FROM pages p LEFT JOIN leads l ON l.page_id = p.id
      GROUP BY p.id
      ORDER BY lead_count DESC LIMIT 5
    `).all() as any[];
    const avgLinks = "0.0"; // legacy links removed — blocks used instead
    // Avg blocks per page (General 12)
    const avgBlocksRow = sqlite.prepare(`
      SELECT AVG(block_count) as avg FROM (
        SELECT id, CASE WHEN blocks IS NULL OR blocks = '[]' OR blocks = '' THEN 0
          ELSE (LENGTH(blocks) - LENGTH(REPLACE(blocks, '{"id"', ''))) / 5
        END as block_count FROM pages WHERE published = 1
      )
    `).get() as any;
    const avgBlocks = avgBlocksRow?.avg ? Number(avgBlocksRow.avg).toFixed(1) : "0.0";
    // Total contacts across all users (General 14)
    const totalContacts = (sqlite.prepare("SELECT COUNT(*) as c FROM contacts").get() as any).c || 0;
    // Recent connections from page_events — last 30 days, top 20 by most recent (General 13)
    const recentConnEvents = sqlite.prepare(`
      SELECT DISTINCT visitor_id, country, device, created_at
      FROM page_events
      WHERE created_at >= ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(thirtyDaysAgo) as Array<{ visitor_id: string; country: string; device: string; created_at: string }>;
    const devicesBreakdown = sqlite.prepare(`
      SELECT device, COUNT(*) as c FROM page_events WHERE device IS NOT NULL GROUP BY device
    `).all() as Array<{ device: string; c: number }>;
    const totalDeviceEvents = devicesBreakdown.reduce((s, d) => s + d.c, 0) || 1;
    const devicePct = (name: string) => {
      const found = devicesBreakdown.find(d => d.device === name)?.c || 0;
      return Math.round((found / totalDeviceEvents) * 100);
    };

    const recentLeads = sqlite.prepare(`
      SELECT l.id, l.name, l.email, l.message, l.created_at, p.username as page_username
      FROM leads l JOIN pages p ON p.id = l.page_id
      ORDER BY l.created_at DESC LIMIT 20
    `).all() as any[];

    // Licence data for admin panel — read directly from users.licence column (no separate licences table)
    const licences = sqlite.prepare(`
      SELECT u.id as user_id, u.name, u.email,
        COALESCE(u.licence, 'free') as tier,
        u.licence_expiry as expires_at,
        u.stripe_subscription_id,
        u.trial_tier,
        u.trial_expiry
      FROM users u
      ORDER BY CASE COALESCE(u.licence,'free') WHEN 'business' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END, u.created_at DESC
    `).all() as any[];
    const nowDate = new Date();
    const licCountFree = licences.filter(l => !l.tier || l.tier === "free").length;
    const licCountPro = licences.filter(l => l.tier === "pro").length;
    const licCountBusiness = licences.filter(l => l.tier === "business").length;
    // #20: trial count — users with active trial (trial_tier set + trial_expiry in the future)
    const licCountTrial = licences.filter(l => l.trial_tier && l.trial_expiry && new Date(l.trial_expiry) > nowDate).length;
    // #19: MRR excludes trials — only count records with a stripe_subscription_id
    const mrrEstimate = licences.filter(l => l.stripe_subscription_id && l.tier === "pro").length * 5
      + licences.filter(l => l.stripe_subscription_id && l.tier === "business").length * 20;

    sqlite.close();

    // Recent connections — dedupe by IP, keep most recent (Goal 1)
    const { ipLogBuffer, geolocateIp } = await import("./ipLog");
    const seenIps = new Set<string>();
    const uniqueIps: typeof ipLogBuffer = [];
    for (const entry of ipLogBuffer) {
      if (!seenIps.has(entry.ip)) {
        seenIps.add(entry.ip);
        uniqueIps.push(entry);
        if (uniqueIps.length >= 20) break;
      }
    }
    const ipsWithGeo = await Promise.all(uniqueIps.map(async e => ({
      ...e,
      location: await geolocateIp(e.ip),
    })));

    // Parse device + browser from user agent (Goal 1)
    function parseDevice(ua: string): string {
      if (!ua) return "—";
      if (/iPad|Tablet/i.test(ua)) return "Tablet";
      if (/Mobile|Android|iPhone/i.test(ua)) return "Mobile";
      return "Desktop";
    }
    function parseBrowser(ua: string): string {
      if (!ua) return "—";
      if (/Edg\//i.test(ua)) return "Edge";
      if (/Chrome\//i.test(ua)) return "Chrome";
      if (/Firefox\//i.test(ua)) return "Firefox";
      if (/Safari\//i.test(ua)) return "Safari";
      return "Other";
    }

    // Active session check (Goal 3): user has IP entry in last 30 min
    const thirtyMinAgo = now - 30 * 60 * 1000;
    const activeUserEmails = new Set<string>();
    for (const entry of ipLogBuffer) {
      if (entry.userEmail && new Date(entry.timestamp).getTime() >= thirtyMinAgo) {
        activeUserEmails.add(entry.userEmail);
      }
    }

    const fmt = (n: number) => n?.toLocaleString() ?? "0";
    const ago = (ts: string) => {
      if (!ts) return "";
      const diff = Date.now() - new Date(ts).getTime();
      if (diff < 60000) return "just now";
      if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
      if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
      return Math.floor(diff / 86400000) + "d ago";
    };

    // Pre-compute licences rows HTML (arrow fn with {} body can't go inside template literal)
    const licenceRowsHtml = licences.map(l => {
      const tier = l.tier || "free";
      const expiresAt = l.expires_at ? new Date(l.expires_at) : null;
      const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null;
      const expiryWarn = daysLeft !== null && daysLeft <= 7;
      const tierBadge = tier === "business"
        ? `<span style="background:#ccfbf1;color:#0f766e;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px">Business</span>`
        : tier === "pro"
          ? `<span style="background:#fef3c7;color:#92400e;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px">Pro</span>`
          : `<span style="background:#f1f5f9;color:#64748b;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px">Free</span>`;
      const expiryCell = expiresAt
        ? `<span style="color:${expiryWarn ? "#dc2626" : "#64748b"};font-size:11px">${expiryWarn ? "⚠️ " : ""}${expiresAt.toISOString().slice(0,10)} (${daysLeft}d)</span>`
        : `<span style="color:#aaa">—</span>`;
      const selectedFree = tier === "free" ? "selected" : "";
      const selectedPro = tier === "pro" ? "selected" : "";
      const selectedBiz = tier === "business" ? "selected" : "";
      return `<tr>
        <td><strong>${escHtml(l.name || "")}</strong></td>
        <td class="email">${escHtml(l.email)}</td>
        <td>${tierBadge}</td>
        <td>${expiryCell}</td>
        <td class="email" style="font-size:10px">${l.stripe_subscription_id ? escHtml(l.stripe_subscription_id) : "—"}</td>
        <td>
          <form method="POST" action="/admin/set-licence" style="display:inline-flex;gap:4px;align-items:center;margin-bottom:3px">
            <input type="hidden" name="userId" value="${l.user_id}">
            <select name="tier" style="font-size:11px;padding:2px 4px;border:1px solid #d1d5db;border-radius:4px">
              <option value="free" ${selectedFree}>Free</option>
              <option value="pro" ${selectedPro}>Pro</option>
              <option value="business" ${selectedBiz}>Business</option>
            </select>
            <button type="submit" style="background:#e06b1a;color:#fff;border:none;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer">Set</button>
          </form>
          <form method="POST" action="/admin/set-trial" style="display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap">
            <input type="hidden" name="userId" value="${l.user_id}">
            <select name="trialTier" style="font-size:11px;padding:2px 4px;border:1px solid #c7d2fe;border-radius:4px;background:#eef2ff">
              <option value="pro">Pro Trial</option>
              <option value="business">Biz Trial</option>
            </select>
            <input type="date" name="trialExpiry" style="font-size:11px;padding:2px 4px;border:1px solid #c7d2fe;border-radius:4px;background:#eef2ff" required />
            <button type="submit" style="background:#6366f1;color:#fff;border:none;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer">Trial</button>
          </form>
        </td>
      </tr>`;
    }).join("");

    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Linkbay Admin</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f7f5;color:#1a1917;font-size:14px;line-height:1.5}
  .topbar{background:#1a1917;color:#fff;padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center}
  .topbar h1{font-size:1.1rem;font-weight:700;letter-spacing:-0.02em}  
  .topbar span{font-size:12px;opacity:0.5}
  .wrap{max-width:1200px;margin:0 auto;padding:2rem}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:2rem}
  .stat{background:#fff;border:1px solid #e5e3df;border-radius:10px;padding:1.25rem}
  .stat .val{font-size:2rem;font-weight:800;color:#e06b1a;line-height:1}
  .stat .lbl{font-size:11px;color:#888;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
  h2{font-size:1rem;font-weight:700;margin-bottom:0.75rem;padding-bottom:0.5rem;border-bottom:1px solid #e5e3df}
  .section{background:#fff;border:1px solid #e5e3df;border-radius:10px;padding:1.5rem;margin-bottom:1.5rem}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:11px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:0 0 0.5rem;border-bottom:1px solid #f0eeeb}
  td{padding:0.5rem 0;border-bottom:1px solid #f0eeeb;vertical-align:top;font-size:13px}
  td:last-child,th:last-child{text-align:right}
  tr:last-child td{border:none}
  .badge{display:inline-block;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:700}
  .badge.live{background:#dcfce7;color:#166534}
  .badge.draft{background:#f1f5f9;color:#64748b}
  .delbtn{background:#fee2e2;border:1px solid #fecaca;color:#b91c1c;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer}
  .delbtn:hover{background:#fecaca}
  .email{color:#888;font-size:12px}
  .msg{color:#555;font-size:12px;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ts{color:#aaa;font-size:11px;white-space:nowrap}
  @media(max-width:600px){
    .stats{grid-template-columns:1fr 1fr}
    .wrap{padding:0.75rem}
    .topbar{padding:0.75rem 1rem;flex-direction:column;gap:0.25rem;align-items:flex-start}
    .section{padding:1rem;overflow-x:auto}
    table{font-size:12px}
    th,td{padding:0.375rem 0.25rem;white-space:nowrap}
    .stat .val{font-size:1.5rem}
    h2{font-size:0.9rem}
    .search-bar input{font-size:12px;padding:4px 8px}
    /* Stack columns that overflow on mobile */
    td.msg{max-width:150px}
    .delbtn{padding:1px 4px;font-size:9px}
    .imp-btn,.rpw-btn,.so-btn{padding:2px 5px !important;font-size:9px !important;margin-right:2px !important}
  }
  .search-bar{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem}
  .search-bar input{flex:1;padding:6px 10px;border:1px solid #e5e3df;border-radius:6px;font-size:13px;background:#f8f7f5;outline:none;transition:border-color .15s}
  .search-bar input:focus{border-color:#e06b1a;background:#fff}
  .search-bar label{font-size:11px;color:#aaa;white-space:nowrap;user-select:none}
  .search-bar .count{font-size:11px;color:#aaa;min-width:60px;text-align:right}
  tr.hidden-row{display:none}
</style>
<script>
function filterTable(input,tbodyId){
  var q=(input.value||'').toLowerCase().trim();
  var rows=document.getElementById(tbodyId).querySelectorAll('tr');
  var vis=0;
  rows.forEach(function(r){
    var t=r.textContent.toLowerCase();
    var show=!q||t.indexOf(q)!==-1;
    r.classList.toggle('hidden-row',!show);
    if(show)vis++;
  });
  var cEl=document.getElementById(tbodyId+'-count');
  if(cEl)cEl.textContent=q?(vis+' match'+(vis!==1?'es':'')):'';
}
function toggleSection(btn){
  var sec=btn.closest('.section');
  var body=sec.querySelector('.section-body');
  var collapsed=body.style.display==='none';
  body.style.display=collapsed?'':'none';
  btn.textContent=collapsed?'▼ Collapse':'► Expand';
}
</script>
</head>
<body>
<div class="topbar">
  <h1>Linkbay Admin</h1>
  <span>Generated ${new Date().toUTCString()}</span>
</div>
<div class="wrap">
  ${req.query.resetDone ? `<div style="background:#fef3c7;border:1px solid #f59e0b;padding:1rem;border-radius:8px;margin-bottom:1rem;">Password reset for <strong>${escHtml(String(req.query.resetDone))}</strong>. New password: <code style="font-size:1.1em;font-weight:bold;background:#fff;padding:2px 6px;border-radius:4px">${escHtml(String(req.query.newPass || ""))}</code><br><span style="font-size:11px;color:#92400e">User is also force-signed-out and must use this new password.</span></div>` : ""}
  ${req.query.signoutDone ? `<div style="background:#fee2e2;border:1px solid #fca5a5;padding:1rem;border-radius:8px;margin-bottom:1rem;">Sign-out flag set for <strong>${escHtml(String(req.query.signoutDone))}</strong>. They will be logged out on their next request.</div>` : ""}
  ${req.query.trialSet ? `<div style="background:#eef2ff;border:1px solid #c7d2fe;padding:1rem;border-radius:8px;margin-bottom:1rem;">Trial activated for user ID <strong>${escHtml(String(req.query.trialSet))}</strong>.</div>` : ""}

  <div class="stats">
    <div class="stat"><div class="val">${fmt(users.length)}</div><div class="lbl">Total users</div></div>
    <div class="stat"><div class="val">${fmt(pages.length)}</div><div class="lbl">Real pages</div></div>
    <div class="stat"><div class="val">${fmt(totalViews)}</div><div class="lbl">Total views</div></div>
    <div class="stat"><div class="val">${fmt(totalClicks)}</div><div class="lbl">Total clicks</div></div>
    <div class="stat"><div class="val">${fmt(totalLeads)}</div><div class="lbl">Total leads</div></div>
    <div class="stat"><div class="val">${fmt(totalContacts)}</div><div class="lbl">Total contacts</div></div>
  </div>

  <div class="section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem"><h2 style="margin:0">Event breakdown</h2><button onclick="toggleSection(this)" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:2px 10px;font-size:11px;cursor:pointer;font-weight:600;color:#64748b">&#9660; Collapse</button></div><div class="section-body">
    <div style="display:flex;gap:1.5rem;flex-wrap:wrap;font-size:13px">
      <div><strong style="color:#e06b1a">Views (browser events):</strong> ${fmt(viewEvents)}</div>
      <div><strong style="color:#e06b1a">Views (server counter):</strong> ${fmt(totalViews)}</div>
      <div><strong style="color:#e06b1a">Link Clicks:</strong> ${fmt(linkClickEvents)}</div>
      <div><strong style="color:#e06b1a">Lead Submits:</strong> ${fmt(leadSubmitEvents)}</div>
      <div><strong style="color:#e06b1a">Total Contacts (all users):</strong> ${fmt(totalContacts)}</div>
    </div>
  </div></div>

  <div class="section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem"><h2 style="margin:0">Platform Stats</h2><button onclick="toggleSection(this)" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:2px 10px;font-size:11px;cursor:pointer;font-weight:600;color:#64748b">&#9660; Collapse</button></div><div class="section-body">
    <div class="stats" style="margin-bottom:1rem">
      <div class="stat"><div class="val">${fmt(signupsWeek)}</div><div class="lbl">Signups (7d)</div></div>
      <div class="stat"><div class="val">${fmt(signupsMonth)}</div><div class="lbl">Signups (30d)</div></div>
      <div class="stat"><div class="val">${fmt(pagesPublished)}</div><div class="lbl">Published</div></div>
      <div class="stat"><div class="val">${fmt(pagesDraft)}</div><div class="lbl">Draft</div></div>
      <div class="stat"><div class="val">${avgLinks}</div><div class="lbl">Avg links / page</div></div>
      <div class="stat"><div class="val">${avgBlocks}</div><div class="lbl">Avg blocks / page</div></div>
    </div>
    <div style="display:flex;gap:1rem;flex-wrap:wrap;font-size:13px;margin-bottom:1rem">
      <div><strong>Mobile:</strong> ${devicePct("mobile")}%</div>
      <div><strong>Desktop:</strong> ${devicePct("desktop")}%</div>
      <div><strong>Tablet:</strong> ${devicePct("tablet")}%</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
      <div>
        <h3 style="font-size:12px;text-transform:uppercase;color:#888;margin-bottom:0.5rem">Most active pages</h3>
        <table>
          <tbody>${mostActivePages.map(p => `<tr><td><a href="/${escHtml(p.username)}" style="color:#e06b1a;text-decoration:none">/${escHtml(p.username)}</a></td><td class="email">${escHtml(p.owner_name)}</td><td style="text-align:right">${fmt(p.view_count)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
      <div>
        <h3 style="font-size:12px;text-transform:uppercase;color:#888;margin-bottom:0.5rem">Top lead-generating pages</h3>
        <table>
          <tbody>${topLeadPages.map(p => `<tr><td><a href="/${escHtml(p.username)}" style="color:#e06b1a;text-decoration:none">/${escHtml(p.username)}</a></td><td class="email">${escHtml(p.owner_name)}</td><td style="text-align:right">${fmt(p.lead_count)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    </div>
  </div></div>

  <div class="section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem"><h2 style="margin:0">Users (${users.length})</h2><button onclick="toggleSection(this)" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:2px 10px;font-size:11px;cursor:pointer;font-weight:600;color:#64748b">&#9660; Collapse</button></div><div class="section-body">
    <div class="search-bar"><label>🔍</label><input type="text" placeholder="Search users by name, email, status…" oninput="filterTable(this,'tbody-users')" /><span class="count" id="tbody-users-count"></span></div>
    <table>
      <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Pages</th><th>Joined</th><th>Last Sign In</th><th>Status</th><th></th></tr></thead>
      <tbody id="tbody-users">
        ${users.map((u) => `
          <tr>
            <td style="color:#aaa">${u.id}</td>
            <td><strong>${escHtml(u.name)}</strong></td>
            <td class="email">${escHtml(u.email)}</td>
            <td>${u.page_count}</td>
            <td class="ts">${(u.created_at || "").slice(0,10)}</td>
            <td class="ts">${u.last_sign_in ? ago(u.last_sign_in) : "—"}</td>
            <td>${activeUserEmails.has(u.email) ? '<span style="color:#16a34a;font-weight:700">● Online</span>' : '<span style="color:#aaa">—</span>'}</td>
            <td style="white-space:nowrap">
              <form method="POST" action="/admin/impersonate" style="display:inline" onsubmit="return confirm('Log in as ${escHtml(u.email)}? You will be taken to their dashboard. Click \'Stop Impersonating\' in the banner to return.')"><input type="hidden" name="userId" value="${u.id}"><button type="submit" class="imp-btn" style="background:#dbeafe;border:1px solid #93c5fd;color:#1d4ed8;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;margin-right:4px">&#128100; Impersonate</button></form>
              <form method="POST" action="/admin/reset-password" style="display:inline" onsubmit="return confirm('Reset password for ${escHtml(u.email)}?')"><input type="hidden" name="email" value="${escHtml(u.email)}"><button type="submit" class="rpw-btn" style="background:#fef3c7;border:1px solid #fde68a;color:#92400e;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;margin-right:4px">Reset PW</button></form>
              <form method="POST" action="/admin/signout-user" style="display:inline" onsubmit="return confirm('Sign out ${escHtml(u.email)}?')"><input type="hidden" name="email" value="${escHtml(u.email)}"><button type="submit" class="so-btn" style="background:#fde68a;border:1px solid #fbbf24;color:#92400e;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;margin-right:4px">Sign Out</button></form>
              <form method="POST" action="/admin/delete-user?id=${u.id}" onsubmit="return confirm('Delete user and all their pages?')" style="display:inline"><button class="delbtn" type="submit">Delete</button></form>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  </div></div>

  <div class="section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem"><h2 style="margin:0">Licences</h2><button onclick="toggleSection(this)" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:2px 10px;font-size:11px;cursor:pointer;font-weight:600;color:#64748b">&#9660; Collapse</button></div><div class="section-body">
    <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
      <div style="background:#f1f5f9;border-radius:8px;padding:0.75rem 1.25rem;min-width:120px;text-align:center">
        <div style="font-size:22px;font-weight:800">${licCountFree}</div>
        <div style="font-size:11px;color:#64748b;font-weight:600">Free</div>
      </div>
      <div style="background:#fef3c7;border-radius:8px;padding:0.75rem 1.25rem;min-width:120px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#92400e">${licCountPro}</div>
        <div style="font-size:11px;color:#92400e;font-weight:600">Pro</div>
      </div>
      <div style="background:#ccfbf1;border-radius:8px;padding:0.75rem 1.25rem;min-width:120px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#0f766e">${licCountBusiness}</div>
        <div style="font-size:11px;color:#0f766e;font-weight:600">Business</div>
      </div>
      <div style="background:#fdf4ff;border-radius:8px;padding:0.75rem 1.25rem;min-width:120px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#7c3aed">\u00a3${mrrEstimate}</div>
        <div style="font-size:11px;color:#7c3aed;font-weight:600">Est. MRR (paid only)</div>
      </div>
      <div style="background:#fef9ee;border-radius:8px;padding:0.75rem 1.25rem;min-width:120px;text-align:center;border:1px solid #fde68a">
        <div style="font-size:22px;font-weight:800;color:#b45309">${licCountTrial}</div>
        <div style="font-size:11px;color:#b45309;font-weight:600">Active Trials</div>
      </div>
    </div>
    <div class="search-bar"><label>🔍</label><input type="text" placeholder="Search licences by name, email, tier…" oninput="filterTable(this,'tbody-licences')" /><span class="count" id="tbody-licences-count"></span></div>
    <table>
      <thead><tr><th>User</th><th>Email</th><th>Tier</th><th>Expires</th><th>Subscription ID</th><th>Change Tier</th></tr></thead>
      <tbody id="tbody-licences">
        ${licenceRowsHtml}
      </tbody>
    </table>
  </div></div>

  <div class="section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem"><h2 style="margin:0">Pages (${pages.length} real, excl. demo profiles)</h2><button onclick="toggleSection(this)" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:2px 10px;font-size:11px;cursor:pointer;font-weight:600;color:#64748b">&#9660; Collapse</button></div><div class="section-body">
    <div class="search-bar"><label>🔍</label><input type="text" placeholder="Search pages by username, owner, status…" oninput="filterTable(this,'tbody-pages')" /><span class="count" id="tbody-pages-count"></span></div>
    <table>
      <thead><tr><th>Username</th><th>Owner</th><th>Title</th><th>Status</th><th>Views</th><th>Clicks</th><th>Leads</th><th>Created</th><th></th></tr></thead>
      <tbody id="tbody-pages">
        ${pages.map(p => `
          <tr>
            <td><a href="/${escHtml(p.username)}" style="color:#e06b1a;text-decoration:none;font-weight:600">/${escHtml(p.username)}</a></td>
            <td><div>${escHtml(p.owner_name)}</div><div class="email">${escHtml(p.owner_email)}</div></td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(p.title)}</td>
            <td><span class="badge ${p.published ? 'live' : 'draft'}">${p.published ? 'Live' : 'Draft'}</span></td>
            <td>${fmt(p.view_count)}</td>
            <td>${fmt(p.total_clicks || 0)}</td>
            <td>${fmt(p.lead_count)}</td>
            <td class="ts">${(p.created_at || "").slice(0,10)}</td>
            <td><form method="POST" action="/admin/delete-page?id=${p.id}" onsubmit="return confirm('Delete this page and all its data?')" style="display:inline"><button class="delbtn" type="submit">Delete</button></form></td>
          </tr>`).join("")}
      </tbody>
    </table>
  </div></div>

  <div class="section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem"><h2 style="margin:0">Recent leads (last 20)</h2><button onclick="toggleSection(this)" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:2px 10px;font-size:11px;cursor:pointer;font-weight:600;color:#64748b">&#9660; Collapse</button></div><div class="section-body">
    <div class="search-bar"><label>🔍</label><input type="text" placeholder="Search leads by name, email, message, page…" oninput="filterTable(this,'tbody-leads')" /><span class="count" id="tbody-leads-count"></span></div>
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Page</th><th>When</th><th></th></tr></thead>
      <tbody id="tbody-leads">
        ${recentLeads.map(l => `
          <tr>
            <td><strong>${escHtml(l.name)}</strong></td>
            <td class="email">${escHtml(l.email)}</td>
            <td><div class="msg">${escHtml(l.message || "—")}</div></td>
            <td>/${escHtml(l.page_username)}</td>
            <td class="ts">${ago(l.created_at)}</td>
            <td><form method="POST" action="/admin/delete-lead?id=${l.id}" onsubmit="return confirm('Delete this lead?')" style="display:inline"><button class="delbtn" type="submit">Delete</button></form></td>
          </tr>`).join("")}
      </tbody>
    </table>
  </div></div>

  <div class="section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem"><h2 style="margin:0">Recent connections — last 20 unique IPs</h2><button onclick="toggleSection(this)" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:2px 10px;font-size:11px;cursor:pointer;font-weight:600;color:#64748b">&#9660; Collapse</button></div><div class="section-body">
    <div class="search-bar"><label>🔍</label><input type="text" placeholder="Search by IP, page, user, location…" oninput="filterTable(this,'tbody-connections')" /><span class="count" id="tbody-connections-count"></span></div>
    <table>
      <thead><tr><th>IP Address</th><th>Last Page</th><th>User</th><th>Location</th><th>Device / Browser</th><th>When</th></tr></thead>
      <tbody id="tbody-connections">
        ${ipsWithGeo.length ? ipsWithGeo.map(e => `
          <tr>
            <td><code style="font-family:ui-monospace,monospace;font-size:11px">${escHtml(e.ip || "—")}</code></td>
            <td class="ts" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(e.path || '')}">${escHtml(e.path || "—")}</td>
            <td class="ts" style="font-size:10px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.userEmail ? `<span style="background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:4px;font-size:9px">👤</span> ${escHtml(e.userEmail)}` : '<span style="color:#aaa">anonymous</span>'}</td>
            <td class="ts">${escHtml(e.location || "—")}</td>
            <td class="ts">${escHtml(parseDevice(e.userAgent))} / ${escHtml(parseBrowser(e.userAgent))}</td>
            <td class="ts">${ago(e.timestamp)}</td>
          </tr>`).join("") : '<tr><td colspan="6" class="ts" style="text-align:center;padding:1rem">No connections recorded yet (resets on restart)</td></tr>'}
      </tbody>
    </table>
  </div></div>

</div>
</body></html>`);
  });

}

function escHtml(str: string) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ──────────────────────────────────────────────────────────────────────
// LICENCE, STRIPE & AI ROUTES — appended to registerRoutes via module-level patch
// Call patchRoutes(app) from registerRoutes or after it.
// ──────────────────────────────────────────────────────────────────────
export function registerLicenceRoutes(app: Express) {
  // ── GET /api/me/licence ──────────────────────────────────────────────────────
  app.get("/api/me/licence", async (req: Request, res: Response) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    try {
      // #17: if trial expired, reset licence column back to 'free' and clear trial fields
      const effectiveTierCheck = getUserEffectiveTier(req.session.userId);
      if (!effectiveTierCheck.isTrial && effectiveTierCheck.tier === "free") {
        // trial may have just expired; clear stale trial fields so DB stays clean
        try {
          const DB_PATH = process.env.DB_PATH || "data.db";
          const adminDb = require("better-sqlite3")(DB_PATH);
          adminDb.prepare("UPDATE users SET trial_tier = NULL, trial_expiry = NULL WHERE id = ? AND trial_expiry IS NOT NULL AND trial_expiry < ?").run(req.session.userId, new Date().toISOString());
          adminDb.close();
        } catch {}
      }
      const lic = getUserLicence(req.session.userId);
      // Use effective tier (respects active trial)
      const effectiveTier = effectiveTierCheck.tier;
      const pages = await storage.getPagesByOwner(req.session.userEmail!);
      const limits = getLimits(effectiveTier);
      // Count blocks on first page
      let blockCount = 0;
      if (pages.length > 0) {
        try { blockCount = JSON.parse(pages[0].blocks || "[]").length; } catch {}
      }
      return res.json({
        tier: effectiveTier,
        isTrial: effectiveTierCheck.isTrial,
        trialExpiry: effectiveTierCheck.trialExpiry,
        expiry: lic.expiry,
        stripeCustomerId: lic.stripeCustomerId,
        stripeSubscriptionId: lic.stripeSubscriptionId,
        pageCount: pages.length,
        blockCount,
        limits: {
          pages: limits.pages === Infinity ? null : limits.pages,
          blocks: limits.blocks === Infinity ? null : limits.blocks,
          analytics: limits.analytics,
          contacts: limits.contacts,
          csvExport: limits.csvExport,
          qrCode: limits.qrCode,
          removeBranding: limits.removebranding,
          leadNotifyEmail: limits.leadNotifyEmail,
          priorityAiRpm: limits.priorityAiRpm,
        },
        priceIds: {
          proMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
          proAnnual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "",
          businessMonthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "",
          businessAnnual: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID || "",
        },
        stripeConfigured: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_MONTHLY_PRICE_ID),
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
      });
    } catch (e) {
      return res.status(500).json({ error: "Server error" });
    }
  });

  // ── POST /api/stripe/create-checkout ────────────────────────────────────────
  app.post("/api/stripe/create-checkout", async (req: Request, res: Response) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: "Payments not configured" });
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const { priceId } = req.body;
      if (!priceId) return res.status(400).json({ error: "priceId required" });
      const mapped = tierFromPriceId(priceId);
      if (!mapped) return res.status(400).json({ error: "Invalid priceId" });

      const lic = getUserLicence(req.session.userId);
      let customerId = lic.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.session.userEmail,
          metadata: { userId: String(req.session.userId) },
        });
        customerId = customer.id;
        setUserLicence(req.session.userId, lic.tier, lic.expiry, customerId);
      }

      const origin = req.headers.origin || "https://linkbay.ai";
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/dashboard?billing=success`,
        cancel_url: `${origin}/dashboard?tab=billing`,
        metadata: { userId: String(req.session.userId) },
      });
      return res.json({ url: session.url });
    } catch (e: any) {
      console.error("Stripe checkout error:", e.message);
      return res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // ── POST /api/stripe/create-portal ──────────────────────────────────────────
  app.post("/api/stripe/create-portal", async (req: Request, res: Response) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: "Payments not configured" });
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const lic = getUserLicence(req.session.userId);
      if (!lic.stripeCustomerId) return res.status(400).json({ error: "No Stripe customer found" });
      const origin = req.headers.origin || "https://linkbay.ai";
      const portal = await stripe.billingPortal.sessions.create({
        customer: lic.stripeCustomerId,
        return_url: `${origin}/dashboard?tab=billing`,
      });
      return res.json({ url: portal.url });
    } catch (e: any) {
      console.error("Stripe portal error:", e.message);
      return res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  // ── POST /api/stripe/webhook ─────────────────────────────────────────────────
  // Uses rawBody captured in index.ts express.json verify callback
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ error: "Stripe not configured" });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"] as string;
    const rawBody = (req as any).rawBody;
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (e: any) {
      console.error("Webhook signature failed:", e.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
          if (!userId) break;
          // Get subscription details
          if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string);
            const priceId = sub.items.data[0]?.price.id;
            const mapped = priceId ? tierFromPriceId(priceId) : null;
            if (mapped) {
              const expiry = new Date((sub as any).current_period_end * 1000).toISOString();
              setUserLicence(userId, mapped.tier, expiry, session.customer as string, sub.id, priceId);
            }
          }
          break;
        }
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const user = getUserByStripeSubscriptionId(sub.id) || getUserByStripeCustomerId(sub.customer as string);
          if (!user) break;
          const priceId = sub.items.data[0]?.price.id;
          const mapped = priceId ? tierFromPriceId(priceId) : null;
          if (mapped) {
            const expiry = new Date((sub as any).current_period_end * 1000).toISOString();
            setUserLicence(user.id, mapped.tier, expiry, undefined, sub.id, priceId);
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const user = getUserByStripeSubscriptionId(sub.id) || getUserByStripeCustomerId(sub.customer as string);
          if (!user) break;
          setUserLicence(user.id, "free", null);
          break;
        }
        case "invoice.payment_failed": {
          // Log but don’t immediately downgrade — Stripe will retry
          console.warn("Payment failed for customer:", (event.data.object as any).customer);
          break;
        }
      }
    } catch (e: any) {
      console.error("Webhook handler error:", e.message);
    }
    return res.json({ received: true });
  });

  // ── PATCH /api/admin/pages/:id — admin-only page field patcher ───────────────
  app.patch("/api/admin/pages/:id", async (req: Request, res: Response) => {
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    const authHeader = req.headers.authorization || "";
    const sessionAdmin = (req.session as any).isAdmin;
    const basicMatch = authHeader.startsWith("Basic ") && Buffer.from(authHeader.slice(6), "base64").toString().split(":")[1] === adminPassword;
    const cookieAdmin = req.cookies?.adminAuth === adminPassword;
    if (!sessionAdmin && !basicMatch && !cookieAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const pageId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (!pageId) return res.status(400).json({ error: "Invalid page id" });
      // Only allow safe fields to be patched
      const ALLOWED = new Set(["background","accent_color","page_font","title","bio","blocks","archived_block_ids","hidden_block_ids","published","seo_title","seo_description"]);
      const patch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(req.body || {})) {
        if (ALLOWED.has(k)) patch[k] = v;
      }
      if (Object.keys(patch).length === 0) return res.status(400).json({ error: "No valid fields to patch" });
      // Map camelCase aliases
      const dbPatch: Record<string, unknown> = {};
      if ("background" in patch)        dbPatch.background = patch.background;
      if ("accent_color" in patch)      dbPatch.accentColor = patch.accent_color;
      if ("page_font" in patch)         dbPatch.pageFont = patch.page_font;
      if ("title" in patch)             dbPatch.title = patch.title;
      if ("bio" in patch)               dbPatch.bio = patch.bio;
      if ("blocks" in patch)            dbPatch.blocks = patch.blocks;
      if ("archived_block_ids" in patch) dbPatch.archivedBlockIds = patch.archived_block_ids;
      if ("hidden_block_ids" in patch)  dbPatch.hiddenBlockIds = patch.hidden_block_ids;
      if ("published" in patch)         dbPatch.published = patch.published;
      const updated = await storage.updatePage(pageId, dbPatch as any);
      return res.json({ success: true, page: updated });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // ── PATCH /api/admin/users/:id/licence ──────────────────────────────────────
  app.patch("/api/admin/users/:id/licence", async (req: Request, res: Response) => {
    // Admin auth check
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    const authHeader = req.headers.authorization || "";
    const sessionAdmin = (req.session as any).isAdmin;
    const basicMatch = authHeader.startsWith("Basic ") && Buffer.from(authHeader.slice(6), "base64").toString().split(":")[1] === adminPassword;
    if (!sessionAdmin && !basicMatch) {
      // Check admin cookie used by the admin panel
      const cookieAdmin = req.cookies?.adminAuth === adminPassword;
      if (!cookieAdmin) return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const userId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const tier = String(req.body?.tier || "").trim();
      const expiry = req.body?.expiry ? String(req.body.expiry) : undefined;
      if (!tier) return res.status(400).json({ error: "tier required" });
      const validTiers = ["free", "pro", "business"];
      if (!validTiers.includes(tier)) return res.status(400).json({ error: "Invalid tier" });
      const finalExpiry = expiry || (tier !== "free" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null);
      setUserLicence(userId, tier, finalExpiry);
      return res.json({ success: true, tier, expiry: finalExpiry });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // ── GET /api/admin/licence-stats ────────────────────────────────────────────
  app.get("/api/admin/licence-stats", async (req: Request, res: Response) => {
    if (!process.env.ADMIN_PASSWORD) return res.status(503).json({ error: "Not configured" });
    try {
      const db = new Database(process.env.DB_PATH || "data.db");
      const users = db.prepare("SELECT id, email, name, licence, licence_expiry, stripe_customer_id, stripe_subscription_id FROM users ORDER BY id DESC").all() as any[];
      db.close();
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const stats = {
        total: users.length,
        free: users.filter(u => !u.licence || u.licence === "free").length,
        pro: users.filter(u => u.licence === "pro").length,
        business: users.filter(u => u.licence === "business").length,
        expiringIn7Days: users.filter(u => {
          if (!u.licence_expiry) return false;
          const exp = new Date(u.licence_expiry);
          return exp > now && exp <= in7Days;
        }).length,
        mrr: users.filter(u => u.licence === "pro").length * 5 + users.filter(u => u.licence === "business").length * 20,
      };
      return res.json({ users, stats });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // ── GET /api/ai/status — health check for AI config ───────────────────────
  app.get("/api/ai/status", (_req: Request, res: Response) => {
    return res.json({
      configured: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.slice(0, 7) + "..." : null,
    });
  });

  // ── POST /api/pages/:pageId/ai-analysis ───────────────────────────────
  // Cached per page per day (in-memory Map, invalidates daily)
  app.post("/api/pages/:pageId/ai-analysis", async (req: Request, res: Response) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI not configured" });
    try {
      const pageId = parseInt(String(req.params.pageId));
      if (!await assertOwnsPage(req, res, pageId)) return;
      const today = new Date().toISOString().slice(0, 10);
      const cacheKey = `${pageId}:${today}`;
      const cached = aiAnalysisCache.get(cacheKey);
      if (cached && cached.date === today) {
        return res.json({ analysis: cached.result, cached: true });
      }
      // Rate limit: 20 req/user/hour
      const rateLimitKey = `analysis:${req.session.userId}`;
      const now = Date.now();
      const bucket = aiRateLimit.get(rateLimitKey);
      if (bucket && bucket.resetAt > now) {
        if (bucket.count >= 20) return res.status(429).json({ error: "Rate limit exceeded" });
        bucket.count++;
      } else {
        aiRateLimit.set(rateLimitKey, { count: 1, resetAt: now + 60 * 60 * 1000 });
      }
      // Gather analytics context
      const page = await storage.getPageById(pageId);
      const events = await storage.getEventsByPage(pageId, 30);
      const views = events.filter((e: any) => e.type === "view").length;
      const clicks = events.filter((e: any) => e.type === "link_click").length;
      const leads = events.filter((e: any) => e.type === "lead_submit").length;
      let blocks: any[] = [];
      try { blocks = JSON.parse((page as any)?.blocks || "[]"); } catch {}
      const blockSummary = blocks.slice(0, 10).map((b: any) => `${b.type}: ${b.title || b.label || b.question || "(untitled)"}`).join(", ");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `You are a friendly growth advisor reviewing someone's link-in-bio page. Be conversational, warm and direct — like advice from a knowledgeable friend, not a consultant's report.\n\nPage: ${page?.title || "Untitled"}\nContent blocks: ${blockSummary || "(none)"}\nLast 30 days: ${views} views, ${clicks} clicks, ${leads} leads captured\nInteraction rate: ${views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0}%\n\nFirst, briefly comment on how the page is performing overall — acknowledge what's working well if the numbers look good, or note if things are quiet and that's completely normal. If week-on-week trend data is available, mention it. Keep this to 1-2 sentences.\n\nThen, if there are genuine improvements to make, give UP TO 5 specific suggestions. Only include a suggestion if it would make a real difference — don't pad with generic advice. Each suggestion should be one clear, actionable sentence. Do not number them if there are fewer than 3.\n\nIf the page is genuinely well-optimised, say so briefly and focus more on the performance commentary. Avoid bullet-point lists of generic best practices.`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.7,
      });
      const result = completion.choices[0]?.message?.content || "Unable to generate analysis.";
      aiAnalysisCache.set(cacheKey, { result, date: today });
      return res.json({ analysis: result, cached: false });
    } catch (e: any) {
      console.error("AI analysis error:", e.message);
      return res.status(500).json({ error: "AI analysis failed" });
    }
  });

  // ── POST /api/ai/generate-page ─────────────────────────────────────────────────
  app.post("/api/ai/generate-page", async (req: Request, res: Response) => {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI not configured — OPENAI_API_KEY missing" });

    // Rate limit: 20 per user per hour — use userId for authenticated users only
    // IMPORTANT: Do NOT use req.ip as fallback — on Railway all requests share the same proxy IP
    const rateLimitKey = req.session.userId ? `user:${req.session.userId}` : null;
    if (rateLimitKey) {
      const now = Date.now();
      const bucket = aiRateLimit.get(rateLimitKey);
      if (bucket && bucket.resetAt > now) {
        if (bucket.count >= 20) return res.status(429).json({ error: "Rate limit: max 20 generations per hour" });
        bucket.count++;
      } else {
        aiRateLimit.set(rateLimitKey, { count: 1, resetAt: now + 60 * 60 * 1000 });
      }
    }

    try {
      const { answers } = req.body;
      if (!answers) return res.status(400).json({ error: "answers required" });

      // Sanitise inputs
      const safe = (s: string) => String(s || "").slice(0, 200).replace(/[<>{}\\]/g, "");
      const name       = safe(answers.name);
      const tagline    = safe(answers.tagline);
      const goal       = safe(answers.goal);
      const industry   = safe(answers.industry);
      const style      = safe(answers.style);
      const colorMood  = safe(answers.colorMood  || "");
      const fontStyle  = safe(answers.fontStyle   || "");
      const blockStyle = safe(answers.blockStyle  || "");
      const blockGoal  = safe(answers.blockGoal   || ""); // for recommender

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Map human colour mood → concrete choices
      const colorMoodMap: Record<string, { background: string; accentColor: string }> = {
        "Warm & energetic":   { background: "bg-ember",    accentColor: "#e06b1a" },
        "Cool & professional":{ background: "bg-glacier",  accentColor: "#0891b2" },
        "Dark & dramatic":    { background: "bg-midnight", accentColor: "#7c3aed" },
        "Light & minimal":    { background: "bg-ivory",    accentColor: "#334155" },
        "Natural & earthy":   { background: "bg-sand",     accentColor: "#059669" },
        "Bold & creative":    { background: "bg-lava",     accentColor: "#e11d48" },
      };

      const fontStyleMap: Record<string, string> = {
        "Clean & modern":     "inter",
        "Bold & editorial":   "cabinet-grotesk",
        "Friendly & rounded": "general-sans",
        "Elegant & serif":    "playfair",
        "Technical & sharp":  "space-grotesk",
      };

      const colorHint   = colorMoodMap[colorMood];
      const fontHint    = fontStyleMap[fontStyle];

      const systemPrompt = `You are a page builder assistant for Linkbay, a link-in-bio platform.
Your ONLY job is to output a single valid JSON object for a Linkbay page.
NEVER output explanations, markdown, comments, or any text outside the JSON.
If asked anything not related to building a Linkbay page, output: {"error":"off_topic"}

Output schema:
{
  "background": string,  // one of: none, bg-aurora, bg-blush, bg-dusk, bg-ember, bg-fog, bg-forest, bg-glacier, bg-haze, bg-ivory, bg-lava, bg-midnight, bg-mint, bg-mocha, bg-ocean, bg-peach, bg-plum, bg-rose, bg-sand, bg-slate, bg-twilight
  "accentColor": string, // hex colour matching the brand
  "fontFamily": string,  // one of: inter, cabinet-grotesk, general-sans, playfair, space-grotesk
  "blockStyle": string,  // one of: default, rounded, sharp, bordered, outlined, elevated, ghost, floating, underline, neon, frosted — choose to suit the visual theme
  "blocks": Block[]      // 3-6 blocks
}

Block types and their field shapes:
- text:      { id, type:"text",      content:"markdown text" }
- link:      { id, type:"link", title:"label", url:"https://...", description:"optional", icon:"single emoji that fits the link purpose — e.g. 📅 booking, 📧 email, 🎥 video, 💼 work, 📄 doc, ⬇️ download, 🛒 shop, 🎓 course, 🎤 podcast, 🌐 website" }
- socials:   { id, type:"socials",   links:[{platform:"instagram",url:"https://..."}, ...] }
- lead-form: { id, type:"lead-form", title:"...", formDescription:"...", buttonText:"...", customFields:[{"name":"...","type":"text"|"dropdown"|"number"|"checkbox","required":true,"options":["..."]}] }
- video:     { id, type:"video",     url:"https://youtube.com/...", title:"..." }
- countdown: { id, type:"countdown", title:"...", targetDate:"2026-12-31" }
- poll:      { id, type:"poll",      question:"...", options:["Option A","Option B"] }

Rules:
- Use a UUID-style string for each block id (e.g. "blk-1", "blk-2")
- ALWAYS respect the background and accentColor hints if provided — only override if no hint given
- ALWAYS respect the fontFamily hint if provided — only choose yourself if no hint given
- Pre-fill ALL content with realistic, specific text based on the user's name, tagline, industry, and goal — never use placeholder text like "Your Name" or "your link here"
- TEXT BLOCKS: Include AT MOST 1 text block. Use it for a short bio paragraph only. NEVER add a second text block.
- LEAD FORMS: ALWAYS include exactly 1 lead-form block. Use the niche/industry to add 1-3 relevant customFields (e.g. for a photographer: [{name:"Event type",type:"dropdown",required:true,options:["Wedding","Portrait","Commercial","Event"]}]; for a fitness coach: [{name:"Your goal",type:"dropdown",required:true,options:["Lose weight","Build muscle","Improve fitness"]}]; for a developer: [{name:"Project type",type:"dropdown",required:true,options:["Web app","Mobile","API","Other"]}]). The formDescription should describe what happens after submission.
- Include at minimum: one text block (bio/tagline with their actual name/brand), 2-3 link blocks, one socials block, one lead-form block
- If goal includes content, community or audience, include a poll block
- If goal mentions an event or launch, include a countdown block AND a lead-form block (e.g. waitlist or notify-me signup) — both are required for launch pages
- If the specific block goal mentions beta, pre-launch, or MVP, include BOTH a countdown AND a lead-form with a waitlist-focused title
- If recommending a single block (blockGoal provided), return exactly 1 block that best achieves that goal, plus a socials block if not already on page
- BLOCK ORDERING: If goal includes getting clients or capturing leads, place the lead-form or primary CTA link FIRST in the blocks array, then text bio, then secondary links, then socials last
- URL placeholders: When a real URL is not known, use a clearly annotated placeholder like https://[your-calendly-link].com or https://[your-website].com/services — NEVER use example.com, placeholder.com, or generic filler domains
- TEXT OPENERS: NEVER begin a text block content with "Welcome to my page", "Hello!", "Welcome!", or any generic greeting. Always open with the person's name and a specific, confident claim about what they do or what they offer
- Output ONLY the JSON object, nothing else`;

      const userPrompt = `Build a Linkbay page for:
- Name/Brand: ${name}
- What they do: ${tagline}
- Page goal: ${goal}${blockGoal ? `\n- Specific block goal: ${blockGoal}` : ""}
- Industry: ${industry}
- Preferred style: ${style}
${ colorHint  ? `- Background: ${colorHint.background} (use exactly this)\n- Accent colour: ${colorHint.accentColor} (use exactly this)` : `- Colour mood: ${colorMood || "match to industry"}` }
${ fontHint   ? `- Font: ${fontHint} (use exactly this)` : `- Font style: ${fontStyle || "match to industry"}` }
- Block style preference: ${blockStyle || "standard"}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.7,
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      if (parsed.error) return res.status(400).json({ error: "AI could not generate page", detail: parsed.error });
      return res.json(parsed);
    } catch (e: any) {
      console.error("AI generation error:", e.message);
      return res.status(500).json({ error: "AI generation failed" });
    }
  });

  // ── POST /api/ai/builder-setup — pick bg + blockStyle + font ──────────────────
  /**
   * No auth required — called during builder before account creation.
   * Accepts: accentColor, useCase, tagline, goal
   * Returns: { background, blockStyle, font }
   * Rules:
   *   - NEVER returns "default" for blockStyle
   *   - NEVER returns "none" for background — always picks a real background
   *   - Ensures the chosen background has sufficient contrast for text readability
   *     (light bg → dark accent; dark bg → light/vivid accent)
   *   - Rate-limited by IP (20/hour)
   */
  app.post("/api/ai/builder-setup", async (req: Request, res: Response) => {
    // Hardcoded contrast-safe fallback (never "default" or "none")
    const SAFE_FALLBACK = { background: "bg-warm-white", blockStyle: "elevated", font: "general-sans" };

    if (!process.env.OPENAI_API_KEY) {
      return res.json(SAFE_FALLBACK);
    }
    const rateLimitKey = `ip:${req.ip}`;
    const now = Date.now();
    const bucket = aiRateLimit.get(rateLimitKey);
    if (bucket && bucket.resetAt > now && bucket.count >= 20) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
    }
    if (!bucket || bucket.resetAt <= now) {
      aiRateLimit.set(rateLimitKey, { count: 1, resetAt: now + 3600_000 });
    } else {
      bucket.count++;
    }

    const safe = (s: string) => String(s || "").slice(0, 200).replace(/[<>{}\\]/g, "");
    const accentColor = safe(req.body?.accentColor || "#e06b1a");
    const useCase     = safe(req.body?.useCase || "");
    const tagline     = safe(req.body?.tagline || "");
    const goal        = safe(req.body?.goal || "");

    // Determine if the accent colour is light or dark (to guide background choice)
    const hexToLuminance = (hex: string): number => {
      const h = hex.replace("#", "");
      if (h.length !== 6) return 0.5;
      const r = parseInt(h.slice(0,2),16)/255;
      const g = parseInt(h.slice(2,4),16)/255;
      const b = parseInt(h.slice(4,6),16)/255;
      const toLinear = (c: number) => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
      return 0.2126*toLinear(r) + 0.7152*toLinear(g) + 0.0722*toLinear(b);
    };
    const accentIsLight = hexToLuminance(accentColor) > 0.35;

    // Backgrounds by contrast category
    // LIGHT backgrounds (need dark text & work with any accent)
    const LIGHT_BACKGROUNDS = [
      "bg-warm-white","bg-warm-sand","bg-stone","bg-mint","bg-lavender",
      "bg-butter","bg-powder","bg-blush","bg-peach-cream","bg-slate-mist",
      "bg-aurora","bg-blush-gradient","bg-tropical","bg-forest",
    ];
    // DARK backgrounds (need light/vivid accent — only safe with dark accents)
    const DARK_BACKGROUNDS = [
      "bg-charcoal","bg-midnight","bg-espresso","bg-deep-purple",
    ];

    const allowedBackgrounds = accentIsLight
      ? LIGHT_BACKGROUNDS  // light accent → must use light background
      : [...LIGHT_BACKGROUNDS, ...DARK_BACKGROUNDS]; // dark accent → any bg

    // Use-case→background preference hints (Issue 2: bg diversity)
    const BG_HINTS: Record<string, string> = {
      consultant: "bg-warm-sand, bg-stone, bg-slate-mist, or bg-powder — clean and trustworthy",
      recruiter:  "bg-powder, bg-slate-mist, bg-lavender, or bg-stone — professional and approachable",
      founder:    "bg-aurora, bg-midnight, bg-deep-purple, or bg-mint — bold and forward-looking",
      agency:     "bg-stone, bg-charcoal, bg-espresso, or bg-warm-sand — confident and editorial",
      creator:    "bg-mint, bg-aurora, bg-blush, bg-tropical, or bg-butter — vibrant and expressive",
      other:      "bg-warm-sand, bg-stone, or bg-lavender",
    };
    // Use-case→blockStyle preference hints (Issue 3: style diversity)
    const STYLE_HINTS: Record<string, string> = {
      consultant: "refined-border or elevated — polished and trustworthy",
      recruiter:  "bordered or outlined — structured and clear",
      founder:    "frosted or floating — modern and startup-forward",
      agency:     "sharp or stripe — bold editorial feel",
      creator:    "ghost or compact-row — lightweight and visual",
      other:      "elevated or outlined",
    };
    // Use-case→font preferences (Issue 7: creator/founder font)
    const FONT_HINTS: Record<string, string> = {
      consultant: "general-sans or cabinet-grotesk — professional and readable",
      recruiter:  "cabinet-grotesk or inter — structured and direct",
      founder:    "cabinet-grotesk or inter — modern and technical",
      agency:     "cabinet-grotesk or general-sans — bold editorial",
      creator:    "general-sans or cabinet-grotesk — friendly and informal — NEVER pick merriweather or mono for creator",
      other:      "general-sans or cabinet-grotesk",
    };
    const ucKey = useCase in BG_HINTS ? useCase : "other";

    // Approximate luminance lookup for backgrounds (for post-selection contrast check)
    const BG_LUM_MAP: Record<string, number> = {
      "bg-warm-white":0.92,"bg-warm-sand":0.82,"bg-stone":0.75,"bg-mint":0.79,
      "bg-lavender":0.78,"bg-butter":0.88,"bg-powder":0.80,"bg-blush":0.82,
      "bg-peach-cream":0.85,"bg-slate-mist":0.73,"bg-aurora":0.76,
      "bg-blush-gradient":0.80,"bg-tropical":0.72,"bg-forest":0.68,
      "bg-charcoal":0.08,"bg-midnight":0.04,"bg-espresso":0.06,"bg-deep-purple":0.05,
    };
    const contrastRatio = (l1: number, l2: number) => {
      const L1 = Math.max(l1,l2), L2 = Math.min(l1,l2);
      return (L1+0.05)/(L2+0.05);
    };
    const accentLum = hexToLuminance(accentColor);

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.85,  // raised from 0.7 for more bg/style variety (Issue 2)
        max_tokens: 150,
        response_format: { type: "json_object" },
        messages: [{
          role: "system",
          content: `You are a professional web designer. Choose a visual theme for a link-in-bio page.
Output ONLY valid JSON: { "background": "...", "blockStyle": "...", "font": "..." }
RULES (strictly enforce):
1. background MUST be one of: ${allowedBackgrounds.join(", ")}
2. blockStyle MUST be one of: frosted, sharp, bordered, outlined, elevated, ghost, floating, underline, shadow-depth, refined-border, compact-row, stripe — do NOT use "default" or "shadow-depth" unless specifically appropriate
3. font MUST be one of: general-sans, cabinet-grotesk, inter, merriweather, playfair, mono — do NOT use "inter" unless use case is clearly technical; do NOT use merriweather or mono for creator or social-media use cases
4. The background MUST ensure text is readable — pick light/neutral backgrounds for light accents, darker backgrounds only for dark/vivid accents
5. Choices must feel cohesive, professional, and distinctly suited to the use case — avoid generic defaults
6. AVOID bg-warm-white unless it is clearly the best choice — prefer more distinctive backgrounds from the list
`,
        }, {
          role: "user",
          content: `Accent colour: ${accentColor}
Use case: ${useCase || "general professional"}
What they do: ${tagline || "professional services"}
Page goal: ${goal || "share links and connect"}
Accent is ${accentIsLight ? "LIGHT — you MUST pick a light background from the list" : "DARK/VIVID — you may pick light or dark backgrounds"}
Suggested backgrounds for this use case: ${BG_HINTS[ucKey]}
Suggested block style for this use case: ${STYLE_HINTS[ucKey]}
Suggested font for this use case: ${FONT_HINTS[ucKey]}`,
        }],
      });
      const text = (completion.choices[0]?.message?.content || "{}").trim();
      let result: any = {};
      try { result = JSON.parse(text); } catch {
        const m = text.match(/{[\s\S]+}/);
        if (m) try { result = JSON.parse(m[0]); } catch {}
      }
      // Strict validation — never let "none", "default" or invalid values through
      const VALID_BG = new Set([...LIGHT_BACKGROUNDS, ...DARK_BACKGROUNDS]);
      const VALID_STYLE = new Set(["frosted","sharp","bordered","outlined","elevated","ghost","floating","underline","shadow-depth","refined-border","compact-row","stripe"]);
      const VALID_FONT = new Set(["general-sans","cabinet-grotesk","inter","merriweather","playfair","mono"]);

      // Pick AI's bg if valid, else fallback
      let bg = (VALID_BG.has(result.background) && allowedBackgrounds.includes(result.background))
        ? result.background
        : (allowedBackgrounds[0] ?? "bg-warm-white");

      // Issues 1 & 6: Post-selection contrast check — ensure accent vs bg ≥ 4.5:1
      // If the AI picked a background where the accent is unreadable, walk through
      // allowed backgrounds sorted by contrast (best first) until we find one that passes.
      const bgLum = BG_LUM_MAP[bg] ?? 0.5;
      if (contrastRatio(accentLum, bgLum) < 4.5) {
        // Sort allowed bgs by contrast ratio descending and pick best passing one
        const sorted = [...allowedBackgrounds].sort((a, b) => {
          const la = BG_LUM_MAP[a] ?? 0.5, lb = BG_LUM_MAP[b] ?? 0.5;
          return contrastRatio(accentLum, lb) - contrastRatio(accentLum, la);
        });
        const passing = sorted.find(b => contrastRatio(accentLum, BG_LUM_MAP[b] ?? 0.5) >= 4.5);
        if (passing) bg = passing;
        // If nothing passes 4.5 (very rare edge case), use best available
        else bg = sorted[0] ?? bg;
      }

      return res.json({
        background: bg,
        blockStyle: VALID_STYLE.has(result.blockStyle) ? result.blockStyle : "elevated",
        font: VALID_FONT.has(result.font) ? result.font : "general-sans",
      });
    } catch (e: any) {
      return res.json(SAFE_FALLBACK);
    }
  });


  // ── GET /api/ai/suggest-username — suggests an untaken page slug ───────────
  app.get("/api/ai/suggest-username", async (req: Request, res: Response) => {
    try {
      const name   = String(req.query.name   || "").slice(0, 80);
      const domain = String(req.query.domain || "").slice(0, 80);
      if (!name && !domain) return res.status(400).json({ error: "name or domain required" });

      // Slug rules: max 12 chars, no hyphens, lowercase alphanumeric only
      const MAX_SLUG = 12;
      const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, MAX_SLUG);

      const candidates: string[] = [];
      if (name) {
        const parts = name.trim().split(/\s+/);
        // 1. Concatenated first+last (e.g. "johnsmith")
        if (parts.length >= 2) {
          candidates.push(toSlug(parts[0] + parts[parts.length - 1]));
          // 2. First word only
          candidates.push(toSlug(parts[0]));
          // 3. Last word only
          candidates.push(toSlug(parts[parts.length - 1]));
        } else {
          // Single word name — use as-is (truncated)
          candidates.push(toSlug(parts[0]));
        }
        // 4. Full name concatenated (no spaces)
        candidates.push(toSlug(parts.join("")));
      }
      if (domain) {
        const domainBase = domain.replace(/^www\./, "").split(".")[0];
        candidates.push(toSlug(domainBase));
      }

      const RESERVED = new Set(["admin","dashboard","login","register","builder","api","blog","pricing","about","terms","privacy","static","assets","health","settings","upgrade","billing","help","support","contact","home","index","app","www","mail","email","auth","oauth","callback"]);
      const seen = new Set<string>();
      const unique = candidates.filter(c => c && c.length >= 3 && !RESERVED.has(c) && !seen.has(c) && (seen.add(c), true));

      const db = new Database(process.env.DB_PATH || "data.db");
      for (const slug of unique) {
        const existing = db.prepare("SELECT id FROM pages WHERE username = ?").get(slug);
        if (!existing) { db.close(); return res.json({ username: slug }); }
      }
      // All taken — append short numeric suffix (no hyphen)
      const base = (unique[0] || toSlug(name || domain)).slice(0, 10); // leave 2 chars for suffix
      for (let i = 2; i <= 99; i++) {
        const slug = (base + i).slice(0, MAX_SLUG);
        const existing = db.prepare("SELECT id FROM pages WHERE username = ?").get(slug);
        if (!existing) { db.close(); return res.json({ username: slug }); }
      }
      db.close();
      return res.json({ username: (base + Date.now().toString(36).slice(-2)).slice(0, MAX_SLUG) });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // ── POST /api/ai/onboarding-suggest ───────────────────────────────────────────────
  /**
   * Generates a personalised headline, bio, theme preset, and starter blocks
   * from the onboarding wizard inputs (niche, voice, goals, tagline).
   * Requires auth. Rate-limited to 20/user/hour (shared with generate-page).
   */
  app.post("/api/ai/onboarding-suggest", requireAuth as any, async (req: Request, res: Response) => {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI not configured — OPENAI_API_KEY missing" });

    const rateLimitKey = `user:${req.session.userId}`;
    const now = Date.now();
    const bucket = aiRateLimit.get(rateLimitKey);
    if (bucket && bucket.resetAt > now) {
      if (bucket.count >= 20) return res.status(429).json({ error: "Rate limit: max 20 AI generations per hour" });
      bucket.count++;
    } else {
      aiRateLimit.set(rateLimitKey, { count: 1, resetAt: now + 60 * 60 * 1000 });
    }

    try {
      const safe = (s: unknown) => String(s || "").slice(0, 300).replace(/[<>{}\\]/g, "");
      const userName  = safe(req.body.userName);
      const niche     = safe(req.body.niche);
      const voice     = safe(req.body.voice);
      const tagline   = safe(req.body.tagline);
      const goals     = (Array.isArray(req.body.goals) ? req.body.goals : []).map((g: unknown) => safe(g)).slice(0, 8).join(", ");
      const themeHint = req.body.themeHint as { background: string; accentColor: string; pageFont: string } | undefined;

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are an expert copywriter and brand strategist for Linkbay, a link-in-bio platform.
Your ONLY output is a single valid JSON object. No markdown, no explanations, no text outside the JSON.

Output schema:
{
  "headline": string,      // punchy 5-12 word page headline for this person
  "bio": string,           // 2-3 sentence professional bio, personalised to their niche, voice, and goals
  "accentColor": string,   // hex colour — must match themeHint if provided, else choose to suit niche
  "background": string,    // CSS class — one of: none,bg-aurora,bg-blush,bg-dusk,bg-ember,bg-fog,bg-forest,bg-glacier,bg-haze,bg-ivory,bg-lava,bg-midnight,bg-mint,bg-mocha,bg-ocean,bg-peach,bg-plum,bg-rose,bg-sand,bg-slate,bg-twilight
  "pageFont": string,      // one of: inter,cabinet-grotesk,general-sans,playfair,space-grotesk
  "blocks": Block[]        // 3-5 starter blocks for their goals
}

Block types:
{ id:"blk-1", type:"link", title:"...", url:"https://...", description:"...", icon:"single emoji matching link purpose: 📅 booking 📧 email 🎥 video 💼 work 📄 doc ⬇️ download 🛒 shop 🎓 course 🎤 podcast 🌐 website 🚀 launch", style:"featured"|"default"|"outline" }
{ id:"blk-2", type:"text",        content:"markdown bio text" }
{ id:"blk-3", type:"lead-form",   title:"...", formDescription:"...", buttonText:"...", customFields:[{"name":"...","type":"text"|"dropdown"|"number"|"checkbox","required":true,"options":["..."]}] }
{ id:"blk-4", type:"social-links", platforms:"[{\\"platform\\":\\"linkedin\\",\\"url\\":\\"https://linkedin.com/in/...\\"}]" }
{ id:"blk-5", type:"booking",     title:"...", platform:"calendly", embedUrl:"", embedHeight:650 }
{ id:"blk-6", type:"countdown",   title:"...", targetDate:"2026-12-31" }

Block variety and ordering rules:
- NEVER generate only link blocks — always use a MIX: at least one text block (bio) + at least one non-link block (social-links, lead-form, booking, or countdown)
- Always start with one featured link block as the primary CTA
- ALWAYS include a text block with the person's bio (2-3 sentences, specific to their niche)
- TEXT BLOCKS: Include AT MOST 1 text block. NEVER add a second text block.
- LEAD FORMS: ALWAYS include exactly 1 lead-form block with 1-3 niche-relevant customFields (e.g. for a photographer: [{name:"Event type",type:"dropdown",required:true,options:["Wedding","Portrait","Commercial","Event"]}]; for a fitness coach: [{name:"Your goal",type:"dropdown",required:true,options:["Lose weight","Build muscle","Improve fitness"]}]; for a consultant: [{name:"Budget",type:"dropdown",required:true,options:["<£1k","£1k-£5k","£5k-£20k","£20k+"]}]). The formDescription should describe what happens after submission.
- If goals include "Get new clients" or "Capture leads": add a lead-form block with service-specific title
- If goals include "Drive bookings": add a booking block
- If goals include "Promote a launch": add a countdown block dated 90 days from now AND a lead-form waitlist block
- If goals include "Link my socials" or "Grow my audience": add a social-links block
- Prefer social-links over individual link blocks for social media profiles — group all socials into one social-links block
- NEVER use placeholder text like "Your Name" or "your link here" — always use the person's actual name/tagline
- BLOCK ORDERING: primary CTA link first, then bio text, then secondary links, then lead-form/booking, then social-links last
- Headline must match the voice tone: professional=formal, warm=friendly, bold=punchy, creative=expressive, expert=authoritative
- Bio must sound human and specific — two sentences about what they do, one call to action
- URL placeholders: when real URL unknown use https://[your-link].com format — NEVER example.com
- TEXT OPENERS: NEVER begin text block with "Welcome to my page", "Hello!", or generic greetings — open with name + confident claim
- ALWAYS respect themeHint.accentColor and themeHint.background if provided
- ALWAYS respect themeHint.pageFont if provided
- Output ONLY the JSON object`;

      const userPrompt = `Build a Linkbay page for:
- Name: ${userName}
- Niche / profession: ${niche}
- What they do: ${tagline}
- Brand voice: ${voice}
- Page goals: ${goals}
${ themeHint ? `- Theme accent: ${themeHint.accentColor} (use exactly this)\n- Background: ${themeHint.background} (use exactly this)\n- Font: ${themeHint.pageFont} (use exactly this)` : "" }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.75,
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(raw); } catch { return res.status(500).json({ error: "AI returned malformed JSON" }); }

      if (parsed.error) return res.status(400).json({ error: "AI could not generate suggestions" });

      // Validate required fields
      if (!parsed.headline || !parsed.bio || !Array.isArray(parsed.blocks)) {
        return res.status(500).json({ error: "AI response missing required fields" });
      }

      return res.json(parsed);
    } catch (e: any) {
      console.error("AI onboarding-suggest error:", e.message);
      return res.status(500).json({ error: "AI generation failed. Please try again." });
    }
  });

  // ─────────────────────────────────────────────────
  //  AI — Import from URL
  // ─────────────────────────────────────────────────
  // import-url is intentionally auth-optional: /builder uses it before account creation
  app.post("/api/ai/import-url", async (req, res) => {
    // Rate-limit by session userId if logged in, otherwise by IP
    const rateLimitKey = (req as any).session?.userId ?? (req as any).session?.userEmail ?? req.ip ?? "anon";
    const now = Date.now();
    const bucket = aiRateLimit.get(rateLimitKey);
    if (bucket) {
      if (now < bucket.resetAt && bucket.count >= 20) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again in an hour." });
      }
      if (now >= bucket.resetAt) {
        aiRateLimit.set(rateLimitKey, { count: 1, resetAt: now + 3600_000 });
      } else {
        bucket.count++;
      }
    } else {
      aiRateLimit.set(rateLimitKey, { count: 1, resetAt: now + 3600_000 });
    }

    const { url } = req.body as { url?: string };
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url is required" });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (![ "http:", "https:" ].includes(parsedUrl.protocol)) throw new Error();
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    // Fetch the target URL with Node built-in http/https
    const rawHtml = await new Promise<string>((resolve, reject) => {
      const lib = parsedUrl.protocol === "https:" ? https : http;
      const reqOptions = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Linkbay/1.0; +https://linkbay.ai)",
          "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        timeout: 10_000,
      };
      const r = lib.request(reqOptions, (response) => {
        // Follow single redirect
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          try {
            const redirectLib = response.headers.location.startsWith("https") ? https : http;
            const rr = redirectLib.get(response.headers.location, (rs) => {
              const chunks: Buffer[] = [];
              rs.on("data", (c: Buffer) => chunks.push(c));
              rs.on("end", () => resolve(Buffer.concat(chunks).toString("utf8").slice(0, 200_000)));
              rs.on("error", reject);
            });
            rr.on("error", reject);
          } catch (e) { reject(e); }
          return;
        }
        const chunks: Buffer[] = [];
        response.on("data", (c: Buffer) => chunks.push(c));
        response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8").slice(0, 200_000)));
        response.on("error", reject);
      });
      r.on("error", reject);
      r.on("timeout", () => { r.destroy(); reject(new Error("timeout")); });
      r.end();
    }).catch(() => "");

    if (!rawHtml) {
      return res.status(422).json({ error: "Could not fetch that URL. Make sure it is publicly accessible." });
    }

    // ── Parse the HTML for metadata ──────────────────────────────────────────
    function getMeta(html: string, ...attrs: string[]): string {
      for (const attr of attrs) {
        const m = html.match(new RegExp(`<meta[^>]+${attr}[^>]+content=["']([^"']{1,600})["']`, "i"))
          || html.match(new RegExp(`<meta[^>]+content=["']([^"']{1,600})["'][^>]+${attr}`, "i"));
        if (m) return m[1].trim();
      }
      return "";
    }
    const titleMatch = rawHtml.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    const metaTitle       = titleMatch ? titleMatch[1].trim() : "";
    const metaDescription = getMeta(rawHtml, 'name=["\']description["\']') ||
                            getMeta(rawHtml, 'property=["\']og:description["\']');
    const ogTitle         = getMeta(rawHtml, 'property=["\']og:title["\']');
    const ogDescription   = getMeta(rawHtml, 'property=["\']og:description["\']');
    const ogImage         = getMeta(rawHtml, 'property=["\']og:image["\']');
    // Strip tags and collapse whitespace for body text
    const bodyText = rawHtml
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
    const h1Match = rawHtml.match(/<h1[^>]*>([^<]{1,200})<\/h1>/i);
    const h1Text = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : "";
    const hostname = parsedUrl.hostname.replace(/^www\./, "");
    const platform =
      hostname.includes("linkedin.com") ? "LinkedIn" :
      hostname.includes("youtube.com")  ? "YouTube" :
      hostname.includes("substack.com") ? "Substack" :
      hostname.includes("calendly.com") ? "Calendly" :
      hostname.includes("etsy.com")     ? "Etsy" :
      hostname.includes("instagram.com") ? "Instagram" :
      hostname.includes("twitter.com") || hostname.includes("x.com") ? "X / Twitter" :
      hostname;

    // ── Call GPT-4o to generate the page ─────────────────────────────────────
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are Linkbay AI. Given scraped content from a ${platform} page, generate a complete link-in-bio page profile as a JSON object.

Return ONLY valid JSON with these fields:
{
  "background": "bg-* class name — one of: none,bg-aurora,bg-blush,bg-dusk,bg-ember,bg-fog,bg-forest,bg-glacier,bg-haze,bg-ivory,bg-lava,bg-midnight,bg-mint,bg-mocha,bg-ocean,bg-peach,bg-plum,bg-rose,bg-sand,bg-slate,bg-twilight,bg-warm-white,bg-warm-sand",
  "accentColor": "#hex",
  "fontFamily": "inter|cabinet-grotesk|general-sans|playfair|space-grotesk",
  "blockStyle": "default|elevated|frosted|bordered|outlined|ghost|floating|shadow-depth",
  "title": "Person or brand headline (under 80 chars)",
  "bio": "2-sentence bio (under 280 chars)",
  "phone": "phone number found on the page, or empty string if none found",
  "contactEmail": "contact/business email found on page — NOT a social login email, NOT noreply. Empty string if not found.",
  "location": "city, region or country found on the page, or empty string if none found",
  "blocks": [...]
}

Block types:
{ id:"blk-1", type:"link", title:"...", url:"https://...", description:"...", icon:"single emoji matching link purpose: 📅 booking 📧 email 🎥 video 💼 work 📄 doc ⬇️ download 🛒 shop 🎓 course 🎤 podcast 🌐 website", style:"featured" }
{ id:"blk-2", type:"text", content:"markdown bio text" }
{ id:"blk-3", type:"lead-form", title:"...", formDescription:"...", buttonText:"...", customFields:[{"name":"...","type":"text"|"dropdown"|"number"|"checkbox","required":true,"options":["...",""]}] }
{ id:"blk-4", type:"social-links", platforms:"[{\"platform\":\"linkedin\",\"url\":\"https://...\"}]" }
{ id:"blk-5", type:"booking", title:"...", platform:"calendly", embedUrl:"", embedHeight:650 }

Rules:
- Extract the person's real name from the title/h1 — use it throughout
- The link-in-bio page URL being imported is ${url} — add it as the primary featured link block if it is useful (e.g. a portfolio site, Substack, LinkedIn). Do NOT add it if the URL is already represented by a social-links block platform.
- Generate 4-8 relevant blocks that best represent the person/brand

--- TEXT BLOCK RULE (STRICT) ---
Include AT MOST 1 text block total. One short bio paragraph only. NEVER output a second text block under any circumstances.

--- LINK BLOCK URL UNIQUENESS (CRITICAL) ---
Each link block MUST have a unique URL. NEVER create two link blocks pointing to the same domain or the same person's profile. Before adding a link block, ask yourself: does a link block with this domain already exist? If yes, skip it. Consolidate: if you have multiple links from the same person/brand, keep only the most important one.

--- BLOCK VARIETY (CRITICAL) ---
A page with only link blocks is WRONG. You MUST use a genuine mix. Follow this mapping strictly:
* Bio/about copy → text block (maximum 1 total)
* Contact/enquiry/get in touch → lead-form block (ALWAYS include exactly 1)
* Social profiles (Instagram, LinkedIn, Twitter, TikTok etc) → social-links block (ONE combined block — list all found platforms together, never separate link blocks for social profiles)
* Booking/scheduling (Calendly, etc) → booking block
* Event or launch → countdown block
* Portfolio, shop, external article, external tool → link block (only for content genuinely best served as a standalone CTA)
Do NOT create a link block for a social profile URL — those go in the social-links block only.

--- LEAD FORM (ALWAYS REQUIRED) ---
ALWAYS include exactly 1 lead-form block. You MUST add 1-3 relevant customFields based on the person's niche/industry:
* Photographer/videographer: [{"name":"Event type","type":"dropdown","required":true,"options":["Wedding","Portrait","Commercial","Event"]}]
* Fitness/health coach: [{"name":"Your goal","type":"dropdown","required":true,"options":["Lose weight","Build muscle","Improve fitness","General health"]}]
* Developer/agency: [{"name":"Project type","type":"dropdown","required":true,"options":["Web app","Mobile","API","Other"]}]
* Consultant/coach: [{"name":"Budget range","type":"dropdown","required":false,"options":["Under £500","£500-£2k","£2k-£10k","£10k+"]}]
* Creative/designer: [{"name":"Project type","type":"dropdown","required":true,"options":["Branding","Web design","Illustration","Other"]}]
* General business: [{"name":"How can I help?","type":"dropdown","required":true,"options":["General enquiry","Partnership","Collaboration","Other"]}]
The formDescription must say what happens after submission (e.g. "I'll get back to you within 24 hours.").

- CRITICAL: For social-links blocks, ONLY include social platform URLs that are EXPLICITLY present in the scraped content. NEVER invent or guess social profile URLs.
- A well-structured page should include: 1 text bio block, 1-2 link blocks (real external CTAs, not social profiles), 1 lead-form block with custom fields, 1 social-links block (only if found), optionally a booking block.
- Pick an accent colour that matches the brand's visual identity (use brand colours from the page where possible)
- Choose a background from the list above that fits the brand aesthetic
- Do NOT default to plain white — choose a background that reflects the brand's personality and colour palette
- Dark brands (dark website, dark brand colours) → use dark backgrounds (bg-midnight, bg-slate, bg-mocha, bg-aurora)
- Light professional brands → use bg-ivory, bg-glacier, bg-sand, bg-warm-sand
- Creative/vibrant brands → use bg-mint, bg-peach, bg-blush, bg-rose
- Background MUST have good contrast with white text (dark bg) or dark text (light bg)
- Infer blockStyle from the brand aesthetic: corporate/professional → elevated or bordered; creative → ghost or frosted; tech/dark → frosted or shadow-depth
- fontFamily should match brand voice: formal/editorial → cabinet-grotesk or playfair; tech/startup → inter or space-grotesk; friendly → general-sans
- Output ONLY the JSON object, no markdown fences`;

    // Extract social platform links explicitly from the HTML so we can pass them to the AI
    const SOCIAL_LINK_PATTERNS: { pattern: RegExp; platform: string }[] = [
      { pattern: /https?:\/\/(www\.)?instagram\.com\/[^"'\s<>?#]+/g, platform: "instagram" },
      { pattern: /https?:\/\/(www\.)?(twitter|x)\.com\/[^"'\s<>?#]+/g, platform: "twitter" },
      { pattern: /https?:\/\/(www\.)?linkedin\.com\/[^"'\s<>?#]+/g, platform: "linkedin" },
      { pattern: /https?:\/\/(www\.)?tiktok\.com\/@[^"'\s<>?#]+/g, platform: "tiktok" },
      { pattern: /https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|@)[^"'\s<>?#]+/g, platform: "youtube" },
      { pattern: /https?:\/\/(www\.)?facebook\.com\/[^"'\s<>?#]+/g, platform: "facebook" },
      { pattern: /https?:\/\/(www\.)?github\.com\/[^"'\s<>?#]+/g, platform: "github" },
      { pattern: /https?:\/\/(www\.)?pinterest\.com\/[^"'\s<>?#]+/g, platform: "pinterest" },
      { pattern: /https?:\/\/(open\.)?spotify\.com\/[^"'\s<>?#]+/g, platform: "spotify" },
      { pattern: /https?:\/\/(www\.)?twitch\.tv\/[^"'\s<>?#]+/g, platform: "twitch" },
      { pattern: /https?:\/\/(www\.)?behance\.net\/[^"'\s<>?#]+/g, platform: "behance" },
      { pattern: /https?:\/\/(www\.)?dribbble\.com\/[^"'\s<>?#]+/g, platform: "dribbble" },
      { pattern: /https?:\/\/([a-z0-9-]+\.)?substack\.com\/[^"'\s<>?#]*/g, platform: "substack" },
      { pattern: /https?:\/\/(www\.)?medium\.com\/[^"'\s<>?#]+/g, platform: "medium" },
      { pattern: /https?:\/\/(t\.me|telegram\.org)\/[^"'\s<>?#]+/g, platform: "telegram" },
    ];
    const foundSocialLinks: { platform: string; url: string }[] = [];
    const seenPlatforms = new Set<string>();
    for (const { pattern, platform: plat } of SOCIAL_LINK_PATTERNS) {
      const matches = rawHtml.match(pattern) || [];
      for (const m of matches) {
        // Skip self-referential or obvious tracking links
        const clean = m.replace(/["'>]+$/, "");
        if (!seenPlatforms.has(plat) && !clean.includes(hostname)) {
          foundSocialLinks.push({ platform: plat, url: clean });
          seenPlatforms.add(plat);
        }
      }
    }
    const socialLinksNote = foundSocialLinks.length > 0
      ? `Social links found in page HTML: ${JSON.stringify(foundSocialLinks)}`
      : "No social media profile links were found in the page HTML. Do NOT add any social-links block.";

    // Extract phone / email / location from raw HTML using regex
    const phoneMatch = rawHtml.match(/(?:tel:|phone|ph|call us|mobile|mob)[:\s"'>]*([+\d][\d\s().-]{6,18}\d)/i);
    const foundPhone = phoneMatch ? phoneMatch[1].trim() : "";
    const emailMatch = rawHtml.match(/([a-zA-Z0-9._%+\-]+@(?!noreply|no-reply|example|sentry|wix|wordpress)[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
    const foundEmail = emailMatch ? emailMatch[1].trim() : "";
    const locationMatch = rawHtml.match(/(?:based in|located in|location|city|address)[:\s"'>]*([A-Z][a-z]+(?:[,\s]+[A-Z][a-zA-Z]+){0,3})/i);
    const foundLocation = locationMatch ? locationMatch[1].replace(/[<>"]/g, "").trim() : "";
    const contactNote = [
      foundPhone    ? `Phone found: ${foundPhone}`    : "",
      foundEmail    ? `Email found: ${foundEmail}`    : "",
      foundLocation ? `Location found: ${foundLocation}` : "",
    ].filter(Boolean).join("\n");

    const userPrompt = `Platform: ${platform}
URL: ${url}
Page title: ${metaTitle || ogTitle}
Meta description: ${metaDescription || ogDescription}
H1: ${h1Text}
${socialLinksNote}
${contactNote ? contactNote + "\n" : ""}Body text (truncated): ${bodyText}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.7,
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(raw); } catch { return res.status(500).json({ error: "AI returned malformed JSON" }); }

      if (!parsed.title || !parsed.bio || !Array.isArray(parsed.blocks)) {
        return res.status(500).json({ error: "AI response missing required fields" });
      }

      // Add og:image as avatar hint if present
      if (ogImage && !parsed.avatarUrl) parsed.avatarUrl = ogImage;
      parsed.importedFrom = url;
      parsed.importedPlatform = platform;

      // Sanitise blockStyle — AI may return link-style names (featured, outline, minimal)
      // which don't map to any .block-style-* CSS class. Remap to valid block styles.
      const VALID_BLOCK_STYLES = new Set(["default","elevated","frosted","bordered","outlined","ghost","floating","underline","neon","dark-glass","minimal-hc","shadow-depth","refined-border","compact-row","stripe","sharp"]);
      const BLOCK_STYLE_REMAP: Record<string, string> = { featured: "elevated", outline: "outlined", minimal: "ghost" };
      if (typeof parsed.blockStyle === "string") {
        if (!VALID_BLOCK_STYLES.has(parsed.blockStyle)) {
          parsed.blockStyle = BLOCK_STYLE_REMAP[parsed.blockStyle] ?? "elevated";
        }
      } else {
        parsed.blockStyle = "elevated";
      }

      // Sanitise background — if AI returns a raw hex, wrap it so the app can store it consistently
      if (typeof parsed.background === "string" && parsed.background.startsWith("#")) {
        // Keep as-is; backgroundToCss now handles raw hex. Wrap into bgValue JSON for consistency.
        parsed.background = JSON.stringify({ bgValue: parsed.background, blockStyle: parsed.blockStyle });
      } else if (!parsed.background) {
        parsed.background = "bg-warm-white";
      }

      // Server-side block sanitisation: dedup link blocks by URL hostname
      if (Array.isArray(parsed.blocks)) {
        // 1. Remove duplicate link blocks pointing to the same hostname
        const seenLinkDomains = new Set<string>();
        // 2. Enforce max 1 text block, max 1 lead-form
        const seenSingletons = new Set<string>();
        const SINGLETON_TYPES_IMPORT = new Set(["text", "lead-form"]);
        parsed.blocks = (parsed.blocks as any[]).filter((b: any) => {
          if (b.type === "link" && b.url) {
            try {
              const domain = new URL(b.url).hostname.replace(/^www\./, "");
              if (seenLinkDomains.has(domain)) return false;
              seenLinkDomains.add(domain);
            } catch { /* keep block if URL is unparseable */ }
          }
          if (SINGLETON_TYPES_IMPORT.has(b.type)) {
            if (seenSingletons.has(b.type)) return false;
            seenSingletons.add(b.type);
          }
          return true;
        });
      }

      return res.json(parsed);
    } catch (e: any) {
      console.error("AI import-url error:", e.message);
      return res.status(500).json({ error: "AI generation failed. Please try again." });
    }
  });
}

// ─────────────────────────────────────────────────
//  Background: generate SEO fields for a page
// ─────────────────────────────────────────────────
async function generateSeoForPage(page: Record<string, unknown>): Promise<void> {
  if (!process.env.OPENAI_API_KEY) return;
  const pageId = page.id as number;
  if (!pageId) return;

  // Build a textual summary of the page for the AI
  const name     = (page.title as string) || (page.ownerName as string) || "";
  const bio      = (page.bio as string) || "";
  const username = (page.username as string) || "";
  const location = (page.location as string) || "";

  // Parse blocks for extra context
  let blocksText = "";
  try {
    const blocks = typeof page.blocks === "string" ? JSON.parse(page.blocks as string) : (page.blocks || []);
    blocksText = (blocks as Array<Record<string, unknown>>)
      .map((b) => {
        if (b.type === "link")      return `Link: ${b.title} → ${b.url}`;
        if (b.type === "text")      return `Text: ${b.content}`;
        if (b.type === "lead-form") return `Lead form: ${b.title}`;
        return "";
      })
      .filter(Boolean)
      .join("; ")
      .slice(0, 600);
  } catch { /* ignore */ }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `Generate SEO metadata for a Linkbay profile page.

Profile:
- Name / Title: ${name}
- Username (URL slug): ${username}
- Bio: ${bio}
- Location: ${location}
- Blocks: ${blocksText}

Return ONLY valid JSON:
{
  "seoTitle": "50-60 char title including name + key skill/service",
  "seoDescription": "150-160 char description with clear value prop + CTA",
  "seoKeywords": "comma-separated 5-10 relevant keywords",
  "jsonLd": { /* schema.org Person or ProfilePage object */ }
}

For jsonLd use @type ProfilePage or Person with: @context, @type, name, url, description, and jobTitle if inferable.
Profile URL is https://linkbay.ai/${username}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const seo = JSON.parse(raw) as {
      seoTitle?: string;
      seoDescription?: string;
      seoKeywords?: string;
      jsonLd?: Record<string, unknown>;
    };

    const updatePayload: Record<string, unknown> = {};
    if (seo.seoTitle)       updatePayload.seoTitle       = seo.seoTitle.slice(0, 70);
    if (seo.seoDescription) updatePayload.seoDescription = seo.seoDescription.slice(0, 200);
    if (seo.seoKeywords)    updatePayload.seoKeywords    = seo.seoKeywords.slice(0, 300);
    if (seo.jsonLd)         updatePayload.jsonLd         = JSON.stringify(seo.jsonLd);

    if (Object.keys(updatePayload).length > 0) {
      await storage.updatePage(pageId, updatePayload as any);
    }
  } catch {
    // Non-critical — silently ignore SEO generation errors
  }
}

