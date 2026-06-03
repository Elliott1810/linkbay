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
    previewBlocks: [
      { type: "button", label: "Book a free strategy call", url: "#", icon: "📅" },
      { type: "button", label: "Download my framework guide", url: "#", icon: "📥" },
      { type: "leadform", placeholder: "Your email address" },
      { type: "testimonial", quote: "Sarah helped us double revenue in 6 months.", author: "Tom B., CEO" },
      { type: "testimonial", quote: "Best investment I made for my business.", author: "Rachel K., Founder" },
      { type: "faq", q: "How long is the engagement?", a: "Typical engagements run 3–6 months." },
      { type: "social", links: ["LinkedIn", "Twitter", "Newsletter"] },
    ],
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
    previewBlocks: [
      { type: "button", label: "Subscribe on YouTube", url: "#", icon: "🎬" },
      { type: "button", label: "Join the newsletter", url: "#", icon: "📧" },
      { type: "text", content: "Every week I break down the latest in AI, startups & dev tools — no fluff, just signal." },
      { type: "countdown", label: "Course launch in", days: 12, hours: 4 },
      { type: "poll", q: "What content do you want next?", options: ["AI tools deep dive", "SaaS teardown", "Career advice"] },
      { type: "social", links: ["YouTube", "Twitter", "Instagram"] },
    ],
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
    previewBlocks: [
      { type: "video", label: "Watch my intro video" },
      { type: "button", label: "Book a discovery call", url: "#", icon: "📞" },
      { type: "leadform", placeholder: "Your email — I'll reach out personally" },
      { type: "testimonial", quote: "Amelia changed the way I think about my goals.", author: "Sophie R." },
      { type: "faq", q: "What does a session look like?", a: "60-minute deep-dive via Zoom. Fully personalised." },
    ],
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
    previewBlocks: [
      { type: "countdown", label: "Product launch", days: 5, hours: 18 },
      { type: "leadform", placeholder: "Join the waitlist" },
      { type: "button", label: "Read my build log", url: "#", icon: "📝" },
      { type: "poll", q: "Which feature should I ship first?", options: ["Zapier integration", "Mobile app", "Team accounts"] },
      { type: "text", content: "I share every failure and win publicly. Transparency is the whole point." },
    ],
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
    previewBlocks: [
      { type: "button", label: "View our case studies", url: "#", icon: "📁" },
      { type: "button", label: "Get a project quote", url: "#", icon: "💬" },
      { type: "leadform", placeholder: "Your work email" },
      { type: "testimonial", quote: "Studio Eleven completely reimagined our brand.", author: "Marcus T., CMO" },
      { type: "social", links: ["Instagram", "Behance", "LinkedIn"] },
    ],
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
    previewBlocks: [
      { type: "button", label: "GitHub — 1.2k stars", url: "#", icon: "⭐" },
      { type: "button", label: "View portfolio", url: "#", icon: "🖥️" },
      { type: "text", content: "I build fast, accessible web apps. Available for contracts from April 2025." },
      { type: "leadform", placeholder: "Email me about your project" },
      { type: "social", links: ["GitHub", "LinkedIn", "Twitter"] },
    ],
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
    previewBlocks: [
      { type: "button", label: "Join my 8-week programme", url: "#", icon: "🏋️" },
      { type: "leadform", placeholder: "Get my free nutrition guide" },
      { type: "testimonial", quote: "Lost 14kg in 12 weeks. Actually enjoyable.", author: "Chris D." },
      { type: "poll", q: "What's your biggest goal?", options: ["Lose weight", "Build muscle", "Improve health"] },
      { type: "faq", q: "Do you offer in-person sessions?", a: "Yes — London EC1. Also fully online." },
    ],
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
    previewBlocks: [
      { type: "button", label: "View wedding portfolio", url: "#", icon: "💍" },
      { type: "button", label: "Check availability", url: "#", icon: "📆" },
      { type: "leadform", placeholder: "Tell me about your day" },
      { type: "testimonial", quote: "Lena captured everything perfectly. Stunning photos.", author: "Anna & Tom" },
      { type: "social", links: ["Instagram", "Pinterest", "TikTok"] },
    ],
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
    previewBlocks: [
      { type: "button", label: "Active roles — 6 open", url: "#", icon: "💼" },
      { type: "text", content: "I specialise in placing senior engineers at high-growth startups. Discreet, fast, results-driven." },
      { type: "leadform", placeholder: "Send me your CV" },
      { type: "social", links: ["LinkedIn", "Twitter"] },
    ],
  },
];

const niches = ["All", "Consultant", "Creator", "Coach", "Founder", "Agency", "Developer", "Recruiter"];

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

// Render a realistic simulated preview of each block type
function SimulatedBlock({ block, accent }: { block: any; accent: string }) {
  if (block.type === "button") {
    return (
      <div style={{
        padding: "0.625rem 1rem", background: accent, color: "#fff",
        borderRadius: 8, fontWeight: 700, fontSize: 12,
        display: "flex", alignItems: "center", gap: "0.5rem",
        cursor: "default",
      }}>
        <span>{block.icon}</span>
        <span>{block.label}</span>
      </div>
    );
  }
  if (block.type === "leadform") {
    return (
      <div style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "0.75rem", background: "var(--color-surface)", display: "flex", gap: "0.5rem" }}>
        <div style={{ flex: 1, height: 28, borderRadius: 6, background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", paddingLeft: 8 }}>
          <span style={{ fontSize: 10, color: "var(--color-text-faint)" }}>{block.placeholder}</span>
        </div>
        <div style={{ width: 56, height: 28, borderRadius: 6, background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>Submit</span>
        </div>
      </div>
    );
  }
  if (block.type === "testimonial") {
    return (
      <div style={{ border: `1px solid var(--color-border)`, borderRadius: 8, padding: "0.75rem", background: "var(--color-surface)", borderLeft: `3px solid ${accent}` }}>
        <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontStyle: "italic", marginBottom: "0.375rem" }}>"{block.quote}"</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-faint)" }}>— {block.author}</div>
      </div>
    );
  }
  if (block.type === "faq") {
    return (
      <div style={{ border: "1px solid var(--color-border)", borderRadius: 8, background: "var(--color-surface)" }}>
        <div style={{ padding: "0.625rem 0.875rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "default" }}>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{block.q}</span>
          <span style={{ fontSize: 12, color: accent }}>▾</span>
        </div>
        <div style={{ padding: "0 0.875rem 0.625rem", fontSize: 10, color: "var(--color-text-muted)" }}>{block.a}</div>
      </div>
    );
  }
  if (block.type === "poll") {
    const total = 100;
    const pcts = [45, 32, 23].slice(0, (block.options || []).length);
    return (
      <div style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "0.75rem", background: "var(--color-surface)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: "0.5rem" }}>{block.q}</div>
        {(block.options || []).map((opt: string, i: number) => (
          <div key={i} style={{ marginBottom: "0.375rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-muted)", marginBottom: 2 }}>
              <span>{opt}</span><span style={{ fontWeight: 700, color: accent }}>{pcts[i] || 20}%</span>
            </div>
            <div style={{ height: 5, background: "var(--color-divider)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pcts[i] || 20}%`, background: accent, borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "countdown") {
    return (
      <div style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "0.75rem", background: "var(--color-surface)", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "var(--color-text-faint)", marginBottom: "0.375rem" }}>{block.label}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          {[["12", "days"], ["04", "hrs"], ["37", "min"], ["22", "sec"]].map(([val, unit]) => (
            <div key={unit} style={{ minWidth: 36, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: accent, fontFamily: "Cabinet Grotesk, sans-serif" }}>{val}</div>
              <div style={{ fontSize: 8, color: "var(--color-text-faint)", textTransform: "uppercase" }}>{unit}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (block.type === "video") {
    return (
      <div style={{ border: "1px solid var(--color-border)", borderRadius: 8, background: "#1a1a1a", height: 80, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 12, marginLeft: 2 }}>▶</span>
        </div>
        <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{block.label}</div>
      </div>
    );
  }
  if (block.type === "text") {
    return (
      <div style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "0.75rem", background: "var(--color-surface)" }}>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.6, margin: 0 }}>{block.content}</p>
      </div>
    );
  }
  if (block.type === "social") {
    return (
      <div style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "0.75rem", background: "var(--color-surface)", display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
        {(block.links || []).map((l: string) => (
          <div key={l} style={{ padding: "0.25rem 0.625rem", background: `${accent}18`, color: accent, borderRadius: 999, fontSize: 10, fontWeight: 700, border: `1px solid ${accent}30` }}>{l}</div>
        ))}
      </div>
    );
  }
  return null;
}

// Full-page preview modal
function PreviewModal({ template, onClose }: { template: typeof templates[0]; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--color-surface)", borderRadius: 20, maxWidth: 400, width: "100%", maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>Template preview</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-faint)", lineHeight: 1, padding: "0.25rem" }}>×</button>
        </div>

        {/* Scrollable profile preview */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Profile header */}
          <div style={{
            background: `linear-gradient(160deg, ${template.accent}18 0%, var(--color-surface) 80%)`,
            padding: "2rem 1.5rem 1.5rem",
            textAlign: "center",
            borderBottom: "1px solid var(--color-border)",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: template.accent, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem", fontWeight: 800,
              margin: "0 auto 0.875rem",
              border: "3px solid var(--color-surface)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}>
              {template.name.charAt(0)}
            </div>
            <div style={{ fontWeight: 800, fontSize: "var(--text-lg)", fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.25rem" }}>{template.name}</div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: template.accent, marginBottom: "0.375rem" }}>{template.title}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{template.bio}</div>

            {/* Niche tag */}
            <span style={{ display: "inline-block", marginTop: "0.75rem", fontSize: 10, fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 999, background: `${template.accent}20`, color: template.accent, border: `1px solid ${template.accent}30` }}>
              {template.useCase}
            </span>
          </div>

          {/* Blocks */}
          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {(template as any).previewBlocks?.map((block: any, i: number) => (
              <SimulatedBlock key={i} block={block} accent={template.accent} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--color-border)", display: "flex", gap: "0.625rem" }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>Close</button>
          <Link href="/builder" className="btn btn-primary btn-sm" style={{ flex: 2, justifyContent: "center" }}>
            Use this template →
          </Link>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, onPreview }: { template: typeof templates[0]; onPreview: () => void }) {
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
        cursor: "pointer",
      }} onClick={onPreview}>
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

        {/* Preview hover overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
        >
          <span style={{ opacity: 0, fontSize: 11, fontWeight: 700, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "0.3rem 0.75rem", borderRadius: 999, transition: "opacity 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
          >Preview →</span>
        </div>

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
          <button
            onClick={onPreview}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, justifyContent: "center" }}
          >
            Preview
          </button>
          <Link href="/builder" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
            Use template
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
  const [previewTemplate, setPreviewTemplate] = useState<typeof templates[0] | null>(null);

  const filtered = activeNiche === "All"
    ? templates
    : templates.filter(t => t.niche === activeNiche);

  return (
    <div>
      <Header />

      {previewTemplate && (
        <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}

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
              <TemplateCard key={t.id} template={t} onPreview={() => setPreviewTemplate(t)} />
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
