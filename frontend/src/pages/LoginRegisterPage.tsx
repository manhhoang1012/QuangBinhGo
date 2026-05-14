import { useState } from "react";
import { Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, login, register } from "@/services/authApi";

export function LoginRegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (mode === "register") {
        await register({ email, password, username, full_name: fullName || "QuangBinhGo Traveler" });
      } else {
        await login({ email, password });
      }
      navigate("/profile");
    } catch {
      setError("Authentication failed. Check your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: "google" | "facebook") => {
    window.location.href = `${API_BASE_URL}/auth/${provider}/login`;
  };

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
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setMode("login")} variant={mode === "login" ? "secondary" : "outline"}>Login</Button>
            <Button onClick={() => setMode("register")} variant={mode === "register" ? "secondary" : "outline"}>Register</Button>
          </div>
          {mode === "register" && <Input onChange={(event) => setFullName(event.target.value)} placeholder="Full name" value={fullName} />}
          {mode === "register" && <Input onChange={(event) => setUsername(event.target.value)} placeholder="Username" value={username} />}
          <Input onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" value={email} />
          <Input onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" value={password} />
          <Button className="w-full" disabled={isLoading} onClick={() => void handleSubmit()}>
            {isLoading ? "Please wait..." : "Continue"}
          </Button>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => handleOAuthLogin("google")} type="button" variant="outline">
              Đăng nhập với Google
            </Button>
            <Button onClick={() => handleOAuthLogin("facebook")} type="button" variant="outline">
              Đăng nhập với Facebook
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Admin accounts can manage places from the dashboard.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
