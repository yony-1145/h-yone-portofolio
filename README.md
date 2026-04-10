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

- ビルド: `pnpm build`（成果物は `dist/`。`@astrojs/cloudflare` が Pages Functions 用アセットを同梱します）
- ランタイム設定: ルートの [`wrangler.jsonc`](./wrangler.jsonc)（`SESSION` KV は [Astro Sessions](https://docs.astro.build/en/guides/sessions/) 用。ID なしは [Wrangler の自動プロビジョニング](https://developers.cloudflare.com/workers/wrangler/configuration/#automatic-provisioning)の対象。手動で作る場合は `id` を追記）
- 手順の詳細は [Astro × Cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) と [Pages のビルド設定](https://developers.cloudflare.com/pages/configuration/build-configuration/)を参照
- シークレット（`RESEND_*` / `TURNSTILE_SECRET_KEY` など）は Cloudflare の環境変数に設定し、Resend のドメイン・Turnstile の許可ホストをデプロイ先 URL に合わせる
