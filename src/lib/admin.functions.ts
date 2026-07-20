import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const ROLES = ["head", "supervisor", "ast_spv", "staff"] as const;
type Role = (typeof ROLES)[number];

function readSupabaseConfig() {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Konfigurasi backend belum tersedia. Publish ulang aplikasi lalu refresh halaman.");
  }

  return { url, publishableKey };
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      (supabaseKey.startsWith("sb_publishable_") || supabaseKey.startsWith("sb_secret_")) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

async function getAdminClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const { url } = readSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("Konfigurasi backend admin belum tersedia. Publish ulang aplikasi lalu refresh halaman.");
  }

  return createClient(url, serviceKey, {
    global: { fetch: createSupabaseFetch(serviceKey) },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function assertHead(supabase: any, userId: string) {
  const [{ data: isHead, error: headErr }, { data: isSuperAdmin, error: superErr }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "head" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" }),
  ]);

  if (headErr || superErr) {
    throw new Error(headErr?.message || superErr?.message || "Gagal memeriksa role admin");
  }

  if (!isHead && !isSuperAdmin) {
    throw new Error("Forbidden: hanya Head yang boleh mengelola admin");
  }
}

async function requireAdminSession() {
  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: silakan logout lalu login kembali");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    throw new Error("Unauthorized: token login tidak ditemukan");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const { url, publishableKey } = readSupabaseConfig();
  const supabase = createClient(url, publishableKey, {
    global: {
      fetch: createSupabaseFetch(publishableKey),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Use Supabase Auth server validation instead of local JWT claims parsing,
  // so both legacy and newer signing tokens work on custom domains.
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) {
    throw new Error("Unauthorized: sesi login tidak valid, silakan login ulang");
  }

  return { supabase, userId: data.user.id };
}

function usernameToEmail(username: string) {
  const u = username.trim().toLowerCase();
  return u.includes("@") ? u : `${u}@maxslot88.local`;
}

// -----------------------------------------------------------------------------
// SEED: bootstrap the Head account (idempotent, no auth required)
// -----------------------------------------------------------------------------
export const seedHeadAccount = createServerFn({ method: "POST" }).handler(async () => {
  const supabaseAdmin = await getAdminClient();
  const email = "riyan@maxslot88.local";
  const password = "riyan123";

  // Find existing
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);
  let user = list.users.find((u) => u.email === email);

  if (!user) {
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Riyan" },
      });
    if (createErr) throw new Error(createErr.message);
    user = created.user!;
  } else {
    await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
  }

  // Ensure profile
  await supabaseAdmin
    .from("profiles")
    .upsert({ id: user.id, full_name: "Riyan", is_active: true });

  // Wipe non-head roles and set 'head'
  await supabaseAdmin.from("user_roles").delete().eq("user_id", user.id);
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: user.id, role: "head" });
  if (roleErr) throw new Error(roleErr.message);

  return { ok: true, userId: user.id, username: "riyan" };
});

// -----------------------------------------------------------------------------
// LIST admins (auth: head/super_admin)
// -----------------------------------------------------------------------------
export const listAdmins = createServerFn({ method: "GET" })
  .handler(async () => {
    const session = await requireAdminSession();
    await assertHead(session.supabase, session.userId);
    const supabaseAdmin = await getAdminClient();

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (pErr) throw new Error(pErr.message);

    const { data: roles, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rErr) throw new Error(rErr.message);

    const { data: authList, error: aErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (aErr) throw new Error(aErr.message);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role as string);
      rolesByUser.set(r.user_id, arr);
    }

    const emailById = new Map<string, string>();
    const lastSignInById = new Map<string, string | null>();
    for (const u of authList.users) {
      emailById.set(u.id, u.email ?? "");
      lastSignInById.set(u.id, u.last_sign_in_at ?? null);
    }

    return (profiles ?? []).map((p) => {
      const email = emailById.get(p.id) ?? "";
      const username = email.endsWith("@maxslot88.local")
        ? email.replace("@maxslot88.local", "")
        : email;
      return {
        id: p.id,
        username,
        email,
        full_name: p.full_name,
        is_active: p.is_active,
        created_at: p.created_at,
        last_sign_in_at: lastSignInById.get(p.id) ?? null,
        roles: rolesByUser.get(p.id) ?? [],
      };
    });
  });

// -----------------------------------------------------------------------------
// CREATE admin
// -----------------------------------------------------------------------------
const createSchema = z.object({
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/, "username tidak valid"),
  full_name: z.string().trim().min(2).max(100),
  password: z.string().min(6).max(100),
  role: z.enum(ROLES),
});

export const createAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => createSchema.parse(d))
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    await assertHead(session.supabase, session.userId);
    const supabaseAdmin = await getAdminClient();
    const email = usernameToEmail(data.username);

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (cErr) throw new Error(cErr.message);
    const uid = created.user!.id;

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: uid, full_name: data.full_name, is_active: true });

    // Trigger already inserted a default role (admin). Replace with chosen role.
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: uid, role: data.role });
    if (rErr) throw new Error(rErr.message);

    return { ok: true, id: uid };
  });

// -----------------------------------------------------------------------------
// UPDATE admin (role, active, optional password/full_name)
// -----------------------------------------------------------------------------
const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(ROLES).optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(6).max(100).optional().or(z.literal("")),
});

export const updateAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => updateSchema.parse(d))
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    await assertHead(session.supabase, session.userId);
    const supabaseAdmin = await getAdminClient();

    if (data.full_name !== undefined || data.is_active !== undefined) {
      const patch: any = {};
      if (data.full_name !== undefined) patch.full_name = data.full_name;
      if (data.is_active !== undefined) patch.is_active = data.is_active;
      const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
    }

    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.id, role: data.role });
      if (error) throw new Error(error.message);
    }

    if (data.password && data.password.length >= 6) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        password: data.password,
      });
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

// -----------------------------------------------------------------------------
// DELETE admin
// -----------------------------------------------------------------------------
export const deleteAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    await assertHead(session.supabase, session.userId);
    if (data.id === session.userId) {
      throw new Error("Tidak dapat menghapus akun sendiri");
    }
    const supabaseAdmin = await getAdminClient();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
