import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type User } from "@/services/api";
import { getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from "@/services/adminUserApi";
import { getCurrentProfile } from "@/services/userApi";

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setError(null);
    try {
      const [me, data] = await Promise.all([
        getCurrentProfile(),
        getAdminUsers({ search: search || undefined, role: role || undefined, is_active: status === "" ? undefined : status === "active" }),
      ]);
      setCurrentUser(me);
      setUsers(data);
    } catch {
      setError("Could not load users.");
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleStatus = async (user: User) => {
    await updateAdminUserStatus(user.id, !user.is_active);
    await loadUsers();
  };

  const handleRole = async (user: User, nextRole: "user" | "moderator" | "admin") => {
    await updateAdminUserRole(user.id, nextRole);
    await loadUsers();
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-4xl font-semibold">User management</h1>
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
        <Input onChange={(event) => setSearch(event.target.value)} placeholder="Search email, username, name" value={search} />
        <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setRole(event.target.value)} value={role}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
        <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="locked">Locked</option>
        </select>
        <Button onClick={() => void loadUsers()}>Apply</Button>
      </div>
      <div className="mt-6 grid gap-4">
        {users.map((user) => {
          const isSelf = currentUser?.id === user.id;
          return (
            <Card key={user.id}>
              <CardContent className="grid gap-4 pt-5 lg:grid-cols-[1fr_160px_160px_220px] lg:items-center">
                <div>
                  <p className="font-medium">{user.full_name} <span className="text-muted-foreground">@{user.username}</span></p>
                  <p className="text-sm text-muted-foreground">{user.email} - created {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</p>
                </div>
                <p className="text-sm">{user.is_active ? "Active" : "Locked"}</p>
                <select className="rounded-md border bg-background px-3 py-2 text-sm" disabled={isSelf} onChange={(event) => void handleRole(user, event.target.value as "user" | "moderator" | "admin")} value={user.role}>
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                <Button disabled={isSelf} onClick={() => void handleStatus(user)} variant="outline">{user.is_active ? "Lock" : "Unlock"}</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
