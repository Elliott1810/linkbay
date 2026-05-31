import { useParams, Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, resolveMediaUrl } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { backgroundToCss, getBackgroundLuminance } from "./BuilderPage";
import {
  SiInstagram, SiTiktok, SiX, SiYoutube, SiFacebook,
  SiGithub, SiPinterest, SiSnapchat, SiThreads, SiWhatsapp, SiTelegram,
  SiDiscord, SiTwitch, SiSpotify,
} from "react-icons/si";

// LinkedIn inline SVG (not in react-icons v5)
function SiLinkedin({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
import { Globe } from "lucide-react";

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
  body?: string;
  // poll
  question?: string;
  options?: string[];
  // lead-form
  title?: string;
  buttonText?: string;
  customFields?: { name: string; type: "text" | "dropdown" | "checkbox" | "number"; required: boolean; options?: string[]; description?: string }[];
  // media
  src?: string;
  alt?: string;
  altText?: string;
  caption?: string;
  // social-links
  socials?: { platform: string; url: string }[];
  platforms?: { platform: string; handle?: string; url: string }[];
  // countdown
  targetDate?: string;
  showSeconds?: boolean;
  // divider
  thickness?: "thin" | "medium" | "thick";
  dividerStyle?: "line" | "dots" | "spacer" | "solid" | "dashed" | "dotted" | "double" | "gradient";
  // button
  color?: "accent" | "white" | "dark";
  size?: "normal" | "large";
  // testimonial
  author?: string;
  authorRole?: string;
  authorName?: string;
  authorTitle?: string;
  avatarUrl?: string;
  quote?: string;
  // faq
  faqs?: { q: string; a: string }[];
  items?: { question: string; answer: string }[];
}

// ─── Block interaction tracker ───────────────────────────────
function trackBlock(pageId: number, blockId: string, blockType: string, eventType = "view") {
  apiRequest("POST", `/api/pages/${pageId}/track-block`, { blockId, blockType, eventType }).catch(() => {});
}

// ─── Extra block renderers ───────────────────────────────────
function ImageBlock({ block }: { block: Block }) {
  const src = block.src || block.url || "";
  const alt = block.altText || block.alt || "";
  if (!src) return null;
  return (
    <figure style={{ margin: 0, borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <img src={src} alt={alt} style={{ width: "100%", display: "block", height: "auto" }} />
      {block.caption && <figcaption style={{ padding: "0.5rem 0.75rem", fontSize: 12, color: "var(--color-text-muted)", textAlign: "center" }}>{block.caption}</figcaption>}
    </figure>
  );
}

function VideoBlock({ block, pageId }: { block: Block; pageId: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !tracked.current) {
        tracked.current = true;
        trackBlock(pageId, block.id, "video", "view");
      }
    }, { threshold: 0.5 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [block.id, pageId]);

  const src = block.src || block.url || "";
  let embedUrl = src;
  const yt = src.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([-\w]+)/);
  if (yt) embedUrl = `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  const vimeo = src.match(/vimeo\.com\/(\d+)/);
  if (vimeo) embedUrl = `https://player.vimeo.com/video/${vimeo[1]}`;
  return (
    <div ref={ref} style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#000", border: "1px solid var(--color-border)" }}>
      <div style={{ position: "relative", paddingBottom: "56.25%" }}>
        <iframe src={embedUrl} title="Video" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>
      {block.caption && <div style={{ padding: "0.5rem 0.75rem", fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", background: "var(--color-surface)" }}>{block.caption}</div>}
    </div>
  );
}

const SOCIAL_ICON: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  instagram: SiInstagram,
  tiktok: SiTiktok,
  twitter: SiX,
  x: SiX,
  "twitter/x": SiX,
  linkedin: SiLinkedin,
  youtube: SiYoutube,
  facebook: SiFacebook,
  github: SiGithub,
  pinterest: SiPinterest,
  snapchat: SiSnapchat,
  threads: SiThreads,
  whatsapp: SiWhatsapp,
  telegram: SiTelegram,
  discord: SiDiscord,
  twitch: SiTwitch,
  spotify: SiSpotify,
};

function SocialLinksBlock({ block, accent, pageId }: { block: Block; accent: string; pageId: number }) {
  const items = (block.platforms || block.socials || []) as Array<{ platform: string; handle?: string; url: string }>;
  const track = (platform: string) => {
    trackBlock(pageId, block.id, "social-links", "click");
    apiRequest("POST", `/api/pages/${pageId}/track-click`).catch(() => {});
  };
  return (
    <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center", flexWrap: "wrap", padding: "1rem", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
      {items.map((s, i) => {
        const key = s.platform.toLowerCase();
        const IconComponent = SOCIAL_ICON[key];
        return (
          <a key={i} href={s.url} onClick={() => track(s.platform)} target="_blank" rel="noopener noreferrer"
             aria-label={s.platform}
             style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, background: `${accent}18`, color: accent, textDecoration: "none", borderRadius: 999, border: `1px solid ${accent}35`, transition: "background 0.15s, transform 0.15s" }}
             onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accent}30`; (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"; }}
             onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${accent}18`; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
            {IconComponent ? <IconComponent size={20} /> : <Globe size={20} />}
          </a>
        );
      })}
    </div>
  );
}

function CountdownBlock({ block, accent, pageId }: { block: Block; accent: string; pageId: number }) {
  const [now, setNow] = useState(Date.now());
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !tracked.current) {
        tracked.current = true;
        trackBlock(pageId, block.id, "countdown", "view");
      }
    }, { threshold: 0.5 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [block.id, pageId]);

  const target = block.targetDate ? new Date(block.targetDate).getTime() : 0;
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const ended = diff === 0 && target > 0;
  const label = block.label || block.title;
  const showSeconds = block.showSeconds !== false;
  const units = [{ v: days, l: "days" }, { v: hours, l: "hrs" }, { v: minutes, l: "min" }];
  if (showSeconds) units.push({ v: seconds, l: "sec" });
  return (
    <div ref={ref} style={{ padding: "1.25rem", background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
      {label && <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.75rem", color: accent }}>{label}</div>}
      {ended ? (
        <div style={{ fontSize: "var(--text-base)", color: accent, fontWeight: 700 }}>✨ The wait is over!</div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {units.map(u => (
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

function DividerBlock({ block }: { block: Block }) {
  const thicknessMap: Record<string, number> = { "1px": 1, "2px": 2, "3px": 3, "4px": 4, "6px": 6 };
  const thickness = thicknessMap[block.thickness as string] ?? (block.thickness === "thin" ? 1 : block.thickness === "thick" ? 4 : 2);
  const style = block.dividerStyle || "solid";
  if (style === "spacer") {
    return <div style={{ height: thickness * 8 }} />;
  }
  if (style === "gradient") {
    return <div style={{ height: thickness, background: "linear-gradient(to right, transparent, var(--color-divider) 30%, var(--color-divider) 70%, transparent)", margin: "0.75rem 0" }} />;
  }
  const borderStyle = style === "dotted" ? "dotted" : style === "dashed" ? "dashed" : style === "double" ? "double" : "solid";
  const topThickness = style === "double" ? Math.max(thickness * 3, 6) : thickness;
  return <hr style={{ border: "none", borderTop: `${topThickness}px ${borderStyle} var(--color-divider)`, margin: "0.75rem 0" }} />;
}

function ButtonBlock({ block, accent, pageId }: { block: Block; accent: string; pageId: number }) {
  const label = block.label || block.title || "Button";
  const color = block.color || "accent";
  const size = block.size || "normal";
  const bg = color === "white" ? "#fff" : color === "dark" ? "#1a1917" : accent;
  const fg = color === "white" ? "#1a1917" : "#fff";
  const border = color === "white" ? "1px solid var(--color-border)" : "none";
  const pad = size === "large" ? "1.125rem 1.5rem" : "0.875rem 1.25rem";
  const fontSize = size === "large" ? "var(--text-base)" : "var(--text-sm)";
  const track = () => {
    trackBlock(pageId, block.id, "button", "click");
    apiRequest("POST", `/api/pages/${pageId}/track-click`).catch(() => {});
  };
  return (
    <a href={block.url} onClick={track} target="_blank" rel="noopener noreferrer"
       style={{ display: "block", textAlign: "center", padding: pad, background: bg, color: fg, textDecoration: "none", borderRadius: "var(--radius-lg)", fontWeight: 700, fontSize, border }}>
      {label}
    </a>
  );
}

function TestimonialBlock({ block, accent }: { block: Block; accent: string }) {
  const name = block.authorName || block.author;
  const role = block.authorTitle || block.authorRole;
  return (
    <blockquote style={{ margin: 0, padding: "1.25rem", background: "var(--color-surface)", borderLeft: `3px solid ${accent}`, borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
      <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.65, fontStyle: "italic", color: "var(--color-text)", margin: 0 }}>"{block.quote}"</p>
      {(name || role) && (
        <footer style={{ marginTop: "0.75rem", fontSize: 12, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {block.avatarUrl && <img src={resolveMediaUrl(block.avatarUrl)} alt="" className="avatar-img" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />}
          <span>— <strong style={{ color: accent }}>{name}</strong>{role && <span>, {role}</span>}</span>
        </footer>
      )}
    </blockquote>
  );
}

function FaqBlock({ block, accent, pageId }: { block: Block; accent: string; pageId: number }) {
  const items: Array<{ q: string; a: string }> = block.items
    ? block.items.map(i => ({ q: i.question, a: i.answer }))
    : (block.faqs || []);
  if (items.length === 0) return null;

  const handleToggle = (idx: number) => {
    trackBlock(pageId, block.id, "faq", "expand");
  };

  return (
    <div style={{ padding: "1rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
      {items.map((f, i) => (
        <details key={i} onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) handleToggle(i); }} style={{ marginBottom: i === (items.length - 1) ? 0 : "0.5rem", borderBottom: i === (items.length - 1) ? "none" : "1px solid var(--color-divider)", paddingBottom: "0.5rem" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "var(--text-sm)", padding: "0.25rem 0", color: accent }}>{f.q}</summary>
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
    pageFont?: string | null;
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

  // Track on mount (form view)
  useEffect(() => {
    if (block?.id) trackBlock(pageId, block.id, "lead-form", "view");
  }, [block?.id, pageId]);

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
    onSuccess: () => {
      setDone(true);
      if (block?.id) trackBlock(pageId, block.id, "lead-form", "submit");
    },
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
      <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.5rem", color: accentColor }}>{formTitle}</h3>
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
          const ph = f.name + (f.required ? " *" : "");
          if (f.type === "number") {
            return <input key={idx} className="input" type="number" placeholder={ph} value={val} onChange={e => setVal(e.target.value)} required={f.required} aria-label={f.name} />;
          }
          return <input key={idx} className="input" type="text" placeholder={ph} value={val} onChange={e => setVal(e.target.value)} required={f.required} aria-label={f.name} />;
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
    onSuccess: () => {
      refetch();
      trackBlock(pageId, block.id, "poll", "vote");
    },
  });

  const votes = data?.votes ?? [];
  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);
  const getCount = (i: number) => votes.find(v => v.optionIndex === i)?.count ?? 0;

  return (
    <div style={{ padding: "1.25rem", background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem", color: accentColor }}>
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
function TextBlock({ block, accent }: { block: Block; accent: string }) {
  const body = block.body || block.content || "";
  return (
    <div style={{ padding: "1.25rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
      {block.title && <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.5rem", color: accent }}>{block.title}</h3>}
      <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.75, color: "var(--color-text)", whiteSpace: "pre-wrap" }}>
        {body}
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

// ─── Google Fonts loader ──────────────────────────────────────
const FONT_MAP: Record<string, string> = {
  inter: "Inter",
  "dm-sans": "DM+Sans",
  outfit: "Outfit",
  "plus-jakarta": "Plus+Jakarta+Sans",
  nunito: "Nunito",
  raleway: "Raleway",
  lato: "Lato",
  poppins: "Poppins",
  "work-sans": "Work+Sans",
  rubik: "Rubik",
  figtree: "Figtree",
  jost: "Jost",
  manrope: "Manrope",
  karla: "Karla",
  urbanist: "Urbanist",
  quicksand: "Quicksand",
  "libre-baskerville": "Libre+Baskerville",
  "playfair-display": "Playfair+Display",
  "cormorant-garamond": "Cormorant+Garamond",
  "josefin-sans": "Josefin+Sans",
};

function getFontFamily(fontKey: string | null | undefined): string {
  if (!fontKey || fontKey === "inter") return "'Inter', 'General Sans', sans-serif";
  const name = FONT_MAP[fontKey];
  if (!name) return "'Inter', sans-serif";
  return `'${name.replace(/\+/g, " ")}', sans-serif`;
}

function loadGoogleFont(fontKey: string | null | undefined) {
  if (!fontKey || fontKey === "inter") return;
  const name = FONT_MAP[fontKey];
  if (!name) return;
  const id = `gfont-${fontKey}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${name}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

// ─── Main profile page ────────────────────────────────────────
export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  // Preview mode: when embedded in dashboard iframe, hide CTAs and Linkbay branding
  const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1";

  const { data, isLoading, isError } = useQuery<PageData>({
    queryKey: ["/api/pages/public", username, isPreview],
    queryFn: async () => {
      const url = isPreview ? `/api/pages/public/${username}?preview=1` : `/api/pages/public/${username}`;
      const res = await apiRequest("GET", url);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
    staleTime: 30_000,
  });

  // Load Google Font once page data is available
  useEffect(() => {
    if (data?.page?.pageFont) loadGoogleFont(data.page.pageFont);
  }, [data?.page?.pageFont]);

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !data) return <PageNotFound username={username || ""} />;

  const { page, links } = data;
  const accent = page.accentColor || "#e06b1a";
  const fontFamily = getFontFamily(page.pageFont);
  const sortedLinks = [...links].sort((a, b) => a.position - b.position);
  const featuredLinks = sortedLinks.filter(l => l.style === "featured");
  const regularLinks = sortedLinks.filter(l => l.style !== "featured");

  // Parse blocks JSON
  let blocks: Block[] = [];
  try { blocks = JSON.parse(page.blocks || "[]"); } catch {}

  const bgStyle = backgroundToCss(page.background || "none");
  // Goal 6: auto text color based on background luminance, or explicit textColor override
  const luminance = getBackgroundLuminance(page.background || "none");
  const autoText = (page as any).textColor || (luminance === "dark" ? "#f5f5f7" : "#0a0a0b");
  const autoTextMuted = (page as any).textColor || (luminance === "dark" ? "rgba(245,245,247,0.72)" : "rgba(10,10,11,0.62)");

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", color: autoText, fontFamily, ...bgStyle, "--color-text": autoText, "--color-text-muted": autoTextMuted } as any}>
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
        <Link href={user ? "/dashboard" : "/builder"} className="btn btn-primary btn-sm" data-testid="button-build-own-page">
          {user ? "Dashboard" : "Build your page"}
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
                src={resolveMediaUrl(page.avatarUrl)}
                alt={page.ownerName}
                className="avatar-img"
                style={{
                  width: 72, height: 72, borderRadius: avatarRadius,
                  objectFit: "cover",
                  margin: "0 auto 1rem",
                  display: "block",
                  flexShrink: 0,
                  minWidth: 0,
                  maxWidth: "100%",
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: autoTextMuted, flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {/* G14: use autoTextMuted (luminance-aware) instead of --color-text-faint so it reads on any bg */}
              <span style={{ fontSize: "var(--text-xs)", color: autoTextMuted, textShadow: "0 1px 3px rgba(0,0,0,0.18)" }}>{page.location}</span>
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
                case "text": return <TextBlock key={block.id} block={block} accent={accent} />;
                case "poll": return <PollBlock key={block.id} block={block} pageId={page.id} accentColor={accent} />;
                case "lead-form": return <LeadForm key={block.id} pageId={page.id} accentColor={accent} block={block} />;
                case "image": return <ImageBlock key={block.id} block={block} />;
                case "video": return <VideoBlock key={block.id} block={block} pageId={page.id} />;
                case "social-links": return <SocialLinksBlock key={block.id} block={block} accent={accent} pageId={page.id} />;
                case "countdown": return <CountdownBlock key={block.id} block={block} accent={accent} pageId={page.id} />;
                case "divider": return <DividerBlock key={block.id} block={block} />;
                case "button": return <ButtonBlock key={block.id} block={block} accent={accent} pageId={page.id} />;
                case "testimonial": return <TestimonialBlock key={block.id} block={block} accent={accent} />;
                case "faq": return <FaqBlock key={block.id} block={block} accent={accent} pageId={page.id} />;
                default: return null;
              }
            })}
          </div>
        )}

        {/* Floating copy URL button (hidden in preview) */}
        {!isPreview && (
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
        )}

        {/* Powered by Linkbay (hidden in preview) */}
        {!isPreview && (
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
        )}
      </div>
    </div>
  );
}
