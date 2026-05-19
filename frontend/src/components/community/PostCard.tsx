import { Bookmark, Eye, EyeOff, Flag, Heart, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

import { FollowButton } from "@/components/social/FollowButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type ReviewPost } from "@/services/api";

interface PostCardProps {
  post: ReviewPost;
  onLike: (post: ReviewPost) => void;
  onSave: (post: ReviewPost) => void;
  onShare: (post: ReviewPost) => void;
  onReport: (post: ReviewPost) => void;
  onHide?: (post: ReviewPost) => void;
}

export function PostCard({ post, onLike, onSave, onShare, onReport, onHide }: PostCardProps) {
  const hero = post.images[0] ?? post.place?.cover_image ?? post.place?.images?.[0];
  const postUrl = `/community/${post.slug || post.id}`;
  return (
    <Card className="overflow-hidden">
      {hero && (
        <Link to={postUrl}>
          <img alt={post.title || "Community post"} className="h-72 w-full object-cover" loading="lazy" src={hero} />
        </Link>
      )}
      {post.videos?.[0] && (
        <video className="max-h-80 w-full bg-black" controls preload="metadata" src={post.videos[0]} />
      )}
      <CardContent className="pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <AuthorLink user={post.author} />
            {post.place && (
              <>
                <span>-</span>
                <Link className="hover:text-primary" to={`/community/place/${post.place.id}`}>{post.place.name}</Link>
              </>
            )}
            <span>-</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
            {post.is_draft && <Badge>Draft</Badge>}
            {post.visibility !== "public" && <Badge>{post.visibility}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <FollowButton className="h-8 px-3" username={post.author.username} initialIsFollowing={post.author.is_following} isSelf={post.author.is_self} />
            <MoreHorizontal className="h-4 w-4" />
          </div>
        </div>

        <Link to={postUrl}>
          <h2 className="mt-2 text-2xl font-semibold hover:text-primary">{post.title || "Chia se tu cong dong"}</h2>
        </Link>
        <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">{post.content}</p>
        {post.hashtags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.hashtags.map((tag) => (
              <Link key={tag} to={`/community/hashtag/${tag}`}>
                <Badge>#{tag}</Badge>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" className="h-8 gap-1.5 px-3" onClick={() => onLike(post)}>
            <Heart className="h-4 w-4" />
            {post.likes_count}
          </Button>
          <Link to={postUrl}>
            <Button variant="ghost" className="h-8 gap-1.5 px-3">
              <MessageCircle className="h-4 w-4" />
              {post.comments_count}
            </Button>
          </Link>
          <span className="inline-flex h-8 items-center gap-1.5 px-3">
            <Eye className="h-4 w-4" />
            {post.view_count ?? 0}
          </span>
          <Button variant="ghost" className="h-8 gap-1.5 px-3" onClick={() => onSave(post)}>
            <Bookmark className="h-4 w-4" />
            {post.saves_count}
          </Button>
          <Button variant="ghost" className="h-8 gap-1.5 px-3" onClick={() => onShare(post)}>
            <Share2 className="h-4 w-4" />
            {post.share_count}
          </Button>
          {onHide && (
            <Button variant="ghost" className="h-8 gap-1.5 px-3" onClick={() => onHide(post)}>
              <EyeOff className="h-4 w-4" />
              Hide
            </Button>
          )}
          <Button variant="ghost" className="h-8 gap-1.5 px-3" onClick={() => onReport(post)}>
            <Flag className="h-4 w-4" />
            Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AuthorLink({ user }: { user: { avatar_url?: string | null; full_name: string; username?: string | null } }) {
  const initials = user.full_name.slice(0, 2).toUpperCase();
  const content = (
    <>
      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {user.avatar_url ? <img alt={user.full_name} className="h-full w-full object-cover" loading="lazy" src={user.avatar_url} /> : initials}
      </span>
      <span className="font-medium text-foreground">{user.full_name}</span>
    </>
  );
  if (!user.username) return <span className="inline-flex items-center gap-2">{content}</span>;
  return <Link className="inline-flex items-center gap-2 hover:text-primary hover:underline" to={`/u/${user.username}`}>{content}</Link>;
}
