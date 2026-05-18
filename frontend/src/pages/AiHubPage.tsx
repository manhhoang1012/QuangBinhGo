import { Bot, CalendarDays, Hash, MapPinned, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const aiFeatures = [
  {
    icon: Search,
    title: "AI Search",
    description: "Tìm địa điểm và bài review bằng câu hỏi tự nhiên.",
    to: "/ai/search",
  },
  {
    icon: MapPinned,
    title: "Gợi ý địa điểm",
    description: "Nhận danh sách địa điểm phù hợp sở thích, ngân sách và kiểu đi.",
    to: "/ai/recommendations",
  },
  {
    icon: Bot,
    title: "Chatbot du lịch",
    description: "Hỏi nhanh về mùa đi, chi phí, ăn uống, lịch trình và hoạt động.",
    to: "/ai/chatbot",
  },
  {
    icon: CalendarDays,
    title: "Tạo lịch trình AI",
    description: "Gemini sắp xếp lịch trình theo ngày từ dữ liệu địa điểm thật.",
    to: "/ai/itinerary",
  },
  {
    icon: Hash,
    title: "Công cụ nội dung",
    description: "Tạo caption, hashtag, tóm tắt review và kiểm tra spam/toxic.",
    to: "/ai/content-tools",
  },
];

export function AiHubPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <Badge className="gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Gemini powered
        </Badge>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">Trợ lý AI du lịch Quảng Bình</h1>
        <p className="mt-4 text-muted-foreground">
          Tìm địa điểm, hỏi đáp, tạo lịch trình và viết nội dung du lịch nhanh hơn với Gemini AI.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card className="h-full" key={feature.to}>
              <CardContent className="flex h-full flex-col pt-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-xl font-semibold">{feature.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                <Badge className="mt-4 w-fit bg-secondary text-secondary-foreground">Gemini powered</Badge>
                <Link className="mt-4" to={feature.to}>
                  <Button className="w-full">Dùng ngay</Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
