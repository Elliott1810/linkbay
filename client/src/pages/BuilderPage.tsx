import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTheme } from "@/App";

// Types
interface PageLink {
  id?: number;
  label: string;
  url: string;
  description?: string;
  icon: string;
  style: "default" | "featured" | "outline";
  position: number;
}

// Block types stored in pages.blocks JSON column
type BlockType = "link" | "text" | "poll" | "lead-form";

interface Block {
  id: string;          // client-side UUID
  type: BlockType;
  // link block
  label?: string;
  url?: string;
  description?: string;
  icon?: string;
  style?: "default" | "featured" | "outline";
  position?: number;
  // text block
  content?: string;    // markdown-style free text
  // poll block
  question?: string;
  options?: string[];  // poll option labels
  // lead-form block
  title?: string;        // Form heading
  formDescription?: string;  // Form subtitle
  buttonText?: string;   // Submit button label
}

interface BuilderState {
  // Step 1
  name: string;
  email: string;
  password: string;
  useCase: string;
  // Step 2
  username: string;
  title: string;
  bio: string;
  location: string;
  accentColor: string;
  phone: string;
  contactEmail: string;
  // Step 3
  links: PageLink[];
  blocks: Block[];
  // Background / AI theme
  background: string;
  font?: string;
  blockStyle?: string;
}

const ACCENT_COLORS = [
  { label: "Amber", value: "#e06b1a" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Teal", value: "#0891b2" },
  { label: "Emerald", value: "#059669" },
  { label: "Rose", value: "#e11d48" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Slate", value: "#334155" },
  { label: "Custom", value: "custom" },
];

// ─── 20 CSS-class gradient backgrounds ───────────────────────────────────────
// The `value` is the CSS class name applied directly to the page wrapper.
// The `preview` is an inline gradient used for the swatch preview in the builder.
export const BACKGROUND_OPTIONS: { label: string; value: string; preview: string; dark?: boolean }[] = [
  { label: "None",     value: "none",      preview: "#f5f4f2" },
  { label: "Aurora",   value: "bg-aurora",  preview: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",  dark: true },
  { label: "Blush",    value: "bg-blush",   preview: "linear-gradient(135deg, #f8e1e7 0%, #fce4ec 40%, #f48fb1 100%)" },
  { label: "Dusk",     value: "bg-dusk",    preview: "linear-gradient(160deg, #2d1b69 0%, #11998e 100%)",               dark: true },
  { label: "Ember",    value: "bg-ember",   preview: "linear-gradient(135deg, #1a0505 0%, #3d0c02 40%, #b5451b 100%)", dark: true },
  { label: "Fog",      value: "bg-fog",     preview: "linear-gradient(135deg, #e0e0e0 0%, #efefef 50%, #d3cce3 100%)" },
  { label: "Forest",   value: "bg-forest",  preview: "linear-gradient(160deg, #0a2e1f 0%, #1a4a2e 50%, #2d6a4f 100%)", dark: true },
  { label: "Glacier",  value: "bg-glacier", preview: "linear-gradient(135deg, #e8f4f8 0%, #c8e6f0 50%, #a8d5e8 100%)" },
  { label: "Haze",     value: "bg-haze",    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",               dark: true },
  { label: "Ivory",    value: "bg-ivory",   preview: "linear-gradient(135deg, #fefefe 0%, #f5f0e8 50%, #ede0c8 100%)" },
  { label: "Lava",     value: "bg-lava",    preview: "linear-gradient(160deg, #1a0000 0%, #4a0000 40%, #e53935 100%)", dark: true },
  { label: "Midnight", value: "bg-midnight",preview: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)", dark: true },
  { label: "Mint",     value: "bg-mint",    preview: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)" },
  { label: "Mocha",    value: "bg-mocha",   preview: "linear-gradient(160deg, #2c1810 0%, #4a2c1a 50%, #8b5a2b 100%)", dark: true },
  { label: "Ocean",    value: "bg-ocean",   preview: "linear-gradient(135deg, #0c1445 0%, #0a3d62 50%, #006994 100%)", dark: true },
  { label: "Peach",    value: "bg-peach",   preview: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 50%, #ffcc80 100%)" },
  { label: "Plum",     value: "bg-plum",    preview: "linear-gradient(135deg, #2d1b33 0%, #4a2d55 50%, #7b4f9e 100%)", dark: true },
  { label: "Rose",     value: "bg-rose",    preview: "linear-gradient(160deg, #1a0010 0%, #4a0025 40%, #c2185b 100%)", dark: true },
  { label: "Sand",     value: "bg-sand",    preview: "linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 50%, #d4c4a0 100%)" },
  { label: "Slate",    value: "bg-slate",   preview: "linear-gradient(135deg, #1e2a38 0%, #2d3f55 50%, #3d5a7a 100%)", dark: true },
  { label: "Twilight", value: "bg-twilight",preview: "linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", dark: true },
];

// ─── Legacy: kept so old pattern references don't break at runtime ──────────────────
export const PATTERN_OPTIONS = [
  { label: "None",          value: "none" },
  // Organic / nature
  { label: "Topography",    value: "topography" },
  { label: "Botanica",      value: "botanica" },
  { label: "Constellations",value: "constellations" },
  { label: "Ripples",       value: "ripples" },
  // Textural
  { label: "Linen",         value: "linen" },
  { label: "Paper",         value: "paper" },
  { label: "Grain",         value: "grain" },
  // Structural
  { label: "Circuit",       value: "circuit" },
  { label: "Herringbone",   value: "herringbone" },
  { label: "Art Deco",      value: "art-deco" },
  { label: "Blueprint",     value: "blueprint" },
  { label: "Isometric",     value: "isometric" },
  { label: "Terrazzo",      value: "terrazzo" },
  // Playful
  { label: "Squiggles",     value: "squiggles" },
  { label: "Confetti",      value: "confetti" },
  { label: "Bubbles",       value: "bubbles" },
  { label: "Mosaic",        value: "mosaic" },
  { label: "Patchwork",     value: "patchwork" },
  // Classic
  { label: "Waves",         value: "waves" },
  { label: "Dots",          value: "dots" },
];

// Colour options for page background (paired with a pattern)
// 20 options: mix of professional neutrals, rich darks, and creative gradients
// All chosen so body text remains readable with good contrast.
// G7: exactly 19 named colours + custom RGB (handled by colour picker below)
export const COLOR_OPTIONS = [
  // --- Neutrals (4) ---
  { label: "Cream",      value: "warm-white",    preview: "#fef9f4" },
  { label: "Parchment",  value: "warm-sand",     preview: "#f5e6c8" },
  { label: "Stone",      value: "stone",         preview: "#e7e5e4" },
  { label: "Butter",     value: "butter",        preview: "#fef9c3" },
  // --- Pastels (4) ---
  { label: "Mint",       value: "mint",          preview: "#d1fae5" },
  { label: "Lavender",   value: "lavender",      preview: "#ede9fe" },
  { label: "Powder",     value: "powder",        preview: "#dbeafe" },
  { label: "Blush",      value: "blush",         preview: "#fce7f3" },
  // --- Rich Darks (5) ---
  { label: "Charcoal",   value: "charcoal",      preview: "#1e293b" },
  { label: "Midnight",   value: "midnight",      preview: "#0f172a" },
  { label: "Deep Navy",  value: "midnight-blue", preview: "#1e3a5f" },
  { label: "Espresso",   value: "espresso",      preview: "#2c1a0e" },
  { label: "Aubergine",  value: "deep-purple",   preview: "#2d1b69" },
  // --- Gradients (6) ---
  { label: "Peach",      value: "rose",          preview: "linear-gradient(135deg, #ffe4e6, #fecdd3)" },
  { label: "Sunset",     value: "sunset",        preview: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)" },
  { label: "Sky",        value: "cool-blue",     preview: "linear-gradient(135deg, #dbeafe, #bfdbfe)" },
  { label: "Ocean",      value: "ocean",         preview: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)" },
  { label: "Sage",       value: "sage",          preview: "linear-gradient(135deg, #d1fae5, #a7f3d0)" },
  { label: "Aurora",     value: "aurora",        preview: "linear-gradient(135deg, #a855f7 0%, #06b6d4 50%, #10b981 100%)" },
];

// ─── Background helpers (new CSS-class system) ───────────────────────────────
// Dark backgrounds are flagged in BACKGROUND_OPTIONS. Used to auto-set text colour.
export function getBackgroundLuminance(bg: string | null | undefined): "dark" | "light" {
  if (!bg || bg === "none") return "light";
  // New CSS class system
  if (bg.startsWith("bg-")) {
    const opt = BACKGROUND_OPTIONS.find(o => o.value === bg);
    return opt?.dark ? "dark" : "light";
  }
  // Legacy JSON system
  if (bg.startsWith("{")) {
    try {
      const parsed = JSON.parse(bg);
      const color = parsed.color || "";
      const darkColors = new Set(["charcoal", "midnight", "midnight-blue", "deep-purple", "espresso", "forest", "ocean", "aurora", "sunset"]);
      if (darkColors.has(color)) return "dark";
    } catch { /* ignore */ }
  }
  return "light";
}

// Returns the CSS class name for new-format backgrounds, or {} for legacy/none
export function backgroundToCss(bg: string | null | undefined): React.CSSProperties {
  if (!bg || bg === "none") return {};
  // New CSS-class system: class is applied directly to the element — no inline style needed
  if (bg.startsWith("bg-")) return {};
  // Legacy JSON system — basic fallback so old profiles don't break
  if (bg.startsWith("{")) {
    try {
      const parsed = JSON.parse(bg);
      const color = parsed.color as string | undefined;
      if (!color || color === "none") return {};
      const legacyMap: Record<string, React.CSSProperties> = {
        "warm-white": { backgroundColor: "#fef9f4" },
        "warm-sand": { backgroundColor: "#f5e6c8" },
        "stone": { backgroundColor: "#e7e5e4" },
        "charcoal": { backgroundColor: "#1e293b", color: "#f1f5f9" },
        "midnight": { backgroundColor: "#0f172a", color: "#f1f5f9" },
        "espresso": { backgroundColor: "#2c1a0e", color: "#fef9f4" },
        "deep-purple": { backgroundColor: "#2d1b69", color: "#e9d5ff" },
        "mint": { backgroundColor: "#d1fae5" },
        "lavender": { backgroundColor: "#ede9fe" },
        "butter": { backgroundColor: "#fef9c3" },
        "powder": { backgroundColor: "#dbeafe" },
        "blush": { backgroundColor: "#fce7f3" },
        "rose": { background: "linear-gradient(135deg, #ffe4e6, #fecdd3)" },
        "sage": { background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" },
        "ocean": { background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)", color: "#fff" },
        "aurora": { background: "linear-gradient(135deg, #a855f7 0%, #06b6d4 50%, #10b981 100%)", color: "#fff" },
        "sunset": { background: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)", color: "#fff" },
      };
      if (color.startsWith("#")) return { backgroundColor: color };
      return legacyMap[color] || {};
    } catch { /* ignore */ }
  }
  return {};
}

// Used by ProfilePage to get the CSS class to apply to the page wrapper
export function backgroundToClass(bg: string | null | undefined): string {
  if (!bg || bg === "none") return "";
  if (bg.startsWith("bg-")) return bg;
  return "";
}

// Unified icon set used everywhere — empty string means "no icon" (default)
const BLOCK_ICONS = ["", "🔗", "📅", "📧", "📄", "💼", "🎥", "📱", "⬇️", "⭐", "💬", "🌐", "📊", "🎓", "🛒", "📝", "🗳️", "📞", "🎯", "🤝", "🚀", "🏆"];

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

// ─── Live preview pane ────────────────────────────────────────
function LivePreview({ state }: { state: BuilderState }) {
  const accent = state.accentColor || "#e06b1a";
  return (
    <div style={{ position: "sticky", top: 80, maxHeight: "calc(100vh - 100px)", overflow: "auto" }}>
      <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-faint)", marginBottom: "0.75rem", textAlign: "center" }}>
        Live preview
      </div>
      {/* Phone shell */}
      <div style={{ border: "3px solid var(--color-border)", borderRadius: "2rem", overflow: "hidden", background: "var(--color-surface)", boxShadow: "var(--shadow-xl)", maxWidth: 300, margin: "0 auto" }}>
        {/* Status bar */}
        <div style={{ height: 28, background: "var(--color-surface-offset)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 60, height: 4, background: "var(--color-border)", borderRadius: 999 }} />
        </div>

        <div style={{ padding: "1.25rem 1rem 2rem", background: "#fff" /* Always light preview */ }}>
          {/* Hero */}
          <div style={{ textAlign: "center", marginBottom: "1rem", padding: "1.25rem 0.75rem", background: `linear-gradient(135deg, ${accent}18, ${accent}06)`, borderRadius: "1rem", border: `1px solid ${accent}20` }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 800, margin: "0 auto 0.625rem", border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
              {(state.name || "Y").charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", color: "#1a1917" }}>{state.name || "Your Name"}</div>
            <div style={{ fontSize: 11, color: "#6b6966", marginTop: 2 }}>{state.title || "Your title here"}</div>
            {state.location && <div style={{ fontSize: 10, color: "#b0aeab", marginTop: 4 }}>📍 {state.location}</div>}
          </div>

          {/* Bio */}
          {state.bio && (
            <div style={{ fontSize: 11, color: "#6b6966", lineHeight: 1.6, marginBottom: "0.75rem", padding: "0.625rem 0.75rem", background: "#f7f6f4", borderRadius: 8 }}>
              {state.bio.slice(0, 100)}{state.bio.length > 100 ? "…" : ""}
            </div>
          )}

          {/* Links */}
          {state.links.slice(0, 4).map((link, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.75rem", marginBottom: "0.5rem", borderRadius: 8,
              background: link.style === "featured" ? accent : "#f7f6f4",
              color: link.style === "featured" ? "#fff" : "#1a1917",
              fontSize: 11, fontWeight: 600, border: link.style === "featured" ? "none" : "1px solid #e2e1de"
            }}>
              <span style={{ fontSize: 14 }}>{link.icon}</span>
              <span style={{ flex: 1 }}>{link.label || "Link label"}</span>
              <span style={{ opacity: 0.6 }}>→</span>
            </div>
          ))}

          {state.links.length === 0 && (
            <div style={{ textAlign: "center", padding: "1rem", color: "#b0aeab", fontSize: 11 }}>
              Add links in step 3
            </div>
          )}

          {/* Lead form preview */}
          <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#f7f6f4", borderRadius: 8, border: "1px solid #e2e1de" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b6966", marginBottom: "0.375rem" }}>Send a message</div>
            <div style={{ height: 22, background: "white", borderRadius: 4, border: "1px solid #d8d7d4", marginBottom: "0.375rem" }} />
            <div style={{ height: 22, background: "white", borderRadius: 4, border: "1px solid #d8d7d4", marginBottom: "0.5rem" }} />
            <div style={{ height: 26, background: accent, borderRadius: 4 }} />
          </div>

          {/* Powered by */}
          <div style={{ textAlign: "center", marginTop: "0.75rem", fontSize: 9, color: "#b0aeab" }}>
            Built with linkbay.ai
          </div>
        </div>
      </div>

      {/* URL slug preview */}
      <div style={{ textAlign: "center", marginTop: "1rem", padding: "0.625rem 1rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600 }}>
        linkbay.ai/{state.username || "your-name"}
      </div>
    </div>
  );
}

// ─── Step 1: Profile info ─────────────────────────────────────
function Step1({ state, update }: { state: BuilderState; update: (v: Partial<BuilderState>) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const useCases = [
    { id: "consultant", icon: "💼", label: "Consultant / Coach" },
    { id: "creator", icon: "🎨", label: "Creator / Influencer" },
    { id: "recruiter", icon: "🔍", label: "Recruiter / HR" },
    { id: "founder", icon: "⚡", label: "Founder / Startup" },
    { id: "agency", icon: "📣", label: "Agency" },
    { id: "other", icon: "✦", label: "Other" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>
        Let's build your page
      </h2>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Start with the basics — takes less than 3 minutes.</p>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-faint)", marginBottom: "2rem" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>Sign in instead →</Link>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Your name *</label>
          <input className="input" placeholder="Sarah Jones" value={state.name} onChange={e => update({ name: e.target.value })} required data-testid="input-builder-name" />
        </div>
        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Email address *</label>
          <input type="email" className="input" placeholder="sarah@company.com" value={state.email} onChange={e => update({ email: e.target.value })} required data-testid="input-builder-email" />
        </div>
        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Create a password *</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              className="input"
              placeholder="Min. 8 characters"
              value={state.password}
              onChange={e => update({ password: e.target.value })}
              required
              data-testid="input-builder-password"
              style={{ paddingRight: "3.5rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 12, fontWeight: 600 }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {state.password.length > 0 && state.password.length < 8 && (
            <p style={{ fontSize: 11, color: "var(--color-error)", marginTop: 4 }}>At least 8 characters required.</p>
          )}
          <p style={{ fontSize: 10, color: "var(--color-text-faint)", marginTop: 4 }}>You'll use this password to log back in to your dashboard.</p>
        </div>

        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.75rem" }}>What best describes you? *</label>
          <div className="usecase-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
            {useCases.map(uc => (
              <button
                key={uc.id}
                type="button"
                onClick={() => update({ useCase: uc.id })}
                style={{
                  padding: "0.875rem 0.75rem", borderRadius: "var(--radius-md)", cursor: "pointer",
                  background: state.useCase === uc.id ? "var(--color-primary-highlight)" : "var(--color-surface)",
                  border: `1.5px solid ${state.useCase === uc.id ? "var(--color-primary)" : "var(--color-border)"}`,
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  fontSize: "var(--text-sm)", fontWeight: 600,
                  color: state.useCase === uc.id ? "var(--color-primary)" : "var(--color-text)",
                  transition: "all var(--transition-interactive)"
                }}
                data-testid={`button-usecase-${uc.id}`}
              >
                <span style={{ fontSize: 18 }}>{uc.icon}</span> {uc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── AI Suggestions (between Step 1 and Step 2) ───────────────────────────
const AI_SUGGESTIONS: Record<string, Array<{ type: "link" | "text" | "poll"; label: string; icon: string; description: string; url?: string; question?: string; options?: string[]; content?: string; style?: "default" | "featured" | "outline" }>> = {
  consultant: [
    { type: "link", label: "Book a call", icon: "📅", description: "Let people book time with you directly", url: "https://calendly.com", style: "featured" },
    { type: "link", label: "My services", icon: "💼", description: "Outline what you offer", url: "", style: "default" },
    { type: "text", label: "Testimonial block", icon: "⭐", description: "Add a short quote from a happy client", content: "\"Working with me transformed the way we operate. Book a call to find out how I can help you.\"" },
    { type: "link", label: "Lead enquiry form", icon: "📧", description: "Capture new client enquiries", url: "", style: "outline" },
  ],
  creator: [
    { type: "link", label: "Latest video / content", icon: "🎥", description: "Link to your newest YouTube or podcast", url: "", style: "featured" },
    { type: "link", label: "Newsletter / subscribe", icon: "📧", description: "Grow your email list", url: "", style: "default" },
    { type: "link", label: "Shop / merch", icon: "🛒", description: "Send fans to your store", url: "", style: "default" },
    { type: "poll", label: "Audience poll", icon: "🗳️", description: "Ask what content they want more of", question: "What content do you want more of?", options: ["Tutorials", "Vlogs", "Q&As"] },
  ],
  recruiter: [
    { type: "link", label: "View open roles", icon: "🔗", description: "Direct candidates to your current vacancies", url: "", style: "featured" },
    { type: "link", label: "LinkedIn profile", icon: "💼", description: "Let candidates connect with you", url: "", style: "default" },
    { type: "link", label: "Contact / apply", icon: "📧", description: "Make it easy to reach you", url: "", style: "default" },
    { type: "text", label: "Candidate FAQ", icon: "📝", description: "Answer common candidate questions", content: "Looking for your next opportunity? I specialise in [your niche]. Drop me a message or click an open role above to apply." },
  ],
  founder: [
    { type: "link", label: "Join the waitlist", icon: "🚀", description: "Capture early interest in your product", url: "", style: "featured" },
    { type: "link", label: "Investor deck", icon: "📊", description: "Share your pitch deck", url: "", style: "default" },
    { type: "link", label: "Build in public updates", icon: "🌐", description: "Share your progress thread or blog", url: "", style: "default" },
    { type: "poll", label: "Feature priority poll", icon: "🗳️", description: "Get feedback on what to build next", question: "Which feature matters most to you?", options: ["Speed", "Integrations", "Design", "Analytics"] },
  ],
  coach: [
    { type: "link", label: "Book a session", icon: "📅", description: "Let clients book with you", url: "https://calendly.com", style: "featured" },
    { type: "link", label: "Free resource / guide", icon: "⬇️", description: "Give away a lead magnet", url: "", style: "default" },
    { type: "text", label: "Client testimonial", icon: "⭐", description: "Social proof that builds trust", content: "\"The coaching sessions completely changed my perspective. I\u2019d recommend it to anyone serious about growth.\"" },
    { type: "link", label: "Instagram / social", icon: "📱", description: "Connect on social media", url: "", style: "default" },
  ],
  agency: [
    { type: "link", label: "Our portfolio", icon: "🏆", description: "Showcase your best work", url: "", style: "featured" },
    { type: "link", label: "Book a discovery call", icon: "📅", description: "Start new client conversations", url: "https://calendly.com", style: "default" },
    { type: "link", label: "Services deck", icon: "📄", description: "Download our services overview", url: "", style: "default" },
    { type: "link", label: "Partner / referral enquiry", icon: "🤝", description: "For partnership opportunities", url: "", style: "outline" },
  ],
  other: [
    { type: "link", label: "My main link", icon: "🔗", description: "Your most important destination", url: "", style: "featured" },
    { type: "link", label: "Contact me", icon: "📧", description: "Make it easy to reach you", url: "", style: "default" },
    { type: "text", label: "About me", icon: "📝", description: "A short intro about who you are", content: "Hi! I'm here to help with [your focus area]. Reach out or browse the links below." },
  ],
};

const USE_CASE_LABELS: Record<string, string> = {
  consultant: "Consultant / Coach",
  creator: "Creator / Influencer",
  recruiter: "Recruiter / HR",
  founder: "Founder / Startup",
  coach: "Coach",
  agency: "Agency",
  other: "Professional",
};

// Map AI-returned blocks to builder Block[] and PageLink[]
function mapAiBlocks(aiBlocks: any[]): { links: PageLink[]; blocks: Block[] } {
  const links: PageLink[] = [];
  const blocks: Block[] = [];
  const genId = () => "blk-" + Math.random().toString(36).slice(2, 8);
  (aiBlocks || []).forEach((b: any) => {
    switch (b.type) {
      case "link":
        links.push({ label: b.title || b.label || "Link", url: b.url || "", icon: "🔗", style: "default", description: b.description, position: links.length });
        break;
      case "text":
        blocks.push({ id: genId(), type: "text", content: b.content || "" });
        break;
      case "poll":
        blocks.push({ id: genId(), type: "poll", question: b.question || "Quick question", options: b.options || ["Option A", "Option B"] });
        break;
      case "lead_form":
        blocks.push({ id: genId(), type: "lead-form", title: b.title || "Get in touch", description: b.description || "", buttonText: b.buttonText || "Send" } as any);
        break;
      case "socials":
        blocks.push({ id: genId(), type: "social-links", links: b.links || [] } as any);
        break;
      case "video":
        blocks.push({ id: genId(), type: "video", url: b.url || "", title: b.title || "" } as any);
        break;
      case "countdown":
        blocks.push({ id: genId(), type: "countdown", title: b.title || "Launching soon", targetDate: b.targetDate || "2026-01-01" } as any);
        break;
      default: break;
    }
  });
  return { links, blocks };
}

function AISuggestionsStep({
  state,
  update,
  onContinue,
}: {
  state: BuilderState;
  update: (v: Partial<BuilderState>) => void;
  onContinue: () => void;
}) {
  const roleLabel = USE_CASE_LABELS[state.useCase] || "Professional";
  const [aiStatus, setAiStatus] = useState<"loading" | "done" | "error">("loading");
  const [aiResult, setAiResult] = useState<{ links: PageLink[]; blocks: Block[]; background?: string; accentColor?: string } | null>(null);
  const [aiError, setAiError] = useState("");

  // Fetch AI suggestions on mount
  useEffect(() => {
    let cancelled = false;
    const useCaseGoals: Record<string, string> = {
      consultant: "Get consulting clients and showcase expertise",
      creator: "Grow audience and share content",
      recruiter: "Connect with candidates and share job opportunities",
      founder: "Attract investors and early users",
      coach: "Book coaching sessions and share resources",
      agency: "Showcase services and get leads",
      other: "Share links and connect with people",
    };
    apiRequest("POST", "/api/ai/generate-page", {
      answers: {
        name: state.name,
        tagline: `${roleLabel} — ${useCaseGoals[state.useCase] || "Professional"}`,
        goal: useCaseGoals[state.useCase] || "Share links and connect",
        industry: roleLabel,
        style: "clean, modern, professional",
      },
    })
      .then(res => res.json())
      .then((data: any) => {
        if (cancelled) return;
        if (data.error) { setAiError(data.error); setAiStatus("error"); return; }
        const { links, blocks } = mapAiBlocks(data.blocks || []);
        setAiResult({ links, blocks, background: data.background, accentColor: data.accentColor });
        setAiStatus("done");
      })
      .catch(() => {
        if (!cancelled) { setAiError("Could not reach AI service."); setAiStatus("error"); }
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAndContinue = () => {
    if (!aiResult) return;
    update({
      links: aiResult.links,
      blocks: aiResult.blocks,
      ...(aiResult.background && aiResult.background !== "none" ? { background: aiResult.background } : {}),
      ...(aiResult.accentColor ? { accentColor: aiResult.accentColor } : {}),
    });
    onContinue();
  };

  // Loading state
  if (aiStatus === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: "1.25rem", textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          border: "3px solid var(--color-primary)",
          borderTopColor: "transparent",
          animation: "spin 0.9s linear infinite",
        }} />
        <div>
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: 4 }}>
            Building your AI page...
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            GPT-4o is personalising your {roleLabel} page
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error fallback
  if (aiStatus === "error") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🤖</div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", lineHeight: 1.2 }}>AI unavailable</h2>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          {aiError || "AI generation failed."} You can continue without AI suggestions.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button type="button" onClick={() => { update({ links: [], blocks: [] }); onContinue(); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} data-testid="button-skip-suggestions">Start blank</button>
          <button type="button" onClick={() => { setAiStatus("loading"); setAiError(""); }} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>Retry</button>
        </div>
      </div>
    );
  }

  // Done — show AI results
  const totalItems = (aiResult?.links.length ?? 0) + (aiResult?.blocks.length ?? 0);
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🤖</div>
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", lineHeight: 1.2 }}>
            Your AI-generated page
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: 2 }}>
            Personalised for a <strong>{roleLabel}</strong> by GPT-4o
          </p>
        </div>
      </div>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-faint)", marginBottom: "1.25rem" }}>
        GPT-4o has generated {totalItems} item{totalItems !== 1 ? "s" : ""} for your page — links, blocks, and a colour theme. You can edit everything in step 3.
      </p>

      {/* Summary cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {(aiResult?.links || []).map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-lg)", border: "1.5px solid var(--color-primary)", background: "var(--color-primary-highlight)" }}>
            <span style={{ fontSize: 18 }}>🔗</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)" }}>{l.label}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.url}</div>
            </div>
            <span style={{ fontSize: 10, padding: "0.2rem 0.5rem", borderRadius: 999, background: "var(--color-surface-offset)", color: "var(--color-text-faint)", fontWeight: 600, textTransform: "uppercase" as const }}>link</span>
          </div>
        ))}
        {(aiResult?.blocks || []).map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-lg)", border: "1.5px solid var(--color-primary)", background: "var(--color-primary-highlight)" }}>
            <span style={{ fontSize: 18 }}>{(b as any).type === "text" ? "📝" : (b as any).type === "poll" ? "📊" : (b as any).type === "lead-form" ? "📬" : (b as any).type === "social-links" ? "🔗" : (b as any).type === "video" ? "🎥" : (b as any).type === "countdown" ? "⏳" : "🧩"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)", textTransform: "capitalize" as const }}>{b.type} block</div>
              <div style={{ fontSize: 11, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(b as any).content || (b as any).question || (b as any).title || ""}</div>
            </div>
            <span style={{ fontSize: 10, padding: "0.2rem 0.5rem", borderRadius: 999, background: "#f0fdf4", color: "#166534", fontWeight: 600, textTransform: "uppercase" as const }}>{(b as any).type}</span>
          </div>
        ))}
        {aiResult?.accentColor && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: aiResult.accentColor, flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)" }} />
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Accent colour: <span style={{ color: aiResult.accentColor }}>{aiResult.accentColor}</span></div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" onClick={() => { update({ links: [], blocks: [] }); onContinue(); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: "var(--text-sm)" }} data-testid="button-skip-suggestions">
          Start blank
        </button>
        <button type="button" onClick={applyAndContinue} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} data-testid="button-apply-suggestions">
          Apply AI suggestions →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Page design ──────────────────────────────────────
function Step2({ state, update }: { state: BuilderState; update: (v: Partial<BuilderState>) => void }) {
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [customColor, setCustomColor] = useState(state.accentColor);
  const [aiThemeStatus, setAiThemeStatus] = useState<"idle" | "loading" | "done" | "error">(
    state.font ? "done" : "idle"
  );
  const [aiTheme, setAiTheme] = useState<{ background: string; blockStyle: string; font: string } | null>(
    state.font ? { background: state.background, blockStyle: state.blockStyle || "default", font: state.font } : null
  );

  // Auto-fill username from name
  useEffect(() => {
    if (state.name && !state.username) {
      update({ username: slugify(state.name) });
    }
  }, []);

  const checkUsername = async (val: string) => {
    if (!val || val.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    try {
      const res = await apiRequest("GET", `/api/pages/check/${val}`);
      const data = await res.json();
      setUsernameStatus(data.available ? "available" : "taken");
    } catch { setUsernameStatus("idle"); }
  };

  const fetchAiTheme = async (accentColor: string) => {
    setAiThemeStatus("loading");
    setAiTheme(null);
    try {
      const res = await fetch("/api/ai/builder-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accentColor, useCase: state.useCase }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setAiThemeStatus("error"); return; }
      setAiTheme(data);
      update({ background: data.background, blockStyle: data.blockStyle, font: data.font });
      setAiThemeStatus("done");
    } catch { setAiThemeStatus("error"); }
  };

  const FONT_LABELS: Record<string, string> = {
    "general-sans": "General Sans",
    "cabinet-grotesk": "Cabinet Grotesk",
    "inter": "Inter",
    "merriweather": "Merriweather",
    "playfair": "Playfair Display",
    "mono": "Monospace",
  };

  const BG_LABELS: Record<string, string> = {
    "none": "Clean white", "bg-warm-white": "Warm white", "bg-warm-sand": "Warm sand",
    "bg-stone": "Stone", "bg-charcoal": "Charcoal", "bg-midnight": "Midnight",
    "bg-espresso": "Espresso", "bg-deep-purple": "Deep purple", "bg-mint": "Mint",
    "bg-lavender": "Lavender", "bg-butter": "Butter", "bg-powder": "Powder blue",
    "bg-blush": "Blush", "bg-aurora": "Aurora", "bg-blush-gradient": "Blush gradient",
    "bg-tropical": "Tropical", "bg-forest": "Forest", "bg-peach-cream": "Peach cream",
    "bg-slate-mist": "Slate mist",
  };

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>
        Design your page
      </h2>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>Choose your URL, headline, and accent colour.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Username */}
        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>
            Your page URL *
          </label>
          <div style={{ display: "flex", alignItems: "center", background: "var(--color-surface)", border: `1.5px solid ${usernameStatus === "available" ? "var(--color-success)" : usernameStatus === "taken" ? "var(--color-error)" : "var(--color-border)"}`, borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            <span style={{ padding: "0 0.625rem", fontSize: "var(--text-sm)", color: "var(--color-text-faint)", background: "var(--color-surface-offset)", borderRight: "1px solid var(--color-border)", height: 44, display: "flex", alignItems: "center", whiteSpace: "nowrap", flexShrink: 0 }}>
              linkbay.ai/
            </span>
            <input
              className="input"
              style={{ border: "none", borderRadius: 0, flex: 1, background: "transparent", outline: "none", boxShadow: "none", fontSize: 16, minWidth: 0 }}
              placeholder="your-name"
              value={state.username}
              onChange={e => {
                const val = slugify(e.target.value);
                update({ username: val });
                checkUsername(val);
              }}
              required
              data-testid="input-username"
            />
            <span style={{ padding: "0 0.625rem", fontSize: 16, flexShrink: 0 }}>
              {usernameStatus === "checking" && "⏳"}
              {usernameStatus === "available" && "✅"}
              {usernameStatus === "taken" && "❌"}
            </span>
          </div>
          {usernameStatus === "taken" && <p style={{ fontSize: 11, color: "var(--color-error)", marginTop: 4 }}>That username is taken. Try another.</p>}
          {usernameStatus === "available" && <p style={{ fontSize: 11, color: "var(--color-success)", marginTop: 4 }}>✓ Available!</p>}
          <p style={{ fontSize: 10, color: "var(--color-text-faint)", marginTop: 4 }}>Lowercase letters, numbers, and hyphens only.</p>
        </div>

        {/* Headline */}
        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>
            Your headline / title *
          </label>
          <input className="input" style={{ fontSize: 16 }} placeholder="Business Strategy Consultant" value={state.title} onChange={e => update({ title: e.target.value })} required data-testid="input-title" />
          <p style={{ fontSize: 10, color: "var(--color-text-faint)", marginTop: 4 }}>What you do, in 5–8 words.</p>
        </div>

        {/* Bio */}
        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>
            Short bio
          </label>
          <textarea className="input" placeholder="I help founders and SMEs build the systems they need to scale. 10+ years. 200+ clients." value={state.bio} onChange={e => update({ bio: e.target.value })} rows={3} style={{ resize: "none", fontSize: 16 }} data-testid="input-bio" />
          <p style={{ fontSize: 10, color: "var(--color-text-faint)", marginTop: 4 }}>{state.bio.length}/180 chars</p>
        </div>

        {/* Location */}
        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Location (optional)</label>
          <input className="input" style={{ fontSize: 16 }} placeholder="London, UK" value={state.location} onChange={e => update({ location: e.target.value })} data-testid="input-location" />
        </div>

        {/* Contact details */}
        <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Phone (optional)</label>
            <input type="tel" className="input" style={{ fontSize: 16 }} placeholder="+44 7700 900000" value={state.phone} onChange={e => update({ phone: e.target.value })} data-testid="input-phone" />
          </div>
          <div>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Contact email (optional)</label>
            <input type="email" className="input" style={{ fontSize: 16 }} placeholder="hi@example.com" value={state.contactEmail} onChange={e => update({ contactEmail: e.target.value })} data-testid="input-contact-email" />
          </div>
        </div>
        <p style={{ fontSize: 10, color: "var(--color-text-faint)", marginTop: -8 }}>These appear on your public profile as clickable contact links.</p>

        {/* Accent colour + AI theme */}
        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.75rem" }}>Accent colour</label>
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {ACCENT_COLORS.filter(c => c.value !== "custom").map(color => (
              <button
                key={color.value}
                type="button"
                onClick={() => { update({ accentColor: color.value }); fetchAiTheme(color.value); }}
                title={color.label}
                style={{ width: 36, height: 36, borderRadius: "50%", background: color.value, border: `3px solid ${state.accentColor === color.value ? "var(--color-text)" : "transparent"}`, cursor: "pointer", transition: "transform var(--transition-interactive)", transform: state.accentColor === color.value ? "scale(1.2)" : "scale(1)", flexShrink: 0 }}
                data-testid={`button-color-${color.label.toLowerCase()}`}
              />
            ))}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <input
                type="color"
                value={customColor}
                onChange={e => { setCustomColor(e.target.value); update({ accentColor: e.target.value }); }}
                onBlur={e => fetchAiTheme(e.target.value)}
                style={{ width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, background: "none" }}
                title="Custom colour"
              />
            </div>
          </div>

          {/* AI theme loading */}
          {aiThemeStatus === "loading" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: "var(--color-primary-highlight)", border: "1px solid var(--color-primary)" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--color-primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 600 }}>AI is picking your theme…</span>
            </div>
          )}

          {/* AI theme result */}
          {aiThemeStatus === "done" && aiTheme && (
            <div style={{ padding: "0.875rem 1rem", borderRadius: "var(--radius-md)", background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                <span style={{ fontSize: 16 }}>✨</span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)" }}>AI picked this theme for you</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "0.25rem 0.625rem", borderRadius: 999, background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
                  🎨 {BG_LABELS[aiTheme.background] || aiTheme.background}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "0.25rem 0.625rem", borderRadius: 999, background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
                  📝 {FONT_LABELS[aiTheme.font] || aiTheme.font}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "0.25rem 0.625rem", borderRadius: 999, background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
                  🧩 {aiTheme.blockStyle} blocks
                </span>
              </div>
            </div>
          )}

          {/* Error fallback */}
          {aiThemeStatus === "error" && (
            <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 4 }}>Couldn't reach AI — a clean default theme will be used.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Icon picker (shared) ─────────────────────────────────────
function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
      {BLOCK_ICONS.map((ic, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(ic)}
          title={ic === "" ? "No icon" : ic}
          style={{
            fontSize: ic === "" ? 11 : 16,
            padding: "0.25rem 0.375rem",
            borderRadius: 4,
            background: value === ic ? "var(--color-primary-highlight)" : "none",
            border: `1.5px solid ${value === ic ? "var(--color-primary)" : "transparent"}`,
            cursor: "pointer",
            color: ic === "" ? "var(--color-text-faint)" : "inherit",
            minWidth: 28,
          }}
        >
          {ic === "" ? "none" : ic}
        </button>
      ))}
    </div>
  );
}

// ─── Step 3: Add links & blocks ──────────────────────────────
function Step3({ state, update }: { state: BuilderState; update: (v: Partial<BuilderState>) => void }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [addMode, setAddMode] = useState<BlockType | null>(null);

  // New link form state
  const [newLink, setNewLink] = useState<Partial<PageLink>>({ label: "", url: "", icon: "", style: "default", description: "" });
  // New text block form state
  const [newText, setNewText] = useState("");
  // New poll form state
  const [newPoll, setNewPoll] = useState({ question: "", options: ["", ""] });

  const genId = () => Math.random().toString(36).slice(2, 10);

  // ─ Link helpers ─
  const addLink = () => {
    if (!newLink.label || !newLink.url) return;
    update({ links: [...state.links, {
      label: newLink.label!,
      url: newLink.url!,
      icon: newLink.icon ?? "",
      style: (newLink.style as any) || "default",
      description: newLink.description || "",
      position: state.links.length,
    }] });
    setNewLink({ label: "", url: "", icon: "", style: "default", description: "" });
    setAddMode(null);
  };

  const removeLink = (idx: number) => update({ links: state.links.filter((_, i) => i !== idx) });
  const updateLink = (idx: number, field: string, val: string) =>
    update({ links: state.links.map((l, i) => i === idx ? { ...l, [field]: val } : l) });

  // Lead form state
  const [newLeadForm, setNewLeadForm] = useState({ title: "Get in touch", formDescription: "I'd love to hear from you", buttonText: "Send message" });

  // ─ Block helpers ─
  const addTextBlock = () => {
    if (!newText.trim()) return;
    const block: Block = { id: genId(), type: "text", content: newText };
    update({ blocks: [...state.blocks, block] });
    setNewText("");
    setAddMode(null);
  };

  const addPollBlock = () => {
    if (!newPoll.question.trim() || newPoll.options.filter(o => o.trim()).length < 2) return;
    const block: Block = {
      id: genId(),
      type: "poll",
      question: newPoll.question,
      options: newPoll.options.filter(o => o.trim()),
    };
    update({ blocks: [...state.blocks, block] });
    setNewPoll({ question: "", options: ["", ""] });
    setAddMode(null);
  };

  const addLeadFormBlock = () => {
    const block: Block = {
      id: genId(),
      type: "lead-form",
      title: newLeadForm.title || "Get in touch",
      formDescription: newLeadForm.formDescription || "I'd love to hear from you",
      buttonText: newLeadForm.buttonText || "Send message",
    };
    update({ blocks: [...state.blocks, block] });
    setNewLeadForm({ title: "Get in touch", formDescription: "I'd love to hear from you", buttonText: "Send message" });
    setAddMode(null);
  };

  const removeBlock = (id: string) => update({ blocks: state.blocks.filter(b => b.id !== id) });

  const allItems = [
    ...state.links.map((l, i) => ({ kind: "link" as const, idx: i, l })),
    ...state.blocks.map(b => ({ kind: "block" as const, b })),
  ];

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>
        Build your page
      </h2>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>Add links, free text blocks, and polls. You can edit them later in your dashboard.</p>

      {/* Existing links */}
      {state.links.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1rem" }}>
          {state.links.map((link, idx) => (
            <div key={idx} style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", cursor: "pointer" }} onClick={() => setEditing(editing === idx ? null : idx)}>
                <span style={{ fontSize: 18, minWidth: 24, textAlign: "center" }}>{link.icon || "—"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.label}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.url}</div>
                </div>
                <span style={{ fontSize: 10, padding: "0.15rem 0.5rem", borderRadius: 999, background: link.style === "featured" ? "var(--color-primary-highlight)" : "var(--color-surface-offset)", color: link.style === "featured" ? "var(--color-primary)" : "var(--color-text-faint)", fontWeight: 600, flexShrink: 0 }}>
                  link
                </span>
                <button onClick={e => { e.stopPropagation(); removeLink(idx); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 16, padding: "0.25rem", flexShrink: 0 }} aria-label="Remove link">×</button>
              </div>
              {editing === idx && (
                <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid var(--color-divider)", background: "var(--color-surface-offset)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  <input className="input" placeholder="Label" value={link.label} onChange={e => updateLink(idx, "label", e.target.value)} style={{ fontSize: 13 }} />
                  <input className="input" placeholder="URL (https://...)" value={link.url} onChange={e => updateLink(idx, "url", e.target.value)} style={{ fontSize: 13 }} />
                  <input className="input" placeholder="Short description (optional)" value={link.description || ""} onChange={e => updateLink(idx, "description", e.target.value)} style={{ fontSize: 13 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.375rem" }}>Icon (none by default):</div>
                    <IconPicker value={link.icon} onChange={v => updateLink(idx, "icon", v)} />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {["default", "featured", "outline"].map(style => (
                      <button key={style} type="button" onClick={() => updateLink(idx, "style", style)} style={{ flex: 1, padding: "0.375rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${link.style === style ? "var(--color-primary)" : "var(--color-border)"}`, background: link.style === style ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 11, fontWeight: 600, color: link.style === style ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer" }}>
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Existing blocks */}
      {state.blocks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1rem" }}>
          {state.blocks.map(block => (
            <div key={block.id} style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "0.75rem 1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, marginTop: 2 }}>{block.type === "text" ? "📝" : block.type === "poll" ? "🗳️" : "📧"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {block.type === "text" && (
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as any}>
                    {block.content}
                  </div>
                )}
                {block.type === "poll" && (
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>{block.question}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 2 }}>{block.options?.join(" / ")}</div>
                  </div>
                )}
                {block.type === "lead-form" && (
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>{block.title || "Lead Capture Form"}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 2 }}>{block.buttonText || "Send message"}</div>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, padding: "0.15rem 0.5rem", borderRadius: 999, background: block.type === "lead-form" ? "rgba(224,107,26,0.1)" : "var(--color-surface-offset)", color: block.type === "lead-form" ? "var(--color-primary)" : "var(--color-text-faint)", fontWeight: 600, flexShrink: 0 }}>
                {block.type}
              </span>
              <button onClick={() => removeBlock(block.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 16, padding: "0.25rem", flexShrink: 0 }} aria-label="Remove block">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Add block type selector */}
      {addMode === null && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { type: "link" as BlockType, icon: "🔗", label: "Link" },
            { type: "text" as BlockType, icon: "📝", label: "Free text" },
            { type: "poll" as BlockType, icon: "🗳️", label: "Poll" },
            { type: "lead-form" as BlockType, icon: "📧", label: "Lead form" },
          ].map(opt => (
            <button
              key={opt.type}
              type="button"
              onClick={() => setAddMode(opt.type)}
              className="btn btn-secondary"
              style={{ gap: "0.375rem" }}
              data-testid={`button-add-${opt.type}`}
            >
              {opt.icon} Add {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Add link form */}
      {addMode === "link" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>🔗 Add a link</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <input className="input" placeholder="Label (e.g. Book a call)" value={newLink.label} onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))} style={{ fontSize: 13 }} data-testid="input-new-link-label" />
            <input className="input" placeholder="URL (https://...)" value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} style={{ fontSize: 13 }} data-testid="input-new-link-url" />
            <input className="input" placeholder="Short description (optional)" value={newLink.description} onChange={e => setNewLink(l => ({ ...l, description: e.target.value }))} style={{ fontSize: 13 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.375rem" }}>Icon (none by default):</div>
              <IconPicker value={newLink.icon ?? ""} onChange={v => setNewLink(l => ({ ...l, icon: v }))} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {["default", "featured"].map(style => (
                <button key={style} type="button" onClick={() => setNewLink(l => ({ ...l, style: style as any }))} style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${newLink.style === style ? "var(--color-primary)" : "var(--color-border)"}`, background: newLink.style === style ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 11, fontWeight: 600, color: newLink.style === style ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer" }}>
                  {style === "featured" ? "⭐ Featured" : "Default"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addLink} disabled={!newLink.label || !newLink.url} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} data-testid="button-add-link">Add link</button>
            </div>
          </div>
        </div>
      )}

      {/* Add text block form */}
      {addMode === "text" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>📝 Free text block</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <textarea
              className="input"
              placeholder="Write anything — a welcome note, your story, services, FAQs…"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              rows={5}
              style={{ resize: "vertical", fontSize: 13 }}
              data-testid="input-new-text-content"
            />
            <p style={{ fontSize: 10, color: "var(--color-text-faint)" }}>{newText.length}/600 chars</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addTextBlock} disabled={!newText.trim()} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} data-testid="button-add-text">Add text block</button>
            </div>
          </div>
        </div>
      )}

      {/* Add poll block form */}
      {addMode === "poll" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>🗳️ Poll block</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <input
              className="input"
              placeholder="Poll question (e.g. What brings you here?)"
              value={newPoll.question}
              onChange={e => setNewPoll(p => ({ ...p, question: e.target.value }))}
              style={{ fontSize: 13 }}
              data-testid="input-poll-question"
            />
            {newPoll.options.map((opt, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  className="input"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={e => setNewPoll(p => { const o = [...p.options]; o[i] = e.target.value; return { ...p, options: o }; })}
                  style={{ fontSize: 13, flex: 1 }}
                  data-testid={`input-poll-option-${i}`}
                />
                {newPoll.options.length > 2 && (
                  <button type="button" onClick={() => setNewPoll(p => ({ ...p, options: p.options.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 16, padding: "0.25rem" }}>×</button>
                )}
              </div>
            ))}
            {newPoll.options.length < 6 && (
              <button type="button" onClick={() => setNewPoll(p => ({ ...p, options: [...p.options, ""] }))} className="btn btn-secondary" style={{ fontSize: 12, justifyContent: "center" }}>+ Add option</button>
            )}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addPollBlock} disabled={!newPoll.question.trim() || newPoll.options.filter(o => o.trim()).length < 2} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} data-testid="button-add-poll">Add poll</button>
            </div>
          </div>
        </div>
      )}

      {/* Add lead-form block form */}
      {addMode === "lead-form" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>📧 Lead Capture Form</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Form title</label>
              <input
                className="input"
                placeholder="Get in touch"
                value={newLeadForm.title}
                onChange={e => setNewLeadForm(f => ({ ...f, title: e.target.value }))}
                style={{ fontSize: 13 }}
                data-testid="input-lead-form-title"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Description</label>
              <input
                className="input"
                placeholder="I'd love to hear from you"
                value={newLeadForm.formDescription}
                onChange={e => setNewLeadForm(f => ({ ...f, formDescription: e.target.value }))}
                style={{ fontSize: 13 }}
                data-testid="input-lead-form-description"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Button text</label>
              <input
                className="input"
                placeholder="Send message"
                value={newLeadForm.buttonText}
                onChange={e => setNewLeadForm(f => ({ ...f, buttonText: e.target.value }))}
                style={{ fontSize: 13 }}
                data-testid="input-lead-form-button"
              />
            </div>
            <p style={{ fontSize: 10, color: "var(--color-text-faint)" }}>
              This adds a contact form to your page that captures leads to your dashboard.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addLeadFormBlock} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} data-testid="button-add-lead-form">Add lead form</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Launch 🚀 ────────────────────────────────────────
function StepLaunch({ state, pageUrl, onStartOver }: { state: BuilderState; pageUrl: string; onStartOver: () => void }) {
  const fullUrl = `${window.location.origin}/${state.username}`;

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.75rem" }}>
        Your page is live, {state.name.split(" ")[0]}!
      </h2>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
        Share your Linkbay page and start capturing leads today.
      </p>

      {/* Page URL */}
      <div className="launch-url-row" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "var(--color-surface-offset)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "0.875rem 1rem", alignItems: "center" }}>
        <span style={{ flex: 1, fontSize: "var(--text-sm)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          linkbay.ai/{state.username}
        </span>
        <button
          onClick={() => navigator.clipboard?.writeText(fullUrl)}
          className="btn btn-primary btn-sm"
          data-testid="button-copy-url"
        >
          Copy link
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
        <Link href={pageUrl} className="btn btn-primary btn-lg" style={{ justifyContent: "center" }} data-testid="button-view-live-page">
          View my live page →
        </Link>
        <Link href="/dashboard" className="btn btn-secondary" style={{ justifyContent: "center" }}>
          Open dashboard
        </Link>
      </div>

      <div style={{ padding: "1.25rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-lg)", textAlign: "left" }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.75rem" }}>What's next?</div>
        {[
          { icon: "📊", text: "Track your first visitors in the analytics dashboard" },
          { icon: "✉️", text: "Share your link in your Instagram, LinkedIn and email bio" },
          { icon: "🤖", text: "Run an AI audit to optimise your conversion rate" },
          { icon: "🔗", text: "Add more links and blocks from the editor" },
        ].map(item => (
          <div key={item.text} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.625rem", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main builder ─────────────────────────────────────────────
export default function BuilderPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [state, setState] = useState<BuilderState>({
    name: "", email: "", password: "", useCase: "",
    username: "", title: "", bio: "", location: "", accentColor: "#e06b1a",
    phone: "", contactEmail: "",
    links: [], blocks: [], background: "none", font: undefined, blockStyle: undefined,
  });

  const update = (val: Partial<BuilderState>) => setState(s => ({ ...s, ...val }));

  const canNext = {
    1: () => state.name.trim() && state.email.trim() && state.password.length >= 8 && state.useCase,
    2: () => state.username.trim().length >= 3 && state.title.trim(),
    3: () => true,
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/builder/create", {
        email: state.email,
        name: state.name,
        password: state.password,
        username: state.username,
        title: state.title,
        bio: state.bio,
        location: state.location,
        accentColor: state.accentColor,
        useCase: state.useCase,
        phone: state.phone,
        contactEmail: state.contactEmail,
        blocks: JSON.stringify(state.blocks),
        links: state.links.map((l, i) => ({ ...l, position: i })),
        // Encode bg + blockStyle together so the page editor can read both fields
        background: state.font
          ? JSON.stringify({ bgValue: state.background, blockStyle: state.blockStyle || "default" })
          : state.background,
        font: state.font,
      });
      if (!res.ok) {
        const d = await res.json();
        const err = new Error(d.error || "Failed to create page") as any;
        err.status = res.status;
        throw err;
      }
      return res.json();
    },
    onSuccess: (data) => {
      // data.pageUrl is /username — convert to hash route for pplx.app deployment
      setPageUrl(data.pageUrl);
      // Invalidate auth cache so header + dashboard pick up the new session
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setStep(4);
    },
    onError: (err: any) => {
      if (err.status === 409) {
        setIsDuplicateEmail(true);
        setError("");
      } else {
        setIsDuplicateEmail(false);
        setError(err.message);
      }
    },
  });

  const { theme } = useTheme();

  const TOTAL_STEPS = 3;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)" }}>
      {/* Top bar */}
      <div style={{ height: 56, background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", padding: "0 1.5rem", gap: "1rem", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ color: "var(--color-text)", textDecoration: "none" }}>
          <svg width="100" height="26" viewBox="0 0 120 32" fill="none">
            <rect x="0" y="4" width="10" height="24" rx="3" fill="currentColor" opacity="0.9"/>
            <rect x="13" y="9" width="10" height="19" rx="3" fill="currentColor" opacity="0.7"/>
            <rect x="26" y="14" width="10" height="14" rx="3" fill="var(--color-primary)"/>
            <text x="42" y="22" fontFamily="Cabinet Grotesk, sans-serif" fontWeight="800" fontSize="17" fill="currentColor" letterSpacing="-0.5">linkbay</text>
          </svg>
        </Link>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
          {step < 4 && Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{ height: 4, width: 48, borderRadius: 999, background: i < step ? "var(--color-primary)" : "var(--color-surface-dynamic)", transition: "background 0.3s ease" }} />
          ))}
        </div>
        {step < 4 && (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", fontWeight: 600 }}>
            Step {showSuggestions ? "1" : step} of {TOTAL_STEPS}
          </span>
        )}
      </div>

      <div className="builder-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, minHeight: "calc(100dvh - 56px)" }}>
        {/* Left — form */}
        <div style={{ padding: "3rem 2.5rem", maxWidth: 560, overflowY: "auto" }}>
          {step === 1 && !showSuggestions && <Step1 state={state} update={update} />}
          {step === 1 && showSuggestions && (
            <AISuggestionsStep
              state={state}
              update={update}
              onContinue={() => { setShowSuggestions(false); setStep(2); setError(""); }}
            />
          )}
          {step === 2 && <Step2 state={state} update={update} />}
          {step === 3 && <Step3 state={state} update={update} />}
          {step === 4 && <StepLaunch state={state} pageUrl={pageUrl} onStartOver={() => { setState({ name: "", email: "", password: "", useCase: "", username: "", title: "", bio: "", location: "", accentColor: "#e06b1a", phone: "", contactEmail: "", links: [], blocks: [], background: "none", font: undefined, blockStyle: undefined }); setStep(1); setShowSuggestions(false); }} />}

          {/* Duplicate email notice */}
          {isDuplicateEmail && (
            <div style={{ marginTop: "1rem", padding: "0.875rem 1rem", background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
              An account with this email already exists.{" "}
              <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 700, textDecoration: "none" }}>
                Sign in instead →
              </Link>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: "1rem", padding: "0.875rem 1rem", background: "var(--color-error)18", border: "1.5px solid var(--color-error)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
              {error}
            </div>
          )}

          {/* Nav buttons — hidden during suggestions step (it has its own actions) */}
          {step < 4 && !showSuggestions && (
            <div className="builder-nav-btns" style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
              {step > 1 && (
                <button onClick={() => { setStep(s => s - 1); setError(""); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", minHeight: "2.75rem" }}>
                  ← Back
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={() => {
                    if ((canNext as any)[step]?.()) {
                      if (step === 1) {
                        // Show AI suggestions before moving to step 2
                        setShowSuggestions(true);
                        setError("");
                      } else {
                        setStep(s => s + 1); setError("");
                      }
                    }
                  }}
                  disabled={!(canNext as any)[step]?.()}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: "center", minHeight: "2.75rem" }}
                  data-testid="button-next"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={() => { setError(""); publishMutation.mutate(); }}
                  disabled={publishMutation.isPending}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: "center", minHeight: "2.75rem" }}
                  data-testid="button-publish"
                >
                  {publishMutation.isPending ? "Publishing…" : "🚀 Publish my page"}
                </button>
              )}
            </div>
          )}
          {/* Back button during suggestions step */}
          {step < 4 && showSuggestions && (
            <div style={{ marginTop: "0.5rem" }}>
              <button
                onClick={() => { setShowSuggestions(false); setError(""); }}
                className="btn btn-secondary"
                style={{ fontSize: "var(--text-sm)" }}
              >
                ← Back to step 1
              </button>
            </div>
          )}
        </div>

        {/* Right — live preview */}
        <div className="builder-preview" style={{ background: "var(--color-surface-offset)", borderLeft: "1px solid var(--color-border)", padding: "3rem 2.5rem", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
          <LivePreview state={state} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 820px) {
          .builder-grid { grid-template-columns: 1fr !important; }
          .builder-preview { display: none !important; }
          .builder-grid > div:first-child { padding: 1.5rem 1.25rem !important; max-width: 100% !important; }
          .builder-nav-btns { margin-top: 1.5rem !important; }
          .builder-nav-btns .btn { min-height: 2.75rem !important; font-size: 0.9375rem !important; }
        }
        @media (max-width: 480px) {
          .usecase-grid { grid-template-columns: 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          /* iOS: prevent zoom on input focus */
          .builder-grid input, .builder-grid textarea, .builder-grid select { font-size: 16px !important; }
          /* Step 3 block type buttons — larger touch targets */
          .block-type-btn { min-height: 2.75rem !important; padding: 0.625rem 0.75rem !important; }
          /* StepLaunch copy row */
          .launch-url-row { flex-direction: column !important; }
          .launch-url-row .btn { width: 100% !important; justify-content: center !important; }
        }
      `}</style>
    </div>
  );
}
