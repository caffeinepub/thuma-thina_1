import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Coins,
  Info,
  Lock,
  Send,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { WalletTransaction } from "../../data/mockData";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function TransactionIcon({ type }: { type: WalletTransaction["type"] }) {
  if (type === "earned")
    return (
      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <ArrowDownLeft className="h-4 w-4 text-green-600" />
      </div>
    );
  if (type === "spent")
    return (
      <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
        <ArrowUpRight className="h-4 w-4 text-red-600" />
      </div>
    );
  if (type === "sent")
    return (
      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
        <ArrowRight className="h-4 w-4 text-orange-600" />
      </div>
    );
  // received
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
      <ArrowDownLeft className="h-4 w-4 text-blue-600" />
    </div>
  );
}

function amountColor(type: WalletTransaction["type"]) {
  if (type === "earned" || type === "received") return "text-green-600";
  return "text-red-600";
}

function amountPrefix(type: WalletTransaction["type"]) {
  if (type === "earned" || type === "received") return "+";
  return "-";
}

export function NomayiniWalletPage() {
  const { nomayiniWallet, sendNomayiniTokens } = useApp();
  const [sendDialog, setSendDialog] = useState(false);
  const [sendForm, setSendForm] = useState({ recipient: "", amount: "" });
  const [sendLoading, setSendLoading] = useState(false);

  const handleSend = async () => {
    if (!sendForm.recipient.trim() || !sendForm.amount) {
      toast.error("Please fill in all fields");
      return;
    }
    const amount = Number.parseFloat(sendForm.amount);
    if (amount <= 0 || amount > nomayiniWallet.unlockedBalance) {
      toast.error("Invalid amount or insufficient unlocked balance");
      return;
    }
    setSendLoading(true);
    try {
      await sendNomayiniTokens(sendForm.recipient.trim(), amount);
      toast.success(
        `${amount} Nomayini tokens sent to ${sendForm.recipient}! 🪙`,
      );
      setSendDialog(false);
      setSendForm({ recipient: "", amount: "" });
    } catch {
      toast.error("Failed to send tokens. Please try again.");
    } finally {
      setSendLoading(false);
    }
  };

  const balanceCards = [
    {
      label: "Total Earned",
      value: nomayiniWallet.totalEarned,
      icon: Coins,
      color: "from-amber-400 to-yellow-400",
      textColor: "text-amber-900",
      bgColor: "bg-amber-50",
    },
    {
      label: "Unlocked Balance",
      sublabel: "Ready to use",
      value: nomayiniWallet.unlockedBalance,
      icon: Coins,
      color: "from-green-400 to-emerald-400",
      textColor: "text-green-900",
      bgColor: "bg-green-50",
    },
    {
      label: "Locked (3 months)",
      sublabel: "Unlocks soon",
      value: nomayiniWallet.lockedShortTerm,
      icon: Lock,
      color: "from-blue-400 to-sky-400",
      textColor: "text-blue-900",
      bgColor: "bg-blue-50",
    },
    {
      label: "Locked (4 years)",
      sublabel: "Long-term vest",
      value: nomayiniWallet.lockedLongTerm,
      icon: Lock,
      color: "from-purple-400 to-violet-400",
      textColor: "text-purple-900",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div
      className="max-w-2xl mx-auto px-4 sm:px-6 py-6"
      data-ocid="wallet.page"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
          <Coins className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Nomayini Wallet</h1>
          <p className="text-sm text-muted-foreground">
            Your community token rewards
          </p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {balanceCards.map((card) => (
          <Card
            key={card.label}
            className={`${card.bgColor} border-0 shadow-sm`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`h-4 w-4 ${card.textColor} opacity-70`} />
                <p
                  className={`text-xs font-medium ${card.textColor} opacity-70`}
                >
                  {card.label}
                </p>
              </div>
              <p className={`font-display font-bold text-xl ${card.textColor}`}>
                {card.value.toFixed(2)}
              </p>
              {card.sublabel && (
                <p
                  className={`text-[10px] ${card.textColor} opacity-60 mt-0.5`}
                >
                  {card.sublabel}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          onClick={() => setSendDialog(true)}
          variant="outline"
          className="gap-2 h-11 border-amber-200 text-amber-800 hover:bg-amber-50"
          data-ocid="wallet.send.open_modal_button"
        >
          <Send className="h-4 w-4" />
          Send Tokens
        </Button>
        <Button
          variant="outline"
          className="gap-2 h-11 border-green-200 text-green-800 hover:bg-green-50"
          onClick={() =>
            toast.info(
              "Use your unlocked Nomayini balance at checkout to pay for orders on Thuma Thina!",
            )
          }
        >
          <ShoppingBag className="h-4 w-4" />
          Spend Tokens
        </Button>
      </div>

      {/* Info Section */}
      <Card className="mb-6 border-amber-100 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-amber-900">
                How Nomayini Tokens work
              </p>
              <ul className="space-y-1.5 text-amber-800 text-xs">
                <li className="flex items-start gap-2">
                  <span className="shrink-0">🪙</span>
                  Earn up to 20% back in tokens on qualifying orders
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0">⏰</span>
                  50% of earned tokens unlock after 3 months
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0">🔒</span>
                  The other 50% unlocks after 4 years
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0">🛒</span>
                  Use tokens to shop on Thuma Thina
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0">🤝</span>
                  Send tokens to friends and family
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0">🔄</span>
                  Exchange tokens for other digital assets
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="card-glow">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {nomayiniWallet.transactions.length === 0 ? (
            <div
              className="text-center py-10 px-4"
              data-ocid="wallet.transactions.empty_state"
            >
              <Coins className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No transactions yet. Start shopping to earn tokens!
              </p>
            </div>
          ) : (
            <div>
              {nomayiniWallet.transactions.map((tx, i) => (
                <div key={tx.id}>
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    data-ocid={`wallet.transaction.item.${i + 1}`}
                  >
                    <TransactionIcon type={tx.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.date)}
                        {tx.unlockDate && (
                          <span className="ml-1.5">
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 h-4"
                            >
                              Unlocks {formatDate(tx.unlockDate)}
                            </Badge>
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`font-display font-bold text-sm shrink-0 ${amountColor(tx.type)}`}
                    >
                      {amountPrefix(tx.type)}
                      {tx.amount.toFixed(2)}
                    </span>
                  </div>
                  {i < nomayiniWallet.transactions.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Tokens Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent data-ocid="wallet.send.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Nomayini Tokens
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
              Available to send:{" "}
              <strong>
                {nomayiniWallet.unlockedBalance.toFixed(2)} tokens
              </strong>
            </div>
            <div className="space-y-1.5">
              <Label>Recipient Name or Phone</Label>
              <Input
                value={sendForm.recipient}
                onChange={(e) =>
                  setSendForm((f) => ({ ...f, recipient: e.target.value }))
                }
                placeholder="e.g. Zanele Mthembu or 082 345 6789"
                data-ocid="wallet.send_recipient.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (tokens)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={nomayiniWallet.unlockedBalance}
                value={sendForm.amount}
                onChange={(e) =>
                  setSendForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="0.00"
                data-ocid="wallet.send_amount.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendDialog(false)}
              data-ocid="wallet.send.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              data-ocid="wallet.send.confirm_button"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {sendLoading ? "Sending…" : "Send Tokens"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
