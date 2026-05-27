import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../shared/schema";
import { eq, desc, and } from "drizzle-orm";
import type {
  InsertWaitlist, Waitlist,
  InsertDemoRequest, DemoRequest,
  InsertPage, Page,
  InsertPageLink, PageLink,
  InsertLead, Lead,
  InsertPageEvent, PageEvent,
  PollVote,
  User,
  InsertContact, Contact,
  InsertContactActivity, ContactActivity,
} from "../shared/schema";

const DB_PATH = process.env.DB_PATH || "data.db";
const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite, { schema });

// ─── Bootstrap tables ───────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    use_case TEXT,
    source TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS demo_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    owner_email TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    title TEXT NOT NULL,
    bio TEXT,
    location TEXT,
    accent_color TEXT NOT NULL DEFAULT '#e06b1a',
    theme TEXT NOT NULL DEFAULT 'default',
    blocks TEXT NOT NULL DEFAULT '[]',
    published INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS page_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT '🔗',
    style TEXT NOT NULL DEFAULT 'default',
    position INTEGER NOT NULL DEFAULT 0,
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS page_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    link_id INTEGER,
    referrer TEXT,
    device TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL,
    poll_id TEXT NOT NULL,
    voter_email TEXT NOT NULL,
    option_index INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(poll_id, voter_email)
  );
`);

// Run column migrations (ADD COLUMN is idempotent on SQLite failure — catch and continue)
try { sqlite.exec("ALTER TABLE pages ADD COLUMN phone TEXT"); } catch {}
try { sqlite.exec("ALTER TABLE pages ADD COLUMN contact_email TEXT"); } catch {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT"); } catch {}
try { sqlite.exec("ALTER TABLE pages ADD COLUMN background TEXT NOT NULL DEFAULT 'none'"); } catch {}
try { sqlite.exec("ALTER TABLE leads ADD COLUMN notes TEXT"); } catch {}
try { sqlite.exec("ALTER TABLE page_events ADD COLUMN visitor_id TEXT"); } catch {}
try { sqlite.exec("ALTER TABLE leads ADD COLUMN custom_fields TEXT"); } catch {}
try { sqlite.exec("ALTER TABLE leads ADD COLUMN device_type TEXT"); } catch {}
try { sqlite.exec("ALTER TABLE leads ADD COLUMN is_linkbay_user INTEGER DEFAULT 0"); } catch {}
try { sqlite.exec("ALTER TABLE pages ADD COLUMN avatar_shape TEXT NOT NULL DEFAULT 'circle'"); } catch {}
try { sqlite.exec("ALTER TABLE page_events ADD COLUMN country TEXT"); } catch {}
try { sqlite.exec("ALTER TABLE contacts ADD COLUMN source TEXT DEFAULT 'Manual'"); } catch {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN last_sign_in TEXT"); } catch {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN onboarding_dismissed INTEGER DEFAULT 0"); } catch {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN onboarding_shared_link INTEGER DEFAULT 0"); } catch {}
try { sqlite.exec("ALTER TABLE pages ADD COLUMN text_color TEXT DEFAULT 'auto'"); } catch {}
try { sqlite.exec("ALTER TABLE contacts ADD COLUMN follow_up_date TEXT"); } catch {}
try { sqlite.exec("ALTER TABLE contacts ADD COLUMN follow_up_note TEXT"); } catch {}
try { sqlite.exec("ALTER TABLE contacts ADD COLUMN follow_up_done INTEGER DEFAULT 0"); } catch {}

// Contacts table (idempotent)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_email TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    address TEXT,
    website TEXT,
    notes TEXT,
    tags TEXT,
    source_lead_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS contact_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    body TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─── Seed all demo/template pages ──────────────────────────
const demoProfiles = [
  { username: "sarah-jones-consultant", name: "Sarah Jones", email: "sarah@example.com", title: "Business Strategy Consultant", bio: "I help scaling startups and SMEs build operational systems that let them grow without the chaos. 12 years consulting. 300+ clients.", location: "London, UK", accent: "#e06b1a", links: [["📅","Book a free 30-min strategy call","#booking","Let's identify your biggest bottleneck.","featured",0],["📄","Download the Scaling Playbook (free)","#download","40 pages of frameworks I use with clients.","default",1],["💼","View my consulting services","#services","Strategic ops, team design, revenue systems.","default",2],["📊","Case study: 3× revenue in 8 months","#case-study","How a FinTech scaled their ops team.","default",3]] },
  { username: "alex-creator", name: "Alex Rivera", email: "alex@example.com", title: "Content Creator & Educator", bio: "Helping 50k+ followers learn video production, grow their channels, and turn creativity into a career. New videos every week.", location: "Los Angeles, CA", accent: "#7c3aed", links: [["🎥","Watch my latest YouTube video","#youtube","New tutorials every Tuesday.","featured",0],["📧","Join my free newsletter","#newsletter","Weekly tips on content & growth.","default",1],["🛒","Shop my presets & templates","#shop","Professional editing tools.","default",2],["🎓","Enrol in my video course","#course","Go from beginner to pro.","default",3]] },
  { username: "mark-recruiter", name: "Mark Thompson", email: "mark@example.com", title: "Senior Tech Recruiter", bio: "Connecting exceptional engineers and product leaders with high-growth companies. 8 years recruiting in fintech and SaaS.", location: "Manchester, UK", accent: "#0891b2", links: [["💬","Send me a message","#contact","Tell me about your next move.","featured",0],["💼","View open roles I'm hiring for","#roles","Engineering, product & design.","default",1],["🔗","Connect on LinkedIn","#linkedin","Let's stay in touch.","default",2],["📄","Download my candidate guide","#guide","How to nail your next tech interview.","default",3]] },
  { username: "wellness-coach", name: "Amara Osei", email: "amara@example.com", title: "Wellness & Mindset Coach", bio: "Certified coach helping high-achievers reduce burnout and build sustainable habits. 1-to-1 sessions and group programmes.", location: "Birmingham, UK", accent: "#16a34a", links: [["📅","Book a free discovery call","#booking","Let's talk about your goals.","featured",0],["⬇️","Download: 5-Day Reset Guide","#download","Free wellness starter kit.","default",1],["🌐","Read my wellness blog","#blog","Tips on mindset, sleep & energy.","default",2],["⭐","Read client testimonials","#testimonials","Real results from real clients.","default",3]] },
  { username: "agency-studio", name: "Studio Eleven", email: "studio@example.com", title: "Creative & Brand Agency", bio: "We build brands that people remember. Strategy, identity, web, and content — all under one roof. Based in London.", location: "London, UK", accent: "#dc2626", links: [["💼","View our portfolio","#portfolio","Brand, web, and campaign work.","featured",0],["📅","Book a project consultation","#booking","Free 45-min strategy session.","default",1],["📊","Download our services deck","#deck","Pricing, process, and case studies.","default",2],["🤝","Partner with us","#partner","Agency-to-agency collaborations.","default",3]] },
  { username: "founder-launch", name: "Kai Okafor", email: "kai@example.com", title: "Founder & Startup Builder", bio: "Building tools for indie creators. Currently working on my third product. Previously exited two SaaS companies.", location: "Remote", accent: "#9333ea", links: [["🚀","Join the waitlist","#waitlist","Be first when we launch.","featured",0],["📄","Read the investor deck","#deck","Vision, traction, and team.","default",1],["🔗","Follow the build in public","#twitter","Weekly updates on X.","default",2],["💬","Talk to the founder","#contact","I reply to every message.","default",3]] },
  { username: "photographer", name: "Lena Müller", email: "lena@example.com", title: "Wedding & Portrait Photographer", bio: "Documenting real moments with warmth and honesty. Based in Edinburgh, available worldwide. Booking 2025–2026.", location: "Edinburgh, UK", accent: "#b45309", links: [["📅","Check my availability","#booking","Weddings, portraits, and events.","featured",0],["🌐","View my full portfolio","#portfolio","Gallery of recent work.","default",1],["📄","Download pricing guide","#pricing","Packages and what's included.","default",2],["📧","Send me an enquiry","#contact","Tell me about your day.","default",3]] },
  { username: "fitness-trainer", name: "Jordan Blake", email: "jordan@example.com", title: "Fitness & Nutrition Coach", bio: "Online PT helping busy people lose fat, build strength, and actually enjoy the process. No fad diets. No fluff.", location: "Bristol, UK", accent: "#ea580c", links: [["📅","Book a free intro call","#booking","Tell me your goals.","featured",0],["⬇️","Download my free 4-week plan","#download","Start training today.","default",1],["🎥","Watch my YouTube workouts","#youtube","Free training videos every week.","default",2],["⭐","Client results & testimonials","#results","Real transformations.","default",3]] },
  { username: "freelance-dev", name: "Priya Singh", email: "priya@example.com", title: "Freelance Full-Stack Developer", bio: "Building fast, accessible web products for startups and agencies. React, Node, TypeScript. Available for projects.", location: "Remote", accent: "#0e7490", links: [["💻","View my GitHub","#github","Open source projects and code.","featured",0],["💼","See my project portfolio","#portfolio","Case studies and demos.","default",1],["📅","Book a project scoping call","#booking","Let's see if we're a good fit.","default",2],["📧","Email me directly","#contact","Available for freelance work.","default",3]] },
];

// Ensure each demo profile exists (idempotent — skips if username already there)
const now0 = new Date().toISOString();
for (const p of demoProfiles) {
  const exists = sqlite.prepare("SELECT id FROM pages WHERE username = ?").get(p.username);
  if (!exists) {
    sqlite.prepare(`INSERT INTO pages (username, owner_email, owner_name, title, bio, location, accent_color, theme, blocks, published, view_count, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,0,?,?)`) 
      .run(p.username, p.email, p.name, p.title, p.bio, p.location, p.accent, "default", JSON.stringify([]), now0, now0);
    const row = sqlite.prepare("SELECT id FROM pages WHERE username = ?").get(p.username) as any;
    p.links.forEach(([icon, label, url, desc, style, pos]: any) => {
      sqlite.prepare(`INSERT INTO page_links (page_id, label, url, description, icon, style, position, click_count, created_at) VALUES (?,?,?,?,?,?,?,?,?)`) 
        .run(row.id, label, url, desc, icon, style, pos, 0, now0);
    });
  }
}

// ─── Legacy seed guard (kept for backward compat) ────────────
const pageCount = (sqlite.prepare("SELECT COUNT(*) as c FROM pages").get() as any).c;
if (pageCount === 0) {
  const now = new Date().toISOString();
  sqlite.prepare(`
    INSERT INTO pages (username, owner_email, owner_name, title, bio, location, accent_color, theme, blocks, published, view_count, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,1,12847,?,?)
  `).run(
    "sarah-jones-consultant",
    "sarah@example.com",
    "Sarah Jones",
    "Business Strategy Consultant",
    "I help scaling startups and SMEs build operational systems that let them grow without the chaos. 12 years consulting. 300+ clients.",
    "London, UK",
    "#e06b1a",
    "default",
    JSON.stringify([]),
    now, now
  );

  const page = sqlite.prepare("SELECT id FROM pages WHERE username = ?").get("sarah-jones-consultant") as any;
  const pid = page.id;
  const links = [
    ["📅", "Book a free 30-min strategy call", "#booking", "Let's identify your biggest bottleneck.", "featured", 0],
    ["📄", "Download the Scaling Playbook (free)", "#download", "40 pages of frameworks I use with clients.", "default", 1],
    ["💼", "View my consulting services", "#services", "Strategic ops, team design, revenue systems.", "default", 2],
    ["📊", "Case study: 3× revenue in 8 months", "#case-study", "How a FinTech scaled their ops team.", "default", 3],
  ];
  for (const [icon, label, url, desc, style, pos] of links) {
    sqlite.prepare(`INSERT INTO page_links (page_id, label, url, description, icon, style, position, click_count, created_at) VALUES (?,?,?,?,?,?,?,?,?)`).run(pid, label, url, desc, icon, style, pos, Math.floor(Math.random() * 500) + 50, now);
  }
  // Seed some leads
  const leadNames = [["James Mitchell", "james@acme.com"], ["Priya Mehta", "priya@studio.co"], ["Tom Okafor", "tom@dev.io"]];
  for (const [n, e] of leadNames) {
    sqlite.prepare(`INSERT INTO leads (page_id, name, email, source, status, created_at) VALUES (?,?,?,?,?,?)`).run(pid, n, e, "lead-form", "new", now);
  }
}

// ─── Storage interface ───────────────────────────────────────
export interface IStorage {
  // Auth
  createUser(email: string, name: string, passwordHash: string): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, data: Partial<{ name: string; passwordHash: string }>): Promise<User>;
  updateUserAvatar(userId: number, avatarUrl: string | null): Promise<User>;
  updateLastSignIn(email: string): Promise<void>;
  updateUserOnboarding(email: string, field: "shared_link" | "dismissed", value: number): Promise<void>;
  deleteUserCascade(userId: number, userEmail: string): Promise<void>;
  // Waitlist
  addWaitlist(data: InsertWaitlist): Promise<Waitlist>;
  getWaitlistCount(): Promise<number>;
  // Demo
  addDemoRequest(data: InsertDemoRequest): Promise<DemoRequest>;
  // Pages
  createPage(data: InsertPage): Promise<Page>;
  getPageByUsername(username: string): Promise<Page | undefined>;
  getPageById(id: number): Promise<Page | undefined>;
  updatePage(id: number, data: Partial<InsertPage>): Promise<Page>;
  deletePage(id: number): Promise<void>;
  incrementViewCount(id: number): Promise<void>;
  getPagesByOwner(email: string): Promise<Page[]>;
  // Links
  createLink(data: InsertPageLink): Promise<PageLink>;
  getLinksByPage(pageId: number): Promise<PageLink[]>;
  getLinkById(id: number): Promise<PageLink | undefined>;
  updateLink(id: number, data: Partial<InsertPageLink>): Promise<PageLink>;
  deleteLink(id: number): Promise<void>;
  incrementLinkClick(id: number): Promise<void>;
  reorderLinks(pageId: number, orderedIds: number[]): Promise<void>;
  // Leads
  createLead(data: InsertLead & { customFields?: string | null; deviceType?: string | null; isLinkbayUser?: boolean }): Promise<Lead>;
  getLeadById(id: number): Promise<Lead | undefined>;
  getLeadsByPage(pageId: number): Promise<Lead[]>;
  getLeadsByOwner(ownerEmail: string): Promise<Lead[]>;
  updateLeadStatus(id: number, status: string): Promise<Lead>;
  updateLeadNotes(id: number, notes: string): Promise<Lead>;
  deleteLead(id: number): Promise<void>;
  // Contacts
  createContact(data: InsertContact): Promise<Contact>;
  getContactsByOwner(ownerEmail: string): Promise<Contact[]>;
  getContactById(id: number): Promise<Contact | undefined>;
  updateContact(id: number, data: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;
  addContactActivity(data: InsertContactActivity): Promise<ContactActivity>;
  getContactActivities(contactId: number): Promise<ContactActivity[]>;
  updateContactActivity(id: number, body: string): Promise<ContactActivity>;
  deleteContactActivity(id: number): Promise<void>;
  getContactActivityById(id: number): Promise<ContactActivity | undefined>;
  convertLeadToContact(leadId: number, ownerEmail: string): Promise<Contact>;
  // Events
  recordEvent(data: InsertPageEvent): Promise<void>;
  getEventsByPage(pageId: number, days?: number): Promise<PageEvent[]>;
  getDailyViews(pageId: number, days?: number): Promise<Array<{ date: string; count: number }>>;
  // Dashboard
  getDashboardStats(userEmail: string, days?: number): Promise<{ totalViews: number; totalClicks: number; totalLeads: number; totalPages: number }>;
  // Poll votes
  getPollVotes(pageId: number, pollId: string): Promise<Array<{ optionIndex: number; count: number }>>;
  castVote(data: { pageId: number; pollId: string; voterEmail: string; optionIndex: number }): Promise<void>;
  hasVoted(pollId: string, voterEmail: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // ── Auth ──
  async createUser(email: string, name: string, passwordHash: string): Promise<User> {
    return db.insert(schema.users).values({ email, name, passwordHash, createdAt: new Date().toISOString() }).returning().get();
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  }
  async getUserById(id: number): Promise<User | undefined> {
    return db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  }
  async updateUser(id: number, data: Partial<{ name: string; passwordHash: string }>): Promise<User> {
    return db.update(schema.users).set(data).where(eq(schema.users.id, id)).returning().get();
  }
  async updateUserAvatar(userId: number, avatarUrl: string | null): Promise<User> {
    return db.update(schema.users).set({ avatarUrl }).where(eq(schema.users.id, userId)).returning().get();
  }
  async updateLastSignIn(email: string): Promise<void> {
    sqlite.prepare("UPDATE users SET last_sign_in = ? WHERE email = ?").run(new Date().toISOString(), email);
  }
  async updateUserOnboarding(email: string, field: "shared_link" | "dismissed", value: number): Promise<void> {
    const col = field === "shared_link" ? "onboarding_shared_link" : "onboarding_dismissed";
    sqlite.prepare(`UPDATE users SET ${col} = ? WHERE email = ?`).run(value, email);
  }
  async deleteUserCascade(userId: number, userEmail: string): Promise<void> {
    // Get all pages owned by this user
    const userPages = sqlite.prepare("SELECT id FROM pages WHERE owner_email = ?").all(userEmail) as Array<{ id: number }>;
    for (const p of userPages) {
      sqlite.prepare("DELETE FROM page_events WHERE page_id = ?").run(p.id);
      sqlite.prepare("DELETE FROM leads WHERE page_id = ?").run(p.id);
      sqlite.prepare("DELETE FROM page_links WHERE page_id = ?").run(p.id);
    }
    sqlite.prepare("DELETE FROM pages WHERE owner_email = ?").run(userEmail);
    sqlite.prepare("DELETE FROM users WHERE id = ?").run(userId);
  }

  // ── Waitlist ──
  async addWaitlist(data: InsertWaitlist): Promise<Waitlist> {
    return db.insert(schema.waitlist).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  }
  async getWaitlistCount(): Promise<number> {
    const res = sqlite.prepare("SELECT COUNT(*) as c FROM waitlist").get() as any;
    return res.c + 847; // base count for social proof
  }

  // ── Demo ──
  async addDemoRequest(data: InsertDemoRequest): Promise<DemoRequest> {
    return db.insert(schema.demoRequests).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  }

  // ── Pages ──
  async createPage(data: InsertPage): Promise<Page> {
    const now = new Date().toISOString();
    return db.insert(schema.pages).values({ ...data, createdAt: now, updatedAt: now }).returning().get();
  }
  async getPageByUsername(username: string): Promise<Page | undefined> {
    return db.select().from(schema.pages).where(eq(schema.pages.username, username)).get();
  }
  async getPageById(id: number): Promise<Page | undefined> {
    return db.select().from(schema.pages).where(eq(schema.pages.id, id)).get();
  }
  async updatePage(id: number, data: Partial<InsertPage>): Promise<Page> {
    return db.update(schema.pages).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.pages.id, id)).returning().get();
  }
  async deletePage(id: number): Promise<void> {
    sqlite.prepare("DELETE FROM pages WHERE id = ?").run(id);
  }
  async incrementViewCount(id: number): Promise<void> {
    sqlite.prepare("UPDATE pages SET view_count = view_count + 1 WHERE id = ?").run(id);
  }
  async getPagesByOwner(email: string): Promise<Page[]> {
    return db.select().from(schema.pages).where(eq(schema.pages.ownerEmail, email)).all();
  }

  // ── Links ──
  async createLink(data: InsertPageLink): Promise<PageLink> {
    return db.insert(schema.pageLinks).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  }
  async getLinksByPage(pageId: number): Promise<PageLink[]> {
    return db.select().from(schema.pageLinks).where(eq(schema.pageLinks.pageId, pageId)).all();
  }
  async getLinkById(id: number): Promise<PageLink | undefined> {
    return db.select().from(schema.pageLinks).where(eq(schema.pageLinks.id, id)).get();
  }
  async updateLink(id: number, data: Partial<InsertPageLink>): Promise<PageLink> {
    return db.update(schema.pageLinks).set(data).where(eq(schema.pageLinks.id, id)).returning().get();
  }
  async deleteLink(id: number): Promise<void> {
    sqlite.prepare("DELETE FROM page_links WHERE id = ?").run(id);
  }
  async incrementLinkClick(id: number): Promise<void> {
    sqlite.prepare("UPDATE page_links SET click_count = click_count + 1 WHERE id = ?").run(id);
  }
  async reorderLinks(pageId: number, orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      sqlite.prepare("UPDATE page_links SET position = ? WHERE id = ? AND page_id = ?").run(i, orderedIds[i], pageId);
    }
  }

  // ── Leads ──
  async createLead(data: InsertLead): Promise<Lead> {
    return db.insert(schema.leads).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  }
  async getLeadById(id: number): Promise<Lead | undefined> {
    return db.select().from(schema.leads).where(eq(schema.leads.id, id)).get();
  }
  async getLeadsByPage(pageId: number): Promise<Lead[]> {
    return db.select().from(schema.leads).where(eq(schema.leads.pageId, pageId)).all();
  }
  async updateLeadStatus(id: number, status: string): Promise<Lead> {
    return db.update(schema.leads).set({ status }).where(eq(schema.leads.id, id)).returning().get();
  }
  async updateLeadNotes(id: number, notes: string): Promise<Lead> {
    return db.update(schema.leads).set({ notes }).where(eq(schema.leads.id, id)).returning().get();
  }
  async deleteLead(id: number): Promise<void> {
    sqlite.prepare("DELETE FROM leads WHERE id = ?").run(id);
  }
  async getLeadsByOwner(ownerEmail: string): Promise<Lead[]> {
    const rows = sqlite.prepare(`
      SELECT l.* FROM leads l JOIN pages p ON p.id = l.page_id
      WHERE p.owner_email = ? ORDER BY l.created_at DESC
    `).all(ownerEmail) as any[];
    return rows.map((r: any) => ({
      id: r.id,
      pageId: r.page_id,
      name: r.name,
      email: r.email,
      message: r.message,
      source: r.source,
      status: r.status,
      notes: r.notes,
      customFields: r.custom_fields,
      deviceType: r.device_type,
      isLinkbayUser: !!r.is_linkbay_user,
      createdAt: r.created_at,
    }));
  }

  // ── Contacts ──
  async createContact(data: InsertContact): Promise<Contact> {
    const now = new Date().toISOString();
    return db.insert(schema.contacts).values({ ...data, createdAt: now, updatedAt: now }).returning().get();
  }
  async getContactsByOwner(ownerEmail: string): Promise<Contact[]> {
    return db.select().from(schema.contacts).where(eq(schema.contacts.ownerEmail, ownerEmail)).all();
  }
  async getContactById(id: number): Promise<Contact | undefined> {
    return db.select().from(schema.contacts).where(eq(schema.contacts.id, id)).get();
  }
  async updateContact(id: number, data: Partial<InsertContact>): Promise<Contact> {
    return db.update(schema.contacts).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.contacts.id, id)).returning().get();
  }
  async deleteContact(id: number): Promise<void> {
    sqlite.prepare("DELETE FROM contact_activities WHERE contact_id = ?").run(id);
    sqlite.prepare("DELETE FROM contacts WHERE id = ?").run(id);
  }
  async addContactActivity(data: InsertContactActivity): Promise<ContactActivity> {
    return db.insert(schema.contactActivities).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  }
  async getContactActivities(contactId: number): Promise<ContactActivity[]> {
    return db.select().from(schema.contactActivities).where(eq(schema.contactActivities.contactId, contactId)).orderBy(desc(schema.contactActivities.createdAt)).all();
  }
  async updateContactActivity(id: number, body: string): Promise<ContactActivity> {
    return db.update(schema.contactActivities).set({ body }).where(eq(schema.contactActivities.id, id)).returning().get();
  }
  async deleteContactActivity(id: number): Promise<void> {
    sqlite.prepare("DELETE FROM contact_activities WHERE id = ?").run(id);
  }
  async getContactActivityById(id: number): Promise<ContactActivity | undefined> {
    return db.select().from(schema.contactActivities).where(eq(schema.contactActivities.id, id)).get();
  }
  async convertLeadToContact(leadId: number, ownerEmail: string): Promise<Contact> {
    const lead = await this.getLeadById(leadId);
    if (!lead) throw new Error("Lead not found");
    const now = new Date().toISOString();
    const contact = db.insert(schema.contacts).values({
      ownerEmail,
      name: lead.name,
      email: lead.email,
      notes: lead.message ?? "",
      sourceLeadId: lead.id,
      source: "Lead",
      createdAt: now,
      updatedAt: now,
    }).returning().get();
    db.insert(schema.contactActivities).values({
      contactId: contact.id,
      type: "converted",
      body: "Converted from lead",
      createdAt: now,
    }).run();
    return contact;
  }

  // ── Events ──
  async recordEvent(data: InsertPageEvent): Promise<void> {
    db.insert(schema.pageEvents).values({ ...data, createdAt: new Date().toISOString() }).run();
  }
  async getEventsByPage(pageId: number, days = 30): Promise<PageEvent[]> {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    return sqlite.prepare(
      "SELECT * FROM page_events WHERE page_id = ? AND created_at >= ? ORDER BY created_at ASC"
    ).all(pageId, since) as PageEvent[];
  }
  async getDailyViews(pageId: number, days = 30): Promise<Array<{ date: string; count: number }>> {
    const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    const rows = sqlite.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM page_events
      WHERE page_id = ? AND type = 'view' AND date(created_at) >= ?
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all(pageId, since) as Array<{ date: string; count: number }>;
    // Fill in missing days with 0
    const result: Array<{ date: string; count: number }> = [];
    const byDate = new Map(rows.map(r => [r.date, r.count]));
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      result.push({ date: d, count: byDate.get(d) ?? 0 });
    }
    return result;
  }
  async getDashboardStats(userEmail: string, days?: number): Promise<{ totalViews: number; totalClicks: number; totalLeads: number; totalPages: number }> {
    const pages = sqlite.prepare("SELECT id, view_count FROM pages WHERE owner_email = ?").all(userEmail) as Array<{ id: number; view_count: number }>;
    const totalPages = pages.length;
    let totalViews = 0;
    let totalClicks = 0;
    let totalLeads = 0;
    for (const p of pages) {
      if (days) {
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const views = (sqlite.prepare("SELECT COUNT(*) as total FROM page_events WHERE page_id = ? AND type = 'view' AND created_at >= ?").get(p.id, since) as any)?.total ?? 0;
        const clicks = (sqlite.prepare("SELECT COUNT(*) as total FROM page_events WHERE page_id = ? AND type = 'link_click' AND created_at >= ?").get(p.id, since) as any)?.total ?? 0;
        const leads = (sqlite.prepare("SELECT COUNT(*) as total FROM leads WHERE page_id = ? AND created_at >= ?").get(p.id, since) as any)?.total ?? 0;
        totalViews += views;
        totalClicks += clicks;
        totalLeads += leads;
      } else {
        totalViews += p.view_count;
        const clicks = (sqlite.prepare("SELECT SUM(click_count) as total FROM page_links WHERE page_id = ?").get(p.id) as any)?.total ?? 0;
        const leads = (sqlite.prepare("SELECT COUNT(*) as total FROM leads WHERE page_id = ?").get(p.id) as any)?.total ?? 0;
        totalClicks += clicks;
        totalLeads += leads;
      }
    }
    return { totalViews, totalClicks, totalLeads, totalPages };
  }

  // ── Poll votes ──
  async getPollVotes(pageId: number, pollId: string): Promise<Array<{ optionIndex: number; count: number }>> {
    const rows = sqlite.prepare(
      "SELECT option_index as optionIndex, COUNT(*) as count FROM poll_votes WHERE page_id = ? AND poll_id = ? GROUP BY option_index ORDER BY option_index ASC"
    ).all(pageId, pollId) as Array<{ optionIndex: number; count: number }>;
    return rows;
  }
  async castVote(data: { pageId: number; pollId: string; voterEmail: string; optionIndex: number }): Promise<void> {
    const existing = sqlite.prepare(
      "SELECT id FROM poll_votes WHERE poll_id = ? AND voter_email = ?"
    ).get(data.pollId, data.voterEmail);
    if (existing) throw new Error("already voted");
    sqlite.prepare(
      "INSERT INTO poll_votes (page_id, poll_id, voter_email, option_index, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(data.pageId, data.pollId, data.voterEmail, data.optionIndex, new Date().toISOString());
  }
  async hasVoted(pollId: string, voterEmail: string): Promise<boolean> {
    const row = sqlite.prepare(
      "SELECT id FROM poll_votes WHERE poll_id = ? AND voter_email = ?"
    ).get(pollId, voterEmail);
    return !!row;
  }
}

export const storage = new DatabaseStorage();
