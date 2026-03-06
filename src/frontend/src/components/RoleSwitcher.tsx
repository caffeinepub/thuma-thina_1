import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Users } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { DemoRole } from "../data/mockData";

const ROLES: {
  value: DemoRole;
  label: string;
  emoji: string;
  color: string;
}[] = [
  {
    value: "customer",
    label: "Customer",
    emoji: "🛒",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "shopper",
    label: "Personal Shopper",
    emoji: "🛍️",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "driver",
    label: "Delivery Driver",
    emoji: "🚗",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "operator",
    label: "Pickup Operator",
    emoji: "📦",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "admin",
    label: "Admin",
    emoji: "⚙️",
    color: "bg-red-100 text-red-800",
  },
];

export function RoleSwitcher() {
  const { demoRole, setDemoRole } = useApp();
  const current = ROLES.find((r) => r.value === demoRole) || ROLES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-2 border-primary/30 bg-background hover:bg-primary/5 font-medium"
          data-ocid="nav.toggle"
        >
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Demo:
          </span>
          <span className="text-sm">{current.emoji}</span>
          <span className="hidden md:inline text-sm">{current.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        data-ocid="nav.dropdown_menu"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Switch Demo Role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLES.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => setDemoRole(role.value)}
            className="cursor-pointer gap-2"
            data-ocid={`nav.${role.value}.link`}
          >
            <span>{role.emoji}</span>
            <span className="flex-1">{role.label}</span>
            {demoRole === role.value && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
