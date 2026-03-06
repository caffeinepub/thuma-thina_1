import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CheckCircle, Clock, Phone } from "lucide-react";

export function PendingApprovalPage() {
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
              text: "Once approved, you can log in and start working",
            },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-3">
              <item.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link to="/login">
            <Button className="w-full" data-ocid="auth.login.primary_button">
              Go to Login
            </Button>
          </Link>
          <Link to="/">
            <Button
              variant="outline"
              className="w-full"
              data-ocid="auth.home.button"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
