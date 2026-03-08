import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppUserRole } from "../../backend.d";
import { useAuth } from "../../context/AuthContext";

const ROLE_REDIRECTS: Record<AppUserRole, string> = {
  [AppUserRole.customer]: "/catalogue",
  [AppUserRole.shopper]: "/shopper/available",
  [AppUserRole.driver]: "/driver/available",
  [AppUserRole.operator]: "/operator/incoming",
  [AppUserRole.admin]: "/admin/approvals",
};

export function LoginPage() {
  const {
    login,
    isAuthenticated,
    isLoading,
    userRole,
    userProfile,
    needsRegistration,
  } = useAuth();
  const navigate = useNavigate();
  const [showExplainer, setShowExplainer] = useState(false);

  // Redirect after successful login
  useEffect(() => {
    if (!isAuthenticated) return;

    // Profile fetch complete and profile found → go to role dashboard
    if (userRole && userProfile) {
      const dest = ROLE_REDIRECTS[userRole] ?? "/catalogue";
      navigate({ to: dest });
      return;
    }

    // Authenticated but no profile → new user, go to registration
    if (needsRegistration) {
      navigate({ to: "/register/customer" });
    }
  }, [isAuthenticated, userRole, userProfile, needsRegistration, navigate]);

  const handleLogin = () => {
    try {
      login();
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  const handleClearAndRetry = () => {
    try {
      // Clear all local storage to remove any broken auth state, then reload
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-display font-bold text-xl">
              TT
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sign in to Thuma Thina
          </p>
        </div>

        <Card className="card-glow" data-ocid="auth.login.modal">
          <CardHeader className="pb-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-display text-lg">Secure Login</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Thuma Thina uses{" "}
              <strong className="text-foreground">Internet Identity</strong> — a
              secure, password-free login built on the Internet Computer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full gap-2 h-11 text-base font-semibold"
              onClick={handleLogin}
              disabled={isLoading}
              data-ocid="auth.login.submit_button"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Fingerprint className="h-5 w-5" />
              )}
              {isLoading ? "Connecting…" : "Login with Internet Identity"}
            </Button>

            {/* Explainer toggle */}
            <button
              type="button"
              className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors px-1"
              onClick={() => setShowExplainer((v) => !v)}
              data-ocid="auth.explainer.toggle"
            >
              <span>What is Internet Identity?</span>
              {showExplainer ? (
                <ChevronUp className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" />
              )}
            </button>

            {showExplainer && (
              <div className="rounded-lg bg-muted/60 border border-border/50 p-4 text-sm text-muted-foreground leading-relaxed space-y-2">
                <p>
                  <strong className="text-foreground">
                    No passwords needed.
                  </strong>{" "}
                  Internet Identity uses your device's biometric (fingerprint,
                  Face ID) or a passkey to authenticate you securely.
                </p>
                <p>
                  It is built on the Internet Computer blockchain and gives you
                  complete control of your identity — no company holds your
                  credentials.
                </p>
                <a
                  href="https://identity.ic0.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium hover:underline block"
                >
                  Learn more at identity.ic0.app →
                </a>
              </div>
            )}

            {/* Stuck state recovery — shown if button doesn't respond */}
            <p className="text-xs text-center text-muted-foreground/60 pt-1">
              Login button not responding?{" "}
              <button
                type="button"
                className="text-primary/70 hover:text-primary underline"
                onClick={handleClearAndRetry}
                data-ocid="auth.reset.button"
              >
                Reset and try again
              </button>
            </p>
          </CardContent>
        </Card>

        {/* Registration links */}
        <div className="mt-6 space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            New customer?{" "}
            <Link
              to="/register/customer"
              className="text-primary font-medium hover:underline"
              data-ocid="auth.register.link"
            >
              Create an account
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Want to join our team?{" "}
            <Link
              to="/register/staff"
              className="text-primary font-medium hover:underline"
              data-ocid="auth.staff.link"
            >
              Apply as staff
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
