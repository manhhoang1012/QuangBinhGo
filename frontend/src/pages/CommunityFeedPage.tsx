import { useEffect, useState } from "react";
import { Bookmark, Heart, MessageCircle, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Comment, type ReviewPost } from "@/services/api";
import { createComment, getComments } from "@/services/commentApi";
import {
  getCommunityFeed,
  getLikedPostIds,
  getSavedPostIds,
  likePost,
  savePost,
  type FeedSort,
  unlikePost,
  unsavePost,
} from "@/services/postApi";

export function CommunityFeedPage() {
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [sort, setSort] = useState<FeedSort>("latest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<number, Comment[]>>({});
  const [commentTextByPost, setCommentTextByPost] = useState<Record<number, string>>({});
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);

  useEffect(() => {
    const loadFeed = async () => {
      setIsLoading(true);
      setError(null);
      try {
        setPosts(await getCommunityFeed(sort));
        setLikedPostIds(getLikedPostIds());
        setSavedPostIds(getSavedPostIds());
      } catch {
        setError("Could not load the community feed.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadFeed();
  }, [sort]);

  const handleLikeToggle = async (postId: number) => {
    try {
      if (likedPostIds.includes(postId)) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
      setPosts(await getCommunityFeed(sort));
      setLikedPostIds(getLikedPostIds());
    } catch {
      setError("Please sign in before liking posts.");
    }
  };

  const handleSaveToggle = async (postId: number) => {
    try {
      if (savedPostIds.includes(postId)) {
        await unsavePost(postId);
      } else {
        await savePost(postId);
      }
      setPosts(await getCommunityFeed(sort));
      setSavedPostIds(getSavedPostIds());
    } catch {
      setError("Please sign in before saving posts.");
    }
  };

  const handleLoadComments = async (postId: number) => {
    try {
      setCommentsByPost((current) => ({ ...current, [postId]: current[postId] ?? [] }));
      const comments = await getComments(postId);
      setCommentsByPost((current) => ({ ...current, [postId]: comments }));
    } catch {
      setError("Could not load comments.");
    }
  };

  const handleCreateComment = async (postId: number) => {
    const content = commentTextByPost[postId]?.trim();
    if (!content) {
      return;
    }

    try {
      await createComment(postId, content);
      setCommentTextByPost((current) => ({ ...current, [postId]: "" }));
      await handleLoadComments(postId);
      setPosts(await getCommunityFeed(sort));
    } catch {
      setError("Please sign in before commenting.");
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge>Community feed</Badge>
          <h1 className="mt-4 text-4xl font-semibold">Real trips, local tips, fresh ideas</h1>
        </div>
        <Link to="/community/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create post
          </Button>
        </Link>
      </div>
      <div className="mt-6 flex gap-2">
        <Button onClick={() => setSort("latest")} variant={sort === "latest" ? "secondary" : "outline"}>Latest</Button>
        <Button onClick={() => setSort("popular")} variant={sort === "popular" ? "secondary" : "outline"}>Popular</Button>
      </div>

      {isLoading && <Card className="mt-8 h-96 animate-pulse bg-muted/50" />}
      {error && <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">{error}</div>}
      {!isLoading && !error && posts.length === 0 && (
        <div className="mt-8 rounded-lg border bg-muted/40 p-8 text-center text-muted-foreground">No review posts yet.</div>
      )}
      {!isLoading && !error && posts.length > 0 && (
        <div className="mt-8 grid gap-5">
          {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <img alt={post.title} className="h-72 w-full object-cover" src={post.images[0] ?? post.place.images[0] ?? "https://placehold.co/1200x800?text=QuangBinhGo"} />
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <AuthorLink user={post.author} />
                <span>-</span>
                <span>{post.place.name}</span>
                <span>-</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <h2 className="mt-2 text-2xl font-semibold">{post.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{post.content}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <button className="flex items-center gap-1.5" onClick={() => void handleLikeToggle(post.id)}>
                  <Heart className={`h-4 w-4 ${likedPostIds.includes(post.id) ? "fill-destructive text-destructive" : ""}`} />
                  {post.likes_count}
                </button>
                <button className="flex items-center gap-1.5" onClick={() => void handleLoadComments(post.id)}><MessageCircle className="h-4 w-4" />{post.comments_count}</button>
                <button className="flex items-center gap-1.5" onClick={() => void handleSaveToggle(post.id)}>
                  <Bookmark className={`h-4 w-4 ${savedPostIds.includes(post.id) ? "fill-primary text-primary" : ""}`} />
                  {post.saves_count}
                </button>
              </div>
              {commentsByPost[post.id] && (
                <div className="mt-5 space-y-3 border-t pt-4">
                  {commentsByPost[post.id].length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
                  {commentsByPost[post.id].map((comment) => (
                    <div key={comment.id} className="rounded-md bg-muted/50 p-3 text-sm">
                      <AuthorLink user={comment.author} />
                      <p className="mt-1 text-muted-foreground">{comment.content}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      onChange={(event) => setCommentTextByPost((current) => ({ ...current, [post.id]: event.target.value }))}
                      placeholder="Write a comment"
                      value={commentTextByPost[post.id] ?? ""}
                    />
                    <Button onClick={() => void handleCreateComment(post.id)}>Post</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function AuthorLink({ user }: { user: { avatar_url?: string | null; full_name: string; username?: string | null } }) {
  const content = (
    <>
      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {user.avatar_url ? <img alt={user.full_name} className="h-full w-full object-cover" src={user.avatar_url} /> : user.full_name.slice(0, 2).toUpperCase()}
      </span>
      <span className="font-medium text-foreground">{user.full_name}</span>
    </>
  );

  if (!user.username) {
    return <span className="inline-flex items-center gap-2">{content}</span>;
  }

  return (
    <Link className="inline-flex items-center gap-2 hover:text-primary hover:underline" to={`/u/${user.username}`}>
      {content}
    </Link>
  );
}
