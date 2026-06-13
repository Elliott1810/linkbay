import { useParams, Link } from "wouter";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, resolveMediaUrl } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { backgroundToCss, backgroundToClass, getBackgroundLuminance } from "./BuilderPage";
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
  type: "link" | "text" | "poll" | "lead-form" | "image" | "video" | "social-links" | "countdown" | "divider" | "button" | "testimonial" | "faq" | "vcard" | "booking";
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
  // vcard
  vcName?: string;
  vcJobTitle?: string;
  vcCompany?: string;
  vcPhone?: string;
  vcEmail?: string;
  vcWebsite?: string;
  // booking
  platform?: string;
  embedUrl?: string;
  embedHeight?: number;
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
    // S7 #6: removed duplicate track-click; #7c: pass platform as blockSubId
    apiRequest("POST", `/api/pages/${pageId}/track-block`, { blockId: block.id, blockType: "social-links", eventType: "click", blockSubId: platform }).catch(() => {});
  };
  return (
    <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center", flexWrap: "wrap", padding: "1rem", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
      {items.map((s, i) => {
        const key = s.platform.toLowerCase();
        const IconComponent = SOCIAL_ICON[key];
        return (
          <a key={i} href={s.url} onClick={() => track(s.platform.toLowerCase())} target="_blank" rel="noopener noreferrer"
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

// ─── vCard Block ─────────────────────────────────────────────
function VCardBlock({ block, accent }: { block: Block; accent: string }) {
  const handleDownload = () => {
    const lines: string[] = [
      "BEGIN:VCARD",
      "VERSION:3.0",
    ];
    const name = block.vcName || "";
    if (name) lines.push(`FN:${name}`);
    const jobTitle = block.vcJobTitle || "";
    if (jobTitle) lines.push(`TITLE:${jobTitle}`);
    const company = block.vcCompany || "";
    if (company) lines.push(`ORG:${company}`);
    const phone = block.vcPhone || "";
    if (phone) lines.push(`TEL:${phone}`);
    const email = block.vcEmail || "";
    if (email) lines.push(`EMAIL:${email}`);
    const website = block.vcWebsite || "";
    if (website) lines.push(`URL:${website}`);
    lines.push("END:VCARD");
    const blob = new Blob([lines.join("\n")], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "contact"}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const name = block.vcName || "";
  const jobTitle = block.vcJobTitle || "";
  const company = block.vcCompany || "";
  const subline = [jobTitle, company].filter(Boolean).join(" · ");

  return (
    <div className="vcard-block">
      <div className="vcard-block__info">
        <div className="vcard-block__name">{name || "Contact"}</div>
        {subline && <div className="vcard-block__role">{subline}</div>}
      </div>
      <button
        type="button"
        className="vcard-block__btn"
        style={{ background: accent, color: "#fff" }}
        onClick={handleDownload}
        aria-label="Save contact to phone"
      >
        💾 Save to Contacts
      </button>
    </div>
  );
}

// ─── Booking Block ─────────────────────────────────────────────
function BookingBlock({ block, accent }: { block: Block; accent: string }) {
  const platform = block.platform;
  const rawUrl = block.embedUrl;
  const label = block.title || block.label || "Book a call";
  const height: number = block.embedHeight ?? 650;

  if (!rawUrl) {
    return (
      <div className="booking-embed booking-embed--placeholder">
        <span style={{ fontSize: 24 }}>📅</span>
        <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No booking URL set. Edit this block to add one.</span>
      </div>
    );
  }

  // Build the embed URL with platform-specific params
  function buildEmbedUrl(raw: string, plat: string | undefined): string {
    try {
      const u = new URL(raw);
      if (plat === "calendly" || u.hostname.includes("calendly.com")) {
        if (!u.searchParams.has("embed_type")) u.searchParams.set("embed_type", "Inline");
        if (!u.searchParams.has("hide_landing_page_details")) u.searchParams.set("hide_landing_page_details", "1");
        if (!u.searchParams.has("hide_event_type_details")) u.searchParams.set("hide_event_type_details", "1");
        if (!u.searchParams.has("hide_gdpr_banner")) u.searchParams.set("hide_gdpr_banner", "1");
      } else if (plat === "cal" || u.hostname.includes("cal.com")) {
        if (!u.searchParams.has("embed")) u.searchParams.set("embed", "true");
      }
      return u.toString();
    } catch {
      return raw;
    }
  }

  const embedUrl = buildEmbedUrl(rawUrl, platform);

  // Determine if URL is safe to iframe (only allow https)
  const isSafe = embedUrl.startsWith("https://");

  if (!isSafe) {
    return (
      <div className="booking-embed booking-embed--fallback">
        <span style={{ fontSize: 24 }}>📅</span>
        <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "0.5rem" }}>{label}</p>
        <a href={rawUrl} target="_blank" rel="noopener noreferrer" className="booking-embed__link" style={{ background: accent, color: "#fff" }}>
          Open booking page →
        </a>
      </div>
    );
  }

  return (
    <div className="booking-embed">
      {label && <div className="booking-embed__label" style={{ color: accent }}>📅 {label}</div>}
      <div className="booking-embed__frame-wrap" style={{ height }}>
        <iframe
          src={embedUrl}
          title={label}
          frameBorder="0"
          scrolling="yes"
          allow="camera; microphone; fullscreen; payment"
          style={{ width: "100%", height: "100%", border: "none", borderRadius: "var(--radius-lg)" }}
          loading="lazy"
        />
      </div>
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
    ownerTier?: string | null; // #6: pro/business users hide branding
    headerImageUrl?: string | null;
  };
}

// ─── Lead form ───────────────────────────────────────────────
function LeadForm({ pageId, accentColor, block }: { pageId: number; accentColor: string; block?: Block }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const customFields = block?.customFields || [];
  const viewTracked = useRef(false);

  // G4 FIX: track view only once per mount
  useEffect(() => {
    if (block?.id && !viewTracked.current) {
      viewTracked.current = true;
      trackBlock(pageId, block.id, "lead-form", "view");
    }
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
// Get or create a persistent anonymous voter token (localStorage exception per sprint rules — visitor identity, not auth)
function getVoterToken(): string {
  try {
    let token = localStorage.getItem("lb_voter_token");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("lb_voter_token", token);
    }
    return token;
  } catch {
    return crypto.randomUUID();
  }
}

function PollBlock({ block, pageId, accentColor }: { block: Block; pageId: number; accentColor: string }) {
  const { user } = useAuth();
  const [voterToken] = useState<string>(() => getVoterToken());
  const [hasVoted, setHasVoted] = useState(false);

  const { data, refetch } = useQuery<{ votes: Array<{ optionIndex: number; count: number }>; hasVoted?: boolean }>({
    queryKey: ["/api/pages", pageId, "polls", block.id, "votes"],
    queryFn: async () => {
      const token = voterToken;
      const res = await apiRequest("GET", `/api/pages/${pageId}/polls/${block.id}/votes?voterToken=${encodeURIComponent(token)}`);
      return res.json();
    },
    staleTime: 10_000,
  });

  // Sync hasVoted from server response
  useEffect(() => {
    if (data?.hasVoted !== undefined) setHasVoted(data.hasVoted);
  }, [data?.hasVoted]);

  const voteMutation = useMutation({
    mutationFn: async (optionIndex: number) => {
      const token = user ? undefined : voterToken;
      const res = await fetch(`/api/pages/${pageId}/polls/${block.id}/vote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex, voterToken: token }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to vote");
      }
      return res.json();
    },
    onSuccess: () => {
      setHasVoted(true);
      refetch();
      trackBlock(pageId, block.id, "poll", "vote");
    },
  });

  const votes = data?.votes ?? [];
  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);
  const getCount = (i: number) => votes.find(v => v.optionIndex === i)?.count ?? 0;

  // Normalise options — accept both string[] and {id,text}[] formats
  const pollLabel = block.label || block.question || "Poll";
  const rawOptions: Array<string | { id?: string; text?: string; label?: string }> = (block.options as any) ?? [];
  const normOptions: string[] = rawOptions.map(o =>
    typeof o === "string" ? o : (o.text || o.label || String(o))
  );

  return (
    <div style={{ padding: "1.25rem", background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem", color: accentColor }}>
        🗳️ {pollLabel}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {normOptions.map((opt, i) => {
          const count = getCount(i);
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          return (
            <button
              key={i}
              disabled={hasVoted || voteMutation.isPending}
              onClick={() => !hasVoted && voteMutation.mutate(i)}
              style={{
                position: "relative", overflow: "hidden",
                padding: "0.625rem 0.875rem",
                borderRadius: "var(--radius-md)",
                border: `1.5px solid ${accentColor}40`,
                background: "var(--color-surface-offset)",
                textAlign: "left", cursor: hasVoted ? "default" : "pointer",
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
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}{hasVoted ? " — thanks for voting!" : ""}
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
      <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.75, color: "var(--color-text-muted)", whiteSpace: "pre-wrap" }}>
        {body}
      </p>
    </div>
  );
}

// ─── Tracked link card ───────────────────────────────────────
// Link card rendered from a type:"link" block — tracks click via track-block for block analytics
function TrackedLinkCard({ link, accentColor, featured, blockId, pageId: blockPageId }: { link: { id: string | number; label: string; url: string; description?: string | null; icon?: string; style?: string }; accentColor: string; featured?: boolean; blockId?: string; pageId?: number }) {
  const mutation = useMutation({
    mutationFn: async () => {
      if (blockId && blockPageId) {
        await apiRequest("POST", `/api/pages/${blockPageId}/track-block`, { blockId, blockType: "link", eventType: "click" });
      }
    },
  });

  const handleClick = () => {
    mutation.mutate();
    if (link.url && link.url !== "#") window.open(link.url, "_blank", "noopener");
  };

  // Resolve effective style — featured prop is legacy; prefer link.style
  const effectiveStyle = featured ? "featured" : (link.style || "default");

  // #16a: featured style
  // Luminance-based contrast: use dark text on light accent, white on dark accent
  function isLightColor(hex: string): boolean {
    const h = hex.replace("#", "");
    if (h.length < 6) return false;
    const r = parseInt(h.slice(0,2),16)/255;
    const g = parseInt(h.slice(2,4),16)/255;
    const b = parseInt(h.slice(4,6),16)/255;
    return 0.299*r + 0.587*g + 0.114*b > 0.5;
  }
  if (effectiveStyle === "featured") {
    const textColor = isLightColor(accentColor) ? "#1a1917" : "#fff";
    return (
      <button
        onClick={handleClick}
        className="featured-btn"
        style={{
          display: "block", width: "100%", padding: "1.125rem 1.25rem",
          background: accentColor, color: textColor,
          borderRadius: "var(--radius-lg)", border: "none", textAlign: "left",
          cursor: "pointer", marginBottom: "1rem", transition: "all var(--transition-interactive)",
          "--featured-bg": accentColor, "--featured-color": textColor
        } as React.CSSProperties}
        data-testid={`link-featured-${link.id}`}
      >
        <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>
          {link.icon && <span style={{ marginRight: "0.375rem" }}>{link.icon}</span>}{link.label}
        </div>
        {link.description && <div style={{ fontSize: "var(--text-xs)", opacity: 0.85, marginTop: 3 }}>{link.description}</div>}
      </button>
    );
  }

  // #19: outline style — transparent bg, accent border, accent text
  if (effectiveStyle === "outline") {
    return (
      <button
        onClick={handleClick}
        className="profile-link-card"
        style={{ width: "100%", background: "transparent", border: `2px solid ${accentColor}`, textAlign: "left" }}
        data-testid={`link-card-${link.id}`}
      >
        {link.icon ? (
          <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>{link.icon}</div>
        ) : (
          <div style={{ width: "1.5rem", flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* #16a: text uses accent colour */}
          <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: accentColor }}>{link.label}</div>
          {link.description && <div style={{ fontSize: "var(--text-xs)", color: accentColor, marginTop: 2, opacity: 0.8 }}>{link.description}</div>}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: accentColor, flexShrink: 0 }}>
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    );
  }

  // Default style
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
        {/* #16a: all text uses accent colour */}
        <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: accentColor }}>{link.label}</div>
        {link.description && <div style={{ fontSize: "var(--text-xs)", color: accentColor, marginTop: 2, opacity: 0.75 }}>{link.description}</div>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: accentColor, flexShrink: 0 }}>
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
  // #12: nophoto mode — hide real avatar, show initials placeholder in preview
  const noPhoto = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("nophoto") === "1";

  const { data, isLoading, isError } = useQuery<PageData>({
    queryKey: ["/api/pages/public", username, isPreview],
    queryFn: async () => {
      const url = isPreview ? `/api/pages/public/${username}?preview=1` : `/api/pages/public/${username}`;
      const res = await apiRequest("GET", url);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
    staleTime: Infinity, // G1/G2: never refetch during session — view tracked via POST on mount only
  });

  // Load Google Font once page data is available
  useEffect(() => {
    if (data?.page?.pageFont) loadGoogleFont(data.page.pageFont);
  }, [data?.page?.pageFont]);

  // G1/G2 FIX: Record view exactly once per page mount via POST (never on refetch, never in preview)
  const viewTracked = useRef(false);
  useEffect(() => {
    if (!data?.page || isPreview || viewTracked.current) return;
    viewTracked.current = true;
    apiRequest("POST", `/api/pages/public/${username}/view`).catch(() => {});
  }, [data?.page?.id, isPreview, username]);

  // SEO: set document title + OG meta tags from page data
  useEffect(() => {
    if (!data?.page) return;
    const { page } = data;
    const displayName = page.ownerName || page.title || page.username || "";
    const bio = page.bio || `${displayName}'s Linkbay page`;
    const canonicalUrl = `https://linkbay.ai/${page.username}`;
    const ogImage = page.avatarUrl || "https://linkbay.ai/og-default.png";

    document.title = `${displayName} | Linkbay`;

    const setMeta = (property: string, content: string, attr = "property") => {
      let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, property); document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("og:title",       `${displayName} | Linkbay`);
    setMeta("og:description", bio.slice(0, 160));
    setMeta("og:url",         canonicalUrl);
    setMeta("og:image",       ogImage);
    setMeta("og:type",        "profile");
    setMeta("og:site_name",   "Linkbay");
    setMeta("twitter:card",          "summary_large_image", "name");
    setMeta("twitter:title",         `${displayName} | Linkbay`, "name");
    setMeta("twitter:description",   bio.slice(0, 160), "name");
    setMeta("twitter:image",         ogImage, "name");

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = canonicalUrl;

    return () => { document.title = "Linkbay — Build your link-in-bio page"; };
  }, [data?.page?.id, data?.page?.ownerName, data?.page?.bio, data?.page?.avatarUrl]);

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !data) return <PageNotFound username={username || ""} />;

  const { page } = data;
  const accent = page.accentColor || "#e06b1a";
  const fontFamily = getFontFamily(page.pageFont);

  // #4/#4a: WCAG AA auto-contrast for accent-coloured text on the info card background
  // Returns white or black depending on luminance of the given colour
  const wcagContrast = (hex: string): string => {
    if (!hex || hex.length < 4) return "#000000";
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;
    const lin = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return lum > 0.179 ? "#0a0a0b" : "#ffffff";
  };
  // Parse blocks JSON
  let blocks: Block[] = [];
  try { blocks = JSON.parse(page.blocks || "[]"); } catch {}

  const bgStyle = backgroundToCss(page.background || "none");
  const bgClass = backgroundToClass(page.background || "none");
  // Parse blockStyle from background JSON
  let blockStyle = "default";
  try { const bgParsed = JSON.parse(page.background || "null"); if (bgParsed && bgParsed.blockStyle) blockStyle = bgParsed.blockStyle; } catch {}
  // Map blockStyle to actual CSS border-radius value for inline override
  const blockRadiusMap: Record<string, string> = {
    default: "var(--radius-lg)",
    frosted: "var(--radius-lg)",
    sharp: "0px",
    bordered: "var(--radius-lg)",
    outlined: "var(--radius-lg)",
    elevated: "var(--radius-lg)",
    ghost: "var(--radius-lg)",
    floating: "1.25rem",
    underline: "0px",
    neon: "var(--radius-lg)",
    // 5 new professional presets
    "dark-glass": "var(--radius-lg)",
    "minimal-hc": "var(--radius-md, 8px)",
    "shadow-depth": "var(--radius-lg)",
    "refined-border": "10px",
    "compact-row": "0px",
  };
  const blockRadius = blockRadiusMap[blockStyle] ?? "var(--radius-lg)";
  // Goal 6: auto text color based on background luminance, or explicit textColor override
  // "auto" is a sentinel meaning "let luminance decide" — treat it as falsy
  const luminance = getBackgroundLuminance(page.background || "none");
  const explicitTextColor = (page as any).textColor && (page as any).textColor !== "auto" ? (page as any).textColor : null;
  const autoText = explicitTextColor || (luminance === "dark" ? "#f5f5f7" : "#0a0a0b");
  const autoTextMuted = explicitTextColor || (luminance === "dark" ? "rgba(245,245,247,0.72)" : "rgba(10,10,11,0.62)");
  // #4/#4a: safeAccent — use accent if WCAG AA contrast passes against card bg, else fallback to autoText
  const cardBgLuminance = luminance === "dark" ? 0.12 : 0.82;
  const accentLuminance = (() => {
    const h = accent.replace("#", "");
    const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;
    const lin = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  })();
  const contrastRatio = (Math.max(accentLuminance, cardBgLuminance) + 0.05) / (Math.min(accentLuminance, cardBgLuminance) + 0.05);
  const safeAccent = contrastRatio >= 4.5 ? accent : autoText;

  return (
    <div
      data-theme="light"
      className={bgClass || undefined}
      style={{
        minHeight: "100dvh",
        color: autoText,
        fontFamily,
        ...bgStyle,
        colorScheme: "light",
        "--color-primary": accent,
        "--color-text": autoText,
        "--color-text-muted": autoTextMuted,
        // Dark backgrounds get dark surface tokens so cards don't scream white on a dark gradient
        "--color-bg":              luminance === "dark" ? "rgba(0,0,0,0.45)"     : "#ffffff",
        "--color-surface":         luminance === "dark" ? "rgba(255,255,255,0.10)" : "#f8f8f8",
        "--color-surface-2":       luminance === "dark" ? "rgba(255,255,255,0.07)" : "#f2f2f2",
        "--color-surface-offset":  luminance === "dark" ? "rgba(255,255,255,0.05)" : "#efefef",
        "--color-border":   luminance === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
        "--color-divider":  luminance === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      } as any}
    >
      {/* Minimal top bar — #5: only shown when user is logged in (hides CTA for non-logged-in visitors) */}
      {user && (
      <div className="profile-owner-bar" style={{
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
        <Link href="/dashboard" className="btn btn-primary btn-sm" data-testid="button-build-own-page">
          Dashboard
        </Link>
      </div>
      )}

      <div className="profile-content-wrap" style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

        {/* Cover / hero card — always wrapped in block-style class; header image applied as bg if set */}
        <div className={`block-style-${blockStyle}`} style={{ marginBottom: "1.25rem" }}>
        <div className="block-card" style={{
          borderRadius: blockRadius,
          padding: "2.5rem 2rem",
          textAlign: "center",
          ...(page.headerImageUrl ? {
            // contain = show full image without cropping; no-repeat centred; block-card bg fills letterbox
            backgroundImage: `url(${page.headerImageUrl})`,
            backgroundSize: "contain",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            position: "relative",
            overflow: "hidden",
            // Subtle dark fill behind the contained image so letterbox areas don't look broken
            backgroundColor: "rgba(0,0,0,0.55)",
          } : {}),
        }}>
          {/* Dark overlay when header image is set — ensures text remains legible */}
          {page.headerImageUrl && (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.60) 100%)",
              borderRadius: "inherit",
              zIndex: 0,
            }} />
          )}
          {/* All hero card content sits above overlay via zIndex:1 wrapper */}
          <div style={{ position: "relative", zIndex: 1 }}>
          {/* When header image is active, override accent-based text colours with white */}
          {(() => {
            const heroText = page.headerImageUrl ? "#ffffff" : safeAccent;
            const heroTextMuted = page.headerImageUrl ? "rgba(255,255,255,0.85)" : autoTextMuted;
            const shape = (page as any).avatarShape || "circle";
            const avatarRadius = shape === "rounded" ? "var(--radius-lg)" : shape === "square" ? "0px" : "50%";
            const avatarSize = isPreview ? 36 : 72;
            const avatarFontSize = isPreview ? "1.25rem" : "1.75rem";
            const avatarInitialBg = wcagContrast(accent) === "#ffffff" ? accent : autoText;
            return (
              <>
                {/* #1/#7a: Avatar — centred, correct size, no overflow */}
                {page.avatarUrl && !noPhoto ? (
                  <img
                    src={resolveMediaUrl(page.avatarUrl)}
                    alt={page.ownerName}
                    style={{
                      width: avatarSize, height: avatarSize, borderRadius: avatarRadius,
                      objectFit: "cover",
                      margin: "0 auto 0.75rem",
                      display: "block",
                      flexShrink: 0,
                      minWidth: avatarSize,
                      maxWidth: avatarSize,
                      border: "3px solid rgba(255,255,255,0.25)",
                      boxShadow: "var(--shadow-md)"
                    }}
                  />
                ) : (
                  <div style={{
                    width: avatarSize, height: avatarSize, borderRadius: avatarRadius,
                    background: avatarInitialBg,
                    color: wcagContrast(avatarInitialBg),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: avatarFontSize, fontWeight: 800,
                    margin: "0 auto 0.75rem",
                    border: "3px solid rgba(255,255,255,0.25)",
                    boxShadow: "var(--shadow-md)"
                  }}>
                    {page.ownerName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Name */}
                <h1 style={{
                  fontSize: "var(--text-xl)", fontWeight: 800,
                  fontFamily: fontFamily,
                  letterSpacing: "-0.025em", marginBottom: "0.375rem",
                  color: heroText,
                }}>
                  {page.ownerName}
                </h1>

                {/* Headline */}
                {page.title && page.title.trim() !== page.ownerName.trim() && (
                  <p style={{ fontSize: "var(--text-sm)", color: heroText, marginBottom: "0.75rem", fontWeight: 500, fontFamily, opacity: 0.85 }}>
                    {page.title}
                  </p>
                )}

                {/* Bio */}
                {page.bio && (
                  <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7, color: heroTextMuted, fontFamily, marginBottom: "0.75rem", textAlign: "center" }}>{page.bio}</p>
                )}

                {/* Location */}
                {page.location && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", marginBottom: "0.5rem" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: heroText, flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span style={{ fontSize: "var(--text-xs)", color: heroText, fontFamily }}>{page.location}</span>
                  </div>
                )}

                {/* Contact links */}
                {(page.phone || page.contactEmail) && (
                  <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    {page.phone && (
                      <a href={`tel:${page.phone}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "var(--text-xs)", fontWeight: 600, color: heroText, textDecoration: "none", padding: "0.25rem 0.625rem", background: "rgba(255,255,255,0.15)", borderRadius: "var(--radius-full)", border: "1px solid rgba(255,255,255,0.3)", fontFamily }}
                        data-testid="link-phone">
                        📞 {page.phone}
                      </a>
                    )}
                    {page.contactEmail && (
                      <a href={`mailto:${page.contactEmail}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "var(--text-xs)", fontWeight: 600, color: heroText, textDecoration: "none", padding: "0.25rem 0.625rem", background: "rgba(255,255,255,0.15)", borderRadius: "var(--radius-full)", border: "1px solid rgba(255,255,255,0.3)", fontFamily }}
                        data-testid="link-contact-email">
                        ✉️ {page.contactEmail}
                      </a>
                    )}
                  </div>
                )}

                {/* Profile views badge */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.3rem 0.875rem",
                  background: page.headerImageUrl ? "rgba(255,255,255,0.15)" : `${accent}22`,
                  borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)",
                  border: page.headerImageUrl ? "1px solid rgba(255,255,255,0.3)" : `1px solid ${accent}40` }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: heroText, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, color: heroText }}>{page.viewCount.toLocaleString()} profile views</span>
                </div>
              </>
            );
          })()}
          </div>{/* end zIndex wrapper */}
        </div>
        </div>{/* end block-style wrapper */}

        {/* Blocks */}
        {blocks.length > 0 && (
          <div className={`block-style-${blockStyle}`} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem", "--block-radius": blockRadius } as React.CSSProperties}>
            {blocks.map(block => {
              let inner: ReactNode = null;
              const isDivider = block.type === "divider";
              switch (block.type) {
                // #3/#9b: migrated link blocks rendered as link cards
                case "link": {
                  // #14: support both legacy `style` and new `linkStyle` field
                  const linkItem = { id: (block as any).id ?? 0, label: (block as any).label || (block as any).title || "", url: (block as any).url || "", description: (block as any).description ?? null, icon: (block as any).icon || "", style: (block as any).linkStyle || (block as any).style || "default", position: (block as any).position ?? 0, clickCount: 0 };
                  inner = <TrackedLinkCard key={block.id} link={linkItem as any} accentColor={accent} blockId={String(block.id)} pageId={page.id} />;
                  break;
                }
                case "text": inner = <TextBlock key={block.id} block={block} accent={accent} />; break;
                case "poll": inner = <PollBlock key={block.id} block={block} pageId={page.id} accentColor={accent} />; break;
                case "lead-form": inner = <LeadForm key={block.id} pageId={page.id} accentColor={accent} block={block} />; break;
                case "image": inner = <ImageBlock key={block.id} block={block} />; break;
                case "video": inner = <VideoBlock key={block.id} block={block} pageId={page.id} />; break;
                case "social-links": inner = <SocialLinksBlock key={block.id} block={block} accent={accent} pageId={page.id} />; break;
                case "countdown": inner = <CountdownBlock key={block.id} block={block} accent={accent} pageId={page.id} />; break;
                case "divider": inner = <DividerBlock key={block.id} block={block} />; break;
                case "button": inner = <ButtonBlock key={block.id} block={block} accent={accent} pageId={page.id} />; break;
                case "testimonial": inner = <TestimonialBlock key={block.id} block={block} accent={accent} />; break;
                case "faq": inner = <FaqBlock key={block.id} block={block} accent={accent} pageId={page.id} />; break;
                case "vcard": inner = <VCardBlock key={block.id} block={block} accent={accent} />; break;
                case "booking": inner = <BookingBlock key={block.id} block={block} accent={accent} />; break;
                default: return null;
              }
              return (
                <div key={block.id} className={isDivider ? undefined : "block-card"} style={{ borderRadius: isDivider ? undefined : blockRadius, overflow: isDivider ? undefined : "hidden" }}>
                  {inner}
                </div>
              );
            })}
          </div>
        )}

        {/* Floating copy URL button (hidden in preview) */}
{/* Copy URL FAB removed */}

        {/* Powered by Linkbay — hidden in preview and for Pro/Business owners (#6) */}
        {!isPreview && (page.ownerTier !== "pro" && page.ownerTier !== "business") && (
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
