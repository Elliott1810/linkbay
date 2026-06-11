import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, resolveMediaUrl } from "@/lib/queryClient";
import { useTheme, useAuth } from "@/App";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, LineChart, Line, Cell, PieChart, Pie } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BACKGROUND_OPTIONS } from "./BuilderPage";
import { QRCodeSVG } from "qrcode.react";

// --- Icons ---
const icons: Record<string, JSX.Element> = {
  grid: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  chart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  billing: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  external: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  link: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  save: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  warning: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  up: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  down: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  blocks: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="8" height="5" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="3" y="11" width="8" height="5" rx="1"/><rect x="13" y="11" width="8" height="5" rx="1"/><rect x="3" y="19" width="18" height="2" rx="1"/></svg>,
  share: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  // #14: Contacts uses a different icon (address-book / card-style) to distinguish from Leads
  contacts: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h8"/></svg>,
  ai: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  signature: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/></svg>,
};

const LINK_ICONS = ["🔗", "📅", "📧", "📄", "💼", "🎥", "📱", "⬇️", "⭐", "💬", "🌐", "📊"];

// Shared block type emoji map — used in Top Interactions across Overview, Analytics, and Blocks panels
const BLOCK_TYPE_EMOJI: Record<string, string> = {
  button: "🔘", text: "📝", image: "🖼️", video: "🎥", faq: "❓", poll: "📊",
  countdown: "⏱️", "lead-form": "📋", "social-links": "🌐", social: "🌐",
  testimonial: "💬", divider: "➖", link: "🔗", "Link": "🔗",
  vcard: "💾", booking: "📅",
};
function blockTypeEmoji(type: string): string {
  return BLOCK_TYPE_EMOJI[type] || BLOCK_TYPE_EMOJI[type?.toLowerCase()] || "📦";
}

// --- Nav items (leads dot injected dynamically) ---
// #2/#3/#4/#16: renamed tabs, reordered (Overview > Page Analytics > Block Analytics), Referrals removed
const navItems = [
  { id: "overview",   label: "Overview",        icon: "grid"    },
  { id: "analytics", label: "Page Analytics",   icon: "chart"   },
  { id: "blocks",    label: "Block Analytics",  icon: "blocks"  },
  { id: "editor",    label: "Page Editor",      icon: "edit"    },
  { id: "leads",     label: "Leads",            icon: "users"   },
  { id: "contacts",  label: "Contacts",         icon: "contacts" },
  { id: "signature", label: "Email Signature",  icon: "signature" },
  { id: "settings",  label: "Settings",         icon: "settings" },
  { id: "billing",   label: "Billing",          icon: "billing" },
];

// --- Empty state when user has no pages ---
function NoPageState() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        {/* AI onboarding CTA */}
        <div style={{
          background: "linear-gradient(135deg, rgba(224,107,26,0.08), rgba(224,107,26,0.03))",
          border: "1.5px solid rgba(224,107,26,0.25)",
          borderRadius: "var(--radius-xl, 1rem)",
          padding: "2rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✨</div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>
            Build your page in 60 seconds
          </h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem", lineHeight: 1.6, fontSize: "var(--text-sm)" }}>
            Answer 3 quick questions and our AI will write your headline, bio, and set up your first blocks automatically.
          </p>
          <Link href="/onboarding" className="btn btn-primary" style={{ justifyContent: "center", display: "inline-flex", textDecoration: "none", minHeight: 48, minWidth: 220 }}>
            ✨ Start AI setup
          </Link>
        </div>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginBottom: "0.75rem" }}>or</p>
        <Link href="/builder" className="btn btn-secondary btn-sm" style={{ justifyContent: "center", textDecoration: "none" }}>
          {icons.plus} Build from scratch
        </Link>
        <div className="nopage-feature-grid" style={{ marginTop: "2.5rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          {[
            { icon: "📊", title: "Analytics", desc: "Track every view and click" },
            { icon: "✉️", title: "Lead capture", desc: "Collect leads from visitors" },
            { icon: "📈", title: "Insights", desc: "Optimise your conversion rate" },
          ].map(f => (
            <div key={f.title} style={{ padding: "1.25rem 1rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", textAlign: "left" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{f.icon}</div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.25rem" }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Onboarding Checklist ---
function OnboardingChecklist({
  pages,
  onNavigate,
  sharedLink,
  onShared,
  onDismiss,
  hasLeads,
  pageUrl,
}: {
  pages: any[];
  onNavigate: (tab: string) => void;
  sharedLink: boolean;
  onShared: () => void;
  onDismiss?: () => void;
  hasLeads: boolean;
  pageUrl: string;
}) {
  const hasPage = pages.length > 0;
  const hasPublished = pages.some((p: any) => p.published);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const items = [
    { id: "page", label: "Create your first page", done: hasPage, action: () => onNavigate("editor") },
    { id: "publish", label: "Publish your page", done: hasPublished, action: () => onNavigate("editor") },
    { id: "share", label: "Share your link", done: sharedLink, action: () => setShareModalOpen(true) },
    { id: "leads", label: "Capture your first lead", done: hasLeads, action: () => onNavigate("leads") },
  ];
  const completedCount = items.filter(i => i.done).length;
  const totalItems = items.length;
  const pct = Math.round((completedCount / totalItems) * 100);

  if (completedCount >= totalItems) return null;

  const shareTargets = [
    { id: "twitter", label: "X / Twitter", color: "#000", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out my page")}&url=${encodeURIComponent(pageUrl)}` },
    { id: "linkedin", label: "LinkedIn", color: "#0a66c2", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}` },
    { id: "whatsapp", label: "WhatsApp", color: "#25d366", url: `https://wa.me/?text=${encodeURIComponent(`Check out my page ${pageUrl}`)}` },
  ];

  return (
    <>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>Getting started</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-faint)", fontWeight: 600 }}>{completedCount}/{totalItems} done</div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                aria-label="Dismiss onboarding"
                data-testid="button-dismiss-onboarding"
                style={{ background: "transparent", border: "none", color: "var(--color-text-faint)", cursor: "pointer", fontSize: 14, padding: "0 0.25rem", lineHeight: 1 }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div style={{ height: 4, background: "var(--color-surface-offset)", borderRadius: 999, marginBottom: "1rem", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-primary)", borderRadius: 999, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {items.map(item => (
            <button
              key={item.id}
              onClick={item.action}
              style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.5rem 0.625rem", borderRadius: "var(--radius-md)",
                background: item.done ? "rgba(16,185,129,0.06)" : "var(--color-surface-offset)",
                border: `1px solid ${item.done ? "rgba(16,185,129,0.15)" : "var(--color-border)"}`,
                cursor: item.done ? "default" : "pointer", textAlign: "left",
                fontSize: "var(--text-sm)", fontWeight: item.done ? 500 : 600,
                color: item.done ? "var(--color-text-muted)" : "var(--color-text)",
                textDecoration: item.done ? "line-through" : "none",
                opacity: item.done ? 0.75 : 1,
              }}
              data-testid={`checklist-${item.id}`}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                background: item.done ? "var(--color-success)" : "var(--color-surface)",
                border: `1.5px solid ${item.done ? "var(--color-success)" : "var(--color-border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              {item.label}
              {!item.done && <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--color-primary)", fontWeight: 700 }}>→</span>}
            </button>
          ))}
        </div>
      </div>
      {shareModalOpen && (
        <div
          onClick={() => setShareModalOpen(false)}
          className="modal-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          data-testid="modal-share"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--color-surface)", padding: "1.5rem", borderRadius: "var(--radius-lg)", maxWidth: 380, width: "90%", border: "1px solid var(--color-border)" }}
          >
            <div style={{ fontSize: "var(--text-md)", fontWeight: 700, marginBottom: "1rem" }}>Share your page</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {shareTargets.map(t => (
                <a
                  key={t.id}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { onShared(); setShareModalOpen(false); }}
                  data-testid={`share-${t.id}`}
                  style={{ background: t.color, color: "white", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", textAlign: "center", fontWeight: 700, textDecoration: "none", fontSize: "var(--text-sm)" }}
                >
                  Share on {t.label}
                </a>
              ))}
              <button
                onClick={() => setShareModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: "0.5rem", justifyContent: "center" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- Copy URL button ---
function CopyUrlButton({ url, copyValue, label }: { url: string; copyValue?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    // copyValue is what actually goes to clipboard (full URL); url is just the display label
    navigator.clipboard?.writeText(copyValue ?? url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="btn btn-secondary btn-sm"
      style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
      data-testid="button-copy-url"
    >
      {copied ? icons.check : icons.copy}
      {copied ? "Copied!" : (label ?? "Copy URL")}
    </button>
  );
}

// --- QR Code card --- #7: gated to Pro/Business only
function QRCodeCard({ url, username, tier }: { url: string; username?: string; tier?: string }) {
  const [show, setShow] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const svgEl = svgRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url2 = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url2;
    a.download = `linkbay-${username || "qr"}.svg`;
    a.click();
    URL.revokeObjectURL(url2);
  };

  // #7: QR codes are Pro/Business only
  const isLocked = tier === "free" || !tier;
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <button
        type="button"
        onClick={() => !isLocked && setShow(s => !s)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.625rem", background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: isLocked ? "default" : "pointer", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", opacity: isLocked ? 0.7 : 1 }}
        data-testid="button-toggle-qr"
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><rect x="10" y="10" width="4" height="4"/><path d="M16 16h5v5h-5z" opacity="0.4"/></svg>
          QR code
          {isLocked && <span style={{ fontSize: 9, padding: "1px 5px", background: "var(--color-primary-highlight)", color: "var(--color-primary)", borderRadius: 999, fontWeight: 700, marginLeft: 4 }}>PRO</span>}
        </span>
        {!isLocked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points={show ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>}
        {isLocked && <span style={{ fontSize: 10, color: "var(--color-text-faint)" }}>Upgrade to unlock</span>}
      </button>
      {show && !isLocked && (
        <div style={{ padding: "0.75rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", marginTop: "0.375rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.625rem" }}>
          <div ref={svgRef} style={{ background: "white", padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>
            <QRCodeSVG value={url} size={140} fgColor="#1a1a1a" bgColor="#ffffff" level="M" />
          </div>
          <p style={{ fontSize: 11, color: "var(--color-text-faint)", textAlign: "center", margin: 0 }}>linkbay.ai/{username}</p>
          <button
            type="button"
            onClick={downloadQR}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11 }}
            data-testid="button-download-qr"
          >
            Download SVG
          </button>
        </div>
      )}
    </div>
  );
}

// --- Overview Panel ---
function OverviewPanel({
  pages,
  user,
  onNavigate,
  sharedLink,
  onShared,
  onDismiss,
  dismissed,
  activePageId,
  setActivePageId,
}: {
  pages: any[];
  user: any;
  onNavigate: (tab: string) => void;
  sharedLink: boolean;
  onShared: () => void;
  onDismiss?: () => void;
  dismissed?: boolean;
  activePageId: number | null;
  setActivePageId: (id: number) => void;
}) {
  const selectedPageId = activePageId ?? pages[0]?.id ?? null;
  const setSelectedPageId = setActivePageId;
  // G2: 7d/14d/30d/60d/All — default 7d; null = all time
  const [days, setDays] = useState<number>(7);
  const [pageHealthHidden, setPageHealthHidden] = useState(false); // G1a: hideable
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const [graphSeries, setGraphSeries] = useState<"views" | "clicks" | "leads">("views");

  // G2: days=0 means "All time" — pass a large number (3650) to the server for all-time queries
  const effectiveDays = days === 0 ? 3650 : days;

  // Use dashboard/stats for overview cards (supports days param)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats", days],
    queryFn: async () => {
      const res = await apiRequest("GET", days === 0 ? "/api/dashboard/stats" : `/api/dashboard/stats?days=${days}`);
      return res.json();
    },
    staleTime: 30_000,
  });

  // Also fetch single-page analytics for the chart
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/pages", selectedPageId, "analytics", days],
    queryFn: async () => {
      if (!selectedPageId) return null;
      const res = await apiRequest("GET", `/api/pages/${selectedPageId}/analytics?days=${effectiveDays}`);
      return res.json();
    },
    enabled: !!selectedPageId,
  });

  // #7: licence tier for QR gate
  const { data: licDataOverview } = useLicence();
  const licTier = (licDataOverview as any)?.tier || "free";

  // Fetch leads for active page (for onboarding “capture first lead”)
  const { data: leadsForPage } = useQuery<any[]>({
    queryKey: ["/api/pages", selectedPageId, "leads"],
    queryFn: async () => {
      if (!selectedPageId) return [];
      const res = await apiRequest("GET", `/api/pages/${selectedPageId}/leads`);
      return res.json();
    },
    enabled: !!selectedPageId,
  });

  if (pages.length === 0) return <NoPageState />;

  const page = pages.find((p: any) => p.id === selectedPageId) || pages[0];
  const pageUrl = `${window.location.origin}/${page?.username}`;

  const totalViews = stats?.totalViews ?? 0;
  const totalClicks = stats?.totalClicks ?? 0;
  const totalLeads = stats?.totalLeads ?? 0;
  const todayViews = stats?.todayViews ?? 0;
  const todayLeads = stats?.todayLeads ?? 0;
  // G12/G4: always 1 decimal place
  const clickRate = totalViews > 0 ? (Math.round((totalClicks / totalViews) * 1000) / 10).toFixed(1) : "0.0";

  // G3a: 'All Time' label when days=0
  const periodLabel = days === 0 ? "All time" : `Last ${days} days`;
  // S7 #21/#21b: rename Clicks → Interactions, Click Rate → Interaction Rate
  const statsData = [
    { label: "Page views", value: totalViews.toLocaleString(), delta: periodLabel },
    { label: "Link interactions", value: totalClicks.toLocaleString(), delta: periodLabel },
    { label: "Interaction rate", value: `${clickRate}%`, delta: days === 0 ? "All-time avg" : `${days}-day avg`, tooltip: "Link clicks ÷ page views" },
    { label: "Leads captured", value: totalLeads.toLocaleString(), delta: periodLabel },
  ];

  const topLinks = analytics?.topLinks ?? [];

  // Chart data from analytics (merged for graph series dropdown)
  const dailyViews = analytics?.dailyViews ?? [];
  const dailyClicks = analytics?.dailyClicks ?? [];
  const dailyLeads = analytics?.dailyLeads ?? [];
  // Parse a date string that may be YYYY-MM-DD, YYYY-Www (ISO week), or YYYY-MM (month)
  const parseDateLabel = (dateStr: string): string => {
    if (/^\d{4}-W\d{2}$/.test(dateStr)) {
      // Weekly format: compute Monday of that ISO week
      const [yearStr, weekStr] = dateStr.split("-W");
      const year = parseInt(yearStr, 10);
      const week = parseInt(weekStr, 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay() || 7;
      const weekStart = new Date(jan4);
      weekStart.setDate(jan4.getDate() - (dayOfWeek - 1) + (week - 1) * 7);
      return `Wk ${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    }
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      // Monthly format: YYYY-MM
      const [yr, mo] = dateStr.split("-");
      const d = new Date(parseInt(yr), parseInt(mo) - 1, 1);
      return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    }
    const d = new Date(dateStr + "T00:00:00");
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  // G2a/G2b: use the FULL range returned by the API (no artificial slice)
  // For All-time view, filter out buckets with zero views/clicks/leads so the graph isn't flooded with empty dates
  const chartDataRaw = dailyViews.map((d: { date: string; count: number }, i: number) => ({
    date: parseDateLabel(d.date),
    Views: d.count,
    Clicks: (dailyClicks[i] as any)?.count ?? 0,
    Leads: (dailyLeads[i] as any)?.count ?? 0,
  }));
  const chartData = days === 0 ? chartDataRaw.filter((d: { Views: number; Clicks: number; Leads: number }) => d.Views > 0 || d.Clicks > 0 || d.Leads > 0) : chartDataRaw;

  // Extra: Calculate current visitor streak (consecutive days with at least 1 view)
  const streak = (() => {
    if (!dailyViews.length) return 0;
    let count = 0;
    const sorted = [...dailyViews].reverse(); // most recent first
    for (const d of sorted) {
      if (d.count > 0) count++;
      else break;
    }
    return count;
  })();

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=Check+out+my+Linkbay+page`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent("Check out my Linkbay page: " + pageUrl)}`;

  return (
    <div className="overview-panel-content" style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
      {/* Header */}
      <div className="overview-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.25rem" }}>Overview</h1>
          {pages.length > 1 ? (
            <select
              value={selectedPageId ?? ""}
              onChange={e => setSelectedPageId(Number(e.target.value))}
              style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {pages.map((p: any) => (
                <option key={p.id} value={p.id}>linkbay.ai/{p.username}</option>
              ))}
            </select>
          ) : (
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>linkbay.ai/{page?.username}</p>
          )}
        </div>
        <div className="overview-header-actions" style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
          <CopyUrlButton url={`linkbay.ai/${page?.username}`} copyValue={pageUrl} label="Copy link" />
          <Link
            href={`/${page?.username}`}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textDecoration: "none", whiteSpace: "nowrap" }}
            data-testid="link-view-page"
          >
            {icons.external} View page
          </Link>
          <Link href="/builder" className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: "0.375rem", whiteSpace: "nowrap" }}>
            {icons.plus} New page
          </Link>
        </div>
      </div>

      {/* Onboarding checklist */}
      {!dismissed && <OnboardingChecklist
        pages={pages}
        onNavigate={onNavigate}
        sharedLink={sharedLink}
        onShared={onShared}
        onDismiss={onDismiss}
        hasLeads={(leadsForPage?.length ?? 0) > 0}
        pageUrl={pageUrl}
      />}

      {/* Page status + date range selector */}
      <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{
          fontSize: 11, padding: "0.2rem 0.6rem", borderRadius: 999, fontWeight: 700,
          background: page?.published ? "rgba(16,185,129,0.1)" : "var(--color-surface-offset)",
          color: page?.published ? "var(--color-success)" : "var(--color-text-faint)",
          border: `1px solid ${page?.published ? "rgba(16,185,129,0.2)" : "var(--color-border)"}`,
        }}>
          {page?.published ? "● Published" : "○ Draft"}
        </span>
        {/* G2: Date range selector — 7d/14d/30d/60d/All */}
        <div className="date-range-row" style={{ display: "flex", gap: "0.25rem", marginLeft: "auto" }}>
          {([7, 14, 30, 60, 0] as number[]).map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: "0.25rem 0.625rem", borderRadius: "var(--radius-md)", fontSize: 11, fontWeight: 600,
                border: `1px solid ${days === d ? "var(--color-primary)" : "var(--color-border)"}`,
                background: days === d ? "var(--color-primary-highlight)" : "var(--color-surface-offset)",
                color: days === d ? "var(--color-primary)" : "var(--color-text-faint)",
                cursor: "pointer",
              }}
            >
              {d === 0 ? "All" : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      {/* Today's activity strip */}
      {!statsLoading && (todayViews > 0 || todayLeads > 0) && (
        <div className="today-strip" style={{
          display: "flex", gap: "1rem", alignItems: "center",
          padding: "0.625rem 1rem", marginBottom: "1rem",
          background: "linear-gradient(90deg, var(--color-primary-highlight) 0%, transparent 100%)",
          border: "1px solid rgba(224,107,26,0.2)", borderRadius: "var(--radius-md)",
          fontSize: "var(--text-xs)", color: "var(--color-text-muted)"
        }}>
          <span style={{ fontWeight: 700, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>Today</span>
          {todayViews > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <span style={{ fontWeight: 700, color: "var(--color-text)" }}>{todayViews}</span> view{todayViews !== 1 ? "s" : ""}
            </span>
          )}
          {todayLeads > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <span style={{ fontWeight: 700, color: "var(--color-success)" }}>+{todayLeads}</span> new lead{todayLeads !== 1 ? "s" : ""} 🎉
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.6 }}>since midnight</span>
          {streak > 1 && days !== 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-primary)", background: "rgba(224,107,26,0.12)", padding: "2px 7px", borderRadius: 999, flexShrink: 0 }}>🔥 {streak}d streak</span>
          )}
        </div>
      )}

      {/* Stats grid */}
      {statsLoading ? (
        <div className="stats-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[0,1,2,3].map(i => (
            <div key={i} className="stat-card" style={{ height: 88 }}>
              <div className="skeleton" style={{ width: "60%", height: 12, marginBottom: "0.5rem" }} />
              <div className="skeleton" style={{ width: "40%", height: 24 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {statsData.map(s => (
            <div key={s.label} className="stat-card" data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="stat-label" title={(s as any).tooltip || undefined}>{s.label}{(s as any).tooltip && <span style={{ marginLeft: 4, fontSize: 10, color: "var(--color-text-faint)", cursor: "help" }}>ⓘ</span>}</div>
              <div className="stat-value" style={{ marginTop: "0.5rem" }}>{s.value}</div>
              <div className="stat-delta" style={{ color: "var(--color-text-faint)" }}>{s.delta}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {!analyticsLoading && chartData.length > 0 && (
        <div className="card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>
              {graphSeries === "views" ? "Views" : graphSeries === "clicks" ? "Interactions" : "Leads"} — {days === 0 ? "all time" : `last ${days} days`}
            </div>
            <select
              value={graphSeries}
              onChange={e => setGraphSeries(e.target.value as any)}
              className="input"
              style={{ fontSize: 11, width: "auto", padding: "0.25rem 0.5rem", height: "auto" }}
              data-testid="select-overview-graph-series"
            >
              <option value="views">Views</option>
              <option value="clicks">Interactions</option>
              <option value="leads">Leads</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e06b1a" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#e06b1a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 5)} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: 12 }}
                labelStyle={{ fontWeight: 700, color: "var(--color-text)" }}
                itemStyle={{ color: "#e06b1a" }}
              />
              <Area type="monotone" dataKey={graphSeries === "views" ? "Views" : graphSeries === "clicks" ? "Clicks" : "Leads"} stroke="#e06b1a" strokeWidth={2} fill="url(#viewsGrad)" dot={false} activeDot={{ r: 4, fill: "#e06b1a" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top links + share section */}
      <div className="overview-bottom-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
        {/* Top links */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.75rem" }}>Top Interactions</div>
          {(() => {
            const interactions = analytics?.topInteractions ?? [];
            if (interactions.length === 0) return (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>
                No interactions tracked yet. Share your page!
              </div>
            );
            const liveBlockIds = (() => { try { return new Set((JSON.parse(page?.blocks || "[]") as any[]).map((b: any) => b.id)); } catch { return new Set(); } })();
            const totalPageViews = Math.max(analytics?.periodViews ?? analytics?.totalViews ?? 1, 1);
            return interactions.map((item: any) => {
              const isLive = !item.blockId || liveBlockIds.has(item.blockId);
              const total = item.total ?? item.clickCount ?? 0;
              const interactionPct = Math.min(Math.round((total / totalPageViews) * 1000) / 10, 100);
              const viewsPct = 100;
              const barColor = isLive ? "var(--color-primary)" : "var(--color-text-faint)";
              const emoji = blockTypeEmoji(item.type || item.blockType || "link");
              return (
                <div key={item.id || item.blockId || item.label} style={{ marginBottom: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", marginBottom: 4, gap: "0.5rem" }}>
                    <span style={{ color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}><span style={{ marginRight: "0.25rem" }}>{emoji}</span>{item.label || item.blockType || "Link"}</span>
                    {!isLive && <span style={{ fontSize: 9, background: "var(--color-surface-offset)", color: "var(--color-text-faint)", borderRadius: 3, padding: "1px 4px", flexShrink: 0 }}>past</span>}
                    <span style={{ fontWeight: 700, color: barColor, flexShrink: 0 }}>Interaction rate: {interactionPct.toFixed(1)}%</span>
                  </div>
                  {/* Stacked bar: views (amber) + interactions (primary) as two segments */}
                  <div style={{ height: 7, background: "var(--color-divider)", borderRadius: 999, overflow: "hidden", display: "flex" }}>
                    <div style={{ height: "100%", width: `${Math.min(viewsPct - interactionPct, 100)}%`, background: "#f59e0b", opacity: 0.35, transition: "width 0.4s" }} />
                    <div style={{ height: "100%", width: `${interactionPct}%`, background: barColor, borderRadius: "0 999px 999px 0", transition: "width 0.4s" }} />
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", fontSize: 11, color: "var(--color-text-faint)", marginTop: 3 }}>
                    <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: "#f59e0b", opacity: 0.6, marginRight: 3, verticalAlign: "middle" }} />Page views: {totalPageViews}</span>
                    <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: barColor, marginRight: 3, verticalAlign: "middle" }} />Interactions: {total}</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Right column: Quick actions + Share section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* G1: Page health score — uses user.avatarUrl for photo check, hideable via G1a */}
          {!pageHealthHidden && (() => {
            const checks = [
              // G1: fixed: avatarUrl lives on user object, not page
              { label: "Profile photo", done: !!user?.avatarUrl },
              { label: "Bio added", done: !!page?.bio },
              { label: "Links added", done: (() => { try { if ((analytics?.topLinks?.length ?? 0) > 0) return true; const b = typeof page?.blocks === "string" ? JSON.parse(page.blocks) : (page?.blocks ?? []); return Array.isArray(b) && b.some((bl: any) => bl.type === "link"); } catch { return false; } })() || (analytics?.periodClicks ?? 0) > 0 },
              { label: "Page published", done: !!page?.published },
              { label: "Contact email", done: !!page?.contactEmail },
              { label: "Location set", done: !!page?.location },
            ];
            const done = checks.filter(c => c.done).length;
            const pct = Math.round((done / checks.length) * 100);
            const color = pct >= 80 ? "var(--color-success)" : pct >= 50 ? "#f59e0b" : "var(--color-primary)";
            if (pct === 100) return null;
            return (
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>Page health</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct}%</span>
                    {/* G1a: hide button */}
                    <button
                      onClick={() => setPageHealthHidden(true)}
                      title="Dismiss"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 14, padding: "0 0.125rem", lineHeight: 1, display: "flex", alignItems: "center" }}
                      aria-label="Hide page health"
                    >×</button>
                  </div>
                </div>
                <div style={{ height: 4, background: "var(--color-border)", borderRadius: 999, marginBottom: "0.875rem", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.6s ease" }} />
                </div>
                {checks.filter(c => !c.done).slice(0, 3).map(c => (
                  <div key={c.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid var(--color-border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} />
                    {c.label}
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>Quick actions</div>
            {[
              { icon: "✏️", label: "Edit page", action: "editor" },
              { icon: "📊", label: "View analytics", action: "analytics" },
              { icon: "✉️", label: "View leads", action: "leads" },
            ].map(a => (
              <button key={a.label} onClick={() => onNavigate(a.action)} style={{
                display: "flex", alignItems: "center", gap: "0.625rem", width: "100%",
                padding: "0.625rem 0.75rem", marginBottom: "0.375rem",
                background: "var(--color-surface-offset)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left",
                fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text)",
              }}>
                <span>{a.icon}</span> {a.label} →
              </button>
            ))}
          </div>

          {/* Share your link section */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.75rem" }}>Share your link</div>
            {/* QR Code — #7: Pro/Business only, tier passed from OverviewPanel */}
            <QRCodeCard url={pageUrl} username={page?.username} tier={licTier} />

            {/* G5: URL display — copy WITHOUT https:// + #12 native share */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.625rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "0.625rem" }}>
              <span style={{ flex: 1, fontSize: 11, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                linkbay.ai/{page?.username}
              </span>
              <button
                onClick={() => {
                  const shortUrl = `linkbay.ai/${page?.username}`;
                  navigator.clipboard?.writeText(shortUrl).then(() => {
                    setShareUrlCopied(true);
                    setTimeout(() => setShareUrlCopied(false), 2000);
                  });
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", flexShrink: 0, display: "flex", alignItems: "center" }}
                title="Copy URL"
              >
                {shareUrlCopied ? icons.check : icons.copy}
              </button>
              {/* #12: Native Web Share API button — shows on mobile, hidden on desktop if unsupported */}
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={() => {
                    navigator.share({ title: page?.title || "My Linkbay", url: `https://linkbay.ai/${page?.username}` }).catch(() => {});
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", flexShrink: 0, display: "flex", alignItems: "center" }}
                  title="Share"
                  data-testid="button-native-share"
                >
                  {icons.share}
                </button>
              )}
            </div>
            {/* G5a: Social share buttons — added Facebook */}
            <div className="social-share-btns" style={{ display: "flex", gap: "0.375rem" }}>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, padding: "0.4rem 0", textAlign: "center", background: "#000", color: "white", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                title="Share on X / Twitter"
              >
                𝕏
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, padding: "0.4rem 0", textAlign: "center", background: "#1877f2", color: "white", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                title="Share on Facebook"
              >
                f
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, padding: "0.4rem 0", textAlign: "center", background: "#0077b5", color: "white", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                title="Share on LinkedIn"
              >
                in
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, padding: "0.4rem 0", textAlign: "center", background: "#25d366", color: "white", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                title="Share on WhatsApp"
              >
                WA
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Page settings sub-form ---
const DASHBOARD_BG_OPTIONS = [
  // Neutrals
  { label: "None", value: "none", preview: "#f7f6f4" },
  { label: "Cream", value: "warm-white", preview: "#fef9f4" },
  { label: "Parchment", value: "warm-sand", preview: "#f5e6c8" },
  { label: "Slate", value: "slate", preview: "#f1f5f9" },
  { label: "Stone", value: "stone", preview: "#e7e5e4" },
  { label: "Blush", value: "blush", preview: "#fce7f3" },
  // Pastels (new)
  { label: "Mint", value: "mint", preview: "#d1fae5" },
  { label: "Lavender", value: "lavender", preview: "#ede9fe" },
  { label: "Butter", value: "butter", preview: "#fef9c3" },
  { label: "Powder", value: "powder", preview: "#dbeafe" },
  { label: "Blush Pink", value: "blush-pink", preview: "#fce7f3" },
  // Dark
  { label: "Charcoal", value: "charcoal", preview: "#1e293b" },
  { label: "Midnight", value: "midnight", preview: "#0f172a" },
  { label: "Deep Navy", value: "midnight-blue", preview: "#1e3a5f" },
  { label: "Espresso", value: "espresso", preview: "#2c1a0e" },
  { label: "Aubergine", value: "deep-purple", preview: "#2d1b69" },
  // Warm
  { label: "Peach", value: "rose", preview: "linear-gradient(135deg, #ffe4e6, #fecdd3)" },
  { label: "Sunset", value: "sunset", preview: "linear-gradient(135deg, #f97316, #ec4899)" },
  // Cool
  { label: "Sky", value: "cool-blue", preview: "linear-gradient(135deg, #dbeafe, #bfdbfe)" },
  { label: "Ocean", value: "ocean", preview: "linear-gradient(135deg, #0891b2, #1e40af)" },
  { label: "Sage", value: "sage", preview: "linear-gradient(135deg, #d1fae5, #a7f3d0)" },
  { label: "Aurora", value: "aurora", preview: "linear-gradient(135deg, #8b5cf6, #ec4899, #14b8a6)" },
  { label: "Frosted", value: "glass", preview: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2)), #e0f2fe" },
];

// Font options for page font selector (General 15)
const PAGE_FONT_OPTIONS = [
  { label: "Inter (default)", value: "inter" },
  { label: "DM Sans", value: "dm-sans" },
  { label: "Outfit", value: "outfit" },
  { label: "Plus Jakarta Sans", value: "plus-jakarta" },
  { label: "Nunito", value: "nunito" },
  { label: "Raleway", value: "raleway" },
  { label: "Lato", value: "lato" },
  { label: "Poppins", value: "poppins" },
  { label: "Work Sans", value: "work-sans" },
  { label: "Rubik", value: "rubik" },
  { label: "Figtree", value: "figtree" },
  { label: "Jost", value: "jost" },
  { label: "Manrope", value: "manrope" },
  { label: "Karla", value: "karla" },
  { label: "Urbanist", value: "urbanist" },
  { label: "Quicksand", value: "quicksand" },
  { label: "Libre Baskerville", value: "libre-baskerville" },
  { label: "Playfair Display", value: "playfair-display" },
  { label: "Cormorant Garamond", value: "cormorant-garamond" },
  { label: "Josefin Sans", value: "josefin-sans" },
];

// G7: 10 + 5 block style options — stored in background JSON as `blockStyle` key
const BLOCK_STYLE_OPTIONS = [
  { value: "default",        label: "Default",           desc: "Clean, minimal cards" },
  { value: "frosted",        label: "Frosted",           desc: "Frosted glass, blurred" },
  { value: "sharp",          label: "Sharp",             desc: "Flat, zero radius" },
  { value: "bordered",       label: "Bordered",          desc: "Accent colour border" },
  { value: "outlined",       label: "Outlined",          desc: "2px strong outline" },
  { value: "elevated",       label: "Elevated",          desc: "Layered shadow depth" },
  { value: "ghost",          label: "Ghost",             desc: "Transparent with border" },
  { value: "floating",       label: "Floating",          desc: "Lifted cards with shadow" },
  { value: "underline",      label: "Underline",         desc: "Accent underline only" },
  { value: "neon",           label: "Neon / Glow",       desc: "Glowing accent outline" },
  // 5 new professional presets
  { value: "dark-glass",     label: "Dark Glass",        desc: "Dark glassmorphism + accent glow" },
  { value: "minimal-hc",     label: "Minimal HC",        desc: "High-contrast + spring bounce" },
  { value: "shadow-depth",   label: "Shadow Depth",      desc: "Layered 3D shadow stack" },
  { value: "refined-border", label: "Refined Border",    desc: "Thin business card border" },
  { value: "compact-row",    label: "Compact Row",       desc: "Mobile list rows, no radius" },
];

function PageSettingsForm({ page, onSave, saving, saveMsg }: { page: any; onSave: (d: any) => void; saving: boolean; saveMsg: string }) {
  const [title, setTitle] = useState(page?.title ?? "");
  const [bio, setBio] = useState(page?.bio ?? "");
  const [location, setLocation] = useState(page?.location ?? "");
  const [phone, setPhone] = useState(page?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(page?.contactEmail ?? "");
  const [accentColor, setAccentColor] = useState(page?.accentColor ?? "#e06b1a");
  const [background, setBackground] = useState(page?.background ?? "none");
  const [avatarShape, setAvatarShape] = useState<string>(page?.avatarShape ?? "circle");
  const [pageFont, setPageFont] = useState<string>(page?.pageFont ?? "inter");
  // #12: custom hex background colour
  const [customBgColor, setCustomBgColor] = useState<string>("#ffffff");

  // G7/#7e: blockStyle stored inside background JSON
  // Parse the background field — if it's a plain string like "none" or a gradient, keep it separately
  const bgIsJson = (() => { try { JSON.parse(background); return true; } catch { return false; } })();
  const bgParsed = bgIsJson ? (() => { try { return JSON.parse(background); } catch { return {}; } })() : {};
  const blockStyle: string = bgParsed.blockStyle ?? "default";
  // #12: is a custom hex colour currently active?
  const customBgIsActive = background.startsWith("#") ||
    (bgIsJson && bgParsed.bgValue && bgParsed.bgValue.startsWith("#"));
  // #12: actual hex value displayed in custom swatch preview
  const activeBgHex = (() => {
    if (background.startsWith("#")) return background;
    if (bgIsJson && bgParsed.bgValue?.startsWith("#")) return bgParsed.bgValue;
    return customBgColor;
  })();

  const setBlockStyle = (s: string) => {
    // Preserve the existing background value and only update blockStyle
    const merged = { ...bgParsed, blockStyle: s };
    // If there's a non-JSON background (e.g. a gradient string or hex), store under "bgValue" key
    if (!bgIsJson && background !== "none" && background !== "") {
      merged.bgValue = background;
    }
    setBackground(JSON.stringify(merged));
  };
  // When background picker is clicked, we must not clobber blockStyle
  // (already handled: BACKGROUND_OPTIONS onClick calls setBackground directly)
  // But when user picks a background that is a plain string, merge blockStyle in
  const handleSetBackground = (val: string) => {
    // If the selected value looks like JSON, try to merge blockStyle into it
    const isJson = (() => { try { JSON.parse(val); return true; } catch { return false; } })();
    if (isJson) {
      const parsed = (() => { try { return JSON.parse(val); } catch { return {}; } })();
      setBackground(JSON.stringify({ ...parsed, blockStyle }));
    } else {
      // Plain value ("none", gradient string) — store with blockStyle preserved
      if (blockStyle !== "default") {
        setBackground(JSON.stringify({ bgValue: val, blockStyle }));
      } else {
        setBackground(val);
      }
    }
  };

  // #14: only reset fields when the page actually changes (different page ID)
  // Track the last page ID we synced from so we don't reset on refetch of same page
  const syncedPageIdRef = React.useRef<number | null>(null);
  useEffect(() => {
    if (page && page.id !== syncedPageIdRef.current) {
      syncedPageIdRef.current = page.id;
      setTitle(page.title ?? "");
      setBio(page.bio ?? "");
      setLocation(page.location ?? "");
      setPhone(page.phone ?? "");
      setContactEmail(page.contactEmail ?? "");
      setAccentColor(page.accentColor ?? "#e06b1a");
      const rawBg = page.background ?? "none";
      setBackground(rawBg);
      // #12: extract existing custom hex if present
      const hexFromBg = (() => {
        if (rawBg.startsWith("#")) return rawBg;
        try { const p = JSON.parse(rawBg); if (p.bgValue?.startsWith("#")) return p.bgValue; } catch {}
        return "#ffffff";
      })();
      setCustomBgColor(hexFromBg);
      setAvatarShape(page.avatarShape ?? "circle");
      setPageFont(page.pageFont ?? "inter");
    }
  }, [page?.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Headline</label>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)} style={{ fontSize: 13 }} data-testid="input-page-title" />
      </div>
      <div>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Bio</label>
        <textarea className="input" value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ fontSize: 13, resize: "none" }} data-testid="input-page-bio" />
      </div>
      <div>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Location</label>
        <input className="input" value={location} onChange={e => setLocation(e.target.value)} style={{ fontSize: 13 }} />
      </div>
      <div className="settings-phone-email-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Phone (optional)</label>
          <input type="tel" className="input" value={phone} onChange={e => setPhone(e.target.value)} style={{ fontSize: 13 }} placeholder="+44 7700 900000" data-testid="input-page-phone" />
        </div>
        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Contact email (optional)</label>
          <input type="email" className="input" value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={{ fontSize: 13 }} placeholder="hi@example.com" data-testid="input-page-contact-email" />
        </div>
      </div>
      <div>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>Accent colour</label>
        <div className="accent-colour-row" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexWrap: "wrap" }}>
            {["#e06b1a","#4f46e5","#0891b2","#059669","#e11d48","#7c3aed","#334155"].map(c => (
              <button key={c} type="button" onClick={() => setAccentColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `2.5px solid ${accentColor === c ? "var(--color-text)" : "transparent"}`, cursor: "pointer", flexShrink: 0, boxShadow: accentColor === c ? `0 0 0 1px ${c}40` : undefined }} />
            ))}
          </div>
          {/* #7: Custom colour swatch + hex inline to the right */}
          <label className="accent-custom-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", position: "relative" }} title="Custom colour">
            <div style={{ width: 28, height: 28, borderRadius: 6, background: accentColor, border: `2.5px solid ${!["#e06b1a","#4f46e5","#0891b2","#059669","#e11d48","#7c3aed","#334155"].includes(accentColor) ? "var(--color-text)" : "transparent"}`, flexShrink: 0, cursor: "pointer" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>Custom</span>
            <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ position: "absolute", opacity: 0, width: 28, height: 28, cursor: "pointer", top: 0, left: 0 }} />
            <input
              className="input"
              value={accentColor}
              onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setAccentColor(e.target.value); }}
              placeholder="#e06b1a"
              style={{ fontSize: 11, width: 82, fontFamily: "monospace", padding: "0.25rem 0.4rem" }}
              data-testid="input-accent-hex"
            />
          </label>
        </div>
      </div>
      {/* ─── Background picker — Custom colour first, then CSS gradient swatches ─── */}
      <div>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>Background</label>
        {/* #8: Custom colour is first / primary option */}
        <div style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer", position: "relative", flexShrink: 0 }} title="Custom background colour">
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: activeBgHex, border: `2px solid ${customBgIsActive ? "var(--color-primary)" : "var(--color-border)"}`, flexShrink: 0, boxShadow: customBgIsActive ? "0 0 0 2px var(--amber-subtle, rgba(224,107,26,0.2))" : undefined }} />
            <input
              type="color"
              value={customBgColor}
              onChange={e => {
                setCustomBgColor(e.target.value);
                handleSetBackground(e.target.value);
              }}
              style={{ position: "absolute", opacity: 0, width: 36, height: 36, cursor: "pointer", top: 0, left: 0 }}
            />
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: customBgIsActive ? "var(--color-primary)" : "var(--color-text-muted)" }}>Custom colour</span>
            <input
              className="input"
              value={customBgColor}
              onChange={e => {
                if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                  setCustomBgColor(e.target.value);
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) handleSetBackground(e.target.value);
                }
              }}
              placeholder="#ffffff"
              style={{ fontSize: 11, width: 82, fontFamily: "monospace", padding: "0.15rem 0.35rem" }}
              data-testid="input-bg-hex"
            />
          </div>
        </div>
        {/* Gradient swatches — None removed since Custom Colour is now the no-background option */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: "0.375rem" }}>
          {BACKGROUND_OPTIONS.filter(opt => opt.value !== "none").map(opt => {
            const isActive = !customBgIsActive && (background === opt.value || (() => { try { const p = JSON.parse(background); return (p.bgValue === opt.value); } catch { return false; } })());
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSetBackground(opt.value)}
                title={opt.label}
                data-testid={`button-dash-bg-${opt.value}`}
                style={{
                  height: 44,
                  borderRadius: "var(--radius-sm)",
                  border: `2px solid ${isActive ? "var(--color-primary)" : "var(--color-border)"}`,
                  cursor: "pointer",
                  overflow: "hidden",
                  background: opt.preview,
                  backgroundSize: "cover",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  padding: "2px",
                  boxShadow: isActive ? "0 0 0 2px var(--amber-subtle, rgba(224,107,26,0.2))" : undefined,
                }}
              >
                <span style={{ fontSize: 8, fontWeight: 700, background: "rgba(0,0,0,0.55)", color: "#fff", padding: "1px 4px", borderRadius: 2, lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>Profile picture shape</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {/* #7d: Pentagon and Diamond removed */}
          {[{ v: "circle", l: "Circle", br: "50%", cp: undefined }, { v: "rounded", l: "Rounded", br: "4px", cp: undefined }, { v: "square", l: "Square", br: "0", cp: undefined }].map(opt => (
            <button key={opt.v} type="button" onClick={() => setAvatarShape(opt.v)}
              style={{ flex: 1, padding: "0.5rem", fontSize: 11, fontWeight: 600, borderRadius: "var(--radius-sm)", border: `2px solid ${avatarShape === opt.v ? "var(--color-primary)" : "var(--color-border)"}`, background: avatarShape === opt.v ? "var(--color-primary-highlight)" : "var(--color-surface)", color: avatarShape === opt.v ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
              data-testid={`button-avatar-shape-${opt.v}`}
            >
              <span style={{ display: "inline-block", width: 16, height: 16, background: "var(--color-text-faint)", borderRadius: opt.br }} />{opt.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>Page font</label>
        <select
          className="input"
          value={pageFont}
          onChange={e => setPageFont(e.target.value)}
          style={{ fontSize: 13 }}
          data-testid="select-page-font"
        >
          {PAGE_FONT_OPTIONS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <p style={{ fontSize: 10, color: "var(--color-text-faint)", marginTop: 4 }}>Font applies to your entire public profile page.</p>
      </div>
      {/* G7: Block style picker — 10 options stored in background JSON */}
      <div>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>Block style</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.375rem" }}>
          {BLOCK_STYLE_OPTIONS.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setBlockStyle(s.value)}
              title={s.desc}
              style={{
                padding: "0.375rem 0.5rem",
                fontSize: 11, fontWeight: 600,
                borderRadius: "var(--radius-sm)",
                border: `2px solid ${blockStyle === s.value ? "var(--color-primary)" : "var(--color-border)"}`,
                background: blockStyle === s.value ? "var(--color-primary-highlight)" : "var(--color-surface)",
                color: blockStyle === s.value ? "var(--color-primary)" : "var(--color-text-muted)",
                cursor: "pointer", textAlign: "left",
              }}
              data-testid={`button-block-style-${s.value}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "var(--color-text-faint)", marginTop: 4 }}>Controls how link and content blocks appear on your profile.</p>
      </div>
      <button
        onClick={() => onSave({ title, bio, location, phone, contactEmail, accentColor, background, avatarShape, pageFont })}
        className="btn btn-primary btn-sm settings-save-btn"
        disabled={saving}
        style={{ justifyContent: "center" }}
        data-testid="button-save-page-settings"
      >
        {saving ? "Saving…" : saveMsg ? saveMsg : <>{icons.save} Save changes</>}
      </button>
    </div>
  );
}

// --- Block editor for page.blocks ---
interface PageBlock {
  id: string;
  type: "text" | "poll" | "lead-form" | "image" | "video" | "social-links" | "countdown" | "divider" | "button" | "testimonial" | "faq" | "link" | "vcard" | "booking";
  content?: string;
  question?: string;
  options?: string[];
  title?: string;
  description?: string;
  buttonText?: string;
  customFields?: { name: string; type: "text" | "dropdown" | "checkbox" | "number"; required: boolean; options?: string[] }[];
  // image / video
  src?: string;
  alt?: string;
  caption?: string;
  // social-links
  socials?: { platform: string; url: string }[];
  // countdown
  targetDate?: string;
  // button
  url?: string;
  // testimonial
  author?: string;
  authorRole?: string;
  quote?: string;
  // faq
  faqs?: { q: string; a: string }[];
  // divider
  dividerStyle?: "solid" | "dashed" | "dotted" | "double" | "gradient";
  thickness?: "1px" | "2px" | "3px" | "4px" | "6px";
  // link block
  icon?: string;
  linkStyle?: "default" | "featured" | "outline";
  // vcard block
  vcName?: string;
  vcJobTitle?: string;
  vcCompany?: string;
  vcPhone?: string;
  vcEmail?: string;
  vcWebsite?: string;
  // booking block
  platform?: "calendly" | "cal" | "google" | "tidycal" | "other";
  embedUrl?: string;
  embedHeight?: number;
}

function BlockEditor({ pageId, blocks, onSave, saving, newBlockIds }: { pageId: number; blocks: PageBlock[]; onSave: (blocks: PageBlock[]) => void; saving: boolean; newBlockIds?: Set<string> }) {
  const [localBlocks, setLocalBlocks] = useState<PageBlock[]>(blocks);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PageBlock>>({});
  const [newPollOption, setNewPollOption] = useState("");

  // Sync when blocks prop changes
  useEffect(() => {
    setLocalBlocks(blocks);
  }, [JSON.stringify(blocks)]);

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const arr = [...localBlocks];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setLocalBlocks(arr);
    onSave(arr);
  };

  const deleteBlock = async (id: string) => {
    // #5: warn before deleting — block will be archived in Blocks panel
    const confirmed = window.confirm("Remove this block from your page? It will be archived in your Blocks dashboard and can be restored later.");
    if (!confirmed) return;
    const arr = localBlocks.filter(b => b.id !== id);
    setLocalBlocks(arr);
    onSave(arr);
    // Also archive the block so it shows up in Archived section
    try {
      const pageRes = await apiRequest("GET", `/api/pages/${pageId}`);
      const pageData = await pageRes.json();
      const existing: string[] = (() => { try { return JSON.parse(pageData.archivedBlockIds || "[]"); } catch { return []; } })();
      if (!existing.includes(id)) {
        await apiRequest("PATCH", `/api/pages/${pageId}`, { archivedBlockIds: JSON.stringify([...existing, id]) });
        queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      }
    } catch { /* non-critical */ }
  };

  const startEdit = (block: PageBlock) => {
    setEditingBlockId(block.id);
    setEditValues({ ...block });
  };

  const saveEdit = () => {
    const arr = localBlocks.map(b => b.id === editingBlockId ? { ...b, ...editValues } as PageBlock : b);
    setLocalBlocks(arr);
    onSave(arr);
    setEditingBlockId(null);
    setEditValues({});
  };

  if (localBlocks.length === 0) return null;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>Content Blocks</h2>
        <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{localBlocks.length} block{localBlocks.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {localBlocks.map((block, idx) => (
          <div key={block.id} style={{ background: newBlockIds?.has(block.id) ? "rgba(224,107,26,0.06)" : "var(--color-surface)", border: newBlockIds?.has(block.id) ? "1.5px solid rgba(224,107,26,0.35)" : "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {editingBlockId === block.id ? (
              <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {block.type === "text" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>📝 Text Block</div>
                    <textarea
                      className="input"
                      value={editValues.content ?? ""}
                      onChange={e => setEditValues(v => ({ ...v, content: e.target.value }))}
                      rows={4}
                      style={{ fontSize: 13, resize: "vertical" }}
                      placeholder="Block content..."
                    />
                  </>
                )}
                {block.type === "poll" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>🗳️ Poll Block</div>
                    <input
                      className="input"
                      value={editValues.question ?? ""}
                      onChange={e => setEditValues(v => ({ ...v, question: e.target.value }))}
                      placeholder="Poll question"
                      style={{ fontSize: 13 }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {(editValues.options ?? []).map((opt, i) => (
                        <div key={i} style={{ display: "flex", gap: "0.375rem" }}>
                          <input
                            className="input"
                            value={opt}
                            onChange={e => {
                              const opts = [...(editValues.options ?? [])];
                              opts[i] = e.target.value;
                              setEditValues(v => ({ ...v, options: opts }));
                            }}
                            placeholder={`Option ${i + 1}`}
                            style={{ fontSize: 13, flex: 1 }}
                          />
                          {(editValues.options ?? []).length > 2 && (
                            <button
                              type="button"
                              onClick={() => setEditValues(v => ({ ...v, options: (v.options ?? []).filter((_, j) => j !== i) }))}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-error)", fontSize: 16 }}
                            >×</button>
                          )}
                        </div>
                      ))}
                      {(editValues.options ?? []).length < 6 && (
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <input
                            className="input"
                            value={newPollOption}
                            onChange={e => setNewPollOption(e.target.value)}
                            placeholder="New option..."
                            style={{ fontSize: 13, flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newPollOption.trim()) {
                                setEditValues(v => ({ ...v, options: [...(v.options ?? []), newPollOption.trim()] }));
                                setNewPollOption("");
                              }
                            }}
                            className="btn btn-secondary btn-sm"
                          >+ Add</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {block.type === "lead-form" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>📧 Lead Form Block</div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Title</label>
                      <input
                        className="input"
                        value={editValues.title ?? ""}
                        onChange={e => setEditValues(v => ({ ...v, title: e.target.value }))}
                        placeholder="Get in touch"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Description</label>
                      <input
                        className="input"
                        value={editValues.description ?? ""}
                        onChange={e => setEditValues(v => ({ ...v, description: e.target.value }))}
                        placeholder="I'd love to hear from you"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Button text</label>
                      <input
                        className="input"
                        value={editValues.buttonText ?? ""}
                        onChange={e => setEditValues(v => ({ ...v, buttonText: e.target.value }))}
                        placeholder="Send message"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    {/* Custom fields editor */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Custom fields</label>
                      {((editValues.customFields ?? block.customFields ?? []) as CustomFieldDef[]).map((f, idx) => (
                        <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <input className="input" placeholder="Field name" value={f.name} onChange={e => { const arr = [...((editValues.customFields ?? block.customFields ?? []) as CustomFieldDef[])]; arr[idx] = { ...arr[idx], name: e.target.value }; setEditValues(v => ({ ...v, customFields: arr })); }} style={{ flex: 1, minWidth: 0, fontSize: 12 }} />
                          <select className="input" value={f.type} onChange={e => { const arr = [...((editValues.customFields ?? block.customFields ?? []) as CustomFieldDef[])]; arr[idx] = { ...arr[idx], type: e.target.value as any }; setEditValues(v => ({ ...v, customFields: arr })); }} style={{ width: "auto", flexShrink: 0, fontSize: 12 }}><option value="text">Text</option><option value="number">Number</option><option value="dropdown">Dropdown</option><option value="checkbox">Checkbox</option></select>
                          <button type="button" onClick={() => { const arr = ((editValues.customFields ?? block.customFields ?? []) as CustomFieldDef[]).filter((_, j) => j !== idx); setEditValues(v => ({ ...v, customFields: arr })); }} style={{ background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", flexShrink: 0 }}>×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => { const arr = [...((editValues.customFields ?? block.customFields ?? []) as CustomFieldDef[]), { name: "", type: "text" as const, required: false }]; setEditValues(v => ({ ...v, customFields: arr })); }} className="btn btn-secondary btn-sm">+ Add field</button>
                    </div>
                  </>
                )}
                {block.type === "countdown" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>⏰ Countdown Block</div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Label</label>
                      <input className="input" value={editValues.title ?? ""} onChange={e => setEditValues(v => ({ ...v, title: e.target.value }))} placeholder="Event name" style={{ fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Target Date & Time</label>
                      <input type="datetime-local" className="input" value={editValues.targetDate ?? ""} onChange={e => setEditValues(v => ({ ...v, targetDate: e.target.value }))} style={{ fontSize: 13 }} />
                    </div>
                  </>
                )}
                {block.type === "image" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>🖼️ Image Block</div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Image URL</label>
                      <input className="input" value={editValues.src ?? ""} onChange={e => setEditValues(v => ({ ...v, src: e.target.value }))} placeholder="https://..." style={{ fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Caption (optional)</label>
                      <input className="input" value={editValues.caption ?? ""} onChange={e => setEditValues(v => ({ ...v, caption: e.target.value }))} placeholder="Image caption" style={{ fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Alt text</label>
                      <input className="input" value={editValues.alt ?? ""} onChange={e => setEditValues(v => ({ ...v, alt: e.target.value }))} placeholder="Describe the image" style={{ fontSize: 13 }} />
                    </div>
                  </>
                )}
                {block.type === "divider" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>➖ Divider Block</div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Style</label>
                      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                        {(["solid","dashed","dotted","double","gradient"] as const).map(s => (
                          <button key={s} type="button" onClick={() => setEditValues(v => ({ ...v, dividerStyle: s }))} style={{ padding: "0.25rem 0.6rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${(editValues.dividerStyle ?? block.dividerStyle ?? "solid") === s ? "var(--color-primary)" : "var(--color-border)"}`, background: (editValues.dividerStyle ?? block.dividerStyle ?? "solid") === s ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 10, fontWeight: 600, color: (editValues.dividerStyle ?? block.dividerStyle ?? "solid") === s ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer", textTransform: "capitalize" }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Thickness</label>
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        {(["1px","2px","3px","4px","6px"] as const).map(t => (
                          <button key={t} type="button" onClick={() => setEditValues(v => ({ ...v, thickness: t }))} style={{ flex: 1, padding: "0.25rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${(editValues.thickness ?? block.thickness ?? "2px") === t ? "var(--color-primary)" : "var(--color-border)"}`, background: (editValues.thickness ?? block.thickness ?? "2px") === t ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 10, fontWeight: 600, color: (editValues.thickness ?? block.thickness ?? "2px") === t ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer" }}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {block.type === "button" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>🔘 Button Block</div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Label</label>
                      <input className="input" value={editValues.title ?? ""} onChange={e => setEditValues(v => ({ ...v, title: e.target.value }))} placeholder="Click here" style={{ fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>URL</label>
                      <input className="input" value={editValues.url ?? ""} onChange={e => setEditValues(v => ({ ...v, url: e.target.value }))} placeholder="https://..." style={{ fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Description (optional)</label>
                      <input className="input" value={editValues.description ?? ""} onChange={e => setEditValues(v => ({ ...v, description: e.target.value }))} placeholder="Subtitle" style={{ fontSize: 13 }} />
                    </div>
                  </>
                )}
                {block.type === "testimonial" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>💬 Testimonial Block</div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Quote</label>
                      <textarea className="input" value={editValues.quote ?? ""} onChange={e => setEditValues(v => ({ ...v, quote: e.target.value }))} rows={3} placeholder="Enter testimonial quote..." style={{ fontSize: 13, resize: "vertical" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Author Name</label>
                      <input className="input" value={editValues.author ?? ""} onChange={e => setEditValues(v => ({ ...v, author: e.target.value }))} placeholder="Jane Smith" style={{ fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Author Title / Company</label>
                      <input className="input" value={editValues.authorRole ?? ""} onChange={e => setEditValues(v => ({ ...v, authorRole: e.target.value }))} placeholder="CEO, Acme Inc." style={{ fontSize: 13 }} />
                    </div>
                  </>
                )}
                {block.type === "faq" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>❓ FAQ Block</div>
                    {(editValues.faqs ?? []).map((item, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.5rem", background: "var(--color-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                        <input className="input" value={item.q ?? ""} onChange={e => { const arr = [...(editValues.faqs ?? [])]; arr[i] = { ...arr[i], q: e.target.value }; setEditValues(v => ({ ...v, faqs: arr })); }} placeholder={`Question ${i+1}`} style={{ fontSize: 12 }} />
                        <textarea className="input" value={item.a ?? ""} onChange={e => { const arr = [...(editValues.faqs ?? [])]; arr[i] = { ...arr[i], a: e.target.value }; setEditValues(v => ({ ...v, faqs: arr })); }} rows={2} placeholder="Answer..." style={{ fontSize: 12, resize: "vertical" }} />
                        <button type="button" onClick={() => { const arr = (editValues.faqs ?? []).filter((_, j) => j !== i); setEditValues(v => ({ ...v, faqs: arr })); }} style={{ alignSelf: "flex-end", background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", fontSize: 12 }}>Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setEditValues(v => ({ ...v, faqs: [...(v.faqs ?? []), { q: "", a: "" }] }))} className="btn btn-secondary btn-sm">+ Add FAQ Item</button>
                  </>
                )}
                {block.type === "video" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>🎬 Video Block</div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>YouTube / Vimeo URL</label>
                      <input className="input" value={editValues.src ?? ""} onChange={e => setEditValues(v => ({ ...v, src: e.target.value }))} placeholder="https://youtube.com/watch?v=..." style={{ fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem" }}>Caption (optional)</label>
                      <input className="input" value={editValues.caption ?? ""} onChange={e => setEditValues(v => ({ ...v, caption: e.target.value }))} placeholder="Video description" style={{ fontSize: 13 }} />
                    </div>
                  </>
                )}
                {block.type === "social-links" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>🌐 Social Links Block</div>
                    {(editValues.socials ?? []).map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <select className="input" value={p.platform ?? ""} onChange={e => { const arr = [...(editValues.socials ?? [])]; arr[i] = { ...arr[i], platform: e.target.value }; setEditValues(v => ({ ...v, socials: arr })); }} style={{ width: "auto", flexShrink: 0, fontSize: 12 }}>
                          {["instagram","tiktok","twitter","linkedin","youtube","facebook","github","pinterest","snapchat","website"].map(pl => <option key={pl} value={pl}>{pl.charAt(0).toUpperCase()+pl.slice(1)}</option>)}
                        </select>
                        <input className="input" value={p.url ?? ""} onChange={e => { const arr = [...(editValues.socials ?? [])]; arr[i] = { ...arr[i], url: e.target.value }; setEditValues(v => ({ ...v, socials: arr })); }} placeholder="https://... or @handle" style={{ flex: 1, minWidth: 0, fontSize: 12 }} />
                        <button type="button" onClick={() => { const arr = (editValues.socials ?? []).filter((_, j) => j !== i); setEditValues(v => ({ ...v, socials: arr })); }} style={{ background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setEditValues(v => ({ ...v, socials: [...(v.socials ?? []), { platform: "Instagram", url: "" }] }))} className="btn btn-secondary btn-sm">+ Add Platform</button>
                  </>
                )}
                {/* #14: link block edit form */}
                {block.type === "link" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>🔗 Link Block</div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input className="input" placeholder="Label" value={editValues.title ?? ""} onChange={e => setEditValues(v => ({ ...v, title: e.target.value }))} style={{ flex: 1, fontSize: 13 }} />
                      <input className="input" placeholder="URL (https://...)" value={editValues.url ?? ""} onChange={e => setEditValues(v => ({ ...v, url: e.target.value }))} style={{ flex: 2, fontSize: 13 }} />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", flexShrink: 0 }}>Icon:</span>
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                        {LINK_ICONS.map(ic => (
                          <button key={ic} type="button" onClick={() => setEditValues(v => ({ ...v, icon: ic }))} style={{ fontSize: 15, padding: "0.2rem", borderRadius: 4, background: (editValues.icon ?? block.icon ?? "🔗") === ic ? "var(--color-primary-highlight)" : "none", border: "none", cursor: "pointer" }}>{ic}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      {(["default", "featured", "outline"] as const).map(s => (
                        <button key={s} type="button" onClick={() => setEditValues(v => ({ ...v, linkStyle: s }))} style={{ flex: 1, padding: "0.3rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${(editValues.linkStyle ?? block.linkStyle ?? "default") === s ? "var(--color-primary)" : "var(--color-border)"}`, background: (editValues.linkStyle ?? block.linkStyle ?? "default") === s ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 10, fontWeight: 600, color: (editValues.linkStyle ?? block.linkStyle ?? "default") === s ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer" }}>{s}</button>
                      ))}
                    </div>
                  </>
                )}
                {/* vCard block edit form */}
                {block.type === "vcard" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>💾 vCard Block</div>
                    <input className="input" placeholder="Full name" value={editValues.vcName ?? block.vcName ?? ""} onChange={e => setEditValues(v => ({ ...v, vcName: e.target.value }))} style={{ fontSize: 13 }} />
                    <input className="input" placeholder="Job title" value={editValues.vcJobTitle ?? block.vcJobTitle ?? ""} onChange={e => setEditValues(v => ({ ...v, vcJobTitle: e.target.value }))} style={{ fontSize: 13 }} />
                    <input className="input" placeholder="Company" value={editValues.vcCompany ?? block.vcCompany ?? ""} onChange={e => setEditValues(v => ({ ...v, vcCompany: e.target.value }))} style={{ fontSize: 13 }} />
                    <input className="input" placeholder="Phone" value={editValues.vcPhone ?? block.vcPhone ?? ""} onChange={e => setEditValues(v => ({ ...v, vcPhone: e.target.value }))} style={{ fontSize: 13 }} />
                    <input className="input" placeholder="Email" value={editValues.vcEmail ?? block.vcEmail ?? ""} onChange={e => setEditValues(v => ({ ...v, vcEmail: e.target.value }))} style={{ fontSize: 13 }} />
                    <input className="input" placeholder="Website (https://...)" value={editValues.vcWebsite ?? block.vcWebsite ?? ""} onChange={e => setEditValues(v => ({ ...v, vcWebsite: e.target.value }))} style={{ fontSize: 13 }} />
                  </>
                )}
                {/* Booking block edit form */}
                {block.type === "booking" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>📅 Booking Block</div>
                    <select className="input" value={editValues.platform ?? block.platform ?? "calendly"} onChange={e => setEditValues(v => ({ ...v, platform: e.target.value as PageBlock["platform"] }))} style={{ fontSize: 13 }}>
                      <option value="calendly">Calendly</option>
                      <option value="cal">Cal.com</option>
                      <option value="google">Google Calendar</option>
                      <option value="tidycal">TidyCal</option>
                      <option value="other">Other</option>
                    </select>
                    <input className="input" placeholder="Booking URL (https://...)" value={editValues.embedUrl ?? block.embedUrl ?? ""} onChange={e => setEditValues(v => ({ ...v, embedUrl: e.target.value }))} style={{ fontSize: 13 }} />
                    <input className="input" placeholder="Label (e.g. Book a call with me)" value={editValues.title ?? block.title ?? ""} onChange={e => setEditValues(v => ({ ...v, title: e.target.value }))} style={{ fontSize: 13 }} />
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)", flexShrink: 0 }}>Height (px):</span>
                      <input className="input" type="number" min={300} max={1200} placeholder="650" value={editValues.embedHeight ?? block.embedHeight ?? 650} onChange={e => setEditValues(v => ({ ...v, embedHeight: Number(e.target.value) }))} style={{ fontSize: 13, width: 90 }} />
                    </div>
                  </>
                )}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={saveEdit} className="btn btn-primary btn-sm" disabled={saving} style={{ flex: 1, justifyContent: "center" }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => { setEditingBlockId(null); setEditValues({}); }} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>
                  {block.type === "text" ? "📝" :
                   block.type === "poll" ? "🗳️" :
                   block.type === "lead-form" ? "📧" :
                   block.type === "image" ? "🖼️" :
                   block.type === "video" ? "🎬" :
                   block.type === "social-links" ? "🌐" :
                   block.type === "countdown" ? "⏰" :
                   block.type === "divider" ? "➖" :
                   block.type === "button" ? "🔘" :
                   block.type === "testimonial" ? "💬" :
                   block.type === "faq" ? "❓" :
                   block.type === "link" ? "🔗" :
                   block.type === "vcard" ? "💾" :
                   block.type === "booking" ? "📅" : "📦"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {block.type === "text" && (
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {block.content?.slice(0, 60) ?? ""}
                    </div>
                  )}
                  {block.type === "poll" && (
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{block.question}</div>
                  )}
                  {block.type === "lead-form" && (
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{block.title || "Lead Capture Form"}</div>
                  )}
                  {(block.type === "image" || block.type === "video") && (
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.src}</div>
                  )}
                  {block.type === "social-links" && (
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{(block.socials?.length ?? 0)} social link{(block.socials?.length ?? 0) !== 1 ? "s" : ""}</div>
                  )}
                  {block.type === "countdown" && (
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{block.title || "Countdown"} → {block.targetDate}</div>
                  )}
                  {block.type === "divider" && (
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Divider</div>
                  )}
                  {block.type === "button" && (
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{block.title} → {block.url}</div>
                  )}
                  {block.type === "testimonial" && (
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>“{block.quote?.slice(0, 60)}”</div>
                  )}
                  {block.type === "faq" && (
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{block.faqs?.length ?? 0} question{(block.faqs?.length ?? 0) !== 1 ? "s" : ""}</div>
                  )}
                  {/* #14: link block summary */}
                  {block.type === "link" && (
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.icon ?? "🔗"} {block.title}</div>
                  )}
                  {block.type === "vcard" && (
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.vcName || "Contact card"}</div>
                  )}
                  {block.type === "booking" && (
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.title || "Booking embed"}</div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 2 }}>
                    {block.type === "text" && "Text block"}
                    {block.type === "poll" && `Poll · ${block.options?.length ?? 0} options`}
                    {block.type === "lead-form" && `Lead form · ${block.buttonText || "Send message"}`}
                    {block.type === "image" && "Image block"}
                    {block.type === "video" && "Video embed"}
                    {block.type === "social-links" && "Social links"}
                    {block.type === "countdown" && "Countdown timer"}
                    {block.type === "divider" && "Section divider"}
                    {block.type === "button" && "Call-to-action button"}
                    {block.type === "testimonial" && (block.author ? `— ${block.author}` : "Testimonial")}
                    {block.type === "faq" && "FAQ block"}
                    {block.type === "link" && (block.url ? block.url.replace(/^https?:\/\//, "").slice(0, 40) : "Link block")}
                    {block.type === "vcard" && (block.vcJobTitle ? `${block.vcJobTitle}${block.vcCompany ? ` · ${block.vcCompany}` : ""}` : "vCard download")}
                    {block.type === "booking" && (block.platform ? `${block.platform} booking embed` : "Booking embed")}
                  </div>
                </div>
                {newBlockIds?.has(block.id) && (
                  <span style={{ fontSize: 9, padding: "0.15rem 0.5rem", borderRadius: 999, background: "#e06b1a22", color: "#e06b1a", fontWeight: 700, flexShrink: 0, border: "1px solid #e06b1a44" }}>New</span>
                )}
                <span style={{ fontSize: 10, padding: "0.15rem 0.5rem", borderRadius: 999, background: "var(--color-surface-offset)", color: "var(--color-text-faint)", fontWeight: 600, flexShrink: 0 }}>
                  {block.type}
                </span>
                {/* Up/down arrows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "var(--color-border)" : "var(--color-text-faint)", padding: "0.1rem" }} aria-label="Move up">{icons.up}</button>
                  <button onClick={() => moveBlock(idx, 1)} disabled={idx === localBlocks.length - 1} style={{ background: "none", border: "none", cursor: idx === localBlocks.length - 1 ? "default" : "pointer", color: idx === localBlocks.length - 1 ? "var(--color-border)" : "var(--color-text-faint)", padding: "0.1rem" }} aria-label="Move down">{icons.down}</button>
                </div>
                <button onClick={() => startEdit(block)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 11, fontWeight: 600, padding: "0.25rem 0.375rem" }}>Edit</button>
                <button onClick={() => deleteBlock(block.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-error)", padding: "0.25rem" }} aria-label="Delete block">{icons.trash}</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Real Editor Panel ---
function EditorPanel({ pages, activePageId }: { pages: any[]; activePageId: number | null }) {
  const [selectedPageId, setSelectedPageId] = useState<number | null>(activePageId ?? pages[0]?.id ?? null);
  const [saveMsg, setSaveMsg] = useState("");
  // Mobile editor tab state (mobile-only). On desktop both panels are shown together.
  const [editorTab, setEditorTab] = useState<"blocks" | "add">("blocks");
  // #16: track newly added block IDs for amber highlight
  const [newBlockIds, setNewBlockIds] = useState<Set<string>>(new Set());
  useEffect(() => { if (activePageId) { setSelectedPageId(activePageId); setNewBlockIds(new Set()); } }, [activePageId]);
  // AI Wizard
  const [aiWizardOpen, setAiWizardOpen] = useState(false);
  const { data: licenceDataEditor } = useLicence();
  const editorTier: "free" | "pro" | "business" = (licenceDataEditor as any)?.tier ?? "free";
  const FREE_BLOCK_LIMIT = 5;

  const page = pages.find((p: any) => p.id === selectedPageId) || pages[0];

  // Parse blocks from page data
  const pageBlocks: PageBlock[] = (() => {
    try { return JSON.parse(page?.blocks ?? "[]"); } catch { return []; }
  })();

  // #14: links are now unified blocks; no separate link query needed

  const savePageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/pages/${selectedPageId}`, data);
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      setSaveMsg("✓ Saved!");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setTimeout(() => setSaveMsg(""), 2000);
    },
  });

  const saveBlocksMutation = useMutation({
    mutationFn: async (blocks: PageBlock[]) => {
      const res = await apiRequest("PATCH", `/api/pages/${selectedPageId}`, { blocks: JSON.stringify(blocks) });
      if (!res.ok) throw new Error("Failed to save blocks");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const endpoint = publish ? "publish" : "unpublish";
      const res = await apiRequest("POST", `/api/pages/${selectedPageId}/${endpoint}`);
      if (!res.ok) throw new Error("Failed to update publish state");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  // Bump these counters whenever a relevant mutation succeeds so the preview iframe refreshes.
  const [blocksUpdatedAt, setBlocksUpdatedAt] = useState(0);
  const [pageUpdatedAt, setPageUpdatedAt] = useState(0);
  useEffect(() => { if (saveBlocksMutation.isSuccess) setBlocksUpdatedAt(Date.now()); }, [saveBlocksMutation.isSuccess, saveBlocksMutation.data]);
  useEffect(() => { if (savePageMutation.isSuccess) setPageUpdatedAt(Date.now()); }, [savePageMutation.isSuccess, savePageMutation.data]);

  if (pages.length === 0) return <NoPageState />;

  return (
    <div className="editor-outer" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Left panel — page settings (G9: preview moved to far right) */}
      <div className="editor-settings-panel" style={{ width: 280, borderRight: "1px solid var(--color-border)", background: "var(--color-surface-2)", padding: "1.25rem", overflow: "auto" }}>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-faint)", marginBottom: "1rem" }}>Page settings</div>

        {pages.length > 1 && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Editing page</label>
            <select value={selectedPageId ?? ""} onChange={e => setSelectedPageId(Number(e.target.value))} className="input" style={{ fontSize: "var(--text-sm)" }}>
              {pages.map((p: any) => (
                <option key={p.id} value={p.id}>{p.username}</option>
              ))}
            </select>
          </div>
        )}

        <PageSettingsForm page={page} onSave={(data) => savePageMutation.mutate(data)} saving={savePageMutation.isPending} saveMsg={saveMsg} />

        <div style={{ height: 1, background: "var(--color-divider)", margin: "1.25rem 0" }} />

        {/* Publish toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>Published</div>
            <div style={{ fontSize: 11, color: "var(--color-text-faint)" }}>Visible at linkbay.ai/{page?.username}</div>
          </div>
          <button
            onClick={() => publishMutation.mutate(!page?.published)}
            disabled={publishMutation.isPending}
            data-testid="button-publish-toggle"
            style={{
              width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer", transition: "background 0.2s",
              background: page?.published ? "var(--color-success)" : "var(--color-surface-dynamic)",
              position: "relative",
            }}
            aria-label={page?.published ? "Unpublish page" : "Publish page"}
          >
            <div style={{
              width: 18, height: 18, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              position: "absolute", top: 3, transition: "left 0.2s",
              left: page?.published ? 22 : 3,
            }} />
          </button>
        </div>

        <Link href={`/${page?.username}`} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", fontSize: "var(--text-xs)" }} data-testid="link-preview-page">
          {icons.external} Preview page
        </Link>

        <div style={{ height: 1, background: "var(--color-divider)", margin: "1.25rem 0" }} />

        {/* AI Generate button */}
        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", fontSize: "var(--text-xs)", gap: "0.375rem" }}
          onClick={() => {
            if (editorTier === "free") {
              alert("Upgrade to Pro to use AI page generation.");
              return;
            }
            setAiWizardOpen(true);
          }}
          data-testid="button-ai-generate"
          title={editorTier === "free" ? "Pro feature — upgrade to use AI" : "Generate page with AI"}
        >
          ✨ Generate with AI
          {editorTier === "free" && <span style={{ fontSize: 9, padding: "0.1rem 0.35rem", background: "rgba(255,255,255,0.2)", borderRadius: 999, fontWeight: 700 }}>PRO</span>}
        </button>

        {aiWizardOpen && (
          <AIWizardModal
            onClose={() => setAiWizardOpen(false)}
            onApply={async (data: any) => {
              try {
                const updateData: any = {};
                if (data.background || data.blockStyle) {
                  // #17: merge blockStyle from AI into background JSON
                  const bgVal = data.background || "none";
                  const bStyle = data.blockStyle || "default";
                  updateData.background = bStyle !== "default" ? JSON.stringify({ bgValue: bgVal, blockStyle: bStyle }) : bgVal;
                } else if (data.background) {
                  updateData.background = data.background;
                }
                if (data.accentColor) updateData.accentColor = data.accentColor;
                if (data.title) updateData.title = data.title;
                if (data.bio) updateData.bio = data.bio;
                if (data.fontFamily) updateData.pageFont = data.fontFamily;
                if (data.blocks) {
                  // #18: normalise AI blocks (link, socials, lead_form) to app block types
                  const genId = () => "blk-" + Math.random().toString(36).slice(2, 8);
                  const normalised = (data.blocks as any[]).flatMap((b: any) => {
                    switch (b.type) {
                      case "link": return [{ id: b.id || genId(), type: "link", title: b.title || b.label || "Link", url: b.url || "", description: b.description || "", icon: b.icon || "🔗", linkStyle: b.linkStyle || "default" }];
                      case "socials": return [{ id: b.id || genId(), type: "social-links", socials: (b.links || []).map((l: any) => ({ platform: l.platform, url: l.url })) }];
                      case "lead_form": return [{ id: b.id || genId(), type: "lead-form", title: b.title || "Get in touch", description: b.description || "", buttonText: b.buttonText || "Send" }];
                      default: return [b];
                    }
                  });
                  updateData.blocks = JSON.stringify(normalised);
                  // #13/#13a: Mark all AI-generated blocks as new for highlighting
                  const newIds = (data.blocks as any[]).flatMap((b: any) => {
                    const gid = () => "blk-" + Math.random().toString(36).slice(2, 8);
                    switch (b.type) {
                      case "link": return [b.id || gid()];
                      case "socials": return [b.id || gid()];
                      case "lead_form": return [b.id || gid()];
                      default: return [b.id || gid()];
                    }
                  });
                  // Re-derive ids from normalised (already have genId calls above, need to align)
                  try {
                    const parsed = JSON.parse(updateData.blocks || "[]");
                    setNewBlockIds(prev => new Set([...Array.from(prev), ...parsed.map((b: any) => b.id)]));
                  } catch {}
                  void newIds;
                }
                await savePageMutation.mutateAsync(updateData);
                setAiWizardOpen(false);
              } catch {}
            }}
          />
        )}
      </div>

      {/* Right panel — #14: fully unified blocks (links are now link-type blocks) */}
      <div className="editor-blocks-panel" style={{ flex: 1, padding: "1.25rem", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>Blocks &amp; Links</h2>
          <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{pageBlocks.length} block{pageBlocks.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Mobile tab bar for blocks vs add-block (hidden on desktop) */}
        <div className="editor-mobile-tabs" style={{ display: "flex", borderBottom: "1px solid var(--color-divider)", margin: "1.25rem 0 1rem" }}>
          <button
            type="button"
            onClick={() => setEditorTab("blocks")}
            className={`editor-tab-btn${editorTab === "blocks" ? " active" : ""}`}
            style={{ flex: 1, padding: "0.5rem 0", background: "none", border: "none", cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 600, color: editorTab === "blocks" ? "var(--color-primary)" : "var(--color-text-faint)", borderBottom: editorTab === "blocks" ? "2px solid var(--color-primary)" : "2px solid transparent" }}
            data-testid="button-editor-tab-blocks"
          >
            My Blocks ({pageBlocks.length})
          </button>
          <button
            type="button"
            onClick={() => setEditorTab("add")}
            className={`editor-tab-btn${editorTab === "add" ? " active" : ""}`}
            style={{ flex: 1, padding: "0.5rem 0", background: "none", border: "none", cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 600, color: editorTab === "add" ? "var(--color-primary)" : "var(--color-text-faint)", borderBottom: editorTab === "add" ? "2px solid var(--color-primary)" : "2px solid transparent" }}
            data-testid="button-editor-tab-add"
          >
            + Add Block
          </button>
        </div>

        {/* Add new block */}
        <div className={editorTab === "add" ? "editor-pane editor-pane-active" : "editor-pane editor-pane-hidden-mobile"}>
          {editorTier === "free" && pageBlocks.length >= FREE_BLOCK_LIMIT ? (
            <div style={{ padding: "1.25rem", background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)", marginBottom: "0.375rem" }}>Free limit reached</div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: 0 }}>You\'ve used all {FREE_BLOCK_LIMIT} free blocks. Upgrade to Pro or Business for unlimited blocks.</p>
            </div>
          ) : (
            <AddBlockForm
              onAdd={(block) => { setNewBlockIds(prev => new Set(Array.from(prev).concat(block.id))); saveBlocksMutation.mutate([...(pageBlocks || []), block]); }}
              onAddAll={(newBlocks) => { setNewBlockIds(prev => new Set(Array.from(prev).concat(newBlocks.map(b => b.id)))); saveBlocksMutation.mutate([...(pageBlocks || []), ...newBlocks]); }}
              saving={saveBlocksMutation.isPending}
              remainingSlots={editorTier === "free" ? Math.max(0, FREE_BLOCK_LIMIT - pageBlocks.length) : 999}
            />
          )}
        </div>

        {/* Blocks editor */}
        <div className={editorTab === "blocks" ? "editor-pane editor-pane-active" : "editor-pane editor-pane-hidden-mobile"}>
          {pageBlocks.length > 0 && (
            <BlockEditor
              pageId={selectedPageId!}
              blocks={pageBlocks}
              onSave={(blocks) => saveBlocksMutation.mutate(blocks)}
              saving={saveBlocksMutation.isPending}
              newBlockIds={newBlockIds}
            />
          )}
        </div>
      </div>
      {/* G9: Live preview panel — far right, desktop only */}
      <LivePreviewPanel username={page?.username} previewKey={`${blocksUpdatedAt}-${pageUpdatedAt}`} />
    </div>
  );
}

// --- Add Block Form (text, poll, lead-form) ---
type CustomFieldDef = { name: string; type: "text" | "dropdown" | "checkbox" | "number"; required: boolean; options?: string[] };

type BlockKind = PageBlock["type"];

// ─── Smart Block Recommender (decision-tree wizard) ─────────────────────────
type WizardQuestion = { prompt: string; options: string[] };

// Goal 11: 5-question wizard. `answers` is an array of selected-answer arrays (one entry per asked question).
function getNextQuestion(answers: string[][]): WizardQuestion | null {
  if (answers.length === 0) {
    return {
      prompt: "What best describes you?",
      options: ["Creator / Influencer", "Business / Brand", "Freelancer / Consultant", "Job Seeker"],
    };
  }
  if (answers.length === 1) {
    const a0s = answers[0];
    // Mix options from all selected personas
    const set = new Set<string>();
    a0s.forEach(a0 => {
      if (a0 === "Creator / Influencer") ["Grow my following", "Monetise my content", "Build a community"].forEach(o => set.add(o));
      else if (a0 === "Business / Brand") ["Contact / Enquire", "Buy something", "Learn about us"].forEach(o => set.add(o));
      else if (a0 === "Freelancer / Consultant") ["Get more clients", "Share my work", "Both"].forEach(o => set.add(o));
      else if (a0 === "Job Seeker") ["My CV / Portfolio", "References / Testimonials"].forEach(o => set.add(o));
    });
    if (set.size === 0) return null;
    return { prompt: "What's your main goal?", options: Array.from(set) };
  }
  if (answers.length === 2) {
    return {
      prompt: "What's your aesthetic preference?",
      options: ["Minimal & clean", "Bold & colourful", "Professional", "Playful"],
    };
  }
  if (answers.length === 3) {
    return {
      prompt: "What content do you have ready?",
      options: ["Photos / images", "Videos", "Written copy", "Testimonials", "A link / product"],
    };
  }
  if (answers.length === 4) {
    return {
      prompt: "Anything specific you want to highlight?",
      options: ["An upcoming event", "A new product", "My social media", "Customer reviews", "Frequently asked questions"],
    };
  }
  return null;
}

// Score-based recommendation: each selected answer contributes weights to a set of block kinds.
function getRecommendations(answers: string[][]): BlockKind[] {
  const scores: Record<string, number> = {};
  const add = (kind: string, w = 1) => { scores[kind] = (scores[kind] || 0) + w; };
  const flat = answers.flat();
  for (const a of flat) {
    switch (a) {
      case "Creator / Influencer": add("social-links", 2); add("poll", 2); add("countdown", 1); add("button", 1); break;
      case "Business / Brand": add("lead-form", 3); add("text", 2); add("testimonial", 2); add("button", 2); add("faq", 1); break;
      case "Freelancer / Consultant": add("booking", 3); add("vcard", 2); add("lead-form", 2); add("testimonial", 2); add("button", 1); add("text", 1); break;
      case "Job Seeker": add("text", 2); add("button", 2); add("testimonial", 2); add("social-links", 1); break;
      case "Grow my following": add("social-links", 3); add("poll", 2); add("countdown", 1); break;
      case "Monetise my content": add("button", 3); add("lead-form", 2); add("testimonial", 1); break;
      case "Build a community": add("poll", 3); add("lead-form", 1); add("social-links", 2); break;
      case "Contact / Enquire": add("lead-form", 3); add("button", 1); break;
      case "Buy something": add("button", 3); add("countdown", 1); add("testimonial", 1); break;
      case "Learn about us": add("text", 2); add("faq", 2); add("testimonial", 1); break;
      case "Get more clients": add("booking", 2); add("lead-form", 3); add("testimonial", 2); add("vcard", 1); add("button", 1); break;
      case "Share my work": add("image", 2); add("button", 1); add("text", 2); break;
      case "Both": add("lead-form", 2); add("testimonial", 1); add("button", 1); break;
      case "My CV / Portfolio": add("text", 2); add("button", 2); add("image", 1); break;
      case "References / Testimonials": add("testimonial", 3); add("text", 1); break;
      case "Minimal & clean": add("text", 1); add("divider", 1); break;
      case "Bold & colourful": add("button", 1); add("image", 1); break;
      case "Professional": add("text", 1); add("testimonial", 1); add("lead-form", 1); break;
      case "Playful": add("poll", 1); add("countdown", 1); break;
      case "Photos / images": add("image", 3); break;
      case "Videos": add("video", 3); break;
      case "Written copy": add("text", 2); add("faq", 1); break;
      case "Testimonials": add("testimonial", 3); break;
      case "A link / product": add("button", 3); break;
      case "An upcoming event": add("countdown", 3); break;
      case "A new product": add("button", 2); add("countdown", 1); add("image", 1); break;
      case "My social media": add("social-links", 3); break;
      case "Customer reviews": add("testimonial", 3); break;
      case "Frequently asked questions": add("faq", 3); break;
    }
  }
  // If nothing was answered, fall back to sensible defaults
  if (Object.keys(scores).length === 0) {
    return ["text", "button", "social-links", "lead-form", "image"] as BlockKind[];
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return sorted.slice(0, 5) as BlockKind[];
}

const BLOCK_META: Record<string, { icon: string; name: string; desc: string }> = {
  text: { icon: "📝", name: "Text", desc: "Headlines, intros, and body copy" },
  poll: { icon: "🗳️", name: "Poll", desc: "Ask a question and gather opinions" },
  "lead-form": { icon: "📧", name: "Lead Form", desc: "Capture emails and enquiries" },
  image: { icon: "🖼️", name: "Image", desc: "Photos, illustrations, or screenshots" },
  video: { icon: "🎬", name: "Video", desc: "Embed YouTube, Vimeo, or Loom" },
  "social-links": { icon: "🌐", name: "Socials", desc: "Twitter, Instagram, LinkedIn, etc." },
  countdown: { icon: "⏰", name: "Countdown", desc: "Build anticipation with a timer" },
  divider: { icon: "➖", name: "Divider", desc: "Section break" },
  button: { icon: "🔘", name: "Button", desc: "Strong call-to-action link" },
  testimonial: { icon: "💬", name: "Testimonial", desc: "Customer quotes or reviews" },
  faq: { icon: "❓", name: "FAQ", desc: "Common questions and answers" },
  link: { icon: "🔗", name: "Link", desc: "A single link" },
  vcard: { icon: "💾", name: "vCard", desc: "Save contact details to phone" },
  booking: { icon: "📅", name: "Booking", desc: "Embed Calendly, Cal.com, or any scheduler" },
};

// Map wizard recommendations (which may include "link") onto valid block kinds we render today.
// We treat "link" as a button block since the AddBlockForm doesn't expose a standalone link kind here.
function normaliseRecommendation(kind: string): BlockKind {
  if (kind === "link") return "button" as BlockKind;
  return kind as BlockKind;
}

// ─── Live Preview Panel (Goal 18) ──────────────────────────────
// Renders the published page inside an iframe with a phone-shaped mockup.
// Hidden on screens narrower than 1100px via CSS class `live-preview-panel`.
function LivePreviewPanel({ username, previewKey }: { username?: string; previewKey: string }) {
  const [manualBump, setManualBump] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  if (!username) return null;
  // #12: nophoto=1 hides real avatar in preview, showing initials placeholder instead
  const src = `/${encodeURIComponent(username)}?preview=1&nophoto=1&t=${previewKey}-${manualBump}`;

  if (collapsed) {
    return (
      <div className="live-preview-panel live-preview-collapsed" style={{ width: 36, borderLeft: "1px solid var(--color-border)", background: "var(--color-surface-2)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "0.75rem" }}>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Show preview"
          aria-label="Show preview"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "0.25rem" }}
          data-testid="button-preview-expand"
        >
          📱
        </button>
      </div>
    );
  }

  return (
    <div className="live-preview-panel" style={{ width: 340, borderLeft: "1px solid var(--color-border)", background: "var(--color-surface-2)", padding: "1rem 0.75rem", overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "0.625rem", gap: "0.5rem" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-faint)" }}>Live preview</div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <button
            type="button"
            onClick={() => setManualBump(n => n + 1)}
            title="Refresh preview"
            aria-label="Refresh preview"
            style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 11, padding: "0.25rem 0.5rem", fontWeight: 600 }}
            data-testid="button-preview-refresh"
          >
            ↻
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Hide preview"
            aria-label="Hide preview"
            style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 11, padding: "0.25rem 0.5rem", fontWeight: 600 }}
            data-testid="button-preview-collapse"
          >
            ✕
          </button>
        </div>
      </div>
      {/* Phone mockup */}
      <div style={{ width: 280, height: 560, background: "#1a1a1a", borderRadius: 32, padding: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.15)", position: "relative" }}>
        <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: 60, height: 4, background: "#000", borderRadius: 999, zIndex: 2 }} />
        <iframe
          key={src}
          src={src}
          title="Live preview"
          style={{ width: "100%", height: "100%", border: "none", borderRadius: 24, background: "white" }}
          data-testid="iframe-live-preview"
        />
      </div>
      <div style={{ marginTop: "0.625rem", fontSize: 10, color: "var(--color-text-faint)", textAlign: "center" }}>Auto-refreshes when you save</div>
    </div>
  );
}

// Create a sensible default block for a given kind (used by "Add all 5 blocks")
function defaultBlockFor(kind: BlockKind): PageBlock {
  const id = `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  switch (kind) {
    case "text":
      return { id, type: "text", title: "About me", content: "Tell visitors who you are and what you do." };
    case "poll":
      return { id, type: "poll", question: "What do you think?", options: ["Option 1", "Option 2"] };
    case "lead-form":
      return { id, type: "lead-form", title: "Get in touch", description: "Leave your details and I'll be in touch.", buttonText: "Send message", customFields: [] };
    case "image":
      return { id, type: "image", src: "", alt: "", caption: "" };
    case "video":
      return { id, type: "video", src: "", caption: "" };
    case "social-links":
      return { id, type: "social-links", socials: [{ platform: "instagram", url: "" }, { platform: "twitter", url: "" }] };
    case "countdown":
      return { id, type: "countdown", title: "Launching soon", targetDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16) };
    case "divider":
      return { id, type: "divider" };
    case "button":
      return { id, type: "button", title: "Visit my site", url: "https://" };
    case "testimonial":
      return { id, type: "testimonial", quote: "This service changed my life!", author: "Happy customer", authorRole: "" };
    case "faq":
      return { id, type: "faq", faqs: [{ q: "How does it work?", a: "Click the button to get started." }] };
    case "vcard":
      return { id, type: "vcard", vcName: "", vcJobTitle: "", vcCompany: "", vcPhone: "", vcEmail: "", vcWebsite: "" };
    case "booking":
      return { id, type: "booking", platform: "calendly", embedUrl: "", title: "Book a call", embedHeight: 650 };
    default:
      return { id, type: "text", content: "" };
  }
}

function SmartBlockWizard({ onPick, onAddAll, onSkip }: { onPick: (kind: BlockKind) => void; onAddAll: (kinds: BlockKind[]) => void; onSkip: () => void }) {
  const [wizardAnswers, setWizardAnswers] = useState<string[][]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[] | null>(null);

  const question = recommendations === null ? getNextQuestion(wizardAnswers) : null;

  const toggleOption = (opt: string) => {
    setSelectedOptions(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  const continueStep = () => {
    const nextAnswers = [...wizardAnswers, selectedOptions];
    setWizardAnswers(nextAnswers);
    setSelectedOptions([]);
    const nextQ = getNextQuestion(nextAnswers);
    if (!nextQ) {
      setRecommendations(getRecommendations(nextAnswers));
    }
  };

  const skipStep = () => {
    const nextAnswers = [...wizardAnswers, [] as string[]];
    setWizardAnswers(nextAnswers);
    setSelectedOptions([]);
    const nextQ = getNextQuestion(nextAnswers);
    if (!nextQ) {
      setRecommendations(getRecommendations(nextAnswers));
    }
  };

  const restart = () => {
    setWizardAnswers([]);
    setSelectedOptions([]);
    setRecommendations(null);
  };

  const stepNum = wizardAnswers.length + 1;
  const totalSteps = 5;

  return (
    <div style={{ background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)", borderRadius: "var(--radius-lg)", padding: "1rem", marginBottom: "1rem" }} data-testid="smart-block-wizard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", gap: "0.5rem" }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--color-primary)" }}>
          🤖 Smart Block Recommender{recommendations === null && question ? ` · ${stepNum}/${totalSteps}` : ""}
        </div>
        <button type="button" onClick={onSkip} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 11, fontWeight: 600 }} data-testid="button-wizard-skip">
          I'll choose myself →
        </button>
      </div>

      {recommendations === null && question && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{question.prompt} <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500 }}>(pick any that apply)</span></p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {question.options.map(opt => {
              const isOn = selectedOptions.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOption(opt)}
                  style={{
                    padding: "0.4rem 0.75rem", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1.5px solid ${isOn ? "var(--color-primary)" : "var(--color-border)"}`,
                    background: isOn ? "var(--color-primary)" : "var(--color-surface)",
                    color: isOn ? "white" : "var(--color-text-muted)",
                  }}
                  data-testid={`button-wizard-answer-${opt.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  {isOn ? "✓ " : ""}{opt}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
            <button
              type="button"
              onClick={continueStep}
              disabled={selectedOptions.length === 0}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700, opacity: selectedOptions.length === 0 ? 0.5 : 1 }}
              data-testid="button-wizard-continue"
            >
              Continue →
            </button>
            <button type="button" onClick={skipStep} className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }} data-testid="button-wizard-step-skip">
              Skip
            </button>
          </div>
        </div>
      )}

      {recommendations && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Based on your answers, we recommend these blocks:</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.5rem" }}>
            {recommendations.map((kind, i) => {
              const meta = BLOCK_META[kind] ?? BLOCK_META.text;
              return (
                <button
                  key={`${kind}-${i}`}
                  type="button"
                  onClick={() => onPick(normaliseRecommendation(kind))}
                  style={{ textAlign: "left", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4 }}
                  data-testid={`button-wizard-rec-${kind}`}
                >
                  <span style={{ fontSize: 16 }}>{meta.icon} <span style={{ fontSize: 13, fontWeight: 700 }}>{meta.name}</span></span>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{meta.desc}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.25rem" }}>
            <button
              type="button"
              onClick={() => onAddAll(recommendations.map(normaliseRecommendation))}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700 }}
              data-testid="button-wizard-add-all"
            >
              ✨ Add all {recommendations.length} blocks to my page
            </button>
            <button type="button" onClick={restart} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontSize: 11, fontWeight: 600 }} data-testid="button-wizard-restart">↻ Start over</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Block Recommender — replaces Smart Block Wizard with real GPT-4o call ─
const BLOCK_GOAL_OPTIONS = [
  { value: "Grow my email list",           icon: "📬" },
  { value: "Promote a product or service", icon: "💼" },
  { value: "Boost engagement",             icon: "📈" },
  { value: "Share an update or news",      icon: "📰" },
  { value: "Announce a launch or event",   icon: "🚀" },
  { value: "Build community",              icon: "👥" },
];

// Follow-up question sets per goal
const GOAL_FOLLOWUPS: Record<string, Array<{ key: string; question: string; options: string[] }>> = {
  "Grow my email list": [
    { key: "audience", question: "Who is your target audience?", options: ["General public", "Professionals / B2B", "Students", "Local community"] },
    { key: "incentive", question: "What incentive will you offer?", options: ["Free guide / ebook", "Discount code", "Exclusive content", "Nothing yet"] },
  ],
  "Promote a product or service": [
    { key: "productType", question: "What are you selling?", options: ["Physical product", "Digital product", "Service / consulting", "Subscription"] },
    { key: "stage", question: "Where are you in your launch?", options: ["Pre-launch / waitlist", "Just launched", "Established", "Seasonal"] },
  ],
  "Boost engagement": [
    { key: "contentType", question: "What kind of content do you share?", options: ["Videos / reels", "Blog / articles", "Podcasts", "Photos"] },
    { key: "platform", question: "Where is your main audience?", options: ["Instagram", "TikTok", "YouTube", "LinkedIn"] },
  ],
  "Share an update or news": [
    { key: "updateType", question: "What kind of update?", options: ["Product launch", "Company news", "Personal milestone", "Event announcement"] },
  ],
  "Announce a launch or event": [
    { key: "eventType", question: "What are you announcing?", options: ["Live event / webinar", "Product launch", "Course / program", "Sale / promotion"] },
    { key: "timeline", question: "When is it happening?", options: ["This week", "This month", "In 1–3 months", "Future / TBD"] },
  ],
  "Build community": [
    { key: "community", question: "Where does your community live?", options: ["Discord / Slack", "Facebook Group", "Newsletter", "In-person"] },
    { key: "size", question: "How big is your community?", options: ["Just starting out", "Under 1,000", "1,000–10,000", "10,000+"] },
  ],
};

function AIBlockRecommender({ onAddAll, onSkip, remainingSlots }: { onAddAll: (blocks: PageBlock[]) => void; onSkip: () => void; remainingSlots: number }) {
  const { data: licData } = useLicence();
  const { data: userData } = useQuery({ queryKey: ["/api/auth/me"], queryFn: () => apiRequest("GET", "/api/auth/me").then(r => r.json()) });
  const [phase, setPhase] = useState<"ask" | "followup" | "loading" | "done" | "error">("ask");
  const [blockGoal, setBlockGoal] = useState("");
  const [followupStep, setFollowupStep] = useState(0);
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<PageBlock[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");

  const tier = (licData as any)?.tier || "free";
  const userName = (userData as any)?.name || "";

  const fetchSuggestions = (goal: string, answers: Record<string, string>) => {
    setPhase("loading");
    setErrorMsg("");
    const cap = remainingSlots > 0 ? Math.min(5, remainingSlots) : 5;
    const answerContext = Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join(", ");
    fetch("/api/ai/generate-page", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: {
          name: userName || "My Page",
          tagline: goal,
          goal: goal,
          industry: tier === "business" ? "Business" : "Professional",
          style: "clean, modern",
          blockGoal: goal,
          followupContext: answerContext,
          maxBlocks: cap,
        },
      }),
    })
      .then(async r => {
        let data: any;
        try { data = await r.json(); } catch { setErrorMsg(`AI service error (HTTP ${r.status}). Please try again.`); setPhase("error"); return; }
        if (!r.ok || data.error) { setErrorMsg(data.error || `AI service error (${r.status}). Please try again.`); setPhase("error"); return; }
        const genId = () => "blk-" + Math.random().toString(36).slice(2, 8);
        const mapped: PageBlock[] = (data.blocks || []).flatMap((b: any): PageBlock[] => {
          switch (b.type) {
            case "text": return [{ id: genId(), type: "text", content: b.content || "" }];
            case "poll": return [{ id: genId(), type: "poll", question: b.question || "Quick question", options: b.options || ["Option A", "Option B"] }];
            case "lead_form": return [{ id: genId(), type: "lead-form", title: b.title || "Get in touch", description: b.description || "", buttonText: b.buttonText || "Send" } as any];
            case "link": return [{ id: genId(), type: "link", title: b.title || b.label || "Link", url: b.url || "", description: b.description || "", icon: b.icon || "🔗", linkStyle: b.linkStyle || "default" } as any];
            case "socials": return [{ id: genId(), type: "social-links", socials: (b.links || []).map((l: any) => ({ platform: l.platform, url: l.url })) } as any];
            case "countdown": return [{ id: genId(), type: "countdown", title: b.title || "Coming soon", targetDate: b.targetDate || "2026-12-31" } as any];
            default: return [];
          }
        // #15: filter out blocks with no meaningful content (would be invisible on page)
        }).filter((block: PageBlock) => {
          const b = block as any;
          if (block.type === "text" && !b.content?.trim()) return false;
          if (block.type === "poll" && !b.question?.trim()) return false;
          if (block.type === "lead-form" && !b.title?.trim()) return false;
          if (block.type === "social-links" && (!b.socials?.length || b.socials.every((s: any) => !s.url))) return false;
          return true;
        }).slice(0, cap);
        setSuggestions(mapped);
        setSelected(new Set(mapped.map((_: PageBlock, i: number) => i)));
        setPhase("done");
      })
      .catch((err: any) => { setErrorMsg(`Could not reach AI service: ${err?.message || "network error"}. Please try again.`); setPhase("error"); });
  };

  const toggle = (i: number) => setSelected(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const blockIcon = (type: string) =>
    type === "text" ? "📝" : type === "poll" ? "📊" : type === "lead-form" ? "📬" : type === "social-links" ? "🔗" : type === "countdown" ? "⏳" : "🧩";

  // Phase: ask — one question before generating
  if (phase === "ask") return (
    <div style={{ marginBottom: "1rem", padding: "1rem", background: "var(--color-primary-highlight)", borderRadius: "var(--radius-lg)", border: "1.5px solid var(--color-primary)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)" }}>✨ What do you want to achieve?</span>
        <button style={{ background: "none", border: "none", fontSize: 11, color: "var(--color-text-faint)", cursor: "pointer" }} onClick={onSkip}>Skip</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem", marginBottom: "0.75rem" }}>
        {BLOCK_GOAL_OPTIONS.map(opt => {
          const active = blockGoal === opt.value;
          return (
            <button key={opt.value} type="button" onClick={() => setBlockGoal(opt.value)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.625rem", borderRadius: "var(--radius-md)", border: `1.5px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`, background: active ? "var(--color-surface)" : "var(--color-bg)", color: active ? "var(--color-primary)" : "var(--color-text)", fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", textAlign: "left" as const }}>
              <span>{opt.icon}</span>{opt.value}
            </button>
          );
        })}
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }} disabled={!blockGoal} onClick={() => {
        const fqs = GOAL_FOLLOWUPS[blockGoal] ?? [];
        if (fqs.length > 0) { setFollowupStep(0); setFollowupAnswers({}); setPhase("followup"); }
        else fetchSuggestions(blockGoal, {});
      }}>Next →</button>
    </div>
  );

  // Phase: followup — 1-2 context questions
  if (phase === "followup") {
    const fqs = GOAL_FOLLOWUPS[blockGoal] ?? [];
    const currentFQ = fqs[followupStep];
    if (!currentFQ) { fetchSuggestions(blockGoal, followupAnswers); return null; }
    const currentAnswer = followupAnswers[currentFQ.key] ?? "";
    return (
      <div style={{ marginBottom: "1rem", padding: "1rem", background: "var(--color-primary-highlight)", borderRadius: "var(--radius-lg)", border: "1.5px solid var(--color-primary)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)" }}>✨ {currentFQ.question}</span>
          <span style={{ fontSize: 10, color: "var(--color-text-faint)" }}>{followupStep + 1}/{fqs.length}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem", marginBottom: "0.75rem" }}>
          {currentFQ.options.map(opt => {
            const active = currentAnswer === opt;
            return (
              <button key={opt} type="button" onClick={() => setFollowupAnswers(prev => ({ ...prev, [currentFQ.key]: opt }))} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.625rem", borderRadius: "var(--radius-md)", border: `1.5px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`, background: active ? "var(--color-surface)" : "var(--color-bg)", color: active ? "var(--color-primary)" : "var(--color-text)", fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", textAlign: "left" as const }}>
                {opt}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => {
            if (followupStep === 0) { setPhase("ask"); } else { setFollowupStep(s => s - 1); }
          }}>← Back</button>
          <button className="btn btn-primary btn-sm" style={{ flex: 2, justifyContent: "center" }} disabled={!currentAnswer} onClick={() => {
            const newAnswers = { ...followupAnswers, [currentFQ.key]: currentAnswer };
            setFollowupAnswers(newAnswers);
            if (followupStep + 1 < fqs.length) { setFollowupStep(s => s + 1); }
            else { fetchSuggestions(blockGoal, newAnswers); }
          }}>{ followupStep + 1 < fqs.length ? "Next →" : "✨ Generate blocks" }</button>
        </div>
      </div>
    );
  }

  // Phase: loading
  if (phase === "loading") return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", background: "var(--color-primary-highlight)", borderRadius: "var(--radius-md)", marginBottom: "1rem" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid var(--color-primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 600 }}>GPT-4o is recommending blocks for you…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // Phase: error
  if (phase === "error") return (
    <div style={{ padding: "0.875rem 1rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" as const }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", flex: 1 }}>🤖 {errorMsg || "AI unavailable"} — pick a block below or retry.</span>
      <button className="btn btn-secondary btn-sm" onClick={() => fetchSuggestions(blockGoal, followupAnswers)}>Retry AI</button>
      <button className="btn btn-secondary btn-sm" onClick={onSkip}>Skip</button>
    </div>
  );

  // Phase: done
  if (phase === "done") return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)" }}>🤖 AI-recommended blocks</span>
        <button style={{ background: "none", border: "none", fontSize: 11, color: "var(--color-text-faint)", cursor: "pointer" }} onClick={onSkip}>Dismiss</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginBottom: "0.625rem" }}>
        {suggestions.map((b, i) => {
          const active = selected.has(i);
          return (
            <button key={i} type="button" onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: `1.5px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`, background: active ? "var(--color-primary-highlight)" : "var(--color-surface)", cursor: "pointer", textAlign: "left" as const }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`, background: active ? "var(--color-primary)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{active && "✓"}</div>
              <span style={{ fontSize: 14 }}>{blockIcon((b as any).type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? "var(--color-primary)" : "var(--color-text)", textTransform: "capitalize" as const }}>{(b as any).type} block</div>
                <div style={{ fontSize: 11, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(b as any).content || (b as any).question || (b as any).title || ""}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={onSkip}>Skip</button>
        <button className="btn btn-primary btn-sm" style={{ flex: 2, justifyContent: "center" }} disabled={selected.size === 0} onClick={() => onAddAll(suggestions.filter((_, i) => selected.has(i)))}>Add {selected.size} block{selected.size !== 1 ? "s" : ""} →</button>
      </div>
    </div>
  );

  return null;
}

function AddBlockForm({ onAdd, onAddAll, saving, remainingSlots }: { onAdd: (b: PageBlock) => void; onAddAll?: (blocks: PageBlock[]) => void; saving: boolean; remainingSlots?: number }) {
  const [collapsed, setCollapsed] = useState(true); // #10: collapsed by default
  const [blockType, setBlockType] = useState<BlockKind>("text");
  const [wizardSkipped, setWizardSkipped] = useState(false);
  // Text
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  // Poll
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  // Lead form
  const [leadTitle, setLeadTitle] = useState("");
  const [leadDescription, setLeadDescription] = useState("");
  const [leadButtonText, setLeadButtonText] = useState("Send message");
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  // #4: raw text for dropdown options to allow typing commas freely
  const [dropdownTexts, setDropdownTexts] = useState<Record<number, string>>({});
  // image / video
  const [mediaSrc, setMediaSrc] = useState("");
  const [mediaAlt, setMediaAlt] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  // social-links
  const [socials, setSocials] = useState<{ platform: string; url: string }[]>([{ platform: "twitter", url: "" }]);
  // countdown
  const [countdownTitle, setCountdownTitle] = useState("");
  const [countdownDate, setCountdownDate] = useState("");
  // divider
  const [divStyle, setDivStyle] = useState<"solid"|"dashed"|"dotted"|"double"|"gradient">("solid");
  const [divThickness, setDivThickness] = useState<"1px"|"2px"|"3px"|"4px"|"6px">("2px");
  // button
  const [btnLabel, setBtnLabel] = useState("");
  const [btnUrl, setBtnUrl] = useState("");
  // testimonial
  const [tQuote, setTQuote] = useState("");
  const [tAuthor, setTAuthor] = useState("");
  const [tRole, setTRole] = useState("");
  // faq
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([{ q: "", a: "" }]);
  // #14: link block
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkIcon, setLinkIcon] = useState("🔗");
  const [linkStyle, setLinkStyleState] = useState<"default" | "featured" | "outline">("default");
  const [error, setError] = useState("");

  const reset = () => {
    setTextTitle(""); setTextContent("");
    setPollQuestion(""); setPollOptions(["", ""]);
    setLeadTitle(""); setLeadDescription(""); setLeadButtonText("Send message"); setCustomFields([]);
    setMediaSrc(""); setMediaAlt(""); setMediaCaption("");
    setSocials([{ platform: "twitter", url: "" }]);
    setCountdownTitle(""); setCountdownDate("");
    setBtnLabel(""); setBtnUrl("");
    setTQuote(""); setTAuthor(""); setTRole("");
    setFaqs([{ q: "", a: "" }]);
    setLinkLabel(""); setLinkUrl(""); setLinkIcon("🔗"); setLinkStyleState("default");
    setError("");
  };

  const handleAdd = () => {
    setError("");
    const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (blockType === "text") {
      if (!textContent.trim()) { setError("Body text is required"); return; }
      const block: PageBlock = { id, type: "text", title: textTitle.trim() || undefined, content: textContent.trim() };
      onAdd(block);
    } else if (blockType === "poll") {
      const opts = pollOptions.map(o => o.trim()).filter(Boolean);
      if (!pollQuestion.trim()) { setError("Question is required"); return; }
      if (opts.length < 2) { setError("At least two options are required"); return; }
      const block: PageBlock = { id, type: "poll", question: pollQuestion.trim(), options: opts };
      onAdd(block);
    } else if (blockType === "lead-form") {
      if (!leadTitle.trim()) { setError("Title is required"); return; }
      const block: PageBlock = {
        id, type: "lead-form",
        title: leadTitle.trim(),
        description: leadDescription.trim() || undefined,
        buttonText: leadButtonText.trim() || "Send message",
        ...(customFields.length ? { customFields } as any : {}),
      };
      onAdd(block);
    } else if (blockType === "image") {
      if (!mediaSrc.trim()) { setError("Image URL is required"); return; }
      onAdd({ id, type: "image", src: mediaSrc.trim(), alt: mediaAlt.trim() || undefined, caption: mediaCaption.trim() || undefined });
    } else if (blockType === "video") {
      if (!mediaSrc.trim()) { setError("Video URL is required"); return; }
      onAdd({ id, type: "video", src: mediaSrc.trim(), caption: mediaCaption.trim() || undefined });
    } else if (blockType === "social-links") {
      const valid = socials.filter(s => s.url.trim());
      if (valid.length === 0) { setError("Add at least one social link"); return; }
      onAdd({ id, type: "social-links", socials: valid });
    } else if (blockType === "countdown") {
      if (!countdownDate) { setError("Target date is required"); return; }
      onAdd({ id, type: "countdown", title: countdownTitle.trim() || undefined, targetDate: countdownDate });
    } else if (blockType === "divider") {
      onAdd({ id, type: "divider", dividerStyle: divStyle, thickness: divThickness } as any);
    } else if (blockType === "button") {
      if (!btnLabel.trim() || !btnUrl.trim()) { setError("Label and URL are required"); return; }
      onAdd({ id, type: "button", title: btnLabel.trim(), url: btnUrl.trim() });
    } else if (blockType === "testimonial") {
      if (!tQuote.trim()) { setError("Quote is required"); return; }
      onAdd({ id, type: "testimonial", quote: tQuote.trim(), author: tAuthor.trim() || undefined, authorRole: tRole.trim() || undefined });
    } else if (blockType === "faq") {
      const valid = faqs.filter(f => f.q.trim() && f.a.trim());
      if (valid.length === 0) { setError("Add at least one Q&A"); return; }
      onAdd({ id, type: "faq", faqs: valid });
    } else if (blockType === "link") {
      if (!linkLabel.trim() || !linkUrl.trim()) { setError("Label and URL are required"); return; }
      onAdd({ id, type: "link", title: linkLabel.trim(), url: linkUrl.trim(), icon: linkIcon, linkStyle });
    }
    reset();
  };

  return (
    <div style={{ background: "var(--color-surface-2)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", marginTop: "1.5rem" }}>
      <button type="button" onClick={() => setCollapsed(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: "0.875rem 1.25rem", textAlign: "left" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>+ Add a content block</span>
        <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{collapsed ? "▼" : "▲"}</span>
      </button>
      {!collapsed && <div style={{ padding: "0 1.25rem 1.25rem" }}>

      {!wizardSkipped && (
        <AIBlockRecommender
          onAddAll={(blocks) => {
            if (onAddAll) onAddAll(blocks);
            else blocks.forEach(b => onAdd(b));
            setWizardSkipped(true);
          }}
          onSkip={() => setWizardSkipped(true)}
          remainingSlots={remainingSlots ?? 999}
        />
      )}

      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
        {([
          { id: "text", label: "📝 Text" },
          { id: "poll", label: "🗳️ Poll" },
          { id: "lead-form", label: "📧 Lead Form" },
          { id: "image", label: "🖼️ Image" },
          { id: "video", label: "🎬 Video" },
          { id: "social-links", label: "🌐 Socials" },
          { id: "countdown", label: "⏰ Countdown" },
          { id: "divider", label: "➖ Divider" },
          { id: "button", label: "🔘 Button" },
          { id: "testimonial", label: "💬 Testimonial" },
          { id: "faq", label: "❓ FAQ" },
          { id: "link", label: "🔗 Link" },
        ] as const).map(t => (

          <button
            key={t.id}
            type="button"
            onClick={() => { setBlockType(t.id); setError(""); }}
            data-testid={`tab-block-${t.id}`}
            style={{
              padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${blockType === t.id ? "var(--color-primary)" : "var(--color-border)"}`,
              background: blockType === t.id ? "var(--color-primary-highlight)" : "var(--color-surface)",
              color: blockType === t.id ? "var(--color-primary)" : "var(--color-text-muted)",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {blockType === "text" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="input" placeholder="Title (optional)" value={textTitle} onChange={e => setTextTitle(e.target.value)} style={{ fontSize: 13 }} data-testid="input-text-title" />
          <textarea className="input" placeholder="Body text" rows={3} value={textContent} onChange={e => setTextContent(e.target.value)} style={{ fontSize: 13, resize: "vertical" }} data-testid="input-text-body" />
        </div>
      )}

      {blockType === "poll" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="input" placeholder="Poll question" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} style={{ fontSize: 13 }} data-testid="input-poll-question" />
          {pollOptions.map((opt, i) => (
            <div key={i} style={{ display: "flex", gap: "0.375rem" }}>
              <input
                className="input"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={e => { const arr = [...pollOptions]; arr[i] = e.target.value; setPollOptions(arr); }}
                style={{ fontSize: 13, flex: 1 }}
              />
              {pollOptions.length > 2 && (
                <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", fontSize: 16 }}>×</button>
              )}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button type="button" onClick={() => setPollOptions([...pollOptions, ""])} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>+ Add option</button>
          )}
        </div>
      )}

      {blockType === "lead-form" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="input" placeholder="Form title (e.g. Get in touch)" value={leadTitle} onChange={e => setLeadTitle(e.target.value)} style={{ fontSize: 13 }} data-testid="input-form-title" />
          <input className="input" placeholder="Description (optional)" value={leadDescription} onChange={e => setLeadDescription(e.target.value)} style={{ fontSize: 13 }} />
          <input className="input" placeholder="Button text" value={leadButtonText} onChange={e => setLeadButtonText(e.target.value)} style={{ fontSize: 13 }} />
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: "0.5rem", color: "var(--color-text-muted)" }}>Custom fields</div>
          {customFields.map((f, idx) => (
            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0.5rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 6 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input className="input" placeholder="Field name" value={f.name} onChange={e => { const arr = [...customFields]; arr[idx] = { ...arr[idx], name: e.target.value }; setCustomFields(arr); }} style={{ flex: 1, minWidth: 0, fontSize: 12 }} />
                <select className="input" value={f.type} onChange={e => { const arr = [...customFields]; arr[idx] = { ...arr[idx], type: e.target.value as any }; setCustomFields(arr); }} style={{ width: "auto", flexShrink: 0, fontSize: 12 }}>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                  <input type="checkbox" checked={f.required} onChange={e => { const arr = [...customFields]; arr[idx] = { ...arr[idx], required: e.target.checked }; setCustomFields(arr); }} /> Req
                </label>
                <button type="button" onClick={() => setCustomFields(customFields.filter((_, j) => j !== idx))} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer" }}>×</button>
              </div>
              {f.type === "dropdown" && (
                <input
                  className="input"
                  placeholder="Comma-separated options (e.g. Option 1, Option 2)"
                  value={dropdownTexts[idx] !== undefined ? dropdownTexts[idx] : (f.options || []).join(", ")}
                  onChange={e => setDropdownTexts(t => ({ ...t, [idx]: e.target.value }))}
                  onBlur={e => {
                    const arr = [...customFields];
                    arr[idx] = { ...arr[idx], options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) };
                    setCustomFields(arr);
                    setDropdownTexts(t => { const n = { ...t }; delete n[idx]; return n; });
                  }}
                  style={{ fontSize: 12 }}
                />
              )}
            </div>
          ))}
          <button type="button" onClick={() => setCustomFields([...customFields, { name: "", type: "text", required: false }])} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>+ Add field</button>
        </div>
      )}

      {blockType === "image" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="input" placeholder="Image URL (https://...)" value={mediaSrc} onChange={e => setMediaSrc(e.target.value)} style={{ fontSize: 13 }} />
          <input className="input" placeholder="Alt text (for accessibility)" value={mediaAlt} onChange={e => setMediaAlt(e.target.value)} style={{ fontSize: 13 }} />
          <input className="input" placeholder="Caption (optional)" value={mediaCaption} onChange={e => setMediaCaption(e.target.value)} style={{ fontSize: 13 }} />
        </div>
      )}

      {blockType === "video" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="input" placeholder="YouTube / Vimeo URL" value={mediaSrc} onChange={e => setMediaSrc(e.target.value)} style={{ fontSize: 13 }} />
          <input className="input" placeholder="Caption (optional)" value={mediaCaption} onChange={e => setMediaCaption(e.target.value)} style={{ fontSize: 13 }} />
        </div>
      )}

      {blockType === "social-links" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {socials.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <select className="input" value={s.platform} onChange={e => { const arr = [...socials]; arr[i] = { ...arr[i], platform: e.target.value }; setSocials(arr); }} style={{ fontSize: 13, width: "auto", flexShrink: 0 }}>
                <option value="twitter">Twitter / X</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="github">GitHub</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="website">Website</option>
              </select>
              <input className="input" placeholder="https://... or @handle" value={s.url} onChange={e => { const arr = [...socials]; arr[i] = { ...arr[i], url: e.target.value }; setSocials(arr); }} style={{ flex: 1, minWidth: 0, fontSize: 13 }} />
              {socials.length > 1 && <button type="button" onClick={() => setSocials(socials.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", flexShrink: 0 }}>×</button>}
            </div>
          ))}
          <button type="button" onClick={() => setSocials([...socials, { platform: "twitter", url: "" }])} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>+ Add link</button>
        </div>
      )}

      {blockType === "countdown" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="input" placeholder="Countdown title (e.g. Launch in...)" value={countdownTitle} onChange={e => setCountdownTitle(e.target.value)} style={{ fontSize: 13 }} />
          <input type="datetime-local" className="input" value={countdownDate} onChange={e => setCountdownDate(e.target.value)} style={{ fontSize: 13 }} />
        </div>
      )}

      {blockType === "divider" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Style</label>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {(["solid","dashed","dotted","double","gradient"] as const).map(s => (
                <button key={s} type="button" onClick={() => setDivStyle(s)} style={{ padding: "0.25rem 0.6rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${divStyle === s ? "var(--color-primary)" : "var(--color-border)"}`, background: divStyle === s ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 10, fontWeight: 600, color: divStyle === s ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer", textTransform: "capitalize" }}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Thickness</label>
            <div style={{ display: "flex", gap: "0.375rem" }}>
              {(["1px","2px","3px","4px","6px"] as const).map(t => (
                <button key={t} type="button" onClick={() => setDivThickness(t)} style={{ flex: 1, padding: "0.25rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${divThickness === t ? "var(--color-primary)" : "var(--color-border)"}`, background: divThickness === t ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 10, fontWeight: 600, color: divThickness === t ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer" }}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {blockType === "button" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="input" placeholder="Button label" value={btnLabel} onChange={e => setBtnLabel(e.target.value)} style={{ fontSize: 13 }} />
          <input className="input" placeholder="URL (https://...)" value={btnUrl} onChange={e => setBtnUrl(e.target.value)} style={{ fontSize: 13 }} />
        </div>
      )}

      {blockType === "testimonial" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <textarea className="input" placeholder="Quote" value={tQuote} onChange={e => setTQuote(e.target.value)} rows={3} style={{ fontSize: 13, resize: "vertical" }} />
          <input className="input" placeholder="Author name" value={tAuthor} onChange={e => setTAuthor(e.target.value)} style={{ fontSize: 13 }} />
          <input className="input" placeholder="Author role / company (optional)" value={tRole} onChange={e => setTRole(e.target.value)} style={{ fontSize: 13 }} />
        </div>
      )}

      {blockType === "faq" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: 6 }}>
              <input className="input" placeholder="Question" value={f.q} onChange={e => { const arr = [...faqs]; arr[i] = { ...arr[i], q: e.target.value }; setFaqs(arr); }} style={{ fontSize: 13 }} />
              <textarea className="input" placeholder="Answer" value={f.a} onChange={e => { const arr = [...faqs]; arr[i] = { ...arr[i], a: e.target.value }; setFaqs(arr); }} rows={2} style={{ fontSize: 13, resize: "vertical" }} />
              {faqs.length > 1 && <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>Remove</button>}
            </div>
          ))}
          <button type="button" onClick={() => setFaqs([...faqs, { q: "", a: "" }])} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>+ Add Q&A</button>
        </div>
      )}

      {/* #14: Link block form */}
      {blockType === "link" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input className="input" placeholder="Label (e.g. Book a call)" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} style={{ flex: 1, fontSize: 13 }} data-testid="input-link-label" />
            <input className="input" placeholder="URL (https://...)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} style={{ flex: 2, fontSize: 13 }} data-testid="input-link-url" />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", flexShrink: 0 }}>Icon:</span>
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              {LINK_ICONS.slice(0, 8).map(ic => (
                <button key={ic} type="button" onClick={() => setLinkIcon(ic)} style={{ fontSize: 15, padding: "0.2rem", borderRadius: 4, background: linkIcon === ic ? "var(--color-primary-highlight)" : "none", border: "none", cursor: "pointer" }}>{ic}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.375rem", marginLeft: "auto" }}>
              {(["default", "featured"] as const).map(s => (
                <button key={s} type="button" onClick={() => setLinkStyleState(s)} style={{ padding: "0.3rem 0.625rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${linkStyle === s ? "var(--color-primary)" : "var(--color-border)"}`, background: linkStyle === s ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 10, fontWeight: 600, color: linkStyle === s ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer" }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: "var(--color-error)", marginTop: "0.5rem" }}>{error}</p>}

      <button
        type="button"
        onClick={handleAdd}
        disabled={saving}
        className="btn btn-primary"
        style={{ justifyContent: "center", marginTop: "0.75rem", width: "100%" }}
        data-testid="button-add-block"
      >
        {saving ? "Adding…" : `Add ${blockType.replace("-", " ")} block`}
      </button>
      </div>}
    </div>
  );
}

// --- Analytics Panel with Recharts ---
// WCAG AA contrast helper — returns white or black for sufficient contrast on given bg
function autoContrastColor(bg: string): string {
  if (!bg || bg.length < 4) return "#ffffff";
  const h = bg.replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return lum > 0.179 ? "#0a0a0b" : "#ffffff";
}

function AnalyticsPanel({ pages, activePageId, setActivePageId }: { pages: any[]; activePageId: number | null; setActivePageId: (id: number) => void }) {
  const [scope, setScope] = useState<"page" | "all">("page");
  // #17: initialise from activePageId so the current page is shown by default
  const [selectedPageId, setSelectedPageId] = useState<number | null>(activePageId ?? pages[0]?.id ?? null);
  useEffect(() => { if (activePageId && !selectedPageId) setSelectedPageId(activePageId); }, [activePageId]);
  // G10: 7d/14d/30d/60d/All (0=All)
  const [days, setDays] = useState<number>(7);
  const [graphSeries, setGraphSeries] = useState<"views" | "clicks" | "leads">("views");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const effectiveDays = days === 0 ? 3650 : days;

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/pages", selectedPageId, "analytics", days],
    queryFn: async () => {
      if (!selectedPageId) return null;
      const res = await apiRequest("GET", `/api/pages/${selectedPageId}/analytics?days=${effectiveDays}`);
      return res.json();
    },
    enabled: !!selectedPageId,
  });

  if (pages.length === 0) return <NoPageState />;

  const page = pages.find((p: any) => p.id === selectedPageId) || pages[0];

  // Build chart data (merged series)
  const dailyViews = analytics?.dailyViews ?? [];
  const dailyClicks = analytics?.dailyClicks ?? [];
  const dailyLeads = analytics?.dailyLeads ?? [];
  // Parse YYYY-MM-DD, YYYY-Www (ISO week), or YYYY-MM (month) safely
  const parseDateLabel = (dateStr: string): string => {
    if (/^\d{4}-W\d{2}$/.test(dateStr)) {
      const [yearStr, weekStr] = dateStr.split("-W");
      const year = parseInt(yearStr, 10);
      const week = parseInt(weekStr, 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay() || 7;
      const weekStart = new Date(jan4);
      weekStart.setDate(jan4.getDate() - (dayOfWeek - 1) + (week - 1) * 7);
      return `Wk ${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    }
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      const [yr, mo] = dateStr.split("-");
      const d = new Date(parseInt(yr), parseInt(mo) - 1, 1);
      return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    }
    const d = new Date(dateStr + "T00:00:00");
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  const chartData = dailyViews.map((d: { date: string; count: number }, i: number) => ({
    date: parseDateLabel(d.date),
    Views: d.count,
    Clicks: (dailyClicks[i] as any)?.count ?? 0,
    Leads: (dailyLeads[i] as any)?.count ?? 0,
  }));

  return (
    <div className="analytics-panel-content" style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
      <div className="analytics-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.25rem" }}>Analytics</h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{days === 0 ? "All-time" : `${days}-day`} performance for linkbay.ai/{page?.username}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* #6: page selector now on LEFT of date pills */}
          {pages.length > 1 && scope === "page" && (
            <select value={selectedPageId ?? ""} onChange={e => { setSelectedPageId(Number(e.target.value)); setActivePageId(Number(e.target.value)); }} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {pages.map((p: any) => <option key={p.id} value={p.id}>linkbay.ai/{p.username}</option>)}
            </select>
          )}
          {/* G10: Date range tabs — 7d/14d/30d/60d/All */}
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {([7, 14, 30, 60, 0] as number[]).map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: "0.25rem 0.625rem", borderRadius: "var(--radius-md)", fontSize: 11, fontWeight: 600,
                  border: `1px solid ${days === d ? "var(--color-primary)" : "transparent"}`,
                  background: days === d ? "var(--color-primary-highlight)" : "var(--color-surface-offset)",
                  color: days === d ? "var(--color-primary)" : "var(--color-text-faint)",
                  cursor: "pointer",
                }}
              >
                {d === 0 ? "All" : `${d}d`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: "var(--radius-lg)" }} />)}
        </div>
      ) : analytics ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Stats row — order: Views, Avg Views, Interactions, Interaction Rate, Unique Visitors, Repeat Visitors, Best Day, Leads Captured */}
          {(() => {
            const prev = analytics.prevPeriod;
            const pctChange = (curr: number, prevVal: number) => {
              if (!prev || days === 0) return null;
              if (prevVal === 0) return curr > 0 ? 100 : null;
              return Math.round(((curr - prevVal) / prevVal) * 100);
            };
            const pctLabel = (curr: number, prevVal: number) => {
              const p = pctChange(curr, prevVal);
              if (p === null) return null;
              const sign = p >= 0 ? "+" : "";
              return { text: `${sign}${p}%`, up: p >= 0 };
            };
            const prevClickRate = prev && prev.views > 0 ? Math.round((prev.clicks / prev.views) * 1000) / 10 : 0;
            // #8a: "Total Views All Time" card only shown when days===0; doesn't linger
            // #8b: card order: Views, Avg Views, Interactions, Interaction Rate, Unique Visitors, Repeat Visitors, Best Day, Leads Captured
            // #8: Best day — safe date parsing (T00:00:00 suffix already in parseDateLabel but bestDay.label is pre-formatted)
            const bestDayLabel = analytics.bestDay
              ? (() => {
                  const raw = analytics.bestDay.date || analytics.bestDay.label || "";
                  const d = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
                  const label = isNaN(d.getTime()) ? raw : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
                  return `${analytics.bestDay.count} views (${label})`;
                })()
              : "No data";
            const cards = [
              { label: days === 0 ? "Total views (all time)" : `Views (${days}d)`, value: (days === 0 ? analytics.totalViews : analytics.periodViews)?.toLocaleString() ?? "0", delta: pctLabel(analytics.periodViews ?? 0, prev?.views ?? 0) },
              { label: "Views per visitor", value: analytics.avgSessionViews != null ? analytics.avgSessionViews.toFixed(1) : "—", delta: null, tooltip: "Average page views per unique visitor" },
              { label: days === 0 ? "Interactions (all time)" : `Interactions (${days}d)`, value: analytics.periodClicks?.toLocaleString() ?? "0", delta: pctLabel(analytics.periodClicks ?? 0, prev?.clicks ?? 0) },
              { label: "Interaction rate", value: analytics.clickRate ? `${analytics.clickRate}%` : "0%", delta: prev ? pctLabel(analytics.clickRate ?? 0, prevClickRate) : null, tooltip: "Link clicks ÷ page views for this period" },
              { label: "Unique visitors", value: (analytics.uniqueVisitors ?? 0).toLocaleString(), delta: pctLabel(analytics.uniqueVisitors ?? 0, prev?.uniqueVisitors ?? 0) },
              { label: "Repeat visitors", value: (analytics.repeatVisitors ?? 0).toLocaleString(), delta: prev ? pctLabel(analytics.repeatVisitors ?? 0, prev?.repeatVisitors ?? 0) : null },
              { label: "Best day", value: bestDayLabel, delta: null },
              { label: days === 0 ? "Leads (all time)" : `Leads (${days}d)`, value: (analytics.leadsCount ?? 0).toLocaleString(), delta: null, tooltip: "Form submissions in this period" },
            ];
            return (
              <div className="stats-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                {cards.map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-label" title={(s as any).tooltip || undefined}>
                      {s.label}{(s as any).tooltip && <span style={{ marginLeft: 4, fontSize: 10, color: "var(--color-text-faint)", cursor: "help" }}>ⓘ</span>}
                    </div>
                    <div className="stat-value" style={{ marginTop: "0.5rem" }}>{s.value}</div>
                    {s.delta && (
                      <div style={{ fontSize: 11, fontWeight: 700, marginTop: "0.375rem", color: s.delta.up ? "var(--color-success)" : "#ef4444" }}>
                        {s.delta.text} vs prev {days}d
                      </div>
                    )}
                    {!(s.delta) && (s as any).tooltip === undefined && <div style={{ height: 16 }} />}
                  </div>
                ))}
              </div>
            );
          })()}
          {/* end stats row */}

          {/* Views/Clicks/Leads chart with dropdown */}
          {chartData.length > 0 && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>
                  {graphSeries === "views" ? "Page views" : graphSeries === "clicks" ? "Interactions" : "Leads"} — {days === 0 ? "All time" : `last ${days} days`}
                </div>
                <select
                  value={graphSeries}
                  onChange={e => setGraphSeries(e.target.value as any)}
                  className="input"
                  style={{ fontSize: 11, width: "auto", padding: "0.25rem 0.5rem", height: "auto" }}
                  data-testid="select-analytics-graph-series"
                >
                  <option value="views">Views</option>
                  <option value="clicks">Interactions</option>
                  <option value="leads">Leads</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                  <defs>
                    <linearGradient id="viewsGradFull" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e06b1a" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#e06b1a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: 12 }}
                    labelStyle={{ fontWeight: 700, color: "var(--color-text)" }}
                    itemStyle={{ color: "#e06b1a" }}
                  />
                  <Area type="monotone" dataKey={graphSeries === "views" ? "Views" : graphSeries === "clicks" ? "Clicks" : "Leads"} stroke="#e06b1a" strokeWidth={2} fill="url(#viewsGradFull)" dot={false} activeDot={{ r: 4, fill: "#e06b1a" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* #10: AI analysis — full width, above detail grid */}
          <div className="card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: aiResult ? "0.875rem" : 0, flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>AI page analysis</div>
                <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 2 }}>Refreshes once per day</div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
                onClick={async () => {
                  if (!selectedPageId) return;
                  setAiLoading(true); setAiResult(null); setAiError(null);
                  try {
                    const res = await fetch(`/api/pages/${selectedPageId}/ai-analysis`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                    });
                    if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
                    const d = await res.json();
                    setAiResult(d.analysis || "No analysis returned.");
                  } catch (err: any) {
                    setAiError(err.message || "Failed to fetch AI analysis.");
                  } finally {
                    setAiLoading(false);
                  }
                }}
                disabled={aiLoading}
                data-testid="button-ai-analysis"
              >
                {icons.ai}{aiLoading ? "Analysing…" : "Get analysis"}
              </button>
            </div>
            {aiError && <p style={{ color: "#ef4444", fontSize: 12, marginTop: "0.5rem" }}>{aiError}</p>}
            {aiResult && (
              <div style={{ padding: "0.875rem", background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: 13, lineHeight: 1.8, color: "var(--color-text-muted)" }}>
                {aiResult}
              </div>
            )}
            {!aiResult && !aiLoading && !aiError && (
              <p style={{ fontSize: 12, color: "var(--color-text-faint)", marginTop: "0.5rem" }}>Click to get personalised insights on your page performance and content.</p>
            )}
          </div>

          <div className="analytics-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {/* Top links */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.75rem" }}>Top Interactions</div>
              {(() => {
                const interactions = analytics.topInteractions ?? analytics.topLinks ?? [];
                if (interactions.length === 0) return <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>No interactions yet.</div>;
                const totalPageViews = Math.max(analytics.periodViews ?? analytics.totalViews ?? 1, 1);
                return interactions.map((item: any) => {
                  const total = item.total ?? item.clickCount ?? 0;
                  const interactionPct = Math.min(Math.round((total / totalPageViews) * 1000) / 10, 100);
                  const emoji = blockTypeEmoji(item.type || item.blockType || "link");
                  return (
                    <div key={item.id || item.blockId || item.label} style={{ marginBottom: "0.875rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", marginBottom: 4, gap: "0.5rem" }}>
                        <span style={{ color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}><span style={{ marginRight: "0.25rem" }}>{emoji}</span>{item.label || item.blockType || "Interaction"}</span>
                        <span style={{ fontWeight: 700, color: "var(--color-primary)", flexShrink: 0 }}>Interaction rate: {interactionPct.toFixed(1)}%</span>
                      </div>
                      {/* Stacked bar: views (amber) + interactions (primary) */}
                      <div style={{ height: 7, background: "var(--color-divider)", borderRadius: 999, overflow: "hidden", display: "flex" }}>
                        <div style={{ height: "100%", width: `${Math.min(100 - interactionPct, 100)}%`, background: "#f59e0b", opacity: 0.35, transition: "width 0.4s" }} />
                        <div style={{ height: "100%", width: `${interactionPct}%`, background: "var(--color-primary)", borderRadius: "0 999px 999px 0", transition: "width 0.4s" }} />
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", fontSize: 11, color: "var(--color-text-faint)", marginTop: 3 }}>
                        <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: "#f59e0b", opacity: 0.6, marginRight: 3, verticalAlign: "middle" }} />Page views: {totalPageViews}</span>
                        <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: "var(--color-primary)", marginRight: 3, verticalAlign: "middle" }} />Interactions: {total}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Device split + export */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>Device breakdown</div>
                {Object.entries(analytics.devices || {}).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1rem", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>No data yet.</div>
                ) : (
                  Object.entries(analytics.devices || {}).map(([device, count]: [string, any]) => {
                    const pct = analytics.devicePct?.[device];
                    return (
                      <div key={device} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--color-divider)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                            {device === "mobile" ? "📱" : "💻"} {device}
                          </span>
                          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>{count} {pct != null ? <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>({pct}%)</span> : null}</span>
                        </div>
                        {pct != null && (
                          <div style={{ height: 5, background: "var(--color-divider)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-primary)", borderRadius: 999, transition: "width 0.4s" }} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>Top countries</div>
                {(analytics.topCountries || []).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1rem", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>No location data yet.</div>
                ) : (
                  (analytics.topCountries || []).map((c: any) => {
                    const code = (c.country || "").trim().toUpperCase();
                    // S7 #18: show full country name using Intl.DisplayNames
                    const getCountryName = (iso: string) => {
                      if (!iso || iso.length !== 2) return "Unknown";
                      try { return new Intl.DisplayNames(["en"], { type: "region" }).of(iso) || iso; } catch { return iso; }
                    };
                    const flag = code.length === 2
                      ? String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1))
                      : "🌍";
                    return (
                      <div key={code || "unknown"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--color-divider)" }}>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: 18, fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif' }}>{flag}</span>
                          <span>{getCountryName(code)}</span>
                        </span>
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>{c.count} views</span>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>Export data</div>
                <button
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0.875rem", background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left" }}
                  onClick={() => {
                    const exportData = { ...analytics, period: `${days}d`, exportedAt: new Date().toISOString() };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `linkbay-analytics-${page?.username}-${days}d.json`; a.click();
                  }}
                  data-testid="button-export-analytics"
                >
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>Export events (JSON)</div>
                    <div style={{ fontSize: 10, color: "var(--color-text-faint)" }}>Raw event log · {days}-day window</div>
                  </div>
                  <span style={{ fontSize: 16, color: "var(--color-text-faint)" }}>↓</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>No analytics data yet.</div>
      )}
    </div>
  );
}

// --- Lead detail modal ---
function LeadDetailModal({ lead, onClose, onStatusChange, onNotesSave, onConvert, onDelete, statusOptions }: {
  lead: any;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
  onNotesSave: (id: number, notes: string) => void;
  onConvert?: (id: number) => void;
  onDelete?: (id: number) => void;
  statusOptions?: string[];
}) {
  const opts = statusOptions ?? ["new", "contacted", "qualified", "proposal", "won", "lost", "archived"];
  let customFields: Record<string, any> | null = null;
  try {
    if (lead.customFields) customFields = typeof lead.customFields === "string" ? JSON.parse(lead.customFields) : lead.customFields;
  } catch { customFields = null; }
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [notesMsg, setNotesMsg] = useState("");

  const saveNotes = () => {
    onNotesSave(lead.id, notes);
    setNotesMsg("Saved!");
    setTimeout(() => setNotesMsg(""), 2000);
  };

  return (
    <div
      className="modal-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "1.75rem", width: "100%", maxWidth: 480, boxShadow: "var(--shadow-xl)", position: "relative" }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)" }}>{icons.close}</button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "0.875rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-primary-highlight)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>
            {lead.name[0]}
          </div>
          <div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>{lead.name}</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{lead.email}</div>
          </div>
        </div>

        {/* Linkbay user / Guest badge + device */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: lead.isLinkbayUser ? "var(--color-primary-highlight)" : "var(--color-surface-offset)",
            color: lead.isLinkbayUser ? "var(--color-primary)" : "var(--color-text-faint)",
            border: `1px solid ${lead.isLinkbayUser ? "var(--color-primary)" : "var(--color-border)"}`,
          }}>
            {lead.isLinkbayUser ? "✨ Linkbay User" : "👤 Guest"}
          </span>
          {lead.deviceType && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: "var(--color-surface-offset)", color: "var(--color-text-faint)",
              border: "1px solid var(--color-border)",
            }}>
              {lead.deviceType === "mobile" ? "📱" : lead.deviceType === "tablet" ? "📟" : "💻"} {lead.deviceType}
            </span>
          )}
        </div>

        {customFields && Object.keys(customFields).length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-faint)", marginBottom: "0.375rem" }}>Custom fields</div>
            <div style={{ background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", padding: "0.75rem", fontSize: "var(--text-sm)" }}>
              {Object.entries(customFields).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}>
                  <span style={{ color: "var(--color-text-faint)" }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", padding: "0.75rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-faint)", marginBottom: "0.25rem" }}>Source</div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{lead.source || "—"}</div>
          </div>
          <div style={{ background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", padding: "0.75rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-faint)", marginBottom: "0.25rem" }}>Date</div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{new Date(lead.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {lead.message && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-faint)", marginBottom: "0.375rem" }}>Message</div>
            <div style={{ background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", padding: "0.875rem", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              {lead.message}
            </div>
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-faint)", marginBottom: "0.375rem" }}>Status</div>
          <select
            value={lead.status}
            onChange={e => onStatusChange(lead.id, e.target.value)}
            className="input"
            style={{ fontSize: "var(--text-sm)", width: "auto" }}
          >
            {opts.map(s => <option key={s} value={s}>● {s}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
          {onConvert && (
            <button onClick={() => { if (confirm("Convert to contact?")) onConvert(lead.id); }} className="btn btn-secondary btn-sm" data-testid="button-modal-convert">→ Convert to Contact</button>
          )}
          {onDelete && (
            <button onClick={() => { if (confirm("Delete this lead permanently?")) { onDelete(lead.id); onClose(); } }} className="btn btn-secondary btn-sm" style={{ color: "#b91c1c", borderColor: "#fecaca" }} data-testid="button-modal-delete">Delete lead</button>
          )}
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-faint)", marginBottom: "0.375rem" }}>Internal notes</div>
          <textarea
            className="input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Add private notes about this lead..."
            style={{ fontSize: 13, resize: "none", width: "100%", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginTop: "0.5rem" }}>
            <button onClick={saveNotes} className="btn btn-primary btn-sm">{icons.save} Save notes</button>
            {notesMsg && <span style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600 }}>✓ {notesMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Leads Panel ---
// ─── Block Analysis Panel (General 9) ───────────────────────────────────────
function BlockAnalysisPanel({ pages, activePageId, licenceTier }: { pages: any[]; activePageId: number | null; licenceTier?: string }) {
  const [selectedPageId, setSelectedPageId] = useState<number | null>(activePageId ?? pages[0]?.id ?? null);
  const [days, setDays] = useState(30);
  const [hiddenOpen, setHiddenOpen] = useState(false);
  // #28: search state
  const [searchLive, setSearchLive] = useState("");
  const [searchArchived, setSearchArchived] = useState("");
  const [searchHidden, setSearchHidden] = useState("");
  // #9a: toggle for bar chart
  const [blockChartMode, setBlockChartMode] = useState<"interactions" | "views">("interactions");

  // G6b: "hidden" = archived from the hidden section; stays out of live even after restore attempt
  // We store hiddenBlockIds in page.hiddenBlockIds (same pattern as archivedBlockIds)
  const effectiveDays = days === 0 ? 3650 : days;

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/pages", selectedPageId, "block-analytics", effectiveDays],
    queryFn: async () => {
      if (!selectedPageId) return null;
      const res = await apiRequest("GET", `/api/pages/${selectedPageId}/block-analytics?days=${effectiveDays}`);
      return res.json();
    },
    enabled: !!selectedPageId,
    staleTime: 30000,
  });

  const page = pages.find((p: any) => p.id === selectedPageId);

  const pageBlocks: any[] = (() => {
    if (!page) return [];
    try { return JSON.parse(page.blocks || "[]"); } catch { return []; }
  })();

  const archivedIds: string[] = (() => {
    if (!page) return [];
    try { return JSON.parse(page.archivedBlockIds || "[]"); } catch { return []; }
  })();

  const hiddenIds: string[] = (() => {
    if (!page) return [];
    try { return JSON.parse((page as any).hiddenBlockIds || "[]"); } catch { return []; }
  })();

  // G6c: filter out non-interaction blocks from live view
  const NON_INTERACTION_TYPES = new Set(["text", "image", "divider", "testimonial", "vcard", "booking"]);

  const archiveMutation = useMutation({
    mutationFn: async ({ blockId, action }: { blockId: string; action: "archive" | "restore" | "hide" }) => {
      if (!page) throw new Error("No page");
      const existingArchived: string[] = (() => { try { return JSON.parse(page.archivedBlockIds || "[]"); } catch { return []; } })();
      const existingHidden: string[] = (() => { try { return JSON.parse((page as any).hiddenBlockIds || "[]"); } catch { return []; } })();

      let newArchived = existingArchived;
      let newHidden = existingHidden;

      if (action === "archive") {
        // Move to archived (from live)
        newArchived = existingArchived.includes(blockId) ? existingArchived : [...existingArchived, blockId];
      } else if (action === "restore") {
        // Restore from archived back to live (G6: block goes to bottom)
        newArchived = existingArchived.filter((id: string) => id !== blockId);
        newHidden = existingHidden.filter((id: string) => id !== blockId);
      } else if (action === "hide") {
        // Move from archived to hidden
        newArchived = existingArchived.filter((id: string) => id !== blockId);
        newHidden = existingHidden.includes(blockId) ? existingHidden : [...existingHidden, blockId];
      }

      const patchData: any = { archivedBlockIds: JSON.stringify(newArchived) };
      if (action === "hide" || action === "restore") {
        patchData.hiddenBlockIds = JSON.stringify(newHidden);
      }

      // G6: restored block goes to bottom of live blocks in page.blocks
      if (action === "restore") {
        const currentBlocks: any[] = (() => { try { return JSON.parse(page.blocks || "[]"); } catch { return []; } })();
        const idx = currentBlocks.findIndex((b: any) => b.id === blockId);
        if (idx !== -1) {
          // Already in blocks array — just removing from archived/hidden is enough
        }
        // blocks order is unchanged; removing from archivedIds makes it appear at its natural position
      }

      const res = await apiRequest("PATCH", `/api/pages/${selectedPageId}`, patchData);
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
    },
  });

  const blockLabel = (block: any) => {
    const t = block.type || "block";
    const BLOCK_TYPE_LABELS: Record<string, string> = {
      "lead-form": "Lead Form", "button": "Button", "poll": "Poll", "faq": "FAQ",
      "countdown": "Countdown", "video": "Video", "image": "Image", "text": "Text",
      "testimonial": "Testimonial", "social-links": "Social Links", "divider": "Divider", "link": "Link",
      "vcard": "vCard", "booking": "Booking",
    };
    const typeLabel = BLOCK_TYPE_LABELS[t] || t.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    // #5: for video blocks, prefer caption as the label if no title
    const rawTitle = (t === "video" ? (block.title || block.caption || block.label || block.question || "") : (block.title || block.label || block.question || ""));
    // #2: if an FAQ block has a title of 'Faq' or 'Bio' (case-insensitive) and has a body/content that looks like a bio, label it Bio
    const isBioFaq = t === "faq" && (rawTitle.toLowerCase() === "faq" || rawTitle.toLowerCase() === "bio") && !!(block.body || block.content || (block.faqs && block.faqs.length === 0));
    const title = isBioFaq ? "" : rawTitle;
    const resolvedTypeLabel = isBioFaq ? "Bio" : typeLabel;
    return title ? `${resolvedTypeLabel} — ${title}` : resolvedTypeLabel;
  };

  const blockTypeIcon: Record<string, string> = {
    button: "🔗", text: "📝", image: "🖼️", video: "🎥", faq: "❓", poll: "📊",
    countdown: "⏱️", "lead-form": "📋", "social-links": "🌐", testimonial: "💬", divider: "➖", link: "🔗",
    vcard: "💾", booking: "📅",
  };

  // G6d: expand social-links blocks into per-platform rows
  const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
    facebook: "Facebook", twitter: "Twitter / X", instagram: "Instagram", linkedin: "LinkedIn",
    youtube: "YouTube", tiktok: "TikTok", github: "GitHub", pinterest: "Pinterest",
    snapchat: "Snapchat", spotify: "Spotify", whatsapp: "WhatsApp", telegram: "Telegram",
  };

  const periodEvents: any[] = analytics?.periodEvents ?? [];
  const allTimeBlocks: any[] = analytics?.allTimeBlocks ?? [];

  // Aggregate per-block stats from pre-aggregated rows (block_id, block_type, type, count)
  // #9: unify views and interactions explicitly so they match the Top Interactions calculation
  const INTERACTION_EVENT_TYPES = new Set(["submit", "click", "vote", "expand", "play", "link_click"]);
  const blockStats: Map<string, { count: number; views: number; interactions: number; eventTypes: Record<string, number> }> = new Map();
  for (const e of periodEvents) {
    const bid = e.blockId || e.block_id;
    if (!bid) continue;
    const rowCount: number = e.count ?? 1;
    const et: string = e.eventType || e.type || "interaction";
    if (!blockStats.has(bid)) blockStats.set(bid, { count: 0, views: 0, interactions: 0, eventTypes: {} });
    const s = blockStats.get(bid)!;
    s.count += rowCount;
    s.eventTypes[et] = (s.eventTypes[et] || 0) + rowCount;
    if (et === "view") s.views += rowCount;
    else if (INTERACTION_EVENT_TYPES.has(et) || et.startsWith("block_interact")) s.interactions += rowCount;
    else s.interactions += rowCount; // unknown event types count as interactions
  }

  // G6d: also aggregate per platform for social-links blocks
  const socialPlatformStats: Map<string, Map<string, number>> = new Map();
  for (const e of periodEvents) {
    const bid = e.blockId || e.block_id;
    const platform = e.platform || e.block_sub_id;
    if (!bid || !platform) continue;
    const rowCount: number = e.count ?? 1;
    if (!socialPlatformStats.has(bid)) socialPlatformStats.set(bid, new Map());
    const pm = socialPlatformStats.get(bid)!;
    pm.set(platform, (pm.get(platform) || 0) + rowCount);
  }

  const liveBlocks = pageBlocks.filter((b: any) => !archivedIds.includes(b.id) && !hiddenIds.includes(b.id));
  const archivedBlocks = pageBlocks.filter((b: any) => archivedIds.includes(b.id));
  const hiddenBlocks = pageBlocks.filter((b: any) => hiddenIds.includes(b.id));

  // G6c: for display, filter out non-interaction types from live list
  const displayLiveBlocks = liveBlocks.filter((b: any) => !NON_INTERACTION_TYPES.has(b.type));

  // #24: sum aggregated counts, not row count — exclude view events
  const totalInteractions = periodEvents.filter((e: any) => {
    const et: string = e.eventType || e.type || "";
    return et !== "view";
  }).reduce((sum: number, e: any) => sum + (e.count ?? 1), 0);

  // G5: unified pill style — matches Overview and Analytics panels exactly
  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.25rem 0.625rem",
    borderRadius: "var(--radius-md)",
    border: `1px solid ${active ? "var(--color-primary)" : "transparent"}`,
    background: active ? "var(--color-primary-highlight)" : "var(--color-surface-offset)",
    color: active ? "var(--color-primary)" : "var(--color-text-faint)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  });

  return (
    <div className="blocks-panel-content" style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>Block Analysis</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "0.25rem" }}>How visitors interact with each block — {days === 0 ? "all time" : `last ${days} days`}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {pages.length > 1 && (
            <select value={selectedPageId ?? ""} onChange={e => setSelectedPageId(Number(e.target.value))} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {pages.map((p: any) => <option key={p.id} value={p.id}>linkbay.ai/{p.username}</option>)}
            </select>
          )}
          {/* G6a: pill buttons instead of select */}
          {[{ label: "7d", val: 7 }, { label: "14d", val: 14 }, { label: "30d", val: 30 }, { label: "60d", val: 60 }, { label: "All", val: 0 }].map(({ label, val }) => (
            <button key={val} onClick={() => setDays(val)} style={pillStyle(days === val)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: days === 0 ? "Interactions (all time)" : `Interactions (${days}d)`, value: totalInteractions, sub: "Excl. view events" },
          { label: "Trackable blocks", value: displayLiveBlocks.length, sub: `of ${liveBlocks.length} live` },
          { label: "Archived", value: archivedBlocks.length, sub: "Off your page" },
          { label: "Hidden", value: hiddenBlocks.length, sub: "Fully removed" },
        ].map(card => (
          <div key={card.label} className="card" style={{ padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--color-primary)", fontFamily: "Cabinet Grotesk, sans-serif" }}>{card.value}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{card.label}</div>
            {card.sub && <div style={{ fontSize: 10, color: "var(--color-text-faint)", marginTop: "0.125rem" }}>{card.sub}</div>}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: "var(--radius-md)" }} />)}
        </div>
      ) : (
        <>
          {/* #9 Block stats charts: Interactions bar (toggleable) + 2 Pie charts */}
          {displayLiveBlocks.length > 0 && (() => {
            const PIE_COLORS = ["#e06b1a","#f59e0b","#0891b2","#059669","#7c3aed","#e11d48","#334155","#8b5cf6","#10b981","#ef4444"];
            const barData = displayLiveBlocks.map((block: any) => {
              const s = blockStats.get(block.id) ?? { count: 0, views: 0, interactions: 0, eventTypes: {} as Record<string, number> };
              const viewCnt = s.views;
              const interCnt = s.interactions;
              return {
                name: (block.title || block.label || block.question || block.type || "Block").slice(0, 14),
                interactions: interCnt,
                views: viewCnt,
              };
            });
            const totalInterAll = barData.reduce((s: number, r: any) => s + r.interactions, 0);
            const totalViewsAll = barData.reduce((s: number, r: any) => s + r.views, 0);
            const interPieData = barData.filter((r: any) => r.interactions > 0).map((r: any) => ({ name: r.name, value: r.interactions }));
            const viewPieData = barData.filter((r: any) => r.views > 0).map((r: any) => ({ name: r.name, value: r.views }));
            return (
              <>
              {/* #6/#7: Bar chart + single toggleable pie chart side by side on same row */}
              <div className="block-analysis-charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem", alignItems: "start" }}>
                {/* Toggleable bar chart */}
                <div className="card" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{blockChartMode === "interactions" ? "Interactions" : "Views"} by block</div>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      {(["interactions", "views"] as const).map(m => (
                        <button key={m} onClick={() => setBlockChartMode(m)} style={{ padding: "0.2rem 0.5rem", fontSize: 10, fontWeight: 600, borderRadius: "var(--radius-sm)", border: `1px solid ${blockChartMode === m ? "var(--color-primary)" : "transparent"}`, background: blockChartMode === m ? "var(--color-primary-highlight)" : "var(--color-surface-offset)", color: blockChartMode === m ? "var(--color-primary)" : "var(--color-text-faint)", cursor: "pointer" }}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 20, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 9, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: 11 }} />
                      <Bar dataKey={blockChartMode} radius={[4, 4, 0, 0]}>
                        {barData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* #6: Single toggleable pie chart (interactions/views share) */}
                <div className="card" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{blockChartMode === "interactions" ? "Interaction" : "View"} share</div>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      {(["interactions", "views"] as const).map(m => (
                        <button key={m} onClick={() => setBlockChartMode(m)} style={{ padding: "0.2rem 0.5rem", fontSize: 10, fontWeight: 600, borderRadius: "var(--radius-sm)", border: `1px solid ${blockChartMode === m ? "var(--color-primary)" : "transparent"}`, background: blockChartMode === m ? "var(--color-primary-highlight)" : "var(--color-surface-offset)", color: blockChartMode === m ? "var(--color-primary)" : "var(--color-text-faint)", cursor: "pointer" }}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(() => {
                    const pieData = blockChartMode === "interactions" ? interPieData : viewPieData;
                    const total = blockChartMode === "interactions" ? totalInterAll : totalViewsAll;
                    const label = blockChartMode === "interactions" ? "Interactions" : "Views";
                    return pieData.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "1rem", color: "var(--color-text-faint)", fontSize: 11 }}>No data yet.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={55} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                            {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: 11 }} formatter={(v: any) => [`${v} (${total > 0 ? Math.round(v / total * 100) : 0}%)`, label]} />
                        </PieChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </div>
              </>);
          })()}

          {/* Live blocks — #3a: redesigned to match Top Interactions style */}
          <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.5rem" }}>
              Live blocks ({displayLiveBlocks.length})
            </h2>
            <div className="blocks-search-row" style={{ marginBottom: "0.75rem" }}><input className="input" placeholder="Search live blocks…" value={searchLive} onChange={e => setSearchLive(e.target.value)} style={{ fontSize: 12, width: "100%" }} /></div>
            {liveBlocks.length > displayLiveBlocks.length && (
              <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "0.5rem" }}>Text, image, divider, vCard and testimonial blocks are excluded from interaction tracking.</p>
            )}
            <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "1rem" }}>“Page views” is the total number of page views in this period — every block is shown on every page load.</p>
            {displayLiveBlocks.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No trackable blocks on this page.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {displayLiveBlocks.filter((block: any) => !searchLive || blockLabel(block).toLowerCase().includes(searchLive.toLowerCase())).flatMap((block: any) => {
                  const stats = blockStats.get(block.id) ?? { count: 0, views: 0, interactions: 0, eventTypes: {} as Record<string, number> };
                  const isSocial = block.type === "social-links";
                  const platformMap = socialPlatformStats.get(block.id);
                  const pageViewsTotal = Math.max((analytics as any)?.periodViews ?? (analytics as any)?.totalViews ?? 1, 1);

                  // #11: Social links — render one row per platform instead of a single block row
                  if (isSocial && platformMap && platformMap.size > 0) {
                    return Array.from(platformMap.entries()).sort((a, b) => b[1] - a[1]).map(([platform, cnt]) => {
                      const interactionRate = Math.min(Math.round((cnt / pageViewsTotal) * 1000) / 10, 100);
                      const platformEmoji: Record<string, string> = { twitter: "🐦", instagram: "📸", facebook: "👍", linkedin: "💼", youtube: "▶️", tiktok: "🎵", github: "🐙", spotify: "🎧", snapchat: "👻", pinterest: "📌", whatsapp: "💬", telegram: "✈️" };
                      const emoji = platformEmoji[platform] || "🌐";
                      return (
                        <div key={`${block.id}-${platform}`} style={{ marginBottom: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", marginBottom: 4, gap: "0.5rem" }}>
                            <span style={{ color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}><span style={{ marginRight: "0.25rem" }}>{emoji}</span>{SOCIAL_PLATFORM_LABELS[platform] || platform}</span>
                            <span style={{ fontWeight: 700, color: "var(--color-primary)", flexShrink: 0 }}>Interaction rate: {interactionRate.toFixed(1)}%</span>
                          </div>
                          <div style={{ height: 7, background: "var(--color-divider)", borderRadius: 999, overflow: "hidden", display: "flex" }}>
                            <div style={{ height: "100%", width: `${Math.min(100 - interactionRate, 100)}%`, background: "#f59e0b", opacity: 0.35, transition: "width 0.4s" }} />
                            <div style={{ height: "100%", width: `${interactionRate}%`, background: "var(--color-primary)", borderRadius: "0 999px 999px 0", transition: "width 0.4s" }} />
                          </div>
                          <div style={{ display: "flex", gap: "0.75rem", fontSize: 11, color: "var(--color-text-faint)", marginTop: 3 }}>
                            <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: "#f59e0b", opacity: 0.6, marginRight: 3, verticalAlign: "middle" }} />Page views: {pageViewsTotal}</span>
                            <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: "var(--color-primary)", marginRight: 3, verticalAlign: "middle" }} />Interactions: {cnt}</span>
                          </div>
                        </div>
                      );
                    });
                  }

                  // Standard block row — matches Top Interactions style
                  const interactionRate = Math.min(Math.round((stats.interactions / pageViewsTotal) * 1000) / 10, 100);
                  const emoji = blockTypeEmoji(block.type);
                  return [(
                    <div key={block.id} style={{ marginBottom: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", marginBottom: 4, gap: "0.5rem" }}>
                        <span style={{ color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}><span style={{ marginRight: "0.25rem" }}>{emoji}</span>{blockLabel(block)}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                          <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>Interaction rate: {interactionRate.toFixed(1)}%</span>
                          <button onClick={() => archiveMutation.mutate({ blockId: block.id, action: "archive" })} disabled={archiveMutation.isPending} className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: "0.15rem 0.5rem" }} title="Archive block">Archive</button>
                        </div>
                      </div>
                      <div style={{ height: 7, background: "var(--color-divider)", borderRadius: 999, overflow: "hidden", display: "flex" }}>
                        <div style={{ height: "100%", width: `${Math.min(100 - interactionRate, 100)}%`, background: "#f59e0b", opacity: 0.35, transition: "width 0.4s" }} />
                        <div style={{ height: "100%", width: `${interactionRate}%`, background: "var(--color-primary)", borderRadius: "0 999px 999px 0", transition: "width 0.4s" }} />
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", fontSize: 11, color: "var(--color-text-faint)", marginTop: 3 }}>
                        <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: "#f59e0b", opacity: 0.6, marginRight: 3, verticalAlign: "middle" }} />Page views: {pageViewsTotal}</span>
                        <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: "var(--color-primary)", marginRight: 3, verticalAlign: "middle" }} />Interactions: {stats.interactions}</span>
                      </div>
                    </div>
                  )];
                })}
              </div>
            )}
          </div>

          {/* Links section removed — links are now migrated to blocks (#3/#9b) */}

          {/* Archived blocks — always visible even when empty */}
          <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "1rem" }}>
              Archived ({archivedBlocks.length})
            </h2>
            {archivedBlocks.length > 0 && (
              <>
                <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "0.5rem" }}>Stats shown are all-time totals for each block (not limited to the selected date range).</p>
                <input className="input" placeholder="Search archived blocks…" value={searchArchived} onChange={e => setSearchArchived(e.target.value)} style={{ fontSize: 12, marginBottom: "0.75rem" }} />
              </>
            )}
            {archivedBlocks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.25rem 1rem", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>No archived blocks. Archive a block from the Live section to remove it from your page.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {archivedBlocks.filter((block: any) => !searchArchived || blockLabel(block).toLowerCase().includes(searchArchived.toLowerCase())).map((block: any) => {
                  const atBlock = allTimeBlocks.find((b: any) => b.blockId === block.id) ?? { totalInteractions: 0, totalViews: 0 };
                  const total = atBlock.totalInteractions ?? 0;
                  const views = atBlock.totalViews ?? 0;
                  const interactionRate = views > 0 ? Math.min(Math.round((total / views) * 1000) / 10, 100) : 0;
                  const emoji = blockTypeEmoji(block.type);
                  return (
                    <div key={block.id} style={{ opacity: 0.8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", marginBottom: 4, gap: "0.5rem" }}>
                        <span style={{ color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}><span style={{ marginRight: "0.25rem" }}>{emoji}</span>{blockLabel(block)} <span style={{ fontSize: 9, background: "var(--color-surface-offset)", color: "var(--color-text-faint)", borderRadius: 3, padding: "1px 4px", marginLeft: 3 }}>archived</span></span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                          <span style={{ fontWeight: 700, color: "var(--color-text-faint)" }}>Rate: {interactionRate.toFixed(1)}%</span>
                          <button onClick={() => archiveMutation.mutate({ blockId: block.id, action: "restore" })} disabled={archiveMutation.isPending} className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: "0.15rem 0.5rem" }}>Restore</button>
                          <button onClick={() => archiveMutation.mutate({ blockId: block.id, action: "hide" })} disabled={archiveMutation.isPending} className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: "0.15rem 0.5rem" }} title="Move to hidden">Hide</button>
                        </div>
                      </div>
                      <div style={{ height: 7, background: "var(--color-divider)", borderRadius: 999, overflow: "hidden", display: "flex" }}>
                        <div style={{ height: "100%", width: `${Math.min(100 - interactionRate, 100)}%`, background: "#f59e0b", opacity: 0.25, transition: "width 0.4s" }} />
                        <div style={{ height: "100%", width: `${interactionRate}%`, background: "var(--color-text-faint)", borderRadius: "0 999px 999px 0", transition: "width 0.4s" }} />
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", fontSize: 11, color: "var(--color-text-faint)", marginTop: 3 }}>
                        <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: "#f59e0b", opacity: 0.4, marginRight: 3, verticalAlign: "middle" }} />All-time views: {views}</span>
                        <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: "var(--color-text-faint)", marginRight: 3, verticalAlign: "middle" }} />Interactions: {total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hidden blocks section — always visible so users know it exists */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <button
              onClick={() => setHiddenOpen(o => !o)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>
                Hidden ({hiddenBlocks.length})
              </h2>
              <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{hiddenOpen ? "▲ Collapse" : "▼ Expand"}</span>
            </button>
            {hiddenOpen && (
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "0.5rem" }}>Hidden blocks are permanently removed from your live page. Restore them to make them live again.</p>
                {hiddenBlocks.length > 0 && (
                  <input className="input" placeholder="Search hidden blocks…" value={searchHidden} onChange={e => setSearchHidden(e.target.value)} style={{ fontSize: 12, marginBottom: "0.75rem" }} />
                )}
                {hiddenBlocks.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1.25rem 1rem", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>No hidden blocks.</div>
                ) : hiddenBlocks.filter((block: any) => !searchHidden || blockLabel(block).toLowerCase().includes(searchHidden.toLowerCase())).map((block: any) => {
                  const atBlock = allTimeBlocks.find((b: any) => b.blockId === block.id) ?? { totalInteractions: 0, totalViews: 0 };
                  const total = atBlock.totalInteractions ?? 0;
                  const views = atBlock.totalViews ?? 0;
                  const interactionRate = views > 0 ? Math.min(Math.round((total / views) * 1000) / 10, 100) : 0;
                  const emoji = blockTypeEmoji(block.type);
                  return (
                    <div key={block.id} style={{ opacity: 0.65 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", marginBottom: 4, gap: "0.5rem" }}>
                        <span style={{ color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}><span style={{ marginRight: "0.25rem" }}>{emoji}</span>{blockLabel(block)} <span style={{ fontSize: 9, background: "var(--color-surface-offset)", color: "var(--color-text-faint)", borderRadius: 3, padding: "1px 4px", marginLeft: 3 }}>hidden</span></span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                          <span style={{ fontWeight: 700, color: "var(--color-text-faint)" }}>Rate: {interactionRate.toFixed(1)}%</span>
                          <button onClick={() => archiveMutation.mutate({ blockId: block.id, action: "restore" })} disabled={archiveMutation.isPending} className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: "0.15rem 0.5rem" }}>Restore to live</button>
                        </div>
                      </div>
                      <div style={{ height: 7, background: "var(--color-divider)", borderRadius: 999, overflow: "hidden", display: "flex" }}>
                        <div style={{ height: "100%", width: `${Math.min(100 - interactionRate, 100)}%`, background: "#f59e0b", opacity: 0.2, transition: "width 0.4s" }} />
                        <div style={{ height: "100%", width: `${interactionRate}%`, background: "var(--color-text-faint)", borderRadius: "0 999px 999px 0", transition: "width 0.4s" }} />
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", fontSize: 11, color: "var(--color-text-faint)", marginTop: 3 }}>
                        <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: "#f59e0b", opacity: 0.4, marginRight: 3, verticalAlign: "middle" }} />All-time views: {views}</span>
                        <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: "var(--color-text-faint)", marginRight: 3, verticalAlign: "middle" }} />Interactions: {total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function LeadsPanel({ pages }: { pages: any[] }) {
  const { data: leadsPanelLic } = useLicence();
  const leadsTier = (leadsPanelLic as any)?.tier || "free";
  const [selectedPageId, setSelectedPageId] = useState<number | null>(pages[0]?.id ?? null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  // Filter state
  const [filterCategory, setFilterCategory] = useState("name");
  const [filterText, setFilterText] = useState("");
  // Sort state
  const [leadSortBy, setLeadSortBy] = useState<"name" | "email" | "source" | "status" | "createdAt">("createdAt");
  const [leadSortDir, setLeadSortDir] = useState<"asc" | "desc">("desc");

  const { data: leads, isLoading } = useQuery({
    queryKey: ["/api/pages", selectedPageId, "leads"],
    queryFn: async () => {
      if (!selectedPageId) return [];
      const res = await apiRequest("GET", `/api/pages/${selectedPageId}/leads`);
      return res.json();
    },
    enabled: !!selectedPageId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/leads/${id}/status`, { status });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", selectedPageId, "leads"] });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const res = await apiRequest("PATCH", `/api/leads/${id}/notes`, { notes });
      if (!res.ok) throw new Error("Failed to update notes");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", selectedPageId, "leads"] });
      // Update selected lead if open
      if (selectedLead && selectedLead.id === data.lead?.id) {
        setSelectedLead(data.lead);
      }
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/leads/${id}`);
      if (!res.ok) throw new Error("Failed to delete lead");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", selectedPageId, "leads"] });
      setSelectedLead(null);
    },
  });

  const convertLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/leads/${id}/convert-to-contact`);
      if (!res.ok) throw new Error("Failed to convert lead");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/pages/${selectedPageId}/leads`, data);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to create lead"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", selectedPageId, "leads"] });
      setAddLeadOpen(false);
    },
  });

  if (pages.length === 0) return <NoPageState />;

  const statusColor: Record<string, string> = {
    new: "var(--color-primary)",
    contacted: "var(--color-success)",
    qualified: "#0ea5e9",
    proposal: "#8b5cf6",
    won: "#10b981",
    lost: "#ef4444",
    archived: "#94a3b8",
    closed: "var(--color-text-faint)",
  };
  const statusOptions = ["new", "contacted", "qualified", "proposal", "won", "lost", "archived"];

  const totalCount = (leads || []).length;
  const statusCounts: Record<string, number> = {
    new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0, archived: 0,
  };
  (leads || []).forEach((l: any) => { if (statusCounts[l.status] != null) statusCounts[l.status]++; });

  // Derive custom field keys from all leads
  const customFieldKeys: string[] = [];
  (leads || []).forEach((l: any) => {
    try {
      const cf = typeof l.customFields === "string" ? JSON.parse(l.customFields) : l.customFields;
      if (cf && typeof cf === "object") {
        Object.keys(cf).forEach(k => { if (!customFieldKeys.includes(k)) customFieldKeys.push(k); });
      }
    } catch { /* */ }
  });

  const leadFilterCategories = [
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "message", label: "Message" },
    { value: "source", label: "Source" },
    { value: "status", label: "Status" },
    { value: "notes", label: "Notes" },
    ...customFieldKeys.map(k => ({ value: `custom:${k}`, label: k })),
  ];

  const toggleLeadSort = (col: typeof leadSortBy) => {
    if (leadSortBy === col) setLeadSortDir(d => d === "asc" ? "desc" : "asc");
    else { setLeadSortBy(col); setLeadSortDir("asc"); }
  };
  const leadSortArrow = (col: typeof leadSortBy) => leadSortBy === col ? (leadSortDir === "asc" ? " ↑" : " ↓") : "";

  const filteredLeads = (() => {
    const base = filterText.trim() === "" ? (leads || []) : (leads || []).filter((l: any) => {
    const q = filterText.trim().toLowerCase();
    if (filterCategory.startsWith("custom:")) {
      const key = filterCategory.slice(7);
      try {
        const cf = typeof l.customFields === "string" ? JSON.parse(l.customFields) : l.customFields;
        return cf && String(cf[key] ?? "").toLowerCase().includes(q);
      } catch { return false; }
    }
    const val = String((l as any)[filterCategory] ?? "").toLowerCase();
    return val.includes(q);
    });
    return [...base].sort((a: any, b: any) => {
      const av = String(a[leadSortBy] ?? "").toLowerCase();
      const bv = String(b[leadSortBy] ?? "").toLowerCase();
      return leadSortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  })();

  const exportCSV = () => {
    if (!leads?.length) return;
    const header = ["Name", "Email", "Message", "Source", "Status", "Notes", "Date"];
    const rows = (leads || []).map((l: any) =>
      [l.name, l.email, l.message || "", l.source || "", l.status, l.notes || "", l.createdAt]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="leads-panel-content" style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
      {/* Lead detail modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={(id, status) => {
            updateStatusMutation.mutate({ id, status });
            setSelectedLead((l: any) => l ? { ...l, status } : null);
          }}
          onNotesSave={(id, notes) => {
            updateNotesMutation.mutate({ id, notes });
          }}
          onConvert={(id) => convertLeadMutation.mutate(id)}
          onDelete={(id) => deleteLeadMutation.mutate(id)}
          statusOptions={statusOptions}
        />
      )}

      {/* Add lead manually modal */}
      {addLeadOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }} onClick={() => setAddLeadOpen(false)}>
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: "1rem", fontFamily: "Cabinet Grotesk, sans-serif" }}>Add lead manually</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.target as HTMLFormElement);
              createLeadMutation.mutate({
                name: String(fd.get("name") || ""),
                email: String(fd.get("email") || ""),
                message: String(fd.get("message") || "") || undefined,
                source: String(fd.get("source") || "") || "Manual",
                status: String(fd.get("status") || "new"),
                notes: String(fd.get("notes") || "") || undefined,
              });
            }} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input name="name" className="input" placeholder="Name *" required />
              <input name="email" type="email" className="input" placeholder="Email *" required />
              <textarea name="message" className="input" placeholder="Message" rows={2} style={{ resize: "none" }} />
              <input name="source" className="input" placeholder="Source" defaultValue="Manual" />
              <select name="status" className="input" defaultValue="new">
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea name="notes" className="input" placeholder="Internal notes" rows={2} style={{ resize: "none" }} />
              {createLeadMutation.isError && <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)" }}>Failed to create lead.</p>}
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setAddLeadOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" disabled={createLeadMutation.isPending} className="btn btn-primary btn-sm">{createLeadMutation.isPending ? "Adding…" : "Add lead"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.25rem" }}>Leads</h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{totalCount} total · {filteredLeads.length} shown</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {pages.length > 1 && (
            <select value={selectedPageId ?? ""} onChange={e => setSelectedPageId(Number(e.target.value))} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {pages.map((p: any) => <option key={p.id} value={p.id}>linkbay.ai/{p.username}</option>)}
            </select>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setAddLeadOpen(true)} data-testid="button-add-lead">+ Add lead</button>
          {leadsTier === "business" ? (
            <button className="btn btn-secondary btn-sm leads-export-btn" onClick={exportCSV} data-testid="button-export-leads">↓ Export CSV</button>
          ) : (
            <button className="btn btn-secondary btn-sm leads-export-btn" style={{ opacity: 0.6, cursor: "default" }} title="Business plan required" data-testid="button-export-leads-locked">↓ Export CSV <span style={{ fontSize: 9, padding: "1px 5px", background: "rgba(224,107,26,0.15)", color: "var(--color-primary)", borderRadius: 999, fontWeight: 700, marginLeft: 4 }}>BIZ</span></button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="leads-search-row" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="input"
          style={{ fontSize: "var(--text-sm)", width: "auto", minWidth: 110 }}
          data-testid="select-leads-filter-category"
        >
          {leadFilterCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input
          className="input"
          style={{ flex: 1, minWidth: 140, fontSize: "var(--text-sm)" }}
          placeholder={`Search by ${leadFilterCategories.find(c => c.value === filterCategory)?.label ?? filterCategory}…`}
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          data-testid="input-leads-filter-text"
        />
        {filterText && <button className="btn btn-secondary btn-sm" onClick={() => setFilterText("")} style={{ flexShrink: 0 }}>✕ Clear</button>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { key: "new", label: "New", color: "#3b82f6", bg: "#dbeafe" },
          { key: "contacted", label: "Contacted", color: "#d97706", bg: "#fef3c7" },
          { key: "qualified", label: "Qualified", color: "#8b5cf6", bg: "#ede9fe" },
          { key: "proposal", label: "Proposal", color: "#ea580c", bg: "#ffedd5" },
          { key: "won", label: "Won", color: "#10b981", bg: "#d1fae5" },
          { key: "lost", label: "Lost", color: "#ef4444", bg: "#fee2e2" },
          { key: "archived", label: "Archived", color: "#64748b", bg: "#e2e8f0" },
        ].map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: s.bg, borderRadius: 999, fontSize: 13, fontWeight: 600, color: s.color }}>
            <span>{s.label}</span>
            <span style={{ background: "rgba(255,255,255,0.7)", borderRadius: 999, padding: "0 0.5rem", fontSize: 12, fontWeight: 700 }}>{statusCounts[s.key]}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: "var(--radius-md)" }} />)}
        </div>
      ) : (leads || []).length === 0 ? (
        <div className="card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✉️</div>
          <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.5rem" }}>No leads yet</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Share your page to start capturing leads, or <button onClick={() => setAddLeadOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 700, padding: 0, fontSize: "inherit" }}>add one manually</button>.</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No leads match your search.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => setFilterText("")} style={{ marginTop: "0.75rem" }}>Clear filter</button>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="leads-table" style={{ width: "100%", fontSize: "var(--text-sm)" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-offset)" }}>
                  {([
                    { label: "Name", col: "name" },
                    { label: "Email", col: "email" },
                    { label: "Message", col: null },
                    { label: "Source", col: "source" },
                    { label: "Status", col: "status" },
                    { label: "Date", col: "createdAt" },
                    { label: "", col: null },
                  ] as { label: string; col: "name" | "email" | "source" | "status" | "createdAt" | null }[]).map(h => (
                    <th key={h.label} onClick={h.col ? () => toggleLeadSort(h.col!) : undefined}
                      style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "var(--text-xs)", color: h.col ? "var(--color-text)" : "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--color-border)", whiteSpace: "nowrap", cursor: h.col ? "pointer" : "default", userSelect: "none" }}>
                      {h.label}{h.col ? leadSortArrow(h.col) : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead: any, i: number) => (
                  <tr key={lead.id} style={{ borderBottom: "1px solid var(--color-divider)", background: i % 2 === 0 ? "transparent" : "var(--color-surface-2)" }} data-testid={`lead-row-${lead.id}`}>
                    <td data-label="Name" style={{ padding: "0.875rem 1rem", fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-primary-highlight)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                          {lead.name[0]}
                        </div>
                        {lead.name}
                      </div>
                    </td>
                    <td data-label="Email" style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)" }}>{lead.email}</td>
                    <td data-label="Message" style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)", maxWidth: 200 }}>
                      {lead.message ? (
                        <div>
                          <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: expandedMessage === lead.id ? "normal" : "nowrap", display: "block", maxWidth: 180 }}>
                            {expandedMessage === lead.id ? lead.message : lead.message.slice(0, 60) + (lead.message.length > 60 ? "…" : "")}
                          </span>
                          {lead.message.length > 60 && (
                            <button
                              onClick={() => setExpandedMessage(expandedMessage === lead.id ? null : lead.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontSize: 10, fontWeight: 600, padding: 0 }}
                            >
                              {expandedMessage === lead.id ? "less" : "more"}
                            </button>
                          )}
                        </div>
                      ) : <span style={{ color: "var(--color-text-faint)", fontSize: 12 }}>—</span>}
                    </td>
                    <td data-label="Source" style={{ padding: "0.875rem 1rem", color: "var(--color-text-faint)", fontSize: 12 }}>{lead.source || "—"}</td>
                    <td data-label="Status" style={{ padding: "0.875rem 1rem" }}>
                      <select
                        value={lead.status}
                        onChange={e => updateStatusMutation.mutate({ id: lead.id, status: e.target.value })}
                        style={{ fontSize: 11, fontWeight: 700, color: statusColor[lead.status] ?? "var(--color-text-faint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        data-testid={`select-lead-status-${lead.id}`}
                      >
                        {statusOptions.map(s => <option key={s} value={s}>● {s}</option>)}
                      </select>
                    </td>
                    <td data-label="Date" style={{ padding: "0.875rem 1rem", color: "var(--color-text-faint)", fontSize: 12 }}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td data-label="Actions" style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => setSelectedLead(lead)}
                          style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)" }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => { if (confirm("Convert this lead to a contact?")) convertLeadMutation.mutate(lead.id); }}
                          style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "var(--color-primary)" }}
                          data-testid={`button-convert-lead-${lead.id}`}
                        >
                          → Contact
                        </button>
                        <button
                          onClick={() => { if (confirm("Delete this lead permanently?")) deleteLeadMutation.mutate(lead.id); }}
                          style={{ background: "none", border: "1px solid #fecaca", borderRadius: "var(--radius-sm)", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#b91c1c" }}
                          data-testid={`button-delete-lead-${lead.id}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Contacts Panel ---
// --- Follow-up helpers ---
function getFollowUpStatus(dateStr: string): { label: string; color: string } {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return { label: "OVERDUE", color: "red" };
  if (diff < 86400000) return { label: "Due soon", color: "amber" };
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  return { label: `Follow-up: ${d}d ${h}h`, color: "gray" };
}

function FollowUpBadge({ dateStr }: { dateStr: string }) {
  const { label, color } = getFollowUpStatus(dateStr);
  const palette: Record<string, { bg: string; fg: string; border: string }> = {
    red: { bg: "#fee2e2", fg: "#991b1b", border: "#fecaca" },
    amber: { bg: "#fef3c7", fg: "#92400e", border: "#fde68a" },
    gray: { bg: "#f1f5f9", fg: "#475569", border: "#e2e8f0" },
  };
  const p = palette[color] || palette.gray;
  return (
    <span style={{ display: "inline-block", padding: "2px 6px", borderRadius: 4, background: p.bg, color: p.fg, border: `1px solid ${p.border}`, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }} data-testid="badge-follow-up">
      {label}
    </span>
  );
}

function ContactsPanel({ pages }: { pages: any[] }) {
  const { data: contactsPanelLic } = useLicence();
  const contactsTier = (contactsPanelLic as any)?.tier || "free";
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [contactPageFilter, setContactPageFilter] = useState<number | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState(""); // legacy — kept for compat
  const [filterCategory, setFilterCategory] = useState("name");
  const [filterText, setFilterText] = useState("");
  // #15: notificationStatus and sessionNotifiedIds removed (browser push notifications disabled)
  const [dismissedOverdueIds, setDismissedOverdueIds] = useState<Set<number>>(new Set());

  const { data: contacts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contacts");
      return res.json();
    },
    staleTime: 0,
  });

  const { data: detail } = useQuery<{ contact: any; activities: any[] }>({
    queryKey: ["/api/contacts", selectedId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/contacts/${selectedId}`);
      return res.json();
    },
    enabled: !!selectedId,
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/contacts", data);
      if (!res.ok) throw new Error("Failed to create contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setAddOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/contacts/${id}`, data);
      if (!res.ok) throw new Error("Failed to update contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", selectedId] });
      setEditMode(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/contacts/${id}`);
      if (!res.ok) throw new Error("Failed to delete contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setSelectedId(null);
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({ id, type, body }: { id: number; type: string; body: string }) => {
      const res = await apiRequest("POST", `/api/contacts/${id}/activities`, { type, body });
      if (!res.ok) throw new Error("Failed to add activity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", selectedId] });
    },
  });

  const editActivityMutation = useMutation({
    mutationFn: async ({ contactId, activityId, body }: { contactId: number; activityId: number; body: string }) => {
      const res = await apiRequest("PATCH", `/api/contacts/${contactId}/activities/${activityId}`, { body });
      if (!res.ok) throw new Error("Failed to edit activity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", selectedId] });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async ({ contactId, activityId }: { contactId: number; activityId: number }) => {
      const res = await apiRequest("DELETE", `/api/contacts/${contactId}/activities/${activityId}`);
      if (!res.ok) throw new Error("Failed to delete activity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", selectedId] });
    },
  });

  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  // Sort state for contacts table
  const [contactSortBy, setContactSortBy] = useState<"name" | "email" | "company" | "source" | "createdAt">("createdAt");
  const [contactSortDir, setContactSortDir] = useState<"asc" | "desc">("asc");

  const toggleContactSort = (col: typeof contactSortBy) => {
    if (contactSortBy === col) setContactSortDir(d => d === "asc" ? "desc" : "asc");
    else { setContactSortBy(col); setContactSortDir("asc"); }
  };
  const contactSortArrow = (col: typeof contactSortBy) => contactSortBy === col ? (contactSortDir === "asc" ? " ↑" : " ↓") : "";

  // Derive custom field keys from all contacts (from lead forms)
  const contactCustomFieldKeys: string[] = [];
  (contacts || []).forEach((c: any) => {
    try {
      const cf = typeof c.customFields === "string" ? JSON.parse(c.customFields) : c.customFields;
      if (cf && typeof cf === "object") {
        Object.keys(cf).forEach(k => { if (!contactCustomFieldKeys.includes(k)) contactCustomFieldKeys.push(k); });
      }
    } catch { /* */ }
  });

  const contactFilterCategories = [
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "company", label: "Company" },
    { value: "phone", label: "Phone" },
    { value: "source", label: "Source" },
    { value: "notes", label: "Notes" },
    ...contactCustomFieldKeys.map(k => ({ value: `custom:${k}`, label: k })),
  ];

  const filtered = (() => {
    const base = (contacts || []).filter((c: any) => {
      const activeFilter = filterText.trim();
      if (!activeFilter) return true;
      const q = activeFilter.toLowerCase();
      if (filterCategory.startsWith("custom:")) {
        const key = filterCategory.slice(7);
        try {
          const cf = typeof c.customFields === "string" ? JSON.parse(c.customFields) : c.customFields;
          return cf && String(cf[key] ?? "").toLowerCase().includes(q);
        } catch { return false; }
      }
      const val = String((c as any)[filterCategory] ?? "").toLowerCase();
      return val.includes(q);
    });
    // General 8: contacts with live follow-ups (not done) rise to top sorted by soonest date
    const withLive = base.filter((c: any) => c.followUpDate && !c.followUpDone);
    const withoutLive = base.filter((c: any) => !c.followUpDate || c.followUpDone);
    const sortFn = (a: any, b: any) => {
      const av = String(a[contactSortBy] ?? "").toLowerCase();
      const bv = String(b[contactSortBy] ?? "").toLowerCase();
      return contactSortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    };
    const liveByDate = [...withLive].sort((a: any, b: any) =>
      new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime()
    );
    return [...liveByDate, ...withoutLive.sort(sortFn)];
  })();

  const overdueContacts = (contacts || []).filter((c: any) =>
    c.followUpDate && !c.followUpDone &&
    new Date(c.followUpDate).getTime() - Date.now() < 86400000
  );

  // #15: Browser push notifications for overdue follow-ups removed (was a nuisance)
  // notifyMutation and useEffect that fired new Notification() removed entirely

  // #15: enableNotifications removed — browser push notifications disabled

  const exportCsv = () => {
    const rows = [["Name", "Email", "Company", "Phone", "Source", "Created"]];
    (contacts || []).forEach((c: any) => {
      rows.push([c.name || "", c.email || "", c.company || "", c.phone || "", c.source || "", c.createdAt || ""]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="contacts-panel-content" style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>Contacts</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "0.25rem" }}>{(contacts || []).length} total</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* #15: Page selector in Blocks style */}
          {pages.length > 1 && (
            <select value={contactPageFilter} onChange={e => setContactPageFilter(e.target.value === "all" ? "all" : Number(e.target.value))} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <option value="all">All pages</option>
              {pages.map((p: any) => <option key={p.id} value={p.id}>linkbay.ai/{p.username}</option>)}
            </select>
          )}
          {/* #15: browser notification button removed */}
          {contactsTier === "business" ? (
            <button onClick={exportCsv} className="btn btn-secondary btn-sm" data-testid="button-export-contacts">Export CSV</button>
          ) : (
            <button className="btn btn-secondary btn-sm" style={{ opacity: 0.6, cursor: "default" }} title="Business plan required" data-testid="button-export-contacts-locked">Export CSV <span style={{ fontSize: 9, padding: "1px 5px", background: "rgba(224,107,26,0.15)", color: "var(--color-primary)", borderRadius: 999, fontWeight: 700, marginLeft: 4 }}>BIZ</span></button>
          )}
          <button onClick={() => setAddOpen(true)} className="btn btn-primary btn-sm" data-testid="button-add-contact">+ Add contact</button>
        </div>
      </div>

      {/* G13: overdue banner — dismissible per-contact, won't re-show on tab switch */}
      {overdueContacts.filter((c: any) => !dismissedOverdueIds.has(c.id)).length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--radius-md)", padding: "0.75rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }} data-testid="banner-follow-up-overdue">
          <span>⚠️</span>
          <span style={{ fontSize: "var(--text-sm)", color: "#991b1b", flex: 1 }}>
            {overdueContacts.filter((c: any) => !dismissedOverdueIds.has(c.id)).length} follow-up{overdueContacts.filter((c: any) => !dismissedOverdueIds.has(c.id)).length > 1 ? "s" : ""} overdue or due soon
          </span>
          <button
            onClick={() => setDismissedOverdueIds(prev => { const s = new Set(Array.from(prev)); overdueContacts.forEach((c: any) => s.add(c.id)); return s; })}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#991b1b", padding: "0 0.25rem", lineHeight: 1 }}
            title="Dismiss"
          >✕</button>
        </div>
      )}

      {/* Category + free-text filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="input"
          style={{ fontSize: "var(--text-sm)", width: "auto", minWidth: 110 }}
          data-testid="select-contacts-filter-category"
        >
          {contactFilterCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input
          className="input"
          style={{ flex: 1, minWidth: 140, fontSize: "var(--text-sm)" }}
          placeholder={`Search by ${contactFilterCategories.find(c => c.value === filterCategory)?.label ?? filterCategory}…`}
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          data-testid="input-contacts-filter-text"
        />
        {filterText && <button className="btn btn-secondary btn-sm" onClick={() => setFilterText("")} style={{ flexShrink: 0 }}>✕ Clear</button>}
      </div>

      {isLoading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</div>
          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No contacts yet</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "1rem" }}>Convert leads to contacts or add them manually.</p>
          <button onClick={() => setAddOpen(true)} className="btn btn-primary btn-sm">+ Add contact</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="leads-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
            <thead>
              <tr style={{ background: "var(--color-surface-offset)", borderBottom: "1px solid var(--color-divider)" }}>
                {([
                  { label: "Name", col: "name" },
                  { label: "Email", col: "email" },
                  { label: "Company", col: "company" },
                  { label: "Source", col: "source" },
                  { label: "Created", col: "createdAt" },
                ] as { label: string; col: "name" | "email" | "company" | "source" | "createdAt" }[]).map(h => (
                  <th key={h.label} onClick={() => toggleContactSort(h.col)}
                    style={{ padding: "0.75rem", textAlign: "left", fontWeight: 700, fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: 0.5, cursor: "pointer", userSelect: "none" }}>
                    {h.label}{contactSortArrow(h.col)}
                  </th>
                ))}
                <th style={{ padding: "0.75rem", width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--color-divider)", cursor: "pointer" }} onClick={() => setSelectedId(c.id)} data-testid={`row-contact-${c.id}`}>
                  <td data-label="Name" style={{ padding: "0.75rem", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>{c.name}</span>
                      {c.followUpDate && !c.followUpDone && <FollowUpBadge dateStr={c.followUpDate} />}
                    </div>
                  </td>
                  <td data-label="Email" style={{ padding: "0.75rem", color: "var(--color-text-muted)" }}>{c.email}</td>
                  <td data-label="Company" style={{ padding: "0.75rem", color: "var(--color-text-muted)" }}>{c.company || "—"}</td>
                  <td data-label="Source" style={{ padding: "0.75rem" }}><span className="badge" style={{ background: "var(--color-surface-offset)", fontSize: 10 }}>{c.source || "manual"}</span></td>
                  <td data-label="Created" style={{ padding: "0.75rem", color: "var(--color-text-faint)", fontSize: 12 }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}</td>
                  <td data-label="Actions" style={{ padding: "0.75rem", textAlign: "right" }}>
                    <button onClick={e => { e.stopPropagation(); if (confirm("Delete this contact?")) deleteMutation.mutate(c.id); }} className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      {addOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }} onClick={() => setAddOpen(false)}>
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: "1rem", fontFamily: "Cabinet Grotesk, sans-serif" }}>Add contact</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.target as HTMLFormElement);
              createMutation.mutate({
                name: fd.get("name"),
                email: fd.get("email"),
                company: fd.get("company") || undefined,
                phone: fd.get("phone") || undefined,
                source: fd.get("source") || undefined,
                notes: fd.get("notes") || undefined,
              });
            }} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input name="name" className="input" placeholder="Name *" required data-testid="input-new-contact-name" />
              <input name="email" type="email" className="input" placeholder="Email *" required data-testid="input-new-contact-email" />
              <input name="company" className="input" placeholder="Company" />
              <input name="phone" className="input" placeholder="Phone" />
              <select name="source" className="input" defaultValue="Manual">
                <option value="Manual">Manual</option>
                <option value="Lead">Lead</option>
                <option value="Import">Import</option>
                <option value="Referral">Referral</option>
                <option value="Social">Social</option>
                <option value="Other">Other</option>
              </select>
              <textarea name="notes" className="input" placeholder="Notes" rows={3} style={{ resize: "none" }} />
              {createMutation.error && <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)" }}>Failed to create. Check fields and try again.</p>}
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setAddOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn btn-primary btn-sm">{createMutation.isPending ? "Adding…" : "Add contact"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedId && detail && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }} onClick={() => { setSelectedId(null); setEditMode(false); }}>
          <div className="card contact-detail-pane" style={{ width: "100%", maxWidth: 640, maxHeight: "85vh", overflow: "auto", padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", fontSize: "var(--text-lg)" }}>{detail.contact.name}</h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>{detail.contact.email}</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => setEditMode(!editMode)} className="btn btn-secondary btn-sm">{editMode ? "Cancel" : "Edit"}</button>
                <button onClick={() => { setSelectedId(null); setEditMode(false); }} className="btn btn-secondary btn-sm">{icons.close}</button>
              </div>
            </div>

            {editMode ? (
              <form key={`contact-form-${detail.contact.id}-${detail.contact.followUpDate ?? 'none'}-${detail.contact.followUpDone ? '1' : '0'}`} onSubmit={e => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                const followUpDateRaw = String(fd.get("followUpDate") || "").trim();
                const followUpNoteRaw = String(fd.get("followUpNote") || "").trim();
                updateMutation.mutate({
                  id: detail.contact.id,
                  data: {
                    name: fd.get("name"),
                    email: fd.get("email"),
                    company: fd.get("company") || undefined,
                    phone: fd.get("phone") || undefined,
                    source: fd.get("source") || undefined,
                    notes: fd.get("notes") || undefined,
                    followUpDate: followUpDateRaw ? new Date(followUpDateRaw).toISOString() : null,
                    followUpNote: followUpNoteRaw || null,
                  },
                });
              }} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <input name="name" defaultValue={detail.contact.name} className="input" required />
                <input name="email" type="email" defaultValue={detail.contact.email} className="input" required />
                <input name="company" defaultValue={detail.contact.company || ""} className="input" placeholder="Company" />
                <input name="phone" defaultValue={detail.contact.phone || ""} className="input" placeholder="Phone" />
                <select name="source" className="input" defaultValue={detail.contact.source || "Manual"}>
                  <option value="Manual">Manual</option>
                  <option value="Lead">Lead</option>
                  <option value="Import">Import</option>
                  <option value="Referral">Referral</option>
                  <option value="Social">Social</option>
                  <option value="Other">Other</option>
                </select>
                <textarea name="notes" defaultValue={detail.contact.notes || ""} className="input" placeholder="Notes" rows={4} style={{ resize: "none" }} />

                <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "1rem" }}>
                  <h4 style={{ fontWeight: 600, fontSize: "var(--text-sm)", marginBottom: "0.75rem" }}>Follow-up Reminder</h4>
                  <label style={{ display: "block", fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>Date &amp; time</label>
                  <input
                    name="followUpDate"
                    type="datetime-local"
                    className="input"
                    defaultValue={detail.contact.followUpDate ? new Date(detail.contact.followUpDate).toISOString().slice(0, 16) : ""}
                    style={{ marginBottom: "0.5rem" }}
                    data-testid="input-follow-up-date"
                  />
                  <label style={{ display: "block", fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>Note</label>
                  <textarea
                    name="followUpNote"
                    className="input"
                    placeholder="What needs to be done?"
                    defaultValue={detail.contact.followUpNote || ""}
                    rows={2}
                    style={{ resize: "none", marginBottom: "0.5rem" }}
                    data-testid="input-follow-up-note"
                  />
                  {detail.contact.followUpDate && !detail.contact.followUpDone ? (
                    <button
                      type="button"
                      onClick={() => updateMutation.mutate({ id: detail.contact.id, data: { followUpDone: true, followUpDate: null, followUpNote: null } })}
                      className="btn btn-secondary btn-sm"
                      data-testid="button-mark-follow-up-done"
                    >
                      ✓ Mark Done
                    </button>
                  ) : null}
                  {detail.contact.followUpDone ? (
                    <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>✓ Follow-up marked done</span>
                  ) : null}
                </div>

                <button type="submit" disabled={updateMutation.isPending} className="btn btn-primary btn-sm" style={{ alignSelf: "flex-end" }}>{updateMutation.isPending ? "Saving…" : "Save"}</button>
              </form>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem", fontSize: "var(--text-sm)", marginBottom: "1rem" }}>
                  {detail.contact.company && (<><span style={{ color: "var(--color-text-muted)" }}>Company</span><span>{detail.contact.company}</span></>)}
                  {detail.contact.phone && (<><span style={{ color: "var(--color-text-muted)" }}>Phone</span><span>{detail.contact.phone}</span></>)}
                  {detail.contact.source && (<><span style={{ color: "var(--color-text-muted)" }}>Source</span><span>{detail.contact.source}</span></>)}
                  {detail.contact.notes && (<><span style={{ color: "var(--color-text-muted)" }}>Notes</span><span style={{ whiteSpace: "pre-wrap" }}>{detail.contact.notes}</span></>)}
                </div>

                <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "1rem", marginBottom: "1rem" }}>
                  <h4 style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "var(--text-sm)" }}>Activity</h4>
                  <form onSubmit={e => {
                    e.preventDefault();
                    const fd = new FormData(e.target as HTMLFormElement);
                    const body = String(fd.get("body") || "").trim();
                    if (!body) return;
                    addActivityMutation.mutate({ id: detail.contact.id, type: "note", body }, {
                      onSuccess: () => (e.target as HTMLFormElement).reset(),
                    });
                  }} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <input name="body" className="input" placeholder="Add a note…" style={{ flex: 1 }} maxLength={500} />
                    <button type="submit" disabled={addActivityMutation.isPending} className="btn btn-primary btn-sm">{addActivityMutation.isPending ? "…" : "Add"}</button>
                  </form>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 240, overflow: "auto" }}>
                    {(detail.activities || []).length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--color-text-faint)" }}>No activity yet.</p>
                    ) : (
                      detail.activities.map((a: any) => (
                        <div key={a.id} style={{ padding: "0.5rem 0.75rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", fontSize: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{a.type}</span>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <span style={{ color: "var(--color-text-faint)" }}>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</span>
                              {editingActivityId !== a.id && (
                                <>
                                  <button onClick={() => setEditingActivityId(a.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "var(--color-primary)", padding: 0 }}>Edit</button>
                                  <button onClick={() => { if (confirm("Delete this note?")) deleteActivityMutation.mutate({ contactId: detail.contact.id, activityId: a.id }); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#b91c1c", padding: 0 }}>Delete</button>
                                </>
                              )}
                            </div>
                          </div>
                          {editingActivityId === a.id ? (
                            <form onSubmit={e => {
                              e.preventDefault();
                              const fd = new FormData(e.target as HTMLFormElement);
                              const body = String(fd.get("body") || "").trim();
                              if (!body) return;
                              editActivityMutation.mutate({ contactId: detail.contact.id, activityId: a.id, body }, {
                                onSuccess: () => setEditingActivityId(null),
                              });
                            }} style={{ display: "flex", gap: 4, marginTop: 4 }}>
                              <input name="body" defaultValue={a.body || a.content || ""} className="input" style={{ flex: 1, fontSize: 12 }} maxLength={500} autoFocus />
                              <button type="submit" disabled={editActivityMutation.isPending} className="btn btn-primary btn-sm" style={{ fontSize: 11 }}>Save</button>
                              <button type="button" onClick={() => setEditingActivityId(null)} className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>Cancel</button>
                            </form>
                          ) : (
                            <div style={{ whiteSpace: "pre-wrap" }}>{a.body || a.content}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => { if (confirm("Delete this contact?")) deleteMutation.mutate(detail.contact.id); }} className="btn btn-secondary btn-sm" style={{ color: "var(--color-error)" }}>Delete contact</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- New page wizard ---
// #14: Step 1 only asks for username/page name, then launches AI wizard directly
function NewPageWizardModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (pageId: number) => void }) {
  const [username, setUsername] = useState("");
  const [createdPageId, setCreatedPageId] = useState<number | null>(null);
  const [showAIWizard, setShowAIWizard] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pages", { username, title: username, accentColor: "#e06b1a", background: "none" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create page");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      const id = data?.page?.id || data?.id;
      if (id) {
        setCreatedPageId(id);
        onCreated(id);
        setShowAIWizard(true);
      } else {
        onClose();
      }
    },
  });

  const reset = () => { setUsername(""); setCreatedPageId(null); setShowAIWizard(false); };

  if (!open) return null;

  // After page is created, show the AI wizard to configure it
  if (showAIWizard && createdPageId) {
    return (
      <AIWizardModal
        onClose={() => { reset(); onClose(); }}
        onApply={async (data: any) => {
          try {
            const updateData: any = {};
            if (data.background) updateData.background = data.background;
            if (data.accentColor) updateData.accentColor = data.accentColor;
            if (data.title) updateData.title = data.title;
            if (data.bio) updateData.bio = data.bio;
            if (data.blocks) updateData.blocks = JSON.stringify(data.blocks);
            await apiRequest("PATCH", `/api/pages/${createdPageId}`, updateData);
            queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
            reset();
            onClose();
          } catch {}
        }}
      />
    );
  }

  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }} onClick={onClose}>
      <div className="card" style={{ width: "100%", maxWidth: 440, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontWeight: 800, marginBottom: "0.5rem", fontFamily: "Cabinet Grotesk, sans-serif" }}>Name your new page</h3>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1rem" }}>Choose a username for your page URL. The AI wizard will set everything else up.</p>
        <input
          className="input"
          placeholder="yourname"
          value={username}
          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          data-testid="input-wizard-username"
          autoFocus
        />
        <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: "0.5rem" }}>linkbay.ai/{username || "yourname"}</p>
        {createMutation.error && <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", marginTop: "0.5rem" }}>{(createMutation.error as Error).message}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.25rem" }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!username || username.length < 3 || createMutation.isPending}
            className="btn btn-primary btn-sm"
          >{createMutation.isPending ? "Creating…" : "Continue with AI ✨"}</button>
        </div>
      </div>
    </div>
  );
}

// --- Settings Panel ---
function SettingsPanel({ user, pages, onLogout }: { user: any; pages: any[]; onLogout: () => void }) {
  const [name, setName] = useState(user?.name ?? "");
  const [profileMsg, setProfileMsg] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [, navigate] = useLocation();
  // Notification preferences (stored in user's browser via state; can be persisted per user)
  const [emailOnNewLead, setEmailOnNewLead] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  // Newsletter opt-in (General 11) — persisted to server
  const [newsletterOptin, setNewsletterOptin] = useState<boolean>(!!user?.newsletterOptin);
  const [newsletterMsg, setNewsletterMsg] = useState("");

  const newsletterMutation = useMutation({
    mutationFn: async (val: boolean) => {
      const res = await apiRequest("PATCH", "/api/account/profile", { newsletterOptin: val });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_data, val) => {
      setNewsletterOptin(val);
      setNewsletterMsg(val ? "Subscribed to newsletter!" : "Unsubscribed.");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setTimeout(() => setNewsletterMsg(""), 2500);
    },
  });
  // Page visibility toggles
  const [pageVisibilityMsg, setPageVisibilityMsg] = useState<Record<number, string>>({});

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(""); setAvatarMsg(""); setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/account/avatar", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarMsg("Profile picture updated!");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setTimeout(() => setAvatarMsg(""), 3000);
    } catch (err: any) {
      setAvatarError(err.message || "Upload failed");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/account/avatar");
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      setAvatarMsg("Profile picture removed.");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setTimeout(() => setAvatarMsg(""), 3000);
    },
  });

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/account/profile", { name });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      setProfileMsg("Profile saved!");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setTimeout(() => setProfileMsg(""), 2500);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/account/password", { currentPassword: currentPw, newPassword: newPw });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      setPwMsg("Password updated!");
      setPwError("");
      setCurrentPw(""); setNewPw("");
      setTimeout(() => setPwMsg(""), 2500);
    },
    onError: (err: Error) => {
      setPwError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/account", { password: deletePassword });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to delete account"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], { user: null, pages: [] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: (err: Error) => {
      setDeleteError(err.message);
    },
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: number; published: boolean }) => {
      const res = await apiRequest("PATCH", `/api/pages/${id}`, { published });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      setPageVisibilityMsg(m => ({ ...m, [vars.id]: vars.published ? "✓ Page is now public" : "✓ Page is now private" }));
      setTimeout(() => setPageVisibilityMsg(m => { const n = { ...m }; delete n[vars.id]; return n; }), 2500);
    },
  });

  return (
    <div className="settings-panel-content" style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
      <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "1.5rem" }}>Settings</h1>

      {/* Profile */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "1.25rem" }}>Profile</h2>

        {/* Avatar upload */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem", padding: "1rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {user?.avatarUrl ? (
              <img
                src={resolveMediaUrl(user.avatarUrl)}
                alt={user.name}
                className="avatar-img"
                style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--color-surface)", boxShadow: "var(--shadow-md)" }}
              />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", fontWeight: 800, border: "3px solid var(--color-surface)", boxShadow: "var(--shadow-md)" }}>
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.375rem" }}>Profile picture</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>JPEG, PNG, WebP or GIF. Max 5MB. Resized to 400×400.</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }} data-testid="button-upload-avatar">
                {avatarUploading ? "Uploading…" : user?.avatarUrl ? "Change photo" : "Upload photo"}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={handleAvatarChange} disabled={avatarUploading} />
              </label>
              {user?.avatarUrl && (
                <button className="btn btn-sm" style={{ color: "var(--color-error)", border: "1.5px solid var(--color-error)", background: "transparent" }} onClick={() => removeAvatarMutation.mutate()} disabled={removeAvatarMutation.isPending} data-testid="button-remove-avatar">
                  {removeAvatarMutation.isPending ? "Removing…" : "Remove"}
                </button>
              )}
            </div>
            {avatarMsg && <div style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600, marginTop: "0.5rem" }}>✓ {avatarMsg}</div>}
            {avatarError && <div style={{ fontSize: 12, color: "var(--color-error)", marginTop: "0.5rem" }}>{avatarError}</div>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Full name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} data-testid="input-profile-name" />
          </div>
          <div>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Email</label>
            <input className="input" value={user?.email ?? ""} disabled style={{ opacity: 0.7, cursor: "not-allowed" }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => profileMutation.mutate()} className="btn btn-primary btn-sm" disabled={profileMutation.isPending} data-testid="button-save-profile">
            {profileMutation.isPending ? "Saving…" : "Save profile"}
          </button>
          {profileMsg && <span style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600 }}>✓ {profileMsg}</span>}
        </div>
      </div>

      {/* Password */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "1.25rem" }}>Change password</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", maxWidth: 400, marginBottom: "1.25rem" }}>
          <div>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>Current password</label>
            <input type="password" className="input" value={currentPw} onChange={e => setCurrentPw(e.target.value)} data-testid="input-current-password" />
          </div>
          <div>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>New password</label>
            <input type="password" className="input" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" data-testid="input-new-password" />
          </div>
        </div>
        {pwError && <p style={{ fontSize: 12, color: "var(--color-error)", marginBottom: "0.75rem" }}>{pwError}</p>}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => { setPwError(""); passwordMutation.mutate(); }} className="btn btn-primary btn-sm" disabled={passwordMutation.isPending || !currentPw || newPw.length < 8} data-testid="button-update-password">
            {passwordMutation.isPending ? "Updating…" : "Update password"}
          </button>
          {pwMsg && <span style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600 }}>✓ {pwMsg}</span>}
        </div>
      </div>

      {/* Custom domain */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem", opacity: 0.85 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>Custom domain</h2>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 999, background: "rgba(224,107,26,0.12)", color: "var(--color-primary)", border: "1px solid rgba(224,107,26,0.25)", letterSpacing: "0.04em" }}>COMING SOON</span>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1rem" }}>Connect your own domain to your Linkbay page. Available on Business plan.</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input className="input" placeholder="yourdomain.com" style={{ flex: 1 }} disabled />
          <button className="btn btn-secondary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>Coming soon</button>
        </div>
      </div>

      {/* Page visibility */}
      {pages.length > 0 && (
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.25rem" }}>Page visibility</h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1rem" }}>Control whether each page is publicly accessible.</p>
          {pages.map((p: any) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>/{p.username}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{p.title || "Untitled page"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {pageVisibilityMsg[p.id] && <span style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600 }}>{pageVisibilityMsg[p.id]}</span>}
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "var(--text-sm)", userSelect: "none" }}>
                  <div
                    onClick={() => togglePublishedMutation.mutate({ id: p.id, published: !p.published })}
                    style={{
                      width: 44, height: 24, borderRadius: 999, cursor: "pointer",
                      background: p.published ? "var(--color-primary)" : "var(--color-surface-offset)",
                      border: `1.5px solid ${p.published ? "var(--color-primary)" : "var(--color-border)"}`,
                      position: "relative", transition: "background 0.15s", flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 2, left: p.published ? 22 : 2,
                      width: 18, height: 18, borderRadius: "50%", background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "left 0.15s",
                    }} />
                  </div>
                  <span style={{ color: p.published ? "var(--color-success)" : "var(--color-text-faint)", fontWeight: 600, fontSize: 12 }}>
                    {p.published ? "Public" : "Private"}
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification preferences */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.25rem" }}>Notifications</h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1rem" }}>Choose how you hear about activity on your pages.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { id: "newLead", label: "Email on new lead", desc: "Get an email whenever someone submits your lead form.", val: emailOnNewLead, set: setEmailOnNewLead },
            { id: "weekly", label: "Weekly summary", desc: "A weekly digest of your page views, clicks and leads.", val: weeklyDigest, set: setWeeklyDigest },
          ].map(row => (
            <div key={row.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{row.label}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{row.desc}</div>
              </div>
              <div
                onClick={() => row.set(!row.val)}
                style={{
                  width: 44, height: 24, borderRadius: 999, cursor: "pointer",
                  background: row.val ? "var(--color-primary)" : "var(--color-surface-offset)",
                  border: `1.5px solid ${row.val ? "var(--color-primary)" : "var(--color-border)"}`,
                  position: "relative", transition: "background 0.15s", flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute", top: 2, left: row.val ? 22 : 2,
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.15s",
                }} />
              </div>
            </div>
          ))}
        </div>
        {notifMsg && <p style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600, marginTop: "0.75rem" }}>✓ {notifMsg}</p>}
        <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: "0.75rem" }}>Email delivery requires your email to be confirmed. Coming soon.</p>
        {/* Newsletter opt-in — General 11 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-divider)" }}>
          <div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Linkbay newsletter</div>
            <div style={{ fontSize: 11, color: "var(--color-text-faint)" }}>Product updates, tips and feature announcements.</div>
          </div>
          <div
            onClick={() => newsletterMutation.mutate(!newsletterOptin)}
            style={{
              width: 44, height: 24, borderRadius: 999, cursor: "pointer",
              background: newsletterOptin ? "var(--color-primary)" : "var(--color-surface-offset)",
              border: `1.5px solid ${newsletterOptin ? "var(--color-primary)" : "var(--color-border)"}`,
              position: "relative", transition: "background 0.15s", flexShrink: 0,
            }}
            data-testid="toggle-newsletter-optin"
          >
            <div style={{
              position: "absolute", top: 2, left: newsletterOptin ? 22 : 2,
              width: 18, height: 18, borderRadius: "50%", background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.15s",
            }} />
          </div>
        </div>
        {newsletterMsg && <p style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600, marginTop: "0.5rem" }}>✓ {newsletterMsg}</p>}
      </div>

      {/* Danger zone */}
      <div className="card" style={{ padding: "1.5rem", border: "1.5px solid rgba(239,68,68,0.25)" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-error)" }}>Danger zone</h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
          Permanently delete your account and all associated pages, links, and leads. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn"
            style={{ background: "rgba(239,68,68,0.08)", color: "var(--color-error)", border: "1.5px solid rgba(239,68,68,0.3)", fontWeight: 700 }}
            data-testid="button-delete-account-open"
          >
            Delete my account
          </button>
        ) : (
          <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-error)", marginBottom: "0.875rem" }}>
              ⚠️ This will delete your account, {pages.length} page{pages.length !== 1 ? "s" : ""}, and all associated data. Enter your password to confirm.
            </p>
            <div style={{ marginBottom: "0.875rem" }}>
              <input
                type="password"
                className="input"
                placeholder="Enter your password to confirm"
                value={deletePassword}
                onChange={e => { setDeletePassword(e.target.value); setDeleteError(""); }}
                style={{ borderColor: "rgba(239,68,68,0.4)" }}
                data-testid="input-delete-confirm-password"
              />
            </div>
            {deleteError && <p style={{ fontSize: 12, color: "var(--color-error)", marginBottom: "0.75rem" }}>{deleteError}</p>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => { setDeleteError(""); deleteMutation.mutate(); }}
                disabled={!deletePassword || deleteMutation.isPending}
                className="btn"
                style={{ background: "var(--color-error)", color: "white", border: "none", fontWeight: 700 }}
                data-testid="button-delete-account-confirm"
              >
                {deleteMutation.isPending ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }}
                className="btn btn-secondary"
                data-testid="button-delete-account-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* #16: Referrals moved into Settings */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.25rem" }}>Referrals</h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1rem" }}>Earn rewards by sharing Linkbay with friends.</p>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🎁</div>
        <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.375rem" }}>Referral programme coming soon</h3>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, marginBottom: "0.75rem" }}>We're building a referral programme where you'll earn rewards for every friend who joins Linkbay. Stay tuned!</p>
        <div style={{ padding: "0.75rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Your referral link: <strong style={{ color: "var(--color-primary)" }}>linkbay.ai/r/{user?.username || "..."}</strong>
        </div>
      </div>
    </div>
  );
}

// --- Email Signature Panel ---
type SigStyle = "classic" | "minimal" | "card";

function buildSignatureHtml(opts: {
  name: string; title: string; company: string; phone: string;
  email: string; pageUrl: string; pageLabel: string;
  accent: string; style: SigStyle; showDivider: boolean;
  avatarUrl?: string;
}): string {
  const { name, title, company, phone, email, pageUrl, pageLabel, accent, style, showDivider, avatarUrl } = opts;
  const safeAccent = accent || "#e06b1a";
  const btnText = pageLabel || "View my profile";
  const hasAvatar = !!avatarUrl;

  const avatarBlock = hasAvatar ? `<img src="${avatarUrl}" width="56" height="56" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block;border:2px solid ${safeAccent}" alt="${name}" />` : `<div style="width:56px;height:56px;border-radius:50%;background:${safeAccent};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;font-family:Arial,sans-serif;line-height:56px;text-align:center">${name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</div>`;

  const dividerHtml = showDivider ? `<div style="border-top:2px solid ${safeAccent};margin:0 0 12px 0;width:100%"></div>` : "";

  const metaLine = [title, company].filter(Boolean).join(" · ");
  const phoneHtml = phone ? `<tr><td style="padding:1px 0;font-size:12px;color:#666;font-family:Arial,sans-serif;">📞 <a href="tel:${phone}" style="color:#666;text-decoration:none">${phone}</a></td></tr>` : "";
  const emailHtml = email ? `<tr><td style="padding:1px 0;font-size:12px;color:#666;font-family:Arial,sans-serif;">✉ <a href="mailto:${email}" style="color:${safeAccent};text-decoration:none">${email}</a></td></tr>` : "";
  const btnHtml = pageUrl ? `<tr><td style="padding-top:10px"><a href="${pageUrl}" style="display:inline-block;background:${safeAccent};color:#fff;font-family:Arial,sans-serif;font-size:12px;font-weight:700;padding:7px 16px;border-radius:6px;text-decoration:none;letter-spacing:0.01em">${btnText} →</a></td></tr>` : "";

  if (style === "minimal") {
    return `<!-- Linkbay Email Signature -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif">
  ${dividerHtml ? `<tr><td colspan="2" style="padding-bottom:8px">${dividerHtml}</td></tr>` : ""}
  <tr>
    <td style="padding-right:12px;vertical-align:top">${avatarBlock}</td>
    <td style="vertical-align:top">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td style="font-size:15px;font-weight:700;color:#111;font-family:Arial,sans-serif;white-space:nowrap">${name}</td></tr>
        ${metaLine ? `<tr><td style="font-size:12px;color:#666;font-family:Arial,sans-serif;padding-bottom:4px">${metaLine}</td></tr>` : ""}
        ${phoneHtml}${emailHtml}${btnHtml}
      </table>
    </td>
  </tr>
</table>`;
  }

  if (style === "card") {
    return `<!-- Linkbay Email Signature -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;border-left:4px solid ${safeAccent};padding-left:14px;margin-top:4px">
  <tr>
    <td style="padding-right:14px;vertical-align:middle">${avatarBlock}</td>
    <td style="vertical-align:middle">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td style="font-size:16px;font-weight:800;color:#111;font-family:Arial,sans-serif">${name}</td></tr>
        ${metaLine ? `<tr><td style="font-size:12px;color:${safeAccent};font-family:Arial,sans-serif;font-weight:600;padding-bottom:6px">${metaLine}</td></tr>` : ""}
        ${phoneHtml}${emailHtml}${btnHtml}
      </table>
    </td>
  </tr>
</table>`;
  }

  // classic (default)
  return `<!-- Linkbay Email Signature -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif">
  ${dividerHtml ? `<tr><td style="padding-bottom:10px">${dividerHtml}</td></tr>` : ""}
  <tr>
    <td style="padding-right:16px;vertical-align:top">${avatarBlock}</td>
    <td style="vertical-align:top;border-left:1px solid #e5e7eb;padding-left:16px">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td style="font-size:16px;font-weight:800;color:#111;font-family:Arial,sans-serif">${name}</td></tr>
        ${metaLine ? `<tr><td style="font-size:12px;color:#555;font-family:Arial,sans-serif;padding-bottom:6px">${metaLine}</td></tr>` : ""}
        ${phoneHtml}${emailHtml}${btnHtml}
      </table>
    </td>
  </tr>
</table>`;
}

function buildSignaturePlain(opts: { name: string; title: string; company: string; phone: string; email: string; pageUrl: string; pageLabel: string }): string {
  const { name, title, company, phone, email, pageUrl, pageLabel } = opts;
  const lines = [
    name,
    [title, company].filter(Boolean).join(" | "),
    phone ? `☎ ${phone}` : "",
    email ? `✉ ${email}` : "",
    pageUrl ? `${pageLabel || "Profile"}: ${pageUrl}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

const CLIENT_GUIDES: Array<{ id: string; label: string; icon: string; steps: string[] }> = [
  {
    id: "gmail",
    label: "Gmail",
    icon: "📧",
    steps: [
      "Click the gear icon (⚙️) in Gmail → \"See all settings\"",
      'Scroll to the \"Signature\" section → click \"Create new\"',
      "Give it a name (e.g. \"Professional\")",
      'Click inside the signature box → press Ctrl+V (or ⌘+V on Mac) to paste',
      "Scroll down and click \"Save Changes\"",
    ],
  },
  {
    id: "outlook",
    label: "Outlook",
    icon: "📨",
    steps: [
      "Open Outlook → File → Options → Mail → Signatures",
      "Click \"New\" to create a signature",
      "Click inside the editor box and press Ctrl+V to paste",
      "Set it as default for New messages and/or Replies",
      "Click \"OK\" to save",
    ],
  },
  {
    id: "apple",
    label: "Apple Mail",
    icon: "🍎",
    steps: [
      "Open Mail → Preferences (or Settings) → Signatures",
      "Select your account on the left, click \"+\"",
      "Uncheck \"Always match my default message font\" if visible",
      "Press ⌘+V to paste into the signature area",
      "Close Preferences — changes save automatically",
    ],
  },
];

function EmailSignaturePanel({ user, pages }: { user: any; pages: any[] }) {
  const page = pages[0] ?? null;
  const defaultPageUrl = page ? `https://linkbay.ai/${page.username}` : "";
  const defaultAccent = page?.accentColor || "#e06b1a";

  const [name, setName] = useState<string>(user?.name || "");
  const [jobTitle, setJobTitle] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [phone, setPhone] = useState<string>(page?.phone || "");
  const [sigEmail, setSigEmail] = useState<string>(page?.contactEmail || user?.email || "");
  const [pageLabel, setPageLabel] = useState<string>("View my profile");
  const [accent, setAccent] = useState<string>(defaultAccent);
  const [style, setStyle] = useState<SigStyle>("classic");
  const [showDivider, setShowDivider] = useState<boolean>(true);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedPlain, setCopiedPlain] = useState(false);
  const [activeGuide, setActiveGuide] = useState<string | null>(null);

  const sigOpts = {
    name, title: jobTitle, company, phone, email: sigEmail,
    pageUrl: defaultPageUrl, pageLabel, accent, style, showDivider,
    avatarUrl: user?.avatarUrl || undefined,
  };

  const htmlSig = buildSignatureHtml(sigOpts);
  const plainSig = buildSignaturePlain(sigOpts);

  const copyHtml = async () => {
    try {
      // Modern clipboard API — write as text/html so email clients accept formatted paste
      const blob = new Blob([htmlSig], { type: "text/html" });
      const plainBlob = new Blob([plainSig], { type: "text/plain" });
      await navigator.clipboard.write([new ClipboardItem({ "text/html": blob, "text/plain": plainBlob })]);
    } catch {
      // Fallback: copy raw HTML as text
      await navigator.clipboard.writeText(htmlSig);
    }
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const copyPlain = async () => {
    await navigator.clipboard.writeText(plainSig);
    setCopiedPlain(true);
    setTimeout(() => setCopiedPlain(false), 2500);
  };

  const inputLabel = (label: string) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 3, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{label}</div>
  );

  return (
    <div className="signature-panel-content" style={{ flex: 1, overflow: "auto", padding: "1.5rem 1.75rem" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: 22 }}>✉️</span> Email Signature
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", margin: "0.375rem 0 0", lineHeight: 1.5 }}>
            Generate a professional HTML signature with a direct link to your Linkbay page. Paste it straight into Gmail, Outlook, or Apple Mail.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>

          {/* LEFT — controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Style picker */}
            <div style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1rem 1.125rem" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.75rem" }}>Style</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["classic", "minimal", "card"] as SigStyle[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    style={{
                      flex: 1, padding: "0.5rem", borderRadius: "var(--radius-md)",
                      border: style === s ? `2px solid ${accent}` : "1.5px solid var(--color-border)",
                      background: style === s ? `rgba(${accent === "#e06b1a" ? "224,107,26" : "100,100,100"},0.07)` : "var(--color-bg)",
                      cursor: "pointer", fontSize: 12, fontWeight: style === s ? 700 : 500,
                      color: style === s ? "var(--color-text)" : "var(--color-text-muted)",
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Personal details */}
            <div style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1rem 1.125rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.125rem" }}>Your details</div>
              <div>{inputLabel("Full name")}<input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" style={{ width: "100%", boxSizing: "border-box" as const }} /></div>
              <div>{inputLabel("Job title")}<input className="input" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Marketing Consultant" style={{ width: "100%", boxSizing: "border-box" as const }} /></div>
              <div>{inputLabel("Company")}<input className="input" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Ltd" style={{ width: "100%", boxSizing: "border-box" as const }} /></div>
              <div>{inputLabel("Phone")}<input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7700 900000" style={{ width: "100%", boxSizing: "border-box" as const }} /></div>
              <div>{inputLabel("Email")}<input className="input" value={sigEmail} onChange={e => setSigEmail(e.target.value)} placeholder="jane@example.com" style={{ width: "100%", boxSizing: "border-box" as const }} /></div>
            </div>

            {/* Link button settings */}
            <div style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1rem 1.125rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.125rem" }}>Profile link button</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>Linking to: <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>{defaultPageUrl || "(no page yet)"}</span></div>
              <div>{inputLabel("Button label")}<input className="input" value={pageLabel} onChange={e => setPageLabel(e.target.value)} placeholder="View my profile" style={{ width: "100%", boxSizing: "border-box" as const }} /></div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                {inputLabel("Accent colour")}
                <input type="color" value={accent} onChange={e => setAccent(e.target.value)} style={{ width: 34, height: 28, borderRadius: 6, border: "1px solid var(--color-border)", cursor: "pointer", padding: 2 }} />
                <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{accent}</span>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: 12, cursor: "pointer", marginTop: "0.125rem" }}>
                <input type="checkbox" checked={showDivider} onChange={e => setShowDivider(e.target.checked)} />
                <span style={{ color: "var(--color-text-muted)" }}>Show divider line above signature</span>
              </label>
            </div>

          </div>

          {/* RIGHT — preview + copy */}
          <div className="signature-preview-wrap" style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: 0 }}>

            {/* Preview box */}
            <div style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "0.625rem 1rem", borderBottom: "1px solid var(--color-divider)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 10, color: "var(--color-text-faint)", marginLeft: "0.375rem", fontWeight: 500 }}>Preview</span>
              </div>
              {/* Email chrome mockup */}
              <div style={{ background: "#fff", padding: "1rem 1.25rem" }}>
                <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>From: {sigEmail || user?.email || "you@example.com"}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>To: client@example.com</div>
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: "1rem", fontFamily: "Arial, sans-serif" }}>
                  Hi Sarah,<br />Hope you’re well. I’ve attached the proposal as discussed.
                </div>
                <div style={{ color: "#374151", fontFamily: "Arial, sans-serif" }}
                  dangerouslySetInnerHTML={{ __html: htmlSig }}
                />
              </div>
            </div>

            {/* Copy buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
              <button
                className="btn btn-primary"
                onClick={copyHtml}
                style={{ justifyContent: "center", gap: "0.375rem" }}
              >
                {copiedHtml ? <>{icons.check} Copied!</> : <>{icons.copy} Copy HTML</>}
              </button>
              <button
                className="btn btn-secondary"
                onClick={copyPlain}
                style={{ justifyContent: "center", gap: "0.375rem" }}
              >
                {copiedPlain ? <>{icons.check} Copied!</> : <>Copy plain text</>}
              </button>
            </div>

            <p style={{ fontSize: 11, color: "var(--color-text-faint)", margin: 0, lineHeight: 1.5, textAlign: "center" as const }}>
              Click <strong>Copy HTML</strong>, then paste directly into your email client’s signature editor to keep full formatting.
            </p>

            {/* How to install guides */}
            <div style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-divider)" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>How to install</div>
              </div>
              <div style={{ padding: "0.5rem" }}>
                {CLIENT_GUIDES.map(guide => (
                  <div key={guide.id}>
                    <button
                      type="button"
                      onClick={() => setActiveGuide(prev => prev === guide.id ? null : guide.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.5rem 0.625rem", background: "none", border: "none", cursor: "pointer",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>{guide.icon}</span>{guide.label}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points={activeGuide === guide.id ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
                      </svg>
                    </button>
                    {activeGuide === guide.id && (
                      <ol style={{ margin: "0 0 0.5rem 0", padding: "0 0.625rem 0.5rem 2rem", listStyle: "decimal" }}>
                        {guide.steps.map((step, i) => (
                          <li key={i} style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "0.25rem" }}>{step}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Raw HTML expandable */}
            <details style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <summary style={{ padding: "0.625rem 1rem", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", listStyle: "none", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                View raw HTML
              </summary>
              <pre style={{ margin: 0, padding: "0.75rem 1rem", fontSize: 10, overflowX: "auto", color: "var(--color-text-muted)", lineHeight: 1.5, maxHeight: 240, overflowY: "auto" }}>{htmlSig}</pre>
            </details>

          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Dashboard ---
// ────────────────────────────────────────────────────────────────────────
// useLicence hook
// ────────────────────────────────────────────────────────────────────────
function useLicence() {
  return useQuery({
    queryKey: ["/api/me/licence"],
    queryFn: () => apiRequest("GET", "/api/me/licence").then(r => r.json()),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// ────────────────────────────────────────────────────────────────────────
// UpgradeModal
// ────────────────────────────────────────────────────────────────────────
function UpgradeModal({ onClose, onBilling }: { onClose: () => void; onBilling: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-xl)", padding: "2rem", maxWidth: 480, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.24)" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>Upgrade your plan</h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>Unlock more pages, analytics, contacts and AI features.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          {([
            { tier: "Pro", price: "£5", period: "/mo", color: "#e06b1a", features: ["3 pages", "Unlimited blocks", "Analytics", "Contacts", "AI builder", "QR codes", "Lead notifications"] },
            { tier: "Business", price: "£20", period: "/mo", color: "#0891b2", features: ["Unlimited pages", "Unlimited blocks", "Analytics", "Contacts", "AI builder", "QR codes", "CSV export", "Remove branding", "Lead notifications"] },
          ] as const).map(plan => (
            <div key={plan.tier} style={{ border: `2px solid ${plan.color}`, borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: plan.color, marginBottom: "0.25rem" }}>{plan.tier}</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, lineHeight: 1 }}>{plan.price}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-muted)" }}>{plan.period}</span></div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0.75rem 0 0", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {plan.features.map(f => <li key={f} style={{ fontSize: 12, color: "var(--color-text-muted)" }}>✓ {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onBilling}>View plans</button>
          <button className="btn btn-secondary" onClick={onClose}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// BillingPanel
// ────────────────────────────────────────────────────────────────────────
function BillingPanel() {
  const { data: lic, isLoading } = useLicence();
  const [annual, setAnnual] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Success banner from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success") {
      setToast("✓ Payment successful! Your plan has been upgraded.");
      queryClient.invalidateQueries({ queryKey: ["/api/me/licence"] });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const checkoutMutation = useMutation({
    mutationFn: (priceId: string) =>
      apiRequest("POST", "/api/stripe/create-checkout", { priceId }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setToast(`⚠️ ${data.error}`);
      }
    },
    onError: (err: any) => setToast(`⚠️ Could not start checkout: ${err?.message || "Please try again"}`),
  });

  const portalMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/stripe/create-portal", {}).then(r => r.json()),
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: () => setToast("⚠️ Could not open billing portal."),
  });

  const plans = [
    {
      id: "free",
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      color: "var(--color-text-muted)",
      features: ["1 page", "5 content blocks", "Basic profile", "Linkbay branding"],
      priceIdMonthly: "",
      priceIdAnnual: "",
    },
    {
      id: "pro",
      name: "Pro",
      monthlyPrice: 5,
      annualPrice: 4,
      color: "#e06b1a",
      features: ["3 pages", "Unlimited blocks", "Analytics", "Contacts", "AI page builder", "QR codes", "Lead notifications", "Priority support"],
      priceIdMonthly: lic?.priceIds?.proMonthly || "",
      priceIdAnnual: lic?.priceIds?.proAnnual || "",
    },
    {
      id: "business",
      name: "Business",
      monthlyPrice: 20,
      annualPrice: 16,
      color: "#0891b2",
      features: ["Unlimited pages", "Unlimited blocks", "Analytics", "Contacts", "AI page builder", "QR codes", "CSV export", "Remove branding", "Custom domain", "Lead notifications", "Priority support"],
      priceIdMonthly: lic?.priceIds?.businessMonthly || "",
      priceIdAnnual: lic?.priceIds?.businessAnnual || "",
    },
  ];

  const currentTier = lic?.tier || "free";

  return (
    <div style={{ flex: 1, padding: "1.5rem", overflow: "auto", maxWidth: 1100 }}>
      {toast && (
        <div style={{ background: "var(--color-success-subtle, #d1fae5)", border: "1px solid var(--color-success, #10b981)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "var(--text-sm)", color: "var(--color-success, #065f46)" }}>
          {toast}
          <button onClick={() => setToast(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>×</button>
        </div>
      )}

      <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "1.5rem" }}>Billing</h1>

      {/* Current plan */}
      {!isLoading && (
        <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.25rem" }}>Current plan</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 700, background: currentTier === "free" ? "var(--color-surface-offset)" : currentTier === "pro" ? "rgba(224,107,26,0.15)" : "rgba(8,145,178,0.15)", color: currentTier === "free" ? "var(--color-text-muted)" : currentTier === "pro" ? "#e06b1a" : "#0891b2", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {currentTier}
              </span>
              {lic?.expiry && (
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Renews {new Date(lic.expiry).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              )}
            </div>
          </div>
          {currentTier !== "free" && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? "Loading…" : "Manage subscription"}
            </button>
          )}
        </div>
      )}

      {/* Monthly / Annual toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <button onClick={() => setAnnual(false)} style={{ padding: "0.25rem 0.625rem", borderRadius: "var(--radius-md)", fontSize: 11, fontWeight: 600, border: `1px solid ${!annual ? "var(--color-primary)" : "transparent"}`, background: !annual ? "var(--color-primary-highlight)" : "var(--color-surface-offset)", color: !annual ? "var(--color-primary)" : "var(--color-text-faint)", cursor: "pointer" }}>Monthly</button>
        <button onClick={() => setAnnual(true)}  style={{ padding: "0.25rem 0.625rem", borderRadius: "var(--radius-md)", fontSize: 11, fontWeight: 600, border: `1px solid ${annual  ? "var(--color-primary)" : "transparent"}`, background: annual  ? "var(--color-primary-highlight)" : "var(--color-surface-offset)", color: annual  ? "var(--color-primary)" : "var(--color-text-faint)", cursor: "pointer" }}>Annual</button>
        {annual && <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981", background: "rgba(16,185,129,0.12)", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-md)" }}>Save 20%</span>}
      </div>

      {/* Plan cards */}
      <div className="billing-plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {plans.map(plan => {
          const isCurrent = currentTier === plan.id;
          const price = annual ? plan.annualPrice : plan.monthlyPrice;
          const priceId = annual ? plan.priceIdAnnual : plan.priceIdMonthly;
          const isLoading2 = checkoutMutation.isPending && checkoutMutation.variables === priceId;
          const annualTotal = plan.annualPrice > 0 ? plan.annualPrice * 12 : 0;
          const monthlySaving = plan.monthlyPrice > 0 && plan.annualPrice > 0 ? plan.monthlyPrice - plan.annualPrice : 0;
          return (
            <div key={plan.id} style={{ border: `2px solid ${isCurrent ? plan.color : "var(--color-border)"}`, borderRadius: "var(--radius-xl)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", background: isCurrent ? `color-mix(in srgb, ${plan.color} 6%, var(--color-surface))` : "var(--color-surface)", position: "relative" }}>
              {annual && monthlySaving > 0 && (
                <div style={{ position: "absolute", top: "-1px", right: "12px", background: "#10b981", color: "#fff", fontSize: 10, fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "0 0 var(--radius-md) var(--radius-md)", letterSpacing: "0.04em" }}>SAVE £{monthlySaving * 12}/yr</div>
              )}
              <div style={{ fontSize: 12, fontWeight: 700, color: plan.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{plan.name}</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, lineHeight: 1 }}>
                {price === 0 ? "Free" : `£${price}`}
                {price > 0 && <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-muted)" }}>{annual ? "/mo" : "/mo"}</span>}
              </div>
              {price > 0 && annual && annualTotal > 0 && (
                <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginTop: "-0.25rem" }}>£{annualTotal} billed annually</div>
              )}
              {price > 0 && !annual && plan.annualPrice > 0 && (
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: "-0.25rem" }}>or £{plan.annualPrice}/mo billed annually</div>
              )}
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {plan.features.map(f => <li key={f} style={{ fontSize: 12, color: "var(--color-text-muted)" }}><span style={{ color: plan.color }}>✓</span> {f}</li>)}
              </ul>
              <div style={{ marginTop: "auto" }}>
                {isCurrent ? (
                  <div style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: plan.color, padding: "0.5rem" }}>Current plan</div>
                ) : plan.id === "free" ? (
                  <button className="btn btn-secondary btn-sm" style={{ width: "100%" }} onClick={() => portalMutation.mutate()} disabled={currentTier === "free"}>Downgrade</button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: "100%", background: plan.color, borderColor: plan.color }}
                    onClick={() => {
                      if (!priceId) {
                        // Stripe not configured in this environment
                        window.location.href = "mailto:hello@linkbay.ai?subject=Upgrade%20to%20" + plan.name;
                        return;
                      }
                      checkoutMutation.mutate(priceId);
                    }}
                    disabled={checkoutMutation.isPending || isLoading}
                  >
                    {isLoading2 ? "Loading…" : "Upgrade"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="card" style={{ padding: "1.25rem", overflow: "auto" }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>Feature comparison</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--color-text-muted)", fontWeight: 600 }}>Feature</th>
              {["Free", "Pro", "Business"].map(t => <th key={t} style={{ textAlign: "center", padding: "0.5rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {([
              ["Pages", "1", "3", "Unlimited"],
              ["Content blocks", "5", "Unlimited", "Unlimited"],
              ["Analytics", "✕", "✓", "✓"],
              ["Contacts", "✕", "✓", "✓"],
              ["AI page builder", "✕", "✓", "✓"],
              ["QR codes", "✕", "✓", "✓"],
              ["Lead notifications", "✕", "✓", "✓"],
              ["CSV export", "✕", "✕", "✓"],
              ["Remove branding", "✕", "✕", "✓"],
              ["Custom domain", "✕", "✕", "✓"],
              ["Priority support", "✕", "✓", "✓"],
            ] as [string, string, string, string][]).map(([feature, free, pro, biz], i) => (
              <tr key={feature} style={{ background: i % 2 === 0 ? "var(--color-surface-offset)" : undefined }}>
                <td style={{ padding: "0.5rem" }}>{feature}</td>
                {[free, pro, biz].map((v, j) => <td key={j} style={{ textAlign: "center", padding: "0.5rem", color: v === "✕" ? "var(--color-text-faint)" : v === "✓" ? "#10b981" : "var(--color-text)" }}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// AIWizardModal
// ────────────────────────────────────────────────────────────────────────
function AIWizardModal({ onClose, onApply }: { onClose: () => void; onApply: (page: any) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ name: "", tagline: "", goal: "", industry: "", colorMood: "", fontStyle: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  type WizardQuestion = {
    key: string;
    label: string;
    sublabel?: string;
    type: "text" | "select" | "pills" | "color-pills";
    placeholder?: string;
    options?: { value: string; icon?: string; preview?: string; text?: string }[];
  };

  const questions: WizardQuestion[] = [
    {
      key: "name",
      label: "What's your name or brand?",
      type: "text",
      placeholder: "e.g. Sarah Johnson or Bloom Studio",
    },
    {
      key: "tagline",
      label: "What do you do in one sentence?",
      sublabel: "Be specific — this becomes your bio and block text.",
      type: "text",
      placeholder: "e.g. I help DTC brands 3x revenue through paid social",
    },
    {
      key: "goal",
      label: "What's the main goal of this page?",
      sublabel: "Pick the one that matters most right now.",
      type: "select",
      options: [
        { value: "Get clients or customers",  icon: "💼" },
        { value: "Grow my audience",          icon: "📈" },
        { value: "Capture leads & emails",    icon: "📬" },
        { value: "Promote a launch or event", icon: "🚀" },
        { value: "Share my content",          icon: "🎥" },
        { value: "Connect my socials",        icon: "🔗" },
      ],
    },
    {
      key: "industry",
      label: "What industry are you in?",
      type: "select",
      options: [
        { value: "Creator / Influencer",     icon: "🎨" },
        { value: "Fitness & Health",         icon: "💪" },
        { value: "Business & Consulting",    icon: "📊" },
        { value: "Music & Arts",             icon: "🎵" },
        { value: "Retail & E-commerce",      icon: "🛍️" },
        { value: "Tech & Software",          icon: "💻" },
        { value: "Education & Coaching",     icon: "🎓" },
        { value: "Other",                   icon: "✨" },
      ],
    },
    {
      key: "colorMood",
      label: "What vibe should your page have?",
      sublabel: "Sets your background and accent colour.",
      type: "color-pills",
      options: [
        { value: "Warm & energetic",    preview: "linear-gradient(135deg,#b5451b,#e06b1a)", text: "#fff" },
        { value: "Cool & professional", preview: "linear-gradient(135deg,#0891b2,#e8f4f8)", text: "#0891b2" },
        { value: "Dark & dramatic",     preview: "linear-gradient(135deg,#1a1a2e,#7c3aed)", text: "#fff" },
        { value: "Light & minimal",     preview: "linear-gradient(135deg,#f5f0e8,#334155)", text: "#334155" },
        { value: "Natural & earthy",    preview: "linear-gradient(135deg,#d4c4a0,#059669)", text: "#fff" },
        { value: "Bold & creative",     preview: "linear-gradient(135deg,#4a0000,#e11d48)", text: "#fff" },
      ],
    },
    {
      key: "fontStyle",
      label: "How should your text feel?",
      sublabel: "Sets the font across your whole page.",
      type: "pills",
      options: [
        { value: "Clean & modern",     icon: "Aa" },
        { value: "Bold & editorial",   icon: "AB" },
        { value: "Friendly & rounded", icon: "Oo" },
        { value: "Elegant & serif",    icon: "Ꭺ" },
        { value: "Technical & sharp",  icon: "{}" },
      ],
    },
  ];

  const currentQ = questions[step];
  const totalSteps = questions.length;
  const currentVal = answers[currentQ.key as keyof typeof answers];
  const canNext = currentVal.trim().length > 0;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("POST", "/api/ai/generate-page", {
        answers: {
          name: answers.name,
          tagline: answers.tagline,
          goal: answers.goal,
          industry: answers.industry,
          style: answers.fontStyle || "clean, modern",
          colorMood: answers.colorMood,
          fontStyle: answers.fontStyle,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      onApply(data);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-xl)", padding: "2rem", maxWidth: 480, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.24)" }} onClick={e => e.stopPropagation()}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ fontSize: 40, marginBottom: "1rem", animation: "spin 1.5s linear infinite", display: "inline-block" }}>✨</div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.5rem" }}>Rebuilding your page…</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>GPT-4o is generating blocks tailored to your answers</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-faint)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>✨ AI Page Builder · {step + 1} of {totalSteps}</div>
                <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", margin: 0 }}>{currentQ.label}</h2>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: "var(--color-divider)", borderRadius: 999, marginBottom: "1.25rem" }}>
              <div style={{ height: "100%", width: `${((step + 1) / totalSteps) * 100}%`, background: "var(--color-primary)", borderRadius: 999, transition: "width 0.3s" }} />
            </div>

            {currentQ.sublabel && (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "0.875rem", marginTop: "-0.25rem" }}>{currentQ.sublabel}</p>
            )}

            {/* Text input */}
            {currentQ.type === "text" && (
              <input
                autoFocus
                value={currentVal}
                onChange={e => setAnswers(a => ({ ...a, [currentQ.key]: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter" && canNext) step < totalSteps - 1 ? setStep(s => s + 1) : handleGenerate(); }}
                placeholder={currentQ.placeholder}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", fontSize: "var(--text-sm)", marginBottom: "1.25rem", boxSizing: "border-box" as const }}
              />
            )}

            {/* Select (icon + label rows) */}
            {currentQ.type === "select" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginBottom: "1.25rem", maxHeight: 320, overflowY: "auto" }}>
                {currentQ.options!.map(opt => {
                  const active = currentVal === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setAnswers(a => ({ ...a, [currentQ.key]: opt.value }))} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.875rem", borderRadius: "var(--radius-md)", border: `1.5px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`, background: active ? "var(--color-primary-highlight)" : "var(--color-bg)", color: active ? "var(--color-primary)" : "var(--color-text)", fontSize: "var(--text-sm)", fontWeight: active ? 700 : 500, cursor: "pointer", textAlign: "left" as const }}>
                      {opt.icon && <span style={{ fontSize: 16, minWidth: 20 }}>{opt.icon}</span>}
                      {opt.value}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pills (2-col grid) */}
            {currentQ.type === "pills" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {currentQ.options!.map(opt => {
                  const active = currentVal === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setAnswers(a => ({ ...a, [currentQ.key]: opt.value }))} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", borderRadius: "var(--radius-md)", border: `1.5px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`, background: active ? "var(--color-primary-highlight)" : "var(--color-bg)", color: active ? "var(--color-primary)" : "var(--color-text)", fontSize: "var(--text-sm)", fontWeight: active ? 700 : 500, cursor: "pointer", textAlign: "left" as const }}>
                      {opt.icon && <span style={{ fontSize: 13, minWidth: 18, fontWeight: 800 }}>{opt.icon}</span>}
                      {opt.value}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Colour mood */}
            {currentQ.type === "color-pills" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {currentQ.options!.map(opt => {
                  const active = currentVal === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setAnswers(a => ({ ...a, [currentQ.key]: opt.value }))} style={{ padding: "0.875rem", borderRadius: "var(--radius-md)", border: `2.5px solid ${active ? "var(--color-primary)" : "transparent"}`, background: opt.preview, cursor: "pointer", boxShadow: active ? "0 0 0 2px var(--color-primary)" : "0 1px 4px rgba(0,0,0,0.15)", transition: "all 0.15s", position: "relative" as const, overflow: "hidden" as const }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: opt.text, textShadow: "0 1px 3px rgba(0,0,0,0.3)", position: "relative" as const, zIndex: 1 }}>{opt.value}</div>
                      {active && <div style={{ position: "absolute" as const, top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 9, fontWeight: 800 }}>✓</span></div>}
                    </button>
                  );
                })}
              </div>
            )}

            {error && <div style={{ fontSize: 13, color: "var(--color-error, #dc2626)", marginBottom: "1rem", padding: "0.5rem", background: "rgba(220,38,38,0.08)", borderRadius: "var(--radius-sm)" }}>{error}</div>}

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} style={{ visibility: step === 0 ? "hidden" : "visible" }}>Back</button>
              {step < totalSteps - 1 ? (
                <button className="btn btn-primary btn-sm" onClick={() => setStep(s => s + 1)} disabled={!canNext}>Next →</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={!canNext}>✨ Build my page</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("overview");
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [newPageWizardOpen, setNewPageWizardOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, pages, isLoading, logout, refetch } = useAuth();
  const { data: licence } = useLicence();
  const [, navigate] = useLocation();

  const licenceTier: "free" | "pro" | "business" = (licence as any)?.tier ?? "free";
  const TIER_LIMITS_CLIENT = {
    free:     { pages: 1,        analytics: false, contacts: false },
    pro:      { pages: 3,        analytics: true,  contacts: true  },
    business: { pages: Infinity, analytics: true,  contacts: true  },
  } as const;
  const tierLimits = TIER_LIMITS_CLIENT[licenceTier];

  // Goal 7: onboarding state driven by API
  const sharedLink = !!(user as any)?.onboardingSharedLink;
  const onboardingDismissed = !!(user as any)?.onboardingDismissed;
  const markShared = async () => {
    try {
      await apiRequest("POST", "/api/account/onboarding/shared", {});
      await refetch?.();
    } catch {}
  };
  const dismissOnboarding = async () => {
    try {
      await apiRequest("POST", "/api/account/onboarding/dismiss", {});
      await refetch?.();
    } catch {}
  };

  // Onboarding payload: read from sessionStorage after wizard redirect (?onboarding=1)
  const [onboardingPayload, setOnboardingPayload] = useState<{
    headline: string; bio: string; accentColor: string; background: string; pageFont: string;
    blocks: unknown[]; niche: string; voice: string; goals: string[];
  } | null>(null);
  const [onboardingBannerDismissed, setOnboardingBannerDismissed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("onboarding") === "1") {
      try {
        const raw = sessionStorage.getItem("onboarding_payload");
        if (raw) {
          const payload = JSON.parse(raw);
          setOnboardingPayload(payload);
          sessionStorage.removeItem("onboarding_payload");
        }
      } catch {}
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (pages.length && activePageId == null) setActivePageId(pages[0].id);
  }, [pages, activePageId]);

  // #19: when active page changes, invalidate page-specific stats so panels refresh
  useEffect(() => {
    if (activePageId != null) {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pages", activePageId, "analytics"] });
    }
  }, [activePageId]);

  // Escape key closes help drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { setHelpOpen(false); setNewPageWizardOpen(false); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Count new leads across all pages (for nav dot)
  const { data: leadsData } = useQuery({
    queryKey: ["/api/pages", pages.map((p: any) => p.id).join(","), "new-leads"],
    queryFn: async () => {
      if (!pages.length) return { newCount: 0 };
      // Check first page's leads as a proxy (most users have one page)
      const res = await apiRequest("GET", `/api/pages/${pages[0].id}/leads`);
      if (!res.ok) return { newCount: 0 };
      const leads = await res.json();
      return { newCount: leads.filter((l: any) => l.status === "new").length };
    },
    enabled: !!user && pages.length > 0,
    staleTime: 60_000,
    refetchInterval: 30_000,
  });

  const newLeadsCount = leadsData?.newCount ?? 0;

  // Auth guard
  if (isLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--color-primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Loading…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)", flexDirection: "column", gap: "1rem" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.75rem" }}>Sign in to your dashboard</h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>You need to be logged in to access your dashboard.</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <Link href="/login" className="btn btn-primary" data-testid="link-signin">Sign in</Link>
            <Link href="/signup" className="btn btn-secondary" data-testid="link-signup">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  const userInitials = user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const renderPanel = () => {
    switch (activeNav) {
      case "overview": return <OverviewPanel pages={pages} user={user} onNavigate={(tab) => setActiveNav(tab)} sharedLink={sharedLink} onShared={markShared} onDismiss={dismissOnboarding} dismissed={onboardingDismissed} activePageId={activePageId} setActivePageId={setActivePageId} />;
      case "editor": return <EditorPanel pages={pages} activePageId={activePageId} />;
      case "analytics": return tierLimits.analytics
        ? <AnalyticsPanel pages={pages} activePageId={activePageId} setActivePageId={setActivePageId} />
        : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 2rem" }}>
            <div style={{ textAlign: "center", maxWidth: 360 }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>Analytics — Pro feature</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "1.5rem" }}>Upgrade to Pro to unlock detailed page analytics, click rates, unique visitors, and conversion insights.</p>
              <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={() => { setActiveNav("billing"); }}>
                Upgrade to Pro →
              </button>
            </div>
          </div>
        );
      case "blocks": return licenceTier === "free"
        ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 2rem" }}>
            <div style={{ textAlign: "center", maxWidth: 360 }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>Block Analysis — Pro feature</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "1.5rem" }}>Upgrade to Pro to see per-block interaction stats, pie charts, and performance breakdowns.</p>
              <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={() => { setActiveNav("billing"); }}>
                Upgrade to Pro →
              </button>
            </div>
          </div>
        )
        : <BlockAnalysisPanel pages={pages} activePageId={activePageId} licenceTier={licenceTier} />;
      case "leads": return <LeadsPanel pages={pages} />;
      case "contacts": return tierLimits.contacts
        ? <ContactsPanel pages={pages} />
        : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 2rem" }}>
            <div style={{ textAlign: "center", maxWidth: 360 }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>Contacts — Pro feature</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "1.5rem" }}>Upgrade to Pro to manage your contacts CRM, see full lead history, and export contact data.</p>
              <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={() => { setActiveNav("billing"); }}>
                Upgrade to Pro →
              </button>
            </div>
          </div>
        );
      case "signature": return <EmailSignaturePanel user={user} pages={pages} />;
      case "settings": return <SettingsPanel user={user} pages={pages} onLogout={async () => { await logout(); navigate("/"); }} />;
      case "billing": return <BillingPanel />;
      default: return <OverviewPanel pages={pages} user={user} onNavigate={(tab) => setActiveNav(tab)} sharedLink={sharedLink} onShared={markShared} onDismiss={dismissOnboarding} dismissed={onboardingDismissed} activePageId={activePageId} setActivePageId={setActivePageId} />;
    }
  };

  return (
    <div className="dashboard-shell" style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--color-bg)" }}>
      {/* Sidebar */}
      <nav className={`dashboard-sidebar${sidebarCollapsed ? " collapsed" : ""}`} style={{
        width: sidebarCollapsed ? 64 : 220, flexShrink: 0,
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex", flexDirection: "column",
        height: "100dvh", overflow: "hidden",
        transition: "width 0.18s ease"
      }}>
        {/* Logo */}
        <div className="sidebar-logo" style={{ padding: sidebarCollapsed ? "1.25rem 0.5rem 1rem" : "1.25rem 1rem 1rem", borderBottom: "1px solid var(--color-divider)", display: "flex", justifyContent: "center" }}>
          <Link href="/" style={{ textDecoration: "none", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "0.5rem" }} title="Linkbay">
            {sidebarCollapsed ? (
              <svg width="32" height="26" viewBox="0 0 36 32" fill="none" aria-label="Linkbay">
                <rect x="0" y="4" width="10" height="24" rx="3" fill="currentColor" opacity="0.9"/>
                <rect x="13" y="9" width="10" height="19" rx="3" fill="currentColor" opacity="0.7"/>
                <rect x="26" y="14" width="10" height="14" rx="3" fill="var(--color-primary)"/>
              </svg>
            ) : (
              <svg width="100" height="26" viewBox="0 0 120 32" fill="none">
                <rect x="0" y="4" width="10" height="24" rx="3" fill="currentColor" opacity="0.9"/>
                <rect x="13" y="9" width="10" height="19" rx="3" fill="currentColor" opacity="0.7"/>
                <rect x="26" y="14" width="10" height="14" rx="3" fill="var(--color-primary)"/>
                <text x="42" y="22" fontFamily="Cabinet Grotesk, sans-serif" fontWeight="800" fontSize="17" fill="currentColor" letterSpacing="-0.5">linkbay</text>
              </svg>
            )}
          </Link>
        </div>

        {/* User */}
        <div className="sidebar-user" style={{ padding: sidebarCollapsed ? "0.875rem 0.5rem" : "0.875rem 1rem", borderBottom: "1px solid var(--color-divider)", display: "flex", alignItems: "center", gap: "0.625rem", justifyContent: sidebarCollapsed ? "center" : "flex-start" }} title={sidebarCollapsed ? `${user.name} — ${user.email}` : undefined}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{userInitials}</div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            </div>
          )}
        </div>

        {/* Page switcher */}
        {pages.length > 0 && !sidebarCollapsed && (
          <div className="sidebar-page-switcher" style={{ margin: "0.75rem 1rem 0" }}>
            <label style={{ display: "block", fontSize: 10, color: "var(--color-text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: "0.25rem" }}>Active page</label>
            <select
              className="input"
              value={activePageId ?? ""}
              onChange={e => setActivePageId(Number(e.target.value))}
              style={{ width: "100%", fontSize: "var(--text-xs)", height: 32, padding: "0 0.5rem" }}
              data-testid="select-active-page"
            >
              {pages.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title || p.username}</option>
              ))}
            </select>
          </div>
        )}

        {/* Nav */}
        <div className="sidebar-nav" style={{ flex: 1, padding: "0.75rem 0.5rem", overflow: "auto" }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`sidebar-nav-item ${activeNav === item.id ? "active" : ""}`}
              style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", position: "relative", justifyContent: sidebarCollapsed ? "center" : undefined }}
              data-testid={`button-nav-${item.id}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {icons[item.icon]}
              {!sidebarCollapsed && <span className="nav-label-desktop">{item.label}</span>}
              <span className="nav-label-mobile">{item.label}</span>
              {/* New leads notification dot */}
              {item.id === "leads" && newLeadsCount > 0 && (
                <span style={{
                  position: "absolute", right: sidebarCollapsed ? 4 : 8, top: sidebarCollapsed ? 4 : "50%", transform: sidebarCollapsed ? "none" : "translateY(-50%)",
                  width: 18, height: 18, borderRadius: "50%", background: "var(--color-error)",
                  color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                }} data-testid="badge-new-leads">
                  {newLeadsCount > 9 ? "9+" : newLeadsCount}
                </span>
              )}
            </button>
          ))}
          <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--color-divider)" }}>
            <button
              onClick={() => {
                if (pages.length >= tierLimits.pages) {
                  setUpgradeModalOpen(true);
                } else {
                  setNewPageWizardOpen(true);
                }
              }}
              className="sidebar-nav-item"
              style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", color: "var(--color-primary)", fontWeight: 600, justifyContent: sidebarCollapsed ? "center" : undefined }}
              data-testid="button-new-page-wizard"
              title={sidebarCollapsed ? "New page" : undefined}
            >
              {icons.plus} {!sidebarCollapsed && "New page"}
              {pages.length >= tierLimits.pages && !sidebarCollapsed && (
                <span style={{ marginLeft: "auto", fontSize: 9, padding: "0.1rem 0.35rem", background: "var(--color-primary-highlight)", color: "var(--color-primary)", borderRadius: 999, fontWeight: 700 }}>PRO</span>
              )}
            </button>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="sidebar-bottom" style={{ padding: "0.75rem 0.5rem", borderTop: "1px solid var(--color-divider)" }}>
          <button
            onClick={() => setHelpOpen(true)}
            className="sidebar-nav-item"
            style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", justifyContent: sidebarCollapsed ? "center" : undefined }}
            aria-label="Help"
            data-testid="button-help"
            title={sidebarCollapsed ? "Help & guides" : undefined}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", border: "1.5px solid currentColor", fontSize: 11, fontWeight: 800 }}>?</span>
            {!sidebarCollapsed && "Help & guides"}
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="sidebar-nav-item"
            style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", justifyContent: sidebarCollapsed ? "center" : undefined }}
            aria-label="Toggle theme"
            data-testid="button-toggle-theme"
            title={sidebarCollapsed ? (theme === "dark" ? "Light mode" : "Dark mode") : undefined}
          >
            {theme === "dark" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            {!sidebarCollapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
          </button>
          {/* Collapse / expand toggle (desktop only) */}
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            className="sidebar-nav-item sidebar-collapse-toggle"
            style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", justifyContent: sidebarCollapsed ? "center" : undefined }}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            data-testid="button-sidebar-collapse"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!sidebarCollapsed && "Collapse"}
          </button>
          <Link
            href="/account"
            className="sidebar-nav-item"
            style={{ width: "100%", textAlign: "left", justifyContent: sidebarCollapsed ? "center" : undefined, textDecoration: "none" }}
            data-testid="button-account-settings"
            title={sidebarCollapsed ? "Account settings" : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            {!sidebarCollapsed && "Account settings"}
          </Link>
          <button
            onClick={async () => { await logout(); navigate("/"); }}
            className="sidebar-nav-item"
            style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", justifyContent: sidebarCollapsed ? "center" : undefined }}
            data-testid="button-logout"
            title={sidebarCollapsed ? "Sign out" : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {!sidebarCollapsed && "Sign out"}
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="dashboard-main" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Mobile context bar — hidden on desktop via CSS */}
        <div className="mobile-context-bar" style={{ display: "none" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {navItems.find(n => n.id === activeNav)?.label ?? "Dashboard"}
            </div>
            {pages.find((p: any) => p.id === activePageId) && (
              <div style={{ fontSize: 10, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {pages.find((p: any) => p.id === activePageId)?.title || pages.find((p: any) => p.id === activePageId)?.username}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            {pages.length > 1 && (
              <select
                className="input"
                value={activePageId ?? ""}
                onChange={e => setActivePageId(Number(e.target.value))}
                style={{ fontSize: 11, height: 28, padding: "0 0.375rem", maxWidth: 110 }}
              >
                {pages.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.title || p.username}</option>
                ))}
              </select>
            )}
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{userInitials}</div>
          </div>
        </div>
        {/* Onboarding payload banner — shown once after wizard */}
        {onboardingPayload && !onboardingBannerDismissed && pages.length === 0 && (
          <div style={{
            margin: "1rem 1rem 0",
            padding: "1.25rem 1.5rem",
            background: "linear-gradient(135deg, rgba(224,107,26,0.1), rgba(224,107,26,0.04))",
            border: "1.5px solid rgba(224,107,26,0.3)",
            borderRadius: "var(--radius-lg)",
            display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap",
          }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>✨</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.25rem" }}>
                Your AI page is ready to launch
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "0.875rem", lineHeight: 1.5 }}>
                Headline: <em>"{onboardingPayload.headline}"</em>. Click below to create your page with this content pre-filled.
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    // Re-save to sessionStorage so the NewPageWizardModal can pick it up
                    try { sessionStorage.setItem("onboarding_prefill", JSON.stringify(onboardingPayload)); } catch {}
                    setNewPageWizardOpen(true);
                  }}
                >
                  ✨ Create my page
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setOnboardingBannerDismissed(true)}
                >
                  Dismiss
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignSelf: "flex-start" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: onboardingPayload.accentColor, border: "2px solid var(--color-border)", flexShrink: 0 }} title={onboardingPayload.accentColor} />
              <span style={{ fontSize: 10, color: "var(--color-text-faint)" }}>{onboardingPayload.accentColor}</span>
            </div>
          </div>
        )}
        {renderPanel()}
      </div>

      <NewPageWizardModal
        open={newPageWizardOpen}
        onClose={() => setNewPageWizardOpen(false)}
        onCreated={(id) => setActivePageId(id)}
      />

      {upgradeModalOpen && (
        <UpgradeModal
          onClose={() => setUpgradeModalOpen(false)}
          onBilling={() => { setUpgradeModalOpen(false); setActiveNav("billing"); }}
        />
      )}

      {/* Help drawer */}
      {helpOpen && (
        <div
          onClick={() => setHelpOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(420px, 100%)",
              height: "100%",
              background: "var(--color-surface)",
              borderLeft: "1px solid var(--color-border)",
              padding: "1.5rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>Help &amp; guides</h2>
              <button
                onClick={() => setHelpOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "var(--color-text-muted)", lineHeight: 1 }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <a
                href="/blog/how-to-use-dashboard"
                target="_blank"
                rel="noreferrer"
                style={{ display: "block", padding: "1rem", background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", textDecoration: "none", color: "var(--color-text)" }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>📖 Full dashboard guide</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Step-by-step walkthrough of every panel.</div>
              </a>
              <a
                href="/blog"
                target="_blank"
                rel="noreferrer"
                style={{ display: "block", padding: "1rem", background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", textDecoration: "none", color: "var(--color-text)" }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>📝 All articles</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Tutorials, tips, and product news.</div>
              </a>
            </div>
            <div style={{ marginTop: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--color-divider)" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.75rem" }}>Quick tips</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                <li>• Use <b>Editor</b> to add blocks like polls, lead forms, and videos.</li>
                <li>• Track every view and click in <b>Analytics</b>.</li>
                <li>• <b>Leads</b> captured via lead forms appear with status chips.</li>
                <li>• Convert a lead into a contact from the lead detail.</li>
                <li>• Choose a <b>background</b> in Settings to style your public page.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
