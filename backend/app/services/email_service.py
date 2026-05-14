from app.core.config import settings


class EmailService:
    def send_verification_email(self, *, email: str, token: str) -> str | None:
        return self._dev_link("verify-email", token, email)

    def send_password_reset_email(self, *, email: str, token: str) -> str | None:
        return self._dev_link("reset-password", token, email)

    def _dev_link(self, path: str, token: str, email: str) -> str | None:
        if settings.app_env.lower() not in {"development", "dev", "local"}:
            return None

        link = f"http://localhost:5173/{path}?token={token}"
        print(f"[dev-email] {email}: {link}")
        return link
