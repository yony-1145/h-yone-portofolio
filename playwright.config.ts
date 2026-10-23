import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;

export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: "list",
	use: {
		baseURL: `http://localhost:${PORT}`,
	},
	projects: [
		{ name: "desktop", use: { ...devices["Desktop Chrome"] } },
		{ name: "mobile", use: { ...devices["Pixel 7"] } },
	],
	webServer: {
		command: `pnpm build && node tests/serve-dist.mjs`,
		url: `http://localhost:${PORT}/`,
		env: { PORT: String(PORT) },
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
});
