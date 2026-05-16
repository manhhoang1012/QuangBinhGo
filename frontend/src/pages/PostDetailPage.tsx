import { useCallback, useEffect, useState } from "react";
import { Bookmark, Flag, Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Comment, type ReviewPost } from "@/services/api";
import { createComment, getComments } from "@/services/commentApi";
import { deleteReviewPost, getReviewPost, likePost, reportPost, savePost, sharePost, unlikePost, unsavePost } from "@/services/postApi";

export function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<ReviewPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const numericPostId = Number(postId);

  const loadPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [postData, commentData] = await Promise.all([getReviewPost(numericPostId), getComments(numericPostId)]);
      setPost(postData);
      setComments(commentData);
    } catch {
      setError("Không thể tải bài viết.");
    } finally {
      setIsLoading(false);
    }
  }, [numericPostId]);

  useEffect(() => {
    if (Number.isFinite(numericPostId)) void loadPost();
  }, [loadPost, numericPostId]);

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await createComment(numericPostId, commentText.trim());
      setCommentText("");
      setComments(await getComments(numericPostId));
      setPost(await getReviewPost(numericPostId));
    } catch {
      setError("Vui lòng đăng nhập trước khi bình luận.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa bài viết này?")) return;
    try {
      await deleteReviewPost(numericPostId);
      navigate("/community");
    } catch {
      setError("Bạn chỉ có thể xóa bài viết của chính mình.");
    }
  };

  const handleLike = async () => {
    if (!post) return;
    if (liked) {
      await unlikePost(post.id);
    } else {
      await likePost(post.id);
    }
    setLiked(!liked);
    setPost(await getReviewPost(post.id));
  };

  const handleSave = async () => {
    if (!post) return;
    if (saved) {
      await unsavePost(post.id);
    } else {
      await savePost(post.id);
    }
    setSaved(!saved);
    setPost(await getReviewPost(post.id));
  };

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10 text-muted-foreground">Đang tải bài viết...</div>;
  if (error || !post) return <div className="mx-auto max-w-4xl px-4 py-10 text-destructive">{error ?? "Không tìm thấy bài viết."}</div>;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="overflow-hidden">
        {post.images.length > 0 && <img alt={post.title} className="max-h-[520px] w-full object-cover" src={post.images[0]} />}
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link className="font-medium text-foreground hover:text-primary" to={`/u/${post.author.username}`}>{post.author.full_name}</Link>
            <span>-</span>
            <Link className="hover:text-primary" to={`/places/${post.place.slug || post.place.id}`}>{post.place.name}</Link>
            <span>-</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          <h1 className="text-4xl font-semibold">{post.title}</h1>
          <p className="leading-8 text-muted-foreground">{post.content}</p>
          {post.images.length > 1 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {post.images.slice(1).map((image, index) => <img alt={`${post.title} ${index + 2}`} className="h-40 rounded-md object-cover" key={image} src={image} />)}
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <button className="flex items-center gap-1.5" onClick={() => void handleLike()}>
              <Heart className={`h-4 w-4 ${liked ? "fill-destructive text-destructive" : ""}`} />
              {post.likes_count}
            </button>
            <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" />{post.comments_count}</span>
            <button className="flex items-center gap-1.5" onClick={() => void handleSave()}>
              <Bookmark className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
              {post.saves_count}
            </button>
            <button className="flex items-center gap-1.5" onClick={() => void sharePost(post.id)}><Share2 className="h-4 w-4" />Chia sẻ</button>
            <button className="flex items-center gap-1.5" onClick={() => { const reason = window.prompt("Lý do báo cáo?"); if (reason) void reportPost(post.id, reason); }}><Flag className="h-4 w-4" />Báo cáo</button>
            <button className="flex items-center gap-1.5 text-destructive" onClick={() => void handleDelete()}><Trash2 className="h-4 w-4" />Xóa</button>
          </div>
        </CardContent>
      </Card>

      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">Bình luận</h2>
        <div className="flex gap-2">
          <Input onChange={(event) => setCommentText(event.target.value)} placeholder="Viết bình luận" value={commentText} />
          <Button onClick={() => void handleComment()}>Gửi</Button>
        </div>
        {comments.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bình luận.</p>}
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="pt-4">
              <Link className="font-medium hover:text-primary" to={`/u/${comment.author.username}`}>{comment.author.full_name}</Link>
              <p className="mt-1 text-sm text-muted-foreground">{comment.content}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </section>
  );
}
