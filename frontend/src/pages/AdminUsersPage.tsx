import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { type User } from "@/services/api";
import { deleteAdminUser, getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from "@/services/adminUserApi";
import { getCurrentProfile } from "@/services/userApi";

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setError(null);
    setNotice(null);
    setIsLoading(true);
    try {
      const [me, data] = await Promise.all([
        getCurrentProfile(),
        getAdminUsers({ search: search || undefined, role: role || undefined, is_active: status === "" ? undefined : status === "active" }),
      ]);
      setCurrentUser(me);
      setUsers(data);
    } catch {
      setError("Could not load users.");
    } finally {
      setIsLoading(false);
    }
  }, [role, search, status]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleStatus = async (user: User) => {
    try {
      await updateAdminUserStatus(user.id, !user.is_active);
      setNotice(`${user.full_name} ${user.is_active ? "locked" : "unlocked"} successfully.`);
      await loadUsers();
    } catch {
      setError("Could not update user status.");
    }
  };

  const handleRole = async (user: User, nextRole: "user" | "moderator" | "admin") => {
    try {
      await updateAdminUserRole(user.id, nextRole);
      setNotice("User role updated successfully.");
      await loadUsers();
    } catch {
      setError("Could not update user role.");
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Deactivate ${user.full_name}? This account will no longer be able to sign in.`)) return;
    try {
      await deleteAdminUser(user.id);
      setNotice("User deactivated successfully.");
      await loadUsers();
    } catch {
      setError("Could not deactivate user.");
    }
  };

  const filteredUsers = useMemo(() => users, [users]);

  return (
    <section>
      <AdminPageHeader description="Search users, change roles, and lock or deactivate risky accounts." title="User management" />
      {notice && <AlertMessage text={notice} tone="success" />}
      {error && <AlertMessage text={error} tone="error" />}
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
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && filteredUsers.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No users found.</div>}
      {!isLoading && filteredUsers.length > 0 && <div className="mt-6 grid gap-4">
        {filteredUsers.map((user) => {
          const isSelf = currentUser?.id === user.id;
          return (
            <Card key={user.id}>
              <CardContent className="grid gap-4 pt-5 xl:grid-cols-[1fr_110px_160px_260px] xl:items-center">
                <div>
                  <p className="font-medium">{user.full_name} <span className="text-muted-foreground">@{user.username}</span></p>
                  <p className="text-sm text-muted-foreground">{user.email} - created {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</p>
                </div>
                <p className={`w-fit rounded-md px-2 py-1 text-xs font-medium ${user.is_active ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>{user.is_active ? "Active" : "Locked"}</p>
                <select className="rounded-md border bg-background px-3 py-2 text-sm" disabled={isSelf} onChange={(event) => void handleRole(user, event.target.value as "user" | "moderator" | "admin")} value={user.role}>
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={isSelf} onClick={() => void handleStatus(user)} variant="outline">{user.is_active ? "Lock" : "Unlock"}</Button>
                  <Button disabled={isSelf} onClick={() => void handleDelete(user)} variant="outline">Delete</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>}
    </section>
  );
}

function AlertMessage({ text, tone }: { text: string; tone: "error" | "success" }) {
  return <div className={`mt-6 rounded-lg border p-4 text-sm ${tone === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{text}</div>;
}
