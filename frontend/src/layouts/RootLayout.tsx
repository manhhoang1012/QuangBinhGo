import { Outlet } from "react-router-dom";

export function RootLayout() {
  return (
    <main className="min-h-screen bg-background">
      <Outlet />
    </main>
  );
}
