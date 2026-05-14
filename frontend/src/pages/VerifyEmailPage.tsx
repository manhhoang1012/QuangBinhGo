import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyEmail } from "@/services/authApi";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState("Verifying email...");
  const token = params.get("token") ?? "";

  useEffect(() => {
    if (!token) {
      setMessage("Missing verification token.");
      return;
    }
    void verifyEmail(token).then((response) => setMessage(response.message)).catch(() => setMessage("Could not verify email."));
  }, [token]);

  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <Card>
        <CardHeader><CardTitle>Email verification</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">{message}</CardContent>
      </Card>
    </section>
  );
}
