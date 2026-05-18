import { Clipboard, Hash, ShieldCheck, Sparkles, TextQuote } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateCaption, generateHashtags, moderateContent, summarizeReview } from "@/services/aiApi";

type ToolTab = "caption" | "summary" | "hashtags" | "moderate";

const tabs: Array<{ id: ToolTab; label: string; icon: typeof TextQuote }> = [
  { id: "caption", label: "Gợi ý caption", icon: TextQuote },
  { id: "summary", label: "Tóm tắt review", icon: Clipboard },
  { id: "hashtags", label: "Tự động hashtag", icon: Hash },
  { id: "moderate", label: "Kiểm tra spam/độc hại", icon: ShieldCheck },
];

export function AiContentToolsPage() {
  const [tab, setTab] = useState<ToolTab>("caption");
  const [content, setContent] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      if (tab === "caption") {
        const data = await generateCaption(content);
        setOutput(Object.entries(data.captions).map(([key, value]) => `${key}: ${value}`).join("\n"));
      }
      if (tab === "summary") setOutput((await summarizeReview(content)).summary);
      if (tab === "hashtags") setOutput((await generateHashtags(content)).hashtags.join(" "));
      if (tab === "moderate") {
        const data = await moderateContent(content);
        setOutput(data.safe ? "Nội dung an toàn." : `Cảnh báo: ${data.labels.join(", ")}. ${data.warning ?? ""}`);
      }
    } catch {
      setError("Không thể dùng công cụ AI lúc này.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" /> Gemini powered</p>
      <h1 className="mt-3 text-4xl font-semibold">AI Content Tools</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tạo caption, hashtag, tóm tắt review và kiểm tra spam/toxic cho nội dung cộng đồng.</p>

      <Card className="mt-6">
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${tab === item.id ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}
                  key={item.id}
                  onClick={() => { setTab(item.id); setOutput(""); setError(null); }}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <Textarea className="min-h-40" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Dán caption, review hoặc nội dung cần kiểm tra..." />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void run()} disabled={loading || !content.trim()}>{loading ? "Đang xử lý..." : "Chạy công cụ AI"}</Button>
            <Button variant="outline" onClick={() => void copy()} disabled={!output}>{copied ? "Đã copy" : "Copy kết quả"}</Button>
          </div>
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          {!output && !error && <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Kết quả AI sẽ hiển thị tại đây.</div>}
          {output && <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-6">{output}</pre>}
        </CardContent>
      </Card>
    </section>
  );
}
