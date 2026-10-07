import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Download, ArrowLeft, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/costguard/Logo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — CostGuard AI" }],
  }),
  component: Admin,
});

type WaitlistRow = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

const ADMIN_PASSWORD = "costguard-admin-2026";

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!authed) {
    return (
      <PasswordGate
        password={password}
        setPassword={setPassword}
        passwordError={passwordError}
        setPasswordError={setPasswordError}
        onSuccess={() => setAuthed(true)}
      />
    );
  }

  return <Dashboard />;
}

function PasswordGate({
  password,
  setPassword,
  passwordError,
  setPasswordError,
  onSuccess,
}: {
  password: string;
  setPassword: (v: string) => void;
  passwordError: string | null;
  setPasswordError: (v: string | null) => void;
  onSuccess: () => void;
}) {
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setPasswordError(null);
      onSuccess();
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <span className="font-semibold tracking-tight">CostGuard AI</span>
        </div>
        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div className="mb-4 flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" aria-hidden />
            <span className="text-sm font-medium">Admin Dashboard</span>
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              required
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(null);
              }}
              autoFocus
            />
          </div>
          {passwordError && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {passwordError}
            </p>
          )}
          <Button type="submit" className="mt-4 w-full font-semibold">
            Unlock Dashboard
          </Button>
        </form>
      </div>
    </main>
  );
}

function Dashboard() {
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useState(() => {
    loadEntries();
  });

  async function loadEntries() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("waitlist")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: false });

      if (queryError) {
        setError("Failed to load waitlist entries. Please try again.");
        setRows([]);
      } else {
        setRows((data as WaitlistRow[]) ?? []);
      }
    } catch {
      setError("Failed to load waitlist entries. Please try again.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = rows.filter(
    (r) =>
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.role.toLowerCase().includes(search.toLowerCase()),
  );

  const exportCsv = () => {
    const header = "Email,Role,Created At\n";
    const body = filtered
      .map(
        (r) =>
          `"${r.email}","${r.role.replace(/"/g, '""')}","${new Date(r.created_at).toISOString()}"`,
      )
      .join("\n");
    const csv = header + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `costguard-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5">
          <a href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-semibold tracking-tight">CostGuard Admin</span>
          </a>
          <Button variant="ghost" size="sm" asChild>
            <a href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to site
            </a>
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Waitlist Entries</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {rows.length} total {rows.length === 1 ? "entry" : "entries"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                placeholder="Search email or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 sm:w-64"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="shrink-0"
            >
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/35 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadEntries}>
              Try again
            </Button>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {search
                ? "No entries match your search."
                : "No waitlist entries yet. They'll appear here once people start joining."}
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role / Details</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "align-top",
                      i < filtered.length - 1 && "border-t border-border/70",
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-foreground">{row.email}</td>
                    <td className="max-w-[320px] px-4 py-3 text-muted-foreground">
                      {row.role}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
