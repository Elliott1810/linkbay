import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTheme, useAuth } from "@/App";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { backgroundToCss } from "./BuilderPage";

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
};

const LINK_ICONS = ["🔗", "📅", "📧", "📄", "💼", "🎥", "📱", "⬇️", "⭐", "💬", "🌐", "📊"];

// --- Nav items (leads dot injected dynamically) ---
const navItems = [
  { id: "overview", label: "Overview", icon: "grid" },
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
  hasLeads,
  pageUrl,
}: {
  pages: any[];
  onNavigate: (tab: string) => void;
  sharedLink: boolean;
  onShared: () => void;
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
          <div style={{ fontSize: 11, color: "var(--color-text-faint)", fontWeight: 600 }}>{completedCount}/{totalItems} done</div>
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

// --- Overview Panel ---
function OverviewPanel({
  pages,
  onNavigate,
  sharedLink,
  onShared,
  activePageId,
  setActivePageId,
}: {
  pages: any[];
  onNavigate: (tab: string) => void;
  sharedLink: boolean;
  onShared: () => void;
  activePageId: number | null;
  setActivePageId: (id: number) => void;
}) {
  const selectedPageId = activePageId ?? pages[0]?.id ?? null;
  const setSelectedPageId = setActivePageId;
  const [days, setDays] = useState<number>(30);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);



  // Use dashboard/stats for overview cards (supports days param)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats", days],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/dashboard/stats?days=${days}`);
      return res.json();
    },
    staleTime: 30_000,
  });

  // Also fetch single-page analytics for the chart
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/pages", selectedPageId, "analytics", days],
    queryFn: async () => {
      if (!selectedPageId) return null;
      const res = await apiRequest("GET", `/api/pages/${selectedPageId}/analytics?days=${days}`);
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
  const clickRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;

  const statsData = [
    { label: "Total Views", value: totalViews.toLocaleString(), delta: `${days}d window`, up: true },
    { label: "Total Clicks", value: totalClicks.toLocaleString(), delta: `${days}d window`, up: true },
    { label: "Click Rate", value: `${clickRate}%`, delta: `${days}d average`, up: true },
    { label: "Total Leads", value: totalLeads.toLocaleString(), delta: `${days}d window`, up: true },
  ];

  const topLinks = analytics?.topLinks ?? [];

  // Chart data from analytics
  const chartData = (analytics?.dailyViews ?? []).slice(-14).map((d: { date: string; count: number }) => ({
    date: new Date(d.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    Views: d.count,
  }));

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=Check+out+my+Linkbay+page`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent("Check out my Linkbay page: " + pageUrl)}`;

  return (
    <div style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
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
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
          <CopyUrlButton url={pageUrl} label="Copy link" />
          <Link
            href={`/${page?.username}`}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textDecoration: "none" }}
            data-testid="link-view-page"
          >
            {icons.external} View page
          </Link>
          <Link href="/builder" className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            {icons.plus} New page
          </Link>
        </div>
      </div>

      {/* Onboarding checklist */}
      <OnboardingChecklist
        pages={pages}
        onNavigate={onNavigate}
        sharedLink={sharedLink}
        onShared={onShared}
        hasLeads={(leadsForPage?.length ?? 0) > 0}
        pageUrl={pageUrl}
      />

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
        {/* Date range selector */}
        <div style={{ display: "flex", gap: "0.25rem", marginLeft: "auto" }}>
          {[7, 30, 60, 90].map(d => (
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
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      {statsLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[0,1,2,3].map(i => (
            <div key={i} className="stat-card" style={{ height: 88 }}>
              <div className="skeleton" style={{ width: "60%", height: 12, marginBottom: "0.5rem" }} />
              <div className="skeleton" style={{ width: "40%", height: 24 }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
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
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1.25rem" }}>Views — last {Math.min(14, days)} days</div>
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
              <Area type="monotone" dataKey="Views" stroke="#e06b1a" strokeWidth={2} fill="url(#viewsGrad)" dot={false} activeDot={{ r: 4, fill: "#e06b1a" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top links + share section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
        {/* Top links */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>Top links by clicks</div>
          {topLinks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>
              No clicks tracked yet. Share your page to start tracking!
            </div>
          ) : (
            topLinks.map((link: any) => (
              <div key={link.id} style={{ marginBottom: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", marginBottom: "0.25rem" }}>
                  <span style={{ color: "var(--color-text-muted)", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.label}</span>
                  <span style={{ fontWeight: 700 }}>{link.clickCount} clicks</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${topLinks[0]?.clickCount > 0 ? Math.round((link.clickCount / topLinks[0].clickCount) * 100) : 0}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right column: Quick actions + Share section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
            {/* URL display */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.625rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "0.625rem" }}>
              <span style={{ flex: 1, fontSize: 11, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                linkbay.ai/{page?.username}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(pageUrl).then(() => {
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
            {/* Social share buttons */}
            <div style={{ display: "flex", gap: "0.375rem" }}>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, padding: "0.4rem 0", textAlign: "center", background: "#1da1f2", color: "white", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                title="Share on X / Twitter"
              >
                𝕏
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
  { label: "None", value: "none", preview: "#f7f6f4" },
  { label: "Warm White", value: "warm-white", preview: "#fef9f4" },
  { label: "Slate", value: "slate", preview: "#f1f5f9" },
  { label: "Charcoal", value: "charcoal", preview: "#1e293b" },
  { label: "Midnight", value: "midnight", preview: "#0f172a" },
  { label: "Dots", value: "dots", preview: "radial-gradient(circle, #c0bdb9 1px, transparent 1px), #f7f6f4" },
  { label: "Grid", value: "grid-bg", preview: "linear-gradient(#e0dedd 1px, transparent 1px), linear-gradient(90deg, #e0dedd 1px, transparent 1px), #f7f6f4" },
  { label: "Diagonal", value: "diagonal", preview: "repeating-linear-gradient(-45deg, #e0dedd 0px, #e0dedd 1px, transparent 1px, transparent 8px), #f7f6f4" },
  { label: "Amber", value: "warm-amber", preview: "linear-gradient(135deg, #fef3c7, #fde68a)" },
  { label: "Blue", value: "cool-blue", preview: "linear-gradient(135deg, #dbeafe, #bfdbfe)" },
  { label: "Sage", value: "sage", preview: "linear-gradient(135deg, #d1fae5, #a7f3d0)" },
  { label: "Rose", value: "rose", preview: "linear-gradient(135deg, #ffe4e6, #fecdd3)" },
  { label: "Topography", value: "topography", preview: "radial-gradient(circle, #d6d3d1 1px, transparent 1.5px), #faf5ef" },
  { label: "Bubbles", value: "bubble", preview: "radial-gradient(circle at 30% 30%, #fde68a, transparent 50%), radial-gradient(circle at 70% 60%, #bfdbfe, transparent 50%), #fef9f4" },
  { label: "Circuit", value: "circuit", preview: "linear-gradient(90deg, #cbd5e1 1px, transparent 1px), linear-gradient(#cbd5e1 1px, transparent 1px), #f8fafc" },
  { label: "Moroccan", value: "moroccan", preview: "linear-gradient(45deg, #fce7f3 25%, transparent 25%), linear-gradient(-45deg, #fce7f3 25%, transparent 25%), #fef9f4" },
  { label: "Glass", value: "glass", preview: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2)), #e0f2fe" },
  { label: "Sunset", value: "sunset", preview: "linear-gradient(135deg, #f97316, #ec4899)" },
  { label: "Ocean", value: "ocean", preview: "linear-gradient(135deg, #0891b2, #1e40af)" },
  { label: "Forest", value: "forest", preview: "linear-gradient(135deg, #15803d, #166534)" },
  { label: "Aurora", value: "aurora", preview: "linear-gradient(135deg, #8b5cf6, #ec4899, #14b8a6)" },
  { label: "Midnight Blue", value: "midnight-blue", preview: "linear-gradient(135deg, #1e3a8a, #312e81)" },
  { label: "Warm Sand", value: "warm-sand", preview: "linear-gradient(135deg, #fef3c7, #fde68a, #fcd34d)" },
  { label: "Deep Purple", value: "deep-purple", preview: "linear-gradient(135deg, #6b21a8, #4c1d95)" },
];

const THEME_PRESETS: { id: string; name: string; accentColor: string; background: string }[] = [
  { id: "ember", name: "Ember", accentColor: "#e06b1a", background: "none" },
  { id: "midnight", name: "Midnight", accentColor: "#8b5cf6", background: "midnight-blue" },
  { id: "ocean", name: "Ocean", accentColor: "#0891b2", background: "ocean" },
  { id: "forest", name: "Forest", accentColor: "#059669", background: "forest" },
  { id: "aurora", name: "Aurora", accentColor: "#7c3aed", background: "aurora" },
  { id: "minimal", name: "Minimal", accentColor: "#334155", background: "none" },
  { id: "sunset", name: "Sunset", accentColor: "#e11d48", background: "sunset" },
  { id: "sand", name: "Sand", accentColor: "#a16207", background: "warm-sand" },
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
      <div>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>Page background</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))", gap: "0.375rem" }}>
          {DASHBOARD_BG_OPTIONS.map(bg => (
            <button
              key={bg.value}
              type="button"
              onClick={() => setBackground(bg.value)}
              title={bg.label}
              style={{
                height: 40,
                borderRadius: "var(--radius-sm)",
                border: `2px solid ${background === bg.value ? "var(--color-text)" : "var(--color-border)"}`,
                cursor: "pointer",
                background: bg.preview,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                padding: "2px",
                overflow: "hidden",
              }}
            >
              <span style={{ fontSize: 8, fontWeight: 700, background: "rgba(0,0,0,0.45)", color: "#fff", padding: "1px 4px", borderRadius: 2, lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{bg.label}</span>
            </button>
          ))}
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
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>Theme presets</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.375rem" }}>
          {THEME_PRESETS.map(t => {
            const isActive = accentColor === t.accentColor && background === t.background;
            return (
              <button key={t.id} type="button"
                onClick={() => { setAccentColor(t.accentColor); setBackground(t.background); }}
                style={{ padding: "0.5rem", fontSize: 12, fontWeight: 600, borderRadius: "var(--radius-sm)", border: `2px solid ${isActive ? "var(--color-text)" : "var(--color-border)"}`, background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                data-testid={`theme-preset-${t.id}`}
              >
                <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", background: t.accentColor, flexShrink: 0 }} />
                {t.name}
              </button>
            );
          })}
        </div>
      </div>
      <button
        onClick={() => onSave({ title, bio, location, phone, contactEmail, accentColor, background, avatarShape })}
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

  if (pages.length === 0) return <NoPageState />;

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Left panel — page settings */}
      <div style={{ width: 280, borderRight: "1px solid var(--color-border)", background: "var(--color-surface-2)", padding: "1.25rem", overflow: "auto" }}>
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
      </div>

      {/* Right panel — link editor + blocks */}
      <div style={{ flex: 1, padding: "1.25rem", overflow: "auto" }}>
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
          </div>
        </div>

        {/* Add new block */}
        <AddBlockForm
          onAdd={(block) => saveBlocksMutation.mutate([...(pageBlocks || []), block])}
          saving={saveBlocksMutation.isPending}
        />

        {/* Blocks editor */}
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
  );
}

// --- Add Block Form (text, poll, lead-form) ---
type CustomFieldDef = { name: string; type: "text" | "dropdown" | "checkbox" | "number"; required: boolean; options?: string[] };

type BlockKind = PageBlock["type"];

function AddBlockForm({ onAdd, saving }: { onAdd: (b: PageBlock) => void; saving: boolean }) {
  const [blockType, setBlockType] = useState<BlockKind>("text");
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
      onAdd({ id, type: "divider" });
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
                <input className="input" placeholder="Field name" value={f.name} onChange={e => { const arr = [...customFields]; arr[idx] = { ...arr[idx], name: e.target.value }; setCustomFields(arr); }} style={{ flex: 1, fontSize: 12 }} />
                <select className="input" value={f.type} onChange={e => { const arr = [...customFields]; arr[idx] = { ...arr[idx], type: e.target.value as any }; setCustomFields(arr); }} style={{ fontSize: 12 }}>
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
              <select className="input" value={s.platform} onChange={e => { const arr = [...socials]; arr[i] = { ...arr[i], platform: e.target.value }; setSocials(arr); }} style={{ fontSize: 13 }}>
                <option value="twitter">Twitter / X</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="github">GitHub</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="website">Website</option>
              </select>
              <input className="input" placeholder="URL" value={s.url} onChange={e => { const arr = [...socials]; arr[i] = { ...arr[i], url: e.target.value }; setSocials(arr); }} style={{ flex: 1, fontSize: 13 }} />
              {socials.length > 1 && <button type="button" onClick={() => setSocials(socials.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c" }}>×</button>}
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
        <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>A subtle horizontal divider to separate sections.</p>
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
  const [days, setDays] = useState<number>(30);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/pages", selectedPageId, "analytics", days],
    queryFn: async () => {
      if (!selectedPageId) return null;
      const res = await apiRequest("GET", `/api/pages/${selectedPageId}/analytics?days=${days}`);
      return res.json();
    },
    enabled: !!selectedPageId,
  });

  if (pages.length === 0) return <NoPageState />;

  const page = pages.find((p: any) => p.id === selectedPageId) || pages[0];

  // Build chart data
  const chartData = (analytics?.dailyViews ?? []).map((d: { date: string; count: number }) => ({
    date: new Date(d.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    Views: d.count,
  }));

  return (
    <div style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.25rem" }}>Analytics</h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{days}-day performance for linkbay.ai/{page?.username}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Date range tabs */}
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {[7, 30, 60, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: "0.3rem 0.75rem", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 600,
                  border: `1px solid ${days === d ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: days === d ? "var(--color-primary-highlight)" : "var(--color-surface-offset)",
                  color: days === d ? "var(--color-primary)" : "var(--color-text-faint)",
                  cursor: "pointer",
                }}
              >
                {d}d
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr) repeat(3, 1fr)", gap: "1rem" }}>
            {[
              { label: "Total views (all time)", value: analytics.totalViews?.toLocaleString() ?? "0" },
              { label: `Views (${days}d)`, value: analytics.periodViews?.toLocaleString() ?? "0" },
              { label: `Clicks (${days}d)`, value: analytics.periodClicks?.toLocaleString() ?? "0" },
              { label: "Click rate", value: analytics.clickRate ? `${analytics.clickRate}%` : "0%" },
              { label: "Unique visitors", value: (analytics.uniqueVisitors ?? 0).toLocaleString() },
              { label: "Repeat visitors", value: (analytics.repeatVisitors ?? 0).toLocaleString() },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ marginTop: "0.5rem" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Views chart */}
          {chartData.length > 0 && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1.25rem" }}>Page views — last {days} days</div>
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
                  <Area type="monotone" dataKey="Views" stroke="#e06b1a" strokeWidth={2} fill="url(#viewsGradFull)" dot={false} activeDot={{ r: 4, fill: "#e06b1a" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {/* Top links */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>Top links by clicks</div>
              {(analytics.topLinks || []).length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>No clicks yet. Share your page to start.</div>
              ) : (
                (analytics.topLinks || []).map((link: any) => (
                  <div key={link.id} style={{ marginBottom: "0.875rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", marginBottom: 2 }}>
                      <span style={{ color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{link.label}</span>
                      <span style={{ fontWeight: 700 }}>{link.clickCount}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${analytics.topLinks[0]?.clickCount > 0 ? Math.round(link.clickCount / analytics.topLinks[0].clickCount * 100) : 0}%` }} />
                    </div>
                  </div>
                ))
              )}
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
                    const code = (c.country || "").toUpperCase();
                    const flag = code.length === 2
                      ? String.fromCodePoint(...[...code].map(ch => 127397 + ch.charCodeAt(0)))
                      : "🌍";
                    return (
                      <div key={code || "unknown"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--color-divider)" }}>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: 18 }}>{flag}</span>
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
function LeadsPanel({ pages }: { pages: any[] }) {
  const [selectedPageId, setSelectedPageId] = useState<number | null>(pages[0]?.id ?? null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);

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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.25rem" }}>Leads</h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{totalCount} total lead{totalCount !== 1 ? "s" : ""} captured</p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          {pages.length > 1 && (
            <select value={selectedPageId ?? ""} onChange={e => setSelectedPageId(Number(e.target.value))} className="input" style={{ fontSize: "var(--text-sm)", width: "auto" }}>
              {pages.map((p: any) => <option key={p.id} value={p.id}>{p.username}</option>)}
            </select>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={exportCSV}
            data-testid="button-export-leads"
          >
            ↓ Export CSV
          </button>
        </div>
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
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Share your page to start capturing leads.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "var(--text-sm)" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-offset)" }}>
                  {["Name", "Email", "Message", "Source", "Status", "Date", ""].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--color-border)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(leads || []).map((lead: any, i: number) => (
                  <tr key={lead.id} style={{ borderBottom: "1px solid var(--color-divider)", background: i % 2 === 0 ? "transparent" : "var(--color-surface-2)" }} data-testid={`lead-row-${lead.id}`}>
                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-primary-highlight)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                          {lead.name[0]}
                        </div>
                        {lead.name}
                      </div>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)" }}>{lead.email}</td>
                    <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)", maxWidth: 200 }}>
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
                    <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-faint)", fontSize: 12 }}>{lead.source || "—"}</td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <select
                        value={lead.status}
                        onChange={e => updateStatusMutation.mutate({ id: lead.id, status: e.target.value })}
                        style={{ fontSize: 11, fontWeight: 700, color: statusColor[lead.status] ?? "var(--color-text-faint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        data-testid={`select-lead-status-${lead.id}`}
                      >
                        {statusOptions.map(s => <option key={s} value={s}>● {s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-faint)", fontSize: 12 }}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
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
function ContactsPanel() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState("");

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

  const filtered = (contacts || []).filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q);
  });

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
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={exportCsv} className="btn btn-secondary btn-sm" data-testid="button-export-contacts">Export CSV</button>
          <button onClick={() => setAddOpen(true)} className="btn btn-primary btn-sm" data-testid="button-add-contact">+ Add contact</button>
        </div>
      </div>

      <div className="card" style={{ padding: "0.75rem", marginBottom: "1rem" }}>
        <input className="input" placeholder="Search by name, email, or company…" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-contact-search" />
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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
            <thead>
              <tr style={{ background: "var(--color-surface-offset)", borderBottom: "1px solid var(--color-divider)" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 700, fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: 0.5 }}>Name</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 700, fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: 0.5 }}>Email</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 700, fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: 0.5 }}>Company</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 700, fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: 0.5 }}>Source</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 700, fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: 0.5 }}>Created</th>
                <th style={{ padding: "0.75rem", width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--color-divider)", cursor: "pointer" }} onClick={() => setSelectedId(c.id)} data-testid={`row-contact-${c.id}`}>
                  <td style={{ padding: "0.75rem", fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: "0.75rem", color: "var(--color-text-muted)" }}>{c.email}</td>
                  <td style={{ padding: "0.75rem", color: "var(--color-text-muted)" }}>{c.company || "—"}</td>
                  <td style={{ padding: "0.75rem" }}><span className="badge" style={{ background: "var(--color-surface-offset)", fontSize: 10 }}>{c.source || "manual"}</span></td>
                  <td style={{ padding: "0.75rem", color: "var(--color-text-faint)", fontSize: 12 }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }} onClick={() => setAddOpen(false)}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }} onClick={() => { setSelectedId(null); setEditMode(false); }}>
          <div className="card" style={{ width: "100%", maxWidth: 640, maxHeight: "85vh", overflow: "auto", padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
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
              <form onSubmit={e => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                updateMutation.mutate({
                  id: detail.contact.id,
                  data: {
                    name: fd.get("name"),
                    email: fd.get("email"),
                    company: fd.get("company") || undefined,
                    phone: fd.get("phone") || undefined,
                    source: fd.get("source") || undefined,
                    notes: fd.get("notes") || undefined,
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
      const id = data?.page?.id || data?.id;
      if (id) onCreated(id);
      setStep(1); setUsername(""); setTitle(""); setAccent("#e06b1a"); setBg("none");
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }} onClick={onClose}>
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
                src={user.avatarUrl}
                alt={user.name}
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
export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("overview");
  const [sharedLink, setSharedLink] = useState(false);
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [newPageWizardOpen, setNewPageWizardOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, pages, isLoading, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (pages.length && activePageId == null) setActivePageId(pages[0].id);
  }, [pages, activePageId]);

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
      case "overview": return <OverviewPanel pages={pages} onNavigate={(tab) => setActiveNav(tab)} sharedLink={sharedLink} onShared={() => setSharedLink(true)} activePageId={activePageId} setActivePageId={setActivePageId} />;
      case "editor": return <EditorPanel pages={pages} activePageId={activePageId} />;
      case "analytics": return <AnalyticsPanel pages={pages} activePageId={activePageId} setActivePageId={setActivePageId} />;
      case "leads": return <LeadsPanel pages={pages} />;
      case "contacts": return <ContactsPanel />;
      case "settings": return <SettingsPanel user={user} pages={pages} onLogout={async () => { await logout(); navigate("/"); }} />;
      case "billing": return (
        <div style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "1.5rem" }}>Billing</h1>
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>Current plan</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Free tier — upgrade for custom domain, analytics, and AI features</div>
              </div>
              <span className="badge badge-primary">Free</span>
            </div>
            <Link href="/pricing" className="btn btn-primary btn-sm">Upgrade to Pro →</Link>
          </div>
          <div className="card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "1rem" }}>Pro — £9/mo</h2>
            {["Custom domain", "Unlimited pages", "Advanced analytics", "AI conversion tips", "Priority support"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0", borderBottom: "1px solid var(--color-divider)", fontSize: "var(--text-sm)" }}>
                <span style={{ color: "var(--color-success)" }}>✓</span> {f}
              </div>
            ))}
            <Link href="/pricing" className="btn btn-primary" style={{ marginTop: "1.25rem", justifyContent: "center" }}>Get Pro</Link>
          </div>
        </div>
      );
      default: return <OverviewPanel pages={pages} onNavigate={(tab) => setActiveNav(tab)} sharedLink={sharedLink} onShared={() => setSharedLink(true)} activePageId={activePageId} setActivePageId={setActivePageId} />;
    }
  };

  return (
    <div className="dashboard-shell" style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--color-bg)" }}>
      {/* Sidebar */}
      <nav className="dashboard-sidebar" style={{
        width: 220, flexShrink: 0,
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex", flexDirection: "column",
        height: "100dvh", overflow: "hidden"
      }}>
        {/* Logo */}
        <div style={{ padding: "1.25rem 1rem 1rem", borderBottom: "1px solid var(--color-divider)" }}>
          <Link href="/" style={{ textDecoration: "none", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="100" height="26" viewBox="0 0 120 32" fill="none">
              <rect x="0" y="4" width="10" height="24" rx="3" fill="currentColor" opacity="0.9"/>
              <rect x="13" y="9" width="10" height="19" rx="3" fill="currentColor" opacity="0.7"/>
              <rect x="26" y="14" width="10" height="14" rx="3" fill="var(--color-primary)"/>
              <text x="42" y="22" fontFamily="Cabinet Grotesk, sans-serif" fontWeight="800" fontSize="17" fill="currentColor" letterSpacing="-0.5">linkbay</text>
            </svg>
          </Link>
        </div>

        {/* User */}
        <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--color-divider)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{userInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          </div>
        </div>

        {/* Page switcher */}
        {pages.length > 0 && (
          <div style={{ margin: "0.75rem 1rem 0" }}>
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
        <div style={{ flex: 1, padding: "0.75rem 0.5rem", overflow: "auto" }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`sidebar-nav-item ${activeNav === item.id ? "active" : ""}`}
              style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", position: "relative" }}
              data-testid={`button-nav-${item.id}`}
            >
              {icons[item.icon]}
              {item.label}
              {/* New leads notification dot */}
              {item.id === "leads" && newLeadsCount > 0 && activeNav !== "leads" && (
                <span style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
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
              onClick={() => setNewPageWizardOpen(true)}
              className="sidebar-nav-item"
              style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", color: "var(--color-primary)", fontWeight: 600 }}
              data-testid="button-new-page-wizard"
            >
              {icons.plus} New page
            </button>
          </div>
        </div>

        {/* Bottom actions */}
        <div style={{ padding: "0.75rem 0.5rem", borderTop: "1px solid var(--color-divider)" }}>
          <button
            onClick={() => setHelpOpen(true)}
            className="sidebar-nav-item"
            style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left" }}
            aria-label="Help"
            data-testid="button-help"
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", border: "1.5px solid currentColor", fontSize: 11, fontWeight: 800 }}>?</span>
            Help &amp; guides
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="sidebar-nav-item"
            style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left" }}
            aria-label="Toggle theme"
            data-testid="button-toggle-theme"
          >
            {theme === "dark" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={async () => { await logout(); navigate("/"); }}
            className="sidebar-nav-item"
            style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left" }}
            data-testid="button-logout"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {renderPanel()}
      </div>

      <NewPageWizardModal
        open={newPageWizardOpen}
        onClose={() => setNewPageWizardOpen(false)}
        onCreated={(id) => setActivePageId(id)}
      />

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
                <li>• Choose a <b>theme preset</b> in Settings for instant restyling.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
