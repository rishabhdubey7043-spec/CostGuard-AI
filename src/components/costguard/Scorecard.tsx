import type { AuditResult } from "@/lib/audit";
import { cn } from "@/lib/utils";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const compact = (n: number) => Intl.NumberFormat("en-US", { notation: "compact" }).format(n);

const GRADE_TONE: Record<string, string> = {
  A: "border-primary/40 bg-primary/10 text-primary",
  B: "border-primary/40 bg-primary/10 text-primary",
  C: "border-chart-3/40 bg-chart-3/10 text-chart-3",
  D: "border-destructive/40 bg-destructive/10 text-destructive",
  F: "border-destructive/50 bg-destructive/15 text-destructive",
};

export function Scorecard({ audit, onFix }: { audit: AuditResult; onFix: () => void }) {
  const maxWaste = Math.max(...audit.drains.map((d) => d.waste), 1);

  return (
    <section aria-label="Audit results" className="mx-auto w-full max-w-6xl px-5 pb-4">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div
            className={cn(
              "flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border-2 font-mono",
              GRADE_TONE[audit.grade],
            )}
          >
            <span className="text-5xl font-bold leading-none">{audit.grade}</span>
            <span className="mt-1 text-[11px] uppercase tracking-widest opacity-80">Grade</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Grade {audit.grade} — {audit.wastePct.toFixed(0)}% wasted spend
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Across {compact(audit.totalTokens)} tokens you spent {usd(audit.totalSpend)}, and about{" "}
              <span className="font-semibold text-destructive">{usd(audit.wasted)}</span> of that went to
              oversized models, uncached duplicate prompts and bloated context windows. Roughly{" "}
              {audit.duplicatePct.toFixed(0)}% of your requests were near-identical repeats.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Total spend" value={usd(audit.totalSpend)} hint="Billing period total" />
          <Metric
            label="Estimated wasted dollars"
            value={usd(audit.wasted)}
            hint={`${audit.wastePct.toFixed(0)}% of your bill`}
            tone="danger"
          />
          <Metric
            label="Potential monthly savings"
            value={usd(audit.savings)}
            hint="With routing + caching applied"
            tone="good"
          />
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Cost drain breakdown
          </h3>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Tokens</th>
                  <th className="px-4 py-3 font-medium">Spend</th>
                  <th className="px-4 py-3 font-medium">Wasted</th>
                  <th className="px-4 py-3 font-medium">Why</th>
                  <th className="px-4 py-3 font-medium">Recommended</th>
                </tr>
              </thead>
              <tbody>
                {audit.drains.map((d) => (
                  <tr key={d.model} className="border-t border-border/70 align-top">
                    <td className="px-4 py-3 font-mono text-foreground">{d.model}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {compact(d.tokens)}
                      <span className="block text-xs opacity-70">{compact(d.requests)} reqs</span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{usd(d.spend)}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-destructive">{usd(d.waste)}</span>
                      <span className="mt-1 block h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                        <span
                          className="block h-full rounded-full bg-destructive"
                          style={{ width: `${Math.max(6, (d.waste / maxWaste) * 100)}%` }}
                        />
                      </span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-muted-foreground">{d.reason}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
                        {d.recommended}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Parsed entirely in your browser. Nothing left this device.{" "}
            <button onClick={onFix} className="text-primary underline underline-offset-4">
              Fix this waste
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "danger" | "good";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5",
        tone === "danger" && "border-destructive/35",
        tone === "good" && "border-primary/35",
      )}
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 font-mono text-3xl font-bold tracking-tight",
          tone === "danger" && "text-destructive",
          tone === "good" && "text-primary",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
