export type AutoReplyLocale = "ja" | "en";

const DEFAULT_SITE_URL = "https://h-yone.com";

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
}): string {
	const siteUrl = options.siteUrl ?? DEFAULT_SITE_URL;
	const escapedName = escapeHtml(options.name);
	const escapedMessage = escapeHtml(options.message).replaceAll("\n", "<br />");
	const inquiryLabel = escapeHtml(options.inquiryLabel);

	if (options.locale === "ja") {
		return `
			<div style="background-color: #f9fafb; padding: 40px 16px;">
				<div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px;">
					<div style="padding: 36px 32px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;">
						<p style="margin: 0 0 24px; font-size: 15px; color: #111827; line-height: 1.8;">${escapedName} 様</p>
						<p style="margin: 0 0 28px; font-size: 15px; color: #374151; line-height: 1.8;">お問い合わせいただきありがとうございます。<br />以下の内容で受け付けました。</p>
						<div style="border-left: 3px solid #157f71; padding: 16px 20px; margin: 0 0 28px; background: #f9fafb;">
							<p style="margin: 0 0 2px; font-size: 11px; font-weight: 600; color: #6b7280; letter-spacing: 0.06em; text-transform: uppercase;">お問い合わせ種別</p>
							<p style="margin: 0 0 16px; font-size: 15px; color: #111827;">${inquiryLabel}</p>
							<p style="margin: 0 0 2px; font-size: 11px; font-weight: 600; color: #6b7280; letter-spacing: 0.06em; text-transform: uppercase;">メッセージ</p>
							<p style="margin: 0; font-size: 15px; color: #111827; line-height: 1.8;">${escapedMessage}</p>
						</div>
						<p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.8;">内容を確認のうえ、24時間以内にご返信いたします。</p>
					</div>
					<div style="padding: 20px 32px; border-top: 1px solid #e5e7eb;">
						<p style="margin: 0; font-size: 12px; color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Hiromi Yonemoto&ensp;&middot;&ensp;<a href="${siteUrl}" style="color: #9ca3af; text-decoration: none;">h-yone.com</a></p>
					</div>
				</div>
			</div>
		`;
	}

	return `
			<div style="background-color: #f9fafb; padding: 40px 16px;">
				<div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px;">
					<div style="padding: 36px 32px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
						<p style="margin: 0 0 24px; font-size: 15px; color: #111827; line-height: 1.7;">Hi ${escapedName},</p>
						<p style="margin: 0 0 28px; font-size: 15px; color: #374151; line-height: 1.7;">Thank you for reaching out.<br />Your message has been received with the following details.</p>
						<div style="border-left: 3px solid #157f71; padding: 16px 20px; margin: 0 0 28px; background: #f9fafb;">
							<p style="margin: 0 0 2px; font-size: 11px; font-weight: 600; color: #6b7280; letter-spacing: 0.06em; text-transform: uppercase;">Inquiry Type</p>
							<p style="margin: 0 0 16px; font-size: 15px; color: #111827;">${inquiryLabel}</p>
							<p style="margin: 0 0 2px; font-size: 11px; font-weight: 600; color: #6b7280; letter-spacing: 0.06em; text-transform: uppercase;">Message</p>
							<p style="margin: 0; font-size: 15px; color: #111827; line-height: 1.7;">${escapedMessage}</p>
						</div>
						<p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.7;">I'll review your message and respond within 24 hours.</p>
					</div>
					<div style="padding: 20px 32px; border-top: 1px solid #e5e7eb;">
						<p style="margin: 0; font-size: 12px; color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Hiromi Yonemoto&ensp;&middot;&ensp;<a href="${siteUrl}" style="color: #9ca3af; text-decoration: none;">h-yone.com</a></p>
					</div>
				</div>
			</div>
		`;
}
