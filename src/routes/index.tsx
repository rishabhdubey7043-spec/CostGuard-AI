import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { ShieldCheck, Github, UploadCloud, Zap, Lock, Gauge, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/costguard/Logo";
import { Scorecard } from "@/components/costguard/Scorecard";
import { LeadModal } from "@/components/costguard/LeadModal";
import { buildAudit, rowsFromCsv, SAMPLE_ROWS, type AuditResult } from "@/lib/audit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CostGuard AI — Audit Your OpenAI Bill in 10 Seconds" },
      {
        name: "description",
        content:
          "Drop your OpenAI usage CSV and get an instant, private waste scorecard: wasted spend, duplicate prompts and model overspending. 100% client-side.",
      },
      { property: "og:title", content: "CostGuard AI — Audit Your OpenAI Bill in 10 Seconds" },
      {
        property: "og:description",
        content:
          "Instant client-side LLM cost audit. See wasted tokens, model overspend and savings without uploading anything.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const reveal = useCallback(() => {
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (file.size > 25 * 1024 * 1024) {
        setError("That file is larger than 25MB. Try exporting a single billing period.");
        return;
      }
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const rows = rowsFromCsv(res.data ?? []);
          if (!rows.length) {
            setError("We couldn't find model or cost columns in that CSV. Try the sample data below.");
            return;
          }
          setAudit(buildAudit(rows, "upload"));
          reveal();
        },
        error: () => setError("That file couldn't be read as a CSV."),
      });
    },
    [reveal],
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5">
          <a href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-semibold tracking-tight">CostGuard AI</span>
          </a>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com" target="_blank" rel="noreferrer">
                <Github className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">GitHub Repo</span>
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => setModalOpen(true)}
            >
              Launch Proxy Interceptor
            </Button>
          </nav>
        </div>
      </header>

      <section className="bg-hero-glow">
        <div className="mx-auto max-w-4xl px-5 pb-14 pt-16 text-center sm:pt-24">
          <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
            Audit Your OpenAI Bill in 10 Seconds.{" "}
            <span className="text-gradient-emerald">See How Much You Wasted Last Month.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            100% client-side &amp; private. Drag and drop your OpenAI billing CSV to uncover hidden token
            waste, duplicate prompts, and model overspending.
          </p>
          <ul className="mt-7 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
            {[
              { icon: Lock, label: "No API Keys Required" },
              { icon: ShieldCheck, label: "Zero Server Uploads" },
              { icon: Gauge, label: "Sub-10ms Privacy Parsing" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-5 pb-16">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card px-6 py-14 text-center transition-all",
            dragging && "border-primary bg-primary/5 shadow-glow",
          )}
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <UploadCloud className="h-7 w-7 text-primary" aria-hidden />
          </span>
          <p className="text-lg font-semibold tracking-tight">Drag &amp; Drop Your OpenAI Usage CSV Here</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Or click to browse from your device (Max 25MB)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-5 text-center">
          <button
            onClick={() => {
              setError(null);
              setAudit(buildAudit(SAMPLE_ROWS, "sample"));
              reveal();
            }}
            className="text-sm text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-primary"
          >
            Don&apos;t have a CSV? Click to test with sample $5,000 usage data
          </button>
        </div>
      </section>

      <div ref={resultsRef}>
        {audit && <Scorecard audit={audit} onFix={() => setModalOpen(true)} />}
      </div>

      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card p-8 text-center shadow-glow sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Zap className="h-3.5 w-3.5" aria-hidden /> 1-line integration
            </span>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Fix This Waste With 1-Line Proxy Interceptor
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
              Swap your OPENAI_BASE_URL to CostGuard Proxy. Save up to 60% automatically with zero code
              changes.
            </p>
            <pre className="mx-auto mt-6 w-fit max-w-full overflow-x-auto rounded-lg border border-border bg-background px-4 py-3 text-left font-mono text-xs text-muted-foreground sm:text-sm">
              <code>OPENAI_BASE_URL=https://proxy.costguard.ai/v1</code>
            </pre>
            <Button
              size="lg"
              className="mt-7 font-semibold"
              onClick={() => setModalOpen(true)}
            >
              Get Early Access &amp; Save My Bill
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <Logo className="h-4 w-4" /> CostGuard AI
          </span>
          <span>Your billing data never leaves your browser.</span>
        </div>
      </footer>

      <LeadModal open={modalOpen} onOpenChange={setModalOpen} />
    </main>
  );
}
