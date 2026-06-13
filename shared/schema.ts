import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users (auth) ──────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  lastSignIn: text("last_sign_in"),
  onboardingDismissed: integer("onboarding_dismissed").default(0),
  onboardingSharedLink: integer("onboarding_shared_link").default(0),
  forceLogout: integer("force_logout").default(0),
  createdAt: text("created_at").notNull().default(""),
});
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, passwordHash: true }).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Waitlist ───────────────────────────────────────────────
export const waitlist = sqliteTable("waitlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  useCase: text("use_case"),
  source: text("source"),
  createdAt: text("created_at").notNull().default(""),
});
export const insertWaitlistSchema = createInsertSchema(waitlist).omit({ id: true, createdAt: true });
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlist.$inferSelect;

// ─── Demo requests ──────────────────────────────────────────
export const demoRequests = sqliteTable("demo_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  message: text("message"),
  createdAt: text("created_at").notNull().default(""),
});
export const insertDemoRequestSchema = createInsertSchema(demoRequests).omit({ id: true, createdAt: true });
export type InsertDemoRequest = z.infer<typeof insertDemoRequestSchema>;
export type DemoRequest = typeof demoRequests.$inferSelect;

// ─── User pages (the functional mini-site builder) ──────────
export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),       // URL slug — linkbay.ai/username
  ownerEmail: text("owner_email").notNull(),
  ownerName: text("owner_name").notNull(),
  title: text("title").notNull(),                       // Page headline
  bio: text("bio"),                                     // Short bio
  location: text("location"),
  phone: text("phone"),                                 // Optional contact phone
  contactEmail: text("contact_email"),                  // Optional public contact email
  accentColor: text("accent_color").notNull().default("#e06b1a"),
  theme: text("theme").notNull().default("default"),    // "default" | "midnight" | "ocean" | "forest"
  background: text("background").notNull().default("none"),
  avatarShape: text("avatar_shape").notNull().default("circle"),  // "circle" | "rounded"
  textColor: text("text_color").default("auto"),        // "auto" | "light" | "dark"
  pageFont: text("page_font").default("inter"),          // font key
  archivedBlockIds: text("archived_block_ids").default("[]"), // JSON array of archived block ids
  hiddenBlockIds: text("hidden_block_ids").default("[]"),    // G6b: JSON array of permanently hidden block ids
  headerImageUrl: text("header_image_url"),                   // Optional hero card background image (base64 or URL)
  blocks: text("blocks").notNull().default("[]"),       // JSON array of block objects
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});
export const insertPageSchema = createInsertSchema(pages).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pages.$inferSelect;

// ─── Page links (link cards on a page) ─────────────────────
export const pageLinks = sqliteTable("page_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pageId: integer("page_id").notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  icon: text("icon").notNull().default("🔗"),
  style: text("style").notNull().default("default"),  // "default" | "featured" | "outline"
  position: integer("position").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
});
export const insertPageLinkSchema = createInsertSchema(pageLinks).omit({ id: true, createdAt: true, clickCount: true }).extend({
  url: z.string().min(1).refine(
    v => /^(https?:\/\/|mailto:|tel:)/i.test(v),
    { message: "URL must start with http://, https://, mailto:, or tel:" }
  ),
});
export type InsertPageLink = z.infer<typeof insertPageLinkSchema>;
export type PageLink = typeof pageLinks.$inferSelect;

// ─── Leads from page contact forms ─────────────────────────
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pageId: integer("page_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message"),
  source: text("source"),                              // Which block triggered this
  status: text("status").notNull().default("new"),     // "new" | "contacted" | "qualified" | "proposal" | "won" | "lost" | "archived"
  notes: text("notes"),                               // Internal owner notes
  customFields: text("custom_fields"),                 // JSON object of custom field values
  deviceType: text("device_type"),                    // "mobile" | "tablet" | "desktop"
  isLinkbayUser: integer("is_linkbay_user", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(""),
});
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, status: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// ─── Page analytics events ──────────────────────────────────

// ─── Poll votes ─────────────────────────────────────────────────────────────
export const pollVotes = sqliteTable("poll_votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pageId: integer("page_id").notNull(),
  pollId: text("poll_id").notNull(),                   // block.id from blocks JSON
  voterEmail: text("voter_email").notNull(),
  optionIndex: integer("option_index").notNull(),
  createdAt: text("created_at").notNull().default(""),
});
export type PollVote = typeof pollVotes.$inferSelect;

export const pageEvents = sqliteTable("page_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pageId: integer("page_id").notNull(),
  type: text("type").notNull(),     // "view" | "link_click" | "lead_submit" | "block_interact" | "poll_vote" | "faq_expand" | "video_play"
  linkId: integer("link_id"),
  referrer: text("referrer"),
  device: text("device"),
  visitorId: text("visitor_id"),   // Hashed IP for unique visitor tracking
  country: text("country"),         // ISO country code (e.g. 'US', 'GB')
  blockId: text("block_id"),        // block.id (string) for block-level tracking
  blockType: text("block_type"),    // block.type for block-level tracking
  createdAt: text("created_at").notNull().default(""),
});
export const insertPageEventSchema = createInsertSchema(pageEvents).omit({ id: true, createdAt: true });
export type InsertPageEvent = z.infer<typeof insertPageEventSchema>;
export type PageEvent = typeof pageEvents.$inferSelect;

// ─── Contacts (CRM) ─────────────────────────────────────────
export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerEmail: text("owner_email").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  address: text("address"),
  website: text("website"),
  notes: text("notes"),
  tags: text("tags"),                            // JSON array
  sourceLeadId: integer("source_lead_id"),
  source: text("source").default("Manual"),
  followUpDate: text("follow_up_date"),
  followUpNote: text("follow_up_note"),
  followUpDone: integer("follow_up_done").default(0),
  overdueNotifiedAt: text("overdue_notified_at"),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export const contactActivities = sqliteTable("contact_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contact_id").notNull(),
  type: text("type").notNull(),                   // "note" | "email" | "call" | "meeting" | "converted"
  body: text("body"),
  createdAt: text("created_at").notNull().default(""),
});
export const insertContactActivitySchema = createInsertSchema(contactActivities).omit({ id: true, createdAt: true });
export type InsertContactActivity = z.infer<typeof insertContactActivitySchema>;
export type ContactActivity = typeof contactActivities.$inferSelect;
