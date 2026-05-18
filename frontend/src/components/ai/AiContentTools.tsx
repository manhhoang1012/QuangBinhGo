import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateCaption, generateHashtags, moderateContent, summarizeReview } from "@/services/aiApi";

export function AiContentTools() {
  const [content, setContent] = useState("");
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState("");

  const run = async (type: "caption" | "summary" | "hashtags" | "moderate") => {
    if (!content.trim()) return;
    setLoading(type);
    try {
      if (type === "caption") {
        const data = await generateCaption(content);
        setOutput(Object.entries(data.captions).map(([key, value]) => `${key}: ${value}`).join("\n"));
      }
      if (type === "summary") setOutput((await summarizeReview(content)).summary);
      if (type === "hashtags") setOutput((await generateHashtags(content)).hashtags.join(" "));
      if (type === "moderate") {
        const data = await moderateContent(content);
        setOutput(data.safe ? "Nội dung an toàn." : `Cảnh báo: ${data.labels.join(", ")}. ${data.warning ?? ""}`);
      }
    } catch {
      setOutput("Không thể dùng công cụ AI lúc này.");
    } finally {
      setLoading("");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <h2 className="text-xl font-semibold">AI Content tools</h2>
        <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Dán caption/review/nội dung cần kiểm tra..." />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void run("caption")} disabled={Boolean(loading)}>Caption</Button>
          <Button variant="outline" onClick={() => void run("summary")} disabled={Boolean(loading)}>Tóm tắt</Button>
          <Button variant="outline" onClick={() => void run("hashtags")} disabled={Boolean(loading)}>Hashtags</Button>
          <Button variant="outline" onClick={() => void run("moderate")} disabled={Boolean(loading)}>Moderate</Button>
        </div>
        {loading && <p className="text-sm text-muted-foreground">Đang xử lý...</p>}
        {output && <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{output}</pre>}
      </CardContent>
    </Card>
  );
}
