export type AutoReplyLocale = "ja" | "en";

export interface EmailLabels {
	greeting: string;
	thankYou: string;
	received: string;
	inquiryTypeLabel: string;
	messageLabel: string;
	responseTime: string;
	signature: string;
}

export function getEmailLabels(locale: AutoReplyLocale): EmailLabels {
	if (locale === "ja") {
		return {
			greeting: "様",
			thankYou: "お問い合わせいただきありがとうございます。",
			received: "以下の内容で受け付けました。",
			inquiryTypeLabel: "お問い合わせ種別",
			messageLabel: "メッセージ",
			responseTime: "内容を確認のうえ、24時間以内にご返信いたします。",
			signature: "Hiromi Yonemoto",
		};
	}
	return {
		greeting: "",
		thankYou: "Thank you for reaching out.",
		received: "Your message has been received with the following details.",
		inquiryTypeLabel: "Inquiry Type",
		messageLabel: "Message",
		responseTime: "I'll review your message and respond within 24 hours.",
		signature: "Hiromi Yonemoto",
	};
}

/** Canonical public URL (`site` + `base` from Astro config). */
export function publicSiteUrl(): string {
	const site = (import.meta.env.SITE as string | undefined)?.replace(/\/$/, "") ?? "https://h-yone.com";
	const path = import.meta.env.BASE_URL;
	if (path === "/") return site;
	return new URL(path, site).href.replace(/\/$/, "");
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function buildAutoReplyHtml(options: {
	locale: AutoReplyLocale;
	name: string;
	inquiryLabel: string;
	message: string;
	siteUrl?: string;
	greeting?: string;
	thankYou?: string;
	received?: string;
	inquiryTypeLabel?: string;
	messageLabel?: string;
	responseTime?: string;
	signature?: string;
}): string {
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

	const greeting_text = options.locale === "ja"
		? `${escapedName} ${greeting}`
		: `${greeting} ${escapedName},`;

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
