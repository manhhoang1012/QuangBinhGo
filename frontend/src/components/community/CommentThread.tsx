import { useState } from "react";
import { Flag, Heart, Pencil, Reply, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Comment, type User } from "@/services/api";

interface CommentThreadProps {
  comment: Comment;
  currentUser: User | null;
  onDelete: (commentId: number) => Promise<void>;
  onEdit: (commentId: number, content: string) => Promise<void>;
  onLike: (comment: Comment) => Promise<void>;
  onReply: (commentId: number, content: string) => Promise<void>;
  onReport: (commentId: number, reason: "spam" | "offensive" | "harassment" | "other", detail?: string) => Promise<void>;
}

export function CommentThread({ comment, currentUser, onDelete, onEdit, onLike, onReply, onReport }: CommentThreadProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [repliesOpen, setRepliesOpen] = useState(comment.replies.length <= 2);
  const [isBusy, setIsBusy] = useState(false);
  const isOwner = currentUser?.id === comment.author.id;
  const canModerate = currentUser?.role === "admin" || currentUser?.role === "moderator";
  const canDelete = isOwner || canModerate;
  const isDeleted = comment.status === "deleted";

  const submitReply = async () => {
    const content = replyText.trim();
    if (!content) return;
    setIsBusy(true);
    try {
      await onReply(comment.id, content);
      setReplyText("");
      setReplyOpen(false);
      setRepliesOpen(true);
    } finally {
      setIsBusy(false);
    }
  };

  const submitEdit = async () => {
    const content = editText.trim();
    if (!content) return;
    setIsBusy(true);
    try {
      await onEdit(comment.id, content);
      setEditOpen(false);
    } finally {
      setIsBusy(false);
    }
  };

  const report = async () => {
    const raw = window.prompt("Chon ly do: spam, offensive, harassment, other", "spam");
    if (!raw) return;
    const reason = raw.trim() as "spam" | "offensive" | "harassment" | "other";
    if (!["spam", "offensive", "harassment", "other"].includes(reason)) return;
    const detail = window.prompt("Mo ta them neu can") ?? undefined;
    await onReport(comment.id, reason, detail);
  };

  return (
    <div className="rounded-md bg-muted/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="font-medium hover:text-primary" to={`/u/${comment.author.username}`}>{comment.author.full_name}</Link>
        <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
      </div>

      {editOpen ? (
        <div className="mt-3 flex gap-2">
          <Input value={editText} onChange={(event) => setEditText(event.target.value)} />
          <Button disabled={isBusy} onClick={() => void submitEdit()}>Save</Button>
          <Button disabled={isBusy} variant="outline" onClick={() => { setEditOpen(false); setEditText(comment.content); }}>Cancel</Button>
        </div>
      ) : (
        <p className={`mt-1 whitespace-pre-line text-sm ${isDeleted ? "italic text-muted-foreground" : "text-muted-foreground"}`}>
          {comment.content}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!isDeleted && (
          <Button variant="ghost" className="h-8 gap-1 px-3" disabled={isBusy} onClick={() => void onLike(comment)}>
            <Heart className={`h-4 w-4 ${comment.liked_by_me ? "fill-destructive text-destructive" : ""}`} />
            {comment.like_count ?? comment.likes_count}
          </Button>
        )}
        {!isDeleted && (
          <Button variant="ghost" className="h-8 gap-1 px-3" disabled={isBusy} onClick={() => setReplyOpen((value) => !value)}>
            <Reply className="h-4 w-4" />
            Tra loi
          </Button>
        )}
        {isOwner && !isDeleted && (
          <Button variant="ghost" className="h-8 gap-1 px-3" disabled={isBusy} onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Sua
          </Button>
        )}
        {canDelete && (
          <Button variant="ghost" className="h-8 gap-1 px-3 text-destructive" disabled={isBusy} onClick={() => { if (window.confirm("Xoa binh luan nay?")) void onDelete(comment.id); }}>
            <Trash2 className="h-4 w-4" />
            Xoa
          </Button>
        )}
        {!isOwner && !isDeleted && (
          <Button variant="ghost" className="h-8 gap-1 px-3" disabled={isBusy} onClick={() => void report()}>
            <Flag className="h-4 w-4" />
            Bao cao
          </Button>
        )}
      </div>

      {replyOpen && (
        <div className="mt-3 flex gap-2">
          <Input placeholder="Viet tra loi" value={replyText} onChange={(event) => setReplyText(event.target.value)} />
          <Button disabled={isBusy} onClick={() => void submitReply()}>Gui</Button>
          <Button disabled={isBusy} variant="outline" onClick={() => { setReplyOpen(false); setReplyText(""); }}><X className="h-4 w-4" /></Button>
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
            <CommentThread
              comment={reply}
              currentUser={currentUser}
              key={reply.id}
              onDelete={onDelete}
              onEdit={onEdit}
              onLike={onLike}
              onReply={onReply}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </div>
  );
}
