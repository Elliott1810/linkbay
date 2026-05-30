import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Database from "better-sqlite3";

const DB_PATH = process.env.DB_PATH || "data.db";
import {
  insertWaitlistSchema, insertDemoRequestSchema,
  insertPageSchema, insertPageLinkSchema,
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
  app.get("/api/pages/public/:username", async (req, res) => {
    try {
      const page = await storage.getPageByUsername(req.params.username);
      if (!page) return res.status(404).json({ error: "Page not found" });
      // Preview mode: allow unpublished pages to be viewed but skip analytics tracking entirely
      const isPreview = req.query.preview === "1";
      if (!page.published && !isPreview) return res.status(404).json({ error: "Page not found" });
      // Generate hashed visitor ID from IP for unique visitor tracking
      const rawIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "";
      const visitorId = crypto.createHash("sha256").update(rawIp).digest("hex").slice(0, 16);
      // Determine country: prefer Cloudflare header; otherwise leave null (will be back-filled async via ipapi.co)
      const cfCountry = ((req.headers["cf-ipcountry"] as string) || "").toUpperCase() || null;
      // Track view event (skipped in preview)
      if (!isPreview) {
        await storage.incrementViewCount(page.id);
        await storage.recordEvent({ pageId: page.id, type: "view", referrer: req.headers.referer || null, device: req.headers["user-agent"]?.includes("Mobile") ? "mobile" : "desktop", visitorId, country: cfCountry } as any);
      }
      // Best-effort async country lookup if no CF header and the IP looks publicly routable.
      if (!isPreview && !cfCountry && rawIp && rawIp !== "127.0.0.1" && !rawIp.startsWith("192.168") && !rawIp.startsWith("10.") && !rawIp.startsWith("::1")) {
        try {
          // Fire-and-forget; do not block the response.
          fetch(`https://ipapi.co/${rawIp}/country/`)
            .then(r => r.text())
            .then(c => {
              const code = (c || "").trim().toUpperCase();
              if (code && code.length === 2 && /^[A-Z]{2}$/.test(code)) {
                try {
                  const db2 = new Database(DB_PATH);
                  db2.prepare(
                    "UPDATE page_events SET country = ? WHERE page_id = ? AND visitor_id = ? AND country IS NULL"
                  ).run(code, page.id, visitorId);
                  db2.close();
                } catch {}
              }
            })
            .catch(() => {});
        } catch {}
      }
      const links = await storage.getLinksByPage(page.id);
      // Get owner avatar (public — only avatarUrl, no PII)
      const owner = await storage.getUserByEmail(page.ownerEmail);
      // Strip private owner email before sending to public (ownerName is intentionally public for display)
      const { ownerEmail: _redacted, ...publicPage } = page as any;
      res.json({ page: { ...publicPage, avatarUrl: owner?.avatarUrl ?? null }, links });
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

  // POST track a link click (public) — also records a `link_click` page event for analytics (Goal 15)
  app.post("/api/links/:linkId/click", async (req, res) => {
    try {
      const linkId = parseInt(req.params.linkId);
      await storage.incrementLinkClick(linkId);
      // Record analytics event
      try {
        const link = await storage.getLinkById(linkId);
        if (link) {
          const ua = String(req.headers["user-agent"] || "");
          const device = /Mobile|Android|iPhone/i.test(ua) ? "mobile" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop";
          await storage.recordEvent({ pageId: link.pageId, type: "link_click", linkId, device } as any);
        }
      } catch {}
      res.json({ success: true });
    } catch { res.json({ success: false }); }
  });

  // POST track a generic block interaction (button / social link) (Goal 15)
  app.post("/api/pages/:pageId/track-click", async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      const ua = String(req.headers["user-agent"] || "");
      const device = /Mobile|Android|iPhone/i.test(ua) ? "mobile" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop";
      await storage.recordEvent({ pageId, type: "link_click", device } as any);
      res.json({ success: true });
    } catch { res.json({ success: false }); }
  });

  // POST track a block interaction (poll vote, FAQ expand, video play, countdown view, etc.)
  app.post("/api/pages/:pageId/track-block", async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      const { blockId, blockType, eventType } = req.body as { blockId?: string; blockType?: string; eventType?: string };
      const ua = String(req.headers["user-agent"] || "");
      const device = /Mobile|Android|iPhone/i.test(ua) ? "mobile" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop";
      await storage.recordEvent({
        pageId,
        type: eventType || "block_interact",
        device,
        blockId: blockId || null,
        blockType: blockType || null,
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
      // Get all block-level events grouped by blockId + blockType + type
      const blockEvents = sqliteLocal.prepare(`
        SELECT block_id, block_type, type, COUNT(*) as count
        FROM page_events
        WHERE page_id = ? AND block_id IS NOT NULL AND created_at >= ?
        GROUP BY block_id, block_type, type
        ORDER BY count DESC
      `).all(pageId, since) as Array<{ block_id: string; block_type: string; type: string; count: number }>;

      // Also get all-time block events (no date filter) for historical data
      const allTimeBlockEvents = sqliteLocal.prepare(`
        SELECT block_id, block_type, type, COUNT(*) as count
        FROM page_events
        WHERE page_id = ? AND block_id IS NOT NULL
        GROUP BY block_id, block_type, type
        ORDER BY count DESC
      `).all(pageId) as Array<{ block_id: string; block_type: string; type: string; count: number }>;

      // Aggregate by blockId across event types
      const blockMap = new Map<string, { blockId: string; blockType: string; totalInteractions: number; byEventType: Record<string, number> }>();
      for (const e of allTimeBlockEvents) {
        const key = e.block_id;
        if (!blockMap.has(key)) blockMap.set(key, { blockId: e.block_id, blockType: e.block_type, totalInteractions: 0, byEventType: {} });
        const b = blockMap.get(key)!;
        b.totalInteractions += e.count;
        b.byEventType[e.type] = (b.byEventType[e.type] || 0) + e.count;
      }

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
        title: z.string().min(1).max(100).optional(),
        bio: z.string().max(300).optional(),
        location: z.string().max(80).optional(),
        accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        theme: z.string().max(40).optional(),
        background: z.string().max(400).optional(),
        avatarShape: z.enum(["circle", "rounded"]).optional(),
        textColor: z.enum(["auto", "light", "dark"]).optional(),
        blocks: z.string().optional(),
        phone: z.string().max(40).optional(),
        contactEmail: z.string().max(200).optional(),
        pageFont: z.string().max(60).optional(),
        archivedBlockIds: z.string().optional(),
      });
      const data = allowedFields.parse(req.body);
      const page = await storage.updatePage(pageId, data);
      res.json({ success: true, page });
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
  //  LINKS — CRUD (auth + ownership)
  // ─────────────────────────────────────────────────

  app.get("/api/pages/:pageId/links", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      if (!await assertOwnsPage(req, res, pageId)) return;
      const links = await storage.getLinksByPage(pageId);
      res.json(links);
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  app.post("/api/pages/:pageId/links", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      if (!await assertOwnsPage(req, res, pageId)) return;
      const data = insertPageLinkSchema.parse({ ...req.body, pageId });
      const link = await storage.createLink(data);
      res.json({ success: true, link });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: err.errors });
      res.status(500).json({ error: "Server error" });
    }
  });

  app.patch("/api/links/:id", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getLinkById(id);
      if (!existing) return res.status(404).json({ error: "Link not found" });
      if (!await assertOwnsPage(req, res, existing.pageId)) return;
      // Allowlist fields — prevent mass assignment (e.g. pageId overwrite)
      const allowed = z.object({
        label: z.string().min(1).max(100).optional(),
        url: z.string().url().optional(),
        icon: z.string().max(50).optional(),
        featured: z.boolean().optional(),
        style: z.enum(["default", "featured", "outline"]).optional(),
        sortOrder: z.number().int().optional(),
      });
      let updateData: Record<string, unknown>;
      try {
        updateData = allowed.parse(req.body);
      } catch {
        return res.status(400).json({ error: "Invalid link data" });
      }
      // Validate URL scheme if provided (block javascript: XSS)
      if (updateData.url && !/^(https?:\/\/|mailto:|tel:)/i.test(updateData.url as string)) {
        return res.status(400).json({ error: "URL must start with http://, https://, mailto:, or tel:" });
      }
      const link = await storage.updateLink(id, updateData);
      res.json({ success: true, link });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  app.delete("/api/links/:id", requireAuth as any, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getLinkById(id);
      if (!existing) return res.status(404).json({ error: "Link not found" });
      if (!await assertOwnsPage(req, res, existing.pageId)) return;
      await storage.deleteLink(id);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  app.post("/api/pages/:pageId/links/reorder", requireAuth as any, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      if (!await assertOwnsPage(req, res, pageId)) return;
      const { orderedIds } = req.body;
      await storage.reorderLinks(pageId, orderedIds);
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
      const [page, events, links, dailyViews] = await Promise.all([
        storage.getPageById(pageId),
        storage.getEventsByPage(pageId, days),
        storage.getLinksByPage(pageId),
        storage.getDailyViews(pageId, days),
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

      res.json({
        totalViews: views,
        totalClicks: clicks,
        allTimeViews: (page?.viewCount || 0),
        periodViews: views,
        periodClicks: clicks,
        periodLeads: formLeads,
        clickRate: views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0,
        uniqueVisitors,
        repeatVisitors,
        devices,
        topLinks: links.sort((a, b) => b.clickCount - a.clickCount).slice(0, 5),
        topCountries,
        dailyViews,
        dailyClicks,
        dailyLeads,
        bestDay,
        // Top interactions: merge link clicks (by linkId→block) with block-level events
        topInteractions: (() => {
          const interMap = new Map<string, { id: string; label: string; type: string; count: number; isLink: boolean; linkId?: number }>();
          // Link clicks
          for (const link of links) {
            if (link.clickCount > 0) {
              interMap.set(`link-${link.id}`, { id: `link-${link.id}`, label: link.label || link.url, type: "link", count: link.clickCount, isLink: true, linkId: link.id });
            }
          }
          // Block events (poll votes, FAQ expands, video plays, etc.)
          const blockEventMap = new Map<string, { label: string; type: string; count: number }>();
          for (const e of events) {
            const bid = (e as any).blockId ?? (e as any).block_id;
            const btype = (e as any).blockType ?? (e as any).block_type;
            if (!bid) continue;
            const key = `block-${bid}`;
            if (!blockEventMap.has(key)) blockEventMap.set(key, { label: btype || "block", type: btype || "block", count: 0 });
            blockEventMap.get(key)!.count++;
          }
          blockEventMap.forEach((v, k) => {
            interMap.set(k, { id: k, label: v.label, type: v.type, count: v.count, isLink: false });
          });
          return Array.from(interMap.values()).sort((a, b) => b.count - a.count).slice(0, 8);
        })(),
        events: events.slice(-200),
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

      // Create page
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
        blocks: blocksJson,
        phone: phone || "",
        contactEmail: contactEmail || "",
        published: true,
      });

      // Create starter links — validate URLs (allow http/https/mailto, block javascript:)
      const defaultLinks = rawLinks && rawLinks.length > 0 ? rawLinks : [
        { label: "Contact me", url: "https://" + username + ".linkbay.ai", icon: "✉️", style: "featured", position: 0 },
      ];
      const safeUrlRegex = /^(https?:\/\/|mailto:)/i;
      for (const lnk of defaultLinks) {
        if (lnk.url && !safeUrlRegex.test(lnk.url)) continue; // skip unsafe URLs silently
        await storage.createLink({ pageId: page.id, ...lnk });
      }

      const links = await storage.getLinksByPage(page.id);

      // Establish session — user is now logged in
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userName = user.name;

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => err ? reject(err) : resolve());
      });

      res.json({ success: true, page, links, pageUrl: `/${page.username}`, user: { id: user.id, email: user.email, name: user.name } });
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
      res.json({ votes });
    } catch { res.status(500).json({ error: "Server error" }); }
  });

  // Cast a vote (signed-in users only)
  app.post("/api/pages/:pageId/polls/:pollId/vote", requireAuth as any, async (req, res) => {
    try {
      const { pageId, pollId } = req.params;
      const { optionIndex } = req.body;
      if (typeof optionIndex !== "number" || optionIndex < 0) {
        return res.status(400).json({ error: "Invalid option" });
      }
      // Check page exists
      const page = await storage.getPageById(parseInt(pageId));
      if (!page) return res.status(404).json({ error: "Page not found" });

      await storage.castVote({
        pageId: parseInt(pageId),
        pollId,
        voterEmail: req.session.userEmail!,
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

      const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
      fs.mkdirSync(uploadsDir, { recursive: true });

      // Delete old avatar if exists
      const currentUser = await storage.getUserById(req.session.userId!);
      if (currentUser?.avatarUrl) {
        const oldPath = path.join(process.cwd(), currentUser.avatarUrl.replace(/^\//, ""));
        try { fs.unlinkSync(oldPath); } catch {}
      }

      // Compress and save new avatar as WebP, 400x400 max
      const filename = `avatar-${req.session.userId}-${Date.now()}.webp`;
      const filepath = path.join(uploadsDir, filename);
      await sharp(req.file.buffer)
        .resize(400, 400, { fit: "cover", position: "centre" })
        .webp({ quality: 80 })
        .toFile(filepath);

      const avatarUrl = `/uploads/avatars/${filename}`;
      const user = await storage.updateUserAvatar(req.session.userId!, avatarUrl);
      req.session.save(() => {});
      res.json({ success: true, avatarUrl, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
    } catch (err) {
      console.error("Avatar upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  app.delete("/api/account/avatar", requireAuth as any, async (req, res) => {
    try {
      const currentUser = await storage.getUserById(req.session.userId!);
      if (currentUser?.avatarUrl) {
        const oldPath = path.join(process.cwd(), currentUser.avatarUrl.replace(/^\//, ""));
        try { fs.unlinkSync(oldPath); } catch {}
      }
      await storage.updateUserAvatar(req.session.userId!, null);
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
      sqlite2.prepare("DELETE FROM page_links WHERE page_id = ?").run(id);
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
        (SELECT COUNT(*) FROM page_links WHERE page_id = p.id) as link_count,
        (SELECT COUNT(*) FROM leads WHERE page_id = p.id) as lead_count,
        (SELECT SUM(click_count) FROM page_links WHERE page_id = p.id) as total_clicks
      FROM pages p
      WHERE p.owner_email NOT IN ('sarah@example.com','alex@example.com','mark@example.com','amara@example.com','studio@example.com','kai@example.com','lena@example.com','jordan@example.com','priya@example.com')
      ORDER BY p.created_at DESC
    `).all() as any[];

    const totalEvents = (sqlite.prepare("SELECT COUNT(*) as c FROM page_events").get() as any).c;
    const totalLeads = (sqlite.prepare("SELECT COUNT(*) as c FROM leads").get() as any).c;
    const totalClicks = (sqlite.prepare("SELECT SUM(click_count) as c FROM page_links").get() as any).c || 0;
    const totalViews = (sqlite.prepare("SELECT SUM(view_count) as c FROM pages WHERE published = 1").get() as any).c || 0;

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
    const avgLinksRow = sqlite.prepare(`
      SELECT AVG(c) as avg FROM (SELECT COUNT(*) as c FROM page_links GROUP BY page_id)
    `).get() as any;
    const avgLinks = avgLinksRow?.avg ? Number(avgLinksRow.avg).toFixed(1) : "0.0";
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
  @media(max-width:600px){.stats{grid-template-columns:1fr 1fr}.wrap{padding:1rem}}
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

  <div class="stats">
    <div class="stat"><div class="val">${fmt(users.length)}</div><div class="lbl">Total users</div></div>
    <div class="stat"><div class="val">${fmt(pages.length)}</div><div class="lbl">Real pages</div></div>
    <div class="stat"><div class="val">${fmt(totalViews)}</div><div class="lbl">Total views</div></div>
    <div class="stat"><div class="val">${fmt(totalClicks)}</div><div class="lbl">Total clicks</div></div>
    <div class="stat"><div class="val">${fmt(totalLeads)}</div><div class="lbl">Total leads</div></div>
    <div class="stat"><div class="val">${fmt(totalContacts)}</div><div class="lbl">Total contacts</div></div>
    <div class="stat"><div class="val">${fmt(totalEvents)}</div><div class="lbl">Total events</div></div>
  </div>

  <div class="section">
    <h2>Event breakdown</h2>
    <div style="display:flex;gap:1.5rem;flex-wrap:wrap;font-size:13px">
      <div><strong style="color:#e06b1a">Views:</strong> ${fmt(viewEvents)}</div>
      <div><strong style="color:#e06b1a">Link Clicks:</strong> ${fmt(linkClickEvents)}</div>
      <div><strong style="color:#e06b1a">Lead Submits:</strong> ${fmt(leadSubmitEvents)}</div>
      <div><strong style="color:#e06b1a">Total Contacts (all users):</strong> ${fmt(totalContacts)}</div>
    </div>
  </div>

  <div class="section">
    <h2>Platform Stats</h2>
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
  </div>

  <div class="section">
    <h2>Users (${users.length})</h2>
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
              <form method="POST" action="/admin/reset-password" style="display:inline" onsubmit="return confirm('Reset password for ${escHtml(u.email)}?')"><input type="hidden" name="email" value="${escHtml(u.email)}"><button type="submit" style="background:#fef3c7;border:1px solid #fde68a;color:#92400e;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;margin-right:4px">Reset PW</button></form>
              <form method="POST" action="/admin/signout-user" style="display:inline" onsubmit="return confirm('Sign out ${escHtml(u.email)}?')"><input type="hidden" name="email" value="${escHtml(u.email)}"><button type="submit" style="background:#fde68a;border:1px solid #fbbf24;color:#92400e;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;margin-right:4px">Sign Out</button></form>
              <form method="POST" action="/admin/delete-user?id=${u.id}" onsubmit="return confirm('Delete user and all their pages?')" style="display:inline"><button class="delbtn" type="submit">Delete</button></form>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Pages (${pages.length} real, excl. demo profiles)</h2>
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
  </div>

  <div class="section">
    <h2>Recent leads (last 20)</h2>
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
  </div>

  <div class="section">
    <h2>Recent connections (last 30 days — top 20)</h2>
    <div class="search-bar"><label>🔍</label><input type="text" placeholder="Search connections by visitor ID, country, device…" oninput="filterTable(this,'tbody-connections')" /><span class="count" id="tbody-connections-count"></span></div>
    <table>
      <thead><tr><th>Visitor ID</th><th>Country</th><th>Device</th><th>When</th></tr></thead>
      <tbody id="tbody-connections">
        ${recentConnEvents.map(e => `
          <tr>
            <td><code style="font-family:ui-monospace,monospace;font-size:11px">${escHtml((e.visitor_id||"").slice(0,16))}…</code></td>
            <td class="ts">${escHtml(e.country || "Unknown")}</td>
            <td class="ts">${escHtml(e.device || "—")}</td>
            <td class="ts">${ago(e.created_at)}</td>
          </tr>`).join("") || '<tr><td colspan="4" class="ts" style="text-align:center;padding:1rem">No connections in last 30 days</td></tr>'}
      </tbody>
    </table>
  </div>

</div>
</body></html>`);
  });

}

function escHtml(str: string) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

