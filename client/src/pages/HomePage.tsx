import { useState, useEffect } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// --- Sub-components ---

function HeroDashboardMockup() {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-xl)",
      overflow: "hidden",
      maxWidth: 580,
      width: "100%"
    }}>
      {/* Browser chrome */}
      <div style={{
        background: "var(--color-surface-offset)",
        borderBottom: "1px solid var(--color-divider)",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div style={{
          flex: 1, height: 24, background: "var(--color-surface)", borderRadius: 6,
          border: "1px solid var(--color-border)", display: "flex", alignItems: "center",
          padding: "0 10px", fontSize: 11, color: "var(--color-text-faint)", marginLeft: 8
        }}>
          linkbay.ai/p/sarahjones
        </div>
      </div>

      {/* App content */}
      <div style={{ display: "flex", height: 380 }}>
        {/* Sidebar */}
        <div style={{
          width: 180, background: "var(--color-surface-2)", borderRight: "1px solid var(--color-divider)",
          padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "2px"
        }}>
          {[
            { icon: "⊞", label: "Overview", active: true },
            { icon: "✎", label: "Editor" },
            { icon: "◑", label: "Analytics" },
            { icon: "⊕", label: "Leads" },
            { icon: "⊙", label: "Settings" },
          ].map(item => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 0.625rem", borderRadius: 6, cursor: "default",
              background: item.active ? "var(--color-primary-highlight)" : "transparent",
              color: item.active ? "var(--color-primary)" : "var(--color-text-muted)",
              fontSize: 12, fontWeight: item.active ? 600 : 500
            }}>
              <span style={{ fontSize: 13 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "1.25rem", overflow: "hidden" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", marginBottom: "0.875rem" }}>Page Performance</div>

          {/* Stat row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.625rem", marginBottom: "0.875rem" }}>
            {[
              { label: "Views", value: "4,291", delta: "+18%", up: true },
              { label: "Clicks", value: "1,847", delta: "+24%", up: true },
              { label: "Leads", value: "312", delta: "+41%", up: true },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "var(--color-surface-offset)", borderRadius: 8,
                padding: "0.625rem 0.75rem"
              }}>
                <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)", fontFamily: "Cabinet Grotesk, sans-serif", lineHeight: 1.2, marginTop: 2 }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: "var(--color-success)", fontWeight: 600 }}>{stat.delta}</div>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div style={{ background: "var(--color-surface-offset)", borderRadius: 8, height: 80, marginBottom: "0.875rem", padding: "0.625rem 0.75rem", position: "relative", overflow: "hidden" }}>
            <svg width="100%" height="60" style={{ position: "absolute", bottom: 8, left: 0 }}>
              <polyline
                points="0,50 40,38 80,42 120,25 160,30 200,15 240,22 280,10 320,18 360,8 400,12"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="0,50 40,38 80,42 120,25 160,30 200,15 240,22 280,10 320,18 360,8 400,12 400,60 0,60"
                fill="var(--color-primary-highlight)"
                opacity="0.5"
              />
            </svg>
            <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600 }}>Last 30 days</div>
          </div>

          {/* Top links */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>Top Links</div>
          {[
            { name: "Book a consultation", pct: 82 },
            { name: "Download free guide", pct: 61 },
            { name: "Follow on LinkedIn", pct: 44 },
          ].map(link => (
            <div key={link.name} style={{ marginBottom: "0.375rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-muted)", marginBottom: 2 }}>
                <span>{link.name}</span>
                <span>{link.pct}%</span>
              </div>
              <div style={{ height: 4, background: "var(--color-surface-dynamic)", borderRadius: 999 }}>
                <div style={{ width: `${link.pct}%`, height: "100%", background: "var(--color-primary)", borderRadius: 999, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustBar() {
  const items = [
    "Custom domains",
    "AI page builder",
    "Lead capture",
    "Click analytics",
    "Calendar booking",
    "Dark mode pages",
  ];
  return (
    <div className="trust-bar">
      {items.map(item => (
        <div key={item} className="trust-item">
          <div className="trust-dot" />
          {item}
        </div>
      ))}
    </div>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const { data: countData } = useQuery({
    queryKey: ["/api/waitlist/count"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/waitlist/count");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/waitlist", { email });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", gap: "0.5rem",
        padding: "1.25rem 1.5rem", background: "var(--color-primary-highlight)",
        border: "1.5px solid var(--color-primary)", borderRadius: "var(--radius-lg)"
      }}>
        <div style={{ fontWeight: 700, color: "var(--color-primary)" }}>🎉 You're on the list!</div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          We'll notify you when early access opens. Expect good things.
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); if (email) mutation.mutate(email); }}
      className="waitlist-form"
      style={{ display: "flex", gap: "0.625rem", maxWidth: 440 }}
    >
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="input"
        style={{ flex: 1 }}
        required
        data-testid="input-email-hero"
        aria-label="Email address"
      />
      <button type="submit" className="btn btn-primary" disabled={mutation.isPending} data-testid="button-join-waitlist">
        {mutation.isPending ? "Joining…" : "Get early access"}
      </button>
    </form>
  );
}

function FeatureSection() {
  const features = [
    {
      label: "AI-Powered Setup",
      title: "Go from zero to live page in under 3 minutes.",
      body: "Answer 3 questions about your work and goals. Linkbay's AI writes your headline, bio, and CTA copy — then suggests the right block layout for your niche. No blank-page paralysis.",
      stat: "Quick setup",
      visual: (
        <div style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", marginBottom: "1rem" }}>AI Onboarding</div>
          {[
            { q: "What do you do?", a: "Business consultant" },
            { q: "Who are your visitors?", a: "Potential clients" },
            { q: "What should they do?", a: "Book a call with me" },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>{item.q}</div>
              <div style={{ padding: "0.5rem 0.75rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{item.a}</div>
            </div>
          ))}
          <div style={{ marginTop: "1rem", padding: "0.875rem", background: "var(--color-primary-highlight)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--color-primary)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", fontWeight: 700, marginBottom: "0.25rem" }}>AI suggestion</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", fontWeight: 500 }}>"Business Consultant — Book a free 30-min strategy call and let's solve your biggest challenge."</div>
          </div>
        </div>
      ),
    },
    {
      label: "Real Analytics",
      title: "Know what's working. Stop guessing.",
      body: "See exactly which links get clicked, which devices your visitors use, and where your traffic comes from. The dashboard shows daily trends, conversion rates, and your top-performing CTAs.",
      stat: "Real-time dashboard",
      visual: (
        <div style={{ padding: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1rem" }}>
            {[
              { label: "Page Views", value: "2,841", delta: "+23%" },
              { label: "Click Rate", value: "38.4%", delta: "+8%" },
              { label: "Leads", value: "143", delta: "+31%" },
              { label: "Bookings", value: "17", delta: "+18%" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", padding: "0.75rem" }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-success)", fontWeight: 600 }}>{s.delta} this month</div>
              </div>
            ))}
          </div>
          <div style={{ height: 60, background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", overflow: "hidden", position: "relative" }}>
            <svg width="100%" height="60">
              <polyline points="0,55 50,40 100,45 150,20 200,30 250,15 300,22 350,10 400,16" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round"/>
              <polyline points="0,55 50,40 100,45 150,20 200,30 250,15 300,22 350,10 400,16 400,60 0,60" fill="var(--color-primary-highlight)" opacity="0.4"/>
            </svg>
          </div>
        </div>
      ),
    },
    {
      label: "Lead Capture",
      title: "Every visitor is a potential lead. Capture them.",
      body: "Embed lead forms, email capture blocks, and booking CTAs directly into your page. Leads flow into your dashboard with tags, notes, and export to CSV — no extra tools needed.",
      stat: "More leads from every visitor",
      visual: (
        <div style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "1rem" }}>Leads Inbox</div>
          {[
            { name: "James Mitchell", tag: "Hot lead", time: "2 min ago" },
            { name: "Priya Mehta", tag: "Booked call", time: "18 min ago" },
            { name: "Tom Okafor", tag: "Downloaded", time: "1h ago" },
            { name: "Lisa Chen", tag: "Subscribed", time: "3h ago" },
          ].map(lead => (
            <div key={lead.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-surface-dynamic)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>
                  {lead.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{lead.name}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{lead.time}</div>
                </div>
              </div>
              <span style={{ fontSize: "var(--text-xs)", padding: "0.2rem 0.6rem", borderRadius: 999, background: "var(--color-primary-highlight)", color: "var(--color-primary)", fontWeight: 600 }}>{lead.tag}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section className="section" style={{ background: "var(--color-surface-2)" }}>
      <div className="container-default">
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <span className="badge badge-muted" style={{ marginBottom: "1rem" }}>Why Linkbay</span>
          <h2 className="text-title" style={{ marginBottom: "1rem" }}>More than just a link list.</h2>
          <p className="text-body-lg text-muted" style={{ maxWidth: 520, margin: "0 auto" }}>
            Built for people who want results from their bio link — not just a place to put URLs.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          {features.map((feature, i) => (
            <div key={feature.label} className="feature-row-grid" style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "3rem",
              alignItems: "center",
            }}>
              {/* Text */}
              <div style={{ order: i % 2 === 0 ? 1 : 2 }}>
                <span className="badge badge-primary" style={{ marginBottom: "1rem" }}>{feature.label}</span>
                <h3 className="text-section-title" style={{ marginBottom: "1rem" }}>{feature.title}</h3>
                <p className="text-body-lg text-muted" style={{ marginBottom: "1.5rem" }}>{feature.body}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-success)" }} />
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-muted)" }}>{feature.stat}</span>
                </div>
              </div>

              {/* Visual */}
              <div style={{ order: i % 2 === 0 ? 2 : 1 }}>
                <div className="card-elevated" style={{ overflow: "hidden" }}>
                  {feature.visual}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .feature-row-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .feature-row-grid > div { order: unset !important; }
        }
      `}</style>
    </section>
  );
}

function UseCaseSection() {
  const usecases = [
    { icon: "🎨", title: "Creators", subtitle: "Turn followers into subscribers", desc: "Link your content, grow your list, and sell digital products — all from one page your audience actually uses." },
    { icon: "💼", title: "Consultants", subtitle: "Book more calls, waste less time", desc: "Showcase your services, embed your calendar, and capture qualified leads while you sleep." },
    { icon: "🔍", title: "Recruiters", subtitle: "Stand out from the inbox crowd", desc: "A polished professional page that shows candidates who you are and makes it easy to connect." },
    { icon: "⚡", title: "Founders", subtitle: "Validate and launch faster", desc: "Your product's launchpad. Capture waitlist signups, share your deck, and track early traction." },
    { icon: "📣", title: "Agencies", subtitle: "White-label for every client", desc: "Custom-branded pages for your clients at scale. Your logo, their results, your agency growing." },
    { icon: "🎓", title: "Coaches", subtitle: "Fill your calendar from Instagram", desc: "A conversion-optimised page that turns Instagram bio clicks into booked sessions and paying clients." },
  ];

  return (
    <section className="section">
      <div className="container-default">
        <div style={{ marginBottom: "3rem" }}>
          <span className="badge badge-muted" style={{ marginBottom: "1rem" }}>Who it's for</span>
          <h2 className="text-title" style={{ maxWidth: 480 }}>Built for people who are serious about their online presence.</h2>
        </div>

        <div className="grid-3">
          {usecases.map(uc => (
            <div key={uc.title} className="card card-hover" style={{ padding: "1.75rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{uc.icon}</div>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-faint)", marginBottom: "0.25rem" }}>{uc.subtitle}</div>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.75rem" }}>{uc.title}</h3>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.7 }}>{uc.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "I switched from my old link tool a few months ago. My lead form has already captured hundreds of emails. The analytics alone are worth it.",
      name: "S. Chen",
      role: "Business Coach",
      handle: "@sarahcoaches",
      avatar: "SC",
    },
    {
      quote: "As a recruiter, my Linkbay page is the first thing I share with candidates. It looks premium and saves me so much back-and-forth.",
      name: "M. Webb",
      role: "Senior Tech Recruiter",
      handle: "@marcuswebb",
      avatar: "MW",
    },
    {
      quote: "Clients find my booking link, read my testimonials, and sign up — all before we've even spoken. Linkbay converted my first client in week one.",
      name: "P. Mehta",
      role: "Brand Consultant",
      handle: "@priyacreates",
      avatar: "PM",
    },
    {
      quote: "The AI wrote my bio better than I could. It suggested moving my booking block higher and my conversion rate improved significantly.",
      name: "J. Okafor",
      role: "Photographer & Filmmaker",
      handle: "@jamesokafor",
      avatar: "JO",
    },
  ];

  return (
    <section className="section" style={{ background: "var(--color-surface-2)" }}>
      <div className="container-default">
        <div style={{ marginBottom: "3rem" }}>
          <span className="badge badge-muted" style={{ marginBottom: "1rem" }}>Social proof</span>
          <h2 className="text-title">Trusted by professionals who care about conversion.</h2>
        </div>

        <div className="grid-2">
          {testimonials.map(t => (
            <div key={t.name} className="card" style={{ padding: "1.75rem" }}>
              <div style={{ marginBottom: "1.25rem" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.7, marginBottom: "1.5rem", fontStyle: "italic" }}>
                "{t.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "var(--color-primary-highlight)", color: "var(--color-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700
                }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section className="section">
      <div className="container-default">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="badge badge-muted" style={{ marginBottom: "1rem" }}>Pricing</span>
          <h2 className="text-title" style={{ marginBottom: "1rem" }}>Free to start. Powerful when you need it.</h2>
          <p className="text-body-lg text-muted">No credit card required. Upgrade when you're ready.</p>
        </div>

        <div className="pricing-teaser-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", maxWidth: 860, margin: "0 auto" }}>
          {[
            { plan: "Free", price: "£0", note: "forever", features: ["1 page", "5 links", "Basic analytics", "Linkbay subdomain"], cta: "Get started", variant: "secondary" as const },
            { plan: "Pro", price: "£9", note: "/mo", features: ["Unlimited pages", "All blocks", "Lead capture", "Custom domain", "Full analytics", "Remove branding"], cta: "Start Pro", variant: "primary" as const, featured: true },
            { plan: "Business", price: "£29", note: "/mo", features: ["Everything in Pro", "Team seats", "White-label", "Priority support", "Agency dashboard", "API access"], cta: "Contact us", variant: "secondary" as const },
          ].map(tier => (
            <div key={tier.plan} className={`pricing-card ${tier.featured ? "featured" : ""}`}>
              {tier.featured && <div className="pricing-badge">Most Popular</div>}
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>{tier.plan}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>{tier.price}</span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{tier.note}</span>
              </div>
              <div style={{ height: 1, background: "var(--color-divider)", margin: "1.25rem 0" }} />
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
                {tier.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--text-sm)" }}>
                    <span style={{ color: "var(--color-success)", fontSize: 14 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className={`btn btn-${tier.variant}`} style={{ width: "100%", justifyContent: "center" }}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-faint)", marginTop: "1.5rem" }}>
          All plans include SSL, uptime monitoring, and mobile-optimised pages.
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pricing-teaser-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = [
    { q: "How is Linkbay different from Linktree?", a: "Linkbay is a mini-site builder, not just a link list. You get a full page with custom blocks — lead forms, testimonials, booking, products, and an FAQ — plus AI-generated copy and real analytics. Linktree shows links. Linkbay builds pages that convert." },
    { q: "Do I need to know how to code?", a: "Not at all. The AI wizard sets up your page in under 3 minutes. Everything is drag-and-drop, and the AI suggests copy, layout, and improvements. If you can use Instagram, you can use Linkbay." },
    { q: "Can I use my own domain?", a: "Yes. Pro and Business plans support custom domains. Your page lives at yourdomain.com or whatever you choose — fully branded with no Linkbay watermark." },
    { q: "How does lead capture work?", a: "Add a lead form or email capture block to your page. Every submission appears in your Leads dashboard with their name, email, and the action they took. Export to CSV or connect to your CRM." },
    { q: "Is there a free plan?", a: "Yes — free forever, no credit card required. The free plan gives you one page with up to 5 links and basic analytics on a linkbay.ai subdomain. Upgrade when you need custom domains, more blocks, or lead capture." },
    { q: "Can agencies manage multiple clients?", a: "Business plan includes an agency dashboard to manage client pages, white-label reporting, team seats, and a shared asset library. Perfect for social media agencies and personal branding studios." },
  ];

  return (
    <section className="section" style={{ background: "var(--color-surface-2)" }}>
      <div className="container-narrow">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="badge badge-muted" style={{ marginBottom: "1rem" }}>FAQ</span>
          <h2 className="text-title">Common questions.</h2>
        </div>

        <div>
          {faqs.map((faq, i) => (
            <div key={i} className={`accordion-item ${openIdx === i ? "open" : ""}`}>
              <button
                className="accordion-trigger"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                aria-expanded={openIdx === i}
                data-testid={`button-faq-${i}`}
              >
                {faq.q}
                <svg className="accordion-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              <div className="accordion-content">
                <p className="accordion-body">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="section">
      <div className="container-narrow" style={{ textAlign: "center" }}>
        <h2 className="text-title" style={{ marginBottom: "1.25rem" }}>
          Your bio link should work as hard as you do.
        </h2>
        <p className="text-body-lg text-muted" style={{ marginBottom: "2.5rem", marginLeft: "auto", marginRight: "auto" }}>
          Join professionals who've already replaced their old link-in-bio with a page that actually converts.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/builder" className="btn btn-primary btn-lg" style={{ flex: "1 1 auto", maxWidth: 320, justifyContent: "center", textAlign: "center" }}>Build my page — it's free</Link>
          <Link href="/templates" className="btn btn-secondary btn-lg" style={{ flex: "1 1 auto", maxWidth: 320, justifyContent: "center", textAlign: "center" }}>Browse example pages</Link>
        </div>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginTop: "1rem" }}>
          No credit card. Free forever plan available.
        </p>
      </div>
    </section>
  );
}

// --- Main Page ---

export default function HomePage() {
  const { data: countData } = useQuery({
    queryKey: ["/api/waitlist/count"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/waitlist/count");
      return res.json();
    },
  });

  return (
    <div>
      <Header />

      {/* HERO */}
      <section style={{ paddingTop: "clamp(3.5rem, 8vw, 7rem)", paddingBottom: "clamp(3rem, 6vw, 5rem)", overflow: "hidden" }}>
        <div className="container">
          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(2.5rem, 6vw, 5rem)", alignItems: "center" }}>
            {/* Left — text */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <span className="badge badge-primary">Beta — Early Access Open</span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
                  {countData?.count ? `${countData.count}+ on waitlist` : "Early access open"}
                </span>
              </div>

              <h1 className="text-headline" style={{ marginBottom: "1.25rem" }}>
                Turn one link into a mini-site that earns.
              </h1>

              <p className="text-body-lg text-muted" style={{ marginBottom: "2rem", maxWidth: 460 }}>
                Linkbay builds you a branded page with AI-written copy, lead capture, analytics, and booking — from a single link in your bio.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2rem" }}>
                <WaitlistForm />
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Link href="/p/sarah-jones-consultant" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "underline", textDecorationColor: "var(--color-border)", textUnderlineOffset: 3 }}>
                    View demo →
                  </Link>
                </div>
              </div>

              <TrustBar />
            </div>

            {/* Right — mockup: hidden on mobile */}
            <div className="hero-mockup" style={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
              <HeroDashboardMockup />
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr !important; }
            .hero-mockup { display: none !important; }
            .waitlist-form { flex-direction: column !important; }
            .waitlist-form .btn { width: 100% !important; justify-content: center !important; }
          }
        `}</style>
      </section>

      {/* Problem/Solution strip */}
      <div style={{ background: "var(--color-text)", color: "var(--color-text-inverse)", padding: "1.25rem 0" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-faint)", fontWeight: 600 }}>THE PROBLEM:</span>
          <span style={{ fontSize: "var(--text-sm)" }}>Your bio link sends people to a boring list of URLs. They leave. You lose leads, bookings, and revenue every day.</span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 700 }}>→ Linkbay fixes this.</span>
        </div>
      </div>

      <FeatureSection />
      <UseCaseSection />
      <TestimonialsSection />
      <PricingTeaser />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
