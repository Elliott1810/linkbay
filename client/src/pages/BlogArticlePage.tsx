import { useParams, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const articles: Record<string, any> = {
  "linktree-alternatives-recruiters": {
    title: "Best Linktree Alternatives for Recruiters in 2025",
    category: "Comparisons",
    date: "Apr 28, 2025",
    readTime: "6 min",
    intro: "Linktree was built for creators who want to share multiple links. If you're a recruiter, you need something different: a lead capture form, a professional profile, tracking on candidate clicks, and a way to showcase your open roles. This guide covers the best alternatives.",
    sections: [
      {
        heading: "Why Linktree falls short for recruiters",
        body: "Linktree's core product is a list of clickable links. That's fine if you're a musician sharing Spotify, Merch, and YouTube. But recruiters have a completely different workflow: you need candidates to contact you, you need to track who clicks what, and you need to present yourself credibly. A basic link list doesn't cut it.",
      },
      {
        heading: "What recruiters actually need",
        body: "After talking to recruiters who use link-in-bio tools, here's what came up most often:\n\n1. A lead capture form (so candidates can message you directly from the page)\n2. Analytics (which roles get the most clicks, which CTAs convert)\n3. A professional design (that looks like a recruiter, not an influencer)\n4. Easy linking to open roles, LinkedIn, and a CV upload\n5. No distracting 'Made with Linktree' watermarks",
      },
      {
        heading: "The best Linktree alternatives for recruiters",
        body: "Linkbay is purpose-built for professionals. It includes a lead capture form block, analytics, custom domain support, and an AI wizard that sets up your page based on your role and goals.\n\nOther options include Beacons (creator-focused, weaker lead capture), Carrd (static, no analytics), and About.me (outdated design, no conversion tools).",
      },
      {
        heading: "How to set up your recruiter page in under 5 minutes",
        body: "1. Sign up at linkbay.ai (free)\n2. Run the AI wizard: answer 3 questions about your niche and what you want candidates to do\n3. Add your open roles as link cards\n4. Enable the lead form block (candidates fill in their details directly)\n5. Connect your custom domain or use your linkbay.ai/p/yourname link",
      },
    ],
    cta: { label: "Build your recruiter page — free", href: "/waitlist" },
    related: ["bio-link-lead-funnel", "beacons-linktree-linkbay", "personal-landing-pages-convert"],
  },
  "bio-link-lead-funnel": {
    title: "How to Turn Your Bio Link Into a Lead Funnel",
    category: "Strategy",
    date: "Apr 22, 2025",
    readTime: "8 min",
    intro: "Most people treat their bio link as a static directory of URLs. A link to their website, a link to their Instagram, maybe a Calendly. That's a missed opportunity. With the right setup, your bio link can be your most productive lead generation channel.",
    sections: [
      {
        heading: "The problem with static link lists",
        body: "When someone lands on a basic link page, there's no clear path. They see five equal-weight links and don't know what to do. Most click nothing. The ones who do click away never come back, and you have no record of who they were.",
      },
      {
        heading: "The funnel framework",
        body: "A lead funnel has four stages: Arrive → Engage → Convert → Capture. Your bio link page needs to support all four:\n\n1. Arrive: Your headline and bio tell them immediately who you are and why they should care\n2. Engage: A featured link (your single most important CTA) anchors the page\n3. Convert: A lead form or email capture block gives them a reason to leave their details\n4. Capture: The lead lands in your dashboard with their name, email, and what they clicked",
      },
      {
        heading: "The 3 blocks every high-converting page needs",
        body: "Every professional page should have: (1) a bio section with a clear statement of who you help and how, (2) a featured link CTA — your single highest-priority action, and (3) a lead capture form. Pages with all three tend to see significantly more conversions than pages with just links.",
      },
      {
        heading: "The AI advantage",
        body: "Linkbay's AI analyses your page and suggests improvements based on patterns across pages in your niche. Common suggestions: 'Move your booking CTA above the fold', 'Shorten your bio to under 40 words', 'Add a testimonial block above your lead form'. These micro-changes consistently improve engagement and conversion.",
      },
    ],
    cta: { label: "Build your lead funnel page", href: "/waitlist" },
    related: ["coaches-instagram-leads", "personal-landing-pages-convert", "ai-link-in-bio-vs-static"],
  },
  "how-to-use-dashboard": {
    title: "How to Use the Linkbay Dashboard — A Complete Walkthrough",
    category: "How-to",
    date: "May 27, 2026",
    readTime: "10 min",
    intro: "Your Linkbay dashboard is the control room for your link-in-bio page. This walkthrough covers every tab — Overview, Editor, Analytics, Leads, Contacts, and Settings — so you can get the most out of every feature.",
    sections: [
      {
        heading: "Overview — your home base",
        body: "The Overview panel shows your most important stats at a glance: total page views, click rate, leads captured, and your current onboarding progress. Use the quick-action cards to jump straight into editing your page, copying your share link, or viewing recent leads. New users see a checklist that walks through claiming a username, adding links, picking a theme, and publishing.",
      },
      {
        heading: "Editor — build your page",
        body: "The Editor is where you add and arrange content. Start with link cards (label, URL, optional icon) and reorder them with the up/down arrows. Then add content blocks: text, polls, lead forms, images, videos, social-link icons, countdown timers, dividers, buttons, testimonials, and FAQ sections. Each block has its own editor — click Edit to tweak content inline, then Save to publish instantly.",
      },
      {
        heading: "Analytics — understand what's working",
        body: "The Analytics tab shows views, clicks, click-through rate, unique visitors, and your top performing links. Use the period selector to compare 7-day, 30-day, and 90-day windows. The country breakdown shows where your audience comes from — useful if you're targeting specific markets. If your click rate is below 5%, consider tightening your headlines or moving your most important link to a featured position.",
      },
      {
        heading: "Leads — your inbox for new contacts",
        body: "Every lead form submission lands here. Leads have one of seven statuses: new, contacted, qualified, proposal, won, lost, archived. Use the status chips at the top to filter, and click any lead to view full details, add notes, or convert them to a Contact. Export to CSV any time you need to move data into another tool. The sidebar badge shows how many new leads need attention.",
      },
      {
        heading: "Contacts — your CRM",
        body: "Contacts is your lightweight CRM. Add manually, import, or convert from leads. Each contact has a source field (Manual, Lead, Import, Referral, Social, Other) so you can track where your network is coming from. Open any contact to add timestamped notes — useful for tracking follow-ups, meeting summaries, and next steps. Notes can be edited or deleted anytime.",
      },
      {
        heading: "Settings — fine-tune your page",
        body: "Settings covers your page identity (headline, bio, location, contact details), branding (accent colour, background, theme presets, profile picture shape), account (password, avatar, custom domain), and the danger zone (delete account). Theme presets are a shortcut: Ember, Midnight, Ocean, Forest, Aurora, Minimal, Sunset, Sand — each applies a coordinated accent + background combo in one click.",
      },
      {
        heading: "Tips to get the most out of Linkbay",
        body: "1. Always set a featured link — it has 3–4x the click rate of regular links.\n2. Use the lead form block above the fold if conversion is your goal.\n3. Check Analytics weekly and prune underperforming links.\n4. Convert valuable leads to contacts immediately and add notes after every interaction.\n5. Use themes for consistency but customise the accent to match your personal brand.",
      },
    ],
    cta: { label: "Open your dashboard", href: "/dashboard" },
    related: ["bio-link-lead-funnel", "personal-landing-pages-convert", "linktree-alternatives-recruiters"],
  },
};

const allSlugs = Object.keys(articles);

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  // G15: on direct URL load, wouter may have the slug in the pathname even if useParams returns undefined
  const resolvedSlug = slug || (typeof window !== "undefined" ? window.location.pathname.split("/blog/")[1]?.split("/")[0] : "") || "";
  const article = articles[resolvedSlug] || articles["linktree-alternatives-recruiters"];

  const relatedArticles = (article.related || []).slice(0, 3).map((s: string) => ({
    slug: s,
    title: articles[s]?.title || s,
  }));

  return (
    <div>
      <Header />

      <article style={{ paddingTop: "4rem", paddingBottom: "5rem" }}>
        <div className="container-narrow">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", fontSize: "var(--text-sm)" }}>
            <Link href="/blog" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Resources</Link>
            <span style={{ color: "var(--color-text-faint)" }}>›</span>
            <span style={{ color: "var(--color-text-faint)" }}>{article.category}</span>
          </div>

          {/* Header */}
          <div style={{ marginBottom: "2.5rem" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: 999, background: "var(--color-primary-highlight)", color: "var(--color-primary)", marginBottom: "1rem", display: "inline-block" }}>
              {article.category}
            </span>
            <h1 className="text-title" style={{ marginBottom: "1rem" }}>{article.title}</h1>
            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-faint)" }}>{article.date}</span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-faint)" }}>{article.readTime} read</span>
            </div>
            <div style={{ height: 1, background: "var(--color-divider)" }} />
          </div>

          {/* Intro */}
          <p style={{ fontSize: "var(--text-lg)", lineHeight: 1.8, color: "var(--color-text)", marginBottom: "2rem", fontWeight: 400 }}>
            {article.intro}
          </p>

          {/* Sections */}
          {article.sections.map((section: any, i: number) => (
            <div key={i} style={{ marginBottom: "2.5rem" }}>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "1rem", letterSpacing: "-0.01em" }}>
                {section.heading}
              </h2>
              {section.body.split("\n\n").map((para: string, j: number) => (
                <p key={j} style={{ fontSize: "var(--text-base)", lineHeight: 1.8, color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                  {para}
                </p>
              ))}
            </div>
          ))}

          {/* In-article CTA */}
          <div style={{
            margin: "3rem 0",
            padding: "2rem",
            background: "var(--color-primary-highlight)",
            border: "1.5px solid var(--color-primary)",
            borderRadius: "var(--radius-xl)"
          }}>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.75rem" }}>
              Ready to build a page that converts?
            </h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              Linkbay gives you everything in this article — AI setup, lead capture, analytics — in one tool. Free to start.
            </p>
            <Link href={article.cta.href} className="btn btn-primary">
              {article.cta.label} →
            </Link>
          </div>

          {/* Related articles */}
          {relatedArticles.length > 0 && (
            <div>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginBottom: "1.25rem" }}>Further reading</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {relatedArticles.map((r: any) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "1rem 1.25rem", background: "var(--color-surface)",
                    border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                    textDecoration: "none", color: "var(--color-text)", fontWeight: 500,
                    fontSize: "var(--text-sm)", transition: "all var(--transition-interactive)"
                  }}>
                    {r.title}
                    <span style={{ color: "var(--color-text-faint)", flexShrink: 0 }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      <Footer />
    </div>
  );
}
