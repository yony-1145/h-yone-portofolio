import { Resend } from 'resend';
import { e as email } from '../../chunks/config_DpLJWwi_.mjs';
export { renderers } from '../../renderers.mjs';

function getEmailLabels(locale) {
  if (locale === "ja") {
    return {
      greeting: "様",
      thankYou: "お問い合わせいただきありがとうございます。",
      received: "以下の内容で受け付けました。",
      inquiryTypeLabel: "お問い合わせ種別",
      messageLabel: "メッセージ",
      responseTime: "内容を確認のうえ、24時間以内にご返信いたします。",
      signature: "Hiromi Yonemoto"
    };
  }
  return {
    greeting: "",
    thankYou: "Thank you for reaching out.",
    received: "Your message has been received with the following details.",
    inquiryTypeLabel: "Inquiry Type",
    messageLabel: "Message",
    responseTime: "I'll review your message and respond within 24 hours.",
    signature: "Hiromi Yonemoto"
  };
}
function publicSiteUrl() {
  const site = "https://h-yone.com"?.replace(/\/$/, "") ?? "https://h-yone.com";
  const path = "/portfolio/";
  return new URL(path, site).href.replace(/\/$/, "");
}
function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function buildAutoReplyHtml(options) {
  const siteUrl = options.siteUrl ?? publicSiteUrl();
  const escapedName = escapeHtml(options.name);
  const escapedMessage = escapeHtml(options.message).replaceAll("\n", "<br />");
  const inquiryLabel = escapeHtml(options.inquiryLabel);
  const greeting = options.greeting ?? (options.locale === "ja" ? "様" : "");
  const thankYou = options.thankYou ?? "";
  const received = options.received ?? "";
  const inquiryTypeLabel = options.inquiryTypeLabel ?? "";
  const messageLabel = options.messageLabel ?? "";
  const responseTime = options.responseTime ?? "";
  const signature = options.signature ?? "Hiromi Yonemoto";
  const greeting_text = options.locale === "ja" ? `${escapedName} ${greeting}` : `${greeting} ${escapedName},`;
  return `
		<div style="background-color: #f9fafb; padding: 40px 16px;">
			<div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px;">
				<div style="padding: 36px 32px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;">
					<p style="margin: 0 0 24px; font-size: 15px; color: #111827; line-height: 1.8;">${greeting_text}</p>
					<p style="margin: 0 0 28px; font-size: 15px; color: #374151; line-height: 1.8;">${thankYou}<br />${received}</p>
					<div style="border-left: 3px solid #157f71; padding: 16px 20px; margin: 0 0 28px; background: #f9fafb;">
						<p style="margin: 0 0 2px; font-size: 11px; font-weight: 600; color: #6b7280; letter-spacing: 0.06em; text-transform: uppercase;">${inquiryTypeLabel}</p>
						<p style="margin: 0 0 16px; font-size: 15px; color: #111827;">${inquiryLabel}</p>
						<p style="margin: 0 0 2px; font-size: 11px; font-weight: 600; color: #6b7280; letter-spacing: 0.06em; text-transform: uppercase;">${messageLabel}</p>
						<p style="margin: 0; font-size: 15px; color: #111827; line-height: 1.8;">${escapedMessage}</p>
					</div>
					<p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.8;">${responseTime}</p>
				</div>
				<div style="padding: 20px 32px; border-top: 1px solid #e5e7eb;">
					<p style="margin: 0; font-size: 12px; color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;">${signature}&ensp;&middot;&ensp;<a href="${siteUrl}" style="color: #9ca3af; text-decoration: none;">h-yone.com</a></p>
				</div>
			</div>
		</div>
	`;
}

const prerender = false;
const INQUIRY_TYPES = ["project", "consultation", "chat", "other"];
const MAIL_LOCALES = ["ja", "en"];
function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  return realIp ?? "";
}
function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}
function validatePayload(payload) {
  const name = normalizeText(payload.name);
  const senderEmail = normalizeText(payload.email);
  const message = normalizeText(payload.message);
  const inquiryType = normalizeText(payload.inquiryType);
  const locale = normalizeText(payload.locale);
  const token = normalizeText(payload.token);
  if (!name || name.length > 100) return { ok: false, code: "invalid_name" };
  if (!senderEmail || senderEmail.length > 254) return { ok: false, code: "invalid_email" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) return { ok: false, code: "invalid_email" };
  if (!message || message.length > 3e3) return { ok: false, code: "invalid_message" };
  if (!INQUIRY_TYPES.includes(inquiryType)) return { ok: false, code: "invalid_inquiry_type" };
  if (!token) return { ok: false, code: "turnstile_missing" };
  return {
    ok: true,
    value: {
      name,
      senderEmail,
      message,
      inquiryType,
      locale: MAIL_LOCALES.includes(locale) ? locale : "en",
      token
    }
  };
}
function getInquiryTypeLabel(inquiryType, locale) {
  const labelsByLocale = {
    ja: {
      project: "プロジェクトのご相談",
      consultation: "技術コンサルティング",
      chat: "カジュアルな会話・ネットワーキング",
      other: "その他"
    },
    en: {
      project: "Project Inquiry",
      consultation: "Technical Consultation",
      chat: "Casual Chat / Networking",
      other: "Other"
    }
  };
  const labels = labelsByLocale[locale];
  return labels[inquiryType];
}
async function verifyTurnstileToken(token, ip) {
  const secret = "0x4AAAAAAC2kzsQBU_9CjPtXo0lregbDGP8";
  const body = new URLSearchParams({
    secret,
    response: token
  });
  if (ip) {
    body.set("remoteip", ip);
  }
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
}
const POST = async ({ request }) => {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const validation = validatePayload(payload);
  if (!validation.ok) {
    return new Response(JSON.stringify({ ok: false, error: validation.code }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const turnstileOk = await verifyTurnstileToken(
    validation.value.token,
    getClientIp(request)
  );
  if (!turnstileOk) {
    return new Response(JSON.stringify({ ok: false, error: "turnstile_failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const resend = new Resend("re_LWNBd9fw_7duz5wvGg88YMDbqAaY3CUfQ");
  try {
    const escapedName = escapeHtml(validation.value.name);
    const escapedEmail = escapeHtml(validation.value.senderEmail);
    const escapedMessage = escapeHtml(validation.value.message).replaceAll("\n", "<br />");
    const siteUrl = publicSiteUrl();
    const inquiryLabel = escapeHtml(
      getInquiryTypeLabel(validation.value.inquiryType, validation.value.locale)
    );
    const adminText = [
      "New contact form submission",
      `Name: ${validation.value.name}`,
      `Email: ${validation.value.senderEmail}`,
      `Inquiry Type: ${getInquiryTypeLabel(validation.value.inquiryType, "en")}`,
      `Locale: ${validation.value.locale}`,
      "",
      "Message:",
      validation.value.message
    ].join("\n");
    const adminHtml = `
			<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
				<h2 style="margin: 0 0 16px;">New contact form submission</h2>
				<p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapedName}</p>
				<p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapedEmail}</p>
				<p style="margin: 0 0 16px;"><strong>Inquiry Type:</strong> ${inquiryLabel}</p>
				<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
					<p style="margin: 0 0 8px;"><strong>Message</strong></p>
					<p style="margin: 0;">${escapedMessage}</p>
				</div>
			</div>
		`;
    const adminSendResult = await resend.emails.send({
      from: "h-yone <contact@h-yone.com>",
      to: [email.label],
      replyTo: validation.value.senderEmail,
      subject: `[Contact] ${validation.value.inquiryType} - ${validation.value.name}`,
      text: adminText,
      html: adminHtml
    });
    if (adminSendResult.error) {
      console.error("Resend admin send failed:", adminSendResult.error);
      return new Response(JSON.stringify({ ok: false, error: "send_failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const autoReplyText = validation.value.locale === "ja" ? [
      `${validation.value.name} 様`,
      "",
      "お問い合わせいただきありがとうございます。",
      "以下の内容で受け付けました。",
      "",
      `お問い合わせ種別: ${getInquiryTypeLabel(validation.value.inquiryType, "ja")}`,
      "",
      "メッセージ:",
      validation.value.message,
      "",
      "内容を確認のうえ、24時間以内にご返信いたします。",
      "",
      "---",
      `Hiromi Yonemoto | ${siteUrl}`
    ].join("\n") : [
      `Hi ${validation.value.name},`,
      "",
      "Thank you for reaching out.",
      "Your message has been received with the following details.",
      "",
      `Inquiry Type: ${getInquiryTypeLabel(validation.value.inquiryType, "en")}`,
      "",
      "Message:",
      validation.value.message,
      "",
      "I'll review your message and respond within 24 hours.",
      "",
      "---",
      `Hiromi Yonemoto | ${siteUrl}`
    ].join("\n");
    const emailLabels = getEmailLabels(validation.value.locale);
    const autoReplyHtml = buildAutoReplyHtml({
      locale: validation.value.locale,
      name: validation.value.name,
      inquiryLabel: getInquiryTypeLabel(validation.value.inquiryType, validation.value.locale),
      message: validation.value.message,
      siteUrl,
      ...emailLabels
    });
    const autoReplyResult = await resend.emails.send({
      from: "h-yone <contact@h-yone.com>",
      to: [validation.value.senderEmail],
      subject: validation.value.locale === "ja" ? "お問い合わせありがとうございます" : "Thank you for your inquiry",
      text: autoReplyText,
      html: autoReplyHtml
    });
    if (autoReplyResult.error) {
      console.error("Resend auto-reply send failed:", autoReplyResult.error);
      return new Response(JSON.stringify({ ok: false, error: "send_failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "send_failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
