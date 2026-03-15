import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle, Clock, LogOut, Phone, ShoppingCart } from "lucide-react";
import { useEffect } from "react";
import {
  AppUserRole,
  Variant_active_pending_updateNeeded_rejected,
} from "../../backend.d";
import { useAuth } from "../../context/AuthContext";
import { useActor } from "../../hooks/useActor";

const ROLE_REDIRECTS: Record<AppUserRole, string> = {
  [AppUserRole.customer]: "/catalogue",
  [AppUserRole.shopper]: "/shopper/available",
  [AppUserRole.driver]: "/driver/available",
  [AppUserRole.operator]: "/operator/incoming",
  [AppUserRole.admin]: "/admin/approvals",
};

export function PendingApprovalPage() {
  const { logout, refetchProfile, userProfile, userRole } = useAuth();
  const { actor } = useActor();
  const navigate = useNavigate();

  // Poll for approval every 8 seconds
  useEffect(() => {
    const check = async () => {
      if (!actor) return;
      try {
        const approved = await actor.isCallerApproved();
        if (approved) {
          await refetchProfile();
        }
      } catch {
        // ignore polling errors
      }
    };

    // Initial check
    check();

    const interval = setInterval(check, 8000);
    return () => clearInterval(interval);
  }, [refetchProfile, actor]);

  // When profile status becomes active, redirect
  useEffect(() => {
    if (
      userProfile?.registrationStatus ===
        Variant_active_pending_updateNeeded_rejected.active &&
      userRole
    ) {
      const dest = ROLE_REDIRECTS[userRole] ?? "/";
      navigate({ to: dest });
    }
  }, [userProfile, userRole, navigate]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-warning/20 border-2 border-warning/40 flex items-center justify-center mx-auto mb-6">
          <Clock className="h-8 w-8 text-warning-foreground" />
        </div>
        <h1 className="font-display font-bold text-2xl mb-3">
          Application Received!
        </h1>
        <p className="text-muted-foreground text-base mb-6 leading-relaxed">
          Thank you for applying to join the Thuma Thina team. Your application
          is being reviewed by our admin team and you will be notified once
          approved.
        </p>

        <div className="bg-card border border-border/60 rounded-xl p-5 mb-6 text-left space-y-3 card-glow">
          <h3 className="font-display font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            What happens next?
          </h3>
          {[
            {
              icon: CheckCircle,
              text: "Your application is in our review queue",
            },
            {
              icon: Phone,
              text: "Our admin team may contact you for verification",
            },
            {
              icon: CheckCircle,
              text: "This page will automatically redirect when you are approved",
            },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-3">
              <item.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground mb-6">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Checking approval status automatically…
        </div>

        <div className="flex flex-col gap-2">
          <Link to="/catalogue">
            <Button
              variant="default"
              className="w-full gap-2"
              data-ocid="auth.continue_shopping.button"
            >
              <ShoppingCart className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={logout}
            data-ocid="auth.logout.button"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
