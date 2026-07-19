import { createFileRoute } from "@tanstack/react-router";
import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Crown, Eye, EyeOff, Loader2, Pencil, Plus, Search, ShieldCheck, Trash2, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { createAdmin, deleteAdmin, listAdmins, updateAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/settings/admin")({
  head: () => ({ meta: [{ title: "Manage Admin — Admin Console" }] }),
  component: ManageAdminPage,
});

const ROLE_META: Record<string, { label: string; className: string; icon?: typeof Crown }> = {
  head: { label: "Head", className: "bg-red-500/15 text-red-400 border-red-500/30", icon: Crown },
  supervisor: {
    label: "Supervisor",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  ast_spv: {
    label: "Ast. Spv",
    className: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  staff: { label: "Staff", className: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  super_admin: {
    label: "Super Admin",
    className: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
    icon: ShieldCheck,
  },
  admin: { label: "Admin", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  cs: { label: "CS", className: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  finance: {
    label: "Finance",
    className: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  },
};

const ROLE_OPTIONS = [
  { value: "head", label: "Head" },
  { value: "supervisor", label: "Supervisor" },
  { value: "ast_spv", label: "Ast. Spv" },
  { value: "staff", label: "Staff" },
] as const;

type AdminRow = Awaited<ReturnType<typeof listAdmins>>[number];

const createFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "min 3 karakter")
    .regex(/^[a-zA-Z0-9._-]+$/, "hanya huruf, angka, . _ -"),
  full_name: z.string().trim().min(2, "wajib diisi"),
  password: z.string().min(6, "min 6 karakter"),
  role: z.enum(["head", "supervisor", "ast_spv", "staff"]),
});
type CreateValues = z.infer<typeof createFormSchema>;

const editFormSchema = z.object({
  full_name: z.string().trim().min(2, "wajib diisi"),
  role: z.enum(["head", "supervisor", "ast_spv", "staff"]),
  password: z.string().min(6, "min 6 karakter").optional().or(z.literal("")),
});
type EditValues = z.infer<typeof editFormSchema>;

function ManageAdminPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAdmins);
  const createFn = useServerFn(createAdmin);
  const updateFn = useServerFn(updateAdmin);
  const deleteFn = useServerFn(deleteAdmin);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [editRow, setEditRow] = useState<AdminRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<AdminRow | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admins"],
    queryFn: () => listFn(),
  });

  const rows = useMemo(() => {
    const all = data ?? [];
    return all.filter((r) => {
      if (roleFilter !== "all" && !r.roles.includes(roleFilter)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.username.toLowerCase().includes(q) ||
        (r.full_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, search, roleFilter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { total: (data ?? []).length };
    for (const r of data ?? []) for (const role of r.roles) map[role] = (map[role] ?? 0) + 1;
    return map;
  }, [data]);

  const createMut = useMutation({
    mutationFn: (v: CreateValues) => createFn({ data: v }),
    onSuccess: () => {
      toast.success("Admin berhasil dibuat");
      setOpenCreate(false);
      qc.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (e: Error) => toast.error("Gagal membuat admin", { description: e.message }),
  });

  const updateMut = useMutation({
    mutationFn: (v: {
      id: string;
      full_name?: string;
      role?: "head" | "supervisor" | "ast_spv" | "staff";
      is_active?: boolean;
      password?: string;
    }) => updateFn({ data: v }),
    onSuccess: () => {
      toast.success("Admin diperbarui");
      setEditRow(null);
      qc.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (e: Error) => toast.error("Gagal memperbarui", { description: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Admin dihapus");
      setDeleteRow(null);
      qc.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (e: Error) => toast.error("Gagal menghapus", { description: e.message }),
  });

  return (
    <div>
      <PageHeader
        title="Manage Admin"
        description="Kelola daftar admin, tingkatan role, dan status akses."
        actions={
          <Button onClick={() => setOpenCreate(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Tambah Admin
          </Button>
        }
      />

      {/* summary tiles removed per request */}

      <div className="glass-panel soft-shadow rounded-xl">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border/60 p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari username.."
              className="pl-8"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin (legacy)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Login Terakhir</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-destructive">
                    {(error as Error)?.message ?? "Gagal memuat"}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.username}</div>
                      {r.full_name && <div className="text-[11px] text-muted-foreground">{r.full_name}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          r.roles.map((role) => {
                            const meta = ROLE_META[role] ?? {
                              label: role,
                              className: "bg-muted text-muted-foreground border-border",
                            };
                            const Icon = meta.icon;
                            return (
                              <Badge key={role} variant="outline" className={`gap-1 ${meta.className}`}>
                                {Icon && <Icon className="h-3 w-3" />}
                                {meta.label}
                              </Badge>
                            );
                          })
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={r.is_active}
                        onCheckedChange={(v) => updateMut.mutate({ id: r.id, is_active: v })}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.last_sign_in_at ? new Date(r.last_sign_in_at).toLocaleString("id-ID") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditRow(r)} aria-label="Ubah">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteRow(r)}
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        loading={createMut.isPending}
        onSubmit={(v) => createMut.mutate(v)}
      />

      <EditDialog
        row={editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        loading={updateMut.isPending}
        onSubmit={(v) =>
          editRow &&
          updateMut.mutate({
            id: editRow.id,
            full_name: v.full_name,
            role: v.role,
            password: v.password || undefined,
          })
        }
      />

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun <b>{deleteRow?.username}</b> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteRow && deleteMut.mutate(deleteRow.id)}
            >
              {deleteMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-xl border border-border/60 bg-gradient-to-br ${tone} p-3`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: CreateValues) => void;
  loading: boolean;
}) {
  const form = useForm<CreateValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { username: "", full_name: "", password: "", role: "staff" },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) form.reset();
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Tambah Admin
          </DialogTitle>
          <DialogDescription>Buat akun admin baru dengan tingkatan role.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <Field label="Username" error={form.formState.errors.username?.message}>
            <Input placeholder="mis. andi" {...form.register("username")} />
          </Field>
          <Field label="Nama Lengkap" error={form.formState.errors.full_name?.message}>
            <Input placeholder="Nama tampilan" {...form.register("full_name")} />
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message}>
            <PasswordInput placeholder="min. 6 karakter" {...form.register("password")} />
          </Field>
          <Field label="Role" error={form.formState.errors.role?.message}>
            <Select value={form.watch("role")} onValueChange={(v) => form.setValue("role", v as CreateValues["role"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  row,
  onOpenChange,
  onSubmit,
  loading,
}: {
  row: AdminRow | null;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: EditValues) => void;
  loading: boolean;
}) {
  const currentRole =
    (row?.roles.find((r) => ROLE_OPTIONS.some((o) => o.value === r)) as EditValues["role"]) ?? "staff";

  const form = useForm<EditValues>({
    resolver: zodResolver(editFormSchema),
    values: {
      full_name: row?.full_name ?? "",
      role: currentRole,
      password: "",
    },
  });

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Ubah Admin
          </DialogTitle>
          <DialogDescription>
            {row?.username} · {row?.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <Field label="Nama Lengkap" error={form.formState.errors.full_name?.message}>
            <Input {...form.register("full_name")} />
          </Field>
          <Field label="Role" error={form.formState.errors.role?.message}>
            <Select value={form.watch("role")} onValueChange={(v) => form.setValue("role", v as EditValues["role"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Reset Password (opsional)" error={form.formState.errors.password?.message}>
            <PasswordInput placeholder="Kosongkan bila tidak diubah" {...form.register("password")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput(props, ref) {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={show ? "text" : "password"} className="pr-9" {...props} />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
