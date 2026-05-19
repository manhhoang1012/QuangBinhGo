import { useCallback, useEffect, useState } from "react";
import { Bookmark, Eye, Flag, Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { CommentThread } from "@/components/community/CommentThread";
import { FollowButton } from "@/components/social/FollowButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PostSkeleton } from "@/components/common/LoadingSkeleton";
import { showToast } from "@/components/common/toastStore";
import { SEO } from "@/components/seo/SEO";
import { truncateMeta } from "@/components/seo/seoUtils";
import { type Comment, type ReviewPost, type User } from "@/services/api";
import { createComment, deleteComment, getComments, likeComment, reportComment, replyComment, unlikeComment, updateComment } from "@/services/commentApi";
import { deleteReviewPost, getHashtagFeed, getReviewPost, likePost, reportPost, savePost, sharePost } from "@/services/postApi";
import { getCurrentProfile } from "@/services/userApi";

export function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const slugOrId = postId ?? "";
  const [post, setPost] = useState<ReviewPost | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<ReviewPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const loadPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const postData = await getReviewPost(slugOrId);
      const [commentData, me] = await Promise.all([
        getComments(postData.id),
        getCurrentProfile().catch(() => null),
      ]);
      setPost(postData);
      setComments(commentData);
      setCurrentUser(me);
      if (postData.hashtags[0]) {
        const related = await getHashtagFeed(postData.hashtags[0], { limit: 4 });
        setRelatedPosts(related.filter((item) => item.id !== postData.id));
      }
    } catch {
      setError("Khong the tai bai viet.");
    } finally {
      setIsLoading(false);
    }
  }, [slugOrId]);

  useEffect(() => {
    if (slugOrId) void loadPost();
  }, [loadPost, slugOrId]);

  const handleComment = async () => {
    if (!commentText.trim()) return;
    if (!post) return;
    try {
      await createComment(post.id, commentText.trim());
      setCommentText("");
      setComments(await getComments(post.id));
      setPost(await getReviewPost(post.id));
      setNotice("Da gui binh luan.");
      showToast("Đã gửi bình luận.", "success");
    } catch {
      setError("Bình luận có dấu hiệu spam. Vui lòng chỉnh sửa nội dung.");
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    try {
      await deleteReviewPost(post.id);
      showToast("Đã xóa bài viết.", "success");
      navigate("/community");
    } catch {
      setError("Ban khong co quyen xoa bai viet nay.");
      showToast("Không thể xóa bài viết.", "error");
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10"><PostSkeleton /></div>;
  if (error || !post) return <div className="mx-auto max-w-4xl px-4 py-10"><ErrorState message={error ?? "Không tìm thấy bài viết."} onRetry={() => void loadPost()} /></div>;
  const canDelete = currentUser?.id === post.author.id || currentUser?.role === "admin";

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <SEO
        title={`Review du lịch Quảng Bình của ${post.author.full_name}`}
        description={truncateMeta(post.content)}
        image={post.images?.[0] || post.place?.cover_image || post.place?.images?.[0]}
        url={`/community/${post.slug || post.id}`}
        type="article"
        keywords={post.hashtags.join(", ")}
      />
      <div className="mb-4"><Breadcrumb items={[{ label: "Trang chủ", to: "/" }, { label: "Cộng đồng", to: "/community" }, { label: post.title || "Bài viết" }]} /></div>
      <Card className="overflow-hidden">
        {post.images[0] && <img alt={post.title || "Community post"} className="max-h-[520px] w-full object-cover" src={post.images[0]} />}
        {post.videos[0] && <video className="max-h-[520px] w-full bg-black" controls preload="metadata" src={post.videos[0]} />}
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link className="font-medium text-foreground hover:text-primary" to={`/u/${post.author.username}`}>{post.author.full_name}</Link>
            <FollowButton className="h-8 px-3" username={post.author.username} initialIsFollowing={post.author.is_following} isSelf={post.author.is_self} />
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
            <Button variant="ghost" className="h-8 gap-1.5 px-3" onClick={() => void sharePost(post.id, post.slug).then(loadPost)}><Share2 className="h-4 w-4" />{post.share_count}</Button>
            <span className="flex h-8 items-center gap-1.5 px-3"><Eye className="h-4 w-4" />{post.view_count ?? 0} lượt xem</span>
            <Button variant="ghost" className="h-8 gap-1.5 px-3" onClick={() => { const reason = window.prompt("Ly do bao cao?"); if (reason) void reportPost(post.id, reason); }}><Flag className="h-4 w-4" />Report</Button>
            {canDelete && <Button variant="ghost" className="h-8 gap-1.5 px-3 text-destructive" onClick={() => setConfirmDeleteOpen(true)}><Trash2 className="h-4 w-4" />Delete</Button>}
          </div>
        </CardContent>
      </Card>

      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">Binh luan</h2>
        {notice && <div className="rounded-md border bg-accent/10 p-3 text-sm text-accent">{notice}</div>}
        <div className="flex gap-2">
          <Input onChange={(event) => setCommentText(event.target.value)} placeholder="Viet binh luan" value={commentText} />
          <Button onClick={() => void handleComment().catch(() => setError("Vui long dang nhap truoc khi binh luan."))}>Gui</Button>
        </div>
        {comments.length === 0 && <EmptyState title="Chưa có bình luận" description="Hãy bắt đầu cuộc trò chuyện về bài viết này." />}
        {comments.map((comment) => (
          <CommentThread
            comment={comment}
            currentUser={currentUser}
            key={comment.id}
            onDelete={async (commentId) => {
              await deleteComment(post.id, commentId);
              setComments(await getComments(post.id));
              setPost(await getReviewPost(post.id));
              setNotice("Da xoa binh luan.");
              showToast("Đã xóa bình luận.", "success");
            }}
            onEdit={async (commentId, content) => {
              await updateComment(post.id, commentId, content);
              setComments(await getComments(post.id));
              setNotice("Da cap nhat binh luan.");
              showToast("Đã cập nhật bình luận.", "success");
            }}
            onLike={async (item) => {
              if (item.liked_by_me) {
                await unlikeComment(post.id, item.id);
              } else {
                await likeComment(post.id, item.id);
              }
              setComments(await getComments(post.id));
            }}
            onReply={async (commentId, content) => {
              try {
                await replyComment(post.id, commentId, content);
              } catch {
                setError("Bình luận có dấu hiệu spam. Vui lòng chỉnh sửa nội dung.");
                return;
              }
              setComments(await getComments(post.id));
              setPost(await getReviewPost(post.id));
            }}
            onReport={async (commentId, reason, detail) => {
              await reportComment(post.id, commentId, { reason, detail });
              setNotice("Da gui bao cao binh luan.");
            }}
          />
        ))}
      </section>

      {relatedPosts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Related posts</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedPosts.map((item) => (
              <Link className="rounded-md border p-4 hover:bg-muted/40" key={item.id} to={`/community/${item.slug || item.id}`}>
                <p className="font-medium">{item.title || "Community post"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.content}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Xóa bài viết?"
        description="Bài viết sẽ bị xóa khỏi cộng đồng."
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </section>
  );
}
