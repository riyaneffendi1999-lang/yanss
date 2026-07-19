import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Landmark,
  Wallet,
  Smartphone,
  Gift,
  Settings,
  UserCircle,
} from "lucide-react";
import logoAsset from "@/assets/maxslot88-logo.png.asset.json";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAllowedPages, isPageAllowed } from "@/hooks/useAccess";

type Item = { title: string; url: string; icon?: React.ComponentType<{ className?: string }> };
type Group = { label: string; icon: React.ComponentType<{ className?: string }>; items: Item[] };

const singles: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
];

const groups: Group[] = [
  {
    label: "Deposit Bank",
    icon: Landmark,
    items: [
      { title: "BCA", url: "/deposit/bank/bca" },
      { title: "BNI", url: "/deposit/bank/bni" },
      { title: "BRI", url: "/deposit/bank/bri" },
      { title: "MANDIRI", url: "/deposit/bank/mandiri" },
    ],
  },
  {
    label: "Deposit E-money",
    icon: Wallet,
    items: [
      { title: "DANA", url: "/deposit/emoney/dana" },
      { title: "OVO", url: "/deposit/emoney/ovo" },
      { title: "GOPAY", url: "/deposit/emoney/gopay" },
      { title: "LINKAJA", url: "/deposit/emoney/linkaja" },
    ],
  },
  {
    label: "Deposit Pulsa",
    icon: Smartphone,
    items: [
      { title: "TELKOMSEL", url: "/deposit/pulsa/telkomsel" },
      { title: "XL", url: "/deposit/pulsa/xl" },
    ],
  },
  {
    label: "Bonus Adjustment",
    icon: Gift,
    items: [
      { title: "Lucky Spin", url: "/bonus/lucky-spin" },
      { title: "Kamis Ceria", url: "/bonus/kamis-ceria" },
      { title: "Gebyar Turnover", url: "/bonus/gebyar-turnover" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    items: [
      { title: "Manage Admin", url: "/settings/admin" },
      { title: "Manage Bank", url: "/settings/bank" },
      { title: "Role & Akses", url: "/settings/roles" },
    ],
  },
];

const footerItems: Item[] = [{ title: "Profile", url: "/profile", icon: UserCircle }];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => pathname === url;
  const { allowed, fullAccess } = useAllowedPages();
  const canSee = (url: string) => isPageAllowed(url, allowed, fullAccess);

  const visibleSingles = singles.filter((s) => canSee(s.url));
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((it) => canSee(it.url)) }))
    .filter((g) => g.items.length > 0);
  const visibleFooter = footerItems.filter((it) => canSee(it.url));



  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex flex-col items-center gap-2 px-2 py-4">
          <Link to="/dashboard" className="block">
            <img
              src={logoAsset.url}
              alt="MAXSLOT88"
              className="h-16 w-auto object-contain drop-shadow-lg transition-transform hover:scale-105"
            />
          </Link>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Admin Maxslot88
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-1 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {singles.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={cn(
                      "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:font-semibold",
                    )}
                  >
                    <Link to={item.url} preload="intent">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {groups.map((g) => (
          <SidebarGroup key={g.label} className="py-0.5">
            <SidebarGroupLabel
              className={cn(
                "flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45",
                collapsed && "sr-only",
              )}
            >
              <g.icon className="h-3.5 w-3.5 opacity-70" />
              <span>{g.label}</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {collapsed ? (
                <SidebarMenu>
                  {g.items.map((it) => (
                    <SidebarMenuItem key={it.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(it.url)}
                        tooltip={it.title}
                        className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
                      >
                        <Link to={it.url} preload="intent">
                          <g.icon className="h-4 w-4" />
                          <span>{it.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              ) : (
                <SidebarMenuSub className="mx-3 border-l border-sidebar-border/70 pl-3">
                  {g.items.map((it) => (
                    <SidebarMenuSubItem key={it.url}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive(it.url)}
                        className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:font-medium"
                      >
                        <Link to={it.url} preload="intent">
                          <span>{it.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                tooltip={item.title}
                className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
              >
                <Link to={item.url} preload="intent">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
