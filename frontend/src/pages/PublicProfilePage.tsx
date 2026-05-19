import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, MapPin, PenLine } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { FollowButton } from "@/components/social/FollowButton";
import { SuggestedUsers } from "@/components/social/SuggestedUsers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import { truncateMeta } from "@/components/seo/seoUtils";
import { type ReviewPost, type User } from "@/services/api";
import { getCurrentProfile, getFollowers, getFollowing, getPublicUserProfile, getUserPosts } from "@/services/userApi";

type ProfileTab = "posts" | "followers" | "following";

export function PublicProfilePage() {
  const { username = "" } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [listUsers, setListUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profile, userPosts, me] = await Promise.all([
          getPublicUserProfile(username),
          getUserPosts(username, { page: 1, limit: 10 }),
          getCurrentProfile().catch(() => null),
        ]);
        setUser(profile);
        setPosts(userPosts);
        setCurrentUser(me);
      } catch {
        setError("Khong tim thay ho so cong khai nay.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [username]);

  const loadFollowList = async (tab: Exclude<ProfileTab, "posts">) => {
    setActiveTab(tab);
    setListUsers([]);
    const data = tab === "followers" ? await getFollowers(username, { page: 1, limit: 20 }) : await getFollowing(username, { page: 1, limit: 20 });
    setListUsers(data.items);
  };

  if (isLoading) return <section className="mx-auto max-w-5xl px-4 py-10 text-muted-foreground">Dang tai ho so...</section>;
  if (error || !user) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10">
        <Button className="mb-6 gap-2" onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Quay lai
        </Button>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {error ?? "Khong tim thay ho so."}
        </div>
      </section>
    );
  }

  const isOwnProfile = Boolean(currentUser?.username && currentUser.username === user.username);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <SEO
        title={`${user.full_name} (@${user.username}) | QuangBinhGo`}
        description={truncateMeta(user.bio || `Trang cá nhân du lịch Quảng Bình của ${user.full_name}.`)}
        image={user.avatar_url}
        url={`/u/${user.username}`}
        type="profile"
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button className="gap-2" onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Quay lai
        </Button>
        {isOwnProfile ? (
          <Link to="/profile">
            <Button className="gap-2">
              <PenLine className="h-4 w-4" />
              Chinh sua ho so
            </Button>
          </Link>
        ) : (
          <FollowButton
            username={user.username}
            initialIsFollowing={user.is_following}
            isSelf={user.is_self}
            onChange={({ isFollowing, followersCount, message }) => {
              if (followersCount >= 0) setUser((current) => current ? { ...current, followers_count: followersCount, is_following: isFollowing } : current);
              setNotice(message);
            }}
          />
        )}
      </div>

      {notice && <div className="mb-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{notice}</div>}

      <div className="overflow-hidden rounded-lg border bg-muted/40">
        <div className="h-44 bg-primary/15">{user.cover_url || user.cover_image_url ? <img alt="Cover" className="h-full w-full object-cover" src={user.cover_url || user.cover_image_url || ""} /> : null}</div>
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-primary text-2xl font-semibold text-primary-foreground">
              {user.avatar_url ? <img alt={user.full_name} className="h-full w-full object-cover" src={user.avatar_url} /> : user.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-semibold">{user.full_name}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
              {user.location && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{user.location}</p>}
              {user.created_at && <p className="mt-1 text-sm text-muted-foreground">Tham gia tu {new Date(user.created_at).toLocaleDateString()}</p>}
            </div>
          </div>
          {user.bio && <p className="mt-4 max-w-2xl text-muted-foreground">{user.bio}</p>}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <button className="font-medium hover:text-primary" onClick={() => void loadFollowList("followers")} type="button">{user.followers_count ?? 0} followers</button>
            <button className="font-medium hover:text-primary" onClick={() => void loadFollowList("following")} type="button">{user.following_count ?? 0} following</button>
            <button className="font-medium hover:text-primary" onClick={() => setActiveTab("posts")} type="button">{user.posts_count ?? posts.length} posts</button>
          </div>
          <SocialLinks user={user} />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button variant={activeTab === "posts" ? "secondary" : "outline"} onClick={() => setActiveTab("posts")}>Bai viet</Button>
        <Button variant={activeTab === "followers" ? "secondary" : "outline"} onClick={() => void loadFollowList("followers")}>Followers</Button>
        <Button variant={activeTab === "following" ? "secondary" : "outline"} onClick={() => void loadFollowList("following")}>Following</Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-4">
          {activeTab === "posts" && posts.length === 0 && <Card><CardContent className="pt-5 text-sm text-muted-foreground">Nguoi dung nay chua co bai viet cong khai phu hop.</CardContent></Card>}
          {activeTab === "posts" && posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">{post.place?.name ?? "No place"}</p>
                <Link to={`/community/${post.slug || post.id}`}><h3 className="mt-2 font-semibold hover:text-primary">{post.title || "Community post"}</h3></Link>
                <p className="mt-2 text-sm text-muted-foreground">{post.content}</p>
              </CardContent>
            </Card>
          ))}
          {activeTab !== "posts" && listUsers.length === 0 && <Card><CardContent className="pt-5 text-sm text-muted-foreground">Chua co nguoi dung nao.</CardContent></Card>}
          {activeTab !== "posts" && listUsers.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-5">
                <Link className="min-w-0" to={`/users/${item.username}`}>
                  <p className="font-medium">{item.full_name}</p>
                  <p className="truncate text-sm text-muted-foreground">@{item.username} · {item.followers_count ?? 0} followers</p>
                  {item.bio && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{item.bio}</p>}
                </Link>
                <FollowButton username={item.username} initialIsFollowing={item.is_following} isSelf={item.is_self} />
              </CardContent>
            </Card>
          ))}
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start"><SuggestedUsers /></aside>
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
        <a className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted" href={String(value)} key={key} rel="noreferrer" target="_blank">
          {key}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  );
}
