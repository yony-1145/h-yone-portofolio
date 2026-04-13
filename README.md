# h-yone

ポートフォリオサイトのリポジトリになります。
英語（デフォルト）と日本語の 2 言語に対応しています。

## 技術スタック

- [Astro](https://astro.build/) 5（静的出力、`@astrojs/vercel`）
- [Tailwind CSS](https://tailwindcss.com/) 4（`@tailwindcss/vite`）
- [Alpine.js](https://alpinejs.dev/)（`@astrojs/alpinejs`）
- お問い合わせ: [Resend](https://resend.com/)（メール送信）、[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)（ボット対策。Vercel からも利用）

## 必要な環境

- [Node.js](https://nodejs.org/) LTS（`package.json` の `engines` および [Astro の要件](https://docs.astro.build/en/install-and-setup/)に準拠）
- [pnpm](https://pnpm.io/)（`packageManager` フィールドの版を [Corepack](https://nodejs.org/api/corepack.html) で合わせるのが確実）

## セットアップ

```bash
pnpm install
```

ルートに `.env` を用意します。テンプレートは `.env.example` をコピーして値を埋めてください。

```bash
cp .env.example .env
```

### 環境変数

| 変数                   | 用途                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| `RESEND_API_KEY`       | Resend の API キー（問い合わせメール送信）                       |
| `RESEND_FROM_EMAIL`    | Resend で検証済みの送信元（例: `"h-yone <contact@h-yone.com>"`） |
| `TURNSTILE_SITE_KEY`   | Turnstile のサイトキー（フロントに公開）                         |
| `TURNSTILE_SECRET_KEY` | Turnstile のシークレット（サーバー専用）                         |

お問い合わせ API（`src/pages/api/contact.ts`）とフォームは、上記が揃っている前提で動作します。

## コマンド

| コマンド       | 説明                                                           |
| -------------- | -------------------------------------------------------------- |
| `pnpm dev`     | 開発サーバー（[http://localhost:4321](http://localhost:4321)） |
| `pnpm build`   | 本番用ビルド                                                   |
| `pnpm preview` | ビルド結果のプレビュー                                         |

## ルーティングと多言語

本番ではサイト全体が **`/portfolio` サブパス**（例: `https://h-yone.com/portfolio/`）にあります。

- デフォルト言語は英語（`en`）。トップは `/portfolio/`、各ページは `/portfolio/contact`、`/portfolio/about-me` など。
- 日本語は `ja`。`/portfolio/ja/`、`/portfolio/ja/contact/` のようにロケールが付きます。
- 文言は `src/i18n/index.ts` の辞書で管理しています。

サイト名・連絡先メール・SNS などの定数は `src/data/config.ts` を編集してください。

## デプロイ（Vercel）

[`astro.config.mjs`](./astro.config.mjs) の `base: "/portfolio"` はそのまま維持し、本番 URL は **`https://h-yone.com/portfolio/`** を継続する。Vercel プロジェクトに独自ドメイン `h-yone.com` を設定した上で、ルート `/` は [`vercel.json`](./vercel.json) の `redirects` で `/portfolio/` に 301 している。

### Git 連携でデプロイ

Vercel ダッシュボードで **Add New Project → Import Git Repository** からこのリポジトリを接続する。`@astrojs/vercel` が有効になっているため、以下の設定が自動検出される。

| 設定 | 値 |
| --- | --- |
| Framework Preset | Astro |
| Build Command | `pnpm run build` |
| Output Directory | `.vercel/output`（アダプタが生成） |
| Install Command | `pnpm install` |
| Root Directory | `/` |

手元から直接デプロイする場合は `pnpm dlx vercel deploy` も利用可能。

### 環境変数

Vercel ダッシュボードの **Project → Settings → Environment Variables** に以下を登録する（Production / Preview / Development をそれぞれ設定）。

| 変数                   | 備考 |
| ---------------------- | ---- |
| `RESEND_API_KEY`       | Resend の API キー（サーバー専用） |
| `RESEND_FROM_EMAIL`    | Resend の検証済み送信元 |
| `TURNSTILE_SECRET_KEY` | Turnstile のシークレット（サーバー専用） |
| `TURNSTILE_SITE_KEY`   | Turnstile のサイトキー。ビルド時にクライアントへ埋め込まれる |

### セキュリティヘッダ

[`vercel.json`](./vercel.json) の `headers` で `X-Frame-Options` / CSP / HSTS などをまとめて配信している。Turnstile を使うため CSP の `script-src` / `frame-src` で `https://challenges.cloudflare.com` を許可している。

### Turnstile

[Turnstile ダッシュボード](https://dash.cloudflare.com/?to=/:account/turnstile)のウィジェット **許可ホスト** に `h-yone.com` を追加する。Cloudflare 以外にホストされていても Turnstile 自体は利用可能。デプロイ後、`https://h-yone.com/portfolio/contact/` のお問い合わせフォームで送信まで動作確認する。

詳細は [Astro × Vercel](https://docs.astro.build/en/guides/integrations-guide/vercel/) を参照。

---

<details>
<summary><strong>Legacy: Cloudflare Workers へのデプロイ手順（ロールバック用）</strong></summary>

> 現在は Vercel に移行済み。以下は `@astrojs/cloudflare` に戻した場合の参考手順として残している。ロールバック時は `astro.config.mjs` の Legacy コメントを解除し、Vercel 側の記述をコメントアウトする。

共通: 先に `pnpm run build` で `dist/` を生成する。`package.json` の `engines` に合う Node（例: 20 または 22）を使う。

#### Workers（`wrangler deploy` / Workers Builds）

[`wrangler.toml`](./wrangler.toml) で **Worker の入口**（`main`）と **静的アセット**（`[assets]`）を分ける。`dist` 内の `_worker.js` はサーバー用のため、[`.assetsignore`](./public/.assetsignore)（ビルドで `dist/.assetsignore` にコピーされる）に `_worker.js` と `_routes.json` を書き、**アセットとしてはアップロードしない**。

| 手順 | コマンド / 設定 |
| --- | --- |
| ビルド | `pnpm run build` |
| デプロイ | `npx wrangler deploy`（ルートの `wrangler.toml` を使う） |

`npx wrangler deploy --assets=./dist` **だけ**だと `main` がなく、`_worker.js` を公開アセットとして載せようとして失敗する。`--assets` は省略し、設定は `wrangler.toml` に任せる。

**本番 URL:** [`wrangler.toml`](./wrangler.toml) の `routes` で `h-yone.com/portfolio*` をこの Worker に割り当てる。`www` サブドメインからも同じパスで出す場合は `routes` に `www.h-yone.com/portfolio*` を追加。

環境変数・シークレットは **Workers** の設定（ダッシュボードまたは `wrangler secret`）に置く。`TURNSTILE_SITE_KEY` はビルド時にフロントへ埋め込むため `wrangler.toml` の `[vars]` かダッシュボードの **Variables** で設定する。

**KV / `SESSION`:** 未指定だと `@astrojs/cloudflare` が SESSION KV を自動要求するため、`astro.config.mjs` の `session.driver: "memory"` ブロックを復活させる。

#### Pages（Git 連携のみ）

ダッシュボードで **Pages** プロジェクトを作り、リポジトリを接続する。

| 設定 | 値 |
| --- | --- |
| ルートディレクトリ | `/` |
| ビルドコマンド | `pnpm run build` |
| ビルド出力ディレクトリ | `dist` |
| デプロイコマンド | 空にする（push でビルド・デプロイ） |

`wrangler.toml` は Pages でもバインディング解釈などに使われることがある。**Pages では `wrangler deploy` は使わない。** 手元から載せる場合は `pnpm exec wrangler pages deploy dist --project-name=h-yone`。

詳細は [Astro × Cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) と [Pages のビルド設定](https://developers.cloudflare.com/pages/configuration/build-configuration/)を参照。

</details>
