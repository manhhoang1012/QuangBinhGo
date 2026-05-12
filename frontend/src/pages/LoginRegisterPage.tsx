import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginRegisterPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Compass className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold">Join the Quang Binh travel community</h1>
        <p className="mt-4 text-muted-foreground">
          Save places, publish reviews, like community stories, and plan better trips with local context.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Login or register</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Full name" />
          <Input placeholder="Email" type="email" />
          <Input placeholder="Password" type="password" />
          <Button className="w-full">Continue</Button>
          <p className="text-center text-sm text-muted-foreground">
            Admin accounts can manage places from the dashboard.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
