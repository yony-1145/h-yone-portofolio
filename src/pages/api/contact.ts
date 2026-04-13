import type { APIRoute } from "astro";
import { Resend } from "resend";
import { email as contactEmail } from "~/data/config";
import { buildAutoReplyHtml, escapeHtml, publicSiteUrl, getEmailLabels } from "~/lib/auto-reply-email";

export const prerender = false;

const INQUIRY_TYPES = ["project", "consultation", "chat", "other"] as const;
type InquiryType = (typeof INQUIRY_TYPES)[number];
const MAIL_LOCALES = ["ja", "en"] as const;
type MailLocale = (typeof MAIL_LOCALES)[number];

interface ContactPayload {
	name?: unknown;
	email?: unknown;
	message?: unknown;
	inquiryType?: unknown;
	locale?: unknown;
	token?: unknown;
}

function getClientIp(request: Request): string {
	// Cloudflare provides cf-connecting-ip as the client IP
	const cfIp = request.headers.get("cf-connecting-ip");
	if (cfIp) return cfIp;
	// Fallback to x-forwarded-for for other proxies
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (!forwardedFor) return "";
	return forwardedFor.split(",")[0]?.trim() ?? "";
}

function normalizeText(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function validatePayload(payload: ContactPayload) {
	const name = normalizeText(payload.name);
	const senderEmail = normalizeText(payload.email);
	const message = normalizeText(payload.message);
	const inquiryType = normalizeText(payload.inquiryType) as InquiryType;
	const locale = normalizeText(payload.locale) as MailLocale;
	const token = normalizeText(payload.token);

	if (!name || name.length > 100) return { ok: false as const, code: "invalid_name" };
	if (!senderEmail || senderEmail.length > 254) return { ok: false as const, code: "invalid_email" };
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) return { ok: false as const, code: "invalid_email" };
	if (!message || message.length > 3000) return { ok: false as const, code: "invalid_message" };
	if (!INQUIRY_TYPES.includes(inquiryType)) return { ok: false as const, code: "invalid_inquiry_type" };
	if (!token) return { ok: false as const, code: "turnstile_missing" };

	return {
		ok: true as const,
		value: {
			name,
			senderEmail,
			message,
			inquiryType,
			locale: MAIL_LOCALES.includes(locale) ? locale : "en",
			token,
		},
	};
}

function getInquiryTypeLabel(inquiryType: InquiryType, locale: MailLocale): string {
	const labelsByLocale: Record<MailLocale, Record<InquiryType, string>> = {
		ja: {
			project: "プロジェクトのご相談",
			consultation: "技術コンサルティング",
			chat: "カジュアルな会話・ネットワーキング",
			other: "その他",
		},
		en: {
			project: "Project Inquiry",
			consultation: "Technical Consultation",
			chat: "Casual Chat / Networking",
			other: "Other",
		},
	};
	const labels = labelsByLocale[locale];
	return labels[inquiryType];
}

async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
	const secret = import.meta.env.TURNSTILE_SECRET_KEY;
	if (!secret) return false;

	const body = new URLSearchParams({
		secret,
		response: token,
	});

	if (ip) {
		body.set("remoteip", ip);
	}

	const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});

	if (!response.ok) return false;

	const result = (await response.json()) as { success?: boolean };
	return result.success === true;
}

export const POST: APIRoute = async ({ request }) => {
	if (
		!import.meta.env.RESEND_API_KEY ||
		!import.meta.env.TURNSTILE_SECRET_KEY ||
		!import.meta.env.RESEND_FROM_EMAIL
	) {
		return new Response(JSON.stringify({ ok: false, error: "server_error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	const contentType = request.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		return new Response(JSON.stringify({ ok: false, error: "invalid_request" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	let payload: ContactPayload;
	try {
		payload = (await request.json()) as ContactPayload;
	} catch {
		return new Response(JSON.stringify({ ok: false, error: "invalid_request" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const validation = validatePayload(payload);
	if (!validation.ok) {
		return new Response(JSON.stringify({ ok: false, error: validation.code }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const turnstileOk = await verifyTurnstileToken(
		validation.value.token,
		getClientIp(request),
	);
	if (!turnstileOk) {
		return new Response(JSON.stringify({ ok: false, error: "turnstile_failed" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const resend = new Resend(import.meta.env.RESEND_API_KEY);

	try {
		const escapedName = escapeHtml(validation.value.name);
		const escapedEmail = escapeHtml(validation.value.senderEmail);
		const escapedMessage = escapeHtml(validation.value.message).replaceAll("\n", "<br />");
		const siteUrl = publicSiteUrl();
		const inquiryLabel = escapeHtml(
			getInquiryTypeLabel(validation.value.inquiryType, validation.value.locale),
		);

		const adminText = [
			"New contact form submission",
			`Name: ${validation.value.name}`,
			`Email: ${validation.value.senderEmail}`,
			`Inquiry Type: ${getInquiryTypeLabel(validation.value.inquiryType, "en")}`,
			`Locale: ${validation.value.locale}`,
			"",
			"Message:",
			validation.value.message,
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
			from: import.meta.env.RESEND_FROM_EMAIL,
			to: [contactEmail.label],
			replyTo: validation.value.senderEmail,
			subject: `[Contact] ${validation.value.inquiryType} - ${validation.value.name}`,
			text: adminText,
			html: adminHtml,
		});

		if (adminSendResult.error) {
			console.error("Resend admin send failed:", adminSendResult.error);
			return new Response(JSON.stringify({ ok: false, error: "send_failed" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}

		const autoReplyText =
			validation.value.locale === "ja"
				? [
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
						`Hiromi Yonemoto | ${siteUrl}`,
					].join("\n")
				: [
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
						`Hiromi Yonemoto | ${siteUrl}`,
					].join("\n");

		const emailLabels = getEmailLabels(validation.value.locale);
		const autoReplyHtml = buildAutoReplyHtml({
			locale: validation.value.locale,
			name: validation.value.name,
			inquiryLabel: getInquiryTypeLabel(validation.value.inquiryType, validation.value.locale),
			message: validation.value.message,
			siteUrl,
			...emailLabels,
		});

		const autoReplyResult = await resend.emails.send({
			from: import.meta.env.RESEND_FROM_EMAIL,
			to: [validation.value.senderEmail],
			subject:
				validation.value.locale === "ja"
					? "お問い合わせありがとうございます"
					: "Thank you for your inquiry",
			text: autoReplyText,
			html: autoReplyHtml,
		});

		if (autoReplyResult.error) {
			console.error("Resend auto-reply send failed:", autoReplyResult.error);
			return new Response(JSON.stringify({ ok: false, error: "send_failed" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	} catch {
		return new Response(JSON.stringify({ ok: false, error: "send_failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};

