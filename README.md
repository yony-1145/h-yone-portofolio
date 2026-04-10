# h-yone

ポートフォリオサイトのリポジトリになります。
英語（デフォルト）と日本語の 2 言語に対応しています。

## 技術スタック

- [Astro](https://astro.build/) 5（静的出力、`@astrojs/cloudflare`）
- [Tailwind CSS](https://tailwindcss.com/) 4（`@tailwindcss/vite`）
- [Alpine.js](https://alpinejs.dev/)（`@astrojs/alpinejs`）
- お問い合わせ: [Resend](https://resend.com/)（メール送信）、[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)（ボット対策）

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

- デフォルト言語は英語（`en`）。トップは `/`、各ページは `/contact`、`/about-me` など。
- 日本語は `ja`。`/ja/`、`/ja/contact/` のように先頭にロケールが付きます。
- 文言は `src/i18n/index.ts` の辞書で管理しています。

サイト名・連絡先メール・SNS などの定数は `src/data/config.ts` を編集してください。

## デプロイ（Cloudflare）

共通: 先に `pnpm run build` で `dist/` を生成する。`package.json` の `engines` に合う Node（例: 20 または 22）を使う。

### Workers（`wrangler deploy` / Workers Builds）

[`wrangler.toml`](./wrangler.toml) で **Worker の入口**（`main`）と **静的アセット**（`[assets]`）を分ける。`dist` 内の `_worker.js` はサーバー用のため、[`.assetsignore`](./public/.assetsignore)（ビルドで `dist/.assetsignore` にコピーされる）に `_worker.js` と `_routes.json` を書き、**アセットとしてはアップロードしない**。

| 手順 | コマンド / 設定 |
| --- | --- |
| ビルド | `pnpm run build` |
| デプロイ | `npx wrangler deploy`（ルートの `wrangler.toml` を使う） |

`npx wrangler deploy --assets=./dist` **だけ**だと `main` がなく、`_worker.js` を公開アセットとして載せようとして失敗する。`--assets` は省略し、設定は `wrangler.toml` に任せる。

環境変数・シークレットは **Workers** の設定（ダッシュボードまたは `wrangler secret`）に置く。Resend・Turnstile の許可ドメインはデプロイ先 URL に合わせる。

**KV / `SESSION`:** このサイトは `Astro.session` を使っていないため、[`astro.config.mjs`](./astro.config.mjs) で `session.driver: "memory"` とし、Wrangler の `SESSION` KV を要求しないようにしている。後から [Astro Sessions](https://docs.astro.build/en/guides/sessions/) と Cloudflare KV を使う場合は `session` 設定をやめ、`wrangler.toml` に `[[kv_namespaces]]`（既存名前空間なら必ず `id` を指定。未指定の自動作成は同名で [10014](https://developers.cloudflare.com/kv/concepts/kv-namespaces/) になり得る）を追加する。

### Pages（Git 連携のみ）

ダッシュボードで **Pages** プロジェクトを作り、リポジトリを接続する。

| 設定 | 値 |
| --- | --- |
| ルートディレクトリ | `/` |
| ビルドコマンド | `pnpm run build` |
| ビルド出力ディレクトリ | `dist` |
| デプロイコマンド | 空にする（push でビルド・デプロイ） |

`wrangler.toml` は Pages でもバインディング解釈などに使われることがある。**Pages では `wrangler deploy` は使わない。** 手元から載せる場合は `pnpm exec wrangler pages deploy dist --project-name=h-yone`。

詳細は [Astro × Cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) と [Pages のビルド設定](https://developers.cloudflare.com/pages/configuration/build-configuration/)を参照。
