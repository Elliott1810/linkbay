import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Step = "signup" | "usecase" | "demo" | "confirmed";

export default function WaitlistPage() {
  const [step, setStep] = useState<Step>("signup");
  const [form, setForm] = useState({ name: "", email: "", useCase: "" });
  const [demoRequested, setDemoRequested] = useState(false);

  const { data: countData } = useQuery({
    queryKey: ["/api/waitlist/count"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/waitlist/count");
      return res.json();
    },
  });

  const waitlistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/waitlist", {
        email: form.email,
        name: form.name,
        useCase: form.useCase,
        source: "waitlist-page",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist/count"] });
      setStep("confirmed");
    },
  });

  const demoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/demo", {
        name: form.name,
        email: form.email,
        message: "Booked from waitlist page",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => setDemoRequested(true),
  });

  const useCases = [
    { id: "consultant", icon: "💼", label: "Consultant / Coach" },
    { id: "creator", icon: "🎨", label: "Creator / Influencer" },
    { id: "recruiter", icon: "🔍", label: "Recruiter / HR" },
    { id: "founder", icon: "⚡", label: "Founder / Startup" },
    { id: "agency", icon: "📣", label: "Agency" },
    { id: "other", icon: "✦", label: "Something else" },
  ];

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 1.25rem" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>

          {/* Progress indicator */}
          {step !== "confirmed" && (
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", justifyContent: "center" }}>
              {["signup", "usecase", "demo"].map((s, i) => {
                const steps = ["signup", "usecase", "demo"];
                const currentIdx = steps.indexOf(step);
                const isActive = steps.indexOf(s) <= currentIdx;
                return (
                  <div key={s} style={{
                    height: 4, borderRadius: 999,
                    flex: 1,
                    maxWidth: 60,
                    background: isActive ? "var(--color-primary)" : "var(--color-surface-dynamic)",
                    transition: "background 0.3s ease"
                  }} />
                );
              })}
            </div>
          )}

          {/* ─── Step 1: Email signup ─── */}
          {step === "signup" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚀</div>
                <h1 className="text-section-title" style={{ marginBottom: "0.75rem" }}>Get early access to Linkbay</h1>
                <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)" }}>
                  Join {countData?.count || "847"}+ professionals on the waitlist. We're rolling out access weekly.
                </p>
              </div>

              <div className="card-elevated" style={{ padding: "2rem" }}>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (form.name && form.email) setStep("usecase");
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                  <div>
                    <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>
                      Your name
                    </label>
                    <input
                      className="input"
                      placeholder="Sarah Jones"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>
                      Work email
                    </label>
                    <input
                      type="email"
                      className="input"
                      placeholder="sarah@company.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }} data-testid="button-next-step">
                    Continue →
                  </button>
                </form>

                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", textAlign: "center", marginTop: "1rem" }}>
                  🔒 We never share your email. Unsubscribe any time.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "2rem" }}>
                {[
                  { icon: "⚡", text: "3-min setup" },
                  { icon: "🆓", text: "Free forever plan" },
                  { icon: "🤖", text: "AI-powered" },
                ].map(item => (
                  <div key={item.text} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
                    {item.icon} {item.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Step 2: Use case ─── */}
          {step === "usecase" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h2 className="text-section-title" style={{ marginBottom: "0.75rem" }}>Hi {form.name.split(" ")[0]}! What best describes you?</h2>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  We'll personalise your Linkbay experience based on your answer.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {useCases.map(uc => (
                  <button
                    key={uc.id}
                    onClick={() => setForm(f => ({ ...f, useCase: uc.id }))}
                    style={{
                      padding: "1.25rem 1rem", borderRadius: "var(--radius-lg)", cursor: "pointer",
                      background: form.useCase === uc.id ? "var(--color-primary-highlight)" : "var(--color-surface)",
                      border: `1.5px solid ${form.useCase === uc.id ? "var(--color-primary)" : "var(--color-border)"}`,
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.375rem",
                      transition: "all var(--transition-interactive)"
                    }}
                    data-testid={`button-usecase-${uc.id}`}
                  >
                    <span style={{ fontSize: "1.5rem" }}>{uc.icon}</span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: form.useCase === uc.id ? "var(--color-primary)" : "var(--color-text)" }}>{uc.label}</span>
                  </button>
                ))}
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={!form.useCase || waitlistMutation.isPending}
                onClick={() => waitlistMutation.mutate()}
                data-testid="button-submit-waitlist"
              >
                {waitlistMutation.isPending ? "Joining…" : "Join the waitlist →"}
              </button>

              {waitlistMutation.error && (
                <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", textAlign: "center", marginTop: "0.75rem" }}>
                  {(waitlistMutation.error as Error).message}
                </p>
              )}

              <button
                onClick={() => setStep("signup")}
                style={{ display: "block", width: "100%", textAlign: "center", marginTop: "1rem", fontSize: "var(--text-sm)", color: "var(--color-text-faint)", background: "none", border: "none", cursor: "pointer" }}
              >
                ← Back
              </button>
            </div>
          )}

          {/* ─── Step 3: Confirmed ─── */}
          {step === "confirmed" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1.25rem" }}>🎉</div>
              <h2 className="text-section-title" style={{ marginBottom: "0.75rem" }}>You're on the list, {form.name.split(" ")[0]}!</h2>
              <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)", marginBottom: "2rem", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
                We're rolling out access every week. You'll get an email as soon as your spot is ready — usually within 48 hours.
              </p>

              {/* While you wait block */}
              <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "1rem" }}>While you wait</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <Link href="/templates" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "var(--color-text)", padding: "0.75rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontSize: "1.25rem" }}>🎨</span>
                    <div>
                      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Browse templates</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>See what your page could look like</div>
                    </div>
                  </Link>
                  <Link href="/p/sarah-jones-consultant" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "var(--color-text)", padding: "0.75rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontSize: "1.25rem" }}>👁️</span>
                    <div>
                      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>View a live example page</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>See how a consultant page works</div>
                    </div>
                  </Link>
                  <Link href="/features" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "var(--color-text)", padding: "0.75rem", background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontSize: "1.25rem" }}>⚡</span>
                    <div>
                      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Explore all features</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>AI builder, analytics, lead capture</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Book a demo */}
              {!demoRequested ? (
                <div style={{ padding: "1.5rem", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.375rem" }}>Want a personal walkthrough?</div>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                    Book a 20-minute demo and we'll set up your page live with you.
                  </p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => demoMutation.mutate()}
                    disabled={demoMutation.isPending}
                    data-testid="button-book-demo"
                  >
                    {demoMutation.isPending ? "Booking…" : "📅 Book a demo →"}
                  </button>
                </div>
              ) : (
                <div style={{ padding: "1.25rem", background: "var(--color-primary-highlight)", border: "1.5px solid var(--color-primary)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontWeight: 700, color: "var(--color-primary)" }}>✓ Demo request sent!</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>We'll email you a calendar link within 2 hours.</div>
                </div>
              )}

              <Link href="/" style={{ display: "inline-block", marginTop: "1.5rem", fontSize: "var(--text-sm)", color: "var(--color-text-faint)", textDecoration: "none" }}>
                ← Back to homepage
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
