import { useEffect, useState } from "react";
import { Compass, LogOut, Menu, Search, UserRound } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { type User } from "@/services/api";
import { getStoredUser, logout } from "@/services/authApi";
import { getCurrentProfile } from "@/services/userApi";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Places", to: "/places" },
  { label: "Community", to: "/community" },
  { label: "Saved", to: "/saved" },
  { label: "AI", to: "/ai/itinerary" },
];

export function RootLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    syncUser();
    void getCurrentProfile().then(setUser).catch(() => setUser(null));
    window.addEventListener("auth-change", syncUser);

    return () => window.removeEventListener("auth-change", syncUser);
  }, []);

  const handleLogout = () => {
    void logout();
    setUser(null);
    setIsMenuOpen(false);
    navigate("/login");
  };

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
            {!user && (
              <Link to="/login">
                <Button>Sign in</Button>
              </Link>
            )}
            {user && (
              <div className="relative">
                <Button
                  className="h-10 w-10 rounded-full p-0"
                  onClick={() => setIsMenuOpen((value) => !value)}
                  variant="outline"
                >
                  {user.avatar_url ? (
                    <img alt={user.full_name} className="h-full w-full rounded-full object-cover" src={user.avatar_url} />
                  ) : (
                    user.full_name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || <UserRound className="h-4 w-4" />
                  )}
                </Button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background p-1 shadow-lg">
                    <Link
                      className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setIsMenuOpen(false)}
                      to="/profile"
                    >
                      Profile
                    </Link>
                    <Link
                      className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setIsMenuOpen(false)}
                      to="/saved"
                    >
                      Saved posts
                    </Link>
                    <button
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
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
