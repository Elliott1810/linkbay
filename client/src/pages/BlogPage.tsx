import { Link } from "wouter";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const articles = [
  {
    slug: "linktree-alternatives-recruiters",
    title: "Best Linktree Alternatives for Recruiters in 2025",
    excerpt: "Linktree was built for creators. If you're a recruiter, you need lead capture, candidate contact forms, and analytics — here's what actually works.",
    category: "Comparisons",
    readTime: "6 min",
    date: "Apr 28, 2025",
    featured: true,
  },
  {
    slug: "bio-link-lead-funnel",
    title: "How to Turn Your Bio Link Into a Lead Funnel",
    excerpt: "Most people use their bio link as a static directory. Here's how to turn it into an active lead generation system in under an hour.",
    category: "Strategy",
    readTime: "8 min",
    date: "Apr 22, 2025",
  },
  {
    slug: "ai-link-in-bio-vs-static",
    title: "AI Link-in-Bio vs Static Pages: What Converts Better?",
    excerpt: "We analysed 50,000 page sessions across different bio link tools. The results might surprise you.",
    category: "Research",
    readTime: "5 min",
    date: "Apr 15, 2025",
  },
  {
    slug: "coaches-instagram-leads",
    title: "How Coaches Can Capture Leads from Instagram Bio Traffic",
    excerpt: "Instagram sends traffic. Most coaches waste it. This is a step-by-step system for turning Instagram bio clicks into booked sessions.",
    category: "Strategy",
    readTime: "7 min",
    date: "Apr 10, 2025",
  },
  {
    slug: "personal-landing-pages-convert",
    title: "Personal Landing Pages That Actually Convert",
    excerpt: "What separates a high-converting personal page from one that gets ignored? We studied 200+ pages across 6 industries.",
    category: "Research",
    readTime: "6 min",
    date: "Apr 4, 2025",
  },
  {
    slug: "beacons-linktree-linkbay",
    title: "Beacons vs Linktree vs Linkbay: An Honest Comparison",
    excerpt: "Three tools, three different philosophies. Which one is right for your goals? We break it down without the marketing fluff.",
    category: "Comparisons",
    readTime: "9 min",
    date: "Mar 29, 2025",
  },
  {
    slug: "link-in-bio-consultants",
    title: "Best Link-in-Bio Tools for Consultants",
    excerpt: "Consultants have specific needs: lead forms, booking links, social proof, and clean design. Here are the tools that deliver.",
    category: "Comparisons",
    readTime: "7 min",
    date: "Mar 24, 2025",
  },
  {
    slug: "how-to-use-dashboard",
    title: "How to Use the Linkbay Dashboard — A Complete Walkthrough",
    excerpt: "Get the most out of every tab: editor, analytics, leads, contacts, and settings. A practical guide for new Linkbay users.",
    category: "How-to",
    readTime: "10 min",
    date: "May 27, 2026",
  },
];

const categories = ["All", "Strategy", "Comparisons", "Research", "How-to"];

const categoryColor: Record<string, string> = {
  Strategy: "var(--color-primary)",
  Comparisons: "var(--color-blue, #0891b2)",
  Research: "var(--color-success)",
  "How-to": "#7c3aed",
};

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All" ? articles : articles.filter(a => a.category === activeCategory);
  const featured = filtered.find(a => a.featured);
  const rest = filtered.filter(a => !a.featured);

  return (
    <div>
      <Header />

      <section style={{ paddingTop: "5rem", paddingBottom: "2rem" }}>
        <div className="container-default">
          <span className="badge badge-muted" style={{ marginBottom: "1rem" }}>Resources</span>
          <h1 className="text-title" style={{ maxWidth: 560, marginBottom: "1rem" }}>
            Strategy, research, and guides for professionals who take their bio link seriously.
          </h1>
          <p className="text-body-lg text-muted" style={{ maxWidth: 480, marginBottom: "2.5rem" }}>
            Practical content on conversion, lead generation, and personal branding.
          </p>

          {/* Category filter */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "3rem" }}>
            {categories.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="btn btn-sm"
                  style={{
                    background: isActive ? "#e06b1a" : "var(--color-surface)",
                    color: isActive ? "#fff" : "var(--color-text)",
                    border: `1.5px solid ${isActive ? "#e06b1a" : "var(--color-border)"}`,
                    fontWeight: isActive ? 700 : 500,
                  }}
                  data-testid={`filter-blog-${cat.toLowerCase().replace(/[^a-z]/g, "-")}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Featured article */}
          {featured && (
            <Link href={`/blog/${featured.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: "3rem" }}>
              <div className="card card-hover" style={{ padding: "2.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "center" }}>
                {/* Text */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: 999, background: categoryColor[featured.category] + "20", color: categoryColor[featured.category] }}>
                      {featured.category}
                    </span>
                    <span className="badge badge-primary">Featured</span>
                  </div>
                  <h2 className="text-section-title" style={{ marginBottom: "0.875rem" }}>{featured.title}</h2>
                  <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>{featured.excerpt}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{featured.date}</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{featured.readTime} read</span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-primary)" }}>Read article →</span>
                  </div>
                </div>
                {/* Visual placeholder */}
                <div style={{
                  height: 220, background: "linear-gradient(135deg, var(--color-primary-highlight), var(--color-surface-offset))",
                  borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🔍</div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)" }}>{featured.category}</div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Article grid */}
          <div className="grid-3">
            {rest.map(article => (
              <Link key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card card-hover" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  {/* Visual */}
                  <div style={{
                    height: 140,
                    background: `linear-gradient(135deg, ${(categoryColor[article.category] || "var(--color-primary)") + "18"}, var(--color-surface-offset))`,
                    borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderBottom: "1px solid var(--color-border)"
                  }}>
                    <span style={{ fontSize: "2.5rem" }}>
                      {article.category === "Strategy" ? "📈" : article.category === "Comparisons" ? "⚖️" : "🔬"}
                    </span>
                  </div>
                  <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 999, background: (categoryColor[article.category] || "var(--color-primary)") + "18", color: categoryColor[article.category] || "var(--color-primary)" }}>
                        {article.category}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, fontFamily: "Cabinet Grotesk, sans-serif", lineHeight: 1.35, marginBottom: "0.75rem", flex: 1 }}>{article.title}</h3>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.65, marginBottom: "1rem" }}>{article.excerpt}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{article.date}</span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{article.readTime} read</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm" style={{ background: "var(--color-surface-2)", borderTop: "1px solid var(--color-divider)", marginTop: "3rem" }}>
        <div className="container-narrow" style={{ textAlign: "center" }}>
          <h2 className="text-section-title" style={{ marginBottom: "1rem" }}>Ready to build a page that actually converts?</h2>
          <Link href="/builder" className="btn btn-primary btn-lg">Start free →</Link>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 760px) {
          .featured-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
