import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { DemoRole } from "../../data/mockData";

const DEMO_ACCOUNTS: {
  email: string;
  password: string;
  role: DemoRole;
  name: string;
}[] = [
  {
    email: "ntombi@example.com",
    password: "password",
    role: "customer",
    name: "Ntombi Cele",
  },
  {
    email: "sipho@example.com",
    password: "password",
    role: "shopper",
    name: "Sipho Dlamini",
  },
  {
    email: "zanele@example.com",
    password: "password",
    role: "driver",
    name: "Zanele Mthembu",
  },
  {
    email: "nomvula@example.com",
    password: "password",
    role: "operator",
    name: "Nomvula Zulu",
  },
  {
    email: "admin@example.com",
    password: "password",
    role: "admin",
    name: "Admin",
  },
];

const ROLE_REDIRECTS: Record<DemoRole, string> = {
  customer: "/catalogue",
  shopper: "/shopper/available",
  driver: "/driver/available",
  operator: "/operator/incoming",
  admin: "/admin/approvals",
  guest: "/",
};

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setDemoRole } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const account = DEMO_ACCOUNTS.find(
      (a) => a.email === email && a.password === password,
    );

    if (account) {
      setDemoRole(account.role);
      toast.success(`Welcome back, ${account.name}!`);
      navigate({ to: ROLE_REDIRECTS[account.role] });
    } else {
      toast.error("Invalid email or password. Try a demo account below.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">Log in</CardTitle>
            <CardDescription>Enter your email and password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  data-ocid="auth.email.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  data-ocid="auth.password.input"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-ocid="auth.login.submit_button"
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/60">
              <p className="text-xs text-muted-foreground mb-3 font-medium">
                Demo accounts (password: password)
              </p>
              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword(acc.password);
                    }}
                    className="w-full text-left text-xs px-3 py-2 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="font-medium">{acc.name}</span>
                    <span className="ml-2 opacity-60">({acc.role})</span>
                    <span className="ml-1 opacity-40">— {acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          New customer?{" "}
          <Link
            to="/register/customer"
            className="text-primary font-medium hover:underline"
            data-ocid="auth.register.link"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
