import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const plans = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    tagline: "Get started with no commitment.",
    features: {
      "Page & Links": ["1 page", "5 links per page", "Linkbay subdomain (yourname.linkbay.ai)", "Basic themes (3 presets)"],
      "Analytics": ["Page view counter", "Total link clicks"],
      "Lead Capture": [],
      "AI Features": ["AI headline suggestion (1 use)"],
      "Custom Branding": [],
      "Support": ["Community support"],
    },
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 9,
    annual: 7,
    tagline: "For professionals who want results.",
    featured: true,
    features: {
      "Page & Links": ["Unlimited pages", "Unlimited links", "Custom domain", "All block types (16+)", "All themes + custom colours", "Custom fonts", "Mobile & desktop preview"],
      "Analytics": ["Full analytics dashboard", "Device & source breakdown", "Conversion tracking", "Weekly digest email", "Export CSV"],
      "Lead Capture": ["Lead form block", "Email capture block", "Leads inbox with notes & tags", "CSV export"],
      "AI Features": ["AI wizard setup", "AI headline + bio + CTA generation", "AI layout recommendations", "AI copy variants", "AI audit suggestions"],
      "Custom Branding": ["Remove Linkbay branding", "Custom meta title & description"],
      "Support": ["Priority email support", "Setup guidance"],
    },
  },
  {
    id: "business",
    name: "Business",
    monthly: 29,
    annual: 24,
    tagline: "For agencies and teams managing multiple clients.",
    features: {
      "Page & Links": ["Everything in Pro", "Unlimited client pages", "Bulk page creation"],
      "Analytics": ["White-label reports", "Client-level reporting", "Advanced date ranges"],
      "Lead Capture": ["Full lead management", "Multi-client inbox", "Webhook notifications"],
      "AI Features": ["All Pro AI features", "Niche template library", "Batch AI setup"],
      "Custom Branding": ["Full white-label", "Client-facing branding", "Custom login page"],
      "Support": ["Dedicated support", "Onboarding call", "SLA uptime guarantee"],
      "Team & Agency": ["5 team seats (+£5/seat)", "Shared asset library", "Client management portal", "API access"],
    },
  },
];

const featureRows = [
  { label: "Pages", free: "1", pro: "Unlimited", business: "Unlimited" },
  { label: "Links per page", free: "Unlimited", pro: "Unlimited", business: "Unlimited" },
  { label: "Block types (link, text, poll)", free: "✓", pro: "✓", business: "✓" },
  { label: "Lead capture forms", free: "✓", pro: "✓", business: "✓" },
  { label: "Analytics dashboard", free: "✓", pro: "✓", business: "✓" },
  { label: "Custom domain", free: "—", pro: "✓", business: "✓" },
  { label: "Advanced block types", free: "—", pro: "✓", business: "✓" },
  { label: "AI page builder", free: "—", pro: "✓", business: "✓" },
  { label: "Remove branding", free: "—", pro: "✓", business: "✓" },
  { label: "White-label", free: "—", pro: "—", business: "✓" },
  { label: "Team seats", free: "—", pro: "—", business: "✓" },
  { label: "Agency dashboard", free: "—", pro: "—", business: "✓" },
  { label: "API access", free: "—", pro: "—", business: "✓" },
];

const billingFaqs = [
  { q: "Is there a free trial for paid plans?", a: "Pro comes with a 14-day free trial — no credit card required. You can build your page, capture leads, and test the full product before committing." },
  { q: "Can I cancel any time?", a: "Yes. Cancel from your account settings at any time. Your page stays live until the end of your billing period." },
  { q: "How does annual billing work?", a: "Annual billing is charged upfront for 12 months at the discounted rate. You save ~22% compared to monthly billing." },
  { q: "Can I use my own domain on the Pro plan?", a: "Yes. Add your custom domain in Settings → Domain. We provide step-by-step DNS instructions. Most domains are live within 5 minutes." },
  { q: "What happens to my page if I downgrade?", a: "Your content is preserved. If you exceed free plan limits (1 page, 5 links), excess pages are archived (not deleted) and you can reactivate by upgrading." },
  { q: "Do you offer discounts for non-profits or students?", a: "Yes — contact us for a 50% discount. We verify eligibility and apply it within 1 business day." },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div>
      <Header />

      {/* Header */}
      <section style={{ paddingTop: "5rem", paddingBottom: "3.5rem" }}>
        <div className="container-narrow" style={{ textAlign: "center" }}>
          <span className="badge badge-muted" style={{ marginBottom: "1.25rem" }}>Pricing</span>
          <h1 className="text-title" style={{ marginBottom: "1rem" }}>Simple, honest pricing.</h1>
          <p className="text-body-lg text-muted" style={{ marginBottom: "2rem", marginLeft: "auto", marginRight: "auto" }}>
            Free to start. Upgrade when you need more. No hidden fees, no confusing tiers.
          </p>

          {/* Billing toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.875rem", padding: "0.5rem 1rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-full)" }}>
            <button
              onClick={() => setAnnual(false)}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: annual ? "var(--color-text-muted)" : "var(--color-text)", background: annual ? "none" : "var(--color-surface)", border: "none", cursor: "pointer", padding: "0.375rem 0.875rem", borderRadius: "var(--radius-full)", boxShadow: annual ? "none" : "var(--shadow-sm)" }}
              data-testid="button-billing-monthly"
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: annual ? "var(--color-text)" : "var(--color-text-muted)", background: annual ? "var(--color-surface)" : "none", border: "none", cursor: "pointer", padding: "0.375rem 0.875rem", borderRadius: "var(--radius-full)", boxShadow: annual ? "var(--shadow-sm)" : "none", display: "flex", alignItems: "center", gap: "0.375rem" }}
              data-testid="button-billing-annual"
            >
              Annual
              <span style={{ fontSize: 10, background: "var(--color-success)", color: "#fff", padding: "0.15rem 0.4rem", borderRadius: 999, fontWeight: 700 }}>Save 22%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section style={{ paddingBottom: "4rem" }}>
        <div className="container-default">
          <div className="pricing-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
            {plans.map(plan => (
              <div key={plan.id} className={`pricing-card ${plan.featured ? "featured" : ""}`}>
                {plan.featured && <div className="pricing-badge">Most Popular</div>}

                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                    <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>
                      £{annual ? (plan.annual || 0) : plan.monthly}
                    </span>
                    {plan.monthly > 0 && (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>/mo</span>
                    )}
                  </div>
                  {plan.monthly > 0 && annual && (
                    <div style={{ fontSize: 11, color: "var(--color-text-faint)" }}>Billed annually (£{(plan.annual || 0) * 12}/yr)</div>
                  )}
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>{plan.tagline}</p>
                </div>

                <Link
                  href={plan.monthly === 0 ? "/builder" : "/waitlist"}
                  className={`btn ${plan.featured ? "btn-primary" : "btn-secondary"}`}
                  style={{ width: "100%", justifyContent: "center", marginBottom: "1.5rem" }}
                  data-testid={`button-plan-${plan.id}`}
                >
                  {plan.monthly === 0 ? "Get started — free" : plan.id === "business" ? "Contact us" : `Start ${plan.name} trial`}
                </Link>

                <div style={{ height: 1, background: "var(--color-divider)", marginBottom: "1.5rem" }} />

                {Object.entries(plan.features).map(([category, items]: [string, string[]]) => (
                  items.length > 0 && (
                    <div key={category} style={{ marginBottom: "1.25rem" }}>
                      <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-faint)", marginBottom: "0.5rem" }}>{category}</div>
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {items.map(item => (
                          <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "var(--text-sm)" }}>
                            <span style={{ color: "var(--color-success)", fontSize: 14, lineHeight: 1.4 }}>✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-faint)", marginTop: "2rem" }}>
            All plans include SSL, uptime monitoring, and mobile-optimised pages. VAT may apply.
          </p>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="section" style={{ background: "var(--color-surface-2)" }}>
        <div className="container-default">
          <h2 className="text-section-title" style={{ marginBottom: "2rem", textAlign: "center" }}>Full feature comparison</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)", maxWidth: 800, margin: "0 auto", display: "block" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.875rem 1rem", borderBottom: "2px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>Feature</th>
                  {["Free", "Pro", "Business"].map((n, i) => (
                    <th key={n} style={{ padding: "0.875rem 1rem", borderBottom: "2px solid var(--color-border)", textAlign: "center", fontWeight: 700, fontFamily: "Cabinet Grotesk, sans-serif", color: i === 1 ? "var(--color-primary)" : "var(--color-text)" }}>{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? "transparent" : "var(--color-surface-offset)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>{row.label}</td>
                    {[row.free, row.pro, row.business].map((val, j) => (
                      <td key={j} style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                        <span style={{
                          color: val === "✓" ? "var(--color-success)" : val === "—" ? "var(--color-text-faint)" : "var(--color-text)",
                          fontSize: val === "✓" || val === "—" ? 16 : "var(--text-sm)",
                          fontWeight: 500
                        }}>
                          {val}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Billing FAQ */}
      <section className="section">
        <div className="container-narrow">
          <h2 className="text-section-title" style={{ marginBottom: "2rem", textAlign: "center" }}>Billing & plan questions</h2>
          {billingFaqs.map((faq, i) => (
            <div key={i} className={`accordion-item ${openFaq === i ? "open" : ""}`}>
              <button className="accordion-trigger" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {faq.q}
                <svg className="accordion-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div className="accordion-content">
                <p className="accordion-body">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm" style={{ background: "var(--color-surface-2)" }}>
        <div className="container-narrow" style={{ textAlign: "center" }}>
          <h2 className="text-section-title" style={{ marginBottom: "1rem" }}>Start with Free. Upgrade when you're ready.</h2>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>No credit card required for the free plan or Pro trial.</p>
          <Link href="/builder" className="btn btn-primary btn-lg">Get started free →</Link>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .pricing-cards-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) and (min-width: 769px) {
          .pricing-cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
