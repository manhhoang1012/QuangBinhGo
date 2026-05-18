import { BarChart3, Flag, FolderTree, LayoutDashboard, LogOut, MapPinned, MessageSquare, Settings, ShieldCheck, Star, Users } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { type User } from "@/services/api";
import { logout } from "@/services/authApi";

const adminNavItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { label: "Moderation", to: "/moderation", icon: ShieldCheck, roles: ["moderator", "admin"] },
  { label: "Reports", to: "/moderation/reports", icon: Flag, roles: ["moderator", "admin"] },
  { label: "Reported Posts", to: "/moderation/posts", icon: MessageSquare, roles: ["moderator", "admin"] },
  { label: "Reported Comments", to: "/moderation/comments", icon: MessageSquare, roles: ["moderator", "admin"] },
  { label: "Actions", to: "/moderation/actions", icon: BarChart3, roles: ["moderator", "admin"] },
  { label: "Users", to: "/admin/users", icon: Users, roles: ["admin"] },
  { label: "Places", to: "/admin/places", icon: MapPinned, roles: ["admin"] },
  { label: "Posts", to: "/admin/posts", icon: MessageSquare, roles: ["admin"] },
  { label: "Comments", to: "/admin/comments", icon: MessageSquare, roles: ["admin"] },
  { label: "Reviews", to: "/admin/reviews", icon: Star, roles: ["admin"] },
  { label: "Admin Reports", to: "/admin/reports", icon: Flag, roles: ["admin"] },
  { label: "Categories", to: "/admin/categories", icon: FolderTree, roles: ["admin"] },
  { label: "Settings", to: "/admin/settings", icon: Settings, roles: ["admin"] },
];

export function AdminLayout({ children, user }: { children: React.ReactNode; user: User | null }) {
  const navigate = useNavigate();
  const visibleNavItems = adminNavItems.filter((item) => item.roles.includes(user?.role ?? "user"));
  const homePath = visibleNavItems[0]?.to ?? "/";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-muted/30 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b bg-background lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-4 lg:h-auto lg:block lg:px-5 lg:py-6">
          <Link className="font-semibold" to={homePath}>QuangBinhGo Admin</Link>
          <Link className="text-sm text-muted-foreground hover:text-foreground lg:hidden" to="/">Public site</Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible lg:px-3">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  `flex min-w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
                end={item.to === "/admin"}
                key={item.to}
                to={item.to}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div>
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{user?.full_name ?? "Admin"} <span className="text-sm text-muted-foreground">@{user?.username ?? "admin"}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline">Public site</Button>
              </Link>
              <Button className="gap-2" onClick={() => void handleLogout()} variant="outline">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminPageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium uppercase text-primary">
          <BarChart3 className="h-4 w-4" />
          Admin
        </div>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
