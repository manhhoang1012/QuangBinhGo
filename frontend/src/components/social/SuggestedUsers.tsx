import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { FollowButton } from "@/components/social/FollowButton";
import { Card, CardContent } from "@/components/ui/card";
import { type User } from "@/services/api";
import { getFollowSuggestions } from "@/services/followApi";

export function SuggestedUsers({ limit = 5 }: { limit?: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getFollowSuggestions({ page: 1, limit })
      .then((data) => setUsers(data.items))
      .catch(() => setError("Không thể tải gợi ý theo dõi."))
      .finally(() => setIsLoading(false));
  }, [limit]);

  return (
    <Card>
      <CardContent className="pt-5">
        <h2 className="font-semibold">Gợi ý theo dõi</h2>
        {isLoading && <p className="mt-3 text-sm text-muted-foreground">Đang tải...</p>}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {!isLoading && users.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Chưa có gợi ý phù hợp.</p>}
        <div className="mt-4 grid gap-3">
          {users.map((user) => (
            <div className="flex items-center justify-between gap-3" key={user.id}>
              <Link className="min-w-0" to={`/users/${user.username}`}>
                <p className="truncate text-sm font-medium">{user.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">@{user.username} · {user.followers_count ?? 0} followers</p>
              </Link>
              <FollowButton
                className="h-8 px-3"
                username={user.username}
                initialIsFollowing={user.is_following}
                isSelf={user.is_self}
                onChange={({ isFollowing }) => {
                  if (isFollowing) setUsers((current) => current.filter((item) => item.id !== user.id));
                }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
