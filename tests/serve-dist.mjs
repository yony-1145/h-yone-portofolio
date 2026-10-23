// Minimal static file server for Playwright tests.
// `astro preview` with the Cloudflare adapter requires workerd, so we serve the
// prerendered `dist/` output directly instead. No external dependencies.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const port = Number(process.env.PORT ?? 4321);

const types = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".webp": "image/webp",
	".avif": "image/avif",
	".woff2": "font/woff2",
	".txt": "text/plain; charset=utf-8",
};

async function resolveFile(pathname) {
	const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
	let file = join(root, safe);
	try {
		if ((await stat(file)).isDirectory()) file = join(file, "index.html");
		await stat(file);
		return { file, status: 200 };
	} catch {
		return { file: join(root, "404.html"), status: 404 };
	}
}

createServer(async (req, res) => {
	const { pathname } = new URL(req.url ?? "/", "http://localhost");
	const { file, status } = await resolveFile(pathname);
	try {
		const body = await readFile(file);
		res.writeHead(status, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
		res.end(body);
	} catch {
		res.writeHead(500).end();
	}
}).listen(port, () => console.log(`Serving dist/ on http://localhost:${port}`));
