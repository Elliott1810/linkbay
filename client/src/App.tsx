import { Switch, Route, Router, useLocation } from "wouter";
import { QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState, createContext, useContext } from "react";

// Pages
import HomePage from "./pages/HomePage";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import TemplatesPage from "./pages/TemplatesPage";
import BlogPage from "./pages/BlogPage";
import BlogArticlePage from "./pages/BlogArticlePage";
import WaitlistPage from "./pages/WaitlistPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import BuilderPage from "./pages/BuilderPage";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import OnboardingWizardPage from "./pages/OnboardingWizardPage";
import NotFound from "./pages/not-found";

// ─── Theme context ─────────────────────────────────────────────
export const ThemeCtx = createContext<{
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
}>({ theme: "light", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeCtx);
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

// ─── Auth context ──────────────────────────────────────────────
interface AuthUser {
  id: number;
  email: string;
  name: string;
}

interface AuthCtxType {
  user: AuthUser | null;
  pages: any[];
  isLoading: boolean;
  logout: () => Promise<void>;
  refetch: () => void;
}

export const AuthCtx = createContext<AuthCtxType>({
  user: null,
  pages: [],
  isLoading: true,
  logout: async () => {},
  refetch: () => {},
});

export function useAuth() {
  return useContext(AuthCtx);
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/me");
        return res.json();
      } catch {
        return { user: null, pages: [] };
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const logout = async () => {
    try { await apiRequest("POST", "/api/auth/logout"); } catch {}
    qc.setQueryData(["/api/auth/me"], { user: null, pages: [] });
    qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  return (
    <AuthCtx.Provider value={{
      user: data?.user ?? null,
      pages: data?.pages ?? [],
      isLoading,
      logout,
      refetch: () => refetch(),
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

// ─── Router ────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/features" component={FeaturesPage} />
              <Route path="/pricing" component={PricingPage} />
              <Route path="/templates" component={TemplatesPage} />
              <Route path="/blog" component={BlogPage} />
              <Route path="/blog/:slug" component={BlogArticlePage} />
              <Route path="/waitlist" component={WaitlistPage} />
              <Route path="/builder" component={BuilderPage} />
              <Route path="/login" component={() => <AuthPage mode="login" />} />
              <Route path="/signup" component={() => { window.location.replace("/builder"); return null; }} />
              <Route path="/forgot-password" component={ForgotPasswordPage} />
              <Route path="/reset-password" component={ResetPasswordPage} />
              <Route path="/account" component={AccountSettingsPage} />
              <Route path="/onboarding" component={OnboardingWizardPage} />
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/:username" component={ProfilePage} />
              <Route component={NotFound} />
            </Switch>
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
