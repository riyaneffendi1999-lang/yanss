import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Clock,
  TrendingUp,
  Users,
  Landmark,
  Wallet,
  Smartphone,
  Gift,
  Activity as ActivityIcon,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangeSelect, resolveDateRange, type DateRangeValue } from "@/components/common/DateRangeSelect";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Admin Console" }] }),
  component: DashboardPage,
});

interface DepositRow {
  id: string;
  channel: string;
  iso_date: string;
  amount: number;
  status: string;
  username: string;
  full_name: string;
  group_tier?: string | null;
}

interface BankAccountRow {
  id: string;
  channel_name: string;
  channel_kind: string;
  account_name: string;
  balance: number;
  online: boolean;
}
interface ActivityRow {
  id: string;
  created_at: string;
  action: string;
  entity: string | null;
  actor_name: string | null;
  meta: Record<string, unknown> | null;
}

const BANK_CHANNELS = ["BCA", "BNI", "BRI", "MANDIRI"];
const EMONEY_CHANNELS = ["DANA", "OVO", "GOPAY", "LINKAJA"];
const PULSA_CHANNELS = ["TELKOMSEL", "XL"];

const GROUP_META = [
  { key: "bank",   label: "Total Deposit Bank",    to: "/deposit/bank/bca",        icon: Landmark,   tone: "from-sky-500/20 to-sky-500/0 ring-sky-500/30 text-sky-300",           channels: BANK_CHANNELS },
  { key: "emoney", label: "Total Deposit E-money", to: "/deposit/emoney/dana",     icon: Wallet,     tone: "from-violet-500/20 to-violet-500/0 ring-violet-500/30 text-violet-300", channels: EMONEY_CHANNELS },
  { key: "pulsa",  label: "Total Deposit Pulsa",   to: "/deposit/pulsa/telkomsel", icon: Smartphone, tone: "from-emerald-500/20 to-emerald-500/0 ring-emerald-500/30 text-emerald-300", channels: PULSA_CHANNELS },
  { key: "bonus",  label: "Total Bonus Adjustment", to: "/bonus/lucky-spin",       icon: Gift,       tone: "from-amber-500/20 to-amber-500/0 ring-amber-500/30 text-amber-300",   channels: [] as string[] },
];

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function statusBadge(s: string) {
  if (s === "Approved" || s === "Online") return <Badge className="bg-success/15 text-success hover:bg-success/20">{s}</Badge>;
  if (s === "Pending" || s === "Maintenance") return <Badge className="bg-warning/15 text-warning hover:bg-warning/20">{s}</Badge>;
  return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20">{s}</Badge>;
}

// Read locally-persisted bonus totals (Lucky Spin, etc.)
function useBonusTotals() {
  const [state, setState] = useState({ total: 0, count: 0, perProgram: [] as { name: string; member: number; bonus: number }[] });
  useEffect(() => {
    const compute = () => {
      const programs: { key: string; name: string }[] = [
        { key: "lucky-spin/complete-rows", name: "Lucky Spin" },
        { key: "kamis-ceria:complete", name: "Kamis Ceria" },
        { key: "gebyar-turnover:complete", name: "Gebyar Turnover" },
      ];
      let total = 0;
      let count = 0;
      const perProgram: { name: string; member: number; bonus: number }[] = [];
      for (const p of programs) {
        let pTotal = 0;
        const members = new Set<string>();
        try {
          const raw = localStorage.getItem(p.key);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              for (const r of arr) {
                const v = Number(r?.bonus ?? r?.amount ?? r?.inject ?? 0);
                if (!Number.isNaN(v)) { pTotal += v; total += v; }
                count += 1;
                if (r?.username) members.add(String(r.username));
              }
            }
          }
        } catch { /* ignore */ }
        perProgram.push({ name: p.name, bonus: pTotal, member: members.size });
      }
      setState({ total, count, perProgram });
    };
    compute();
    const onStorage = () => compute();
    window.addEventListener("storage", onStorage);
    const t = setInterval(compute, 4000);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(t); };
  }, []);
  return state;
}

function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: "today", from: "", to: "" });
  const { from: effFrom, to: effTo } = useMemo(() => resolveDateRange(dateRange), [dateRange]);
  const bonusTotals = useBonusTotals();

  const { data: deposits = [] } = useQuery<DepositRow[]>({
    queryKey: ["dashboard-deposits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits" as never)
        .select("id,channel,iso_date,amount,status,username,full_name,group_tier")
        .order("iso_date", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as DepositRow[];
    },
  });

  const { data: banks = [] } = useQuery<BankAccountRow[]>({
    queryKey: ["dashboard-banks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts" as never)
        .select("id,channel_name,channel_kind,account_name,balance,online");
      if (error) throw error;
      return (data ?? []) as unknown as BankAccountRow[];
    },
  });

  const { data: activity = [] } = useQuery<ActivityRow[]>({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs" as never)
        .select("id,created_at,action,entity,actor_name,meta")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as ActivityRow[];
    },
  });

  const inRange = deposits.filter((d) => (!effFrom || d.iso_date >= effFrom) && (!effTo || d.iso_date <= effTo));
  const totalAmount = inRange.reduce((s, d) => s + Number(d.amount || 0), 0);
  const approvedCount = inRange.filter((d) => d.status === "Approved").length;
  const pendingCount = inRange.filter((d) => d.status === "Pending").length;
  const uniqueMembers = new Set(inRange.map((d) => d.username)).size;

  // Group totals (Bank / E-money / Pulsa / Bonus)
  const groupTotals = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const g of GROUP_META) map[g.key] = { total: 0, count: 0 };
    for (const r of inRange) {
      const ch = String(r.channel || "").toUpperCase();
      let key: string | null = null;
      if (BANK_CHANNELS.includes(ch)) key = "bank";
      else if (EMONEY_CHANNELS.includes(ch)) key = "emoney";
      else if (PULSA_CHANNELS.includes(ch)) key = "pulsa";
      if (key) {
        map[key].total += Number(r.amount || 0);
        map[key].count += 1;
      }
    }
    map.bonus = { total: bonusTotals.total, count: bonusTotals.count };
    return map;
  }, [inRange, bonusTotals]);

  // 7-day trend: amount + count
  const trend = useMemo(() => {
    const days: { day: string; amount: number; count: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const day = deposits.filter((r) => r.iso_date === iso);
      const sum = day.reduce((s, r) => s + Number(r.amount || 0), 0);
      days.push({ day: `${d.getDate()}/${d.getMonth() + 1}`, amount: sum, count: day.length });
    }
    return days;
  }, [deposits]);

  // Group totals aggregated across all deposits in range (VIP/High/Low/New Reg/Reguler)
  const MEMBER_GROUPS = ["VIP", "High", "Low", "New Registration", "Reguler"] as const;
  const GROUP_COLORS: Record<string, string> = {
    VIP: "rgb(251 191 36)",
    High: "rgb(244 63 94)",
    Low: "rgb(56 189 248)",
    "New Registration": "rgb(52 211 153)",
    Reguler: "rgb(167 139 250)",
  };
  const memberGroupTotals = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const g of MEMBER_GROUPS) map[g] = { total: 0, count: 0 };
    for (const r of inRange as (DepositRow & { group_tier?: string | null })[]) {
      const raw = String(r.group_tier ?? "").trim();
      const key =
        /vip/i.test(raw) ? "VIP" :
        /high/i.test(raw) ? "High" :
        /low/i.test(raw) ? "Low" :
        /new/i.test(raw) ? "New Registration" :
        "Reguler";
      map[key].total += Number(r.amount || 0);
      map[key].count += 1;
    }
    return map;
  }, [inRange]);

  const CHANNEL_COLORS: Record<string, string> = {
    BCA: "rgb(56 189 248)", BNI: "rgb(251 146 60)", BRI: "rgb(59 130 246)", MANDIRI: "rgb(250 204 21)",
    DANA: "rgb(96 165 250)", OVO: "rgb(167 139 250)", GOPAY: "rgb(52 211 153)", LINKAJA: "rgb(248 113 113)",
    TELKOMSEL: "rgb(244 63 94)", XL: "rgb(45 212 191)",
  };
  const channelStats = useMemo(() => {
    const map = new Map<string, number>();
    inRange.forEach((r) => map.set(r.channel, (map.get(r.channel) ?? 0) + Number(r.amount || 0)));
    return Array.from(map.entries()).map(([channel, amount]) => ({
      channel, amount, fill: CHANNEL_COLORS[String(channel).toUpperCase()] ?? "var(--color-primary)",
    }));
  }, [inRange]);


  const topMembers = useMemo(() => {
    const map = new Map<string, { username: string; full_name: string; total: number; count: number }>();
    inRange.forEach((r) => {
      const cur = map.get(r.username) ?? { username: r.username, full_name: r.full_name, total: 0, count: 0 };
      cur.total += Number(r.amount || 0);
      cur.count += 1;
      map.set(r.username, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [inRange]);

  const bankStatus = banks.slice(0, 6);
  const totalBalance = banks.filter((b) => b.online).reduce((s, b) => s + Number(b.balance || 0), 0);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional realtime dari seluruh channel"
        actions={
          <>
            <DateRangeSelect value={dateRange} onChange={setDateRange} />
            <Button size="sm" className="gap-1.5" asChild>
              <Link to="/deposit/bank/bca"><ArrowUpRight className="h-4 w-4" /> Live Report</Link>
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Deposit"    value={fmt(totalAmount)}          delta={`${inRange.length} transaksi`} trend="up"   icon={CircleDollarSign} index={0} />
        <StatCard label="Approved"          value={String(approvedCount)}     delta="Sukses diproses"                trend="up"   icon={TrendingUp}       index={1} />
        <StatCard label="Pending"           value={String(pendingCount)}      delta="Perlu review"                   trend="flat" icon={Clock}            index={2} />
        <StatCard label="Member Unik"       value={String(uniqueMembers)}     delta={`Saldo bank ${fmt(totalBalance)}`} trend="up" icon={Users}         index={3} />
      </div>

      {/* Group totals: Bank / E-money / Pulsa / Bonus */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {GROUP_META.map((g) => {
          const t = groupTotals[g.key];
          return (
            <Link
              key={g.key}
              to={g.to}
              preload="intent"
              className={cn(
                "group relative overflow-hidden rounded-xl bg-gradient-to-br p-5 ring-1 transition hover:-translate-y-0.5 hover:shadow-lg",
                g.tone,
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                  <g.icon className="h-4 w-4" /> {g.label}
                </div>
                <ArrowUpRight className="h-4 w-4 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-80" />
              </div>
              <div className="mt-3 text-2xl font-semibold text-foreground">{fmt(t.total)}</div>
              <div className="text-[11px] text-muted-foreground">
                {t.count} {g.key === "bonus" ? "klaim bonus" : "transaksi"}
                {g.channels.length > 0 && <span className="ml-1">· {g.channels.join(" · ")}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Member Group Totals (aggregated across all deposits in range) */}
      <div className="mt-6 glass-panel soft-shadow rounded-xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Total per Group Member</h3>
            <p className="text-xs text-muted-foreground">Akumulasi seluruh channel deposit · periode terpilih</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Group</th>
                <th className="py-2 px-3 font-medium text-right">Transaksi</th>
                <th className="py-2 pl-3 font-medium text-right">Total Nominal</th>
              </tr>
            </thead>
            <tbody>
              {MEMBER_GROUPS.map((g) => {
                const t = memberGroupTotals[g];
                return (
                  <tr key={g} className="border-b border-border/40 last:border-0">
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: GROUP_COLORS[g] }} />
                        <span className="font-medium">{g}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">{t.count}</td>
                    <td className="py-2.5 pl-3 text-right tabular-nums font-semibold">{fmt(t.total)}</td>
                  </tr>
                );
              })}
              <tr className="text-[13px]">
                <td className="pt-3 pr-3 font-semibold">Total</td>
                <td className="pt-3 px-3 text-right tabular-nums font-semibold">
                  {MEMBER_GROUPS.reduce((s, g) => s + memberGroupTotals[g].count, 0)}
                </td>
                <td className="pt-3 pl-3 text-right tabular-nums font-semibold">
                  {fmt(MEMBER_GROUPS.reduce((s, g) => s + memberGroupTotals[g].total, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>



      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="glass-panel soft-shadow rounded-xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Deposit Trend</h3>
              <p className="text-xs text-muted-foreground">Jumlah deposit & total transaksi · 7 hari terakhir</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Jumlah Deposit</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Total Transaksi</span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="lineAmount" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgb(139 92 246)" />
                    <stop offset="50%" stopColor="rgb(59 130 246)" />
                    <stop offset="100%" stopColor="rgb(236 72 153)" />
                  </linearGradient>
                  <linearGradient id="lineCount" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgb(16 185 129)" />
                    <stop offset="100%" stopColor="rgb(250 204 21)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(1)}jt`} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, name) => name === "amount" ? fmt(v) : `${v} trx`}
                />
                <Line yAxisId="left"  type="monotone" dataKey="amount" stroke="url(#lineAmount)" strokeWidth={3} dot={{ r: 3, fill: "rgb(59 130 246)" }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="count"  stroke="url(#lineCount)"  strokeWidth={3} dot={{ r: 3, fill: "rgb(16 185 129)" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

        <div className="glass-panel soft-shadow rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Bank Status</h3>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </div>
          {bankStatus.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
              Belum ada rekening. <Link to="/settings/bank" className="text-primary underline">Tambah di Manage Bank</Link>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {bankStatus.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{b.channel_name} · {b.account_name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(Number(b.balance ?? 0))}</p>
                  </div>
                  {statusBadge(b.online ? "Online" : "Maintenance")}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Channel + Top Members */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="glass-panel soft-shadow rounded-xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Total per Channel</h3>
              <p className="text-xs text-muted-foreground">Periode terpilih</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {channelStats.length === 0 ? (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">Belum ada data</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={channelStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                  <XAxis dataKey="channel" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(1)}jt`} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => fmt(v)}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {channelStats.map((c) => (<Cell key={c.channel} fill={c.fill} />))}
                  </Bar>

                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel soft-shadow rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Top Members</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          {topMembers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
              Belum ada transaksi
            </div>
          ) : (
            <ul className="space-y-2.5">
              {topMembers.map((m, i) => (
                <li key={m.username} className="flex items-center gap-3 rounded-lg border border-border/70 bg-secondary/50 px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{m.username}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{m.full_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold">{fmt(m.total)}</p>
                    <p className="text-[10px] text-muted-foreground">{m.count} trx</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Distribusi per Metode + Rekap Program Bonus */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="glass-panel soft-shadow rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Distribusi per Metode</h3>
            <p className="text-xs text-muted-foreground">Proporsi transaksi tiap channel · periode terpilih</p>
          </div>
          <div className="h-64 w-full">
            {channelStats.length === 0 ? (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">Belum ada data</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={channelStats} dataKey="amount" nameKey="channel" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {channelStats.map((_, i) => {
                      const palette = ["#38bdf8", "#f59e0b", "#10b981", "#a78bfa", "#f43f5e", "#818cf8", "#22d3ee", "#fb7185"];
                      return <Cell key={i} fill={palette[i % palette.length]} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel soft-shadow rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Rekap Program Bonus</h3>
              <p className="text-xs text-muted-foreground">Total klaim & inject bonus seluruh program</p>
            </div>
            <Gift className="h-4 w-4 text-amber-300" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-gradient-to-br from-sky-500/15 to-sky-500/0 p-4 ring-1 ring-sky-500/25">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-300">Total Klaim</div>
              <div className="mt-1 text-2xl font-semibold">{bonusTotals.count}</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/0 p-4 ring-1 ring-emerald-500/25">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Total Inject Bonus</div>
              <div className="mt-1 text-2xl font-semibold">{fmt(bonusTotals.total)}</div>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {bonusTotals.perProgram.map((p) => (
              <li key={p.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/15 text-amber-300">
                    <Gift className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.member} member</p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-emerald-300">{fmt(p.bonus)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>


      {/* Recent Activity (replaces Latest Transactions) */}
      <div className="mt-6 glass-panel soft-shadow rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Recent Activity</h3>
            <p className="text-xs text-muted-foreground">Aktivitas admin terbaru dari seluruh modul</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings/admin">Kelola admin</Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead>Waktu</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Modul</TableHead>
              <TableHead className="text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                  <ActivityIcon className="mx-auto mb-2 h-4 w-4 opacity-60" />
                  Belum ada aktivitas tercatat
                </TableCell>
              </TableRow>
            ) : activity.map((a) => (
              <TableRow key={a.id} className="border-border/60">
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                </TableCell>
                <TableCell className="font-medium">{a.actor_name ?? "system"}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{a.action}</Badge></TableCell>
                <TableCell className="text-xs">{a.entity ?? "—"}</TableCell>
                <TableCell className="text-right text-[11px] text-muted-foreground truncate max-w-[280px]">
                  {a.meta ? JSON.stringify(a.meta).slice(0, 80) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
