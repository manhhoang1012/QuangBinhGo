import { Compass, Menu, Search } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Places", to: "/places" },
  { label: "Community", to: "/community" },
  { label: "Profile", to: "/profile" },
  { label: "Admin", to: "/admin" },
];

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2 font-semibold" to="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Compass className="h-5 w-5" />
            </span>
            QuangBinhGo
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`
                }
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button className="hidden gap-2 sm:inline-flex" variant="outline">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Link to="/login">
              <Button>Sign in</Button>
            </Link>
            <Button className="md:hidden" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
