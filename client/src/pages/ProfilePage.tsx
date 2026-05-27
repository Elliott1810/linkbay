import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { backgroundToCss } from "./BuilderPage";

// ─── Types ───────────────────────────────────────────────────
interface Block {
  id: string;
  type: "link" | "text" | "poll" | "lead-form" | "image" | "video" | "social-links" | "countdown" | "divider" | "button" | "testimonial" | "faq";
  // link
  label?: string;
  url?: string;
  description?: string;
  icon?: string;
  style?: string;
  position?: number;
  // text
  content?: string;
  // poll
  question?: string;
  options?: string[];
  // lead-form
  title?: string;
  buttonText?: string;
  customFields?: { name: string; type: "text" | "dropdown" | "checkbox" | "number"; required: boolean; options?: string[] }[];
  // media
  src?: string;
  alt?: string;
  caption?: string;
  // social-links
  socials?: { platform: string; url: string }[];
  // countdown
  targetDate?: string;
  // testimonial
  author?: string;
  authorRole?: string;
  quote?: string;
  // faq
  faqs?: { q: string; a: string }[];
}

// ─── Extra block renderers ───────────────────────────────────
function ImageBlock({ block }: { block: Block }) {
  return (
    <figure style={{ margin: 0, borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <img src={block.src} alt={block.alt || ""} style={{ width: "100%", display: "block", height: "auto" }} />
      {block.caption && <figcaption style={{ padding: "0.5rem 0.75rem", fontSize: 12, color: "var(--color-text-muted)", textAlign: "center" }}>{block.caption}</figcaption>}
    </figure>
  );
}

function VideoBlock({ block }: { block: Block }) {
  const src = block.src || "";
  let embedUrl = src;
  const yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) embedUrl = `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = src.match(/vimeo\.com\/(\d+)/);
  if (vimeo) embedUrl = `https://player.vimeo.com/video/${vimeo[1]}`;
  return (
    <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#000", border: "1px solid var(--color-border)" }}>
      <div style={{ position: "relative", paddingBottom: "56.25%" }}>
        <iframe src={embedUrl} title="Video" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      </div>
      {block.caption && <div style={{ padding: "0.5rem 0.75rem", fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", background: "var(--color-surface)" }}>{block.caption}</div>}
    </div>
  );
}

const SOCIAL_EMOJI: Record<string, string> = {
  twitter: "🐦", instagram: "📷", linkedin: "💼", github: "🐱", tiktok: "🎥", youtube: "📺", facebook: "👥", website: "🌐",
};

function SocialLinksBlock({ block, accent }: { block: Block; accent: string }) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap", padding: "0.75rem", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
      {(block.socials || []).map((s, i) => (
        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: `${accent}14`, color: accent, textDecoration: "none", borderRadius: 999, fontSize: 13, fontWeight: 600, border: `1px solid ${accent}30` }}>
          <span>{SOCIAL_EMOJI[s.platform] || "🔗"}</span>
          <span style={{ textTransform: "capitalize" }}>{s.platform}</span>
        </a>
      ))}
    </div>
  );
}

function CountdownBlock({ block, accent }: { block: Block; accent: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = block.targetDate ? new Date(block.targetDate).getTime() : 0;
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const ended = diff === 0 && target > 0;
  return (
    <div style={{ padding: "1.25rem", background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
      {block.title && <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.75rem" }}>{block.title}</div>}
      {ended ? (
        <div style={{ fontSize: "var(--text-base)", color: accent, fontWeight: 700 }}>✨ The wait is over!</div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {[{ v: days, l: "days" }, { v: hours, l: "hrs" }, { v: minutes, l: "min" }, { v: seconds, l: "sec" }].map(u => (
            <div key={u.l} style={{ padding: "0.5rem 0.75rem", background: `${accent}14`, color: accent, borderRadius: 8, minWidth: 60 }}>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{String(u.v).padStart(2, "0")}</div>
              <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>{u.l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DividerBlock() {
  return <hr style={{ border: "none", borderTop: "1.5px solid var(--color-divider)", margin: "0.25rem 0" }} />;
}

function ButtonBlock({ block, accent }: { block: Block; accent: string }) {
  return (
    <a href={block.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", padding: "0.875rem 1.25rem", background: accent, color: "#fff", textDecoration: "none", borderRadius: "var(--radius-lg)", fontWeight: 700, fontSize: "var(--text-sm)" }}>{block.title}</a>
  );
}

function TestimonialBlock({ block, accent }: { block: Block; accent: string }) {
  return (
    <blockquote style={{ margin: 0, padding: "1.25rem", background: "var(--color-surface)", borderLeft: `3px solid ${accent}`, borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
      <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.65, fontStyle: "italic", color: "var(--color-text)", margin: 0 }}>“{block.quote}”</p>
      {(block.author || block.authorRole) && (
        <footer style={{ marginTop: "0.75rem", fontSize: 12, color: "var(--color-text-muted)" }}>
          — <strong>{block.author}</strong>{block.authorRole && <span>, {block.authorRole}</span>}
        </footer>
      )}
    </blockquote>
  );
}

function FaqBlock({ block }: { block: Block }) {
  return (
    <div style={{ padding: "1rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
      {(block.faqs || []).map((f, i) => (
        <details key={i} style={{ marginBottom: i === (block.faqs!.length - 1) ? 0 : "0.5rem", borderBottom: i === (block.faqs!.length - 1) ? "none" : "1px solid var(--color-divider)", paddingBottom: "0.5rem" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "var(--text-sm)", padding: "0.25rem 0" }}>{f.q}</summary>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: "0.375rem", lineHeight: 1.6 }}>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

interface PageData {
  page: {
    id: number;
    username: string;
    ownerName: string;
    title: string;
    bio: string | null;
    location: string | null;
    phone: string | null;
    contactEmail: string | null;
    accentColor: string;
    theme: string;
    viewCount: number;
    blocks: string;
    background?: string;
    avatarUrl?: string | null;
  };
  links: Array<{
    id: number;
    label: string;
    url: string;
    description: string | null;
    icon: string;
    style: string;
    position: number;
    clickCount: number;
  }>;
}

// ─── Lead form ───────────────────────────────────────────────
function LeadForm({ pageId, accentColor, block }: { pageId: number; accentColor: string; block?: Block }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const customFields = block?.customFields || [];

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/pages/${pageId}/leads`, {
        pageId, name, email,
        message: message || undefined,
        source: "lead-form",
        ...(customFields.length ? { customFields: customValues } : {}),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <div style={{
        padding: "1.5rem", textAlign: "center",
        background: `${accentColor}12`, border: `1.5px solid ${accentColor}`,
        borderRadius: "var(--radius-lg)"
      }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✅</div>
        <div style={{ fontWeight: 700 }}>Message sent!</div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
          I'll be in touch within 24 hours.
        </div>
      </div>
    );
  }

  const formTitle = block?.title || "Send a message";
  const formDescription = block?.description || "I read every message and respond within 24 hours.";
  const buttonLabel = block?.buttonText || "Send message →";

  return (
    <div style={{ padding: "1.5rem", background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
      <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.5rem" }}>{formTitle}</h3>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
        {formDescription}
      </p>
      <form
        onSubmit={e => { e.preventDefault(); mutation.mutate(); }}
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <input
          className="input"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          aria-label="Name"
          data-testid="input-lead-name"
        />
        <input
          type="email"
          className="input"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          aria-label="Email"
          data-testid="input-lead-email"
        />
        <textarea
          className="input"
          placeholder="Your message (optional)"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          aria-label="Message"
          style={{ resize: "none" }}
        />
        {customFields.map((f, idx) => {
          const val = customValues[f.name] ?? "";
          const setVal = (v: any) => setCustomValues({ ...customValues, [f.name]: v });
          if (f.type === "dropdown") {
            return (
              <select key={idx} className="input" value={val} onChange={e => setVal(e.target.value)} required={f.required} aria-label={f.name}>
                <option value="">{f.name}{f.required ? " *" : ""}</option>
                {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            );
          }
          if (f.type === "checkbox") {
            return (
              <label key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--text-sm)" }}>
                <input type="checkbox" checked={!!val} onChange={e => setVal(e.target.checked)} required={f.required} />
                {f.name}{f.required ? " *" : ""}
              </label>
            );
          }
          if (f.type === "number") {
            return <input key={idx} className="input" type="number" placeholder={f.name + (f.required ? " *" : "")} value={val} onChange={e => setVal(e.target.value)} required={f.required} />;
          }
          return <input key={idx} className="input" type="text" placeholder={f.name + (f.required ? " *" : "")} value={val} onChange={e => setVal(e.target.value)} required={f.required} />;
        })}
        <button
          type="submit"
          className="btn"
          disabled={mutation.isPending}
          style={{ background: accentColor, color: "#fff", border: "none", width: "100%", justifyContent: "center" }}
          data-testid="button-lead-submit"
        >
          {mutation.isPending ? "Sending…" : buttonLabel}
        </button>
        <p style={{ fontSize: 10, color: "var(--color-text-faint)", textAlign: "center" }}>
          🔒 Your info is private. No spam.
        </p>
      </form>
      {mutation.error && (
        <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", marginTop: "0.5rem", textAlign: "center" }}>
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}

// ─── Poll block ───────────────────────────────────────────────
function PollBlock({ block, pageId, accentColor }: { block: Block; pageId: number; accentColor: string }) {
  const { user } = useAuth();

  const { data, refetch } = useQuery<{ votes: Array<{ optionIndex: number; count: number }> }>({
    queryKey: ["/api/pages", pageId, "polls", block.id, "votes"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/pages/${pageId}/polls/${block.id}/votes`);
      return res.json();
    },
    staleTime: 10_000,
  });

  const voteMutation = useMutation({
    mutationFn: async (optionIndex: number) => {
      const res = await apiRequest("POST", `/api/pages/${pageId}/polls/${block.id}/vote`, { optionIndex });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to vote");
      }
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const votes = data?.votes ?? [];
  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);
  const getCount = (i: number) => votes.find(v => v.optionIndex === i)?.count ?? 0;

  return (
    <div style={{ padding: "1.25rem", background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>
        🗳️ {block.question}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {(block.options ?? []).map((opt, i) => {
          const count = getCount(i);
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          return (
            <button
              key={i}
              disabled={!user || voteMutation.isPending}
              onClick={() => user && voteMutation.mutate(i)}
              title={!user ? "Sign in to vote" : undefined}
              style={{
                position: "relative", overflow: "hidden",
                padding: "0.625rem 0.875rem",
                borderRadius: "var(--radius-md)",
                border: `1.5px solid ${accentColor}40`,
                background: "var(--color-surface-offset)",
                textAlign: "left", cursor: user ? "pointer" : "default",
                width: "100%",
              }}
              data-testid={`button-poll-option-${i}`}
            >
              {/* Progress bar */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${pct}%`, background: `${accentColor}20`,
                transition: "width 0.4s ease",
              }} />
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{opt}</span>
                <span style={{ fontSize: 11, color: "var(--color-text-faint)", fontWeight: 600 }}>{pct}% ({count})</span>
              </div>
            </button>
          );
        })}
      </div>
      {voteMutation.error && (
        <p style={{ fontSize: 11, color: "var(--color-error)", marginTop: "0.5rem" }}>
          {(voteMutation.error as Error).message}
        </p>
      )}
      <p style={{ fontSize: 10, color: "var(--color-text-faint)", marginTop: "0.75rem" }}>
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}{!user ? " — sign in to vote" : ""}
      </p>
    </div>
  );
}

// ─── Text block ───────────────────────────────────────────────
function TextBlock({ block }: { block: Block }) {
  return (
    <div style={{ padding: "1.25rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
      <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.75, color: "var(--color-text)", whiteSpace: "pre-wrap" }}>
        {block.content}
      </p>
    </div>
  );
}

// ─── Tracked link card ───────────────────────────────────────
function TrackedLinkCard({ link, accentColor, featured }: { link: PageData["links"][0]; accentColor: string; featured?: boolean }) {
  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/links/${link.id}/click`);
    },
  });

  const handleClick = () => {
    mutation.mutate();
    if (link.url && link.url !== "#") window.open(link.url, "_blank", "noopener");
  };

  if (featured) {
    return (
      <button
        onClick={handleClick}
        style={{
          display: "block", width: "100%", padding: "1.125rem 1.25rem",
          background: accentColor, color: "#fff",
          borderRadius: "var(--radius-lg)", border: "none", textAlign: "left",
          cursor: "pointer", marginBottom: "1rem", transition: "all var(--transition-interactive)"
        }}
        data-testid={`link-featured-${link.id}`}
      >
        <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>
          {link.icon && <span style={{ marginRight: "0.375rem" }}>{link.icon}</span>}{link.label}
        </div>
        {link.description && <div style={{ fontSize: "var(--text-xs)", opacity: 0.85, marginTop: 3 }}>{link.description}</div>}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="profile-link-card"
      style={{ width: "100%", background: "none", border: "1.5px solid var(--color-border)", textAlign: "left" }}
      data-testid={`link-card-${link.id}`}
    >
      {link.icon ? (
        <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>{link.icon}</div>
      ) : (
        <div style={{ width: "1.5rem", flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{link.label}</div>
        {link.description && <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>{link.description}</div>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--color-text-faint)", flexShrink: 0 }}>
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </button>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div className="skeleton" style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 1rem" }} />
        <div className="skeleton" style={{ width: 180, height: 22, margin: "0 auto 0.5rem" }} />
        <div className="skeleton" style={{ width: 120, height: 14, margin: "0 auto" }} />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{ height: 56, borderRadius: "var(--radius-lg)", marginBottom: "0.625rem" }} />
      ))}
    </div>
  );
}

// ─── 404 state ────────────────────────────────────────────────
function PageNotFound({ username }: { username: string }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍</div>
        <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.75rem" }}>
          Page not found
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
          <strong>linkbay.ai/{username}</strong> doesn't exist yet — or hasn't been published.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/builder" className="btn btn-primary">
            Claim this username →
          </Link>
          <Link href="/" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}>
            ← Back to Linkbay
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main profile page ────────────────────────────────────────
export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { data, isLoading, isError } = useQuery<PageData>({
    queryKey: ["/api/pages/public", username],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/pages/public/${username}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
    staleTime: 30_000,
  });

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !data) return <PageNotFound username={username || ""} />;

  const { page, links } = data;
  const accent = page.accentColor || "#e06b1a";
  const sortedLinks = [...links].sort((a, b) => a.position - b.position);
  const featuredLinks = sortedLinks.filter(l => l.style === "featured");
  const regularLinks = sortedLinks.filter(l => l.style !== "featured");

  // Parse blocks JSON
  let blocks: Block[] = [];
  try { blocks = JSON.parse(page.blocks || "[]"); } catch {}

  const bgStyle = backgroundToCss(page.background || "none");

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", ...bgStyle }}>
      {/* Minimal top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "color-mix(in srgb, var(--color-bg) 85%, transparent)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-divider)",
        padding: "0.75rem 1.25rem",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--color-text-faint)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
          ← linkbay.ai
        </Link>
        <Link href="/builder" className="btn btn-primary btn-sm" data-testid="button-build-own-page">
          Build your page
        </Link>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

        {/* Cover / hero card */}
        <div style={{
          background: `linear-gradient(135deg, ${accent}18, ${accent}06)`,
          borderRadius: "var(--radius-xl)",
          padding: "2.5rem 2rem",
          marginBottom: "1.25rem",
          textAlign: "center",
          border: "1px solid var(--color-border)"
        }}>
          {/* Avatar */}
          {(() => {
            const avatarRadius = (page as any).avatarShape === "rounded" ? "var(--radius-lg)" : "50%";
            return page.avatarUrl ? (
              <img
                src={page.avatarUrl}
                alt={page.ownerName}
                style={{
                  width: 72, height: 72, borderRadius: avatarRadius,
                  objectFit: "cover",
                  margin: "0 auto 1rem",
                  display: "block",
                  border: "3px solid var(--color-surface)",
                  boxShadow: "var(--shadow-md)"
                }}
              />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: avatarRadius,
                background: accent,
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.75rem", fontWeight: 800,
                margin: "0 auto 1rem",
                border: "3px solid var(--color-surface)",
                boxShadow: "var(--shadow-md)"
              }}>
                {page.ownerName.charAt(0).toUpperCase()}
              </div>
            );
          })()}

          <h1 style={{
            fontSize: "var(--text-xl)", fontWeight: 800,
            fontFamily: "Cabinet Grotesk, sans-serif",
            letterSpacing: "-0.025em", marginBottom: "0.375rem"
          }}>
            {page.ownerName}
          </h1>

          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "0.75rem", fontWeight: 500 }}>
            {page.title}
          </p>

          {page.location && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", marginBottom: "0.5rem" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{page.location}</span>
            </div>
          )}

          {/* Contact links */}
          {(page.phone || page.contactEmail) && (
            <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              {page.phone && (
                <a
                  href={`tel:${page.phone}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "var(--text-xs)", fontWeight: 600, color: accent, textDecoration: "none", padding: "0.25rem 0.625rem", background: `${accent}14`, borderRadius: "var(--radius-full)", border: `1px solid ${accent}30` }}
                  data-testid="link-phone"
                >
                  📞 {page.phone}
                </a>
              )}
              {page.contactEmail && (
                <a
                  href={`mailto:${page.contactEmail}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "var(--text-xs)", fontWeight: 600, color: accent, textDecoration: "none", padding: "0.25rem 0.625rem", background: `${accent}14`, borderRadius: "var(--radius-full)", border: `1px solid ${accent}30` }}
                  data-testid="link-contact-email"
                >
                  ✉️ {page.contactEmail}
                </a>
              )}
            </div>
          )}

          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.75rem", background: "var(--color-surface)", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", border: "1px solid var(--color-border)" }}>
            <span style={{ color: "var(--color-success)" }}>●</span>
            <span style={{ fontWeight: 600 }}>{(page.viewCount + 1).toLocaleString()} profile views</span>
          </div>
        </div>

        {/* Bio */}
        {page.bio && (
          <div style={{ padding: "1.25rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.75, color: "var(--color-text)" }}>{page.bio}</p>
          </div>
        )}

        {/* Featured links */}
        {featuredLinks.map(link => (
          <TrackedLinkCard key={link.id} link={link} accentColor={accent} featured />
        ))}

        {/* Regular links */}
        {regularLinks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
            {regularLinks.map(link => (
              <TrackedLinkCard key={link.id} link={link} accentColor={accent} />
            ))}
          </div>
        )}

        {/* Blocks */}
        {blocks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
            {blocks.map(block => {
              switch (block.type) {
                case "text": return <TextBlock key={block.id} block={block} />;
                case "poll": return <PollBlock key={block.id} block={block} pageId={page.id} accentColor={accent} />;
                case "lead-form": return <LeadForm key={block.id} pageId={page.id} accentColor={accent} block={block} />;
                case "image": return <ImageBlock key={block.id} block={block} />;
                case "video": return <VideoBlock key={block.id} block={block} />;
                case "social-links": return <SocialLinksBlock key={block.id} block={block} accent={accent} />;
                case "countdown": return <CountdownBlock key={block.id} block={block} accent={accent} />;
                case "divider": return <DividerBlock key={block.id} />;
                case "button": return <ButtonBlock key={block.id} block={block} accent={accent} />;
                case "testimonial": return <TestimonialBlock key={block.id} block={block} accent={accent} />;
                case "faq": return <FaqBlock key={block.id} block={block} />;
                default: return null;
              }
            })}
          </div>
        )}

        {/* Lead form */}
        <div style={{ marginBottom: "1.5rem" }}>
          <LeadForm pageId={page.id} accentColor={accent} />
        </div>

        {/* Floating copy URL button */}
        <button
          onClick={() => {
            const url = `${window.location.origin}/${page.username}`;
            navigator.clipboard?.writeText(url).catch(() => {});
          }}
          style={{ position: "fixed", bottom: 20, right: 20, background: accent, color: "#fff", border: "none", borderRadius: 999, padding: "0.625rem 1rem", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-lg)", zIndex: 50 }}
          data-testid="button-copy-page-url"
        >
          🔗 Copy URL
        </button>

        {/* Powered by Linkbay */}
        <div style={{ textAlign: "center", paddingTop: "0.5rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", textDecoration: "none", color: "var(--color-text-faint)", fontSize: "var(--text-xs)", fontWeight: 500 }}>
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
              <rect x="0" y="2" width="7" height="18" rx="2" fill="currentColor" opacity="0.5"/>
              <rect x="9" y="6" width="7" height="14" rx="2" fill="currentColor" opacity="0.4"/>
              <rect x="18" y="10" width="7" height="10" rx="2" fill="#e06b1a"/>
            </svg>
            Built with Linkbay
          </Link>
        </div>
      </div>
    </div>
  );
}
