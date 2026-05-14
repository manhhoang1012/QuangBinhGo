import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/services/authApi";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const passwordError = useMemo(() => {
    if (!hasSubmitted && !password) return null;
    if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
    return null;
  }, [hasSubmitted, password]);

  const confirmPasswordError = useMemo(() => {
    if (!hasSubmitted && !confirmPassword) return null;
    if (!confirmPassword) return "Vui lòng xác nhận mật khẩu.";
    if (password !== confirmPassword) return "Mật khẩu xác nhận không khớp.";
    return null;
  }, [confirmPassword, hasSubmitted, password]);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => navigate("/login", { replace: true }), 2500);
    return () => window.clearTimeout(timeout);
  }, [navigate, success]);

  const handleSubmit = async () => {
    setHasSubmitted(true);
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token.");
      return;
    }

    if (passwordError || confirmPasswordError || password.length < 8 || password !== confirmPassword) {
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, password, confirmPassword);
      setSuccess("Đặt lại mật khẩu thành công. Bạn sẽ được chuyển về trang đăng nhập trong vài giây.");
      setPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(normalizeResetError(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  const invalidToken = !token;

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold">Đặt lại mật khẩu</h1>
        <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
          Tạo mật khẩu mới cho tài khoản QuangBinhGo. Hãy chọn mật khẩu đủ mạnh và không dùng lại mật khẩu cũ.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mật khẩu mới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invalidToken && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token. Vui lòng yêu cầu email đặt lại mật khẩu mới.
            </div>
          )}
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

          <PasswordInput
            disabled={isLoading || invalidToken || Boolean(success)}
            error={passwordError}
            onChange={setPassword}
            onToggle={() => setShowPassword((value) => !value)}
            placeholder="Mật khẩu mới"
            show={showPassword}
            value={password}
          />
          <PasswordInput
            disabled={isLoading || invalidToken || Boolean(success)}
            error={confirmPasswordError}
            onChange={setConfirmPassword}
            onToggle={() => setShowConfirmPassword((value) => !value)}
            placeholder="Xác nhận mật khẩu"
            show={showConfirmPassword}
            value={confirmPassword}
          />

          <Button className="w-full gap-2" disabled={isLoading || invalidToken || Boolean(success)} onClick={() => void handleSubmit()}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
          </Button>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="font-medium text-primary hover:underline" to="/forgot-password">
              Yêu cầu liên kết mới
            </Link>
            <Link className="font-medium text-primary hover:underline" to="/login">
              Quay về đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function PasswordInput({
  disabled,
  error,
  onChange,
  onToggle,
  placeholder,
  show,
  value,
}: {
  disabled: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onToggle: () => void;
  placeholder: string;
  show: boolean;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          aria-invalid={Boolean(error)}
          autoComplete="new-password"
          className="pr-11"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={show ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
          disabled={disabled}
          onClick={onToggle}
          type="button"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function normalizeResetError(error: unknown) {
  const fallback = "Không thể đặt lại mật khẩu. Vui lòng thử lại.";
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    const detail = response?.data?.detail ?? "";
    if (/expired|invalid/i.test(detail)) return "Liên kết đã hết hạn hoặc không hợp lệ.";
    return detail || fallback;
  }
  return fallback;
}
