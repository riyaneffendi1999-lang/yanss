import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ClipboardPaste, Plus, Trash2, Trophy, Users, Gift } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/bonus/gebyar-turnover")({
  head: () => ({ meta: [{ title: "Gebyar Turnover — Admin Console" }] }),
  component: GebyarTurnoverPage,
});

type InputRow = {
  id: string;
  username: string;
  turnover: number;
  prize_text: string;
  prize_amount: number; // 0 for item prizes
};

type ClaimRow = InputRow & { claimed_at: string };

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const rp = (n: number) => "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
const num = (n: number) => n.toLocaleString("id-ID");

/**
 * Parses concatenated turnover paste like:
 *   `noni77733,331,437,000IPHONE 16 PRO MAX (256 GB)memori889,379,244,800Rp 10.000.000...`
 * Each entry = username + turnover(comma-formatted) + prize(text or "Rp X.XXX.XXX").
 * Item prizes → amount = 0.
 */
export function parseGebyarPaste(text: string): InputRow[] {
  const clean = text.replace(/\s+/g, " ").trim();
  // Non-greedy username so the turnover starts with 1-3 digits then comma triplets.
  const re = /([A-Za-z][A-Za-z0-9_]*?)(\d{1,3}(?:,\d{3})+)/g;
  const matches: Array<{ user: string; turnover: number; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    const turnover = Number(m[2].replace(/,/g, ""));
    if (!isFinite(turnover)) continue;
    matches.push({
      user: m[1],
      turnover,
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  const out: InputRow[] = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const prizeRaw = clean.slice(cur.end, next?.start ?? clean.length).trim();
    // Detect monetary prize like "Rp 10.000.000" or "10.000.000".
    const money = prizeRaw.match(/Rp\s*([\d.,]+)/i);
    let prize_amount = 0;
    if (money) {
      const digits = money[1].replace(/[.,]/g, "");
      prize_amount = Number(digits) || 0;
    }
    out.push({
      id: crypto.randomUUID(),
      username: cur.user,
      turnover: cur.turnover,
      prize_text: prizeRaw || "—",
      prize_amount,
    });
  }
  return out;
}

const STORAGE_KEY = "gebyar_turnover_state_v1";

type PersistedState = {
  period_month: number; // 1-12
  period_year: number;
  input: InputRow[];
  claims: ClaimRow[];
};

function loadState(): PersistedState {
  const now = new Date();
  const fallback: PersistedState = {
    period_month: now.getMonth() + 1,
    period_year: now.getFullYear(),
    input: [],
    claims: [],
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function GebyarTurnoverPage() {
  const [state, setState] = useState<PersistedState>(loadState);
  const [paste, setPaste] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }, [state]);

  const handleAdd = () => {
    const parsed = parseGebyarPaste(paste);
    if (parsed.length === 0) {
      toast.error("Format tidak dikenali", {
        description: "Tempel data turnover dengan format username+turnover+hadiah.",
      });
      return;
    }
    setState((s) => ({ ...s, input: [...s.input, ...parsed] }));
    setPaste("");
    toast.success(`${parsed.length} data turnover ditambahkan`);
  };

  const handleClaim = (id: string) => {
    setState((s) => {
      const row = s.input.find((r) => r.id === id);
      if (!row) return s;
      return {
        ...s,
        input: s.input.filter((r) => r.id !== id),
        claims: [{ ...row, claimed_at: new Date().toISOString() }, ...s.claims],
      };
    });
  };

  const handleDeleteInput = (id: string) =>
    setState((s) => ({ ...s, input: s.input.filter((r) => r.id !== id) }));

  const handleDeleteClaim = (id: string) =>
    setState((s) => ({ ...s, claims: s.claims.filter((r) => r.id !== id) }));

  const inputTotals = useMemo(() => {
    const members = state.input.length;
    const bonus = state.input.reduce((n, r) => n + r.prize_amount, 0);
    return { members, bonus };
  }, [state.input]);

  const claimTotals = useMemo(() => {
    const members = state.claims.length;
    const bonus = state.claims.reduce((n, r) => n + r.prize_amount, 0);
    return { members, bonus };
  }, [state.claims]);

  return (
    <div>
      <PageHeader
        title="Gebyar Turnover"
        description="Data kiri = input baru • Data kanan = sudah Claim"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* LEFT — Input */}
        <section className="glass-panel soft-shadow rounded-xl">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Input Data Turnover
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-secondary/60 px-2 py-1 text-[11px] text-muted-foreground">
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste Data
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="grid grid-cols-[1fr_120px] gap-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Periode
                </Label>
                <Select
                  value={String(state.period_month)}
                  onValueChange={(v) => setState((s) => ({ ...s, period_month: Number(v) }))}
                >
                  <SelectTrigger className="bg-secondary/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((mn, i) => (
                      <SelectItem key={mn} value={String(i + 1)}>{mn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Tahun
                </Label>
                <Input
                  type="number"
                  value={state.period_year}
                  onChange={(e) => setState((s) => ({ ...s, period_year: Number(e.target.value) || s.period_year }))}
                  className="bg-secondary/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] text-muted-foreground">
                Contoh: <span className="font-mono text-rose-400">lucky77bibi7,623,850250.000abisceka7,356,380500.000...</span>
              </div>
              <Textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder="Paste data di sini..."
                rows={4}
                className="bg-secondary/40 font-mono text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleAdd} disabled={!paste.trim()} size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> Tambah ke Tabel
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPaste("")}>
                Batal
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border/60 p-4">
            <MiniStat tone="sky" label="Total Member" value={`${inputTotals.members} member`} />
            <MiniStat tone="amber" label="Total Claim Bonus Terpending" value={rp(inputTotals.bonus)} />
          </div>

          <div className="border-t border-border/60">
            {state.input.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                <Trophy className="h-8 w-8 opacity-40" />
                Klik <b className="text-rose-400">Paste Data</b> untuk menambah data
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Username</th>
                      <th className="px-4 py-2 text-right font-medium">Turnover</th>
                      <th className="px-4 py-2 text-left font-medium">Hadiah</th>
                      <th className="px-4 py-2 text-right font-medium">Nilai</th>
                      <th className="px-4 py-2 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.input.map((r) => (
                      <tr key={r.id} className="border-t border-border/50 hover:bg-secondary/30">
                        <td className="px-4 py-2 font-semibold text-primary">{r.username}</td>
                        <td className="px-4 py-2 text-right font-mono text-xs">{num(r.turnover)}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{r.prize_text}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {r.prize_amount > 0 ? rp(r.prize_amount) : <span className="text-muted-foreground">Barang</span>}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleClaim(r.id)}
                              title="Proses Claim"
                              className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-emerald-400"
                            >
                              <Gift className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteInput(r.id)}
                              title="Hapus"
                              className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT — Claim */}
        <section className="glass-panel soft-shadow rounded-xl">
          <div className="border-b border-border/60 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Data Claim
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            <MiniStat tone="sky" label="Total Claim Member" value={`${claimTotals.members} member`} icon={<Users className="h-4 w-4" />} />
            <MiniStat tone="emerald" label="Total Claim Hadiah" value={rp(claimTotals.bonus)} icon={<Trophy className="h-4 w-4" />} />
          </div>

          {state.claims.length === 0 ? (
            <div className="border-t border-border/60 p-10 text-center text-sm text-muted-foreground">
              Belum ada claim
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Tanggal</th>
                    <th className="px-4 py-2 text-left font-medium">Username</th>
                    <th className="px-4 py-2 text-right font-medium">Turnover</th>
                    <th className="px-4 py-2 text-left font-medium">Hadiah</th>
                    <th className="px-4 py-2 text-right font-medium">Nilai</th>
                    <th className="px-4 py-2 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {state.claims.map((r) => (
                    <tr key={r.id} className="border-t border-border/50 hover:bg-secondary/30">
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {new Date(r.claimed_at).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-2 font-semibold text-primary">{r.username}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs">{num(r.turnover)}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{r.prize_text}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {r.prize_amount > 0 ? rp(r.prize_amount) : <span className="text-muted-foreground">Barang</span>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleDeleteClaim(r.id)}
                          title="Hapus"
                          className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const TONES = {
  sky: "from-sky-500/15 to-sky-500/0 border-sky-500/25 text-sky-300",
  amber: "from-amber-500/15 to-amber-500/0 border-amber-500/25 text-amber-300",
  emerald: "from-emerald-500/15 to-emerald-500/0 border-emerald-500/25 text-emerald-300",
} as const;

function MiniStat({
  label, value, tone, icon,
}: { label: string; value: string; tone: keyof typeof TONES; icon?: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border bg-gradient-to-br p-3", TONES[tone])}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider opacity-80">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
