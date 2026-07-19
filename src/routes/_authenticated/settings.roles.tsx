import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shield, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/settings/roles")({
  head: () => ({ meta: [{ title: "Role & Akses — Admin Console" }] }),
  component: RolesPage,
});

type RoleKey = "head" | "supervisor" | "ast_spv" | "staff";
type Perm = { key: string; label: string; group: string };

const roles: { key: RoleKey; label: string; tone: string; desc: string }[] = [
  { key: "head", label: "Head", tone: "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20", desc: "Akses penuh, kelola semua role" },
  { key: "supervisor", label: "Supervisor", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20", desc: "Kelola tim & approval besar" },
  { key: "ast_spv", label: "Ast. Spv", tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20", desc: "Bantu supervisor, approval sedang" },
  { key: "staff", label: "Staff", tone: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20", desc: "Operasional harian" },
];

const permissions: Perm[] = [
  { group: "Dashboard", key: "dashboard.view", label: "Lihat Dashboard" },
  { group: "Deposit", key: "deposit.view", label: "Lihat Transaksi" },
  { group: "Deposit", key: "deposit.create", label: "Input Transaksi" },
  { group: "Deposit", key: "deposit.approve", label: "Approve" },
  { group: "Deposit", key: "deposit.reject", label: "Reject" },
  { group: "Deposit", key: "deposit.export", label: "Export Data" },
  { group: "Bonus", key: "bonus.view", label: "Lihat Bonus" },
  { group: "Bonus", key: "bonus.inject", label: "Inject Bonus" },
  { group: "Bank", key: "bank.view", label: "Lihat Bank" },
  { group: "Bank", key: "bank.manage", label: "CRUD Bank" },
  { group: "Bank", key: "bank.toggle", label: "Toggle Online/Offline" },
  { group: "Admin", key: "admin.view", label: "Lihat Daftar Admin" },
  { group: "Admin", key: "admin.manage", label: "Tambah/Ubah/Hapus Admin" },
  { group: "Role", key: "role.manage", label: "Kelola Role & Akses" },
  { group: "Report", key: "report.view", label: "Lihat Report" },
  { group: "Settings", key: "settings.general", label: "Settings Umum" },
  { group: "Settings", key: "settings.security", label: "Settings Keamanan" },
];

const defaults: Record<RoleKey, string[]> = {
  head: permissions.map((p) => p.key),
  supervisor: permissions.filter((p) => !["role.manage", "admin.manage", "settings.security"].includes(p.key)).map((p) => p.key),
  ast_spv: ["dashboard.view", "deposit.view", "deposit.create", "deposit.approve", "deposit.reject", "deposit.export", "bonus.view", "bonus.inject", "bank.view", "bank.toggle", "admin.view", "report.view"],
  staff: ["dashboard.view", "deposit.view", "deposit.create", "bonus.view", "bank.view", "report.view"],
};

function RolesPage() {
  const [matrix, setMatrix] = useState<Record<RoleKey, Set<string>>>(() => ({
    head: new Set(defaults.head),
    supervisor: new Set(defaults.supervisor),
    ast_spv: new Set(defaults.ast_spv),
    staff: new Set(defaults.staff),
  }));

  const grouped = useMemo(() => {
    const g: Record<string, Perm[]> = {};
    permissions.forEach((p) => { (g[p.group] ??= []).push(p); });
    return g;
  }, []);

  function toggle(role: RoleKey, key: string, checked: boolean) {
    if (role === "head") { toast.info("Head selalu memiliki akses penuh"); return; }
    setMatrix((prev) => {
      const next = { ...prev, [role]: new Set(prev[role]) };
      if (checked) next[role].add(key); else next[role].delete(key);
      return next;
    });
  }

  function reset() {
    setMatrix({
      head: new Set(defaults.head),
      supervisor: new Set(defaults.supervisor),
      ast_spv: new Set(defaults.ast_spv),
      staff: new Set(defaults.staff),
    });
    toast.success("Matriks di-reset ke default");
  }
  function save() { toast.success("Perubahan role & akses disimpan"); }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Shield className="h-6 w-6 text-primary" /> Role & Akses
          </h1>
          <p className="text-sm text-muted-foreground">Atur permission untuk setiap role. Head selalu memiliki akses penuh.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" /> Reset Default</Button>
          <Button onClick={save}><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {roles.map((r) => (
          <Card key={r.key}>
            <CardContent className="p-4">
              <Badge variant="outline" className={r.tone}>{r.label}</Badge>
              <p className="mt-2 text-xs text-muted-foreground">{r.desc}</p>
              <p className="mt-2 text-2xl font-semibold">{matrix[r.key].size}<span className="ml-1 text-xs text-muted-foreground">/ {permissions.length} akses</span></p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Matriks Permission</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Permission</TableHead>
                {roles.map((r) => (
                  <TableHead key={r.key} className="text-center">{r.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(grouped).map(([group, perms]) => (
                <Fragment key={group}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell colSpan={roles.length + 1} className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </TableCell>
                  </TableRow>
                  {perms.map((p) => (
                    <TableRow key={p.key}>
                      <TableCell>
                        <div className="font-medium">{p.label}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{p.key}</div>
                      </TableCell>
                      {roles.map((r) => (
                        <TableCell key={r.key} className="text-center">
                          <Checkbox
                            checked={matrix[r.key].has(p.key)}
                            disabled={r.key === "head"}
                            onCheckedChange={(v) => toggle(r.key, p.key, Boolean(v))}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
