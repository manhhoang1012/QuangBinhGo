import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/services/authApi";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailError = useMemo(() => {
    if (!hasSubmitted && !email) return null;
    if (!email.trim()) return "Vui lòng nhập email.";
    if (!emailPattern.test(email.trim())) return "Email không hợp lệ.";
    return null;
  }, [email, hasSubmitted]);

  const handleSubmit = async () => {
    setHasSubmitted(true);
    setError(null);
    setSuccess(null);

    if (emailError || !email.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setSuccess("Email đặt lại mật khẩu đã được gửi nếu tài khoản tồn tại.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold">Quên mật khẩu</h1>
        <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
          Nhập email đã đăng ký QuangBinhGo. Nếu tài khoản tồn tại, hệ thống sẽ gửi liên kết đặt lại mật khẩu vào hộp thư của bạn.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Khôi phục tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <div className="rounded-md border bg-accent/10 p-3 text-sm text-accent">
              {success}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Input
              aria-invalid={Boolean(emailError)}
              autoComplete="email"
              disabled={isLoading}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleSubmit();
              }}
              placeholder="Email"
              type="email"
              value={email}
            />
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
          </div>

          <Button className="w-full gap-2" disabled={isLoading} onClick={() => void handleSubmit()}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Đang gửi..." : "Gửi email đặt lại mật khẩu"}
          </Button>

          <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" to="/login">
            <ArrowLeft className="h-4 w-4" />
            Quay về đăng nhập
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    return response?.data?.detail ?? fallback;
  }
  return fallback;
}
