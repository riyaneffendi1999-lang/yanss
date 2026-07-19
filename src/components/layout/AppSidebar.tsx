import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Landmark,
  Wallet,
  Smartphone,
  Gift,
  Settings,
  UserCircle,
  Shield,
  ChevronRight,
} from "lucide-react";

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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const groupActive = (g: Group) => g.items.some((i) => pathname.startsWith(i.url));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">Admin Console</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Enterprise
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {singles.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
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
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible defaultOpen={false} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={g.label}>
                        <g.icon className="h-4 w-4" />
                        <span>{g.label}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {g.items.map((it) => (
                          <SidebarMenuSubItem key={it.url}>
                            <SidebarMenuSubButton asChild isActive={isActive(it.url)}>
                              <Link to={it.url}>{it.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url}>
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
