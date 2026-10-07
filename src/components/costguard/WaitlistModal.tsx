import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Loader2, ShieldCheck } from "lucide-react";

const WAITLIST_KEY = "costguard:proxy-waitlist";

const SPEND_BANDS = ["<$1K", "$1K–$5K", "$5K–$25K", "$25K+"] as const;
const INTERESTS = [
  "Model Routing",
  "Prompt Caching",
  "Spending Limits",
  "Spike Protection",
  "Cost Analytics",
] as const;

type WaitlistEntry = {
  email: string;
  spend: string;
  interests: string[];
  source: string;
  submittedAt: string;
};

export function WaitlistModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [spend, setSpend] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const formValid = emailValid && spend !== "" && interests.length > 0;

  const toggleInterest = (value: string) =>
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const reset = () => {
    setEmail("");
    setSpend("");
    setInterests([]);
    setError(null);
    setDone(false);
  };

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(reset, 200);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    setSubmitting(true);
    setError(null);
    const entry: WaitlistEntry = {
      email: email.trim(),
      spend,
      interests,
      source: "proxy-beta-waitlist",
      submittedAt: new Date().toISOString(),
    };
    try {
      let entries: WaitlistEntry[] = [];
      try {
        entries = JSON.parse(localStorage.getItem(WAITLIST_KEY) ?? "[]") as WaitlistEntry[];
      } catch {
        entries = [];
      }
      if (!Array.isArray(entries)) entries = [];
      entries.push(entry);
      localStorage.setItem(WAITLIST_KEY, JSON.stringify(entries));
      await new Promise((r) => setTimeout(r, 600));
      setDone(true);
    } catch {
      setError("We couldn't save that just now. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        {done ? (
          <>
            <DialogHeader>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                <ShieldCheck className="h-7 w-7 text-primary" aria-hidden />
              </span>
              <DialogTitle className="text-center text-2xl font-bold tracking-tight">
                Thanks for joining the waitlist!
              </DialogTitle>
              <DialogDescription className="text-center">
                We&apos;ll notify you at <span className="text-foreground">{email.trim()}</span> when
                the Proxy Beta is ready.
              </DialogDescription>
            </DialogHeader>
            <Button variant="secondary" className="mt-2" onClick={() => close(false)}>
              Done
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Join Proxy Beta
              </DialogTitle>
              <DialogDescription>
                Be first in line when the 1-Line Proxy Interceptor launches.
              </DialogDescription>
            </DialogHeader>

            <form className="mt-3 space-y-5" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="waitlist-email">Work Email</Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Monthly AI Spend</Label>
                <Select value={spend} onValueChange={setSpend}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your spend range" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPEND_BANDS.map((band) => (
                      <SelectItem key={band} value={band}>
                        {band}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Interest</Label>
                <div className="space-y-2.5">
                  {INTERESTS.map((interest) => (
                    <div key={interest} className="flex items-center gap-2.5">
                      <Checkbox
                        id={`interest-${interest}`}
                        checked={interests.includes(interest)}
                        onCheckedChange={() => toggleInterest(interest)}
                      />
                      <Label
                        htmlFor={`interest-${interest}`}
                        className="cursor-pointer text-sm font-normal text-foreground"
                      >
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
                {interests.length === 0 && (
                  <p className="text-xs text-muted-foreground">Select at least one area of interest.</p>
                )}
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full font-semibold"
                disabled={!formValid || submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {submitting ? "Submitting…" : "Join Proxy Beta"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                <Check className="mr-1 inline h-3 w-3 text-primary" aria-hidden />
                No spam. We&apos;ll only email you about the Proxy Beta.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
