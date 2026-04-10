// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import alpinejs from "@astrojs/alpinejs";
import playformInline from "@playform/inline";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://h-yone.com",
	base: "/",
	// trailingSlash: 'always',
	integrations: [
		alpinejs(),
		playformInline({
			Beasties: true,
		}),
	],
	adapter: cloudflare(),
	output: "static",
	devToolbar: {
		enabled: false,
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
