import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Helper: parse HTTP status from apiRequest error messages like "409: {...}"
function parseApiError(err: Error): { status: number | null; message: string } {
  const match = err.message.match(/^(\d+): (.+)$/);
  if (match) {
    const status = parseInt(match[1], 10);
    try {
      const parsed = JSON.parse(match[2]);
      return { status, message: parsed.error || parsed.message || match[2] };
    } catch {
      return { status, message: match[2] };
    }
  }
  return { status: null, message: err.message };
}

// SVG Logo inline
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

export default function AuthPage({ mode: initialMode = "login" }: { mode?: "login" | "signup" }) {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const mutation = useMutation({
    mutationFn: async () => {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = mode === "signup"
        ? { email: form.email, name: form.name, password: form.password }
        : { email: form.email, password: form.password };
      const res = await apiRequest("POST", endpoint, body);
      return res.json();
    },
    onSuccess: async () => {
      // Invalidate auth cache so AuthProvider re-fetches session
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/dashboard");
    },
    onError: (err: Error) => {
      const { status, message } = parseApiError(err);
      if (status === 409 && mode === "signup") {
        setIsDuplicateEmail(true);
        setError("");
      } else {
        setIsDuplicateEmail(false);
        setError(message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsDuplicateEmail(false);
    if (!form.email || !form.password) return;
    if (mode === "signup" && !form.name.trim()) return;
    mutation.mutate();
  };

  const field = (key: keyof typeof form, placeholder: string, type = "text") => (
    <div>
      <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {placeholder}
      </label>
      {key === "password" ? (
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            className="input"
            placeholder={mode === "signup" ? "Min. 8 characters" : "Enter your password"}
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            style={{ paddingRight: "2.75rem" }}
            data-testid="input-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", padding: 0 }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <EyeIcon show={showPassword} />
          </button>
        </div>
      ) : (
        <input
          type={type}
          className="input"
          placeholder={key === "name" ? "Sarah Jones" : "you@company.com"}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          required={key !== "name" || mode === "signup"}
          data-testid={`input-${key}`}
        />
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ color: "var(--color-text)", textDecoration: "none" }}>
          <Logo />
        </Link>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600, fontSize: "inherit" }}
          >
            {mode === "login" ? "Sign up free" : "Sign in"}
          </button>
        </span>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Heading */}
          <div style={{ marginBottom: "2rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "Cabinet Grotesk, sans-serif", marginBottom: "0.5rem" }}>
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              {mode === "login"
                ? "Sign in to manage your Linkbay page."
                : "Build your page in under 3 minutes. Free forever."}
            </p>
          </div>

          {/* Form card */}
          <div className="card-elevated" style={{ padding: "2rem" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {mode === "signup" && field("name", "Full name")}
              {field("email", "Email address", "email")}
              {field("password", "Password")}

              {/* Duplicate email notice */}
              {isDuplicateEmail && (
                <div style={{ padding: "0.875rem 1rem", background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                  An account with this email already exists.{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setIsDuplicateEmail(false); setError(""); }}
                    style={{ color: "var(--color-primary)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: "inherit", padding: 0 }}
                    data-testid="link-signin-instead"
                  >
                    Sign in instead →
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ padding: "0.75rem 1rem", background: "var(--color-error)18", border: "1.5px solid var(--color-error)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
                  {error}
                </div>
              )}

              {/* Forgot password link */}
              {mode === "login" && (
                <div style={{ textAlign: "right", marginTop: "-0.75rem" }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
                    Forgot password? <Link href="/waitlist" style={{ color: "var(--color-primary)" }}>Contact support →</Link>
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", fontSize: "var(--text-base)", padding: "0.875rem" }}
                disabled={mutation.isPending}
                data-testid="button-auth-submit"
              >
                {mutation.isPending
                  ? (mode === "login" ? "Signing in…" : "Creating account…")
                  : (mode === "login" ? "Sign in" : "Create account")}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--color-divider)" }} />
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "var(--color-divider)" }} />
            </div>

            {/* Builder shortcut */}
            <Link href="/builder" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              Build a page without signing up →
            </Link>
          </div>

          {/* Terms */}
          {mode === "signup" && (
            <p style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginTop: "1rem", lineHeight: 1.6 }}>
              By creating an account you agree to our{" "}
              <Link href="/" style={{ color: "var(--color-text-muted)" }}>Terms of Service</Link>{" "}
              and{" "}
              <Link href="/" style={{ color: "var(--color-text-muted)" }}>Privacy Policy</Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
