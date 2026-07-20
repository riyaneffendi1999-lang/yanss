import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { supabase } from "@/integrations/supabase/client";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const attachFreshSupabaseAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  if (typeof window === "undefined") return next();

  const now = Math.floor(Date.now() / 1000);
  const { data } = await supabase.auth.getSession();
  let session = data.session;

  if (session?.expires_at && session.expires_at <= now + 60) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session ?? session;
  }

  return next({
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  });
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, attachFreshSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
