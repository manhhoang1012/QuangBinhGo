import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { persistOAuthToken } from "@/services/authApi";
import { getCurrentProfile } from "@/services/userApi";

export function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing OAuth login...");
  const error = params.get("error");
  const token = params.get("token");

  useEffect(() => {
    if (error) {
      setMessage(error);
      return;
    }

    if (!token) {
      setMessage("OAuth callback is missing a token.");
      return;
    }

    persistOAuthToken(token);
    void getCurrentProfile()
      .then(() => navigate("/profile", { replace: true }))
      .catch(() => {
        setMessage("OAuth token was received, but loading the user profile failed.");
      });
  }, [error, navigate, token]);

  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>OAuth login</CardTitle>
        </CardHeader>
        <CardContent className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {message}
        </CardContent>
      </Card>
    </section>
  );
}
