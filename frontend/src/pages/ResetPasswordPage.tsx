import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/services/authApi";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = params.get("token") ?? "";

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    try {
      const response = await resetPassword(token, password, confirmPassword);
      setMessage(response.message);
    } catch {
      setError("Could not reset password. Check the link and password confirmation.");
    }
  };

  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <Card>
        <CardHeader><CardTitle>Reset password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="rounded-md border bg-accent/10 p-3 text-sm text-accent">{message}</div>}
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <Input onChange={(event) => setPassword(event.target.value)} placeholder="New password" type="password" value={password} />
          <Input onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" type="password" value={confirmPassword} />
          <Button disabled={!token} onClick={() => void handleSubmit()}>Reset password</Button>
        </CardContent>
      </Card>
    </section>
  );
}
