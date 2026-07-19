import { type ReactNode, useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { useAllowedPages, isPageAllowed } from "@/hooks/useAccess";
import { toast } from "sonner";

function AccessGuard({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { allowed, fullAccess, loading } = useAllowedPages();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (isPageAllowed(pathname, allowed, fullAccess)) return;
    // Redirect to first allowed page or profile
    const fallback = allowed.has("/dashboard")
      ? "/dashboard"
      : allowed.values().next().value ?? "/profile";
    toast.error("Anda tidak memiliki akses ke halaman tersebut");
    navigate({ to: fallback, replace: true });
  }, [pathname, allowed, fullAccess, loading, navigate]);

  if (!loading && !isPageAllowed(pathname, allowed, fullAccess)) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
        Mengalihkan…
      </div>
    );
  }
  return <>{children}</>;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
            <Topbar />
          </header>
          <main className="flex-1 p-4 md:p-6">
            <AccessGuard>{children}</AccessGuard>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
