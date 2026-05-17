import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, MapPin, PenLine } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type ReviewPost, type User } from "@/services/api";
import { getCurrentProfile, getPublicProfile, getUserPosts } from "@/services/userApi";

export function PublicProfilePage() {
  const { username = "" } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profile, userPosts, me] = await Promise.all([
          getPublicProfile(username),
          getUserPosts(username),
          getCurrentProfile().catch(() => null),
        ]);
        setUser(profile);
        setPosts(userPosts);
        setCurrentUser(me);
      } catch {
        setError("Không tìm thấy hồ sơ công khai này.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [username]);

  if (isLoading) return <section className="mx-auto max-w-5xl px-4 py-10 text-muted-foreground">Đang tải hồ sơ...</section>;
  if (error || !user) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10">
        <Button className="mb-6 gap-2" onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {error ?? "Không tìm thấy hồ sơ."}
        </div>
      </section>
    );
  }

  const isOwnProfile = Boolean(currentUser?.username && currentUser.username === user.username);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button className="gap-2" onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        {isOwnProfile && (
          <Link to="/profile">
            <Button className="gap-2">
              <PenLine className="h-4 w-4" />
              Chỉnh sửa hồ sơ
            </Button>
          </Link>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border bg-muted/40">
        <div className="h-44 bg-primary/15">{user.cover_image_url && <img alt="Cover" className="h-full w-full object-cover" src={user.cover_image_url} />}</div>
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-primary text-2xl font-semibold text-primary-foreground">
              {user.avatar_url ? <img alt={user.full_name} className="h-full w-full object-cover" src={user.avatar_url} /> : user.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-semibold">{user.full_name}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
              {user.location && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{user.location}</p>}
              {user.created_at && <p className="mt-1 text-sm text-muted-foreground">Tham gia từ {new Date(user.created_at).toLocaleDateString()}</p>}
            </div>
          </div>
          {user.bio && <p className="mt-4 max-w-2xl text-muted-foreground">{user.bio}</p>}
          <SocialLinks user={user} />
        </div>
      </div>
      <h2 className="mt-8 text-2xl font-semibold">Bài đã đăng</h2>
      <div className="mt-4 grid gap-4">
        {posts.length === 0 && <Card><CardContent className="pt-5 text-sm text-muted-foreground">Người dùng này chưa đăng bài nào.</CardContent></Card>}
        {posts.map((post) => <Card key={post.id}><CardContent className="pt-5"><p className="text-sm text-muted-foreground">{post.place?.name ?? "No place"}</p><h3 className="mt-2 font-semibold">{post.title}</h3><p className="mt-2 text-sm text-muted-foreground">{post.content}</p></CardContent></Card>)}
      </div>
    </section>
  );
}

function SocialLinks({ user }: { user: User }) {
  const links = Object.entries(user.social_links ?? {}).filter(([, value]) => Boolean(value));
  if (links.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {links.map(([key, value]) => (
        <a
          className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          href={String(value)}
          key={key}
          rel="noreferrer"
          target="_blank"
        >
          {key}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  );
}
