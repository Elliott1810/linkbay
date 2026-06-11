import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseApiError(err: Error): string {
  const match = err.message.match(/^(\d+): (.+)$/);
  if (match) {
    try { return JSON.parse(match[2]).error || match[2]; } catch { return match[2]; }
  }
  return err.message;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return iso; }
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
const Logo = () => (
  <svg width="100" height="26" viewBox="0 0 120 32" fill="none" aria-label="Linkbay" role="img">
    <rect x="0" y="4" width="10" height="24" rx="3" fill="currentColor" opacity="0.9"/>
    <rect x="13" y="9" width="10" height="19" rx="3" fill="currentColor" opacity="0.7"/>
    <rect x="26" y="14" width="10" height="14" rx="3" fill="var(--color-primary)"/>
    <text x="42" y="22" fontFamily="Cabinet Grotesk, sans-serif" fontWeight="800" fontSize="17" fill="currentColor" letterSpacing="-0.5">linkbay</text>
  </svg>
);

// ─── Eye icon ─────────────────────────────────────────────────────────────────
function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>
      {children}
    </p>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, padding: "0.75rem 1.25rem",
      background: type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)",
      border: `1.5px solid ${type === "success" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.3)"}`,
      color: type === "success" ? "#10b981" : "#ef4444",
      borderRadius: "var(--radius-lg)",
      fontWeight: 600, fontSize: "var(--text-sm)",
      backdropFilter: "blur(8px)",
      whiteSpace: "nowrap",
      boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
    }}>
      {type === "success" ? "✓ " : "✕ "}{msg}
    </div>
  );
}

// ─── Profile form ─────────────────────────────────────────────────────────────
function ProfileForm({ account }: { account: { id: number; email: string; name: string; avatarUrl: string | null; createdAt: string } }) {
  const [name, setName] = useState(account.name);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("PUT", "/api/account", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      showToast("Profile updated", "success");
    },
    onError: (err: Error) => {
      showToast(parseApiError(err), "error");
    },
  });

  const dirty = name.trim() !== account.name;

  return (
    <div className="card" style={{ padding: "1.75rem", marginBottom: "1.5rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, sans-serif", fontWeight: 800, fontSize: "var(--text-base)", marginBottom: "0.25rem" }}>
        Profile information
      </h2>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
        Update your display name. Email changes require re-verification and are not supported yet.
      </p>

      {/* Avatar placeholder + email (read-only) */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", padding: "1rem", background: "var(--color-surface-dynamic)", borderRadius: "var(--radius-md)" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--color-primary), #c45a10)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 20, color: "#fff", flexShrink: 0,
          fontFamily: "Cabinet Grotesk, sans-serif",
        }}>
          {account.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 700, marginBottom: "0.125rem" }}>{account.name}</p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{account.email}</p>
          <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: "0.125rem" }}>
            Member since {formatDate(account.createdAt)}
          </p>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); if (dirty) mutation.mutate(name.trim()); }}>
        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel>Display name</SectionLabel>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={80}
            placeholder="Your full name"
            style={{ fontSize: 16 }}
            data-testid="input-account-name"
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <SectionLabel>Email address</SectionLabel>
          <input
            className="input"
            value={account.email}
            readOnly
            disabled
            style={{ fontSize: 16, opacity: 0.6, cursor: "not-allowed" }}
            title="Email cannot be changed"
          />
          <p style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: "0.25rem" }}>Email address cannot be changed at this time.</p>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!dirty || mutation.isPending || name.trim().length === 0}
          style={{ minWidth: 120 }}
          data-testid="button-save-profile"
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
      </form>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ─── Change password form ──────────────────────────────────────────────────────
function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const mutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      return apiRequest("PUT", "/api/account/password", { currentPassword, newPassword });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setError("");
      showToast("Password changed successfully", "success");
    },
    onError: (err: Error) => {
      const msg = parseApiError(err);
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { setError("Please enter your current password."); return; }
    if (newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirm) { setError("Passwords don't match."); return; }
    setError("");
    mutation.mutate({ currentPassword, newPassword });
  };

  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirm && !mutation.isPending;

  const pwStrength = newPassword.length === 0 ? null : newPassword.length >= 12 ? "strong" : newPassword.length >= 8 ? "ok" : "weak";
  const pwStrengthColor = pwStrength === "strong" ? "#10b981" : pwStrength === "ok" ? "var(--color-primary)" : "#ef4444";
  const pwStrengthLabel = pwStrength === "strong" ? "Strong" : pwStrength === "ok" ? "Acceptable" : "Too short";

  return (
    <div className="card" style={{ padding: "1.75rem", marginBottom: "1.5rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, sans-serif", fontWeight: 800, fontSize: "var(--text-base)", marginBottom: "0.25rem" }}>
        Change password
      </h2>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
        You'll need to enter your current password to confirm the change.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Current password */}
        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel>Current password</SectionLabel>
          <div style={{ position: "relative" }}>
            <input
              type={showCurrent ? "text" : "password"}
              className="input"
              value={currentPassword}
              onChange={e => { setCurrentPassword(e.target.value); setError(""); }}
              placeholder="Your current password"
              autoComplete="current-password"
              style={{ fontSize: 16, paddingRight: "2.75rem" }}
              data-testid="input-current-password"
            />
            <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 0, display: "flex" }} aria-label="Toggle password visibility">
              <EyeIcon show={showCurrent} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--color-divider)", margin: "1.25rem 0" }} />

        {/* New password */}
        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel>New password</SectionLabel>
          <div style={{ position: "relative" }}>
            <input
              type={showNew ? "text" : "password"}
              className="input"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setError(""); }}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              style={{ fontSize: 16, paddingRight: "2.75rem" }}
              data-testid="input-new-password"
            />
            <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 0, display: "flex" }} aria-label="Toggle password visibility">
              <EyeIcon show={showNew} />
            </button>
          </div>
          {pwStrength && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.375rem" }}>
              <div style={{ flex: 1, height: 3, borderRadius: 999, background: "var(--color-surface-dynamic)", overflow: "hidden" }}>
                <div style={{ width: pwStrength === "strong" ? "100%" : pwStrength === "ok" ? "60%" : "25%", height: "100%", background: pwStrengthColor, transition: "width 0.3s, background 0.3s", borderRadius: 999 }} />
              </div>
              <p style={{ fontSize: 11, color: pwStrengthColor, fontWeight: 600, minWidth: 70 }}>{pwStrengthLabel}</p>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div style={{ marginBottom: "1.25rem" }}>
          <SectionLabel>Confirm new password</SectionLabel>
          <div style={{ position: "relative" }}>
            <input
              type={showConfirm ? "text" : "password"}
              className="input"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(""); }}
              placeholder="Repeat new password"
              autoComplete="new-password"
              style={{ fontSize: 16, paddingRight: "2.75rem" }}
              data-testid="input-confirm-password"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 0, display: "flex" }} aria-label="Toggle password visibility">
              <EyeIcon show={showConfirm} />
            </button>
          </div>
          {confirm.length > 0 && newPassword !== confirm && (
            <p style={{ fontSize: 11, marginTop: "0.25rem", color: "#ef4444" }}>Passwords don't match</p>
          )}
        </div>

        {error && (
          <p style={{ fontSize: "var(--text-sm)", color: "#ef4444", marginBottom: "1rem", padding: "0.625rem 0.875rem", background: "rgba(239,68,68,0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!canSubmit}
          style={{ minWidth: 140 }}
          data-testid="button-change-password"
        >
          {mutation.isPending ? "Changing…" : "Change password"}
        </button>
      </form>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ─── Security info card ───────────────────────────────────────────────────────
function SecurityInfoCard() {
  return (
    <div className="card" style={{ padding: "1.25rem 1.75rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, sans-serif", fontWeight: 800, fontSize: "var(--text-sm)", marginBottom: "0.75rem" }}>
        🔒 Security tips
      </h2>
      <ul style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem", margin: 0 }}>
        <li>Use a unique password not used elsewhere</li>
        <li>Longer passwords (12+ characters) are significantly stronger</li>
        <li>Consider a password manager like 1Password or Bitwarden</li>
        <li>Never share your password with anyone</li>
      </ul>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AccountSettingsPage() {
  const [, navigate] = useLocation();

  const { data: authData } = useQuery<{ user: { id: number; email: string; name: string; avatarUrl?: string | null } | null }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: account, isLoading, isError } = useQuery<{
    id: number;
    email: string;
    name: string;
    avatarUrl: string | null;
    createdAt: string;
  }>({
    queryKey: ["/api/account"],
    enabled: !!authData?.user,
  });

  // Not logged in
  if (!authData?.user) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }}>You need to be logged in to access account settings.</p>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)" }}>
      {/* Top bar */}
      <div style={{
        height: 56,
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center",
        padding: "0 1.25rem",
        gap: "1rem",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <Link href="/dashboard" style={{ color: "var(--color-text)", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Logo />
        </Link>
        <div style={{ flex: 1 }} />
        <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ gap: "0.375rem" }}>
          ← Dashboard
        </Link>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
        {/* Page header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "Cabinet Grotesk, sans-serif", fontWeight: 800, fontSize: "var(--text-2xl)", marginBottom: "0.25rem" }}>
            Account settings
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Manage your profile information and security settings.
          </p>
        </div>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "var(--text-sm)", color: "var(--color-text-faint)", marginBottom: "1.75rem" }}>
          <Link href="/dashboard" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Dashboard</Link>
          <span>›</span>
          <span style={{ color: "var(--color-text)" }}>Account settings</span>
        </nav>

        {isLoading && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-faint)" }}>
            Loading account information…
          </div>
        )}

        {isError && (
          <div style={{ padding: "1.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-lg)", color: "#ef4444", marginBottom: "1.5rem" }}>
            Failed to load account information. Please refresh the page.
          </div>
        )}

        {account && (
          <>
            <ProfileForm account={account} />
            <ChangePasswordForm />
            <SecurityInfoCard />

            {/* Forgot password shortcut */}
            <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: "var(--text-sm)", marginBottom: "0.125rem" }}>Forgotten your password?</p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Use the reset flow to set a new password without knowing the old one.</p>
              </div>
              <Link href="/forgot-password" className="btn btn-secondary btn-sm" style={{ textDecoration: "none", flexShrink: 0 }}>
                Reset password
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
