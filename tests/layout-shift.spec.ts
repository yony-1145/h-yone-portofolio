import { test, expect, type Page } from "@playwright/test";

/**
 * Layout shift (CLS) regression tests.
 *
 * A local server is too fast to reveal most shifts, so we simulate a slow
 * network by delaying web fonts, client JS (Alpine.js) and the Turnstile
 * script. Shifts that only appear on slow connections become reproducible.
 */

const PAGES = ["/", "/about-me/", "/contact/", "/ja/", "/ja/about-me/", "/ja/contact/"];

/** Load-time CLS budget. Google's "good" threshold is 0.1. */
const LOAD_CLS_BUDGET = 0.05;

const FONT_DELAY_MS = 1500;
const JS_DELAY_MS = 1000;
const TURNSTILE_DELAY_MS = 1200;

/** Turnstile stub: renders a box with the real widget's size (300x65). */
const TURNSTILE_STUB = `
window.turnstile = {
	render(el) {
		const box = document.createElement("div");
		box.style.cssText = "width:300px;height:65px;background:#eee";
		el.appendChild(box);
		return "stub-widget";
	},
	reset() {},
};`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ShiftEntry = { value: number; sources: string[] };

async function setupSlowNetworkAndClsObserver(page: Page) {
	await page.route("**/*.woff2", async (route) => {
		await sleep(FONT_DELAY_MS);
		await route.continue();
	});
	await page.route("**/_astro/*.js", async (route) => {
		await sleep(JS_DELAY_MS);
		await route.continue();
	});
	await page.route("https://challenges.cloudflare.com/**", async (route) => {
		await sleep(TURNSTILE_DELAY_MS);
		await route.fulfill({ contentType: "text/javascript", body: TURNSTILE_STUB });
	});

	await page.addInitScript(() => {
		const w = window as unknown as { __shifts: { value: number; sources: string[] }[] };
		w.__shifts = [];
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries() as any[]) {
				if (entry.hadRecentInput) continue;
				w.__shifts.push({
					value: entry.value,
					sources: (entry.sources ?? []).map((s: any) => {
						const n = s.node as Element | null;
						if (!n || !n.nodeName) return "(unknown)";
						const cls = typeof n.className === "string" ? n.className.split(" ").slice(0, 3).join(".") : "";
						return `${n.nodeName.toLowerCase()}${n.id ? "#" + n.id : ""}${cls ? "." + cls : ""}`;
					}),
				});
			}
		}).observe({ type: "layout-shift", buffered: true });
	});
}

async function readShifts(page: Page): Promise<ShiftEntry[]> {
	return page.evaluate(() => (window as any).__shifts as ShiftEntry[]);
}

const total = (shifts: ShiftEntry[]) => shifts.reduce((sum, s) => sum + s.value, 0);

function describe(shifts: ShiftEntry[]) {
	return shifts.map((s) => `  ${s.value.toFixed(4)}  ${s.sources.join(", ")}`).join("\n");
}

test.describe("layout shift on page load (slow network)", () => {
	for (const path of PAGES) {
		test(`CLS < ${LOAD_CLS_BUDGET} on ${path}`, async ({ page }) => {
			await setupSlowNetworkAndClsObserver(page);
			await page.goto(path, { waitUntil: "load" });
			await page.evaluate(() => document.fonts.ready);
			// Let delayed scripts and Turnstile finish rendering.
			await page.waitForTimeout(TURNSTILE_DELAY_MS + 500);

			const shifts = await readShifts(page);
			const cls = total(shifts);
			test.info().annotations.push({ type: "CLS", description: cls.toFixed(4) });
			expect(cls, `layout shifts on ${path}:\n${describe(shifts)}`).toBeLessThan(LOAD_CLS_BUDGET);
		});
	}
});

test.describe("layout shift while scrolling", () => {
	for (const path of ["/", "/ja/about-me/"]) {
		test(`no shift when scrolling ${path}`, async ({ page }) => {
			await setupSlowNetworkAndClsObserver(page);
			await page.goto(path, { waitUntil: "load" });
			await page.evaluate(() => document.fonts.ready);
			await page.waitForTimeout(500);
			await page.evaluate(() => ((window as any).__shifts = []));

			for (let y = 0; y <= 2000; y += 100) {
				await page.evaluate((top) => window.scrollTo(0, top), y);
				await page.waitForTimeout(50);
			}
			await page.waitForTimeout(500);

			const shifts = await readShifts(page);
			expect(total(shifts), `layout shifts while scrolling ${path}:\n${describe(shifts)}`).toBeLessThan(0.001);
		});
	}

	test("header height does not change on scroll", async ({ page }) => {
		await page.goto("/", { waitUntil: "load" });
		const header = page.locator("body > header");
		const before = (await header.boundingBox())!.height;
		await page.evaluate(() => window.scrollTo(0, 800));
		await page.waitForTimeout(500);
		const after = (await header.boundingBox())!.height;
		expect(after).toBe(before);
	});
});

test.describe("scrollbar does not shift content horizontally", () => {
	test("content width is equal on long and short pages", async ({ page }, testInfo) => {
		test.skip(testInfo.project.name === "mobile", "mobile uses overlay scrollbars");
		await page.goto("/", { waitUntil: "load" });
		const longPage = await page.evaluate(() => document.documentElement.clientWidth);
		await page.goto("/this-page-does-not-exist/", { waitUntil: "load" });
		const shortPage = await page.evaluate(() => document.documentElement.clientWidth);
		expect(shortPage).toBe(longPage);
	});
});
