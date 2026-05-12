import { ImagePlus, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreatePostPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold">Create travel review</h1>
      <p className="mt-3 text-muted-foreground">Share a place, story, photos, and practical notes for other travelers.</p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Review details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Post title" />
          <Input placeholder="Place ID or place name" />
          <Textarea placeholder="What made this trip memorable?" />
          <button className="flex h-36 w-full items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground">
            <ImagePlus className="mr-2 h-5 w-5" />
            Add photos
          </button>
          <Button className="gap-2">
            <Send className="h-4 w-4" />
            Publish review
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
