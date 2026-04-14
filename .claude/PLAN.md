# PLAN: dev/prod 表示差分の解消

## Context / Problem

- 症状: `https://www.h-yone.com/portfolio/` の本番サイトと `astro dev` の開発環境で、コンポーネント配置と画像サイズに差分がある。
- 根本原因: `@playform/inline@0.1.4`（Beasties 統合）が既定の `pruneSource: true` で動作し、9 枚の HTML が共有する単一 CSS ファイル `dist/client/_astro/about-me.*.css` を 9 回連続で剪定している。
- 影響: 先行ページの critical CSS 抽出時に剪定された Tailwind ユーティリティ（`.container` 系メディアクエリ、`lg:grid-cols-2`、`w-full`、`max-w-[480px]`、`h-auto` 等）が、後続ページで必要でも共有 CSS から失われ、prod の一部ページで配置・画像サイズに崩れが発生する。
- 根拠: Vercel ビルドログに `Inlined ... of _astro/about-me.BmJPv8Yf.css` と `... was successfully updated` が 9 回連続で記録されている。詳細は `.claude/research.md` 参照。

## Goal

- prod と dev の表示を一致させる。
- critical CSS inline による LCP 改善は維持する（Beasties を完全無効化しない）。

## Fix

### 必須: Beasties の `pruneSource` を無効化

ファイル: `portfolio/astro.config.mjs:20-25`

変更前:
```js
integrations: [
    alpinejs(),
    playformInline({
        Beasties: true,
    }),
],
```

変更後:
```js
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
```

理由:
- `pruneSource: false` で共有 CSS からの剪定を止めると、どの HTML からも必要なルールが完全な形でロードされる。
- inline 化自体は残るので critical CSS による初期描画改善は維持。
- `preload: "media"` と `inlineFonts: true` は `@playform/inline@0.1.4` の既定値（`node_modules/@playform/inline/Target/Variable/Beasties.js`）と同じで、明示して意図を固定化する。

### 副次対応（任意・段階実施可）

1. `@utility container` の max-width 打ち消しを明示
   - ファイル: `portfolio/src/styles/global.css:12-15`
   - 現状、Tailwind v4 既定の `.container` がブレークポイント毎の max-width を生成し、カスタム余白指定とマージされて意図しない max-width が残っている。
   - 対処: `max-width: none;` を `@utility container` 内に追記するか、`.container` 利用を廃止して `mx-auto px-8` を直書きする。
   - Beasties 側の修正で症状は解消する見込みだが、混乱を避けるための整理として推奨。

2. `<Picture densities={[1]}>` の srcset 重複を解消
   - ファイル: `portfolio/src/pages/[...locale]/index.astro:40-51, 113-123, 143-153`
   - 現状、srcset に同一 URL が 2 度出力される Astro の既知挙動がある。
   - 対処: `densities={[1]}` を削除するか `widths={[480, 960]}` 形式へ変更。

## Verification

1. ローカルビルド + preview で dev と比較
   ```sh
   cd portfolio
   pnpm build
   pnpm preview
   ```
   別ターミナルで `pnpm dev` を起動し、両方をブラウザで開いて以下を確認:
   - トップの Hero 画像サイズ（480px 基準）が一致するか
   - Projects セクションの 2 カラムグリッドが崩れていないか
   - コンテナ幅（ビューポート 1280px / 1536px 付近）が一致するか
   - `/about-me/`、`/contact/`、`/privacy-policy/` の各ページ配置が一致するか
   - 日本語ロケール（`/ja/...`）も同様に確認

2. ビルドログで挙動を確認
   - `Inlined ... of _astro/about-me.*.css` は引き続き出力されること（inline は維持）。
   - `_astro/about-me.*.css` のファイルサイズが各パスで変化しないこと（`pruneSource: false` 効果）。ビルド完了後に `ls -la dist/client/_astro/*.css` でサイズ確認。
   - `Successfully inlined a total of 9 HTML files.` が引き続き出ること。

3. Vercel デプロイ後に本番 URL で目視確認
   - https://www.h-yone.com/portfolio/
   - https://www.h-yone.com/portfolio/ja/
   - https://www.h-yone.com/portfolio/about-me/
   - https://www.h-yone.com/portfolio/contact/
   - https://www.h-yone.com/portfolio/privacy-policy/

4. ロールバック条件
   - inline 化が 0 件になる / critical CSS が消えてしまう → Beasties 設定を見直す。
   - 差分が残る → `playformInline` 自体を一時的に外して再ビルドし、Beasties 起因かどうかを切り分ける。
   - いずれの場合も最低限の戻し先として `Beasties: true` に戻して再デプロイ可能。

## Files Touched

必須:
- `portfolio/astro.config.mjs`

任意（副次対応時）:
- `portfolio/src/styles/global.css`
- `portfolio/src/pages/[...locale]/index.astro`

## References

- 原因調査: `portfolio/.claude/research.md`
- Beasties 既定値: `node_modules/@playform/inline/Target/Variable/Beasties.js`
- Beasties 本体: https://github.com/danielroe/beasties （`pruneSource` オプションの挙動）
