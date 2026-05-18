import { useEffect, useState } from "react";
import { type ReactNode } from "react";
import { Compass, Facebook, LogOut, Menu, Search, Sparkles, UserRound, Youtube } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { type User } from "@/services/api";
import { getStoredUser, logout } from "@/services/authApi";
import { fallbackSettings, getPublicSettings, type SiteSettings } from "@/services/settingsApi";
import { getCurrentProfile } from "@/services/userApi";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Places", to: "/places" },
  { label: "Community", to: "/community" },
  { label: "Saved", to: "/saved" },
  { label: "AI Du lịch", to: "/ai" },
];

const aiMenuItems = [
  { label: "AI Search", to: "/ai/search" },
  { label: "Gợi ý địa điểm", to: "/ai/recommendations" },
  { label: "Chatbot", to: "/ai/chatbot" },
  { label: "Tạo lịch trình AI", to: "/ai/itinerary" },
  { label: "Công cụ nội dung", to: "/ai/content-tools" },
];

export function RootLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(fallbackSettings);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    syncUser();
    void getCurrentProfile().then(setUser).catch(() => setUser(null));
    void getPublicSettings().then(setSettings).catch(() => setSettings(fallbackSettings));
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
            {settings.logo_url ? (
              <img alt={settings.site_name} className="h-9 w-9 rounded-md object-cover" src={settings.logo_url} />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Compass className="h-5 w-5" />
              </span>
            )}
            {settings.site_name}
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              item.to === "/ai" ? (
                <div className="relative" key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      `inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                    onMouseEnter={() => setIsAiMenuOpen(true)}
                    to={item.to}
                  >
                    <Sparkles className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                  {isAiMenuOpen && (
                    <div className="absolute left-0 top-full w-56 rounded-md border bg-background p-1 shadow-lg" onMouseEnter={() => setIsAiMenuOpen(true)} onMouseLeave={() => setIsAiMenuOpen(false)}>
                      {aiMenuItems.map((aiItem) => (
                        <Link className="block rounded-md px-3 py-2 text-sm hover:bg-muted" key={aiItem.to} to={aiItem.to}>{aiItem.label}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
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
              )
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
            <Button className="md:hidden" onClick={() => setIsMobileMenuOpen((value) => !value)} variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="border-t bg-background px-4 py-3 md:hidden">
            {[...navItems, ...aiMenuItems].map((item) => (
              <Link className="block rounded-md px-3 py-2 text-sm hover:bg-muted" key={`${item.to}-${item.label}`} onClick={() => setIsMobileMenuOpen(false)} to={item.to}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <p className="font-semibold text-foreground">{settings.site_name}</p>
            <p className="mt-2 max-w-2xl">{settings.site_description}</p>
            {(settings.address || settings.contact_email || settings.contact_phone) && (
              <p className="mt-3">
                {[settings.address, settings.contact_email, settings.contact_phone].filter(Boolean).join(" • ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {settings.facebook_url && <SocialLink href={settings.facebook_url} label="Facebook"><Facebook className="h-4 w-4" /></SocialLink>}
            {settings.youtube_url && <SocialLink href={settings.youtube_url} label="YouTube"><Youtube className="h-4 w-4" /></SocialLink>}
            {settings.zalo_url && <SocialLink href={settings.zalo_url} label="Zalo">Zalo</SocialLink>}
          </div>
        </div>
      </footer>
    </div>
  );
}

function SocialLink({ children, href, label }: { children: ReactNode; href: string; label: string }) {
  return (
    <a aria-label={label} className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border bg-background px-2 font-medium hover:bg-muted" href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}
