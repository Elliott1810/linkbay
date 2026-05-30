import { Link } from "wouter";

const Logo = () => (
  <svg width="108" height="28" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Linkbay">
    <rect x="0" y="4" width="10" height="24" rx="3" fill="currentColor" opacity="0.9"/>
    <rect x="13" y="9" width="10" height="19" rx="3" fill="currentColor" opacity="0.7"/>
    <rect x="26" y="14" width="10" height="14" rx="3" fill="var(--color-primary)"/>
    <text x="42" y="22" fontFamily="Cabinet Grotesk, sans-serif" fontWeight="800" fontSize="17" fill="currentColor" letterSpacing="-0.5">linkbay</text>
  </svg>
);

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Templates", href: "/templates" },
    { label: "Changelog", href: "/blog" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Documentation", href: "/blog" },
    { label: "API", href: "/blog" },
    { label: "Status", href: "/blog" },
  ],
  Company: [
    { label: "About", href: "/blog" },
    { label: "Careers", href: "/blog" },
    { label: "Press", href: "/blog" },
    { label: "Contact", href: "/blog" },
  ],
  Legal: [
    { label: "Privacy", href: "/blog" },
    { label: "Terms", href: "/blog" },
    { label: "Cookies", href: "/blog" },
    { label: "Security", href: "/blog" },
  ],
};

const socialLinks = [
  { label: "Twitter / X", href: "https://x.com", icon: "𝕏" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "in" },
  { label: "GitHub", href: "https://github.com", icon: "⌥" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container" style={{ paddingTop: "4rem", paddingBottom: "2rem" }}>
        {/* Top row */}
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr repeat(4, 1fr)", gap: "3rem", marginBottom: "3rem" }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ color: "var(--color-text)", textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>
              <Logo />
            </Link>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: "1.7", maxWidth: "260px" }}>
              Turn one link into a branded mini-site that captures leads, tracks clicks, and converts visitors.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              {socialLinks.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  style={{
                    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)", textDecoration: "none", fontSize: "13px", fontWeight: 700,
                    background: "var(--color-surface)", transition: "all var(--transition-interactive)"
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-faint)", marginBottom: "1rem" }}>
                {category}
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none", fontWeight: 500 }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
            © 2025 Linkbay Technologies Ltd. All rights reserved.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-success)" }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>All systems operational</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 2rem !important; }
        }
        @media (max-width: 600px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
        }
        footer a:hover { color: var(--color-text) !important; }
      `}</style>
    </footer>
  );
}
