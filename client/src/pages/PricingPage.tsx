import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Correct pricing: Pro £5/mo or £4/mo billed annually (£48/yr), Business £20/mo or £16/mo billed annually (£192/yr)
const plans = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    annualMonthly: 0,
    annualTotal: 0,
    tagline: "Build your page and start sharing links, completely free.",
    featured: false,
    features: [
      "1 page",
      "Unlimited links",
      "All core block types",
      "Lead capture forms",
      "Analytics dashboard",
      "Linkbay subdomain (name.linkbay.ai)",
      "AI page builder",
      "3 block style presets",
      "Community support",
    ],
    cta: "Get started free",
    ctaHref: "/builder",
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 5,
    annualMonthly: 4,
    annualTotal: 48,
    tagline: "For creators and professionals who want more from their page.",
    featured: true,
    features: [
      "Everything in Free",
      "Unlimited pages",
      "Custom domain (coming soon)",
      "Priority email support",
      "Remove Linkbay branding",
      "Advanced analytics & date filters",
      "% change analytics vs previous period",
      "Export leads to CSV",
      "Early access to new features",
    ],
    cta: "Start Pro",
    ctaHref: "/dashboard?billing=pro",
  },
  {
    id: "business",
    name: "Business",
    monthly: 20,
    annualMonthly: 16,
    annualTotal: 192,
    tagline: "For agencies and teams managing multiple pages and clients.",
    featured: false,
    features: [
      "Everything in Pro",
      "Multiple team members",
      "Client page management",
      "White-label branding",
      "Custom meta title & description",
      "Advanced lead management",
      "Webhook integrations",
      "Dedicated support",
      "Onboarding call",
    ],
    cta: "Start Business",
    ctaHref: "/dashboard?billing=business",
  },
];

const featureRows = [
  { label: "Pages", free: "1", pro: "Unlimited", business: "Unlimited" },
  { label: "Links per page", free: "Unlimited", pro: "Unlimited", business: "Unlimited" },
  { label: "All block types", free: "✓", pro: "✓", business: "✓" },
  { label: "Lead capture forms", free: "✓", pro: "✓", business: "✓" },
  { label: "Analytics dashboard", free: "✓", pro: "✓", business: "✓" },
  { label: "AI page builder", free: "✓", pro: "✓", business: "✓" },
  { label: "% change analytics", free: "—", pro: "✓", business: "✓" },
  { label: "Custom domain", free: "—", pro: "Soon", business: "Soon" },
  { label: "Remove branding", free: "—", pro: "✓", business: "✓" },
  { label: "Unlimited pages", free: "—", pro: "✓", business: "✓" },
  { label: "White-label", free: "—", pro: "—", business: "✓" },
  { label: "Team seats", free: "—", pro: "—", business: "✓" },
  { label: "Webhook integrations", free: "—", pro: "—", business: "✓" },
  { label: "Dedicated support", free: "—", pro: "—", business: "✓" },
];

const billingFaqs = [
  { q: "Can I cancel any time?", a: "Yes. Cancel from your account settings at any time. Your page stays live until the end of your billing period." },
  { q: "How does annual billing work?", a: "Annual billing is charged upfront for 12 months. Pro is £48/year (equivalent to £4/month) and Business is £192/year (equivalent to £16/month) — saving you 20% vs monthly." },
  { q: "Is there a free trial for paid plans?", a: "You can build and test your full page on the Free plan with no credit card required. Upgrade any time when you're ready." },
  { q: "What happens to my page if I downgrade?", a: "Your content is always preserved. If you have multiple pages on Pro/Business and downgrade to Free, only 1 page is kept active — the rest are archived (not deleted) and reactivated when you upgrade again." },
  { q: "Can I use my own domain?", a: "Custom domain support is coming soon on Pro and Business plans. You'll be able to connect your domain in Settings with step-by-step DNS instructions." },
  { q: "Do you offer refunds?", a: "We offer a full refund within 7 days of your first payment if you're not satisfied. Contact us at support@linkbay.ai." },
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
          <p className="text-body-lg text-muted" style={{ marginBottom: "2rem", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Free forever. Upgrade for more pages, advanced analytics, and team tools. No hidden fees.
          </p>

          {/* Billing toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.875rem", padding: "0.5rem 1rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-full)" }}>
            <button
              onClick={() => setAnnual(false)}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: annual ? "var(--color-text-muted)" : "var(--color-text)", background: annual ? "none" : "var(--color-surface)", border: "none", cursor: "pointer", padding: "0.375rem 0.875rem", borderRadius: "var(--radius-full)", boxShadow: annual ? "none" : "var(--shadow-sm)", transition: "all 0.15s" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: annual ? "var(--color-text)" : "var(--color-text-muted)", background: annual ? "var(--color-surface)" : "none", border: "none", cursor: "pointer", padding: "0.375rem 0.875rem", borderRadius: "var(--radius-full)", boxShadow: annual ? "var(--shadow-sm)" : "none", display: "flex", alignItems: "center", gap: "0.375rem", transition: "all 0.15s" }}
            >
              Annual
              <span style={{ fontSize: 10, background: "var(--color-success)", color: "#fff", padding: "0.15rem 0.4rem", borderRadius: 999, fontWeight: 700 }}>Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section style={{ paddingBottom: "4rem" }}>
        <div className="container-default">
          <div className="pricing-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
            {plans.map(plan => (
              <div key={plan.id} className={`pricing-card ${plan.featured ? "featured" : ""}`} style={{ position: "relative" }}>
                {plan.featured && <div className="pricing-badge">Most Popular</div>}

                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.375rem" }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", lineHeight: 1 }}>
                      {plan.monthly === 0 ? "Free" : `£${annual ? plan.annualMonthly : plan.monthly}`}
                    </span>
                    {plan.monthly > 0 && (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>/mo</span>
                    )}
                  </div>
                  {plan.monthly > 0 && annual && (
                    <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "0.5rem" }}>£{plan.annualTotal}/year — billed annually</div>
                  )}
                  {plan.monthly > 0 && !annual && (
                    <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "0.5rem" }}>or £{plan.annualMonthly}/mo billed annually</div>
                  )}
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{plan.tagline}</p>
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`btn ${plan.featured ? "btn-primary" : "btn-secondary"}`}
                  style={{ width: "100%", justifyContent: "center", marginBottom: "1.75rem", display: "flex", minHeight: "2.75rem", alignItems: "center" }}
                >
                  {plan.cta}
                </Link>

                <div style={{ height: 1, background: "var(--color-divider)", marginBottom: "1.25rem" }} />

                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {plan.features.map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "var(--text-sm)" }}>
                      <span style={{ color: "var(--color-success)", fontSize: 13, lineHeight: 1.6, flexShrink: 0 }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-faint)", marginTop: "2rem" }}>
            All plans include SSL, uptime monitoring, and mobile-optimised pages. Prices ex. VAT.
          </p>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="section" style={{ background: "var(--color-surface-2)" }}>
        <div className="container-default">
          <h2 className="text-section-title" style={{ marginBottom: "2rem", textAlign: "center" }}>Full feature comparison</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)", maxWidth: 800, margin: "0 auto" }}>
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
                          color: val === "✓" ? "var(--color-success)" : val === "—" ? "var(--color-text-faint)" : val === "Soon" ? "var(--color-primary)" : "var(--color-text)",
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

      {/* FAQ */}
      <section className="section">
        <div className="container-narrow">
          <h2 className="text-section-title" style={{ marginBottom: "2rem", textAlign: "center" }}>Frequently asked questions</h2>
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
          <h2 className="text-section-title" style={{ marginBottom: "1rem" }}>Start free. Upgrade when you're ready.</h2>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>No credit card needed. Your free page is live in under 2 minutes.</p>
          <Link href="/builder" className="btn btn-primary btn-lg">Get started free →</Link>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .pricing-cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
