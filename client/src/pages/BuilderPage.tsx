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
type BlockType = "link" | "text" | "poll" | "lead-form" | "video" | "countdown" | "social-links" | "vcard" | "image" | "divider" | "button" | "testimonial" | "faq";

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
  // video block
  videoUrl?: string;
  // countdown block
  targetDate?: string;
  // social-links block
  links?: { platform: string; url: string }[];
  // vcard block
  vcName?: string;
  vcJobTitle?: string;
  vcCompany?: string;
  vcPhone?: string;
  vcEmail?: string;
  vcWebsite?: string;
  // image block
  src?: string;
  alt?: string;
  caption?: string;
  // divider block
  dividerStyle?: "solid" | "dashed" | "dotted" | "double" | "gradient";
  thickness?: string;
  // button block (reuses title + url)
  // testimonial block
  quote?: string;
  author?: string;
  authorRole?: string;
  // faq block
  faqs?: { q: string; a: string }[];
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
  // JSON wrapper system: {"bgValue":"bg-midnight","blockStyle":"sharp"}
  if (bg.startsWith("{")) {
    try {
      const parsed = JSON.parse(bg);
      // New bgValue wrapper format
      if (parsed.bgValue) return getBackgroundLuminance(parsed.bgValue);
      // Legacy color-key format
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
      // Unwrap bgValue JSON wrapper: {"bgValue":"bg-midnight","blockStyle":"sharp"}
      if (parsed.bgValue) return backgroundToCss(parsed.bgValue);
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
  // Unwrap bgValue JSON wrapper: {"bgValue":"bg-midnight","blockStyle":"sharp"}
  if (bg.startsWith("{")) {
    try { const p = JSON.parse(bg); if (p.bgValue) return backgroundToClass(p.bgValue); } catch { /* ignore */ }
  }
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


// ─── AI Q&A Wizard ───────────────────────────────────────────
const USE_CASE_LABELS: Record<string, string> = {
  consultant: "Consultant / Coach",
  creator: "Creator / Influencer",
  recruiter: "Recruiter / HR",
  founder: "Founder / Startup",
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
        blocks.push({ id: genId(), type: "lead-form", title: b.title || "Get in touch", formDescription: b.description || "", buttonText: b.buttonText || "Send" });
        break;
      case "socials":
        blocks.push({ id: genId(), type: "social-links", links: (b.links || []).map((l: any) => ({ platform: l.platform || "", url: l.url || "" })) });
        break;
      case "video":
        blocks.push({ id: genId(), type: "video", videoUrl: b.url || "", title: b.title || "" });
        break;
      case "countdown":
        blocks.push({ id: genId(), type: "countdown", title: b.title || "Launching soon", targetDate: b.targetDate || "2026-12-31" });
        break;
      default: break;
    }
  });
  return { links, blocks };
}

// Use-case-specific follow-up questions
const USE_CASE_FOLLOWUP: Record<string, { question: string; sublabel: string; options: Array<{ value: string; icon: string }> }> = {
  consultant: {
    question: "How do clients typically work with you?",
    sublabel: "This helps AI add the right call-to-action blocks.",
    options: [
      { value: "1:1 calls or sessions", icon: "📅" },
      { value: "Project-based engagements", icon: "📋" },
      { value: "Online courses or programmes", icon: "🎓" },
      { value: "Retainer / ongoing work", icon: "🔄" },
    ],
  },
  creator: {
    question: "Where is your main audience?",
    sublabel: "AI will add links and social blocks that fit your platform.",
    options: [
      { value: "YouTube / video", icon: "▶️" },
      { value: "Instagram / TikTok", icon: "📸" },
      { value: "Newsletter / blog", icon: "✉️" },
      { value: "Podcast / audio", icon: "🎙️" },
    ],
  },
  recruiter: {
    question: "What's your primary focus?",
    sublabel: "Helps AI tailor the page for the right audience.",
    options: [
      { value: "Attracting candidates", icon: "🔍" },
      { value: "Building client pipeline", icon: "💼" },
      { value: "Both candidates & clients", icon: "🤝" },
      { value: "Internal talent / HR", icon: "🏢" },
    ],
  },
  founder: {
    question: "What stage is your startup at?",
    sublabel: "Helps AI create the right blocks (waitlist vs investors etc.).",
    options: [
      { value: "Idea / pre-launch", icon: "💡" },
      { value: "MVP / beta testing", icon: "🔧" },
      { value: "Fundraising", icon: "💰" },
      { value: "Live and growing", icon: "🚀" },
    ],
  },
  agency: {
    question: "What's your main service area?",
    sublabel: "AI will build a portfolio and lead-gen focused page.",
    options: [
      { value: "Marketing & advertising", icon: "📣" },
      { value: "Design & branding", icon: "🎨" },
      { value: "Web & tech development", icon: "💻" },
      { value: "PR & communications", icon: "📰" },
    ],
  },
  other: {
    question: "What do you mainly want visitors to do?",
    sublabel: "Shapes the blocks and calls to action AI picks.",
    options: [
      { value: "Contact or hire me", icon: "📧" },
      { value: "Follow my work", icon: "👁️" },
      { value: "Buy a product or service", icon: "🛒" },
      { value: "Learn about me", icon: "📖" },
    ],
  },
};

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
  type Phase = "qa" | "generating" | "done" | "error";
  const [inputMode, setInputMode] = useState<"questions" | "import">("questions");
  const [phase, setPhase] = useState<Phase>("qa");
  const [qaStep, setQaStep] = useState(0);
  const [answers, setAnswers] = useState({
    tagline: "",
    goal: "",
    followup: "",
    accentColor: state.accentColor || "#e06b1a",
  });
  const [customAccent, setCustomAccent] = useState(state.accentColor || "#e06b1a");
  const [aiBlocks, setAiBlocks] = useState<{ links: PageLink[]; blocks: Block[] } | null>(null);
  const [aiTheme, setAiTheme] = useState<{ background: string; blockStyle: string; font: string } | null>(null);
  const [aiError, setAiError] = useState("");
  // URL import
  const [importUrls, setImportUrls] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  const handleUrlImport = async () => {
    const urls = importUrls.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 0);
    if (!urls.length) return;
    setImportLoading(true);
    setImportError("");
    try {
      // Fetch all URLs in parallel, merge blocks
      const results = await Promise.all(
        urls.map(url =>
          fetch("/api/ai/import-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
            credentials: "include",
          }).then(r => r.json())
        )
      );
      // Use first result for theme, merge all blocks
      const first = results[0];
      if (first?.error) throw new Error(first.error);
      const allBlocks = results.flatMap((r: any) => r?.blocks || []);
      const merged = mapAiBlocks(allBlocks);
      setAiBlocks(merged);
      if (first?.background || first?.blockStyle || first?.fontFamily) {
        setAiTheme({ background: first.background || "", blockStyle: first.blockStyle || "", font: first.fontFamily || "" });
      }
      if (first?.accentColor) update({ accentColor: first.accentColor });
      if (first?.title) update({ title: first.title });
      if (first?.bio) update({ bio: first.bio });
      setPhase("done");
    } catch (e: any) {
      setImportError(e.message || "Import failed. Please try again.");
    } finally {
      setImportLoading(false);
    }
  };

  const followupQ = USE_CASE_FOLLOWUP[state.useCase] || USE_CASE_FOLLOWUP.other;

  // 4 steps: tagline → goal → followup → accent
  const TOTAL_QA = 4;

  const canAdvance = () => {
    if (qaStep === 0) return answers.tagline.trim().length >= 5;
    if (qaStep === 1) return answers.goal.trim().length > 0;
    if (qaStep === 2) return answers.followup.trim().length > 0;
    if (qaStep === 3) return true; // accent always has a value
    return true;
  };

  const handleGenerate = () => {
    setPhase("generating");
    const selectedAccent = answers.accentColor;
    update({ accentColor: selectedAccent });

    // Fire both APIs in parallel
    const blocksPromise = fetch("/api/ai/generate-page", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: {
          name: state.name,
          tagline: answers.tagline,
          goal: answers.goal,
          industry: roleLabel,
          style: "clean, modern, professional",
          blockGoal: answers.followup,
        },
      }),
    }).then(r => r.json());

    const themePromise = fetch("/api/ai/builder-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accentColor: selectedAccent,
        useCase: state.useCase,
        tagline: answers.tagline,
        goal: answers.goal,
      }),
    }).then(r => r.json());

    Promise.all([blocksPromise, themePromise])
      .then(([blocksData, themeData]) => {
        if (blocksData?.error) {
          setAiError(blocksData.error);
          setPhase("error");
          return;
        }
        const mapped = mapAiBlocks(blocksData.blocks || []);
        setAiBlocks(mapped);
        setAiTheme(themeData);
        // Pre-apply accent from AI blocks if provided, else keep user's choice
        if (blocksData.accentColor) update({ accentColor: blocksData.accentColor });
        setPhase("done");
      })
      .catch(() => {
        setAiError("Could not reach the AI service. Check your connection and try again.");
        setPhase("error");
      });
  };

  const applyAndContinue = () => {
    if (!aiBlocks) return;
    update({
      accentColor: answers.accentColor,
      links: aiBlocks.links,
      blocks: aiBlocks.blocks,
      ...(aiTheme?.background ? { background: aiTheme.background } : {}),
      ...(aiTheme?.blockStyle ? { blockStyle: aiTheme.blockStyle } : {}),
      ...(aiTheme?.font ? { font: aiTheme.font } : {}),
    });
    onContinue();
  };

  const FONT_LABELS: Record<string, string> = {
    "general-sans": "General Sans", "cabinet-grotesk": "Cabinet Grotesk",
    "inter": "Inter", "merriweather": "Merriweather",
    "playfair": "Playfair Display", "mono": "Monospace",
  };
  const BG_LABELS: Record<string, string> = {
    "bg-warm-white": "Warm white", "bg-warm-sand": "Warm sand", "bg-stone": "Stone",
    "bg-charcoal": "Charcoal", "bg-midnight": "Midnight", "bg-espresso": "Espresso",
    "bg-deep-purple": "Deep purple", "bg-mint": "Mint", "bg-lavender": "Lavender",
    "bg-butter": "Butter", "bg-powder": "Powder blue", "bg-blush": "Blush",
    "bg-aurora": "Aurora", "bg-blush-gradient": "Blush gradient", "bg-tropical": "Tropical",
    "bg-forest": "Forest", "bg-peach-cream": "Peach cream", "bg-slate-mist": "Slate mist",
    "none": "Clean white",
  };

  // ── Phase: Q&A ──────────────────────────────────────────────
  if (phase === "qa") {
    const progress = ((qaStep + 1) / TOTAL_QA) * 100;

    const renderQuestion = () => {
      // Q1 — tagline
      if (qaStep === 0) return (
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.375rem" }}>
            What do you do?
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            One sentence — be specific. AI uses this to write your blocks.
          </p>
          <textarea
            autoFocus
            rows={3}
            value={answers.tagline}
            onChange={e => setAnswers(a => ({ ...a, tagline: e.target.value }))}
            placeholder={
              state.useCase === "consultant" ? "e.g. I help SMEs build sales systems that generate leads without cold calling" :
              state.useCase === "creator" ? "e.g. I make weekly videos on sustainable living and zero-waste cooking" :
              state.useCase === "founder" ? "e.g. I'm building a no-code tool that lets non-developers launch AI agents" :
              state.useCase === "recruiter" ? "e.g. I connect top marketing talent with scale-up companies in London" :
              state.useCase === "agency" ? "e.g. We help e-commerce brands grow through paid social and email marketing" :
              "e.g. I help people learn guitar from absolute beginner to playing full songs"
            }
            style={{ width: "100%", boxSizing: "border-box" as const, padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", fontSize: 16, resize: "none", fontFamily: "inherit", lineHeight: 1.5, outline: "none" }}
            onFocus={e => (e.target.style.borderColor = "var(--color-primary)")}
            onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
          />
          {answers.tagline.length > 0 && answers.tagline.length < 5 && (
            <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 4 }}>Keep going — a bit more detail helps AI.</p>
          )}
        </div>
      );

      // Q2 — goal
      if (qaStep === 1) return (
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.375rem" }}>
            What's the main goal of this page?
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            Pick the one that matters most right now.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {[
              { value: "Get clients or customers", icon: "💼" },
              { value: "Grow my audience", icon: "📈" },
              { value: "Capture leads & emails", icon: "📬" },
              { value: "Promote a launch or event", icon: "🚀" },
              { value: "Share my content", icon: "🎥" },
              { value: "Connect my socials", icon: "🔗" },
            ].map(opt => {
              const active = answers.goal === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswers(a => ({ ...a, goal: opt.value }))}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 0.875rem", borderRadius: "var(--radius-md)", border: `1.5px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`, background: active ? "var(--color-primary-highlight)" : "var(--color-surface)", color: active ? "var(--color-primary)" : "var(--color-text)", fontSize: "var(--text-sm)", fontWeight: active ? 700 : 500, cursor: "pointer", textAlign: "left" as const, minHeight: "2.75rem" }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{opt.icon}</span>
                  <span>{opt.value}</span>
                </button>
              );
            })}
          </div>
        </div>
      );

      // Q3 — use-case followup
      if (qaStep === 2) return (
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.375rem" }}>
            {followupQ.question}
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            {followupQ.sublabel}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {followupQ.options.map(opt => {
              const active = answers.followup === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswers(a => ({ ...a, followup: opt.value }))}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", borderRadius: "var(--radius-md)", border: `1.5px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`, background: active ? "var(--color-primary-highlight)" : "var(--color-surface)", color: active ? "var(--color-primary)" : "var(--color-text)", fontSize: "var(--text-sm)", fontWeight: active ? 700 : 500, cursor: "pointer", textAlign: "left" as const, minHeight: "3rem" }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.icon}</span>
                  <span>{opt.value}</span>
                  {active && <span style={{ marginLeft: "auto", fontSize: 14 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      );

      // Q4 — accent colour
      if (qaStep === 3) return (
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.375rem" }}>
            Pick your accent colour
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            AI will pick a background, font and block style that complement it.
          </p>
          {/* Preset colour swatches — uniform 40×40 grid, 4 per row on mobile */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 40px)", gap: "0.625rem", marginBottom: "1rem" }}>
            {ACCENT_COLORS.filter(c => c.value !== "custom").map(color => {
              const active = answers.accentColor === color.value;
              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => { setAnswers(a => ({ ...a, accentColor: color.value })); setCustomAccent(color.value); }}
                  title={color.label}
                  style={{ width: 40, height: 40, borderRadius: "50%", background: color.value, border: `3px solid ${active ? "var(--color-text)" : "rgba(0,0,0,0.08)"}`, cursor: "pointer", transition: "transform 0.15s", transform: active ? "scale(1.15)" : "scale(1)", outline: active ? "2px solid var(--color-text)" : "none", outlineOffset: 2 }}
                  data-testid={`button-color-${color.label.toLowerCase()}`}
                />
              );
            })}
          </div>
          {/* Custom colour + hex display on one line */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.875rem", borderRadius: "var(--radius-md)", background: "var(--color-surface-offset)", border: "1px solid var(--color-border)" }}>
            <div style={{ position: "relative", width: 32, height: 32, flexShrink: 0 }}>
              <input
                type="color"
                value={customAccent}
                onChange={e => { setCustomAccent(e.target.value); setAnswers(a => ({ ...a, accentColor: e.target.value })); }}
                title="Custom colour"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: "50%", border: "2px solid var(--color-border)", cursor: "pointer", padding: 2, background: "none", opacity: 0.01 }}
              />
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: answers.accentColor, border: "2px solid var(--color-border)", pointerEvents: "none" }} />
            </div>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)", fontFamily: "monospace" }}>{answers.accentColor}</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginLeft: "auto" }}>tap swatch to customise</span>
          </div>
        </div>
      );
      return null;
    };

    return (
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✨</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-faint)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              AI Page Builder{inputMode === "questions" ? ` · ${qaStep + 1} of ${TOTAL_QA}` : ""}
            </div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-muted)" }}>Personalising for {state.name.split(" ")[0] || "you"}</div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.25rem", background: "var(--color-bg)", borderRadius: "var(--radius-md)", padding: "3px", border: "1px solid var(--color-border)" }}>
          {(["questions", "import"] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setInputMode(m); setImportError(""); }}
              style={{ flex: 1, padding: "0.4rem 0.5rem", borderRadius: "calc(var(--radius-md) - 3px)", border: "none", cursor: "pointer", fontSize: 13, fontWeight: inputMode === m ? 700 : 500, background: inputMode === m ? "var(--color-surface)" : "transparent", color: inputMode === m ? "var(--color-primary)" : "var(--color-text-muted)", boxShadow: inputMode === m ? "0 1px 4px rgba(0,0,0,0.10)" : "none", transition: "all 0.15s" }}
            >
              {m === "questions" ? "✍️  Answer questions" : "🔗  Import from URL"}
            </button>
          ))}
        </div>

        {inputMode === "import" ? (
          <div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
              Paste one or more URLs — your LinkedIn, website, YouTube, Substack, Etsy, Calendly etc. AI will read them all and build your page automatically.
            </p>
            {/* Platform chips */}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.375rem", marginBottom: "0.875rem" }}>
              {["LinkedIn","Website","YouTube","Substack","Etsy","Calendly","Instagram"].map(p => (
                <span key={p} style={{ fontSize: 11, fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: 999, background: "var(--color-primary-highlight)", color: "var(--color-primary)" }}>{p}</span>
              ))}
            </div>
            <textarea
              autoFocus
              rows={4}
              value={importUrls}
              onChange={e => setImportUrls(e.target.value)}
              placeholder={"https://linkedin.com/in/yourname\nhttps://yourwebsite.com"}
              style={{ width: "100%", boxSizing: "border-box" as const, padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", fontSize: 13, resize: "none", fontFamily: "monospace", lineHeight: 1.6, marginBottom: "0.5rem", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "var(--color-primary)")}
              onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
            />
            <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "1rem" }}>One URL per line, or separate with commas. Add multiple to give AI more context.</p>
            {importError && <div style={{ fontSize: 13, color: "var(--color-error, #dc2626)", marginBottom: "0.75rem", padding: "0.5rem 0.75rem", background: "rgba(220,38,38,0.08)", borderRadius: "var(--radius-sm)" }}>{importError}</div>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" onClick={() => { update({ links: [], blocks: [] }); onContinue(); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", minHeight: "2.75rem" }}>Skip AI</button>
              <button type="button" onClick={handleUrlImport} disabled={!importUrls.trim() || importLoading} className="btn btn-primary" style={{ flex: 2, justifyContent: "center", minHeight: "2.75rem" }}>
                {importLoading ? "Importing…" : "🔗 Import & Build"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div style={{ height: 3, background: "var(--color-divider)", borderRadius: 999, marginBottom: "1.75rem" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--color-primary)", borderRadius: 999, transition: "width 0.3s" }} />
            </div>

            {renderQuestion()}

            {/* Nav */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
              {qaStep === 0 ? (
                <button type="button" onClick={() => { update({ links: [], blocks: [] }); onContinue(); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: "var(--text-sm)", minHeight: "2.75rem" }} data-testid="button-skip-suggestions">
                  Skip AI
                </button>
              ) : (
                <button type="button" onClick={() => setQaStep(s => s - 1)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", minHeight: "2.75rem" }}>
                  ← Back
                </button>
              )}
              {qaStep < TOTAL_QA - 1 ? (
                <button type="button" onClick={() => setQaStep(s => s + 1)} disabled={!canAdvance()} className="btn btn-primary" style={{ flex: 2, justifyContent: "center", minHeight: "2.75rem" }} data-testid="button-ai-next">
                  Next →
                </button>
              ) : (
                <button type="button" onClick={handleGenerate} className="btn btn-primary" style={{ flex: 2, justifyContent: "center", minHeight: "2.75rem" }} data-testid="button-ai-generate">
                  ✨ Build my page
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Phase: Generating ────────────────────────────────────────
  if (phase === "generating") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: "1.5rem", textAlign: "center", padding: "1rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid var(--color-primary)", borderTopColor: "transparent", animation: "spin 0.9s linear infinite" }} />
        <div>
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.375rem" }}>
            Building your page…
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", maxWidth: 280 }}>
            AI is writing your blocks and picking a theme that works with your accent colour
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Phase: Error ─────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fef2f2", border: "1.5px solid var(--color-error)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚠️</div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>AI unavailable</h2>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          {aiError || "Something went wrong."} You can continue without AI — you'll be able to add blocks manually in step 3.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button type="button" onClick={() => { update({ links: [], blocks: [] }); onContinue(); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", minHeight: "2.75rem" }}>
            Continue without AI
          </button>
          <button type="button" onClick={() => { setPhase("qa"); setQaStep(3); setAiError(""); }} className="btn btn-primary" style={{ flex: 1, justifyContent: "center", minHeight: "2.75rem" }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: Done ───────────────────────────────────────────────
  const totalItems = (aiBlocks?.links.length ?? 0) + (aiBlocks?.blocks.length ?? 0);
  const blockTypeIcon: Record<string, string> = {
    text: "📝", poll: "📊", "lead-form": "📬", "social-links": "🔗",
    video: "🎥", countdown: "⏳", link: "🔗",
  };
  // Issue 5: detect annotated placeholder URLs (e.g. https://[your-website].com)
  const isPlaceholderUrl = (url: string) =>
    /\[your[\-a-z ]+\]/i.test(url) || /example\.com|placeholder\.com/i.test(url);
  const placeholderLinkCount = (aiBlocks?.links || []).filter(l => isPlaceholderUrl(l.url)).length;
  const placeholderBlockCount = (aiBlocks?.blocks || []).filter(b => isPlaceholderUrl((b as any).url || "")).length;
  const totalPlaceholders = placeholderLinkCount + placeholderBlockCount;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🤖</div>
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", lineHeight: 1.2 }}>Your page is ready</h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: 2 }}>
            {totalItems} item{totalItems !== 1 ? "s" : ""} generated — edit anything in step 3
          </p>
        </div>
      </div>

      {/* Theme summary strip */}
      {aiTheme && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", marginBottom: "1rem", marginTop: "0.75rem" }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: answers.accentColor, border: "1.5px solid rgba(0,0,0,0.12)", flexShrink: 0, alignSelf: "center" }} />
          <span style={{ fontSize: 11, fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: 999, background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
            🎨 {BG_LABELS[aiTheme.background] || aiTheme.background}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: 999, background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
            📝 {FONT_LABELS[aiTheme.font] || aiTheme.font}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: 999, background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
            🧩 {aiTheme.blockStyle}
          </span>
        </div>
      )}

      {/* Issue 5: Placeholder URL notice */}
      {totalPlaceholders > 0 && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: "#fffbeb", border: "1.5px solid #f59e0b", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✏️</span>
          <p style={{ fontSize: "var(--text-xs)", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
            <strong>{totalPlaceholders} link{totalPlaceholders !== 1 ? "s" : ""} need your real URL</strong> — update them in step 3 before publishing.
          </p>
        </div>
      )}

      {/* Block list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {(aiBlocks?.links || []).map((l, i) => {
          const isPlaceholder = isPlaceholderUrl(l.url);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-lg)", border: `1.5px solid ${isPlaceholder ? "#f59e0b" : "var(--color-primary)"}`, background: isPlaceholder ? "#fffbeb" : "var(--color-primary-highlight)" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🔗</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: isPlaceholder ? "#92400e" : "var(--color-primary)" }}>{l.label}</div>
                {l.url && <div style={{ fontSize: 11, color: isPlaceholder ? "#b45309" : "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.url}</div>}
              </div>
              <span style={{ fontSize: 10, padding: "0.2rem 0.5rem", borderRadius: 999, background: isPlaceholder ? "#fef3c7" : "var(--color-surface-offset)", color: isPlaceholder ? "#92400e" : "var(--color-text-faint)", fontWeight: 600, textTransform: "uppercase" as const, flexShrink: 0 }}>
                {isPlaceholder ? "✏️ edit" : "link"}
              </span>
            </div>
          );
        })}
        {(aiBlocks?.blocks || []).map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-lg)", border: "1.5px solid var(--color-primary)", background: "var(--color-primary-highlight)" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{blockTypeIcon[(b as any).type] || "🧩"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)", textTransform: "capitalize" as const }}>{(b as any).type} block</div>
              <div style={{ fontSize: 11, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {(b as any).content || (b as any).question || (b as any).title || ""}
              </div>
            </div>
            <span style={{ fontSize: 10, padding: "0.2rem 0.5rem", borderRadius: 999, background: "#f0fdf4", color: "#166534", fontWeight: 600, textTransform: "uppercase" as const, flexShrink: 0 }}>{(b as any).type}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" onClick={() => { update({ links: [], blocks: [] }); onContinue(); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: "var(--text-sm)", minHeight: "2.75rem" }} data-testid="button-skip-suggestions">
          Start blank
        </button>
        <button type="button" onClick={applyAndContinue} className="btn btn-primary" style={{ flex: 2, justifyContent: "center", minHeight: "2.75rem" }} data-testid="button-apply-suggestions">
          Use this page →
        </button>
      </div>
    </div>
  );
}


// ─── Step 2: Page design ──────────────────────────────────────
function Step2({ state, update }: { state: BuilderState; update: (v: Partial<BuilderState>) => void }) {
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

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

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>
        Design your page
      </h2>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>Fill in your page details below.</p>

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
  // Editing state: links use index, blocks use block id
  const [editingLinkIdx, setEditingLinkIdx] = useState<number | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<BlockType | null>(null);

  const genId = () => Math.random().toString(36).slice(2, 10);

  // ─── New-item form state ─────────────────────────────────────
  const [newLink, setNewLink] = useState<Partial<PageLink>>({ label: "", url: "", icon: "", style: "default", description: "" });
  const [newText, setNewText] = useState("");
  const [newPoll, setNewPoll] = useState({ question: "", options: ["", ""] });
  const [newLeadForm, setNewLeadForm] = useState({ title: "Get in touch", formDescription: "I'd love to hear from you", buttonText: "Send message" });
  const [newVideo, setNewVideo] = useState({ videoUrl: "", title: "" });
  const [newCountdown, setNewCountdown] = useState({ title: "", targetDate: "" });
  const [newSocials, setNewSocials] = useState<{ platform: string; url: string }[]>([{ platform: "instagram", url: "" }]);
  const [newVcard, setNewVcard] = useState({ vcName: "", vcJobTitle: "", vcCompany: "", vcPhone: "", vcEmail: "", vcWebsite: "" });
  const [newImage, setNewImage] = useState({ src: "", alt: "", caption: "" });
  const [newButton, setNewButton] = useState({ title: "", url: "" });
  const [newTestimonial, setNewTestimonial] = useState({ quote: "", author: "", authorRole: "" });
  const [newFaqs, setNewFaqs] = useState<{ q: string; a: string }[]>([{ q: "", a: "" }]);

  // ─── Link helpers ────────────────────────────────────────────
  const addLink = () => {
    if (!newLink.label || !newLink.url) return;
    update({ links: [...state.links, { label: newLink.label!, url: newLink.url!, icon: newLink.icon ?? "", style: (newLink.style as any) || "default", description: newLink.description || "", position: state.links.length }] });
    setNewLink({ label: "", url: "", icon: "", style: "default", description: "" });
    setAddMode(null);
  };
  const removeLink = (idx: number) => { update({ links: state.links.filter((_, i) => i !== idx) }); setEditingLinkIdx(null); };
  const updateLink = (idx: number, field: string, val: string) =>
    update({ links: state.links.map((l, i) => i === idx ? { ...l, [field]: val } : l) });

  // ─── Block helpers ───────────────────────────────────────────
  const removeBlock = (id: string) => { update({ blocks: state.blocks.filter(b => b.id !== id) }); setEditingBlockId(null); };
  const updateBlock = (id: string, patch: Partial<Block>) =>
    update({ blocks: state.blocks.map(b => b.id === id ? { ...b, ...patch } : b) });

  const addTextBlock = () => {
    if (!newText.trim()) return;
    update({ blocks: [...state.blocks, { id: genId(), type: "text", content: newText }] });
    setNewText(""); setAddMode(null);
  };
  const addPollBlock = () => {
    if (!newPoll.question.trim() || newPoll.options.filter(o => o.trim()).length < 2) return;
    update({ blocks: [...state.blocks, { id: genId(), type: "poll", question: newPoll.question, options: newPoll.options.filter(o => o.trim()) }] });
    setNewPoll({ question: "", options: ["", ""] }); setAddMode(null);
  };
  const addLeadFormBlock = () => {
    update({ blocks: [...state.blocks, { id: genId(), type: "lead-form", title: newLeadForm.title || "Get in touch", formDescription: newLeadForm.formDescription, buttonText: newLeadForm.buttonText || "Send message" }] });
    setNewLeadForm({ title: "Get in touch", formDescription: "I'd love to hear from you", buttonText: "Send message" }); setAddMode(null);
  };
  const addVideoBlock = () => {
    if (!newVideo.videoUrl.trim()) return;
    update({ blocks: [...state.blocks, { id: genId(), type: "video", videoUrl: newVideo.videoUrl, title: newVideo.title }] });
    setNewVideo({ videoUrl: "", title: "" }); setAddMode(null);
  };
  const addCountdownBlock = () => {
    if (!newCountdown.targetDate) return;
    update({ blocks: [...state.blocks, { id: genId(), type: "countdown", title: newCountdown.title || "Coming soon", targetDate: newCountdown.targetDate }] });
    setNewCountdown({ title: "", targetDate: "" }); setAddMode(null);
  };
  const addSocialsBlock = () => {
    const filled = newSocials.filter(s => s.url.trim());
    if (!filled.length) return;
    update({ blocks: [...state.blocks, { id: genId(), type: "social-links", links: filled }] });
    setNewSocials([{ platform: "instagram", url: "" }]); setAddMode(null);
  };
  const addVcardBlock = () => {
    if (!newVcard.vcName.trim()) return;
    update({ blocks: [...state.blocks, { id: genId(), type: "vcard", ...newVcard }] });
    setNewVcard({ vcName: "", vcJobTitle: "", vcCompany: "", vcPhone: "", vcEmail: "", vcWebsite: "" }); setAddMode(null);
  };
  const addImageBlock = () => {
    if (!newImage.src.trim()) return;
    update({ blocks: [...state.blocks, { id: genId(), type: "image", src: newImage.src, alt: newImage.alt || undefined, caption: newImage.caption || undefined }] });
    setNewImage({ src: "", alt: "", caption: "" }); setAddMode(null);
  };
  const addDividerBlock = () => {
    update({ blocks: [...state.blocks, { id: genId(), type: "divider", dividerStyle: "solid", thickness: "2px" }] });
    setAddMode(null);
  };
  const addButtonBlock = () => {
    if (!newButton.title.trim() || !newButton.url.trim()) return;
    update({ blocks: [...state.blocks, { id: genId(), type: "button", title: newButton.title, url: newButton.url }] });
    setNewButton({ title: "", url: "" }); setAddMode(null);
  };
  const addTestimonialBlock = () => {
    if (!newTestimonial.quote.trim()) return;
    update({ blocks: [...state.blocks, { id: genId(), type: "testimonial", quote: newTestimonial.quote, author: newTestimonial.author || undefined, authorRole: newTestimonial.authorRole || undefined }] });
    setNewTestimonial({ quote: "", author: "", authorRole: "" }); setAddMode(null);
  };
  const addFaqBlock = () => {
    const valid = newFaqs.filter(f => f.q.trim() && f.a.trim());
    if (!valid.length) return;
    update({ blocks: [...state.blocks, { id: genId(), type: "faq", faqs: valid }] });
    setNewFaqs([{ q: "", a: "" }]); setAddMode(null);
  };

  // ─── Icon + label maps ───────────────────────────────────────
  const BLOCK_ICON: Record<string, string> = {
    text: "📝", poll: "🗳️", "lead-form": "📧", video: "🎥",
    countdown: "⏳", "social-links": "🌐", vcard: "💾",
    image: "🖼️", divider: "➖", button: "🔘", testimonial: "💬", faq: "❓",
  };
  const BLOCK_TAG_COLOR: Record<string, { bg: string; color: string }> = {
    "lead-form":    { bg: "rgba(224,107,26,0.12)", color: "var(--color-primary)" },
    countdown:      { bg: "rgba(99,102,241,0.12)", color: "#4f46e5" },
    vcard:          { bg: "rgba(16,185,129,0.12)", color: "#059669" },
    video:          { bg: "rgba(239,68,68,0.12)",  color: "#dc2626" },
    "social-links": { bg: "rgba(59,130,246,0.12)", color: "#2563eb" },
    poll:           { bg: "rgba(245,158,11,0.12)", color: "#d97706" },
    text:           { bg: "var(--color-surface-offset)", color: "var(--color-text-faint)" },
  };

  // ─── Block summary for display card ─────────────────────────
  const blockSummary = (block: Block): string => {
    if (block.type === "text") return block.content?.slice(0, 60) + (block.content && block.content.length > 60 ? "…" : "") || "";
    if (block.type === "poll") return block.question || "";
    if (block.type === "lead-form") return block.title || "Lead form";
    if (block.type === "video") return block.videoUrl || block.title || "Video embed";
    if (block.type === "countdown") return `${block.title || "Countdown"} · ${block.targetDate || ""}`;
    if (block.type === "social-links") return (block.links || []).map(l => l.platform).join(", ") || "Social links";
    if (block.type === "vcard") return [block.vcName, block.vcJobTitle, block.vcCompany].filter(Boolean).join(" · ") || "vCard";
    if (block.type === "image") return block.caption || block.alt || "Image";
    if (block.type === "divider") return block.dividerStyle || "Divider";
    if (block.type === "button") return `${block.title || "Button"} → ${block.url || ""}`;
    if (block.type === "testimonial") return `"${(block.quote || "").slice(0, 50)}${(block.quote || "").length > 50 ? "…" : ""}" — ${block.author || "Anonymous"}`;
    if (block.type === "faq") return `${(block.faqs || []).length} Q&A${(block.faqs || []).length !== 1 ? "s" : ""}`;
    return "";
  };

  const SOCIAL_PLATFORMS = ["instagram","tiktok","youtube","twitter","linkedin","facebook","github","website","other"];

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>
        Build your page
      </h2>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>Add and edit your links and content blocks. All changes are saved when you publish.</p>

      {/* ── Combined item list ── */}
      {(state.links.length > 0 || state.blocks.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1rem" }}>

          {/* Links */}
          {state.links.map((link, idx) => (
            <div key={idx} style={{ background: "var(--color-surface)", border: `1.5px solid ${editingLinkIdx === idx ? "var(--color-primary)" : "var(--color-border)"}`, borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", cursor: "pointer" }} onClick={() => setEditingLinkIdx(editingLinkIdx === idx ? null : idx)}>
                <span style={{ fontSize: 18, minWidth: 24, textAlign: "center" as const, flexShrink: 0 }}>{link.icon || "🔗"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.label}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.url}</div>
                </div>
                <span style={{ fontSize: 10, padding: "0.15rem 0.5rem", borderRadius: 999, background: "var(--color-surface-offset)", color: "var(--color-text-faint)", fontWeight: 600, flexShrink: 0 }}>link</span>
                <button onClick={e => { e.stopPropagation(); removeLink(idx); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 16, padding: "0.25rem", flexShrink: 0 }} aria-label="Remove">×</button>
              </div>
              {editingLinkIdx === idx && (
                <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid var(--color-divider)", background: "var(--color-surface-offset)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  <input className="input" placeholder="Label" value={link.label} onChange={e => updateLink(idx, "label", e.target.value)} style={{ fontSize: 13 }} />
                  <input className="input" placeholder="URL (https://...)" value={link.url} onChange={e => updateLink(idx, "url", e.target.value)} style={{ fontSize: 13 }} />
                  <input className="input" placeholder="Short description (optional)" value={link.description || ""} onChange={e => updateLink(idx, "description", e.target.value)} style={{ fontSize: 13 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.375rem" }}>Icon:</div>
                    <IconPicker value={link.icon} onChange={v => updateLink(idx, "icon", v)} />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {["default","featured","outline"].map(s => (
                      <button key={s} type="button" onClick={() => updateLink(idx, "style", s)} style={{ flex: 1, padding: "0.375rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${link.style === s ? "var(--color-primary)" : "var(--color-border)"}`, background: link.style === s ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 11, fontWeight: 600, color: link.style === s ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer" }}>{s}</button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setEditingLinkIdx(null)} className="btn btn-secondary" style={{ justifyContent: "center", fontSize: 12 }}>Done</button>
                </div>
              )}
            </div>
          ))}

          {/* Blocks */}
          {state.blocks.map(block => {
            const isEditing = editingBlockId === block.id;
            const tagColors = BLOCK_TAG_COLOR[block.type] || BLOCK_TAG_COLOR.text;
            return (
              <div key={block.id} style={{ background: "var(--color-surface)", border: `1.5px solid ${isEditing ? "var(--color-primary)" : "var(--color-border)"}`, borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                {/* Summary row — always tappable */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", cursor: "pointer" }} onClick={() => setEditingBlockId(isEditing ? null : block.id)}>
                  <span style={{ fontSize: 18, minWidth: 24, textAlign: "center" as const, flexShrink: 0 }}>{BLOCK_ICON[block.type] || "🧩"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {blockSummary(block) || <span style={{ color: "var(--color-text-faint)" }}>Tap to edit</span>}
                    </div>
                    {block.type === "poll" && block.options && (
                      <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 1 }}>{block.options.join(" / ")}</div>
                    )}
                    {block.type === "lead-form" && (
                      <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 1 }}>{block.buttonText || "Send message"}</div>
                    )}
                    {block.type === "social-links" && (
                      <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 1 }}>{(block.links || []).length} network{(block.links || []).length !== 1 ? "s" : ""}</div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, padding: "0.15rem 0.5rem", borderRadius: 999, background: tagColors.bg, color: tagColors.color, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" as const }}>{block.type}</span>
                  <button onClick={e => { e.stopPropagation(); removeBlock(block.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 16, padding: "0.25rem", flexShrink: 0 }} aria-label="Remove">×</button>
                </div>

                {/* Inline edit panel */}
                {isEditing && (
                  <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid var(--color-divider)", background: "var(--color-surface-offset)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>

                    {block.type === "text" && (
                      <textarea className="input" rows={4} value={block.content || ""} onChange={e => updateBlock(block.id, { content: e.target.value })} style={{ fontSize: 13, resize: "vertical" }} placeholder="Write anything…" />
                    )}

                    {block.type === "poll" && (
                      <>
                        <input className="input" style={{ fontSize: 13 }} placeholder="Question" value={block.question || ""} onChange={e => updateBlock(block.id, { question: e.target.value })} />
                        {(block.options || ["",""]).map((opt, i) => (
                          <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <input className="input" style={{ fontSize: 13, flex: 1 }} placeholder={`Option ${i+1}`} value={opt} onChange={e => { const opts = [...(block.options || [])]; opts[i] = e.target.value; updateBlock(block.id, { options: opts }); }} />
                            {(block.options || []).length > 2 && (
                              <button type="button" onClick={() => updateBlock(block.id, { options: (block.options || []).filter((_,j) => j !== i) })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 16 }}>×</button>
                            )}
                          </div>
                        ))}
                        {(block.options || []).length < 6 && (
                          <button type="button" onClick={() => updateBlock(block.id, { options: [...(block.options||[]), ""] })} className="btn btn-secondary" style={{ fontSize: 12, justifyContent: "center" }}>+ Add option</button>
                        )}
                      </>
                    )}

                    {block.type === "lead-form" && (
                      <>
                        <input className="input" style={{ fontSize: 13 }} placeholder="Form title" value={block.title || ""} onChange={e => updateBlock(block.id, { title: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Description" value={block.formDescription || ""} onChange={e => updateBlock(block.id, { formDescription: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Button text" value={block.buttonText || ""} onChange={e => updateBlock(block.id, { buttonText: e.target.value })} />
                      </>
                    )}

                    {block.type === "video" && (
                      <>
                        <input className="input" style={{ fontSize: 13 }} placeholder="Video URL (YouTube, Vimeo…)" value={block.videoUrl || ""} onChange={e => updateBlock(block.id, { videoUrl: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Title (optional)" value={block.title || ""} onChange={e => updateBlock(block.id, { title: e.target.value })} />
                      </>
                    )}

                    {block.type === "countdown" && (
                      <>
                        <input className="input" style={{ fontSize: 13 }} placeholder="Countdown title" value={block.title || ""} onChange={e => updateBlock(block.id, { title: e.target.value })} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>Target date</div>
                          <input type="date" className="input" style={{ fontSize: 13 }} value={block.targetDate || ""} onChange={e => updateBlock(block.id, { targetDate: e.target.value })} />
                        </div>
                      </>
                    )}

                    {block.type === "social-links" && (
                      <>
                        {(block.links || []).map((s, i) => (
                          <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <select
                              className="input"
                              style={{ fontSize: 13, flex: "0 0 120px" }}
                              value={s.platform}
                              onChange={e => { const ls = [...(block.links||[])]; ls[i] = { ...ls[i], platform: e.target.value }; updateBlock(block.id, { links: ls }); }}
                            >
                              {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <input className="input" style={{ fontSize: 13, flex: 1 }} placeholder="Profile URL" value={s.url} onChange={e => { const ls = [...(block.links||[])]; ls[i] = { ...ls[i], url: e.target.value }; updateBlock(block.id, { links: ls }); }} />
                            <button type="button" onClick={() => updateBlock(block.id, { links: (block.links||[]).filter((_,j) => j !== i) })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 16 }}>×</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => updateBlock(block.id, { links: [...(block.links||[]), { platform: "instagram", url: "" }] })} className="btn btn-secondary" style={{ fontSize: 12, justifyContent: "center" }}>+ Add network</button>
                      </>
                    )}

                    {block.type === "vcard" && (
                      <>
                        <input className="input" style={{ fontSize: 13 }} placeholder="Full name *" value={block.vcName || ""} onChange={e => updateBlock(block.id, { vcName: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Job title" value={block.vcJobTitle || ""} onChange={e => updateBlock(block.id, { vcJobTitle: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Company" value={block.vcCompany || ""} onChange={e => updateBlock(block.id, { vcCompany: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Phone" value={block.vcPhone || ""} onChange={e => updateBlock(block.id, { vcPhone: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Email" value={block.vcEmail || ""} onChange={e => updateBlock(block.id, { vcEmail: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Website" value={block.vcWebsite || ""} onChange={e => updateBlock(block.id, { vcWebsite: e.target.value })} />
                      </>
                    )}

                    {block.type === "image" && (
                      <>
                        <input className="input" style={{ fontSize: 13 }} placeholder="Image URL" value={block.src || ""} onChange={e => updateBlock(block.id, { src: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Alt text" value={block.alt || ""} onChange={e => updateBlock(block.id, { alt: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Caption" value={block.caption || ""} onChange={e => updateBlock(block.id, { caption: e.target.value })} />
                      </>
                    )}

                    {block.type === "divider" && (
                      <div style={{ fontSize: 11, color: "var(--color-text-faint)", padding: "0.5rem 0" }}>Horizontal rule — no settings needed.</div>
                    )}

                    {block.type === "button" && (
                      <>
                        <input className="input" style={{ fontSize: 13 }} placeholder="Button label *" value={block.title || ""} onChange={e => updateBlock(block.id, { title: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="URL (https://...)" value={block.url || ""} onChange={e => updateBlock(block.id, { url: e.target.value })} />
                      </>
                    )}

                    {block.type === "testimonial" && (
                      <>
                        <textarea className="input" rows={3} style={{ fontSize: 13, resize: "vertical" }} placeholder="Quote *" value={block.quote || ""} onChange={e => updateBlock(block.id, { quote: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Author name" value={block.author || ""} onChange={e => updateBlock(block.id, { author: e.target.value })} />
                        <input className="input" style={{ fontSize: 13 }} placeholder="Author role / company" value={block.authorRole || ""} onChange={e => updateBlock(block.id, { authorRole: e.target.value })} />
                      </>
                    )}

                    {block.type === "faq" && (
                      <>
                        {(block.faqs || []).map((f, i) => (
                          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: 6 }}>
                            <input className="input" style={{ fontSize: 13 }} placeholder="Question" value={f.q} onChange={e => { const arr = [...(block.faqs||[])]; arr[i] = { ...arr[i], q: e.target.value }; updateBlock(block.id, { faqs: arr }); }} />
                            <textarea className="input" rows={2} style={{ fontSize: 13, resize: "vertical" }} placeholder="Answer" value={f.a} onChange={e => { const arr = [...(block.faqs||[])]; arr[i] = { ...arr[i], a: e.target.value }; updateBlock(block.id, { faqs: arr }); }} />
                            {(block.faqs||[]).length > 1 && <button type="button" onClick={() => updateBlock(block.id, { faqs: (block.faqs||[]).filter((_,j) => j !== i) })} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>Remove</button>}
                          </div>
                        ))}
                        <button type="button" onClick={() => updateBlock(block.id, { faqs: [...(block.faqs||[]), { q: "", a: "" }] })} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>+ Add Q&A</button>
                      </>
                    )}

                    <button type="button" onClick={() => setEditingBlockId(null)} className="btn btn-secondary" style={{ justifyContent: "center", fontSize: 12 }}>Done</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add block buttons ── */}
      {addMode === null && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {([
            { type: "link",         icon: "🔗", label: "Link" },
            { type: "text",         icon: "📝", label: "Free text" },
            { type: "lead-form",    icon: "📧", label: "Lead form" },
            { type: "poll",         icon: "🗳️", label: "Poll" },
            { type: "video",        icon: "🎥", label: "Video" },
            { type: "countdown",    icon: "⏳", label: "Countdown" },
            { type: "social-links", icon: "🌐", label: "Socials" },
            { type: "vcard",        icon: "💾", label: "vCard" },
            { type: "image",        icon: "🖼️", label: "Image" },
            { type: "divider",      icon: "➖", label: "Divider" },
            { type: "button",       icon: "🔘", label: "Button" },
            { type: "testimonial",  icon: "💬", label: "Testimonial" },
            { type: "faq",          icon: "❓", label: "FAQ" },
          ] as { type: BlockType; icon: string; label: string }[]).map(opt => (
            <button
              key={opt.type}
              type="button"
              onClick={() => setAddMode(opt.type)}
              className="btn btn-secondary"
              style={{ gap: "0.375rem", justifyContent: "center", fontSize: "var(--text-xs)", minHeight: "2.5rem" }}
              data-testid={`button-add-${opt.type}`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Add forms ── */}

      {/* Link */}
      {addMode === "link" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>🔗 Add a link</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <input className="input" placeholder="Label (e.g. Book a call)" value={newLink.label} onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))} style={{ fontSize: 13 }} data-testid="input-new-link-label" />
            <input className="input" placeholder="URL (https://...)" value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} style={{ fontSize: 13 }} data-testid="input-new-link-url" />
            <input className="input" placeholder="Short description (optional)" value={newLink.description} onChange={e => setNewLink(l => ({ ...l, description: e.target.value }))} style={{ fontSize: 13 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.375rem" }}>Icon:</div>
              <IconPicker value={newLink.icon ?? ""} onChange={v => setNewLink(l => ({ ...l, icon: v }))} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {["default","featured"].map(s => (
                <button key={s} type="button" onClick={() => setNewLink(l => ({ ...l, style: s as any }))} style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${newLink.style === s ? "var(--color-primary)" : "var(--color-border)"}`, background: newLink.style === s ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 11, fontWeight: 600, color: newLink.style === s ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer" }}>
                  {s === "featured" ? "⭐ Featured" : "Default"}
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

      {/* Free text */}
      {addMode === "text" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>📝 Free text block</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <textarea className="input" placeholder="Write anything — a welcome note, your story, services, FAQs…" value={newText} onChange={e => setNewText(e.target.value)} rows={5} style={{ resize: "vertical", fontSize: 13 }} data-testid="input-new-text-content" />
            <p style={{ fontSize: 10, color: "var(--color-text-faint)" }}>{newText.length}/600 chars</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addTextBlock} disabled={!newText.trim()} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} data-testid="button-add-text">Add text block</button>
            </div>
          </div>
        </div>
      )}

      {/* Lead form */}
      {addMode === "lead-form" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>📧 Lead Capture Form</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <input className="input" placeholder="Form title" value={newLeadForm.title} onChange={e => setNewLeadForm(f => ({ ...f, title: e.target.value }))} style={{ fontSize: 13 }} data-testid="input-lead-form-title" />
            <input className="input" placeholder="Description" value={newLeadForm.formDescription} onChange={e => setNewLeadForm(f => ({ ...f, formDescription: e.target.value }))} style={{ fontSize: 13 }} />
            <input className="input" placeholder="Button text" value={newLeadForm.buttonText} onChange={e => setNewLeadForm(f => ({ ...f, buttonText: e.target.value }))} style={{ fontSize: 13 }} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addLeadFormBlock} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} data-testid="button-add-lead-form">Add lead form</button>
            </div>
          </div>
        </div>
      )}

      {/* Poll */}
      {addMode === "poll" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>🗳️ Poll</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <input className="input" placeholder="Question" value={newPoll.question} onChange={e => setNewPoll(p => ({ ...p, question: e.target.value }))} style={{ fontSize: 13 }} data-testid="input-poll-question" />
            {newPoll.options.map((opt, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input className="input" placeholder={`Option ${i+1}`} value={opt} onChange={e => setNewPoll(p => { const o = [...p.options]; o[i] = e.target.value; return { ...p, options: o }; })} style={{ fontSize: 13, flex: 1 }} data-testid={`input-poll-option-${i}`} />
                {newPoll.options.length > 2 && (
                  <button type="button" onClick={() => setNewPoll(p => ({ ...p, options: p.options.filter((_,j) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 16 }}>×</button>
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

      {/* Video */}
      {addMode === "video" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>🎥 Video block</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <input className="input" placeholder="Video URL (YouTube, Vimeo…)" value={newVideo.videoUrl} onChange={e => setNewVideo(v => ({ ...v, videoUrl: e.target.value }))} style={{ fontSize: 13 }} />
            <input className="input" placeholder="Title (optional)" value={newVideo.title} onChange={e => setNewVideo(v => ({ ...v, title: e.target.value }))} style={{ fontSize: 13 }} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addVideoBlock} disabled={!newVideo.videoUrl.trim()} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>Add video</button>
            </div>
          </div>
        </div>
      )}

      {/* Countdown */}
      {addMode === "countdown" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>⏳ Countdown timer</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <input className="input" placeholder="Label (e.g. Launching in…)" value={newCountdown.title} onChange={e => setNewCountdown(c => ({ ...c, title: e.target.value }))} style={{ fontSize: 13 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>Target date *</div>
              <input type="date" className="input" value={newCountdown.targetDate} onChange={e => setNewCountdown(c => ({ ...c, targetDate: e.target.value }))} style={{ fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addCountdownBlock} disabled={!newCountdown.targetDate} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>Add countdown</button>
            </div>
          </div>
        </div>
      )}

      {/* Social links */}
      {addMode === "social-links" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>🌐 Social links block</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {newSocials.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select className="input" style={{ fontSize: 13, flex: "0 0 110px" }} value={s.platform} onChange={e => setNewSocials(arr => arr.map((x,j) => j===i ? {...x, platform: e.target.value} : x))}>
                  {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input className="input" style={{ fontSize: 13, flex: 1 }} placeholder="Profile URL" value={s.url} onChange={e => setNewSocials(arr => arr.map((x,j) => j===i ? {...x, url: e.target.value} : x))} />
                {newSocials.length > 1 && (
                  <button type="button" onClick={() => setNewSocials(arr => arr.filter((_,j) => j!==i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 16 }}>×</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setNewSocials(arr => [...arr, { platform: "instagram", url: "" }])} className="btn btn-secondary" style={{ fontSize: 12, justifyContent: "center" }}>+ Add network</button>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addSocialsBlock} disabled={!newSocials.some(s => s.url.trim())} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>Add socials</button>
            </div>
          </div>
        </div>
      )}

      {/* vCard */}
      {addMode === "vcard" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.375rem" }}>💾 vCard block</div>
          <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "0.875rem" }}>Adds a &ldquo;Save contact&rdquo; button so visitors can download your details.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <input className="input" placeholder="Full name *" value={newVcard.vcName} onChange={e => setNewVcard(v => ({ ...v, vcName: e.target.value }))} style={{ fontSize: 13 }} />
            <input className="input" placeholder="Job title" value={newVcard.vcJobTitle} onChange={e => setNewVcard(v => ({ ...v, vcJobTitle: e.target.value }))} style={{ fontSize: 13 }} />
            <input className="input" placeholder="Company" value={newVcard.vcCompany} onChange={e => setNewVcard(v => ({ ...v, vcCompany: e.target.value }))} style={{ fontSize: 13 }} />
            <input className="input" placeholder="Phone" value={newVcard.vcPhone} onChange={e => setNewVcard(v => ({ ...v, vcPhone: e.target.value }))} style={{ fontSize: 13 }} />
            <input className="input" placeholder="Email" value={newVcard.vcEmail} onChange={e => setNewVcard(v => ({ ...v, vcEmail: e.target.value }))} style={{ fontSize: 13 }} />
            <input className="input" placeholder="Website" value={newVcard.vcWebsite} onChange={e => setNewVcard(v => ({ ...v, vcWebsite: e.target.value }))} style={{ fontSize: 13 }} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addVcardBlock} disabled={!newVcard.vcName.trim()} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>Add vCard</button>
            </div>
          </div>
        </div>
      )}

      {/* Image */}
      {addMode === "image" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>🖼️ Add an image</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <input className="input" placeholder="Image URL (https://...)" value={newImage.src} onChange={e => setNewImage(v => ({ ...v, src: e.target.value }))} style={{ fontSize: 13 }} />
            <input className="input" placeholder="Alt text (accessibility)" value={newImage.alt} onChange={e => setNewImage(v => ({ ...v, alt: e.target.value }))} style={{ fontSize: 13 }} />
            <input className="input" placeholder="Caption (optional)" value={newImage.caption} onChange={e => setNewImage(v => ({ ...v, caption: e.target.value }))} style={{ fontSize: 13 }} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addImageBlock} disabled={!newImage.src.trim()} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>Add image</button>
            </div>
          </div>
        </div>
      )}

      {/* Divider — one-click add */}
      {addMode === "divider" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.5rem" }}>➖ Add a divider</div>
          <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "0.875rem" }}>A horizontal line to visually separate content blocks.</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            <button type="button" onClick={addDividerBlock} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>Add divider</button>
          </div>
        </div>
      )}

      {/* Button */}
      {addMode === "button" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>🔘 Add a button</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <input className="input" placeholder="Button label (e.g. Book a call)" value={newButton.title} onChange={e => setNewButton(v => ({ ...v, title: e.target.value }))} style={{ fontSize: 13 }} />
            <input className="input" placeholder="URL (https://...)" value={newButton.url} onChange={e => setNewButton(v => ({ ...v, url: e.target.value }))} style={{ fontSize: 13 }} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addButtonBlock} disabled={!newButton.title.trim() || !newButton.url.trim()} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>Add button</button>
            </div>
          </div>
        </div>
      )}

      {/* Testimonial */}
      {addMode === "testimonial" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>💬 Add a testimonial</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <textarea className="input" placeholder="Quote *" rows={3} value={newTestimonial.quote} onChange={e => setNewTestimonial(v => ({ ...v, quote: e.target.value }))} style={{ fontSize: 13, resize: "vertical" }} />
            <input className="input" placeholder="Author name (optional)" value={newTestimonial.author} onChange={e => setNewTestimonial(v => ({ ...v, author: e.target.value }))} style={{ fontSize: 13 }} />
            <input className="input" placeholder="Author role / company (optional)" value={newTestimonial.authorRole} onChange={e => setNewTestimonial(v => ({ ...v, authorRole: e.target.value }))} style={{ fontSize: 13 }} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addTestimonialBlock} disabled={!newTestimonial.quote.trim()} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>Add testimonial</button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      {addMode === "faq" && (
        <div style={{ background: "var(--color-surface-offset)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>❓ Add a FAQ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {newFaqs.map((f, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: 6 }}>
                <input className="input" placeholder="Question" value={f.q} onChange={e => { const arr = [...newFaqs]; arr[i] = { ...arr[i], q: e.target.value }; setNewFaqs(arr); }} style={{ fontSize: 13 }} />
                <textarea className="input" placeholder="Answer" rows={2} value={f.a} onChange={e => { const arr = [...newFaqs]; arr[i] = { ...arr[i], a: e.target.value }; setNewFaqs(arr); }} style={{ fontSize: 13, resize: "vertical" }} />
                {newFaqs.length > 1 && <button type="button" onClick={() => setNewFaqs(newFaqs.filter((_, j) => j !== i))} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>Remove</button>}
              </div>
            ))}
            <button type="button" onClick={() => setNewFaqs([...newFaqs, { q: "", a: "" }])} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>+ Add Q&A</button>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setAddMode(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button type="button" onClick={addFaqBlock} disabled={!newFaqs.some(f => f.q.trim() && f.a.trim())} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>Add FAQ</button>
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
  const [location, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  // Pre-fill useCase from ?useCase= query param (e.g. from Templates page)
  const useCaseFromUrl = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("useCase") || "";
    } catch { return ""; }
  })();

  const [state, setState] = useState<BuilderState>({
    name: "", email: "", password: "", useCase: useCaseFromUrl,
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
          {/* Back-to-step-1 button during suggestions step — full-width, consistent height */}
          {step < 4 && showSuggestions && (
            <div style={{ marginTop: "0.75rem" }}>
              <button
                onClick={() => { setShowSuggestions(false); setError(""); }}
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", minHeight: "2.75rem", fontSize: "var(--text-sm)" }}
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
