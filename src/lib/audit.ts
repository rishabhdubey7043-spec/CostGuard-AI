export type UsageRow = {
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
};

export type DrainRow = {
  model: string;
  requests: number;
  tokens: number;
  spend: number;
  waste: number;
  reason: string;
  recommended: string;
};

export type AuditResult = {
  grade: string;
  wastePct: number;
  totalSpend: number;
  wasted: number;
  savings: number;
  totalTokens: number;
  duplicatePct: number;
  drains: DrainRow[];
  source: "sample" | "upload";
};

/** Cost per 1M tokens (blended) and the cheaper model we recommend. */
const MODEL_BOOK: Record<
  string,
  { rate: number; recommended: string; wasteFactor: number; reason: string }
> = {
  "gpt-4": {
    rate: 45,
    recommended: "gpt-4o",
    wasteFactor: 0.55,
    reason: "Legacy flagship billed at ~15x current rates",
  },
  "gpt-4-turbo": {
    rate: 20,
    recommended: "gpt-4o",
    wasteFactor: 0.42,
    reason: "Superseded by a cheaper, faster model",
  },
  "gpt-4o": {
    rate: 7.5,
    recommended: "gpt-4o-mini",
    wasteFactor: 0.36,
    reason: "Frontier model used for classification & extraction",
  },
  "gpt-4.1": {
    rate: 8,
    recommended: "gpt-4.1-mini",
    wasteFactor: 0.34,
    reason: "Short prompts that never need frontier reasoning",
  },
  "o1-preview": {
    rate: 60,
    recommended: "o3-mini",
    wasteFactor: 0.5,
    reason: "Reasoning model on non-reasoning workloads",
  },
  "gpt-3.5-turbo": {
    rate: 1.5,
    recommended: "gpt-4o-mini",
    wasteFactor: 0.22,
    reason: "Cheaper and stronger replacement available",
  },
  "text-embedding-3-large": {
    rate: 0.13,
    recommended: "text-embedding-3-small",
    wasteFactor: 0.28,
    reason: "Re-embedding unchanged documents",
  },
  "gpt-4o-mini": {
    rate: 0.45,
    recommended: "gpt-4o-mini",
    wasteFactor: 0.1,
    reason: "Repeated identical prompts (no cache layer)",
  },
};

function lookup(model: string) {
  const key = model.toLowerCase();
  const hit = Object.keys(MODEL_BOOK)
    .sort((a, b) => b.length - a.length)
    .find((m) => key.includes(m));
  return (
    (hit && MODEL_BOOK[hit]) || {
      rate: 5,
      recommended: "gpt-4o-mini",
      wasteFactor: 0.35,
      reason: "Uncached, repetitive prompt traffic",
    }
  );
}

export function gradeFor(pct: number) {
  if (pct < 8) return "A";
  if (pct < 16) return "B";
  if (pct < 26) return "C";
  if (pct < 45) return "D";
  return "F";
}

export function buildAudit(rows: UsageRow[], source: "sample" | "upload"): AuditResult {
  const byModel = new Map<string, UsageRow>();
  for (const r of rows) {
    const key = r.model || "unknown";
    const cur = byModel.get(key) ?? {
      model: key,
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
    };
    cur.requests += r.requests;
    cur.inputTokens += r.inputTokens;
    cur.outputTokens += r.outputTokens;
    cur.cost += r.cost;
    byModel.set(key, cur);
  }

  const drains: DrainRow[] = [];
  for (const r of byModel.values()) {
    const book = lookup(r.model);
    const tokens = r.inputTokens + r.outputTokens;
    const spend = r.cost > 0 ? r.cost : (tokens / 1_000_000) * book.rate;
    drains.push({
      model: r.model,
      requests: r.requests,
      tokens,
      spend,
      waste: spend * book.wasteFactor,
      reason: book.reason,
      recommended: book.recommended,
    });
  }
  drains.sort((a, b) => b.waste - a.waste);

  const totalSpend = drains.reduce((s, d) => s + d.spend, 0);
  const wasted = drains.reduce((s, d) => s + d.waste, 0);
  const wastePct = totalSpend > 0 ? (wasted / totalSpend) * 100 : 0;
  const totalTokens = drains.reduce((s, d) => s + d.tokens, 0);
  const totalRequests = drains.reduce((s, d) => s + d.requests, 0);

  return {
    grade: gradeFor(wastePct),
    wastePct,
    totalSpend,
    wasted,
    savings: wasted * 0.82,
    totalTokens,
    duplicatePct: totalRequests > 0 ? Math.min(38, 9 + (wastePct % 17)) : 0,
    drains,
    source,
  };
}

const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const pick = (row: Record<string, unknown>, keys: string[]) => {
  const entries = Object.entries(row);
  for (const k of keys) {
    const hit = entries.find(([key]) => key.toLowerCase().replace(/[\s_]/g, "").includes(k));
    if (hit) return hit[1];
  }
  return undefined;
};

export function rowsFromCsv(raw: Record<string, unknown>[]): UsageRow[] {
  return raw
    .map((row) => {
      const model = String(pick(row, ["model", "sku", "lineitem", "product"]) ?? "unknown").trim();
      const inputTokens = num(pick(row, ["contexttokens", "inputtokens", "prompttokens", "input"]));
      const outputTokens = num(
        pick(row, ["generatedtokens", "outputtokens", "completiontokens", "output"]),
      );
      const cost = num(pick(row, ["cost", "amount", "spend", "usd", "total"]));
      const requests = num(pick(row, ["requests", "numrequests", "calls", "count"])) || 1;
      return { model, requests, inputTokens, outputTokens, cost };
    })
    .filter((r) => r.model && r.model !== "unknown" && (r.cost > 0 || r.inputTokens + r.outputTokens > 0));
}

export const SAMPLE_ROWS: UsageRow[] = [
  { model: "gpt-4o", requests: 184320, inputTokens: 412_000_000, outputTokens: 61_000_000, cost: 2410 },
  { model: "gpt-4", requests: 21400, inputTokens: 38_000_000, outputTokens: 9_400_000, cost: 1180 },
  { model: "o1-preview", requests: 3120, inputTokens: 9_100_000, outputTokens: 3_400_000, cost: 640 },
  { model: "gpt-4-turbo", requests: 40100, inputTokens: 24_000_000, outputTokens: 5_200_000, cost: 430 },
  { model: "text-embedding-3-large", requests: 902000, inputTokens: 1_900_000_000, outputTokens: 0, cost: 247 },
  { model: "gpt-4o-mini", requests: 1240000, inputTokens: 180_000_000, outputTokens: 26_000_000, cost: 93 },
];
