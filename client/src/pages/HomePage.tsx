import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─── Dashboard Mockup ───────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-xl)",
      overflow: "hidden",
      maxWidth: 540,
      width: "100%",
    }}>
      {/* Browser chrome */}
      <div style={{
        background: "var(--color-surface-offset)",
        borderBottom: "1px solid var(--color-divider)",
        padding: "9px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, height: 22, background: "var(--color-surface)", borderRadius: 5,
          border: "1px solid var(--color-border)", display: "flex", alignItems: "center",
          padding: "0 10px", fontSize: 10, color: "var(--color-text-faint)", marginLeft: 8,
        }}>
          linkbay.ai/dashboard
        </div>
      </div>

      {/* App */}
      <div style={{ display: "flex", height: 340 }}>
        {/* Sidebar */}
        <div style={{
          width: 160, background: "var(--color-surface-2)", borderRight: "1px solid var(--color-divider)",
          padding: "0.875rem 0.625rem", display: "flex", flexDirection: "column", gap: 2,
        }}>
          {[
            { icon: "⊞", label: "Overview", active: true },
            { icon: "✎", label: "Editor" },
            { icon: "◑", label: "Analytics" },
            { icon: "⊕", label: "Blocks" },
            { icon: "✉", label: "Leads" },
            { icon: "⚙", label: "Settings" },
          ].map(item => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.4rem 0.5rem", borderRadius: 5, cursor: "default",
              background: item.active ? "var(--color-primary-highlight)" : "transparent",
              color: item.active ? "var(--color-primary)" : "var(--color-text-muted)",
              fontSize: 11, fontWeight: item.active ? 700 : 500,
            }}>
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: "1rem", overflow: "hidden" }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-text)" }}>Overview</div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {[
              { label: "Views", value: "4,291", up: "+18%" },
              { label: "Clicks", value: "1,847", up: "+24%" },
              { label: "Leads", value: "312", up: "+41%" },
            ].map(s => (
              <div key={s.label} style={{
                background: "var(--color-surface-offset)",
                border: "1px solid var(--color-border)",
                borderRadius: 6, padding: "0.5rem",
              }}>
                <div style={{ fontSize: 9, color: "var(--color-text-faint)", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "var(--color-success)", fontWeight: 600 }}>{s.up}</div>
              </div>
            ))}
          </div>
          {/* Bars */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ fontSize: 10, fontWeight: 600, marginBottom: "0.375rem", color: "var(--color-text-muted)" }}>Top Interactions</div>
            {[
              { label: "Book a Call", pct: 82 },
              { label: "Lead Form", pct: 61 },
              { label: "My Portfolio", pct: 47 },
              { label: "Social Links", pct: 38 },
            ].map(b => (
              <div key={b.label} style={{ marginBottom: "0.3rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 2, color: "var(--color-text-muted)" }}>
                  <span>{b.label}</span><span style={{ fontWeight: 600, color: "var(--color-primary)" }}>{b.pct}%</span>
                </div>
                <div style={{ height: 4, background: "var(--color-divider)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${b.pct}%`, background: "var(--color-primary)", borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
          {/* Lead capture badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.375rem",
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 999, padding: "0.2rem 0.625rem", fontSize: 10, fontWeight: 600, color: "#166534",
          }}>
            <span>🎉</span> +3 new leads today
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Card Mockup ─────────────────────────────────────────────────────
function ProfileMockup() {
  return (
    <div style={{
      background: "#1a1917", borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-xl)", overflow: "hidden",
      maxWidth: 300, width: "100%", padding: "1.5rem",
    }}>
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "var(--color-primary)", margin: "0 auto 0.625rem",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: "#fff",
        }}>SJ</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Sarah Jones</div>
        <div style={{ fontSize: 11, color: "#888" }}>Product Designer · London</div>
      </div>
      {[
        { label: "View my portfolio", type: "btn" },
        { label: "Book a free call", type: "btn-primary" },
        { label: "My newsletter", type: "btn" },
      ].map(b => (
        <div key={b.label} style={{
          width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, marginBottom: 8,
          background: b.type === "btn-primary" ? "var(--color-primary)" : "rgba(255,255,255,0.08)",
          border: `1px solid ${b.type === "btn-primary" ? "transparent" : "rgba(255,255,255,0.1)"}`,
          color: "#fff", fontSize: 12, fontWeight: 600, textAlign: "center" as const,
        }}>{b.label}</div>
      ))}
      <div style={{
        marginTop: "0.75rem", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "0.625rem",
      }}>
        <div style={{ fontSize: 10, color: "#888", marginBottom: "0.375rem", fontWeight: 600 }}>GET IN TOUCH</div>
        <div style={{ height: 22, background: "rgba(255,255,255,0.08)", borderRadius: 5, marginBottom: 4 }} />
        <div style={{ height: 22, background: "rgba(255,255,255,0.08)", borderRadius: 5, marginBottom: 6 }} />
        <div style={{
          background: "var(--color-primary)", borderRadius: 5, padding: "0.25rem",
          textAlign: "center" as const, fontSize: 10, fontWeight: 700, color: "#fff",
        }}>Send message</div>
      </div>
    </div>
  );
}

// ─── Feature Card ────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ fontSize: "1.75rem", marginBottom: "0.875rem" }}>{icon}</div>
      <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.5rem", fontFamily: "Cabinet Grotesk, sans-serif" }}>{title}</h3>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div>
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: "clamp(3.5rem, 8vw, 6rem)", paddingBottom: "clamp(3rem, 6vw, 5rem)", overflow: "hidden" }}>
        <div className="container-default">
          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: "1.25rem" }}>Built for creators & professionals</span>
              <h1 className="text-headline" style={{ marginBottom: "1.25rem" }}>
                One page.<br />
                Every link.<br />
                <span style={{ color: "var(--color-primary)" }}>Real results.</span>
              </h1>
              <p className="text-body-lg text-muted" style={{ marginBottom: "2rem", maxWidth: 440 }}>
                Linkbay gives you a beautiful, data-driven page with lead capture, analytics, and content blocks — all free, all real.
              </p>
              <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
                <Link href="/builder" className="btn btn-primary btn-lg">
                  Build your page — free
                </Link>
                <Link href="/templates" className="btn btn-secondary btn-lg">
                  See examples
                </Link>
              </div>
              <div style={{ marginTop: "1.25rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                {["Free forever", "No credit card", "Live in 2 minutes"].map(t => (
                  <span key={t} style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span style={{ color: "var(--color-success)" }}>✓</span> {t}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <DashboardMockup />
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr !important; }
            .hero-grid > div:last-child { display: none !important; }
          }
        `}</style>
      </section>

      {/* ── Real Features ──────────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-surface-2)" }}>
        <div className="container-default">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 className="text-title" style={{ marginBottom: "0.75rem" }}>Everything you actually need.</h2>
            <p className="text-muted">No fluff — only features that work from day one.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
            <FeatureCard
              icon="🔗"
              title="Links & content blocks"
              body="Add links, lead forms, polls, countdowns, social links, video, testimonials, FAQs — any block type you need, organised exactly as you want."
            />
            <FeatureCard
              icon="📊"
              title="Real analytics"
              body="Track views, clicks, leads, device breakdown, top countries, and interaction rates per block. Filter by 7d / 14d / 30d / 60d or all time."
            />
            <FeatureCard
              icon="📩"
              title="Lead capture built in"
              body="Add a lead form block to your page. Every submission lands in your Leads inbox with notes, status tracking, and CSV export."
            />
            <FeatureCard
              icon="🤖"
              title="AI page builder"
              body="Answer 4 quick questions and Linkbay's AI builds your page for you — blocks, copy, and layout. Edit anything, or start from scratch."
            />
            <FeatureCard
              icon="🎨"
              title="Style your blocks"
              body="Choose from multiple block shapes — default, rounded, sharp, outlined, bordered, underlined. Match your brand in one click."
            />
            <FeatureCard
              icon="📈"
              title="% change analytics"
              body="Each analytics card shows how your metrics compare to the previous period. Green means growth. Know exactly what's working."
            />
          </div>
        </div>
      </section>

      {/* ── Dashboard + Profile Preview ───────────────────────────────── */}
      <section className="section">
        <div className="container-default">
          <div className="two-col-preview" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
            <div>
              <span className="badge badge-muted" style={{ marginBottom: "1rem" }}>Your public page</span>
              <h2 className="text-title" style={{ marginBottom: "1rem" }}>A page that converts, not just shows up.</h2>
              <p className="text-muted" style={{ marginBottom: "1.5rem", lineHeight: 1.7 }}>
                Your Linkbay page isn't just a list of links — it's a mini-website with real blocks: lead forms, polls, countdowns, testimonials, and more. Every interaction is tracked.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[
                  "Your own URL at linkbay.ai/yourname",
                  "Dark mode, multiple colour themes",
                  "Mobile-first responsive design",
                  "Lead form sends to your inbox",
                  "Poll blocks for audience engagement",
                ].map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--text-sm)" }}>
                    <span style={{ color: "var(--color-success)", flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: "1.75rem" }}>
                <Link href="/builder" className="btn btn-primary">Build yours now →</Link>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ProfileMockup />
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .two-col-preview { grid-template-columns: 1fr !important; gap: 2rem !important; }
            .two-col-preview > div:last-child { display: none !important; }
          }
        `}</style>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-surface-2)" }}>
        <div className="container-narrow" style={{ textAlign: "center" }}>
          <h2 className="text-title" style={{ marginBottom: "0.75rem" }}>For anyone serious about their online presence.</h2>
          <p className="text-muted" style={{ marginBottom: "2.5rem" }}>Linkbay is used by:</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
            {[
              { icon: "🎤", label: "Creators" },
              { icon: "💼", label: "Freelancers" },
              { icon: "🚀", label: "Founders" },
              { icon: "🎨", label: "Designers" },
              { icon: "📸", label: "Photographers" },
              { icon: "🏋️", label: "Coaches" },
            ].map(u => (
              <div key={u.label} className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{u.icon}</div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{u.label}</div>
              </div>
            ))}
          </div>
          <Link href="/builder" className="btn btn-primary btn-lg">Get started free →</Link>
        </div>
      </section>

      {/* ── Pricing strip ────────────────────────────────────────────── */}
      <section className="section">
        <div className="container-default">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 className="text-title" style={{ marginBottom: "0.75rem" }}>Free to start. Powerful when you grow.</h2>
            <p className="text-muted">Upgrade any time — no pressure, no lock-in.</p>
          </div>
          <div className="pricing-strip" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", maxWidth: 860, margin: "0 auto" }}>
            {[
              {
                plan: "Free", price: "£0", note: "forever",
                features: ["1 page", "Unlimited links", "All block types", "Lead capture", "Full analytics", "AI page builder"],
                cta: "Get started", variant: "secondary" as const, href: "/builder",
              },
              {
                plan: "Pro", price: "£5", note: "/mo",
                features: ["Unlimited pages", "% change analytics", "Remove branding", "Custom domain (soon)", "Priority support"],
                cta: "Start Pro", variant: "primary" as const, featured: true, href: "/pricing",
              },
              {
                plan: "Business", price: "£20", note: "/mo",
                features: ["Everything in Pro", "Team seats", "White-label", "Webhooks", "Dedicated support"],
                cta: "Start Business", variant: "secondary" as const, href: "/pricing",
              },
            ].map(tier => (
              <div key={tier.plan} className={`pricing-card ${tier.featured ? "featured" : ""}`}>
                {tier.featured && <div className="pricing-badge">Most Popular</div>}
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.375rem" }}>{tier.plan}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "1.875rem", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>{tier.price}</span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{tier.note}</span>
                </div>
                <div style={{ height: 1, background: "var(--color-divider)", margin: "1rem 0" }} />
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.25rem" }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "var(--text-sm)" }}>
                      <span style={{ color: "var(--color-success)", fontSize: 12 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={tier.href} className={`btn ${tier.variant}`} style={{ width: "100%", justifyContent: "center", display: "flex" }}>{tier.cta}</Link>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 768px) { .pricing-strip { grid-template-columns: 1fr !important; } }
        `}</style>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-surface-2)" }}>
        <div className="container-narrow">
          <h2 className="text-title" style={{ marginBottom: "2rem", textAlign: "center" }}>Common questions.</h2>
          {[
            { q: "Is Linkbay really free?", a: "Yes. The Free plan includes 1 page, unlimited links, all block types, lead capture, and the full analytics dashboard. No credit card needed." },
            { q: "How is this different from Linktree?", a: "Linkbay gives you more powerful content blocks (polls, countdowns, lead forms, testimonials), real interaction-rate analytics, and a lead inbox — not just a list of links." },
            { q: "Can I capture leads?", a: "Yes. Add a Lead Form block to your page. Every submission goes to your Leads inbox in the dashboard where you can add notes and track status." },
            { q: "How long does it take to set up?", a: "About 2 minutes. Use the AI builder to generate your page automatically, or build manually. Either way, your page is live straight away." },
            { q: "Can I use my own domain?", a: "Custom domain support is coming soon on paid plans. For now, your page lives at linkbay.ai/yourname." },
          ].map((faq, i) => (
            <details key={i} style={{ borderBottom: "1px solid var(--color-border)", padding: "1rem 0" }}>
              <summary style={{ fontWeight: 600, cursor: "pointer", fontSize: "var(--text-sm)", color: "var(--color-text)", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {faq.q}
                <span style={{ fontSize: 18, color: "var(--color-text-faint)", marginLeft: "1rem", flexShrink: 0 }}>+</span>
              </summary>
              <p style={{ marginTop: "0.75rem", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.7 }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container-narrow" style={{ textAlign: "center" }}>
          <h2 className="text-title" style={{ marginBottom: "1rem" }}>
            Your link-in-bio page.<br />
            <span style={{ color: "var(--color-primary)" }}>Smarter than you'd expect.</span>
          </h2>
          <p className="text-muted" style={{ marginBottom: "2rem", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
            Join the creators and professionals building their presence with Linkbay.
          </p>
          <Link href="/builder" className="btn btn-primary btn-lg">Build your free page →</Link>
          <div style={{ marginTop: "1rem", fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
            Free forever · No credit card · Live in 2 minutes
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
