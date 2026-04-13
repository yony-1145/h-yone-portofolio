import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CEFgu1Wf.mjs';
import { manifest } from './manifest_CiV911b6.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image/index.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/api/contact.astro.mjs');
const _page3 = () => import('./pages/_---locale_/about-me.astro.mjs');
const _page4 = () => import('./pages/_---locale_/contact.astro.mjs');
const _page5 = () => import('./pages/_---locale_/privacy-policy.astro.mjs');
const _page6 = () => import('./pages/_---locale_.astro.mjs');
const pageMap = new Map([
    ["node_modules/.pnpm/astro@5.18.1_@types+node@25.0.3_@vercel+functions@3.4.3_jiti@2.6.1_lightningcss@1.32.0_rollup@4.60.1_typescript@5.9.3/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/api/contact.ts", _page2],
    ["src/pages/[...locale]/about-me.astro", _page3],
    ["src/pages/[...locale]/contact.astro", _page4],
    ["src/pages/[...locale]/privacy-policy.astro", _page5],
    ["src/pages/[...locale]/index.astro", _page6]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "a7bb60a5-36bb-467c-8671-5cac23b5533a",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
