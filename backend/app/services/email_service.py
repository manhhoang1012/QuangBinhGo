from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from html import escape

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def send_email(self, *, to_email: str, subject: str, html: str, text: str | None = None) -> bool:
        if settings.email_provider.lower() != "smtp":
            logger.info("Email provider is not smtp; skipping email send to %s.", to_email)
            return False

        if not self._smtp_configured():
            logger.warning("SMTP email is not fully configured; skipping email send to %s.", to_email)
            return False

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = formataddr((settings.smtp_from_name, settings.smtp_from_email))
        message["To"] = to_email
        message.set_content(text or self._plain_text_from_html(html))
        message.add_alternative(html, subtype="html")

        try:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
                smtp.ehlo()
                smtp.starttls()
                smtp.ehlo()
                smtp.login(settings.smtp_username, settings.smtp_password)
                smtp.send_message(message)
            logger.info("Email sent successfully to %s.", to_email)
            return True
        except Exception as exc:
            logger.warning("Email send failed for %s: %s", to_email, exc.__class__.__name__)
            return False

    def send_verification_email(self, *, email: str, token: str) -> str | None:
        url = self._frontend_link("verify-email", token)
        self._dev_log("verify", email, url)
        self.send_email(
            to_email=email,
            subject="Verify your QuangBinhGo email",
            html=self._button_template(
                title="Verify your email",
                intro="Welcome to QuangBinhGo. Confirm your email to secure your account and unlock the full travel community experience.",
                button_label="Verify Email",
                button_url=url,
                fallback_text="If the button does not work, copy and paste this verification link into your browser:",
            ),
            text=f"Verify your QuangBinhGo email: {url}",
        )
        return url if self._is_dev_mode() else None

    def send_password_reset_email(self, *, email: str, token: str) -> str | None:
        return self.send_reset_password_email(email=email, token=token)

    def send_reset_password_email(self, *, email: str, token: str) -> str | None:
        url = self._frontend_link("reset-password", token)
        self._dev_log("reset password", email, url)
        self.send_email(
            to_email=email,
            subject="Reset your QuangBinhGo password",
            html=self._button_template(
                title="Reset your password",
                intro="We received a request to reset your QuangBinhGo password. This link is time-limited, so use it soon.",
                button_label="Reset Password",
                button_url=url,
                fallback_text="If the button does not work, copy and paste this reset link into your browser:",
            ),
            text=f"Reset your QuangBinhGo password: {url}",
        )
        return url if self._is_dev_mode() else None

    def _smtp_configured(self) -> bool:
        return all(
            [
                settings.smtp_host,
                settings.smtp_port,
                settings.smtp_username,
                settings.smtp_password,
                settings.smtp_from_email,
            ]
        )

    def _frontend_link(self, path: str, token: str) -> str:
        return f"{settings.frontend_url.rstrip('/')}/{path}?token={token}"

    def _dev_log(self, action: str, email: str, url: str) -> None:
        if self._is_dev_mode():
            logger.info("[dev-email] %s link for %s: %s", action, email, url)

    def _is_dev_mode(self) -> bool:
        return settings.app_env.lower() in {"development", "dev", "local"}

    def _button_template(self, *, title: str, intro: str, button_label: str, button_url: str, fallback_text: str) -> str:
        safe_title = escape(title)
        safe_intro = escape(intro)
        safe_button_label = escape(button_label)
        safe_url = escape(button_url, quote=True)
        safe_fallback = escape(fallback_text)

        return f"""<!doctype html>
<html>
  <body style="margin:0;background:#f4f7f6;font-family:Inter,Segoe UI,Arial,sans-serif;color:#17211d;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f6;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dfe8e2;">
            <tr>
              <td style="background:#0f766e;padding:28px 32px;color:#ffffff;">
                <div style="font-size:14px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">QuangBinhGo</div>
                <div style="font-size:28px;font-weight:700;margin-top:8px;">{safe_title}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="font-size:16px;line-height:1.7;margin:0 0 24px;">{safe_intro}</p>
                <p style="margin:0 0 28px;">
                  <a href="{safe_url}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;padding:14px 22px;">{safe_button_label}</a>
                </p>
                <p style="font-size:14px;line-height:1.6;color:#5b6b63;margin:0 0 8px;">{safe_fallback}</p>
                <p style="font-size:13px;line-height:1.6;word-break:break-all;margin:0;color:#0f766e;">{safe_url}</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fbfa;padding:18px 32px;font-size:12px;color:#718077;">
                This message was sent by QuangBinhGo. If you did not request it, you can safely ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""

    def _plain_text_from_html(self, html: str) -> str:
        return html.replace("<br>", "\n").replace("</p>", "\n")
