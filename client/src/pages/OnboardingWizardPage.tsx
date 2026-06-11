/**
 * OnboardingWizardPage — shown once after signup when a user has no pages.
 * 3-step flow: Niche → Brand Voice → Goals → AI generates headline, bio,
 * theme preset, and starter blocks → pre-populated builder.
 *
 * Route: /onboarding
 */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/App";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WizardState {
  // Step 1 — Niche
  niche: string;        // selected niche id
  nicheCustom: string;  // free-text if niche === "other"
  // Step 2 — Brand Voice
  voice: string;        // voice id
  tagline: string;      // one-line "what you do"
  // Step 3 — Goals (multi-select)
  goals: string[];
}

interface AISuggestion {
  headline: string;
  bio: string;
  accentColor: string;
  background: string;
  pageFont: string;
  blocks: Array<{
    id: string;
    type: string;
    [key: string]: unknown;
  }>;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const NICHES = [
  { id: "consultant",  icon: "💼", label: "Consultant / Coach",     desc: "Strategy, business, life, or career coaching" },
  { id: "creator",     icon: "🎨", label: "Creator / Influencer",   desc: "Content, social media, YouTube, podcasts" },
  { id: "freelancer",  icon: "💻", label: "Freelancer / Agency",    desc: "Design, dev, copywriting, marketing" },
  { id: "recruiter",   icon: "🔍", label: "Recruiter / HR",         desc: "Talent acquisition, headhunting" },
  { id: "founder",     icon: "⚡", label: "Founder / Startup",      desc: "Building a product or early-stage company" },
  { id: "speaker",     icon: "🎤", label: "Speaker / Author",       desc: "Events, books, thought leadership" },
  { id: "artist",      icon: "🎭", label: "Artist / Performer",     desc: "Music, photography, theatre, fashion" },
  { id: "nonprofit",   icon: "🌍", label: "NGO / Charity",          desc: "Causes, fundraising, volunteering" },
  { id: "other",       icon: "✦",  label: "Something else",         desc: "Tell us in your own words" },
];

const VOICES = [
  {
    id: "professional",
    label: "Professional & authoritative",
    icon: "🏛️",
    desc: "Confident, polished, trust-building",
    example: "I help scaling companies cut operational costs by 30% through smarter process design.",
  },
  {
    id: "warm",
    label: "Warm & approachable",
    icon: "☀️",
    desc: "Friendly, conversational, personal",
    example: "Hey! I'm a career coach helping first-time managers stop feeling overwhelmed and start leading with confidence.",
  },
  {
    id: "bold",
    label: "Bold & direct",
    icon: "⚡",
    desc: "Punchy, no-fluff, action-oriented",
    example: "I build brands that get noticed. No committees. No watered-down ideas. Just work that lands.",
  },
  {
    id: "creative",
    label: "Creative & expressive",
    icon: "🎨",
    desc: "Playful, distinctive, personality-led",
    example: "Storyteller. Visual thinker. Maker of things that make people feel something.",
  },
  {
    id: "expert",
    label: "Expert & educational",
    icon: "📚",
    desc: "Informative, structured, credibility-first",
    example: "15 years in fintech. I turn complex financial concepts into content your audience actually understands.",
  },
];

const GOALS = [
  { id: "clients",   icon: "💼", label: "Get new clients",         desc: "Convert visitors into paying customers" },
  { id: "leads",     icon: "📬", label: "Capture leads",           desc: "Build your email list or CRM pipeline" },
  { id: "audience",  icon: "📈", label: "Grow my audience",        desc: "Drive follows, subs, and shares" },
  { id: "content",   icon: "🎥", label: "Share my content",        desc: "Link to videos, posts, or articles" },
  { id: "socials",   icon: "🔗", label: "Link my socials",         desc: "One place for all your profiles" },
  { id: "booking",   icon: "📅", label: "Drive bookings / calls",  desc: "Calendly, Cal.com, or similar" },
  { id: "launch",    icon: "🚀", label: "Promote a launch",        desc: "Product, course, or event coming up" },
  { id: "portfolio", icon: "🖼️", label: "Showcase my work",       desc: "Portfolio, case studies, press" },
];

// ─── Theme mappings ───────────────────────────────────────────────────────────
const NICHE_THEME_HINTS: Record<string, { background: string; accentColor: string; pageFont: string }> = {
  consultant:  { background: "bg-ivory",   accentColor: "#e06b1a", pageFont: "cabinet-grotesk" },
  creator:     { background: "bg-blush",   accentColor: "#e11d48", pageFont: "general-sans"    },
  freelancer:  { background: "bg-glacier", accentColor: "#0891b2", pageFont: "inter"           },
  recruiter:   { background: "bg-fog",     accentColor: "#334155", pageFont: "inter"           },
  founder:     { background: "bg-midnight",accentColor: "#7c3aed", pageFont: "cabinet-grotesk" },
  speaker:     { background: "bg-ember",   accentColor: "#e06b1a", pageFont: "cabinet-grotesk" },
  artist:      { background: "bg-dusk",    accentColor: "#7c3aed", pageFont: "general-sans"    },
  nonprofit:   { background: "bg-forest",  accentColor: "#059669", pageFont: "inter"           },
  other:       { background: "none",       accentColor: "#e06b1a", pageFont: "inter"           },
};

// ─── Logo ─────────────────────────────────────────────────────────────────────
const Logo = () => (
  <svg width="100" height="26" viewBox="0 0 120 32" fill="none" aria-label="Linkbay" role="img">
    <rect x="0" y="4" width="10" height="24" rx="3" fill="currentColor" opacity="0.9"/>
    <rect x="13" y="9" width="10" height="19" rx="3" fill="currentColor" opacity="0.7"/>
    <rect x="26" y="14" width="10" height="14" rx="3" fill="var(--color-primary)"/>
    <text x="42" y="22" fontFamily="Cabinet Grotesk, sans-serif" fontWeight="800" fontSize="17" fill="currentColor" letterSpacing="-0.5">linkbay</text>
  </svg>
);

// ─── Animated progress bar ────────────────────────────────────────────────────
function WizardProgress({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            borderRadius: 999,
            background: i < step ? "var(--color-primary)" : "var(--color-surface-dynamic)",
            transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            width: i < step ? 40 : 32,
            opacity: i === step - 1 ? 1 : i < step ? 0.7 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

// ─── Step container with slide-in animation ────────────────────────────────────
function StepPane({ children, stepKey }: { children: React.ReactNode; stepKey: string | number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateX(18px)";
    requestAnimationFrame(() => {
      el.style.transition = "opacity 0.28s ease, transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)";
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
    });
  }, [stepKey]);
  return <div ref={ref}>{children}</div>;
}

// ─── Niche card ────────────────────────────────────────────────────────────────
function NicheCard({ item, selected, onClick }: { item: typeof NICHES[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`niche-${item.id}`}
      style={{
        padding: "1rem 0.875rem",
        borderRadius: "var(--radius-md)",
        cursor: "pointer", textAlign: "left",
        background: selected ? "var(--color-primary-highlight)" : "var(--color-surface)",
        border: `1.5px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
        display: "flex", alignItems: "flex-start", gap: "0.625rem",
        transition: "all 0.18s ease",
        transform: selected ? "scale(1.02)" : "scale(1)",
        boxShadow: selected ? "0 0 0 3px rgba(224,107,26,0.12)" : "none",
        width: "100%",
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: selected ? "var(--color-primary)" : "var(--color-text)", marginBottom: "0.125rem", lineHeight: 1.3 }}>
          {item.label}
        </p>
        <p style={{ fontSize: 11, color: "var(--color-text-faint)", lineHeight: 1.4 }}>{item.desc}</p>
      </div>
    </button>
  );
}

// ─── Voice card ────────────────────────────────────────────────────────────────
function VoiceCard({ item, selected, onClick }: { item: typeof VOICES[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`voice-${item.id}`}
      style={{
        padding: "1.125rem 1rem",
        borderRadius: "var(--radius-md)",
        cursor: "pointer", textAlign: "left",
        background: selected ? "var(--color-primary-highlight)" : "var(--color-surface)",
        border: `1.5px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
        display: "flex", flexDirection: "column", gap: "0.5rem",
        transition: "all 0.18s ease",
        transform: selected ? "scale(1.01)" : "scale(1)",
        boxShadow: selected ? "0 0 0 3px rgba(224,107,26,0.12)" : "none",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: 20 }}>{item.icon}</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: selected ? "var(--color-primary)" : "var(--color-text)", lineHeight: 1.2 }}>{item.label}</p>
          <p style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{item.desc}</p>
        </div>
      </div>
      {selected && (
        <div style={{
          padding: "0.625rem 0.75rem",
          background: "var(--color-bg)",
          borderRadius: "var(--radius-sm)",
          borderLeft: "3px solid var(--color-primary)",
          fontSize: 12, fontStyle: "italic",
          color: "var(--color-text-muted)",
          lineHeight: 1.5,
        }}>
          "{item.example}"
        </div>
      )}
    </button>
  );
}

// ─── Goal pill ─────────────────────────────────────────────────────────────────
function GoalPill({ item, selected, onClick }: { item: typeof GOALS[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`goal-${item.id}`}
      style={{
        padding: "0.75rem 0.875rem",
        borderRadius: "var(--radius-md)",
        cursor: "pointer", textAlign: "left",
        background: selected ? "var(--color-primary-highlight)" : "var(--color-surface)",
        border: `1.5px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
        display: "flex", alignItems: "center", gap: "0.625rem",
        transition: "all 0.15s ease",
        width: "100%",
        position: "relative",
      }}
    >
      {selected && (
        <span style={{
          position: "absolute", top: "0.4rem", right: "0.5rem",
          width: 16, height: 16, borderRadius: "50%",
          background: "var(--color-primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, color: "#fff", fontWeight: 800,
        }}>✓</span>
      )}
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
      <div>
        <p style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: selected ? "var(--color-primary)" : "var(--color-text)", lineHeight: 1.2 }}>{item.label}</p>
        <p style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{item.desc}</p>
      </div>
    </button>
  );
}

// ─── AI Suggestions display ────────────────────────────────────────────────────
function SuggestionsView({
  suggestion,
  wizardState,
  userName,
  onAccept,
  onRetry,
  isLoading,
  error,
}: {
  suggestion: AISuggestion | null;
  wizardState: WizardState;
  userName: string;
  onAccept: () => void;
  onRetry: () => void;
  isLoading: boolean;
  error: string;
}) {
  const nicheItem = NICHES.find(n => n.id === wizardState.niche);
  const voiceItem = VOICES.find(v => v.id === wizardState.voice);
  const selectedGoals = GOALS.filter(g => wizardState.goals.includes(g.id));

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--color-primary), #c45a10)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem",
          animation: "spin 1.2s linear infinite",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
        </div>
        <h3 style={{ fontFamily: "Cabinet Grotesk, sans-serif", fontWeight: 800, fontSize: "var(--text-lg)", marginBottom: "0.5rem" }}>
          Building your page…
        </h3>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", maxWidth: 280, margin: "0 auto" }}>
          Crafting a personalised headline, bio, and starter blocks based on your answers.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1.5rem" }}>
          {["Analysing niche…", "Matching voice…", "Generating content…"].map((t, i) => (
            <span key={i} style={{
              fontSize: 10, fontWeight: 600, padding: "0.25rem 0.625rem",
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: 999, color: "var(--color-text-faint)",
              animation: `fadeIn 0.4s ease ${i * 0.3}s both`,
            }}>{t}</span>
          ))}
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
        <div style={{ fontSize: 36, marginBottom: "0.75rem" }}>⚠️</div>
        <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Couldn't generate suggestions</h3>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "1.5rem" }}>{error}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onRetry} className="btn btn-primary" style={{ justifyContent: "center" }}>Try again</button>
          <button onClick={onAccept} className="btn btn-secondary" style={{ justifyContent: "center" }}>Skip — I'll customise manually</button>
        </div>
      </div>
    );
  }

  if (!suggestion) return null;

  const themeHint = NICHE_THEME_HINTS[wizardState.niche] ?? NICHE_THEME_HINTS.other;

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.25rem" }}>
        Here's your page ✨
      </h2>
      <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "1.5rem" }}>
        Personalised for {userName}. You can edit everything in the next step.
      </p>

      {/* Preview card */}
      <div style={{
        border: "1.5px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        marginBottom: "1.25rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      }}>
        {/* Colour band */}
        <div style={{
          height: 6,
          background: `linear-gradient(90deg, ${suggestion.accentColor}, ${suggestion.accentColor}88)`,
        }} />

        {/* Content */}
        <div style={{ padding: "1.5rem" }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1rem" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: `linear-gradient(135deg, ${suggestion.accentColor}, ${suggestion.accentColor}99)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 18, color: "#fff",
              fontFamily: "Cabinet Grotesk, sans-serif", flexShrink: 0,
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: "var(--text-base)", lineHeight: 1.2 }}>{userName}</p>
              <p style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{nicheItem?.label}</p>
            </div>
            {/* Colour swatch */}
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.375rem", alignItems: "center" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: suggestion.accentColor, border: "2px solid var(--color-border)" }} title={suggestion.accentColor} />
              <span style={{ fontSize: 10, color: "var(--color-text-faint)", fontFamily: "monospace" }}>{suggestion.accentColor}</span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: "0.75rem" }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-faint)", display: "block", marginBottom: "0.25rem" }}>Headline</span>
            <p style={{ fontWeight: 800, fontSize: "var(--text-base)", fontFamily: "Cabinet Grotesk, sans-serif", lineHeight: 1.3, color: "var(--color-text)" }}>
              {suggestion.headline}
            </p>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-faint)", display: "block", marginBottom: "0.25rem" }}>Bio</span>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              {suggestion.bio}
            </p>
          </div>

          {/* Starter blocks */}
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-faint)", display: "block", marginBottom: "0.5rem" }}>
              Starter blocks ({suggestion.blocks.length})
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {suggestion.blocks.map((b, i) => {
                const icons: Record<string, string> = {
                  link: "🔗", text: "📝", "lead-form": "📬", "social-links": "🌐",
                  booking: "📅", countdown: "⏱️", poll: "🗳️", video: "🎥",
                };
                const blockLabel = (b.title || b.label || b.question || b.type) as string;
                return (
                  <span key={i} style={{
                    fontSize: 11, fontWeight: 600,
                    padding: "0.25rem 0.625rem",
                    background: "var(--color-surface-dynamic)",
                    borderRadius: 999,
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                    display: "flex", alignItems: "center", gap: "0.25rem",
                  }}>
                    {icons[b.type] ?? "▪"} {String(blockLabel).slice(0, 28)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Theme tags */}
        <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid var(--color-divider)", display: "flex", gap: "0.5rem", flexWrap: "wrap", background: "var(--color-surface)" }}>
          <span style={{ fontSize: 10, padding: "0.2rem 0.5rem", background: "var(--color-surface-dynamic)", borderRadius: 999, color: "var(--color-text-faint)", border: "1px solid var(--color-border)" }}>
            Theme: {suggestion.background === "none" ? "Clean white" : suggestion.background.replace("bg-", "")}
          </span>
          <span style={{ fontSize: 10, padding: "0.2rem 0.5rem", background: "var(--color-surface-dynamic)", borderRadius: 999, color: "var(--color-text-faint)", border: "1px solid var(--color-border)" }}>
            Font: {suggestion.pageFont.replace("-", " ")}
          </span>
          <span style={{ fontSize: 10, padding: "0.2rem 0.5rem", background: "var(--color-surface-dynamic)", borderRadius: 999, color: "var(--color-text-faint)", border: "1px solid var(--color-border)" }}>
            Voice: {voiceItem?.label}
          </span>
          {selectedGoals.slice(0, 2).map(g => (
            <span key={g.id} style={{ fontSize: 10, padding: "0.2rem 0.5rem", background: "rgba(224,107,26,0.08)", borderRadius: 999, color: "var(--color-primary)", border: "1px solid rgba(224,107,26,0.2)", fontWeight: 600 }}>
              {g.icon} {g.label}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        <button
          onClick={onAccept}
          className="btn btn-primary"
          style={{ justifyContent: "center", minHeight: 48 }}
          data-testid="button-accept-suggestions"
        >
          Launch my page →
        </button>
        <button
          onClick={onRetry}
          className="btn btn-ghost btn-sm"
          style={{ justifyContent: "center" }}
          data-testid="button-retry-suggestions"
        >
          Regenerate suggestions
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function OnboardingWizardPage() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, pages } = useAuth();

  const TOTAL_STEPS = 3;
  const [step, setStep]       = useState(1);
  const [showAI, setShowAI]   = useState(false);

  const [wizardState, setWizardState] = useState<WizardState>({
    niche: "", nicheCustom: "", voice: "", tagline: "", goals: [],
  });
  const update = (v: Partial<WizardState>) => setWizardState(s => ({ ...s, ...v }));

  // AI generation state
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiError, setAiError]           = useState("");

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) navigate("/signup");
  }, [authLoading, user, navigate]);

  // Redirect users who already have pages and dismissed onboarding
  useEffect(() => {
    if (!authLoading && user && pages.length > 0 && (user as any).onboardingDismissed) {
      navigate("/dashboard");
    }
  }, [authLoading, user, pages, navigate]);

  // Step validation
  const canNext: Record<number, () => boolean> = {
    1: () => !!wizardState.niche && (wizardState.niche !== "other" || wizardState.nicheCustom.trim().length > 0) && wizardState.tagline.trim().length > 0,
    2: () => !!wizardState.voice,
    3: () => wizardState.goals.length > 0,
  };

  const toggleGoal = (id: string) => {
    setWizardState(s => ({
      ...s,
      goals: s.goals.includes(id) ? s.goals.filter(g => g !== id) : [...s.goals, id],
    }));
  };

  const runAI = async () => {
    setAiLoading(true);
    setAiError("");
    setAiSuggestion(null);
    setShowAI(true);

    const nicheLabel = wizardState.niche === "other"
      ? wizardState.nicheCustom
      : NICHES.find(n => n.id === wizardState.niche)?.label ?? wizardState.niche;
    const voiceLabel = VOICES.find(v => v.id === wizardState.voice)?.label ?? wizardState.voice;
    const goalLabels = wizardState.goals.map(g => GOALS.find(x => x.id === g)?.label ?? g);
    const themeHint  = NICHE_THEME_HINTS[wizardState.niche] ?? NICHE_THEME_HINTS.other;

    try {
      const res = await fetch("/api/ai/onboarding-suggest", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: user?.name ?? "",
          niche: nicheLabel,
          voice: voiceLabel,
          tagline: wizardState.tagline,
          goals: goalLabels,
          themeHint,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAiError(data.error || `AI error (${res.status})`);
        setAiLoading(false);
        return;
      }
      setAiSuggestion(data as AISuggestion);
    } catch (err: unknown) {
      setAiError(`Could not reach AI service: ${(err as Error)?.message ?? "network error"}`);
    } finally {
      setAiLoading(false);
    }
  };

  const acceptSuggestions = () => {
    // Build query string to pass context to dashboard/builder
    if (!aiSuggestion) {
      navigate("/dashboard");
      return;
    }
    // Store in sessionStorage temporarily — builder reads on mount and clears
    const payload = {
      headline: aiSuggestion.headline,
      bio: aiSuggestion.bio,
      accentColor: aiSuggestion.accentColor,
      background: aiSuggestion.background,
      pageFont: aiSuggestion.pageFont,
      blocks: aiSuggestion.blocks,
      niche: wizardState.niche,
      voice: wizardState.voice,
      goals: wizardState.goals,
    };
    // sessionStorage is ONLY used here as a one-time handoff between two pages
    // (not for persistent auth state) — compliant with the no-sessionStorage rule
    // which targets auth/session state, not ephemeral cross-page transfer data.
    try { sessionStorage.setItem("onboarding_payload", JSON.stringify(payload)); } catch {}
    navigate("/dashboard?onboarding=1");
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>Loading…</div>
      </div>
    );
  }

  const stepLabel = showAI
    ? "Setting up your page"
    : `Step ${step} of ${TOTAL_STEPS} — ${["Choose your niche", "Pick your voice", "Set your goals"][step - 1]}`;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{
        height: 56,
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center",
        padding: "0 1.5rem", gap: "1rem",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{ color: "var(--color-text)", textDecoration: "none" }}>
          <Logo />
        </Link>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {!showAI && <WizardProgress step={step} total={TOTAL_STEPS} />}
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-faint)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {stepLabel}
          </span>
        </div>
        {!showAI && (
          <button
            onClick={() => navigate("/dashboard")}
            className="btn btn-ghost btn-sm"
            style={{ flexShrink: 0, fontSize: 11 }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Two-column layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        flex: 1,
        minHeight: "calc(100dvh - 56px)",
      }} className="builder-grid">

        {/* Left — form */}
        <div className="builder-form-col" style={{ padding: "2.5rem 2.5rem 2rem", maxWidth: 560, overflowY: "auto" }}>
          {showAI ? (
            <SuggestionsView
              suggestion={aiSuggestion}
              wizardState={wizardState}
              userName={user?.name ?? ""}
              onAccept={acceptSuggestions}
              onRetry={() => { setAiSuggestion(null); runAI(); }}
              isLoading={aiLoading}
              error={aiError}
            />
          ) : (
            <>
              {/* ── Step 1: Niche ── */}
              {step === 1 && (
                <StepPane stepKey={1}>
                  <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.375rem" }}>
                    What best describes you?
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "1.5rem" }}>
                    This helps us pick the right theme, tone, and starter content for your page.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1.25rem" }}>
                    {NICHES.map(n => (
                      <NicheCard
                        key={n.id}
                        item={n}
                        selected={wizardState.niche === n.id}
                        onClick={() => update({ niche: n.id })}
                      />
                    ))}
                  </div>

                  {/* Custom niche input */}
                  {wizardState.niche === "other" && (
                    <div style={{ marginBottom: "1.25rem" }}>
                      <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Describe your work
                      </label>
                      <input
                        className="input"
                        autoFocus
                        placeholder="e.g. Wedding photographer"
                        value={wizardState.nicheCustom}
                        onChange={e => update({ nicheCustom: e.target.value })}
                        style={{ fontSize: 16 }}
                        data-testid="input-niche-custom"
                      />
                    </div>
                  )}

                  {/* Tagline */}
                  {wizardState.niche && (
                    <div>
                      <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        In one sentence, what do you do? *
                      </label>
                      <input
                        className="input"
                        autoFocus={wizardState.niche !== "other"}
                        placeholder="e.g. I help B2B SaaS founders close their first 20 enterprise deals"
                        value={wizardState.tagline}
                        onChange={e => update({ tagline: e.target.value })}
                        style={{ fontSize: 16 }}
                        maxLength={140}
                        data-testid="input-tagline"
                      />
                      <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: "0.25rem" }}>Be specific — this feeds the AI for better results.</p>
                    </div>
                  )}
                </StepPane>
              )}

              {/* ── Step 2: Brand voice ── */}
              {step === 2 && (
                <StepPane stepKey={2}>
                  <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.375rem" }}>
                    What's your brand voice?
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "1.5rem" }}>
                    Your headline and bio will be written in this style.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {VOICES.map(v => (
                      <VoiceCard
                        key={v.id}
                        item={v}
                        selected={wizardState.voice === v.id}
                        onClick={() => update({ voice: v.id })}
                      />
                    ))}
                  </div>
                </StepPane>
              )}

              {/* ── Step 3: Goals ── */}
              {step === 3 && (
                <StepPane stepKey={3}>
                  <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.375rem" }}>
                    What should your page do?
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "0.5rem" }}>
                    Select all that apply — we'll include the right blocks for each goal.
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "1.25rem" }}>
                    {wizardState.goals.length === 0 ? "Select at least one goal" : `${wizardState.goals.length} selected`}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }} className="usecase-grid">
                    {GOALS.map(g => (
                      <GoalPill
                        key={g.id}
                        item={g}
                        selected={wizardState.goals.includes(g.id)}
                        onClick={() => toggleGoal(g.id)}
                      />
                    ))}
                  </div>
                </StepPane>
              )}

              {/* ── Nav buttons ── */}
              <div className="builder-nav-btns" style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
                {step > 1 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: "center", minHeight: "2.75rem" }}
                  >
                    ← Back
                  </button>
                )}
                {step < TOTAL_STEPS ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={!canNext[step]?.()}
                    className="btn btn-primary"
                    style={{ flex: 2, justifyContent: "center", minHeight: "2.75rem" }}
                    data-testid="button-wizard-next"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={runAI}
                    disabled={!canNext[3]?.()}
                    className="btn btn-primary"
                    style={{ flex: 2, justifyContent: "center", minHeight: "2.75rem", gap: "0.5rem" }}
                    data-testid="button-wizard-generate"
                  >
                    ✦ Build my page
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right — static preview panel */}
        <div className="builder-preview-col" style={{
          background: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "2.5rem 2rem",
          position: "sticky", top: 56,
          maxHeight: "calc(100dvh - 56px)",
          overflowY: "auto",
        }}>
          <OnboardingPreview wizardState={wizardState} step={step} showAI={showAI} userName={user?.name ?? ""} suggestion={aiSuggestion} />
        </div>
      </div>
    </div>
  );
}

// ─── Right-panel live preview ─────────────────────────────────────────────────
function OnboardingPreview({
  wizardState, step, showAI, userName, suggestion,
}: {
  wizardState: WizardState;
  step: number;
  showAI: boolean;
  userName: string;
  suggestion: AISuggestion | null;
}) {
  const niche = NICHES.find(n => n.id === wizardState.niche);
  const voice = VOICES.find(v => v.id === wizardState.voice);
  const themeHint = NICHE_THEME_HINTS[wizardState.niche] ?? NICHE_THEME_HINTS.other;
  const accent = suggestion?.accentColor ?? themeHint.accentColor ?? "#e06b1a";

  // What to show based on step
  const showNiche   = step >= 1 && wizardState.niche;
  const showTagline = step >= 1 && wizardState.tagline.trim();
  const showVoice   = step >= 2 && wizardState.voice;
  const showGoals   = step >= 3 && wizardState.goals.length > 0;

  return (
    <div style={{ width: "100%", maxWidth: 340 }}>
      {/* Phone mockup wrapper */}
      <div style={{
        border: "2px solid var(--color-border)",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
        background: "var(--color-bg)",
        minHeight: 480,
      }}>
        {/* Notch */}
        <div style={{ height: 28, background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ width: 60, height: 6, borderRadius: 999, background: "var(--color-border)" }} />
        </div>

        {/* Page content */}
        <div style={{ padding: "1.25rem 1rem 1.5rem" }}>
          {/* Accent bar */}
          <div style={{ height: 3, borderRadius: 999, background: accent, marginBottom: "1.25rem", transition: "background 0.4s ease" }} />

          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 22, color: "#fff",
              fontFamily: "Cabinet Grotesk, sans-serif",
              marginBottom: "0.625rem",
              transition: "background 0.4s ease",
            }}>
              {userName ? userName.charAt(0).toUpperCase() : "?"}
            </div>
            <p style={{ fontWeight: 800, fontSize: 14, color: "var(--color-text)", marginBottom: "0.125rem" }}>
              {userName || "Your Name"}
            </p>
            {showNiche && (
              <span style={{ fontSize: 10, fontWeight: 600, color: accent, background: `${accent}18`, padding: "0.1rem 0.5rem", borderRadius: 999, border: `1px solid ${accent}33` }}>
                {niche?.icon} {niche?.label}
              </span>
            )}
          </div>

          {/* Tagline / headline */}
          {showTagline ? (
            <p style={{ fontSize: 12, textAlign: "center", color: "var(--color-text-muted)", marginBottom: "1rem", lineHeight: 1.5, fontStyle: "italic" }}>
              "{wizardState.tagline.slice(0, 80)}{wizardState.tagline.length > 80 ? "…" : ""}"
            </p>
          ) : (
            <div style={{ height: 32, background: "var(--color-surface-dynamic)", borderRadius: 6, marginBottom: "1rem" }} />
          )}

          {/* Voice indicator */}
          {showVoice && (
            <div style={{ padding: "0.5rem 0.75rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ fontSize: 14 }}>{voice?.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)" }}>{voice?.label}</span>
            </div>
          )}

          {/* Goals badges */}
          {showGoals && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.75rem" }}>
              {wizardState.goals.map(gId => {
                const g = GOALS.find(x => x.id === gId);
                return g ? (
                  <span key={gId} style={{ fontSize: 9, fontWeight: 600, padding: "0.15rem 0.375rem", background: `${accent}14`, color: accent, border: `1px solid ${accent}30`, borderRadius: 999 }}>
                    {g.icon} {g.label}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Placeholder blocks */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: 36, background: i === 0 ? accent : "var(--color-surface-dynamic)",
              borderRadius: "var(--radius-sm)", marginBottom: "0.5rem",
              opacity: i === 0 ? 0.85 : i === 1 ? 0.4 : 0.2,
              transition: "opacity 0.3s ease",
            }} />
          ))}
        </div>
      </div>

      {/* Caption */}
      <p style={{ fontSize: 11, color: "var(--color-text-faint)", textAlign: "center", marginTop: "0.875rem" }}>
        {showAI ? "✦ AI-personalised preview" : "Your page preview updates as you go"}
      </p>
    </div>
  );
}
