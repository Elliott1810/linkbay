import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, resolveMediaUrl } from "@/lib/queryClient";
import { useTheme, useAuth } from "@/App";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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
  billing: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
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
};

const LINK_ICONS = ["🔗", "📅", "📧", "📄", "💼", "🎥", "📱", "⬇️", "⭐", "💬", "🌐", "📊"];

// --- Nav items (leads dot injected dynamically) ---
const navItems = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "blocks", label: "Blocks", icon: "blocks" },
  { id: "editor", label: "Page Editor", icon: "edit" },
  { id: "analytics", label: "Analytics", icon: "chart" },
  { id: "leads", label: "Leads", icon: "users" },
  { id: "contacts", label: "Contacts", icon: "users" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "billing", label: "Billing", icon: "billing" },
];

// --- Empty state when user has no pages ---
function NoPageState() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1.25rem" }}>🚀</div>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.75rem" }}>
          Build your first page
        </h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
          You don't have a page yet. Use the builder to create your branded link hub in under 3 minutes.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <Link href="/builder" className="btn btn-primary" style={{ justifyContent: "center" }}>
            {icons.plus} Create my page
          </Link>
        </div>
        <div style={{ marginTop: "2.5rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
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
function CopyUrlButton({ url, label }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(url).then(() => {
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

// --- QR Code card ---
function QRCodeCard({ url, username }: { url: string; username?: string }) {
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

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.625rem", background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}
        data-testid="button-toggle-qr"
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><rect x="10" y="10" width="4" height="4"/><path d="M16 16h5v5h-5z" opacity="0.4"/></svg>
          QR code
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points={show ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>
      </button>
      {show && (
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
  const periodLabel = days === 0 ? "All time" : `${days}d window`;
  const statsData = [
    { label: "Total Views", value: totalViews.toLocaleString(), delta: periodLabel, up: true },
    { label: "Total Clicks", value: totalClicks.toLocaleString(), delta: periodLabel, up: true },
    { label: "Click Rate", value: `${clickRate}%`, delta: days === 0 ? "All time avg" : `${days}d average`, up: true },
    { label: "Total Leads", value: totalLeads.toLocaleString(), delta: periodLabel, up: true },
  ];

  const topLinks = analytics?.topLinks ?? [];

  // Chart data from analytics (merged for graph series dropdown)
  const dailyViews = analytics?.dailyViews ?? [];
  const dailyClicks = analytics?.dailyClicks ?? [];
  const dailyLeads = analytics?.dailyLeads ?? [];
  // G2a/G2b: use the FULL range returned by the API (no artificial slice)
  const chartData = dailyViews.map((d: { date: string; count: number }, i: number) => ({
    date: new Date(d.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    Views: d.count,
    Clicks: (dailyClicks[i] as any)?.count ?? 0,
    Leads: (dailyLeads[i] as any)?.count ?? 0,
  }));

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
          <CopyUrlButton url={pageUrl} label="Copy link" />
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
        <div style={{ display: "flex", gap: "0.25rem", marginLeft: "auto" }}>
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
        <div style={{
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
          {streak > 1 && (
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
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ marginTop: "0.5rem" }}>{s.value}</div>
              <div className={`stat-delta ${s.up ? "up" : "down"}`}>{s.delta}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {!analyticsLoading && chartData.length > 0 && (
        <div className="card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>
              {graphSeries === "views" ? "Views" : graphSeries === "clicks" ? "Clicks" : "Leads"} — {days === 0 ? "all time" : `last ${days} days`}
            </div>
            <select
              value={graphSeries}
              onChange={e => setGraphSeries(e.target.value as any)}
              className="input"
              style={{ fontSize: 11, width: "auto", padding: "0.25rem 0.5rem", height: "auto" }}
              data-testid="select-overview-graph-series"
            >
              <option value="views">Views</option>
              <option value="clicks">Clicks</option>
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
            const max = Math.max(...interactions.map((i: any) => i.total ?? i.clickCount ?? 0), 1);
            return interactions.map((item: any) => {
              const isLive = !item.blockId || liveBlockIds.has(item.blockId);
              const total = item.total ?? item.clickCount ?? 0;
              const views = item.views ?? 0;
              const interCount = item.interactions ?? total;
              const viewPct = max > 0 ? Math.round((views / max) * 100) : 0;
              const interPct = max > 0 ? Math.round((interCount / max) * 100) : 0;
              return (
                <div key={item.id || item.blockId || item.label} style={{ marginBottom: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", marginBottom: "0.25rem", gap: "0.5rem" }}>
                    <span style={{ color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.label || item.blockType || "Link"}</span>
                    {!isLive && <span style={{ fontSize: 9, background: "var(--color-surface-offset)", color: "var(--color-text-faint)", borderRadius: 3, padding: "1px 4px", flexShrink: 0 }}>past</span>}
                    <span style={{ fontWeight: 700, flexShrink: 0 }}>{total} ×</span>
                  </div>
                  {/* G4b/4c: dual progress bars — views (amber) + interactions (orange) */}
                  {item.isLink ? (
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${interPct}%`, background: isLive ? "var(--color-primary)" : "var(--color-text-faint)" }} /></div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--color-text-faint)", marginBottom: 2 }}>
                        <span>Views: {views}</span><span>Interactions: {interCount}</span>
                      </div>
                      <div className="progress-bar" style={{ marginBottom: 2 }}>
                        <div className="progress-fill" style={{ width: `${viewPct}%`, background: "#f59e0b" }} />
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${interPct}%`, background: isLive ? "var(--color-primary)" : "var(--color-text-faint)" }} />
                      </div>
                    </>
                  )}
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
            {/* QR Code */}
            <QRCodeCard url={pageUrl} username={page?.username} />

            {/* G5: URL display — copy WITHOUT https:// */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.625rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "0.625rem" }}>
              <span style={{ flex: 1, fontSize: 11, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                linkbay.ai/{page?.username}
              </span>
              <button
                onClick={() => {
                  // G5: copy short URL (no https://)
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
            </div>
            {/* G5a: Social share buttons — added Facebook */}
            <div style={{ display: "flex", gap: "0.375rem" }}>
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

// G7: 10 block style options — stored in background JSON as `blockStyle` key
const BLOCK_STYLE_OPTIONS = [
  { value: "default",    label: "Default",      desc: "Clean, minimal cards" },
  { value: "rounded",    label: "Rounded",      desc: "Soft radius, no border" },
  { value: "sharp",      label: "Sharp",        desc: "Flat, zero radius" },
  { value: "bordered",   label: "Bordered",     desc: "1px accent border" },
  { value: "outlined",   label: "Outlined",     desc: "2px strong outline" },
  { value: "elevated",   label: "Elevated",     desc: "Layered shadow depth" },
  { value: "ghost",      label: "Ghost",        desc: "Transparent with border" },
  { value: "pill",       label: "Pill",         desc: "Fully rounded buttons" },
  { value: "underline",  label: "Underline",    desc: "Accent underline only" },
  { value: "gradient",   label: "Gradient",     desc: "Accent-tinted fill" },
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

  // G7: blockStyle stored inside background JSON
  const bgParsed = (() => { try { return JSON.parse(background); } catch { return {}; } })();
  const blockStyle: string = bgParsed.blockStyle ?? "default";
  const setBlockStyle = (s: string) => {
    const merged = { ...bgParsed, blockStyle: s };
    if (!merged.pattern && !merged.color) {
      setBackground(JSON.stringify({ blockStyle: s }));
    } else {
      setBackground(JSON.stringify(merged));
    }
  };

  useEffect(() => {
    if (page) {
      setTitle(page.title ?? "");
      setBio(page.bio ?? "");
      setLocation(page.location ?? "");
      setPhone(page.phone ?? "");
      setContactEmail(page.contactEmail ?? "");
      setAccentColor(page.accentColor ?? "#e06b1a");
      setBackground(page.background ?? "none");
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
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
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {["#e06b1a","#4f46e5","#0891b2","#059669","#e11d48","#7c3aed","#334155"].map(c => (
            <button key={c} type="button" onClick={() => setAccentColor(c)} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: `2.5px solid ${accentColor === c ? "var(--color-text)" : "transparent"}`, cursor: "pointer" }} />
          ))}
          <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: 24, height: 24, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0 }} />
        </div>
      </div>
      {/* ─── Background picker — 20 CSS gradient swatches ─── */}
      <div>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>Background</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: "0.375rem" }}>
          {BACKGROUND_OPTIONS.map(opt => {
            const isActive = background === opt.value || (!background && opt.value === "none");
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBackground(opt.value)}
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
          {([{ v: "circle", l: "Circle" }, { v: "rounded", l: "Rounded box" }] as const).map(opt => (
            <button key={opt.v} type="button" onClick={() => setAvatarShape(opt.v)}
              style={{ flex: 1, padding: "0.5rem", fontSize: 12, fontWeight: 600, borderRadius: "var(--radius-sm)", border: `2px solid ${avatarShape === opt.v ? "var(--color-primary)" : "var(--color-border)"}`, background: avatarShape === opt.v ? "var(--color-primary-highlight)" : "var(--color-surface)", color: avatarShape === opt.v ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer" }}
              data-testid={`button-avatar-shape-${opt.v}`}
            >
              <span style={{ display: "inline-block", width: 18, height: 18, background: "var(--color-text-faint)", borderRadius: opt.v === "circle" ? "50%" : 4, verticalAlign: "middle", marginRight: 6 }} />{opt.l}
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
        className="btn btn-primary btn-sm"
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
  type: "text" | "poll" | "lead-form" | "image" | "video" | "social-links" | "countdown" | "divider" | "button" | "testimonial" | "faq";
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
}

function BlockEditor({ pageId, blocks, onSave, saving }: { pageId: number; blocks: PageBlock[]; onSave: (blocks: PageBlock[]) => void; saving: boolean }) {
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

  const deleteBlock = (id: string) => {
    const arr = localBlocks.filter(b => b.id !== id);
    setLocalBlocks(arr);
    onSave(arr);
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
          <div key={block.id} style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
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
                   block.type === "faq" ? "❓" : "📦"}
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
                  </div>
                </div>
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
  useEffect(() => { if (activePageId) setSelectedPageId(activePageId); }, [activePageId]);
  const [saveMsg, setSaveMsg] = useState("");
  const [newLink, setNewLink] = useState({ label: "", url: "", icon: "🔗", style: "default" as string });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  // Mobile editor tab state (mobile-only). On desktop both panels are shown together.
  const [editorTab, setEditorTab] = useState<"blocks" | "add">("blocks");
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

  const { data: links, isLoading: linksLoading } = useQuery({
    queryKey: ["/api/pages", selectedPageId, "links"],
    queryFn: async () => {
      if (!selectedPageId) return [];
      const res = await apiRequest("GET", `/api/pages/${selectedPageId}/links`);
      return res.json();
    },
    enabled: !!selectedPageId,
  });

  const addLinkMutation = useMutation({
    mutationFn: async () => {
      if (!newLink.label || !newLink.url) throw new Error("Label and URL are required.");
      const res = await apiRequest("POST", `/api/pages/${selectedPageId}/links`, {
        ...newLink,
        position: (links?.length ?? 0),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to add link");
      }
      return res.json();
    },
    onSuccess: () => {
      setNewLink({ label: "", url: "", icon: "🔗", style: "default" });
      queryClient.invalidateQueries({ queryKey: ["/api/pages", selectedPageId, "links"] });
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/links/${id}`, data);
      if (!res.ok) throw new Error("Failed to update link");
      return res.json();
    },
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/pages", selectedPageId, "links"] });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/links/${id}`);
      if (!res.ok) throw new Error("Failed to delete link");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", selectedPageId, "links"] });
    },
  });

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
                if (data.background) updateData.background = data.background;
                if (data.accentColor) updateData.accentColor = data.accentColor;
                if (data.title) updateData.title = data.title;
                if (data.bio) updateData.bio = data.bio;
                if (data.blocks) updateData.blocks = JSON.stringify(data.blocks);
                await savePageMutation.mutateAsync(updateData);
                setAiWizardOpen(false);
              } catch {}
            }}
          />
        )}
      </div>

      {/* Right panel — link editor + blocks */}
      <div className="editor-blocks-panel" style={{ flex: 1, padding: "1.25rem", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>Links</h2>
          <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{links?.length ?? 0} links</span>
        </div>

        {linksLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: "var(--radius-md)" }} />)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
            {(links || []).sort((a: any, b: any) => a.position - b.position).map((link: any) => (
              <div key={link.id} style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }} data-testid={`link-row-${link.id}`}>
                {editingId === link.id ? (
                  <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input className="input" placeholder="Label" value={editValues.label ?? link.label} onChange={e => setEditValues((v: any) => ({ ...v, label: e.target.value }))} style={{ flex: 1, fontSize: 13 }} />
                      <input className="input" placeholder="URL" value={editValues.url ?? link.url} onChange={e => setEditValues((v: any) => ({ ...v, url: e.target.value }))} style={{ flex: 2, fontSize: 13 }} />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", flexShrink: 0 }}>Icon:</span>
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                        {LINK_ICONS.map(ic => (
                          <button key={ic} type="button" onClick={() => setEditValues((v: any) => ({ ...v, icon: ic }))} style={{ fontSize: 15, padding: "0.2rem", borderRadius: 4, background: (editValues.icon ?? link.icon) === ic ? "var(--color-primary-highlight)" : "none", border: "none", cursor: "pointer" }}>{ic}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      {["default", "featured", "outline"].map(style => (
                        <button key={style} type="button" onClick={() => setEditValues((v: any) => ({ ...v, style }))} style={{ flex: 1, padding: "0.3rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${(editValues.style ?? link.style) === style ? "var(--color-primary)" : "var(--color-border)"}`, background: (editValues.style ?? link.style) === style ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 10, fontWeight: 600, color: (editValues.style ?? link.style) === style ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer" }}>
                          {style}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => updateLinkMutation.mutate({ id: link.id, data: { ...editValues } })} className="btn btn-primary btn-sm" disabled={updateLinkMutation.isPending} style={{ flex: 1, justifyContent: "center" }}>
                        {updateLinkMutation.isPending ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => { setEditingId(null); setEditValues({}); }} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }}>
                    <span style={{ fontSize: 18 }}>{link.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.label}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.url}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: "0.15rem 0.5rem", borderRadius: 999, background: link.style === "featured" ? "var(--color-primary-highlight)" : "var(--color-surface-offset)", color: link.style === "featured" ? "var(--color-primary)" : "var(--color-text-faint)", fontWeight: 600, flexShrink: 0 }}>
                      {link.style}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--color-text-faint)", flexShrink: 0 }}>{link.clickCount} clicks</span>
                    <button onClick={() => { setEditingId(link.id); setEditValues({ label: link.label, url: link.url, icon: link.icon, style: link.style }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 11, fontWeight: 600, padding: "0.25rem 0.375rem" }}>Edit</button>
                    <button onClick={() => deleteLinkMutation.mutate(link.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-error)", padding: "0.25rem" }} aria-label="Delete link">{icons.trash}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new link */}
        <div style={{ background: "var(--color-surface-2)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>+ Add a link</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input className="input" placeholder="Label (e.g. Book a call)" value={newLink.label} onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))} style={{ flex: 1, fontSize: 13 }} data-testid="input-new-link-label" />
              <input className="input" placeholder="URL (https://...)" value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} style={{ flex: 2, fontSize: 13 }} data-testid="input-new-link-url" />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", flexShrink: 0 }}>Icon:</span>
              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                {LINK_ICONS.slice(0, 8).map(ic => (
                  <button key={ic} type="button" onClick={() => setNewLink(l => ({ ...l, icon: ic }))} style={{ fontSize: 15, padding: "0.2rem", borderRadius: 4, background: newLink.icon === ic ? "var(--color-primary-highlight)" : "none", border: "none", cursor: "pointer" }}>{ic}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.375rem", marginLeft: "auto" }}>
                {["default", "featured"].map(style => (
                  <button key={style} type="button" onClick={() => setNewLink(l => ({ ...l, style }))} style={{ padding: "0.3rem 0.625rem", borderRadius: "var(--radius-sm)", border: `1.5px solid ${newLink.style === style ? "var(--color-primary)" : "var(--color-border)"}`, background: newLink.style === style ? "var(--color-primary-highlight)" : "var(--color-surface)", fontSize: 10, fontWeight: 600, color: newLink.style === style ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer" }}>
                    {style}
                  </button>
                ))}
              </div>
            </div>
            {editorTier === "free" && (links?.length ?? 0) + pageBlocks.length >= FREE_BLOCK_LIMIT ? (
              <div style={{ padding: "0.75rem", background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)", borderRadius: "var(--radius-md)", textAlign: "center", fontSize: "var(--text-sm)" }}>
                <strong style={{ color: "var(--color-primary)" }}>Free limit reached ({FREE_BLOCK_LIMIT} links/blocks)</strong>
                <p style={{ margin: "0.25rem 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>Upgrade to Pro or Business to add unlimited links and blocks.</p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => addLinkMutation.mutate()}
                  disabled={!newLink.label || !newLink.url || addLinkMutation.isPending}
                  className="btn btn-primary"
                  style={{ justifyContent: "center" }}
                  data-testid="button-add-link"
                >
                  {addLinkMutation.isPending ? "Adding…" : "Add link"}
                </button>
                {addLinkMutation.isError && (
                  <p style={{ fontSize: 12, color: "var(--color-error)" }}>{(addLinkMutation.error as Error).message}</p>
                )}
              </>
            )}
          </div>
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
          {editorTier === "free" && (links?.length ?? 0) + pageBlocks.length >= FREE_BLOCK_LIMIT ? (
            <div style={{ padding: "1.25rem", background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)", marginBottom: "0.375rem" }}>Free limit reached</div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: 0 }}>You\'ve used all {FREE_BLOCK_LIMIT} free links/blocks. Upgrade to Pro or Business for unlimited blocks.</p>
            </div>
          ) : (
            <AddBlockForm
              onAdd={(block) => saveBlocksMutation.mutate([...(pageBlocks || []), block])}
              onAddAll={(newBlocks) => saveBlocksMutation.mutate([...(pageBlocks || []), ...newBlocks])}
              saving={saveBlocksMutation.isPending}
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
      case "Freelancer / Consultant": add("lead-form", 2); add("testimonial", 2); add("button", 2); add("text", 2); break;
      case "Job Seeker": add("text", 2); add("button", 2); add("testimonial", 2); add("social-links", 1); break;
      case "Grow my following": add("social-links", 3); add("poll", 2); add("countdown", 1); break;
      case "Monetise my content": add("button", 3); add("lead-form", 2); add("testimonial", 1); break;
      case "Build a community": add("poll", 3); add("lead-form", 1); add("social-links", 2); break;
      case "Contact / Enquire": add("lead-form", 3); add("button", 1); break;
      case "Buy something": add("button", 3); add("countdown", 1); add("testimonial", 1); break;
      case "Learn about us": add("text", 2); add("faq", 2); add("testimonial", 1); break;
      case "Get more clients": add("lead-form", 3); add("testimonial", 2); add("button", 1); break;
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
  const src = `/${encodeURIComponent(username)}?preview=1&t=${previewKey}-${manualBump}`;

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
function AIBlockRecommender({ onAddAll, onSkip }: { onAddAll: (blocks: PageBlock[]) => void; onSkip: () => void }) {
  const { data: licData } = useLicence();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [suggestions, setSuggestions] = useState<PageBlock[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const tier = (licData as any)?.tier || "free";
  const roleLabel = tier === "business" ? "Business" : tier === "pro" ? "Pro user" : "Creator";

  const fetchSuggestions = () => {
    setStatus("loading");
    setErrorMsg("");
    apiRequest("POST", "/api/ai/generate-page", {
      answers: {
        name: "My Page",
        tagline: `${roleLabel} looking to grow engagement`,
        goal: "Add engaging content blocks to my page",
        industry: roleLabel,
        style: "clean, modern, professional",
      },
    })
      .then(r => r.json())
      .then((data: any) => {
        if (data.error) { setErrorMsg(data.error); setStatus("error"); return; }
        // Map AI blocks to PageBlock shape
        const genId = () => "blk-" + Math.random().toString(36).slice(2, 8);
        const mapped: PageBlock[] = (data.blocks || []).flatMap((b: any): PageBlock[] => {
          switch (b.type) {
            case "text": return [{ id: genId(), type: "text", content: b.content || "" }];
            case "poll": return [{ id: genId(), type: "poll", question: b.question || "Quick question", options: b.options || ["Option A", "Option B"] }];
            case "lead_form": return [{ id: genId(), type: "lead-form", title: b.title || "Get in touch", description: b.description || "", buttonText: b.buttonText || "Send" } as any];
            case "socials": return [{ id: genId(), type: "social-links", socials: (b.links || []).map((l: any) => ({ platform: l.platform, url: l.url })) } as any];
            case "countdown": return [{ id: genId(), type: "countdown", title: b.title || "Coming soon", targetDate: b.targetDate || "2026-12-31" } as any];
            default: return [];
          }
        }).slice(0, 6);
        setSuggestions(mapped);
        setSelected(new Set(mapped.map((_: PageBlock, i: number) => i)));
        setStatus("done");
      })
      .catch(() => { setErrorMsg("Could not reach AI."); setStatus("error"); });
  };

  useEffect(() => { if (status === "idle" || retryCount > 0) fetchSuggestions(); }, [retryCount]);

  const toggle = (i: number) => setSelected(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const blockIcon = (type: string) =>
    type === "text" ? "📝" : type === "poll" ? "📊" : type === "lead-form" ? "📬" : type === "social-links" ? "🔗" : type === "countdown" ? "⏳" : "🧩";

  if (status === "loading") return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", background: "var(--color-primary-highlight)", borderRadius: "var(--radius-md)", marginBottom: "1rem" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid var(--color-primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 600 }}>GPT-4o is recommending blocks for you…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (status === "error") return (
    <div style={{ padding: "0.875rem 1rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", flex: 1 }}>🤖 {errorMsg || "AI unavailable"} — pick a block below or retry.</span>
      <button className="btn btn-secondary btn-sm" onClick={() => setRetryCount(c => c + 1)}>Retry AI</button>
      <button className="btn btn-secondary btn-sm" onClick={onSkip}>Skip</button>
    </div>
  );

  if (status === "done") return (
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

function AddBlockForm({ onAdd, onAddAll, saving }: { onAdd: (b: PageBlock) => void; onAddAll?: (blocks: PageBlock[]) => void; saving: boolean }) {
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
    }
    reset();
  };

  return (
    <div style={{ background: "var(--color-surface-2)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginTop: "1.5rem" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.875rem" }}>+ Add a content block</div>

      {!wizardSkipped && (
        <AIBlockRecommender
          onAddAll={(blocks) => {
            if (onAddAll) onAddAll(blocks);
            else blocks.forEach(b => onAdd(b));
            setWizardSkipped(true);
          }}
          onSkip={() => setWizardSkipped(true)}
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
                  placeholder="Comma-separated options"
                  value={(f.options || []).join(", ")}
                  onChange={e => { const arr = [...customFields]; arr[idx] = { ...arr[idx], options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }; setCustomFields(arr); }}
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
    </div>
  );
}

// --- Analytics Panel with Recharts ---
function AnalyticsPanel({ pages, activePageId, setActivePageId }: { pages: any[]; activePageId: number | null; setActivePageId: (id: number) => void }) {
  const [scope, setScope] = useState<"page" | "all">("page");
  const [selectedPageId, setSelectedPageId] = useState<number | null>(pages[0]?.id ?? null);
  // G10: 7d/14d/30d/60d/All (0=All)
  const [days, setDays] = useState<number>(7);
  const [graphSeries, setGraphSeries] = useState<"views" | "clicks" | "leads">("views");

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
  const chartData = dailyViews.map((d: { date: string; count: number }, i: number) => ({
    date: new Date(d.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    Views: d.count,
    Clicks: (dailyClicks[i] as any)?.count ?? 0,
    Leads: (dailyLeads[i] as any)?.count ?? 0,
  }));

  return (
    <div style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.25rem" }}>Analytics</h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{days === 0 ? "All-time" : `${days}-day`} performance for linkbay.ai/{page?.username}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
          {pages.length > 1 && scope === "page" && (
            <select value={selectedPageId ?? ""} onChange={e => { setSelectedPageId(Number(e.target.value)); setActivePageId(Number(e.target.value)); }} className="input" style={{ fontSize: "var(--text-sm)", width: "auto" }}>
              {pages.map((p: any) => <option key={p.id} value={p.id}>{p.username}</option>)}
            </select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: "var(--radius-lg)" }} />)}
        </div>
      ) : analytics ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Stats row */}
          <div className="stats-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            {[
              { label: "Total views (all time)", value: analytics.totalViews?.toLocaleString() ?? "0" },
              { label: days === 0 ? "Views (ALL TIME)" : `Views (${days}d)`, value: analytics.periodViews?.toLocaleString() ?? "0" },
              { label: days === 0 ? "Clicks (ALL TIME)" : `Clicks (${days}d)`, value: analytics.periodClicks?.toLocaleString() ?? "0" },
              { label: "Click rate", value: analytics.clickRate ? `${analytics.clickRate}%` : "0%" },
              { label: "Unique visitors", value: (analytics.uniqueVisitors ?? 0).toLocaleString() },
              { label: "Repeat visitors", value: (analytics.repeatVisitors ?? 0).toLocaleString() },
              { label: "Best day", value: analytics.bestDay ? `${analytics.bestDay.count} views (${analytics.bestDay.label})` : "No data" },
              { label: days === 0 ? "Avg views (ALL TIME)" : `Avg views (${days}d)`, value: analytics.avgSessionViews != null ? analytics.avgSessionViews.toFixed(1) : "—" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ marginTop: "0.5rem" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Views/Clicks/Leads chart with dropdown */}
          {chartData.length > 0 && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>
                  {graphSeries === "views" ? "Page views" : graphSeries === "clicks" ? "Clicks" : "Leads"} — last {days} days
                </div>
                <select
                  value={graphSeries}
                  onChange={e => setGraphSeries(e.target.value as any)}
                  className="input"
                  style={{ fontSize: 11, width: "auto", padding: "0.25rem 0.5rem", height: "auto" }}
                  data-testid="select-analytics-graph-series"
                >
                  <option value="views">Views</option>
                  <option value="clicks">Clicks</option>
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

          <div className="analytics-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {/* Top links */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.75rem" }}>Top Interactions</div>
              {(() => {
                const interactions = analytics.topInteractions ?? analytics.topLinks ?? [];
                if (interactions.length === 0) return <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>No interactions yet.</div>;
                const max = interactions[0]?.total ?? interactions[0]?.clickCount ?? 1;
                return interactions.map((item: any) => (
                  <div key={item.id || item.blockId || item.label} style={{ marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", marginBottom: 2, gap: "0.5rem" }}>
                      <span style={{ color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.label || item.blockType || "Interaction"}</span>
                      <span style={{ fontWeight: 700 }}>{item.total ?? item.clickCount}</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${max > 0 ? Math.round(((item.total ?? item.clickCount) / max) * 100) : 0}%` }} /></div>
                  </div>
                ));
              })()}
            </div>

            {/* Device split + export */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>Device breakdown</div>
                {Object.entries(analytics.devices || {}).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1rem", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>No data yet.</div>
                ) : (
                  Object.entries(analytics.devices || {}).map(([device, count]: [string, any]) => (
                    <div key={device} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--color-divider)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                        {device === "mobile" ? "📱" : "💻"} {device}
                      </span>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>{count} events</span>
                    </div>
                  ))
                )}
              </div>
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>Top countries</div>
                {(analytics.topCountries || []).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1rem", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>No location data yet.</div>
                ) : (
                  (analytics.topCountries || []).map((c: any) => {
                    const code = (c.country || "").trim().toUpperCase();
                    // Convert ISO-3166-1 alpha-2 code to flag emoji using regional indicator symbols
                    const flag = code.length === 2
                      ? String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1))
                      : "🌍";
                    return (
                      <div key={code || "unknown"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--color-divider)" }}>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {/* D1: emoji font-family ensures flags render on desktop (Windows/Linux) */}
                      <span style={{ fontSize: 18, fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif' }}>{flag}</span>
                          <span>{code || "Unknown"}</span>
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
function BlockAnalysisPanel({ pages, activePageId }: { pages: any[]; activePageId: number | null }) {
  const [selectedPageId, setSelectedPageId] = useState<number | null>(activePageId ?? pages[0]?.id ?? null);
  const [days, setDays] = useState(30);
  const [hiddenOpen, setHiddenOpen] = useState(false);

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
  const NON_INTERACTION_TYPES = new Set(["text", "image", "divider", "testimonial"]);

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
    };
    const typeLabel = BLOCK_TYPE_LABELS[t] || t.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    const title = block.title || block.label || block.question || "";
    return title ? `${typeLabel} — ${title}` : typeLabel;
  };

  const blockTypeIcon: Record<string, string> = {
    button: "🔗", text: "📝", image: "🖼️", video: "🎥", faq: "❓", poll: "📊",
    countdown: "⏱️", "lead-form": "📋", "social-links": "🌐", testimonial: "💬", divider: "➖", link: "🔗",
  };

  // G6d: expand social-links blocks into per-platform rows
  const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
    facebook: "Facebook", twitter: "Twitter / X", instagram: "Instagram", linkedin: "LinkedIn",
    youtube: "YouTube", tiktok: "TikTok", github: "GitHub", pinterest: "Pinterest",
    snapchat: "Snapchat", spotify: "Spotify", whatsapp: "WhatsApp", telegram: "Telegram",
  };

  const periodEvents: any[] = analytics?.periodEvents ?? [];
  const allTimeBlocks: any[] = analytics?.allTimeBlocks ?? [];

  // Aggregate per-block stats
  const blockStats: Map<string, { count: number; eventTypes: Record<string, number> }> = new Map();
  for (const e of periodEvents) {
    const bid = e.blockId || e.block_id;
    if (!bid) continue;
    if (!blockStats.has(bid)) blockStats.set(bid, { count: 0, eventTypes: {} });
    const s = blockStats.get(bid)!;
    s.count++;
    const et = e.eventType || e.type || "interaction";
    s.eventTypes[et] = (s.eventTypes[et] || 0) + 1;
  }

  // G6d: also aggregate per platform for social-links blocks
  const socialPlatformStats: Map<string, Map<string, number>> = new Map();
  for (const e of periodEvents) {
    const bid = e.blockId || e.block_id;
    const platform = e.platform;
    if (!bid || !platform) continue;
    if (!socialPlatformStats.has(bid)) socialPlatformStats.set(bid, new Map());
    const pm = socialPlatformStats.get(bid)!;
    pm.set(platform, (pm.get(platform) || 0) + 1);
  }

  const liveBlocks = pageBlocks.filter((b: any) => !archivedIds.includes(b.id) && !hiddenIds.includes(b.id));
  const archivedBlocks = pageBlocks.filter((b: any) => archivedIds.includes(b.id));
  const hiddenBlocks = pageBlocks.filter((b: any) => hiddenIds.includes(b.id));

  // G6c: for display, filter out non-interaction types from live list
  const displayLiveBlocks = liveBlocks.filter((b: any) => !NON_INTERACTION_TYPES.has(b.type));

  const totalInteractions = periodEvents.length;

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
    <div style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>Block Analysis</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "0.25rem" }}>Interaction tracking per content block</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {pages.length > 1 && (
            <select value={selectedPageId ?? ""} onChange={e => setSelectedPageId(Number(e.target.value))} className="input" style={{ fontSize: "var(--text-sm)", width: "auto" }}>
              {pages.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
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
          { label: "Total interactions", value: totalInteractions },
          { label: "Live blocks", value: liveBlocks.length },
          { label: "Archived", value: archivedBlocks.length },
          { label: "Hidden", value: hiddenBlocks.length },
        ].map(card => (
          <div key={card.label} className="card" style={{ padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--color-primary)", fontFamily: "Cabinet Grotesk, sans-serif" }}>{card.value}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{card.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: "var(--radius-md)" }} />)}
        </div>
      ) : (
        <>
          {/* Live blocks — G6c: filter non-interaction types */}
          <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.5rem" }}>
              Live blocks ({displayLiveBlocks.length})
            </h2>
            {liveBlocks.length > displayLiveBlocks.length && (
              <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "1rem" }}>Text, Image, Divider, and Testimonial blocks are excluded from interaction tracking.</p>
            )}
            {displayLiveBlocks.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No trackable blocks on this page.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {displayLiveBlocks.map((block: any) => {
                  const stats = blockStats.get(block.id) ?? { count: 0, eventTypes: {} };
                  const pct = totalInteractions > 0 ? Math.round((stats.count / totalInteractions) * 100) : 0;
                  const isSocial = block.type === "social-links";
                  const platformMap = socialPlatformStats.get(block.id);
                  return (
                    <div key={block.id} style={{ padding: "0.625rem 0.875rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>{blockTypeIcon[block.type] || "📦"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                            <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{blockLabel(block)}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: stats.count > 0 ? "var(--color-primary)" : "var(--color-text-faint)", flexShrink: 0, marginLeft: "0.5rem" }}>{stats.count} ({pct}%)</span>
                          </div>
                          {/* G6: teal Views bar + amber Interactions bar */}
                          {(() => {
                            const viewCount = stats.eventTypes["view"] ?? 0;
                            const interCount2 = stats.count - viewCount;
                            const maxCount = Math.max(...Array.from(blockStats.values()).map(s => s.count), 1);
                            const vPct = Math.round((viewCount / maxCount) * 100);
                            const iPct = Math.round((interCount2 / maxCount) * 100);
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 3 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--color-text-faint)" }}>
                                  <span>Views</span><span style={{ fontWeight: 600 }}>{viewCount}</span>
                                </div>
                                <div style={{ height: 4, background: "var(--color-divider)", borderRadius: 999, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${vPct}%`, background: "#0891b2", borderRadius: 999, transition: "width 0.4s" }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--color-text-faint)" }}>
                                  <span>Interactions</span><span style={{ fontWeight: 600 }}>{interCount2}</span>
                                </div>
                                <div style={{ height: 4, background: "var(--color-divider)", borderRadius: 999, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${iPct}%`, background: "var(--color-primary)", borderRadius: 999, transition: "width 0.4s" }} />
                                </div>
                              </div>
                            );
                          })()}
                          {/* G6d: per-platform breakdown for social-links */}
                          {isSocial && platformMap && platformMap.size > 0 && (
                            <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {Array.from(platformMap.entries()).sort((a, b) => b[1] - a[1]).map(([platform, cnt]) => (
                                <div key={platform} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-muted)", paddingLeft: "0.5rem" }}>
                                  <span>{SOCIAL_PLATFORM_LABELS[platform] || platform}</span>
                                  <span style={{ fontWeight: 600 }}>{cnt} clicks</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => archiveMutation.mutate({ blockId: block.id, action: "archive" })}
                          disabled={archiveMutation.isPending}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, flexShrink: 0 }}
                          title="Archive block"
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Archived blocks */}
          {archivedBlocks.length > 0 && (
            <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "1rem" }}>
                Archived ({archivedBlocks.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {archivedBlocks.map((block: any) => {
                  const atBlock = allTimeBlocks.find((b: any) => b.blockId === block.id) ?? { count: 0 };
                  return (
                    <div key={block.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", opacity: 0.75 }}>
                      <span style={{ fontSize: "1.1rem" }}>{blockTypeIcon[block.type] || "📦"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{blockLabel(block)}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{atBlock.count ?? 0} lifetime interactions</div>
                      </div>
                      <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                        <button
                          onClick={() => archiveMutation.mutate({ blockId: block.id, action: "restore" })}
                          disabled={archiveMutation.isPending}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11 }}
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => archiveMutation.mutate({ blockId: block.id, action: "hide" })}
                          disabled={archiveMutation.isPending}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11 }}
                          title="Move to hidden (won't re-appear in live)"
                        >
                          Hide
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* G6b: Hidden section — collapsed by default */}
          {hiddenBlocks.length > 0 && (
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
                  <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginBottom: "0.5rem" }}>Hidden blocks are permanently out of your live page. You can restore them to live if needed.</p>
                  {hiddenBlocks.map((block: any) => {
                    const atBlock = allTimeBlocks.find((b: any) => b.blockId === block.id) ?? { count: 0 };
                    return (
                      <div key={block.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", opacity: 0.6 }}>
                        <span style={{ fontSize: "1.1rem" }}>{blockTypeIcon[block.type] || "📦"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{blockLabel(block)}</div>
                          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{atBlock.count ?? 0} lifetime interactions</div>
                        </div>
                        <button
                          onClick={() => archiveMutation.mutate({ blockId: block.id, action: "restore" })}
                          disabled={archiveMutation.isPending}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, flexShrink: 0 }}
                        >
                          Restore to live
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LeadsPanel({ pages }: { pages: any[] }) {
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
    <div style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
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
            <select value={selectedPageId ?? ""} onChange={e => setSelectedPageId(Number(e.target.value))} className="input" style={{ fontSize: "var(--text-sm)", width: "auto" }}>
              {pages.map((p: any) => <option key={p.id} value={p.id}>{p.username}</option>)}
            </select>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setAddLeadOpen(true)} data-testid="button-add-lead">+ Add lead</button>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV} data-testid="button-export-leads">↓ Export CSV</button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
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

function ContactsPanel() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState(""); // legacy — kept for compat
  const [filterCategory, setFilterCategory] = useState("name");
  const [filterText, setFilterText] = useState("");
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | "unsupported">(typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported");
  // G13: track dismissed banner IDs in component state (so banner doesn't re-show on tab switch)
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

  // G13: fire browser notifications only once per contact per day (DB-persisted via overdue_notified_at)
  const notifyMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const res = await apiRequest("PATCH", `/api/contacts/${contactId}`, { overdueNotifiedAt: new Date().toISOString() });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/contacts"] }); },
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const dueContacts = (contacts || []).filter((c: any) => {
      if (!c.followUpDate || c.followUpDone) return false;
      if (new Date(c.followUpDate).getTime() - Date.now() > 3600000) return false;
      // Only notify if overdue_notified_at is null or was set more than 24h ago
      if (c.overdueNotifiedAt) {
        const lastNotified = new Date(c.overdueNotifiedAt).getTime();
        if (Date.now() - lastNotified < 86400000) return false;
      }
      return true;
    });
    dueContacts.forEach((c: any) => {
      try {
        new Notification("Follow-up due", { body: `${c.name} — ${c.followUpNote || "No details"}` });
        notifyMutation.mutate(c.id);
      } catch {}
    });
  }, [contacts]);

  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setNotificationStatus(result);
    } catch {}
  };

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
    <div style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif" }}>Contacts</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "0.25rem" }}>{(contacts || []).length} total</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {notificationStatus !== "granted" && notificationStatus !== "unsupported" && (
            <button onClick={enableNotifications} className="btn btn-secondary btn-sm" data-testid="button-enable-notifications">🔔 Enable notifications</button>
          )}
          <button onClick={exportCsv} className="btn btn-secondary btn-sm" data-testid="button-export-contacts">Export CSV</button>
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
function NewPageWizardModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (pageId: number) => void }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [accent, setAccent] = useState("#e06b1a");
  const [bg, setBg] = useState("none");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pages", { username, title, accentColor: accent, background: bg });
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
      if (id) onCreated(id);
      setStep(1); setUsername(""); setTitle(""); setAccent("#e06b1a"); setBg("none");
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }} onClick={onClose}>
      <div className="card" style={{ width: "100%", maxWidth: 480, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ flex: 1, height: 4, borderRadius: 999, background: step >= n ? "var(--color-primary)" : "var(--color-divider)" }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h3 style={{ fontWeight: 800, marginBottom: "0.5rem", fontFamily: "Cabinet Grotesk, sans-serif" }}>Pick a username</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1rem" }}>This is your page's URL.</p>
            <input className="input" placeholder="yourname" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} data-testid="input-wizard-username" />
            <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: "0.5rem" }}>linkbay.ai/{username || "yourname"}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={() => setStep(2)} disabled={!username || username.length < 3} className="btn btn-primary btn-sm">Next →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 style={{ fontWeight: 800, marginBottom: "0.5rem", fontFamily: "Cabinet Grotesk, sans-serif" }}>Style your page</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1rem" }}>You can change these later.</p>
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.25rem" }}>Page title</label>
            <input className="input" placeholder="My links" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: "0.75rem" }} />
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.25rem" }}>Accent colour</label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              {["#e06b1a", "#0ea5e9", "#10b981", "#8b5cf6", "#ef4444", "#1e293b"].map(c => (
                <button key={c} onClick={() => setAccent(c)} style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: accent === c ? "3px solid var(--color-text)" : "2px solid var(--color-border)", cursor: "pointer" }} aria-label={`Accent ${c}`} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary btn-sm">← Back</button>
              <button onClick={() => setStep(3)} disabled={!title} className="btn btn-primary btn-sm">Next →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 style={{ fontWeight: 800, marginBottom: "0.5rem", fontFamily: "Cabinet Grotesk, sans-serif" }}>Confirm and create</h3>
            <div style={{ background: "var(--color-surface-offset)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "var(--text-sm)" }}>
              <div><strong>URL:</strong> linkbay.ai/{username}</div>
              <div><strong>Title:</strong> {title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><strong>Accent:</strong> <span style={{ width: 16, height: 16, borderRadius: "50%", background: accent, display: "inline-block" }} /></div>
            </div>
            {createMutation.error && <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", marginBottom: "0.5rem" }}>{(createMutation.error as Error).message}</p>}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(2)} className="btn btn-secondary btn-sm">← Back</button>
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="btn btn-primary btn-sm">{createMutation.isPending ? "Creating…" : "Create page"}</button>
            </div>
          </>
        )}
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
    <div style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
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
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.5rem" }}>Custom domain</h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1rem" }}>Available on Pro and Business plans.</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input className="input" placeholder="yourdomain.com" style={{ flex: 1 }} />
          <button className="btn btn-secondary">Connect →</button>
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
            { tier: "Pro", price: "£5", period: "/mo", color: "#e06b1a", features: ["3 pages", "Unlimited blocks", "Analytics", "Contacts", "AI builder"] },
            { tier: "Business", price: "£20", period: "/mo", color: "#0891b2", features: ["Unlimited pages", "Unlimited blocks", "Analytics", "Contacts", "AI builder"] },
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
  const [annual, setAnnual] = useState(false);
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
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: () => setToast("⚠️ Could not start checkout. Please try again."),
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
      features: ["1 page", "5 content blocks", "Basic profile"],
      priceIdMonthly: "",
      priceIdAnnual: "",
    },
    {
      id: "pro",
      name: "Pro",
      monthlyPrice: 5,
      annualPrice: 4,
      color: "#e06b1a",
      features: ["3 pages", "Unlimited blocks", "Analytics", "Contacts", "AI page builder", "Priority support"],
      priceIdMonthly: lic?.priceIds?.proMonthly || "",
      priceIdAnnual: lic?.priceIds?.proAnnual || "",
    },
    {
      id: "business",
      name: "Business",
      monthlyPrice: 20,
      annualPrice: 16,
      color: "#0891b2",
      features: ["Unlimited pages", "Unlimited blocks", "Analytics", "Contacts", "AI page builder", "Custom domain", "Priority support"],
      priceIdMonthly: lic?.priceIds?.businessMonthly || "",
      priceIdAnnual: lic?.priceIds?.businessAnnual || "",
    },
  ];

  const currentTier = lic?.tier || "free";

  return (
    <div style={{ flex: 1, padding: "1.5rem", overflow: "auto", maxWidth: 720 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {plans.map(plan => {
          const isCurrent = currentTier === plan.id;
          const price = annual ? plan.annualPrice : plan.monthlyPrice;
          const priceId = annual ? plan.priceIdAnnual : plan.priceIdMonthly;
          const isLoading2 = checkoutMutation.isPending && checkoutMutation.variables === priceId;
          return (
            <div key={plan.id} style={{ border: `2px solid ${isCurrent ? plan.color : "var(--color-border)"}`, borderRadius: "var(--radius-xl)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", background: isCurrent ? `color-mix(in srgb, ${plan.color} 6%, var(--color-surface))` : "var(--color-surface)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: plan.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{plan.name}</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, lineHeight: 1 }}>
                {price === 0 ? "Free" : `£${price}`}
                {price > 0 && <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-muted)" }}>{annual ? "/mo, billed annually" : "/mo"}</span>}
              </div>
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
                      if (!priceId) { setToast("⚠️ Payments not configured yet — contact support."); return; }
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
  const [answers, setAnswers] = useState({ name: "", tagline: "", goal: "", industry: "", style: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const questions = [
    { key: "name",     label: "What's your name or brand?",         type: "text",   placeholder: "e.g. Sarah Johnson or Bloom Studio" },
    { key: "tagline", label: "What do you do in one sentence?",      type: "text",   placeholder: "e.g. I help small businesses grow on social media" },
    { key: "goal",    label: "What's the main goal of your page?",   type: "select", options: ["Get more followers", "Sell products or services", "Capture leads", "Share content", "Other"] },
    { key: "industry",label: "What industry are you in?",            type: "select", options: ["Creator / Influencer", "Fitness & Health", "Business & Consulting", "Music & Arts", "Retail & E-commerce", "Tech & Software", "Other"] },
    { key: "style",   label: "What style feels right?",              type: "pills",  options: ["Minimal", "Bold", "Professional", "Playful"] },
  ];

  const currentQ = questions[step];
  const totalSteps = questions.length;
  const canNext = answers[currentQ.key as keyof typeof answers].trim().length > 0;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("POST", "/api/ai/generate-page", { answers });
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
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-xl)", padding: "2rem", maxWidth: 460, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.24)" }} onClick={e => e.stopPropagation()}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ fontSize: 40, marginBottom: "1rem", animation: "spin 1.5s linear infinite", display: "inline-block" }}>✨</div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "0.5rem" }}>Building your page…</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>AI is generating blocks tailored to your brand</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-faint)", marginBottom: "0.25rem" }}>Step {step + 1} of {totalSteps}</div>
                <h2 style={{ fontSize: "var(--text-base)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", margin: 0 }}>{currentQ.label}</h2>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: "var(--color-divider)", borderRadius: 999, marginBottom: "1.5rem" }}>
              <div style={{ height: "100%", width: `${((step + 1) / totalSteps) * 100}%`, background: "var(--color-primary)", borderRadius: 999, transition: "width 0.3s" }} />
            </div>

            {/* Input */}
            {currentQ.type === "text" && (
              <input
                autoFocus
                value={answers[currentQ.key as keyof typeof answers]}
                onChange={e => setAnswers(a => ({ ...a, [currentQ.key]: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter" && canNext) step < totalSteps - 1 ? setStep(s => s + 1) : handleGenerate(); }}
                placeholder={currentQ.placeholder}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", fontSize: "var(--text-sm)", marginBottom: "1.5rem", boxSizing: "border-box" }}
              />
            )}
            {currentQ.type === "select" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {currentQ.options!.map(opt => (
                  <button key={opt} onClick={() => setAnswers(a => ({ ...a, [currentQ.key]: opt }))} style={{ padding: "0.625rem 1rem", borderRadius: "var(--radius-md)", border: `1px solid ${answers[currentQ.key as keyof typeof answers] === opt ? "var(--color-primary)" : "var(--color-border)"}`, background: answers[currentQ.key as keyof typeof answers] === opt ? "var(--color-primary-highlight)" : "var(--color-bg)", color: answers[currentQ.key as keyof typeof answers] === opt ? "var(--color-primary)" : "var(--color-text)", fontSize: "var(--text-sm)", fontWeight: 500, cursor: "pointer", textAlign: "left" }}>{opt}</button>
                ))}
              </div>
            )}
            {currentQ.type === "pills" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {currentQ.options!.map(opt => (
                  <button key={opt} onClick={() => setAnswers(a => ({ ...a, [currentQ.key]: opt }))} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-full)", border: `1px solid ${answers[currentQ.key as keyof typeof answers] === opt ? "var(--color-primary)" : "var(--color-border)"}`, background: answers[currentQ.key as keyof typeof answers] === opt ? "var(--color-primary)" : "var(--color-bg)", color: answers[currentQ.key as keyof typeof answers] === opt ? "#fff" : "var(--color-text)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer" }}>{opt}</button>
                ))}
              </div>
            )}

            {error && <div style={{ fontSize: 13, color: "var(--color-error, #dc2626)", marginBottom: "1rem", padding: "0.5rem", background: "rgba(220,38,38,0.08)", borderRadius: "var(--radius-sm)" }}>{error}</div>}

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} style={{ visibility: step === 0 ? "hidden" : "visible" }}>Back</button>
              {step < totalSteps - 1 ? (
                <button className="btn btn-primary btn-sm" onClick={() => setStep(s => s + 1)} disabled={!canNext}>Next</button>
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

  useEffect(() => {
    if (pages.length && activePageId == null) setActivePageId(pages[0].id);
  }, [pages, activePageId]);

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
      case "blocks": return <BlockAnalysisPanel pages={pages} activePageId={activePageId} />;
      case "leads": return <LeadsPanel pages={pages} />;
      case "contacts": return tierLimits.contacts
        ? <ContactsPanel />
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
