# Contact Form 送信ハング修正計画

## Context
本番 (www.h-yone.com/portfolio/) の問い合わせフォームで送信ボタン押下後にスピナーが回り続け、メールが届かない。ローカルでは UI は動作しているように見える。原因は複数の疑いがあり、まず**診断用ログを追加して実態を掴み**、判明した根本原因に応じて最小修正を入れる方針。ついでにフォーム側のエラー可視化不足も直す（現状は `unknown_error` にしか出ないので現地で何が起きているか分からない）。

## 調査済み事実
- API route: `src/pages/api/contact.ts` に `export const prerender = false` が設定済み。
- ビルド成果物 `.vercel/output/config.json:40` で `^/api/contact/$` → `_render` に正しくマップされている。
- Astro 5.7.4 + `@astrojs/vercel@9.0.5`、`output: "static"` でも on-demand ルートとして関数化される構成。
- 送信ボタンの submit ハンドラ (`src/components/forms/FormContact.astro:50-105`) は **`console.error` 等を一切出していない**。`.catch` では `errorCode = 'unknown_error'` のみ。
- HEAD には `base: "/portfolio"` があるが、**作業ツリーで未コミットのまま削除されている** (`git diff astro.config.mjs`)。本番で何がデプロイされているかによりフェッチ先パスが変わる可能性がある。
- `vercel.json` には `/` → `/portfolio/` の 308 redirect があり、プロジェクト自体は「ルートに Astro が出力される + ドメイン側の振る舞い」を前提にしている。
- コメント `src/components/forms/FormContact.astro:10` 曰く `BASE_URL + api/contact/` で POST しており、「Vercel の 308 redirect 回避」のために末尾スラッシュを付けている。

## ハング原因の主要仮説
1. **Vercel の環境変数未設定**: `RESEND_API_KEY` / `TURNSTILE_SECRET_KEY` / `RESEND_FROM_EMAIL` / `TURNSTILE_SITE_KEY` のいずれかが Production に設定されていない。
   - `TURNSTILE_SITE_KEY` 未定義ならウィジェット自体がレンダリングされず `turnstileVerified` が false のまま → ボタンが disabled。ただしユーザーは「押下できてスピナー表示」と言っているので本命ではない。
   - サーバ側の `RESEND_*` / `TURNSTILE_SECRET_KEY` 未設定なら 500 が即返ってハングではなくエラー表示になるはず → 単独原因ではない可能性。
2. **`base` / `BASE_URL` の不整合**: HEAD は `base: "/portfolio"` だが working tree では削除済み。最後にデプロイされたビルドがどちらかで挙動が変わる。
   - HEAD 状態 (base あり) で build → BASE_URL=`/portfolio/` → POST 先 `/portfolio/api/contact/`。ただし `config.json` のルートは `/api/contact/` のみ。→ **どの route にもマッチしない → 404 ページの HTML が返るか、ドメイン設定次第で無限 redirect**。
   - 作業ツリー状態 (base なし) で build → BASE_URL=`/` → POST 先 `/api/contact/` → マッチするが、ドメインが `/portfolio/*` しか受け付けない場合は外側で止まる可能性。
3. **Turnstile の siteverify API が Vercel Function からブロック/タイムアウト** していて 300s のファンクションタイムアウトまで返ってこない（ユーザー視点では「いつまでも終わらない」）。
4. **送信ハンドラ側のサイレント失敗**: `fetch` が reject した場合に `console.error` が無いので、そもそも何が起きたか本番で確認できていない（＝実はエラーで 30 秒後に再試行できるが UI に気付いていない可能性も残る）。

## 修正計画

### Step 1: 診断を即入れる（コード変更）
**ファイル**: `src/components/forms/FormContact.astro:50-105`
- `.catch(err => { ... })` 内で `console.error('[contact-form] fetch failed', err)` を追加。
- `.then` の中で 2xx 以外のとき `console.error('[contact-form] bad response', data.status, data.body)` を追加。
- 送信開始時 `console.info('[contact-form] POST', contactApiUrl)` を追加（本番 URL を現地で確認可能にする）。

**ファイル**: `src/pages/api/contact.ts`
- 先頭でハンドラ入ってきた時点で `console.info('[contact-api] invoked')` を 1 行入れる。
- 115-118 行の早期 return の前に、どの env が落ちているかを `console.error('[contact-api] missing env', { resend: !!..., turnstileSecret: !!..., from: !!... })` で 1 度だけ出す（**値は出さない、存在フラグのみ**）。
- Turnstile siteverify を `fetch` している 101-105 行に `AbortController` でタイムアウト（例 5s）を付け、タイムアウト時は 502 を返すようにする（300s ハング対策）。

**検証**: ローカルで `pnpm build && pnpm preview` → Chrome DevTools の Console/Network タブで送信ボタンを押し、ログと実 URL・ステータスを確認。

### Step 2: Vercel 側の診断
1. ユーザーに Vercel Dashboard → Project → Settings → Environment Variables を確認してもらい、Production に以下 4 つが設定されているか確認:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `TURNSTILE_SECRET_KEY`
   - `TURNSTILE_SITE_KEY`
2. 未設定なら追加 → 再デプロイ。
3. Vercel Functions ログ (`_render` function) で Step 1 の `[contact-api]` ログが出ているか確認。出ていなければ関数すら起動していない（ルーティング問題）。
4. 本番で再度送信し、ブラウザ Console と Network パネルから実際のリクエスト URL・ステータス・所要時間を取得。

### Step 3: 根本原因に応じた修正（Step 2 の結果で分岐）
- **env 未設定だった場合**: Vercel 側で追加するだけで終了。コード修正不要。
- **関数が起動していない / 404 / 308 ループだった場合**:
  - `astro.config.mjs` の `base` を HEAD 同様 `"/portfolio"` に戻す（作業ツリーの未コミット削除を revert）。
  - `vercel.json` の `/` → `/portfolio/` redirect が `base` と整合することを確認。
  - 再ビルドして `.vercel/output/config.json` のルートが `/portfolio/api/contact/` になっていることを確認。
  - ドメインが `www.h-yone.com` 直で入る場合の 308 (`/` → `/portfolio/`) が POST を GET に変えないか (permanent=true なので 301 相当、一部ブラウザで method が落ちる可能性) → `permanent: false` または 307/308 明示に変更検討。
- **Turnstile siteverify がハングしていた場合**: Step 1 で入れた AbortController タイムアウトが効いて 502 が返る → UI 上はエラー表示 → 再リトライ可能。恒久対策として Turnstile の代わりにレスポンス到達のログを追加し、Vercel Function ログで再現性を確認。
- **Resend 呼び出しがハングしていた場合**: `resend.emails.send` にも Promise.race + 10s タイムアウトを追加。

### Step 4: フォーム UX の改善（根本原因修正と同時にまとめて）
- エラー時の 30 秒 cooldown (`FormContact.astro:104`) をエラー時は 3 秒に短縮（成功時のみ 30 秒維持）。現状は失敗してもユーザーが 30 秒間再送信できず体験が悪い。
- `errorCode === 'unknown_error'` 時に「時間を置いて再試行してください」明示メッセージを `i18n` に追加（既存の `page.contact.form.error` を流用でも可）。

## 変更ファイル一覧
- `src/components/forms/FormContact.astro` — 送信ハンドラにログ追加 + エラー時 cooldown 短縮
- `src/pages/api/contact.ts` — 呼び出しログ + env 存在チェックログ + Turnstile/Resend のタイムアウト
- `astro.config.mjs` — (Step 3 で必要なら) `base: "/portfolio"` を restore
- `vercel.json` — (Step 3 で必要なら) redirect の `permanent` 見直し

## 検証
1. **ローカル**: `pnpm build && pnpm preview`。Contact ページに移動 → DevTools Console を開いて送信 → `[contact-form] POST /api/contact/`・サーバログ `[contact-api] invoked` が両方出て、レスポンス内容が確認できる。
2. **Preview デプロイ**: `git push` で Vercel Preview を作り、Vercel Functions Logs を開いたまま実機 (スマホ含む) で送信テスト。Turnstile 検証が通り、管理者宛メールと自動返信メールの両方が届くこと。
3. **Production**: Preview で OK を確認後に Production へ promote。送信 → メール到達 → cooldown 30s → 30s 後に再送信可能を確認。
4. **失敗系**: わざと invalid な email 形式で送信 → UI にエラー表示 → 3 秒で再送信可能に戻ることを確認。
