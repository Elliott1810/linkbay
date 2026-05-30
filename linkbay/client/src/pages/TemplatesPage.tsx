import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const templates = [
  {
    id: "sarah-jones-consultant",
    name: "Sarah Jones",
    niche: "Consultant",
    title: "Business Strategy Consultant",
    desc: "Clean, conversion-focused page for consultants. Features booking CTA, lead form, testimonials.",
    tags: ["consultant", "business"],
    accent: "#e06b1a",
    views: "12.4K",
    ctr: "41%",
  },
  {
    id: "alex-creator",
    name: "Alex Rivera",
    niche: "Creator",
    title: "Content Creator & Educator",
    desc: "Ideal for YouTube/Instagram creators. Newsletter signup, latest content, product links.",
    tags: ["creator", "education"],
    accent: "#7c3aed",
    views: "28.1K",
    ctr: "38%",
  },
  {
    id: "mark-recruiter",
    name: "Mark Thompson",
    niche: "Recruiter",
    title: "Senior Tech Recruiter",
    desc: "Professional page for recruiters. Candidate contact form, role listings, LinkedIn CTA.",
    tags: ["recruiter", "hr"],
    accent: "#0891b2",
    views: "6.8K",
    ctr: "52%",
  },
  {
    id: "wellness-coach",
    name: "Amara Osei",
    niche: "Coach",
    title: "Wellness & Mindset Coach",
    desc: "For coaches and wellness professionals. Booking, testimonials, free resource download.",
    tags: ["coach", "wellness"],
    accent: "#16a34a",
    views: "9.2K",
    ctr: "44%",
  },
  {
    id: "agency-studio",
    name: "Studio Eleven",
    niche: "Agency",
    title: "Creative & Brand Agency",
    desc: "Agency-style page showcasing services, work samples, case studies, and lead intake form.",
    tags: ["agency", "creative"],
    accent: "#dc2626",
    views: "4.1K",
    ctr: "29%",
  },
  {
    id: "founder-launch",
    name: "Kai Okafor",
    niche: "Founder",
    title: "Founder & Startup Builder",
    desc: "Perfect for startup founders. Waitlist signup, investor deck link, social traction.",
    tags: ["founder", "startup"],
    accent: "#9333ea",
    views: "18.7K",
    ctr: "56%",
  },
  {
    id: "photographer",
    name: "Lena Müller",
    niche: "Creator",
    title: "Wedding & Portrait Photographer",
    desc: "Visual-first page for photographers. Portfolio gallery, booking link, pricing PDF.",
    tags: ["creator", "photography"],
    accent: "#b45309",
    views: "7.3K",
    ctr: "35%",
  },
  {
    id: "fitness-trainer",
    name: "Jordan Blake",
    niche: "Coach",
    title: "Fitness & Nutrition Coach",
    desc: "High-energy page for fitness pros. Booking, free plan download, testimonials.",
    tags: ["coach", "fitness"],
    accent: "#ea580c",
    views: "14.6K",
    ctr: "48%",
  },
  {
    id: "freelance-dev",
    name: "Priya Singh",
    niche: "Founder",
    title: "Freelance Developer",
    desc: "Minimal, technical page for developers. GitHub, project links, contact form.",
    tags: ["founder", "tech"],
    accent: "#0e7490",
    views: "3.2K",
    ctr: "31%",
  },
];

const niches = ["All", "Consultant", "Creator", "Recruiter", "Coach", "Agency", "Founder"];

function TemplateCard({ template }: { template: typeof templates[0] }) {
  return (
    <div className="card card-hover" style={{ overflow: "hidden" }}>
      {/* Preview thumbnail */}
      <div style={{
        height: 180, background: `linear-gradient(135deg, ${template.accent}18, ${template.accent}08)`,
        borderBottom: "1px solid var(--color-border)", position: "relative", overflow: "hidden",
        padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem"
      }}>
        {/* Mini profile mockup */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: template.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>
            {template.name[0]}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{template.name}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{template.title}</div>
          </div>
        </div>
        {/* Link cards preview */}
        {[1,2].map(i => (
          <div key={i} style={{ height: 28, background: "var(--color-surface)", borderRadius: 6, border: "1px solid var(--color-border)", display: "flex", alignItems: "center", paddingLeft: 8, gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: template.accent, opacity: 0.3 }} />
            <div style={{ flex: 1, height: 6, background: "var(--color-surface-offset)", borderRadius: 3 }} />
          </div>
        ))}
        {/* Niche badge */}
        <span style={{
          position: "absolute", top: 12, right: 12,
          fontSize: 10, fontWeight: 700, padding: "0.2rem 0.6rem",
          borderRadius: 999, background: template.accent,
          color: "#fff"
        }}>
          {template.niche}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.375rem" }}>
          {template.name}
        </h3>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
          {template.desc}
        </p>

        {/* Stats */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
            <span style={{ fontWeight: 700, color: "var(--color-text)" }}>{template.views}</span> views
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
            <span style={{ fontWeight: 700, color: "var(--color-success)" }}>{template.ctr}</span> avg CTR
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link
            href={`/${template.id}`}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, justifyContent: "center" }}
            data-testid={`button-view-${template.id}`}
          >
            View page
          </Link>
          <Link href="/builder" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
            Use template
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [activeNiche, setActiveNiche] = useState("All");

  const filtered = activeNiche === "All"
    ? templates
    : templates.filter(t => t.niche === activeNiche);

  return (
    <div>
      <Header />

      <section style={{ paddingTop: "5rem", paddingBottom: "3rem" }}>
        <div className="container-default">
          <div style={{ marginBottom: "3rem" }}>
            <span className="badge badge-muted" style={{ marginBottom: "1rem" }}>Templates</span>
            <h1 className="text-title" style={{ maxWidth: 540, marginBottom: "1rem" }}>
              Real pages built for real results.
            </h1>
            <p className="text-body-lg text-muted" style={{ maxWidth: 500, marginBottom: "2rem" }}>
              Browse live example pages by niche. Every template is AI-optimised for conversion. Use one as your starting point and customise it in minutes.
            </p>

            {/* Filter bar */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {niches.map(niche => (
                <button
                  key={niche}
                  onClick={() => setActiveNiche(niche)}
                  className={`btn btn-sm ${activeNiche === niche ? "btn-primary" : "btn-secondary"}`}
                  data-testid={`button-filter-${niche.toLowerCase()}`}
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

      {/* CTA */}
      <section className="section-sm" style={{ background: "var(--color-surface-2)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container-narrow" style={{ textAlign: "center" }}>
          <h2 className="text-section-title" style={{ marginBottom: "1rem" }}>Don't see your niche?</h2>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>The AI wizard creates a custom layout based on your specific business and goals — no template needed.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/builder" className="btn btn-primary">Build a custom page →</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
