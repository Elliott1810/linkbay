import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTheme, useAuth } from "@/App";

const Logo = () => (
  <svg width="120" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Linkbay" role="img">
    {/* Bay shape — link chain + bay window */}
    <rect x="0" y="4" width="10" height="24" rx="3" fill="currentColor" opacity="0.9"/>
    <rect x="13" y="9" width="10" height="19" rx="3" fill="currentColor" opacity="0.7"/>
    <rect x="26" y="14" width="10" height="14" rx="3" fill="var(--color-primary)"/>
    <text x="42" y="22" fontFamily="Cabinet Grotesk, sans-serif" fontWeight="800" fontSize="17" fill="currentColor" letterSpacing="-0.5">linkbay</text>
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);

const XIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

function MobileAuthNav() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  if (user) {
    return (
      <>
        <Link href="/dashboard" className="nav-link" style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Dashboard</Link>
        <button
          onClick={async () => { await logout(); navigate("/"); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.75rem 1rem", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textAlign: "left" }}
        >
          Sign out
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/login" className="nav-link" style={{ padding: "0.75rem 1rem" }}>Sign in</Link>
      <Link href="/builder" className="btn btn-primary" style={{ marginTop: "0.5rem", justifyContent: "center" }}>Start free</Link>
    </>
  );
}

function AuthNav() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  if (user) {
    return (
      <div className="nav-desktop" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
        <Link href="/dashboard" className="nav-link" style={{ fontWeight: 600 }}>
          Dashboard
        </Link>
        <button
          onClick={async () => { await logout(); navigate("/"); }}
          style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.375rem 0.75rem", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", cursor: "pointer", fontWeight: 500 }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="nav-link nav-desktop"
      style={{ fontWeight: 500, display: "inline-flex" }}
    >
      Sign in
    </Link>
  );
}

const navLinks = [
  { href: "/features", label: "Product" },
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Resources" },
];

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on navigation
  useEffect(() => setMenuOpen(false), [location]);

  const isDashboard = location.startsWith("/dashboard");

  if (isDashboard) return null;

  return (
    <header className="site-header" style={{ boxShadow: scrolled ? "var(--shadow-sm)" : "none" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", gap: "1rem", height: "60px" }}>
        {/* Logo */}
        <Link href="/" style={{ color: "var(--color-text)", textDecoration: "none", flexShrink: 0 }}>
          <Logo />
        </Link>

        {/* Nav — desktop */}
        <nav className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginLeft: "1.5rem" }}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${location === link.href ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            style={{
              width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "var(--radius-md)", color: "var(--color-text-muted)",
              background: "none", border: "1px solid var(--color-border)", cursor: "pointer"
            }}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Auth links */}
          <AuthNav />

          {/* CTA — only shown to logged-out visitors */}
          {!user && (
            <Link href="/builder" className="btn btn-primary nav-desktop" data-testid="button-start-free">
              Start free
            </Link>
          )}

          {/* Mobile hamburger — always visible on mobile via CSS */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            style={{
              width: 40, height: 40, alignItems: "center", justifyContent: "center",
              borderRadius: "var(--radius-md)", color: "var(--color-text)", background: "none",
              border: "1px solid var(--color-border)", cursor: "pointer"
            }}
            data-testid="button-menu-toggle"
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <>
          {/* Backdrop — closes menu on tap outside */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed", inset: 0, top: 60, zIndex: 49,
              background: "rgba(0,0,0,0.2)"
            }}
            aria-hidden="true"
          />
          <div style={{
            background: "var(--color-surface)", borderTop: "1px solid var(--color-divider)",
            padding: "1rem", position: "relative", zIndex: 50
          }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link"
                  onClick={() => setMenuOpen(false)}
                  style={{ padding: "0.75rem 1rem", display: "block" }}
                >
                  {link.label}
                </Link>
              ))}
              <div style={{ height: "1px", background: "var(--color-divider)", margin: "0.5rem 0" }} />
              {/* Auth-aware mobile nav */}
              <MobileAuthNav />
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
