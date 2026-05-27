import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function FeatureHero() {
  return (
    <section style={{ paddingTop: "5rem", paddingBottom: "3rem" }}>
      <div className="container-default">
        <span className="badge badge-muted" style={{ marginBottom: "1.25rem" }}>Product</span>
        <h1 className="text-title" style={{ maxWidth: 600, marginBottom: "1.25rem" }}>
          Every tool you need to turn visitors into clients, subscribers, and customers.
        </h1>
        <p className="text-body-lg text-muted" style={{ maxWidth: 520, marginBottom: "2rem" }}>
          Linkbay isn't a link list. It's a full conversion system built around a single branded URL.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/builder" className="btn btn-primary btn-lg">Start building — free</Link>
          <Link href="/templates" className="btn btn-secondary btn-lg">Browse templates</Link>
        </div>
      </div>
    </section>
  );
}

function FeatureBlock({ label, title, body, items, visual, reverse = false }: any) {
  return (
    <section className="section-sm" style={{ borderTop: "1px solid var(--color-divider)" }}>
      <div className="container-default">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "3.5rem",
          alignItems: "center",
        }}>
          <div style={{ order: reverse ? 2 : 1 }}>
            <span className="badge badge-primary" style={{ marginBottom: "1rem" }}>{label}</span>
            <h2 className="text-section-title" style={{ marginBottom: "1rem" }}>{title}</h2>
            <p className="text-body-lg text-muted" style={{ marginBottom: "1.5rem" }}>{body}</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {items.map((item: string) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ order: reverse ? 1 : 2 }}>
            <div className="card-elevated" style={{ overflow: "hidden" }}>
              {visual}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .feature-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function AIBuilderVisual() {
  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>AI Page Wizard</div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {["Profile", "Layout", "Copy", "Publish"].map((step, i) => (
          <div key={step} style={{
            flex: 1, textAlign: "center", fontSize: 10, fontWeight: 700, padding: "0.375rem",
            borderRadius: "var(--radius-sm)",
            background: i === 2 ? "var(--color-primary)" : i < 2 ? "var(--color-surface-dynamic)" : "var(--color-surface-offset)",
            color: i === 2 ? "#fff" : i < 2 ? "var(--color-text)" : "var(--color-text-faint)"
          }}>
            {i < 2 && <span style={{ marginRight: 2 }}>✓</span>}{step}
          </div>
        ))}
      </div>
      <div style={{ background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "0.75rem" }}>
        <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600, marginBottom: "0.5rem" }}>AI-generated headline</div>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, lineHeight: 1.4 }}>"Brand Strategist Helping Startups Build Identities That Attract the Right Clients"</div>
      </div>
      <div style={{ background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "0.75rem" }}>
        <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600, marginBottom: "0.5rem" }}>AI-generated CTA</div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>"Book a free 30-minute brand audit and leave with 3 actionable improvements."</div>
      </div>
      <div style={{ padding: "0.75rem", background: "var(--color-primary-highlight)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", color: "var(--color-primary)", fontWeight: 600 }}>
        ✦ AI suggests: Move your booking block above testimonials to increase click-through.
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>Analytics Dashboard</div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["7d", "30d", "90d"].map((range, i) => (
            <button key={range} style={{
              padding: "0.25rem 0.625rem", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 600,
              background: i === 1 ? "var(--color-primary)" : "var(--color-surface-offset)",
              color: i === 1 ? "#fff" : "var(--color-text-muted)", border: "none", cursor: "pointer"
            }}>{range}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.625rem", marginBottom: "1rem" }}>
        {[
          { l: "Unique visitors", v: "3,291" },
          { l: "Click rate", v: "41.8%" },
          { l: "Leads captured", v: "312" },
        ].map(s => (
          <div key={s.l} style={{ background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", padding: "0.75rem" }}>
            <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600 }}>{s.l}</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 70, background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", overflow: "hidden", position: "relative", marginBottom: "0.75rem" }}>
        <svg width="100%" height="70">
          <polyline points="0,60 60,45 120,50 180,28 240,35 300,18 360,12 420,8" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round"/>
          <polyline points="0,60 60,45 120,50 180,28 240,35 300,18 360,12 420,8 420,70 0,70" fill="var(--color-primary-highlight)" opacity="0.5"/>
        </svg>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        {["Mobile: 64%", "Desktop: 29%", "Tablet: 7%"].map(d => (
          <span key={d} style={{ fontSize: 10, padding: "0.25rem 0.625rem", background: "var(--color-surface-offset)", borderRadius: 999, color: "var(--color-text-muted)", fontWeight: 600 }}>{d}</span>
        ))}
      </div>
    </div>
  );
}

function LeadCaptureVisual() {
  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>Lead Capture Block</div>
      <div style={{ border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "1rem" }}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.375rem" }}>Get my free productivity playbook</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>40+ pages. Used by 3,000+ consultants.</div>
        </div>
        <div style={{ padding: "1rem" }}>
          <input readOnly placeholder="Your name" style={{ display: "block", width: "100%", padding: "0.5rem 0.75rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: 12, marginBottom: "0.5rem", background: "var(--color-surface)", color: "var(--color-text-faint)" }} />
          <input readOnly placeholder="Work email" style={{ display: "block", width: "100%", padding: "0.5rem 0.75rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: 12, marginBottom: "0.75rem", background: "var(--color-surface)", color: "var(--color-text-faint)" }} />
          <div style={{ padding: "0.625rem", background: "var(--color-primary)", borderRadius: "var(--radius-md)", color: "#fff", fontSize: 12, fontWeight: 700, textAlign: "center" }}>Send me the playbook →</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: "var(--color-text-faint)", textAlign: "center" }}>🔒 No spam. Unsubscribe any time.</div>

      <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-divider)", paddingTop: "1rem" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Leads this week</div>
        {["James M.", "Priya K.", "Tom A.", "Lisa C."].map((name, i) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.375rem 0", borderBottom: "1px solid var(--color-divider)", fontSize: 11 }}>
            <span>{name}</span>
            <span style={{ color: "var(--color-success)", fontWeight: 600 }}>+{(4 - i) * 2}h ago</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlocksVisual() {
  const blocks = [
    { icon: "🔗", label: "Link list" },
    { icon: "⭐", label: "Featured link" },
    { icon: "📝", label: "Lead form" },
    { icon: "📧", label: "Email capture" },
    { icon: "💬", label: "Testimonials" },
    { icon: "❓", label: "FAQ" },
    { icon: "📦", label: "Products" },
    { icon: "📅", label: "Booking" },
    { icon: "🎥", label: "Video embed" },
    { icon: "⬇️", label: "Download" },
    { icon: "📸", label: "Gallery" },
    { icon: "🔢", label: "QR code" },
  ];
  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>Block Library</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
        {blocks.map(b => (
          <div key={b.label} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
            padding: "0.75rem 0.5rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)",
            cursor: "default"
          }}>
            <span style={{ fontSize: 18 }}>{b.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textAlign: "center" }}>{b.label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "0.75rem", fontSize: 11, color: "var(--color-text-faint)", textAlign: "center" }}>Drag, drop, and reorder. No code needed.</div>
    </div>
  );
}

function ComparisonTable() {
  const features = [
    "Custom domain",
    "Lead capture forms",
    "Real analytics",
    "AI page setup",
    "Booking block",
    "Digital products",
    "Testimonials block",
    "FAQ block",
    "White-label",
    "Agency dashboard",
    "AI copy audit",
    "QR code",
  ];

  return (
    <section className="section" style={{ background: "var(--color-surface-2)" }}>
      <div className="container-default">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="badge badge-muted" style={{ marginBottom: "1rem" }}>Comparison</span>
          <h2 className="text-title">Linkbay vs. the alternatives.</h2>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "1rem", borderBottom: "2px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>Feature</th>
                {["Linkbay", "Linktree", "Beacons", "Carrd"].map(tool => (
                  <th key={tool} style={{
                    padding: "1rem", borderBottom: "2px solid var(--color-border)", textAlign: "center",
                    fontWeight: 700, fontFamily: "Cabinet Grotesk, sans-serif",
                    color: tool === "Linkbay" ? "var(--color-primary)" : "var(--color-text-muted)"
                  }}>
                    {tool}
                    {tool === "Linkbay" && <div style={{ fontSize: 10, color: "var(--color-primary)", marginTop: 2, fontWeight: 600 }}>← You're here</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => {
                const support: Record<string, boolean[]> = {
                  "Custom domain": [true, true, true, true],
                  "Lead capture forms": [true, false, true, false],
                  "Real analytics": [true, true, false, false],
                  "AI page setup": [true, false, false, false],
                  "Booking block": [true, false, true, false],
                  "Digital products": [true, false, true, false],
                  "Testimonials block": [true, false, false, true],
                  "FAQ block": [true, false, false, true],
                  "White-label": [true, false, false, false],
                  "Agency dashboard": [true, false, false, false],
                  "AI copy audit": [true, false, false, false],
                  "QR code": [true, false, true, false],
                };
                const vals = support[f] || [true, false, false, false];
                return (
                  <tr key={f} style={{ background: i % 2 === 0 ? "transparent" : "var(--color-surface-offset)" }}>
                    <td style={{ padding: "0.875rem 1rem", fontWeight: 500 }}>{f}</td>
                    {vals.map((v, j) => (
                      <td key={j} style={{ padding: "0.875rem 1rem", textAlign: "center" }}>
                        {v
                          ? <span style={{ color: "var(--color-success)", fontSize: 16 }}>✓</span>
                          : <span style={{ color: "var(--color-text-faint)", fontSize: 16 }}>—</span>
                        }
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <div>
      <Header />
      <FeatureHero />
      <FeatureBlock
        label="AI Page Builder"
        title="Set up in 3 minutes. Improve in seconds."
        body="Answer 3 questions about your business, and Linkbay's AI writes your headline, bio, CTA copy, and suggests the best block layout for your niche. Then audits your page and recommends improvements."
        items={[
          "AI-generated headline, bio, and CTA copy",
          "Layout recommendations by niche (creator, consultant, recruiter…)",
          "Ongoing audit suggestions: 'Move booking block higher'",
          "Multiple copy variants to A/B test",
          "Template library with AI customisation",
        ]}
        visual={<AIBuilderVisual />}
      />
      <FeatureBlock
        label="Analytics"
        title="Know exactly what's driving clicks and leads."
        body="Real analytics built into every page. See total views, unique visitors, click-through rates, device splits, traffic sources, and conversion events — all in a clean dashboard."
        items={[
          "Real-time view and click tracking",
          "Device and browser breakdown",
          "Traffic source analysis (Instagram, LinkedIn, email…)",
          "Link click rankings and conversion rates",
          "Weekly digest email with top performers",
        ]}
        visual={<AnalyticsVisual />}
        reverse
      />
      <FeatureBlock
        label="Lead Capture"
        title="Every visitor is a potential lead. Capture them right on your page."
        body="Embed contact forms, email capture blocks, and lead magnets directly into your Linkbay page. Every submission flows into a CRM-style inbox with tags, notes, and CSV export."
        items={[
          "Embedded lead form and email capture blocks",
          "Leads dashboard with status, notes, and tags",
          "Export to CSV or connect to your CRM",
          "Consent checkbox with privacy text",
          "'Book a call' CTA route from lead form",
        ]}
        visual={<LeadCaptureVisual />}
      />
      <FeatureBlock
        label="Blocks System"
        title="A full toolkit for every type of professional page."
        body="Build any type of page from a library of 16+ reusable content blocks. Drag and drop to reorder. Show or hide blocks on mobile. Each block is independently styled and customisable."
        items={[
          "Link list, featured link, contact card, social icons",
          "Lead form, email capture, FAQ accordion",
          "Video embed, image gallery, rich text/about",
          "Product/card grid, digital download block",
          "Calendar booking, QR code, 'Now' status block",
        ]}
        visual={<BlocksVisual />}
        reverse
      />
      <ComparisonTable />

      {/* CTA */}
      <section className="section">
        <div className="container-narrow" style={{ textAlign: "center" }}>
          <h2 className="text-title" style={{ marginBottom: "1.25rem" }}>Ready to build your page?</h2>
          <p className="text-body-lg text-muted" style={{ marginBottom: "2rem", marginLeft: "auto", marginRight: "auto" }}>
            Start free. Upgrade when you're ready to unlock custom domains, lead capture, and full analytics.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/builder" className="btn btn-primary btn-lg">Start building — free</Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">See pricing</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
