import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle,
  Coins,
  MapPin,
  ShoppingBag,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const FEATURES = [
  {
    icon: ShoppingBag,
    title: "Personal Shopping",
    desc: "Our vetted shoppers physically purchase your items from local stores, malls, and markets.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Truck,
    title: "Community Delivery",
    desc: "Reliable drivers deliver to your pick-up point or straight to your home address.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: MapPin,
    title: "Pick-up Points",
    desc: "Visit your nearest community pick-up point. Walk-in and place orders right there.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Coins,
    title: "Nomayini Rewards",
    desc: "Earn up to 20% back in Nomayini tokens on every order. Spend, send to friends, or exchange for digital assets.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse & Order",
    desc: "Choose your items from our community catalogue — groceries, household, fast food and more.",
  },
  {
    step: "02",
    title: "Shopper Collects",
    desc: "A personal shopper accepts your order and heads to the store to purchase your items.",
  },
  {
    step: "03",
    title: "Driver Delivers",
    desc: "Your order is handed to a driver who delivers it to your chosen pick-up point or home.",
  },
  {
    step: "04",
    title: "You Collect",
    desc: "Receive your order at the pick-up point or relax at home and wait for your delivery.",
  },
];

export function LandingPage() {
  const { setDemoRole } = useApp();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative hero-gradient kente-bg overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-white/80 mb-6">
              <Star className="h-3 w-3 fill-current" />
              Serving KwaZulu-Natal Communities
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Thuma Thina
            </h1>
            <p className="text-xl sm:text-2xl text-white font-bold mb-1 italic">
              Yonke into, Yonki ndawo, Ngaso Sonke Iskhathi
            </p>
            <p className="text-white/70 text-sm sm:text-base mb-3 font-medium tracking-wide uppercase">
              Everything, everywhere, all the time
            </p>
            <p className="text-white/60 text-base sm:text-lg mb-8 max-w-lg leading-relaxed">
              The Mthandeni Umuntu Association brings shopping to your door.
              Order online or walk into your nearest pick-up point — we handle
              the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/register/customer"
                data-ocid="auth.register.primary_button"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-foreground hover:bg-white/90 font-semibold gap-2"
                >
                  Start Ordering
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                to="/register/staff"
                data-ocid="auth.apply.secondary_button"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 gap-2"
                >
                  <Users className="h-4 w-4" />
                  Join Our Team
                </Button>
              </Link>
              <Link to="/login" data-ocid="auth.login.button">
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full sm:w-auto text-white/80 hover:text-white hover:bg-white/10"
                >
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Role Quick-Access */}
      <section className="bg-primary/5 border-y border-primary/15 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
            <span className="text-muted-foreground font-medium shrink-0">
              🎭 Try a demo role:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  role: "customer" as const,
                  label: "🛒 Customer",
                  to: "/catalogue",
                },
                {
                  role: "shopper" as const,
                  label: "🛍️ Shopper",
                  to: "/shopper/available",
                },
                {
                  role: "driver" as const,
                  label: "🚗 Driver",
                  to: "/driver/available",
                },
                {
                  role: "operator" as const,
                  label: "📦 Operator",
                  to: "/operator/incoming",
                },
                {
                  role: "admin" as const,
                  label: "⚙️ Admin",
                  to: "/admin/approvals",
                },
              ].map(({ role, label, to }) => (
                <Link key={role} to={to} data-ocid={`nav.demo_${role}.link`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setDemoRole(role)}
                  >
                    {label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Shopping made simple
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From your phone or the nearest pick-up point — Thuma Thina is here
            for every community member.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} className="card-glow border-border/60">
              <CardContent className="p-6">
                <div
                  className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}
                >
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Nomayini Token Rewards Section */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        {/* Gold/amber background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-300 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-yellow-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-200 px-4 py-1.5 text-sm text-amber-800 font-medium mb-4">
              <Coins className="h-4 w-4" />
              Exclusive Rewards Program
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3 text-amber-900">
              Nomayini Token Rewards
            </h2>
            <p className="text-amber-700 text-lg max-w-2xl mx-auto">
              Every purchase earns you Nomayini tokens — our community digital
              currency that grows in value over time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Reward details */}
            <div className="space-y-6">
              <div className="flex gap-4 items-start bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-amber-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🪙</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-amber-900 mb-1">
                    Earn up to 20% back
                  </h3>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    For every qualifying order you place on Thuma Thina, earn up
                    to 20% of the order value back in Nomayini tokens.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-amber-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">⏰</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-amber-900 mb-1">
                    Unlock schedule
                  </h3>
                  <p className="text-amber-700 text-sm leading-relaxed mb-3">
                    Tokens are locked for a vesting period to reward long-term
                    community members:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <span className="text-amber-800">
                        <strong>50%</strong> unlocks after{" "}
                        <strong>3 months</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-amber-800">
                        <strong>50%</strong> unlocks after{" "}
                        <strong>4 years</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-amber-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">💸</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-amber-900 mb-1">
                    Use your tokens
                  </h3>
                  <div className="space-y-1.5 mt-1">
                    {[
                      "🛒 Shop on Thuma Thina",
                      "🤝 Send to friends & family",
                      "🔄 Exchange for other digital assets",
                    ].map((use) => (
                      <div
                        key={use}
                        className="flex items-center gap-2 text-sm text-amber-800"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        {use}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Token showcase card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 rounded-3xl p-8 text-white shadow-xl shadow-amber-200/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Coins className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl">
                      Nomayini Token
                    </h3>
                    <p className="text-white/70 text-sm">Community Currency</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/15 rounded-xl p-4">
                    <p className="text-white/70 text-xs mb-1">
                      Average order earn
                    </p>
                    <p className="font-display font-bold text-2xl">~R45</p>
                    <p className="text-white/60 text-xs">per R225 order</p>
                  </div>
                  <div className="bg-white/15 rounded-xl p-4">
                    <p className="text-white/70 text-xs mb-1">Max earn rate</p>
                    <p className="font-display font-bold text-2xl">20%</p>
                    <p className="text-white/60 text-xs">back in tokens</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/80 text-xs font-medium mb-3">
                    Token unlock timeline
                  </p>
                  <div className="relative h-2 bg-white/20 rounded-full mb-3">
                    <div className="absolute left-0 top-0 h-2 w-[20%] bg-green-400 rounded-full" />
                    <div className="absolute left-[20%] top-0 h-2 w-[30%] bg-yellow-300 rounded-full" />
                    <div className="absolute left-0 top-4 text-[10px] text-white/70">
                      Now
                    </div>
                    <div className="absolute left-[20%] top-4 text-[10px] text-white/70">
                      3 mo
                    </div>
                    <div className="absolute right-0 top-4 text-[10px] text-white/70">
                      4 yr
                    </div>
                  </div>
                  <div className="mt-6 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      50% unlocks at 3 months
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <div className="w-2 h-2 rounded-full bg-yellow-300" />
                      50% unlocks at 4 years
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative coin */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-amber-300 border-4 border-white shadow-lg flex items-center justify-center">
                <Coins className="h-7 w-7 text-amber-700" />
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              to="/register/customer"
              data-ocid="nomayini.register.primary_button"
            >
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-2 shadow-lg shadow-amber-200"
              >
                <Coins className="h-4 w-4" />
                Start Earning Nomayini Tokens
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
              How it works
            </h2>
            <p className="text-muted-foreground text-lg">
              From order to door in four simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-border -translate-y-1/2 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg flex items-center justify-center mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-display font-semibold text-base mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Serving your community
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Currently active in Durban, Pietermaritzburg, and Richards Bay —
              with more towns being added as the Mthandeni Umuntu Association
              grows.
            </p>
            <div className="space-y-3">
              {[
                "KwaMashu",
                "Umlazi",
                "Pinetown",
                "Pietermaritzburg CBD",
                "Richards Bay",
              ].map((area) => (
                <div key={area} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  <span>{area} Community Pick-up Point</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-gradient rounded-2xl p-8 text-white">
            <h3 className="font-display text-2xl font-bold mb-6">
              Join our growing team
            </h3>
            <div className="space-y-4">
              {[
                {
                  emoji: "🛍️",
                  title: "Personal Shoppers",
                  desc: "Shop on behalf of community members from local stores",
                },
                {
                  emoji: "🚗",
                  title: "Delivery Drivers",
                  desc: "Deliver orders to pick-up points and homes",
                },
                {
                  emoji: "📦",
                  title: "Pickup Operators",
                  desc: "Run a community pick-up point in your area",
                },
              ].map((role) => (
                <div key={role.title} className="flex gap-3">
                  <span className="text-2xl">{role.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{role.title}</p>
                    <p className="text-white/70 text-xs">{role.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/register/staff"
              className="block mt-6"
              data-ocid="auth.staff_apply.button"
            >
              <Button className="w-full bg-white text-foreground hover:bg-white/90 font-semibold">
                Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="font-display font-bold text-foreground mb-1">
            Thuma Thina
          </div>
          <p className="text-xs text-muted-foreground italic mb-1">
            Yonke into, Yonki ndawo, Ngaso Sonke Iskhathi
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Mthandeni Umuntu Association — Serving KwaZulu-Natal Communities
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
