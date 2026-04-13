# Cloudflare → Vercel 移行 実装計画

## Context

現状は Astro 5 + `@astrojs/cloudflare` アダプタで Cloudflare Workers にデプロイしており、`h-yone.com/portfolio/*` のサブパスで配信されている。デプロイ先を Vercel に切り替えるが、以下の方針で行う:

- **URL 構造は維持**: `h-yone.com/portfolio/` のサブパス運用を継続（`base: "/portfolio"`、`trailingSlash: "always"` を維持）。SEO/外部リンク影響ゼロ。
- **Turnstile を維持**: Cloudflare のボット対策 API は Vercel 上からでも動作するため継続利用。ただし変更点が分かるようコメントで明記。
- **CF 関連コードを残す**: `@astrojs/cloudflare`・`wrangler` は `package.json` に残したまま、コードはコメントアウトで残し、即ロールバック可能にする。

本計画を適用すると、Vercel で動作する Astro プロジェクトに切り替わり、Cloudflare 用コードはコメントとして保存される。

---

## 前提の確認

- `output: "static"` は Vercel でも適切。`prerender = false` の `src/pages/api/contact.ts` のみが Vercel Serverless Function として自動変換される。
- `base: "/portfolio"` を維持すれば、ビルド生成物は `/portfolio/about-me/` 等のパスを持つ HTML になり、Vercel はそれをそのまま配信する。ルートへの追加リライトは不要。
- `cf-connecting-ip` は Vercel では存在しないが、現状のコードは既に `x-forwarded-for` フォールバックがあるため、実用上は動く。ただし移行を明示するためコメントアウトする。

---

## 変更内容

### 1. `astro.config.mjs` — アダプタ差し替え

**内容**:

- `import cloudflare from "@astrojs/cloudflare"` をコメントアウト
- `import vercel from "@astrojs/vercel"` を追加
- `adapter: cloudflare({ imageService: "compile" })` をブロックコメントアウト
- `adapter: vercel()` を追加（引数なしの最小構成。Image Optimization は有効化せず、Astro の Sharp をそのまま使う）
- `session: { driver: "memory" }` ブロックは Cloudflare 特有の回避策だったため、コメントアウト（Vercel は自動的に KV を要求しない）
- `base`, `trailingSlash`, `site`, `output: "static"` は変更なし

**コメント例**:
```js
// [Cloudflare 用] import cloudflare from "@astrojs/cloudflare";
import vercel from "@astrojs/vercel";
```

### 2. `package.json` — `@astrojs/vercel` を追加

- `dependencies` に `@astrojs/vercel`（最新安定版、Astro 5 対応）を追加
- `@astrojs/cloudflare`・`wrangler` は残す
- scripts は変更なし

実行:
```bash
pnpm add @astrojs/vercel
```

### 3. `vercel.json` — 新規作成

Cloudflare の `public/_headers` に相当するセキュリティヘッダと、ルート `/` → `/portfolio/` へのリダイレクトを定義する。

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "redirects": [
    { "source": "/", "destination": "/portfolio/", "permanent": true }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" }
      ]
    }
  ]
}
```

CSP は Turnstile を維持するため `https://challenges.cloudflare.com` を許可したまま（変更なし）。

### 4. `public/_headers` — コメントで CF 専用を明記

Vercel は `public/_headers` を参照しないため、このファイルは無視されるが、削除せず冒頭にコメントを追加して「Cloudflare Pages 用の旧ファイル。現在は `vercel.json` が有効」と記す。

### 5. `public/.assetsignore` — そのまま保持

Vercel は無視するため実害なし。削除せず、ロールバック用に残す。

### 6. `wrangler.toml` — そのまま保持

Vercel は無視する。ファイル冒頭に `# [Legacy] Cloudflare Workers 用。現在は Vercel デプロイ。ロールバック時に参照。` を追記。

### 7. `src/pages/api/contact.ts` — IP ヘッダ取得ロジック

`getClientIp()` 関数内で、`cf-connecting-ip` を参照している箇所をコメントアウトし、変更点を明示する。`x-forwarded-for` フォールバックは元々実装済みなので、Vercel では自動的にこちらが使われる。

**修正イメージ** (L22-30):
```ts
function getClientIp(request: Request): string {
  // [Cloudflare 用] cf-connecting-ip は Cloudflare Workers 限定のヘッダ
  // const cfIp = request.headers.get("cf-connecting-ip");
  // if (cfIp) return cfIp;

  // Vercel では x-forwarded-for（カンマ区切りの先頭が client IP）または x-real-ip
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  return realIp ?? "";
}
```

Turnstile 検証呼び出し（L83-106）はそのまま。API は `https://challenges.cloudflare.com/turnstile/v0/siteverify` を Vercel からも呼べるため無変更。

### 8. `README.md` — デプロイ手順の更新

- Tech Stack セクション: `@astrojs/cloudflare` の記載を `@astrojs/vercel` に置換（Turnstile の記載は残す）
- Deployment セクション（L59-95）: 既存の Cloudflare 手順の上に Vercel 手順を追記し、Cloudflare 手順は `<details>` で畳むか、見出しを「Legacy: Cloudflare deploy」に変更してロールバック参照用として残す
- 環境変数設定は「Vercel ダッシュボード → Project → Settings → Environment Variables」で `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY` を登録する旨を記載

### 9. 環境変数 (.env / Vercel ダッシュボード)

変数名は変わらない:
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TURNSTILE_SECRET_KEY`
- `TURNSTILE_SITE_KEY`（`PUBLIC_` prefix ではなく Astro がクライアントに露出する仕組み。`FormContact.astro` での参照方法は変更なし）

Vercel ダッシュボードに上記を登録するだけ。コード変更なし。

---

## 変更対象ファイル一覧

| ファイル | 種別 | 概要 |
|---|---|---|
| `astro.config.mjs` | 編集 | adapter 差し替え、CF 行をコメントアウト |
| `package.json` | 編集 | `@astrojs/vercel` を追加（CF/wrangler は残す） |
| `vercel.json` | 新規 | redirects + security headers |
| `src/pages/api/contact.ts` | 編集 | `cf-connecting-ip` をコメントアウトし x-forwarded-for/x-real-ip に |
| `public/_headers` | 編集 | 冒頭に「CF 用レガシー」コメント追加 |
| `wrangler.toml` | 編集 | 冒頭に「Legacy」コメント追加 |
| `public/.assetsignore` | 変更なし | 残置（CF 用） |
| `README.md` | 編集 | デプロイ手順を Vercel に更新、CF 手順は Legacy 節として残す |

---

## Verification（動作確認手順）

1. **依存追加**
   ```bash
   pnpm add @astrojs/vercel
   ```

2. **ビルド検証**
   ```bash
   pnpm build
   ```
   - エラーなくビルドが完了すること
   - `.vercel/output/` ディレクトリが生成され、`.vercel/output/static/portfolio/about-me/index.html` 等が存在すること
   - `.vercel/output/functions/` に contact API のサーバーレス関数が出力されること

3. **ローカル Preview**
   ```bash
   pnpm preview
   ```
   - `http://localhost:4321/portfolio/` で Home が表示される
   - `/portfolio/about-me/`, `/portfolio/ja/about-me/`, `/portfolio/contact/`, `/portfolio/ja/contact/` が 404 にならないこと
   - ヘッダー・フッターのリンク、言語切り替え、Fragment `/portfolio/#projects` が正常動作
   - 主要ページの `<title>` が前コミットと一致

4. **Contact API ローカル動作**（任意、`vercel dev` があればより正確）
   ```bash
   pnpm dlx vercel dev
   ```
   - フォーム送信 → Turnstile 検証 → Resend 送信 成功
   - `RESEND_API_KEY` 等を `.env` に設定してテスト

5. **Vercel Preview デプロイ**
   - Git ブランチを push し、Vercel ダッシュボードの Preview Deployment を確認
   - 環境変数を全て登録済みか確認
   - Preview URL で全ページ・フォーム送信を手動検証
   - `curl -I https://<preview>.vercel.app/portfolio/` でセキュリティヘッダが反映されているか確認（CSP / HSTS / X-Frame-Options）

6. **ドメイン切替**（本番）
   - h-yone.com の DNS を Vercel に向ける
   - Cloudflare 側の Workers ルート `h-yone.com/portfolio*` を無効化
   - 切替後、`/portfolio/` ルートに 301 が付いていることを確認（vercel.json redirects）
   - 各ページで改めて 200 応答と Turnstile 動作を確認

---

## ロールバック手順（参考）

1. `astro.config.mjs` のコメントアウトを解除し、Vercel adapter の行をコメントアウト
2. Vercel 側のデプロイを一時停止
3. `pnpm build && wrangler deploy` で Cloudflare Workers に再デプロイ
4. DNS を Cloudflare に戻す

CF 用コードを全てコメントで残しているため、1 ファイルあたり数行の切替で戻せる。
