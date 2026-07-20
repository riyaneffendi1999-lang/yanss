import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, UserCircle } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";

export function Topbar() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [hasAuthEvent, setHasAuthEvent] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setHasAuthEvent(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    try {
      await qc.cancelQueries();
      navigate({ to: "/auth", replace: true });
      await supabase.auth.signOut();
      qc.clear();
      toast.success("Berhasil logout");
    } catch (err) {
      console.error("signOut error", err);
      toast.error("Gagal logout, coba lagi");
    }
  }

  return (
    <div className="flex flex-1 items-center gap-3">
      <SidebarTrigger className="text-foreground" />
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifikasi"
          className="relative"
          onClick={() => setHasAuthEvent(false)}
        >
          <Bell className="h-4 w-4" />
          {hasAuthEvent && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Akun">
              <UserCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Akun</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <UserCircle className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
