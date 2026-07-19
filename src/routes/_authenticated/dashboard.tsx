import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  Settings,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
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
}
interface BankAccountRow {
  id: string;
  channel_name: string;
  channel_kind: string;
  account_name: string;
  balance: number;
  online: boolean;
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function statusBadge(s: string) {
  if (s === "Approved" || s === "Online") return <Badge className="bg-success/15 text-success hover:bg-success/20">{s}</Badge>;
  if (s === "Pending" || s === "Maintenance") return <Badge className="bg-warning/15 text-warning hover:bg-warning/20">{s}</Badge>;
  return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20">{s}</Badge>;
}

const QUICK_LINKS: Array<{
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  desc: string;
}> = [
  { label: "Deposit Bank",     to: "/deposit/bank/bca",       icon: Landmark,  tone: "from-sky-500/20 to-sky-500/0 ring-sky-500/30 text-sky-300",           desc: "BCA · BNI · BRI · Mandiri" },
  { label: "Deposit E-money",  to: "/deposit/emoney/dana",    icon: Wallet,    tone: "from-violet-500/20 to-violet-500/0 ring-violet-500/30 text-violet-300", desc: "DANA · OVO · GoPay · LinkAja" },
  { label: "Deposit Pulsa",    to: "/deposit/pulsa/telkomsel",icon: Smartphone,tone: "from-emerald-500/20 to-emerald-500/0 ring-emerald-500/30 text-emerald-300", desc: "Telkomsel · XL" },
  { label: "Lucky Spin",       to: "/bonus/lucky-spin",       icon: Sparkles,  tone: "from-amber-500/20 to-amber-500/0 ring-amber-500/30 text-amber-300",   desc: "Bonus adjustment" },
  { label: "Bonus Adjustment", to: "/bonus/kamis-ceria",      icon: Gift,      tone: "from-rose-500/20 to-rose-500/0 ring-rose-500/30 text-rose-300",       desc: "Kamis Ceria · Gebyar" },
  { label: "Manage Bank",      to: "/settings/bank",          icon: Settings,  tone: "from-primary/20 to-primary/0 ring-primary/30 text-primary",           desc: "Rekening & saldo" },
];

function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: "today", from: "", to: "" });
  const { from: effFrom, to: effTo } = useMemo(() => resolveDateRange(dateRange), [dateRange]);

  const { data: deposits = [] } = useQuery<DepositRow[]>({
    queryKey: ["dashboard-deposits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits" as never)
        .select("id,channel,iso_date,amount,status,username,full_name")
        .order("iso_date", { ascending: false })
        .limit(500);
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

  const inRange = deposits.filter((d) => (!effFrom || d.iso_date >= effFrom) && (!effTo || d.iso_date <= effTo));
  const totalAmount = inRange.reduce((s, d) => s + Number(d.amount || 0), 0);
  const approvedCount = inRange.filter((d) => d.status === "Approved").length;
  const pendingCount = inRange.filter((d) => d.status === "Pending").length;
  const uniqueMembers = new Set(inRange.map((d) => d.username)).size;

  // 14-day trend series
  const trend = useMemo(() => {
    const days: { day: string; deposit: number; count: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const day = deposits.filter((r) => r.iso_date === iso);
      const sum = day.reduce((s, r) => s + Number(r.amount || 0), 0);
      days.push({ day: `${d.getDate()}/${d.getMonth() + 1}`, deposit: sum, count: day.length });
    }
    return days;
  }, [deposits]);

  // Channel breakdown
  const channelStats = useMemo(() => {
    const map = new Map<string, number>();
    inRange.forEach((r) => map.set(r.channel, (map.get(r.channel) ?? 0) + Number(r.amount || 0)));
    return Array.from(map.entries()).map(([channel, amount]) => ({ channel, amount }));
  }, [inRange]);

  // Top members
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

  const latestTx = inRange.slice(0, 8);
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

      {/* Quick access grid */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {QUICK_LINKS.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            preload="intent"
            className={cn(
              "group relative overflow-hidden rounded-xl bg-gradient-to-br p-4 ring-1 transition hover:-translate-y-0.5 hover:shadow-lg",
              q.tone,
            )}
          >
            <div className="flex items-center justify-between">
              <q.icon className="h-5 w-5" />
              <ChevronRight className="h-4 w-4 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-80" />
            </div>
            <div className="mt-3 text-sm font-semibold text-foreground">{q.label}</div>
            <div className="text-[11px] text-muted-foreground">{q.desc}</div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="glass-panel soft-shadow rounded-xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Deposit Trend</h3>
              <p className="text-xs text-muted-foreground">14 hari terakhir</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">Auto Refresh</Badge>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(1)}jt`} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => fmt(v)}
                />
                <Area type="monotone" dataKey="deposit" stroke="var(--color-primary)" fill="url(#gDep)" strokeWidth={2} />
              </AreaChart>
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
                  <Bar dataKey="amount" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
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

      {/* Latest transactions */}
      <div className="mt-6 glass-panel soft-shadow rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Latest Transactions</h3>
            <p className="text-xs text-muted-foreground">Update realtime dari semua channel</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/deposit/bank/bca">Lihat semua</Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead>Tanggal</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latestTx.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada transaksi pada periode ini
                </TableCell>
              </TableRow>
            ) : latestTx.map((t) => (
              <TableRow key={t.id} className="border-border/60">
                <TableCell className="text-xs text-muted-foreground">{t.iso_date}</TableCell>
                <TableCell className="font-medium">{t.username}</TableCell>
                <TableCell>{t.channel}</TableCell>
                <TableCell className="text-right font-medium">{fmt(Number(t.amount))}</TableCell>
                <TableCell className="text-right">{statusBadge(t.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
