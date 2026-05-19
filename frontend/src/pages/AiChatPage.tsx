import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/seo/SEO";
import { aiChat } from "@/services/aiApi";
import { type Place, type ReviewPost } from "@/services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Mình là trợ lý du lịch Quảng Bình. Bạn muốn hỏi về địa điểm, lịch trình, chi phí hay mùa đi đẹp?" },
  ]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(false);
  const quickPrompts = [
    "Đi Quảng Bình mùa nào đẹp?",
    "Gợi ý lịch trình 3 ngày",
    "Nên ăn gì ở Đồng Hới?",
    "Địa điểm phù hợp gia đình?",
  ];

  const send = async () => {
    const content = message.trim();
    if (!content) return;
    setMessages((current) => [...current, { role: "user", content }]);
    setMessage("");
    setLoading(true);
    try {
      const response = await aiChat(content);
      setMessages((current) => [...current, { role: "assistant", content: response.answer }]);
      setPlaces(response.related_places);
      setPosts(response.related_posts);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Mình chưa trả lời được lúc này. Bạn thử hỏi ngắn hơn nhé." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_340px]">
      <SEO title="Chatbot du lịch Quảng Bình | QuangBinhGo" description="Hỏi đáp nhanh về mùa đi, chi phí, địa điểm, ăn uống và lịch trình Quảng Bình." url="/ai/chatbot" />
      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" /> Gemini powered</p>
        <h1 className="mt-3 text-4xl font-semibold">Chatbot du lịch</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button className="rounded-md border px-3 py-2 text-sm hover:bg-muted" key={prompt} onClick={() => setMessage(prompt)} type="button">
              {prompt}
            </button>
          ))}
        </div>
        <div className="mt-6 min-h-[460px] space-y-3 rounded-md border bg-background p-4">
          {messages.map((item, index) => (
            <div className={`max-w-[82%] rounded-md p-3 text-sm ${item.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`} key={index}>
              {item.content}
            </div>
          ))}
          {loading && <div className="inline-flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground"><Bot className="h-4 w-4" /> Gemini đang trả lời...</div>}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void send(); }} placeholder="Đi Quảng Bình tháng 7 có nóng không?" />
          <Button onClick={() => void send()} disabled={loading}>Gửi</Button>
        </div>
      </div>
      <aside className="space-y-4">
        <h2 className="text-xl font-semibold">Liên quan</h2>
        {places.length === 0 && posts.length === 0 && <p className="text-sm text-muted-foreground">Địa điểm và bài viết liên quan sẽ xuất hiện sau khi bạn hỏi.</p>}
        {places.map((place) => (
          <Card key={place.id}><CardContent className="pt-4"><Link className="font-medium hover:text-primary" to={`/places/${place.slug || place.id}`}>{place.name}</Link><p className="mt-1 text-sm text-muted-foreground">{place.category}</p></CardContent></Card>
        ))}
        {posts.map((post) => (
          <Card key={post.id}><CardContent className="pt-4"><Link className="font-medium hover:text-primary" to={`/community/${post.slug || post.id}`}>{post.title || "Bài review"}</Link><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.content}</p></CardContent></Card>
        ))}
      </aside>
    </section>
  );
}
