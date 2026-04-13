import { v as decodeKey } from './chunks/astro/server_CDzbN8Rr.mjs';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_BxT5Iz9F.mjs';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/ynmthrm/Projects/h-yone/","cacheDir":"file:///Users/ynmthrm/Projects/h-yone/node_modules/.astro/","outDir":"file:///Users/ynmthrm/Projects/h-yone/dist/","srcDir":"file:///Users/ynmthrm/Projects/h-yone/src/","publicDir":"file:///Users/ynmthrm/Projects/h-yone/public/","buildClientDir":"file:///Users/ynmthrm/Projects/h-yone/dist/client/","buildServerDir":"file:///Users/ynmthrm/Projects/h-yone/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"always"}}},{"file":"404.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/404","isIndex":false,"type":"page","pattern":"^\\/404\\/$","segments":[[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/404.astro","pathname":"/404","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"always"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/portfolio/_astro/page.CQhogMj7.js"}],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image/","pattern":"^\\/_image\\/$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/.pnpm/astro@5.18.1_@types+node@25.0.3_@vercel+functions@3.4.3_jiti@2.6.1_lightningcss@1.32.0_rollup@4.60.1_typescript@5.9.3/node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image/","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"always"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/portfolio/_astro/page.CQhogMj7.js"}],"styles":[],"routeData":{"route":"/api/contact","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/contact\\/$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"contact","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/contact.ts","pathname":"/api/contact","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"always"}}}],"site":"https://h-yone.com","base":"/portfolio/","trailingSlash":"always","compressHTML":true,"componentMetadata":[["/Users/ynmthrm/Projects/h-yone/src/pages/404.astro",{"propagation":"none","containsHead":true}],["/Users/ynmthrm/Projects/h-yone/src/pages/[...locale]/about-me.astro",{"propagation":"none","containsHead":true}],["/Users/ynmthrm/Projects/h-yone/src/pages/[...locale]/contact.astro",{"propagation":"none","containsHead":true}],["/Users/ynmthrm/Projects/h-yone/src/pages/[...locale]/index.astro",{"propagation":"none","containsHead":true}],["/Users/ynmthrm/Projects/h-yone/src/pages/[...locale]/privacy-policy.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:node_modules/.pnpm/astro@5.18.1_@types+node@25.0.3_@vercel+functions@3.4.3_jiti@2.6.1_lightningcss@1.32.0_rollup@4.60.1_typescript@5.9.3/node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image/index.astro.mjs","\u0000@astro-page:src/pages/404@_@astro":"pages/404.astro.mjs","\u0000@astro-page:src/pages/api/contact@_@ts":"pages/api/contact.astro.mjs","\u0000@astro-page:src/pages/[...locale]/about-me@_@astro":"pages/_---locale_/about-me.astro.mjs","\u0000@astro-page:src/pages/[...locale]/contact@_@astro":"pages/_---locale_/contact.astro.mjs","\u0000@astro-page:src/pages/[...locale]/privacy-policy@_@astro":"pages/_---locale_/privacy-policy.astro.mjs","\u0000@astro-page:src/pages/[...locale]/index@_@astro":"pages/_---locale_.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_CiV911b6.mjs","/Users/ynmthrm/Projects/h-yone/node_modules/.pnpm/astro@5.18.1_@types+node@25.0.3_@vercel+functions@3.4.3_jiti@2.6.1_lightningcss@1.32.0_rollup@4.60.1_typescript@5.9.3/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_sp1TGZeH.mjs","/Users/ynmthrm/Projects/h-yone/node_modules/.pnpm/astro@5.18.1_@types+node@25.0.3_@vercel+functions@3.4.3_jiti@2.6.1_lightningcss@1.32.0_rollup@4.60.1_typescript@5.9.3/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts":"_astro/ClientRouter.astro_astro_type_script_index_0_lang.CDGfc0hd.js","astro:scripts/page.js":"_astro/page.CQhogMj7.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/portfolio/_astro/coworker.ClKM3G4_.png","/portfolio/_astro/hakatamingle.DqtguB4q.png","/portfolio/_astro/profile-placeholder.CquVS09I.png","/portfolio/_astro/about-me.wb49reOg.css","/portfolio/_headers","/portfolio/favicon.svg","/portfolio/humans.txt","/portfolio/_astro/ClientRouter.astro_astro_type_script_index_0_lang.CDGfc0hd.js","/portfolio/_astro/page.CQhogMj7.js","/portfolio/images/og-image.jpg","/portfolio/fonts/inter/inter-v18-latin-300.woff2","/portfolio/fonts/inter/inter-v18-latin-300italic.woff2","/portfolio/fonts/inter/inter-v18-latin-500.woff2","/portfolio/fonts/inter/inter-v18-latin-500italic.woff2","/portfolio/fonts/inter/inter-v18-latin-600.woff2","/portfolio/fonts/inter/inter-v18-latin-600italic.woff2","/portfolio/fonts/inter/inter-v18-latin-700.woff2","/portfolio/fonts/inter/inter-v18-latin-700italic.woff2","/portfolio/fonts/inter/inter-v18-latin-900.woff2","/portfolio/fonts/inter/inter-v18-latin-900italic.woff2","/portfolio/fonts/inter/inter-v18-latin-italic.woff2","/portfolio/fonts/inter/inter-v18-latin-regular.woff2","/portfolio/_astro/page.CQhogMj7.js","/portfolio/404.html"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"actionBodySizeLimit":1048576,"serverIslandNameMap":[],"key":"eO1Z4AvKVnJFf7mYbKuVqVuUdgGkz6Z83W6U9/EUSys="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
