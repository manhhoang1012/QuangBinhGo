import { useCallback, useEffect, useState } from "react";
import { Bookmark, Flag, Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { CommentThread } from "@/components/community/CommentThread";
import { FollowButton } from "@/components/community/FollowButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Comment, type ReviewPost } from "@/services/api";
import { createComment, getComments, likeComment, replyComment } from "@/services/commentApi";
import { deleteReviewPost, getHashtagFeed, getReviewPost, likePost, reportPost, savePost, sharePost } from "@/services/postApi";

export function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const numericPostId = Number(postId);
  const [post, setPost] = useState<ReviewPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<ReviewPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [postData, commentData] = await Promise.all([getReviewPost(numericPostId), getComments(numericPostId)]);
      setPost(postData);
      setComments(commentData);
      if (postData.hashtags[0]) {
        const related = await getHashtagFeed(postData.hashtags[0], { limit: 4 });
        setRelatedPosts(related.filter((item) => item.id !== postData.id));
      }
    } catch {
      setError("Khong the tai bai viet.");
    } finally {
      setIsLoading(false);
    }
  }, [numericPostId]);

  useEffect(() => {
    if (Number.isFinite(numericPostId)) void loadPost();
  }, [loadPost, numericPostId]);

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await createComment(numericPostId, commentText.trim());
    setCommentText("");
    setComments(await getComments(numericPostId));
    setPost(await getReviewPost(numericPostId));
  };

  const handleDelete = async () => {
    if (!window.confirm("Xoa bai viet nay?")) return;
    await deleteReviewPost(numericPostId);
    navigate("/community");
  };

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10 text-muted-foreground">Dang tai bai viet...</div>;
  if (error || !post) return <div className="mx-auto max-w-4xl px-4 py-10 text-destructive">{error ?? "Khong tim thay bai viet."}</div>;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="overflow-hidden">
        {post.images[0] && <img alt={post.title || "Community post"} className="max-h-[520px] w-full object-cover" src={post.images[0]} />}
        {post.videos[0] && <video className="max-h-[520px] w-full bg-black" controls preload="metadata" src={post.videos[0]} />}
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link className="font-medium text-foreground hover:text-primary" to={`/u/${post.author.username}`}>{post.author.full_name}</Link>
            <FollowButton className="h-8 px-3" username={post.author.username} initialIsFollowing={post.author.is_following} />
            {post.place && (
              <>
                <span>-</span>
                <Link className="hover:text-primary" to={`/community/place/${post.place.id}`}>{post.place.name}</Link>
              </>
            )}
            <span>-</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
            <Badge>{post.visibility}</Badge>
          </div>
          <h1 className="text-4xl font-semibold">{post.title || "Chia se tu cong dong"}</h1>
          <p className="whitespace-pre-line leading-8 text-muted-foreground">{post.content}</p>
          {post.hashtags.length > 0 && <div className="flex flex-wrap gap-2">{post.hashtags.map((tag) => <Link key={tag} to={`/community/hashtag/${tag}`}><Badge>#{tag}</Badge></Link>)}</div>}
          {(post.images.length > 1 || post.videos.length > 1) && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {post.images.slice(1).map((image, index) => <img alt={`${post.title} ${index + 2}`} className="h-40 rounded-md object-cover" key={image} loading="lazy" src={image} />)}
              {post.videos.slice(1).map((video) => <video className="h-40 rounded-md bg-black object-cover" controls key={video} preload="metadata" src={video} />)}
            </div>
          )}
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" className="h-8 gap-1.5 px-3" onClick={() => void likePost(post.id).then(loadPost)}><Heart className="h-4 w-4" />{post.likes_count}</Button>
            <span className="flex items-center gap-1.5 px-3 py-2"><MessageCircle className="h-4 w-4" />{post.comments_count}</span>
            <Button variant="ghost" className="h-8 gap-1.5 px-3" onClick={() => void savePost(post.id).then(loadPost)}><Bookmark className="h-4 w-4" />{post.saves_count}</Button>
            <Button variant="ghost" className="h-8 gap-1.5 px-3" onClick={() => void sharePost(post.id).then(loadPost)}><Share2 className="h-4 w-4" />{post.share_count}</Button>
            <Button variant="ghost" className="h-8 gap-1.5 px-3" onClick={() => { const reason = window.prompt("Ly do bao cao?"); if (reason) void reportPost(post.id, reason); }}><Flag className="h-4 w-4" />Report</Button>
            <Button variant="ghost" className="h-8 gap-1.5 px-3 text-destructive" onClick={() => void handleDelete()}><Trash2 className="h-4 w-4" />Delete</Button>
          </div>
        </CardContent>
      </Card>

      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">Binh luan</h2>
        <div className="flex gap-2">
          <Input onChange={(event) => setCommentText(event.target.value)} placeholder="Viet binh luan" value={commentText} />
          <Button onClick={() => void handleComment().catch(() => setError("Vui long dang nhap truoc khi binh luan."))}>Gui</Button>
        </div>
        {comments.length === 0 && <p className="text-sm text-muted-foreground">Chua co binh luan.</p>}
        {comments.map((comment) => (
          <CommentThread
            comment={comment}
            key={comment.id}
            onLike={async (commentId) => {
              await likeComment(commentId);
              setComments(await getComments(numericPostId));
            }}
            onReply={async (commentId, content) => {
              await replyComment(numericPostId, commentId, content);
              setComments(await getComments(numericPostId));
              setPost(await getReviewPost(numericPostId));
            }}
          />
        ))}
      </section>

      {relatedPosts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Related posts</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedPosts.map((item) => (
              <Link className="rounded-md border p-4 hover:bg-muted/40" key={item.id} to={`/community/${item.id}`}>
                <p className="font-medium">{item.title || "Community post"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.content}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
