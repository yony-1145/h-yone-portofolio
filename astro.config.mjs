// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import alpinejs from "@astrojs/alpinejs";
import playformInline from "@playform/inline";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://portfolio.h-yone.com",
	trailingSlash: "always",
	integrations: [
		alpinejs(),
		playformInline({
			Beasties: {
				pruneSource: false,
				preload: "media",
				inlineFonts: true,
			},
		}),
	],
	adapter: cloudflare({
		imageService: "compile",
		platformProxy: { enabled: true },
	}),
	output: "static",
	devToolbar: {
		enabled: false,
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
