// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import alpinejs from "@astrojs/alpinejs";
import playformInline from "@playform/inline";
// [Legacy: Cloudflare] import cloudflare from "@astrojs/cloudflare";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
	site: "https://h-yone.com",
	base: "/portfolio",
	// BASE_URL を `/portfolio/` のように末尾スラッシュ付きに揃える（公式: trailingSlash と base の組み合わせ）
	trailingSlash: "always",
	// [Legacy: Cloudflare] Astro.session を使わないため KV バインディング不要。
	// 未指定だと @astrojs/cloudflare が SESSION KV を自動要求したため driver を memory に固定していた。
	// Vercel では KV を自動要求されないため不要。
	// session: {
	// 	driver: "memory",
	// },
	integrations: [
		alpinejs(),
		playformInline({
			Beasties: true,
		}),
	],
	// [Legacy: Cloudflare] Cloudflare ランタイムでは sharp が使えないため compile 時に画像最適化を行っていた。
	// adapter: cloudflare({
	// 	imageService: "compile",
	// }),
	adapter: vercel(),
	output: "static",
	devToolbar: {
		enabled: false,
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
