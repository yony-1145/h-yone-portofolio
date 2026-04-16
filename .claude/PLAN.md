# Vercel → Cloudflare 移行計画

最終更新: 2026-04-16
対象プロジェクト: `h-yone/portfolio`（Astro 5 / pnpm / Node 20+）
現ホスティング: Vercel（`@astrojs/vercel` adapter）
移行先: Cloudflare（Workers with Static Assets を第一候補、Pages を代替）

---

## 1. 現状分析

### 1.1 アプリ構成
- フレームワーク: Astro 5.7.4（`output: "static"`）
- アダプタ: `@astrojs/vercel@^9`
- 統合: `@astrojs/alpinejs`, `@playform/inline`, `@tailwindcss/vite`
- 画像最適化: `sharp`（ビルド時）
- パッケージマネージャ: pnpm 10.18.2（`ENABLE_EXPERIMENTAL_COREPACK=1` で Vercel ビルド時に有効化）
- サイト: `https://www.h-yone.com`（`trailingSlash: "always"`）

### 1.2 SSR 要素（ここが最重要）
- ほぼ全ページ静的。ただし `src/pages/api/contact.ts` が `export const prerender = false` の SSR API エンドポイント。
- 依存: `resend`（メール送信）、Turnstile（siteverify への `fetch`）。
- クライアント IP 取得: 現在 `x-forwarded-for` / `x-real-ip`（Vercel 想定）。CF では `cf-connecting-ip` が必要。

### 1.3 環境変数（`.env.example` より）
- `RESEND_API_KEY`（secret）
- `RESEND_FROM_EMAIL`
- `TURNSTILE_SITE_KEY`（public）
- `TURNSTILE_SECRET_KEY`（secret）

### 1.4 Vercel 固有資産（棚卸し）
| ファイル / 設定 | 役割 | CF 移行時の扱い |
|---|---|---|
| `vercel.json` | buildCommand, installCommand, COREPACK env | 削除 |
| `.vercel/` | ローカル Vercel CLI 状態 | `.gitignore` に追加済みなら削除のみ |
| `astro.config.mjs` の `adapter: vercel()` | Vercel ランタイム | `@astrojs/cloudflare` へ差し替え |
| `public/_headers` | 以前の CF Pages 用（現在は Vercel 無視） | **復活させる** |
| `@astrojs/vercel`（依存） | Adapter | 削除 |
| API 内 `x-forwarded-for` 取得 | Vercel ヘッダ前提 | `cf-connecting-ip` を先に試す（以前のコメント復元） |
| FormContact コメント「Vercel の自動 308 redirect 回避」 | 末尾スラッシュ POST の理由 | コメントを CF 向けに更新（末尾スラッシュ自体は維持） |

### 1.5 既に CF を意識している痕跡
- `astro.config.mjs`, `public/_headers`, `src/pages/api/contact.ts` にコメント形式で「Legacy: Cloudflare」記述あり → 以前 CF Pages で運用していた形跡。
- git 履歴: `a1fb061 chore: align Cloudflare deploy with Astro best practices`, `83d5603 fix(deploy): avoid SESSION KV auto-provision (error 10014)`, `8c3cde7 fix: use vercel adapter` → CF → Vercel 移行済み。今回は逆向き。
- Turnstile（CF 製）利用中 → サイトキー／シークレットの再作成は不要（そのまま流用可能）。

---

## 2. 移行先オプションの比較

| 観点 | A. Cloudflare Workers + Static Assets（推奨） | B. Cloudflare Pages | C. Pages + Functions（旧来） |
|---|---|---|---|
| CF の推奨状況 | 2024 以降の推奨経路。新機能は Workers 側に集中 | 安定運用中だが積極開発は Workers へ | レガシー扱い |
| 静的＋SSR 混在 | `assets` binding + Worker スクリプトで一体化 | `_worker.js` または Pages Functions | Pages Functions |
| 設定ファイル | `wrangler.jsonc`（単一） | Pages は UI 中心、必要に応じ `_headers` / `_redirects` | 同上 |
| デプロイ経路 | `wrangler deploy` or GitHub Action | Git 連携 push で自動 | 同上 |
| Astro サポート | `@astrojs/cloudflare` の `mode: "directory"` 不要。Workers がデフォルト | 同 adapter で対応 | 同 adapter |
| ローカル検証 | `wrangler dev` / `astro dev` | `wrangler pages dev` | 同上 |
| 将来性 | 高（Durable Objects, Queues 等とシームレス） | 中 | 低 |
| 移行コスト | 中（`wrangler.jsonc` 新規作成） | 小（UI で設定） | 小 |

**結論: A（Workers + Static Assets）を推奨。** 理由:
1. CF 公式が新規案件で Workers Assets を推している。
2. 設定が `wrangler.jsonc` に集約されコードレビュー可能。
3. 将来 KV/R2/D1 を使う場合でも同じ Worker に bindings を追記するだけ。
4. Astro の最新アダプタが Workers をネイティブにサポート。

B（Pages）を選ぶ場合も本計画の大半は再利用可能（§7 に差分）。

---

## 3. アーキテクチャ（推奨案 A）

```
┌────────────────────────────────────────────────┐
│  Cloudflare (Zone: h-yone.com)                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Worker: h-yone-portfolio                 │   │
│  │  ├─ Static Assets (dist/client/*)         │   │
│  │  │   ※ ほぼ全ページ SSG の HTML/CSS/JS    │   │
│  │  └─ Fetch handler                         │   │
│  │      └─ /api/contact  (SSR, Resend 呼出)  │   │
│  │  Secrets: RESEND_API_KEY,                 │   │
│  │           TURNSTILE_SECRET_KEY,           │   │
│  │           RESEND_FROM_EMAIL               │   │
│  │  Vars:    TURNSTILE_SITE_KEY（public可）  │   │
│  └──────────────────────────────────────────┘   │
│  DNS: www.h-yone.com → Worker ルート             │
└────────────────────────────────────────────────┘
```

- 画像最適化は `imageService: "compile"` にしてビルド時に `sharp` で完結（Workers ランタイムに `sharp` なし）。
- `astro:session` は未使用のため KV バインディング不要（過去の `10014` エラーはここで回避）。

---

## 4. ステップバイステップ実装手順

### Phase 0: 事前準備（本番影響なし）
1. Cloudflare アカウントで `h-yone.com` ゾーンが既に管理下か確認。未管理ならドメインを CF へ委任（DNS 移管 or ネームサーバ変更）。切替までは Vercel 側 A/CNAME を維持。
2. Wrangler CLI 導入: `pnpm add -D wrangler@latest`（リポジトリ内で固定）+ `wrangler login`。
3. Turnstile のサイトキー／シークレットは既存を流用（ドメイン変更なし）。
4. Resend の送信ドメイン（`contact@h-yone.com`）は DNS 移管時の SPF/DKIM レコード持込みを確認。

### Phase 1: コード変更（PR 化推奨）
以下の diff を一つの PR にまとめる。

#### 1.1 依存の入替え
```jsonc
// package.json
{
  "dependencies": {
    // 追加
    "@astrojs/cloudflare": "^12.x",
    // 削除
    // "@astrojs/vercel": "^9.0.5"
  },
  "devDependencies": {
    "wrangler": "^4.x",
    "sharp": "^0.34.5"
  },
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "sharp"]
  }
}
```
コマンド: `pnpm remove @astrojs/vercel && pnpm add @astrojs/cloudflare && pnpm add -D wrangler`

#### 1.2 `astro.config.mjs`
```js
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import alpinejs from "@astrojs/alpinejs";
import playformInline from "@playform/inline";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://www.h-yone.com",
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
    imageService: "compile", // sharp はビルド時のみ
    platformProxy: { enabled: true }, // astro dev で wrangler 環境を注入
  }),
  output: "static",
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
```
- `output: "static"` のまま。`prerender = false` の `/api/contact` のみオンデマンド関数化される。
- `platformProxy` で `astro dev` からも `env`（secrets 含む）にアクセス可能。

#### 1.3 `wrangler.jsonc`（新規作成 / プロジェクトルート）
```jsonc
{
  "$schema": "https://raw.githubusercontent.com/cloudflare/workerd/main/npm/wrangler/config-schema.json",
  "name": "h-yone-portfolio",
  "main": "./dist/_worker.js/index.js",
  "compatibility_date": "2025-11-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application" // 404 は Astro のカスタム 404 に委譲
  },
  "observability": { "enabled": true },
  "vars": {
    // 公開しても構わない値のみここへ
    "TURNSTILE_SITE_KEY": "0xAAAA..."
  }
  // secrets は wrangler secret put で投入（RESEND_*, TURNSTILE_SECRET_KEY）
}
```
注: `not_found_handling` は挙動要検証。`single-page-application` で `/api/*` 以外の未知パスを index.html に戻す動きが Astro の 404 と干渉する場合は `"none"` にして Astro 出力の `404.html` を使う。

#### 1.4 `src/pages/api/contact.ts`
`getClientIp` を CF 優先に戻す:
```ts
function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "";
}
```
- `import.meta.env.*` は `@astrojs/cloudflare` の platformProxy 経由で Workers の `env` にマッピングされる。コード本体は変更不要（`Resend` は fetch ベースで Workers 互換）。

#### 1.5 `src/components/forms/FormContact.astro`
コメント文言のみ更新:
```astro
// trailingSlash: "always" に合わせて末尾スラッシュ付きで POST する
// （Astro の 301 redirect と CF キャッシュ衝突を避けるため明示）
const contactApiUrl = `${import.meta.env.BASE_URL}api/contact/`;
```

#### 1.6 `public/_headers`
先頭の Legacy コメントを削除し、CSP を現状のスクリプト実体に合わせて見直す（Alpine.js が `'unsafe-eval'` を要するので保持、Turnstile 関連は既に入っている）。

#### 1.7 `vercel.json` 削除
`git rm vercel.json`

#### 1.8 `.gitignore` に追記
```
.wrangler/
.dev.vars
```

#### 1.9 `.dev.vars`（ローカル開発用、コミットしない）
```
RESEND_API_KEY=...
RESEND_FROM_EMAIL="h-yone <contact@h-yone.com>"
TURNSTILE_SECRET_KEY=...
```
`TURNSTILE_SITE_KEY` は public なので `wrangler.jsonc` の `vars` に入れるか `.env` のままでよい（Astro の `import.meta.env` は Vite が `.env` からも拾う）。

### Phase 2: ローカル検証
1. `pnpm install`
2. `pnpm run build` → `dist/` 生成確認（`dist/_worker.js/index.js` ＋ 静的アセット）
3. `npx wrangler dev` で Worker 起動、`http://localhost:8787/` を開き以下を確認:
   - トップ、`/ja/`, `/en/` ルーティング
   - `/contact/` で Turnstile ウィジェット描画
   - `/api/contact/` に実際に POST（Turnstile token 必要 → 手動検証 or `wrangler dev --local-env staging` でステージング用キーに差し替え）
   - 画像が 200 で配信
   - 404 ページが意図通り

### Phase 3: ステージング/プレビュー環境
1. 本番とは別の Worker 名（例: `h-yone-portfolio-staging`）で `wrangler deploy --name h-yone-portfolio-staging` を実行。
2. `*.workers.dev` のプレビュー URL（もしくは `staging.h-yone.com` を新設）で疎通確認。Turnstile のサイトキーを「Preview」用に別発行するのが望ましい。
3. 問い合わせフォームで 1 件テスト送信し、Resend 管理画面で配送成功を確認。

### Phase 4: シークレット投入（本番 Worker）
```
wrangler secret put RESEND_API_KEY
wrangler secret put RESEND_FROM_EMAIL
wrangler secret put TURNSTILE_SECRET_KEY
```
- `TURNSTILE_SITE_KEY` は `wrangler.jsonc` の `vars` で管理、もしくは secret にしても可。

### Phase 5: 本番デプロイ
1. `pnpm run build && npx wrangler deploy`
2. `*.workers.dev` で最終疎通（DNS 切替前）。
3. Cloudflare ダッシュボードで `www.h-yone.com` の Workers Route を設定:
   - Route: `www.h-yone.com/*` → Worker `h-yone-portfolio`
   - `h-yone.com/*` → 301 リダイレクトで `www` に寄せる（既存仕様を踏襲）
4. DNS 切替:
   - `www` の CNAME を Vercel → CF 管理下に変更（CF 管理ゾーンなら自動で Worker Route が優先される）
   - TTL を事前に短く（300s）しておく

### Phase 6: Vercel 側の後始末
- Vercel プロジェクトを "pause" にして 48-72h 様子見（即削除しない）。
- 問題なければプロジェクト削除、`.vercel/` ローカルディレクトリも除去。
- GitHub の Vercel integration を解除。

### Phase 7: CI/CD（任意だが推奨）
`.github/workflows/deploy.yml` を新設:
```yaml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.18.2 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```
GitHub Secrets: `CLOUDFLARE_API_TOKEN`（"Edit Workers" スコープ）, `CLOUDFLARE_ACCOUNT_ID`。

---

## 5. 変更ファイル一覧（サマリ）

| 種別 | パス | 内容 |
|---|---|---|
| M | `package.json` | adapter 入替、wrangler 追加 |
| M | `pnpm-lock.yaml` | 依存更新 |
| M | `astro.config.mjs` | adapter を cloudflare に |
| M | `src/pages/api/contact.ts` | `cf-connecting-ip` 優先 |
| M | `src/components/forms/FormContact.astro` | コメント修正 |
| M | `public/_headers` | Legacy コメント削除、内容は維持 |
| M | `.gitignore` | `.wrangler/`, `.dev.vars` 追加 |
| D | `vercel.json` | 削除 |
| A | `wrangler.jsonc` | Workers 設定 |
| A | `.dev.vars.example` | ローカル用の例 |
| A | `.github/workflows/deploy.yml` | CI（任意） |

---

## 6. 環境変数マッピング

| 変数 | Vercel 現在 | Cloudflare 配置 | 備考 |
|---|---|---|---|
| `RESEND_API_KEY` | Project env (Encrypted) | `wrangler secret put` | 再発行不要 |
| `RESEND_FROM_EMAIL` | Project env | secret もしくは vars | 値に機密性は薄いが secret 推奨 |
| `TURNSTILE_SITE_KEY` | Project env (Plain) | `wrangler.jsonc` vars | public |
| `TURNSTILE_SECRET_KEY` | Project env (Encrypted) | `wrangler secret put` | — |
| `ENABLE_EXPERIMENTAL_COREPACK` | Vercel build env | 不要 | ローカル pnpm で完結 |

---

## 7. Pages を選ぶ場合の差分（オプション B）

1. `wrangler.jsonc` 不要、代わりに Pages プロジェクトを GitHub 連携で作成。
2. Build settings:
   - Build command: `pnpm run build`
   - Build output directory: `dist`
   - Root directory: リポジトリルート
   - Environment vars: Pages ダッシュボードで設定（Production / Preview 別）
3. `_worker.js` / Pages Functions は Astro adapter が自動生成（`mode` 指定不要、adapter 側が検知）。
4. `public/_headers` と `public/_redirects` がそのまま有効。
5. Git push で自動デプロイ。
6. Preview 環境は PR 毎に自動生成されるため、§3 Phase 3 が簡略化。
7. 欠点: Cron / Queues / Durable Objects を使いたい時は結局 Worker 移行が要る。

---

## 8. 検証チェックリスト

- [ ] 全ロケール（`/`, `/ja/`, `/en/`）が 200
- [ ] `trailingSlash: "always"` が壊れていない（`/about-me` → 301 → `/about-me/`）
- [ ] 画像 `<img>` の URL が 200、`Cache-Control` が妥当
- [ ] `_headers` のセキュリティヘッダが全レスポンスに適用
- [ ] `POST /api/contact/` で:
  - [ ] バリデーションエラー時 400 + JSON
  - [ ] Turnstile 失敗時 400
  - [ ] 正常時 Resend に admin + auto-reply の 2 通送信
  - [ ] タイムアウト分岐が 500 に落ちる
- [ ] クライアント IP が Resend/ログで `cf-connecting-ip` 由来
- [ ] `404.astro` が表示される（SPA fallback と競合しない）
- [ ] Lighthouse: パフォーマンス回帰なし（Vercel 時点比較）
- [ ] DNS 切替後、`dig www.h-yone.com` が CF を向く

---

## 9. リスクと緩和策

| リスク | 影響 | 緩和策 |
|---|---|---|
| DNS 切替で一時的な断 | 数十秒〜数分 | TTL を事前短縮、深夜帯に切替 |
| CF の CSP と Turnstile 衝突 | フォーム壊れる | プレビューで確認、`challenges.cloudflare.com` を `script-src`/`frame-src` に維持（既に設定済み） |
| Resend が Workers ランタイムで挙動差 | メール送信失敗 | Resend SDK は fetch ベース、Workers 互換。ステージングで実送信検証 |
| `not_found_handling: "single-page-application"` が Astro 静的 404 を塗り潰す | 404 が index に | `"none"` に切替 or Worker 側で分岐 |
| Sharp が CF ランタイムで暴発 | ビルド成功・実行失敗 | `imageService: "compile"` を adapter に必ず指定 |
| pnpm の lockfile と CI の version 乖離 | ビルド非再現 | GitHub Actions で `pnpm/action-setup@v4` にバージョン明示 |
| 過去の `SESSION KV auto-provision` 再発 | デプロイ失敗（10014） | Astro 5 では `session` 未指定で問題なし。発生したら adapter オプションに `mode: "directory"` と `session: { driver: "memory" }` を検討 |

---

## 10. ロールバック計画

1. Vercel プロジェクトを Phase 6 で即削除しない（48-72h 保持）。
2. DNS を元のレコードに戻せるよう、切替前のゾーンファイルをエクスポート。
3. コード側は PR を revert すれば `@astrojs/vercel` + `vercel.json` が復活する構造で PR を構成する。
4. 問題発生時の判断軸:
   - フォーム単独の不具合 → Worker のログ（`wrangler tail`）で切り分け、コードのホットフィックス
   - 広範な 5xx → DNS を Vercel に戻す（10 分以内）

---

## 11. 未決事項（ユーザー確認が必要）

1. 第一候補は **Workers + Static Assets**（§3）でよいか。もし Git 連携の体験を優先したいなら Pages（§7）に切替可。
2. ドメイン `h-yone.com` 自体のネームサーバは既に Cloudflare を指しているか（今回の作業範囲に DNS 移管が含まれるか）。
3. GitHub Actions で自動デプロイまで入れるか、手動 `wrangler deploy` 運用に留めるか。
4. Turnstile の本番用キーを切替ドメインで流用するか、Preview 用に新規発行するか。

以上の確認が取れ次第、Phase 1 から実装に着手する。
