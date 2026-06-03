import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Each template shows a realistic use case with a variety of block types
const templates = [
  {
    id: "sarahjones",
    name: "Sarah Jones",
    niche: "Consultant",
    title: "Business Strategy Consultant",
    bio: "Helping founders scale from £1M to £10M+",
    accent: "#e06b1a",
    blocks: ["Links", "Lead Form", "Testimonials", "FAQ", "Social Links"],
    desc: "Conversion-focused page for consultants. Features a lead capture form, client testimonials, and clear CTAs for booking.",
    useCase: "Service businesses & consultants",
  },
  {
    id: "jameswilson",
    name: "James Wilson",
    niche: "Creator",
    title: "Tech Content Creator",
    bio: "300K subscribers on YouTube · Weekly newsletter",
    accent: "#0891b2",
    blocks: ["Links", "Text", "Countdown", "Poll", "Social Links"],
    desc: "Creator page with newsletter link, content links, a subscriber poll, and a countdown to a launch event.",
    useCase: "YouTubers, podcasters & influencers",
  },
  {
    id: "ameliabarker",
    name: "Amelia Barker",
    niche: "Coach",
    title: "Life & Business Coach",
    bio: "Certified coach · 200+ clients transformed",
    accent: "#16a34a",
    blocks: ["Lead Form", "Video", "Testimonials", "Links", "FAQ"],
    desc: "Coaching page with a video intro, testimonials, FAQ block, and a direct lead form to book a discovery call.",
    useCase: "Coaches, therapists & wellness pros",
  },
  {
    id: "kaidev",
    name: "Kai Nakamura",
    niche: "Founder",
    title: "Indie Hacker & Founder",
    bio: "Building in public · 3 products launched",
    accent: "#7c3aed",
    blocks: ["Countdown", "Links", "Poll", "Text", "Lead Form"],
    desc: "Founder page with a product launch countdown, waitlist lead form, audience poll, and build-in-public links.",
    useCase: "Startup founders & indie hackers",
  },
  {
    id: "elevenagency",
    name: "Studio Eleven",
    niche: "Agency",
    title: "Creative & Brand Agency",
    bio: "Branding, web & campaigns for ambitious teams",
    accent: "#dc2626",
    blocks: ["Links", "Lead Form", "Testimonials", "Social Links", "Text"],
    desc: "Agency page showcasing services with case study links, a client intake lead form, and social proof testimonials.",
    useCase: "Agencies, studios & creative shops",
  },
  {
    id: "priyasingh",
    name: "Priya Singh",
    niche: "Developer",
    title: "Freelance Developer",
    bio: "Full-stack · Open source contributor",
    accent: "#0e7490",
    blocks: ["Links", "Social Links", "Text", "Lead Form"],
    desc: "Clean developer page with GitHub and project links, a brief bio, and a contact form for client enquiries.",
    useCase: "Developers, designers & tech freelancers",
  },
  {
    id: "jordanblake",
    name: "Jordan Blake",
    niche: "Coach",
    title: "Fitness & Nutrition Coach",
    bio: "NASM certified · Online & in-person coaching",
    accent: "#ea580c",
    blocks: ["Links", "Lead Form", "Testimonials", "FAQ", "Poll"],
    desc: "High-energy fitness page with a programme CTA, client results testimonials, an FAQ, and a quick poll.",
    useCase: "Fitness trainers & health coaches",
  },
  {
    id: "lenamuller",
    name: "Lena Müller",
    niche: "Creator",
    title: "Wedding & Portrait Photographer",
    bio: "500+ weddings shot across Europe",
    accent: "#b45309",
    blocks: ["Links", "Lead Form", "Testimonials", "Social Links", "Text"],
    desc: "Visual photographer page with portfolio links, a booking enquiry form, Instagram feed link, and testimonials.",
    useCase: "Photographers, videographers & artists",
  },
  {
    id: "markthompson",
    name: "Mark Thompson",
    niche: "Recruiter",
    title: "Senior Tech Recruiter",
    bio: "Placing engineers at Series A–C startups",
    accent: "#1d4ed8",
    blocks: ["Links", "Lead Form", "Text", "Social Links"],
    desc: "Recruiter page with active role links, a candidate contact form, LinkedIn CTA, and a brief bio.",
    useCase: "Recruiters, HR professionals & headhunters",
  },
];

const niches = ["All", "Consultant", "Creator", "Coach", "Founder", "Agency", "Developer", "Recruiter"];

// Block type colour mapping — matches the real block types in Linkbay
const blockColors: Record<string, string> = {
  "Links": "#e06b1a",
  "Lead Form": "#16a34a",
  "Testimonials": "#7c3aed",
  "FAQ": "#0891b2",
  "Social Links": "#1d4ed8",
  "Countdown": "#dc2626",
  "Poll": "#ea580c",
  "Text": "#6b7280",
  "Video": "#b45309",
};

function BlockPill({ label }: { label: string }) {
  const color = blockColors[label] || "#6b7280";
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "0.15rem 0.5rem",
      borderRadius: 999, background: `${color}18`, color,
      border: `1px solid ${color}30`,
    }}>
      {label}
    </span>
  );
}

function TemplateCard({ template }: { template: typeof templates[0] }) {
  return (
    <div className="card card-hover" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Preview thumbnail */}
      <div style={{
        height: 190,
        background: `linear-gradient(145deg, ${template.accent}15 0%, ${template.accent}06 100%)`,
        borderBottom: "1px solid var(--color-border)",
        padding: "1.25rem",
        display: "flex", flexDirection: "column", gap: "0.5rem",
        position: "relative", overflow: "hidden",
      }}>
        {/* Profile row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: template.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>
            {template.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{template.name}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-faint)" }}>{template.bio}</div>
          </div>
        </div>

        {/* Simulated blocks */}
        {template.blocks.slice(0, 4).map((blockType, i) => {
          const color = blockColors[blockType] || "#6b7280";
          const isForm = blockType === "Lead Form";
          return (
            <div key={i} style={{
              height: isForm ? 30 : 24,
              background: "var(--color-surface)",
              borderRadius: 5,
              border: "1px solid var(--color-border)",
              display: "flex", alignItems: "center",
              paddingLeft: 7, paddingRight: 7,
              gap: 5,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, height: 4, background: "var(--color-surface-offset)", borderRadius: 2 }} />
              {isForm && <div style={{ width: 28, height: 14, borderRadius: 3, background: `${color}30` }} />}
            </div>
          );
        })}

        {/* Niche badge */}
        <span style={{
          position: "absolute", top: 10, right: 10,
          fontSize: 9, fontWeight: 700, padding: "0.2rem 0.5rem",
          borderRadius: 999,
          background: template.accent, color: "#fff",
        }}>
          {template.niche}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1, gap: "0.75rem" }}>
        <div>
          <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.25rem" }}>
            {template.name}
          </h3>
          <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "0.5rem" }}>{template.useCase}</div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {template.desc}
          </p>
        </div>

        {/* Block pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          {template.blocks.map(b => <BlockPill key={b} label={b} />)}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
          <Link href="/builder" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
            Use this template
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Block Types Showcase ─────────────────────────────────────────────────────
const allBlockTypes = [
  { icon: "🔗", name: "Links", desc: "Buttons that link anywhere — URLs, files, social profiles, calendars." },
  { icon: "📩", name: "Lead Form", desc: "Capture name, email, and a message. Goes straight to your Leads inbox." },
  { icon: "📝", name: "Text", desc: "A free-text block for bios, descriptions, or any copy." },
  { icon: "⭐", name: "Testimonials", desc: "Show client quotes to build trust and credibility." },
  { icon: "📋", name: "FAQ", desc: "Expandable question-and-answer sections." },
  { icon: "🗳️", name: "Poll", desc: "Let visitors vote on a question. Results shown live." },
  { icon: "⏳", name: "Countdown", desc: "Live countdown to a launch, event, or deadline." },
  { icon: "🎬", name: "Video", desc: "Embed a YouTube or Vimeo video directly on your page." },
  { icon: "🌐", name: "Social Links", desc: "Display all your social profiles in one organised row." },
  { icon: "📸", name: "Image", desc: "Add a photo, banner, or product image." },
  { icon: "💬", name: "Divider", desc: "Separate sections with a clean horizontal rule." },
];

export default function TemplatesPage() {
  const [activeNiche, setActiveNiche] = useState("All");

  const filtered = activeNiche === "All"
    ? templates
    : templates.filter(t => t.niche === activeNiche);

  return (
    <div>
      <Header />

      {/* Hero */}
      <section style={{ paddingTop: "5rem", paddingBottom: "3rem" }}>
        <div className="container-default">
          <div style={{ marginBottom: "2.5rem" }}>
            <span className="badge badge-muted" style={{ marginBottom: "1rem" }}>Example pages</span>
            <h1 className="text-title" style={{ maxWidth: 540, marginBottom: "1rem" }}>
              Real pages for real use cases.
            </h1>
            <p className="text-body-lg text-muted" style={{ maxWidth: 500, marginBottom: "2rem" }}>
              Every example shows a different combination of Linkbay's block types — lead forms, testimonials, polls, countdowns, and more. Pick one as your starting point.
            </p>

            {/* Filter */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {niches.map(niche => (
                <button
                  key={niche}
                  onClick={() => setActiveNiche(niche)}
                  className={`btn btn-sm ${activeNiche === niche ? "btn-primary" : "btn-secondary"}`}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid-3">
            {filtered.map(t => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div>
              <div style={{ fontWeight: 600 }}>No templates for this niche yet</div>
              <div style={{ fontSize: "var(--text-sm)", marginTop: "0.5rem" }}>We're adding more every week</div>
            </div>
          )}
        </div>
      </section>

      {/* All block types section */}
      <section className="section" style={{ background: "var(--color-surface-2)" }}>
        <div className="container-default">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 className="text-title" style={{ marginBottom: "0.75rem" }}>All available block types.</h2>
            <p className="text-muted">Mix and match any combination on your page.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {allBlockTypes.map(b => (
              <div key={b.name} className="card" style={{ padding: "1.25rem", display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.25rem" }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm" style={{ borderTop: "1px solid var(--color-divider)" }}>
        <div className="container-narrow" style={{ textAlign: "center" }}>
          <h2 className="text-section-title" style={{ marginBottom: "1rem" }}>Ready to build yours?</h2>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>Answer 4 questions and the AI builds your page — or start from scratch. Free, always.</p>
          <Link href="/builder" className="btn btn-primary btn-lg">Build your page →</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
