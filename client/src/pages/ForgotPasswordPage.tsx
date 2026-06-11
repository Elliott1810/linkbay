import { useState } from "react";
import { Link } from "wouter";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
      return res as unknown as { success: boolean; resetUrl?: string; message: string };
    },
    onSuccess: (data) => {
      setError("");
      setResetUrl(data.resetUrl ?? null);
    },
    onError: (err: Error) => {
      setError(parseApiError(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setError("");
    mutation.mutate(email.trim().toLowerCase());
  };

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
          {/* Heading */}
          <div className="auth-heading" style={{ marginBottom: "2rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>
              Reset your password
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Enter your account email and we'll generate a secure reset link.
            </p>
          </div>

          <div className="card" style={{ padding: "2rem" }}>
            {resetUrl ? (
              /* Success state */
              <div>
                <div style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1.5px solid rgba(16,185,129,0.3)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.25rem",
                  marginBottom: "1.5rem",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 28, marginBottom: "0.5rem" }}>🔐</div>
                  <p style={{ fontWeight: 700, color: "#10b981", marginBottom: "0.25rem" }}>Reset link generated</p>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                    In production this would be emailed. Click the link below to continue.
                  </p>
                </div>
                <a
                  href={resetUrl}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
                >
                  Continue to reset password →
                </a>
                <button
                  onClick={() => { setResetUrl(null); setEmail(""); }}
                  className="btn btn-ghost btn-sm"
                  style={{ width: "100%", justifyContent: "center", marginTop: "0.75rem" }}
                >
                  Use a different email
                </button>
              </div>
            ) : (
              /* Form state */
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@example.com"
                    autoFocus
                    autoComplete="email"
                    style={{ fontSize: 16 }}
                    data-testid="input-forgot-email"
                  />
                </div>

                {error && (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-danger, #ef4444)", marginBottom: "1rem", padding: "0.625rem 0.875rem", background: "rgba(239,68,68,0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={mutation.isPending}
                  style={{ width: "100%", justifyContent: "center" }}
                  data-testid="button-forgot-submit"
                >
                  {mutation.isPending ? "Generating link…" : "Send reset link"}
                </button>

                <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  Remember your password?{" "}
                  <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
                    Log in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
