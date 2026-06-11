import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

function parseApiError(err: Error): string {
  const match = err.message.match(/^(\d+): (.+)$/);
  if (match) {
    try { return JSON.parse(match[2]).error || match[2]; } catch { return match[2]; }
  }
  return err.message;
}

const Logo = () => (
  <svg width="120" height="32" viewBox="0 0 120 32" fill="none" aria-label="Linkbay" role="img">
    <rect x="0" y="4" width="10" height="24" rx="3" fill="currentColor" opacity="0.9"/>
    <rect x="13" y="9" width="10" height="19" rx="3" fill="currentColor" opacity="0.7"/>
    <rect x="26" y="14" width="10" height="14" rx="3" fill="var(--color-primary)"/>
    <text x="42" y="22" fontFamily="Cabinet Grotesk, sans-serif" fontWeight="800" fontSize="17" fill="currentColor" letterSpacing="-0.5">linkbay</text>
  </svg>
);

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

/** Extract ?token=... from the current URL (wouter doesn't parse search params). */
function useTokenParam(): string | null {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  return params.get("token");
}

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const token = useTokenParam();

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/auth/reset-password", { token, newPassword });
      return res as unknown as { success: boolean; message: string };
    },
    onSuccess: () => {
      setSuccess(true);
      setError("");
      setTimeout(() => navigate("/login"), 3000);
    },
    onError: (err: Error) => {
      setError(parseApiError(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError("No reset token found. Please request a new reset link."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    mutation.mutate({ token, newPassword });
  };

  // No token in URL
  if (!token) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 40, marginBottom: "1rem" }}>🔗</div>
          <h1 style={{ fontFamily: "Cabinet Grotesk, sans-serif", fontWeight: 800, fontSize: "var(--text-xl)", marginBottom: "0.5rem" }}>Invalid reset link</h1>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>This link is missing a reset token. Please request a new one.</p>
          <Link href="/forgot-password" className="btn btn-primary" style={{ textDecoration: "none" }}>Request new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div className="auth-top-bar" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ color: "var(--color-text)", textDecoration: "none" }}>
          <Logo />
        </Link>
        <Link href="/login" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}>
          Back to login →
        </Link>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div className="auth-heading" style={{ marginBottom: "2rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>
              {success ? "Password updated" : "Set new password"}
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              {success ? "Redirecting you to login…" : "Choose a strong password for your account."}
            </p>
          </div>

          <div className="card" style={{ padding: "2rem" }}>
            {success ? (
              <div style={{ textAlign: "center" }}>
                <div style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1.5px solid rgba(16,185,129,0.3)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}>
                  <div style={{ fontSize: 32, marginBottom: "0.5rem" }}>✅</div>
                  <p style={{ fontWeight: 700, color: "#10b981", marginBottom: "0.25rem" }}>Password changed successfully</p>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>You'll be redirected to the login page in a moment.</p>
                </div>
                <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none", display: "block", textAlign: "center" }}>
                  Log in now →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* New password */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    New password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      className="input"
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(""); }}
                      placeholder="At least 8 characters"
                      autoFocus
                      autoComplete="new-password"
                      style={{ fontSize: 16, paddingRight: "2.75rem" }}
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 0, display: "flex" }}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      <EyeIcon show={showPw} />
                    </button>
                  </div>
                  {/* Strength hint */}
                  {newPassword.length > 0 && (
                    <p style={{ fontSize: 11, marginTop: "0.25rem", color: newPassword.length >= 12 ? "#10b981" : newPassword.length >= 8 ? "var(--color-primary)" : "var(--color-danger, #ef4444)" }}>
                      {newPassword.length >= 12 ? "Strong password" : newPassword.length >= 8 ? "Acceptable — longer is better" : "Too short"}
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Confirm password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      className="input"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError(""); }}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      style={{ fontSize: 16, paddingRight: "2.75rem" }}
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 0, display: "flex" }}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      <EyeIcon show={showConfirm} />
                    </button>
                  </div>
                  {confirm.length > 0 && newPassword !== confirm && (
                    <p style={{ fontSize: 11, marginTop: "0.25rem", color: "var(--color-danger, #ef4444)" }}>Passwords don't match</p>
                  )}
                </div>

                {error && (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-danger, #ef4444)", marginBottom: "1rem", padding: "0.625rem 0.875rem", background: "rgba(239,68,68,0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {error}{" "}
                    {error.includes("invalid or has expired") && (
                      <Link href="/forgot-password" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Request new link →</Link>
                    )}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={mutation.isPending || newPassword !== confirm || newPassword.length < 8}
                  style={{ width: "100%", justifyContent: "center" }}
                  data-testid="button-reset-submit"
                >
                  {mutation.isPending ? "Saving…" : "Set new password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
