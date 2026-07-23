import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Trash2, Check, Search, Calendar, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DateRangeSelect, resolveDateRange, type DateRangeValue } from "@/components/common/DateRangeSelect";
import { supabase } from "@/integrations/supabase/client";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";
import { RefreshButton } from "@/components/common/RefreshButton";

export const Route = createFileRoute("/_authenticated/bonus/lucky-spin")({
  head: () => ({ meta: [{ title: "Lucky Spin — Admin Console" }] }),
  component: LuckySpinPage,
});

type Entry = {
  id: string;
  username: string;
  ticket: string;
  bonus: number;
  status: "input" | "complete";
  processed_at: string | null;
  iso_date: string | null;
  created_at: string;
};

const MAX_INPUT_TICKETS = 10;
const INPUT_PAGE_SIZE = 20;
const COMPLETE_PAGE_SIZE = 10;
const QK = ["lucky-spin-entries"] as const;


function parseTickets(raw: string): string[] {
  return raw
    .split(/[\s,;\n\r\t]+/)
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length >= 9 && t.length <= 12 && /^[A-Z0-9]+$/.test(t));
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function LuckySpinPage() {
  const qc = useQueryClient();
  const confirmDelete = useConfirmDelete();
  const askDelete = async (id: string) => {
    const ok = await confirmDelete({ title: "Hapus username ini?", description: "Yakin untuk hapus?." });
    if (ok) deleteMut.mutate(id);
  };
  const [pasteValue, setPasteValue] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: "today", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(1);
  // Local draft edits keyed by row id (username / bonus) so typing doesn't require a network round-trip per keystroke.
  const [drafts, setDrafts] = useState<Record<string, { username?: string; bonus?: string }>>({});

  const { data: rows = [] } = useQuery({
    queryKey: QK,
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from("lucky_spin_entries")
        .select("id,username,ticket,bonus,status,processed_at,iso_date,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Entry[];
    },
  });

  const inputRows = useMemo(
    () =>
      rows
        .filter((r) => r.status === "input")
        .slice()
        .reverse(),
    [rows],
  );
  const completeRows = useMemo(
    () =>
      rows
        .filter((r) => r.status === "complete")
        .slice()
        .sort((a, b) => {
          const ta = new Date(a.processed_at ?? a.created_at).getTime();
          const tb = new Date(b.processed_at ?? b.created_at).getTime();
          return tb - ta;
        }),
    [rows],
  );

  const insertMut = useMutation({
    mutationFn: async (payload: { username?: string; ticket: string; bonus?: number }[]) => {
      const { data: sess } = await supabase.auth.getUser();
      const created_by = sess.user?.id ?? null;
      const { error } = await supabase.from("lucky_spin_entries").insert(
        payload.map((p) => ({
          username: p.username ?? "",
          ticket: p.ticket,
          bonus: p.bonus ?? 0,
          status: "input",
          created_by,
        })),
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (v: { id: string; patch: Partial<Entry> }) => {
      const { error } = await supabase.from("lucky_spin_entries").update(v.patch).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lucky_spin_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
    onError: (e: Error) => toast.error(e.message),
  });

  const getDraft = (row: Entry, field: "username" | "bonus") => {
    const d = drafts[row.id];
    if (d && d[field] !== undefined) return d[field] as string;
    if (field === "username") return row.username;
    return row.bonus ? String(row.bonus) : "";
  };

  const setDraft = (id: string, field: "username" | "bonus", value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const commitDraft = (row: Entry) => {
    const d = drafts[row.id];
    if (!d) return;
    const patch: Partial<Entry> = {};
    if (d.username !== undefined && d.username !== row.username) patch.username = d.username;
    if (d.bonus !== undefined) {
      const n = Number(d.bonus.replace(/[^\d]/g, "")) || 0;
      if (n !== row.bonus) patch.bonus = n;
    }
    if (Object.keys(patch).length > 0) updateMut.mutate({ id: row.id, patch });
  };


  const handleAddFromPaste = () => {
    const tickets = parseTickets(pasteValue);
    if (tickets.length === 0) {
      toast.error("Tiket tidak valid. Minimal 9 karakter alfanumerik per tiket.");
      return;
    }
    insertMut.mutate(
      tickets.map((t) => ({ ticket: t })),
      {
        onSuccess: () => toast.success(`${tickets.length} tiket ditambahkan`),
      },
    );
    setPasteValue("");
  };

  const processRow = (row: Entry) => {
    const draft = drafts[row.id] ?? {};
    const username = (draft.username ?? row.username).trim();
    const bonusStr = draft.bonus ?? String(row.bonus ?? "");
    const bonusNum = Number(bonusStr.replace(/[^\d]/g, ""));
    if (!username) return toast.error("Username wajib diisi");
    if (!row.ticket || row.ticket.length < 9) return toast.error("Tiket minimal 9 karakter");
    if (!bonusNum || bonusNum <= 0) return toast.error("Nominal bonus tidak valid");

    updateMut.mutate(
      {
        id: row.id,
        patch: {
          username,
          bonus: bonusNum,
          status: "complete",
          processed_at: new Date().toISOString(),
          iso_date: todayISO(),
        },
      },
      { onSuccess: () => toast.success(`Bonus untuk ${username} berhasil diproses`) },
    );
    setDrafts((prev) => {
      const n = { ...prev };
      delete n[row.id];
      return n;
    });
  };

  const { effFrom, effTo } = useMemo(() => {
    const r = resolveDateRange(dateRange);
    return { effFrom: r.from, effTo: r.to };
  }, [dateRange]);

  const filteredComplete = useMemo(() => {
    const q = search.trim().toLowerCase();
    return completeRows.filter((r) => {
      const iso = r.iso_date ?? (r.processed_at ? r.processed_at.slice(0, 10) : "");
      if (effFrom && iso < effFrom) return false;
      if (effTo && iso > effTo) return false;
      if (!q) return true;
      return r.username.toLowerCase().includes(q) || r.ticket.toLowerCase().includes(q);
    });
  }, [completeRows, search, effFrom, effTo]);

  const totalPages = Math.max(1, Math.ceil(filteredComplete.length / COMPLETE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedComplete = filteredComplete.slice(
    (currentPage - 1) * COMPLETE_PAGE_SIZE,
    currentPage * COMPLETE_PAGE_SIZE,
  );

  const inputTotalPages = Math.max(1, Math.ceil(inputRows.length / INPUT_PAGE_SIZE));
  const currentInputPage = Math.min(inputPage, inputTotalPages);
  const pagedInput = inputRows.slice((currentInputPage - 1) * INPUT_PAGE_SIZE, currentInputPage * INPUT_PAGE_SIZE);

  const filledCount = inputRows.filter((r) => r.username).length;
  const totalMember = new Set(filteredComplete.map((r) => r.username)).size;
  const totalBonus = filteredComplete.reduce((s, r) => s + r.bonus, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 ring-1 ring-amber-500/30">
          <Sparkles className="size-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Lucky Spin</h1>
          <p className="text-sm text-muted-foreground">Data kiri = input baru • Data kanan = sudah Complete</p>
        </div>
        <RefreshButton queryKeys={[QK]} />
      </motion.div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        {/* ================= INPUT DATA ================= */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel soft-shadow rounded-2xl border border-border/60 bg-card/60 backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">INPUT DATA</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Textarea
                  value={pasteValue}
                  onChange={(e) => setPasteValue(e.target.value)}
                  placeholder="paste di sini"
                  className="h-10 min-h-10 w-64 resize-none rounded-lg border-border/60 bg-background/60 py-2 pr-14 text-sm"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {parseTickets(pasteValue).length}/{MAX_INPUT_TICKETS}
                </span>
              </div>
              <Button onClick={handleAddFromPaste} size="sm" className="gap-1.5" disabled={insertMut.isPending}>
                <Plus className="size-4" />
                Tambah
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 text-left">Username</th>
                  <th className="px-3 py-3 text-left">Tiket</th>
                  <th className="px-3 py-3 text-left">Inject Bonus</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagedInput.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Belum ada data input. Paste tiket atau klik “Baris”.
                    </td>
                  </tr>
                ) : (
                  pagedInput.map((row) => (
                    <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5">
                        <Input
                          value={getDraft(row, "username")}
                          onChange={(e) => setDraft(row.id, "username", e.target.value)}
                          onBlur={() => commitDraft(row)}
                          placeholder="username"
                          className="h-9 bg-background/40"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-xs tracking-wider text-foreground/90">{row.ticket}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Input
                          value={getDraft(row, "bonus")}
                          onChange={(e) => setDraft(row.id, "bonus", e.target.value.replace(/[^\d.,]/g, ""))}
                          onBlur={() => commitDraft(row)}
                          placeholder="Nominal"
                          className="h-9 bg-background/40"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") processRow(row);
                          }}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={row.username ? "pending" : "idle"} />
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                            onClick={() => processRow(row)}
                            title="Proses"
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(row.id)}
                            title="Hapus"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
            <span>
              {filledCount} terisi dari {inputRows.length} baris
            </span>
            <div className="flex items-center gap-2">
              <Pagination page={currentInputPage} totalPages={inputTotalPages} onChange={setInputPage} />
            </div>
          </div>
        </motion.section>

        {/* ================= DATA COMPLETE ================= */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel soft-shadow rounded-2xl border border-border/60 bg-card/60 backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">DATA COMPLETE</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari username.."
                  className="h-9 w-56 bg-background/60 pl-9"
                />
              </div>
              <DateRangeSelect
                value={dateRange}
                onChange={(v) => {
                  setDateRange(v);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
            <StatCard
              label="Total Member Claim"
              value={`${totalMember}`}
              suffix="member"
              accent="from-sky-500/15 to-sky-500/5 ring-sky-500/20 text-sky-300"
            />
            <StatCard
              label="Total Claim Bonus"
              value={`Rp ${totalBonus.toLocaleString("id-ID")}`}
              accent="from-emerald-500/15 to-emerald-500/5 ring-emerald-500/20 text-emerald-300"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border/60 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 text-left">Tanggal</th>
                  <th className="px-3 py-3 text-left">Jam</th>
                  <th className="px-3 py-3 text-left">Username</th>
                  <th className="px-3 py-3 text-left">Tiket</th>
                  <th className="px-3 py-3 text-left">Inject Bonus</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagedComplete.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      <Calendar className="mx-auto mb-2 size-5 opacity-50" />
                      Belum ada data complete untuk periode ini
                    </td>
                  </tr>
                ) : (
                  pagedComplete.map((r) => {
                    const d = r.processed_at ? new Date(r.processed_at) : new Date(r.created_at);
                    return (
                      <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-muted-foreground">{d.toLocaleDateString("id-ID")}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td className="px-3 py-3 font-medium">{r.username}</td>
                        <td className="px-3 py-3 font-mono text-xs">{r.ticket}</td>
                        <td className="px-3 py-3 text-emerald-300">Rp {r.bonus.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-3">
                          <StatusPill status="complete" />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(r.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filteredComplete.length === 0 ? 0 : (currentPage - 1) * COMPLETE_PAGE_SIZE + 1} to{" "}
              {Math.min(currentPage * COMPLETE_PAGE_SIZE, filteredComplete.length)} of {filteredComplete.length} entries
            </span>
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "pending" | "complete" | "idle" }) {
  const map = {
    pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
    complete: { label: "Complete", cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
    idle: { label: "Belum Digunakan", cls: "bg-white/5 text-muted-foreground ring-border/60" },
  } as const;
  const s = map[status];
  return (
    <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium ring-1", s.cls)} variant="secondary">
      {s.label}
    </Badge>
  );
}

function StatCard({ label, value, suffix, accent }: { label: string; value: string; suffix?: string; accent: string }) {
  return (
    <div className={cn("rounded-xl bg-gradient-to-br p-4 ring-1", accent)}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-semibold text-foreground">{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const arr: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" className="size-7" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="size-4" />
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={p === page ? "default" : "ghost"}
          className={cn("h-7 min-w-7 px-2 text-xs", p === page && "bg-primary text-primary-foreground")}
          onClick={() => onChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
