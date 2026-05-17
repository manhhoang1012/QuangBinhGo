import { useState } from "react";
import { Heart, Reply } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Comment } from "@/services/api";

interface CommentThreadProps {
  comment: Comment;
  onReply: (commentId: number, content: string) => Promise<void>;
  onLike: (commentId: number) => Promise<void>;
}

export function CommentThread({ comment, onReply, onLike }: CommentThreadProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [repliesOpen, setRepliesOpen] = useState(comment.replies.length <= 2);

  const submitReply = async () => {
    const content = replyText.trim();
    if (!content) return;
    await onReply(comment.id, content);
    setReplyText("");
    setReplyOpen(false);
    setRepliesOpen(true);
  };

  return (
    <div className="rounded-md bg-muted/40 p-4">
      <Link className="font-medium hover:text-primary" to={`/u/${comment.author.username}`}>{comment.author.full_name}</Link>
      <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{comment.content}</p>
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" className="h-8 gap-1 px-3" onClick={() => onLike(comment.id)}>
          <Heart className="h-4 w-4" />
          {comment.likes_count}
        </Button>
        <Button variant="ghost" className="h-8 gap-1 px-3" onClick={() => setReplyOpen((value) => !value)}>
          <Reply className="h-4 w-4" />
          Reply
        </Button>
      </div>
      {replyOpen && (
        <div className="mt-3 flex gap-2">
          <Input placeholder="Write a reply" value={replyText} onChange={(event) => setReplyText(event.target.value)} />
          <Button onClick={() => void submitReply()}>Send</Button>
        </div>
      )}
      {comment.replies.length > 0 && (
        <div className="mt-3 border-l pl-4">
          {!repliesOpen && (
            <button className="text-sm font-medium text-primary hover:underline" onClick={() => setRepliesOpen(true)} type="button">
              Show {comment.replies.length} replies
            </button>
          )}
          {repliesOpen && comment.replies.map((reply) => (
            <CommentThread comment={reply} key={reply.id} onLike={onLike} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}
