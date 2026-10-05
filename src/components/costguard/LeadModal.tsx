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
import { Check, ChevronLeft, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Leads are stored 100% client-side (localStorage) — no backend, no email API.
 * Each submission is appended to the "costguard:leads" array so the data
 * survives page reloads.
 */
const LEADS_KEY = "costguard:leads";

type Lead = {
  email: string;
  appType: string;
  spend: string;
  providers: string[];
  features: string[];
  source: string;
  submittedAt: string;
};

const APP_TYPES = ["Micro SaaS", "Agency", "Developer", "High-Scale AI App"] as const;
const SPEND_BANDS = ["<$200/mo", "$200–$1k/mo", "$1k–$5k/mo", "$5k+/mo"] as const;
const PROVIDERS = ["OpenAI", "Anthropic", "Groq", "OpenRouter", "Custom Models"] as const;
const FEATURES = [
  "Cost Routing",
  "Semantic Caching",
  "Spending Limits",
  "Spike Alerts",
  "Token Analytics",
] as const;

type Step = 1 | 2;

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-all",
        selected
          ? "border-primary bg-primary/15 text-primary shadow-glow"
          : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</Label>;
}

export function LeadModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [appType, setAppType] = useState("");
  const [spend, setSpend] = useState("");
  const [providers, setProviders] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const step1Valid = emailValid && appType !== "" && spend !== "";
  const step2Valid = features.length > 0;

  const reset = () => {
    setStep(1);
    setEmail("");
    setAppType("");
    setSpend("");
    setProviders([]);
    setFeatures([]);
    setError(null);
    setDone(false);
  };

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(reset, 200);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const lead: Lead = {
      email: email.trim(),
      appType,
      spend,
      providers,
      features,
      source: "landing-modal",
      submittedAt: new Date().toISOString(),
    };
    try {
      // Persist locally — 100% frontend, no network call.
      let leads: Lead[] = [];
      try {
        leads = JSON.parse(localStorage.getItem(LEADS_KEY) ?? "[]") as Lead[];
      } catch {
        leads = [];
      }
      if (!Array.isArray(leads)) leads = [];
      leads.push(lead);
      localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
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
      <DialogContent className="border-border bg-card sm:max-w-lg">
        {done ? (
          <>
            <DialogHeader>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                <ShieldCheck className="h-7 w-7 text-primary" aria-hidden />
              </span>
              <DialogTitle className="text-center text-2xl font-bold tracking-tight">
                Thank you!
              </DialogTitle>
              <DialogDescription className="text-center">
                We will reach out shortly at <span className="text-foreground">{email.trim()}</span>.
              </DialogDescription>
            </DialogHeader>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Joined by 100+ AI founders &amp; engineering leads.
            </p>
            <Button variant="secondary" className="mt-2" onClick={() => close(false)}>
              Done
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {step === 1 ? "Stop Wasting LLM Spend Today" : "Tailor Your Proxy Setup"}
              </DialogTitle>
              <DialogDescription>
                {step === 1
                  ? "One line of config. Automatic model routing, caching and spend caps."
                  : "Tell us what to prioritize — this shapes the setup we send you."}
              </DialogDescription>
            </DialogHeader>

            {/* Progress */}
            <div className="mt-1 flex items-center gap-2" aria-hidden>
              <div className="h-1 flex-1 rounded-full bg-primary transition-colors" />
              <div className={cn("h-1 flex-1 rounded-full transition-colors", step === 2 ? "bg-primary" : "bg-border")} />
            </div>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Step {step} of 2 — {step === 1 ? "About you" : "Your stack & needs"}
            </p>

            {step === 1 ? (
              <form
                className="mt-3 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step1Valid) setStep(2);
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>Company / App Type</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {APP_TYPES.map((t) => (
                      <Chip key={t} selected={appType === t} onClick={() => setAppType(t)}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel>Approx. Monthly AI/API Spend</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {SPEND_BANDS.map((band) => (
                      <button
                        type="button"
                        key={band}
                        aria-pressed={spend === band}
                        onClick={() => setSpend(band)}
                        className={cn(
                          "cursor-pointer rounded-lg border px-3 py-2 text-sm transition-all",
                          spend === band
                            ? "border-primary bg-primary/15 font-medium text-primary"
                            : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                        )}
                      >
                        {band}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full font-semibold"
                  disabled={!step1Valid}
                >
                  Continue
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
                {!step1Valid && (
                  <p className="text-center text-xs text-muted-foreground">
                    Fill in your email, app type and spend band to continue.
                  </p>
                )}
              </form>
            ) : (
              <form
                className="mt-3 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step2Valid) submit();
                }}
              >
                <div className="space-y-2">
                  <FieldLabel>Providers Used</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {PROVIDERS.map((p) => (
                      <Chip key={p} selected={providers.includes(p)} onClick={() => toggle(providers, p, setProviders)}>
                        {p}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel>Most Needed Core Feature</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {FEATURES.map((f) => (
                      <Chip key={f} selected={features.includes(f)} onClick={() => toggle(features, f, setFeatures)}>
                        {f}
                      </Chip>
                    ))}
                  </div>
                  {features.length === 0 && (
                    <p className="text-xs text-muted-foreground">Pick at least one — multi-select.</p>
                  )}
                </div>

                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="shrink-0"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Back
                  </Button>
                  <Button type="submit" className="w-full font-semibold" disabled={!step2Valid || submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    {submitting ? "Submitting…" : "Claim Free 1-Line Proxy Access"}
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Joined by 100+ AI founders &amp; engineering leads.
                </p>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
