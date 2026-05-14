import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/services/authApi";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    try {
      const response = await forgotPassword(email);
      setMessage(response.dev_url ? `${response.message} Dev link: ${response.dev_url}` : response.message);
    } catch {
      setError("Could not request password reset.");
    }
  };

  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <Card>
        <CardHeader><CardTitle>Forgot password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="rounded-md border bg-accent/10 p-3 text-sm text-accent">{message}</div>}
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <Input onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" value={email} />
          <Button onClick={() => void handleSubmit()}>Send reset link</Button>
        </CardContent>
      </Card>
    </section>
  );
}
