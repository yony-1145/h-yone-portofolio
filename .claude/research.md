# Dev/Prod 表示差分 調査メモ

日付: 2026-04-15

## 結論（ビルドログ確認後・確度高）

**`@playform/inline` の Beasties が 1 つの共有 CSS ファイルに対して 9 回連続で `pruneSource: true` の剪定を実行しており、後続ページ用の CSS ルールが失われている。** これが dev/prod での表示差の主因。

## ビルドログからの根拠

```
09:21:32.555 Inlined 26.82 kB (58% of original 45.67 kB) of _astro/about-me.BmJPv8Yf.css.
09:21:32.594 Inlined 27.64 kB (60% of original 45.67 kB) of _astro/about-me.BmJPv8Yf.css.
09:21:32.621 Inlined 27.44 kB (60% of original 45.67 kB) of _astro/about-me.BmJPv8Yf.css.
09:21:32.634 Inlined 27.66 kB (60% of original 45.67 kB) of _astro/about-me.BmJPv8Yf.css.
09:21:32.648 Inlined 27.64 kB (60% of original 45.67 kB) of _astro/about-me.BmJPv8Yf.css.
09:21:32.673 Inlined 27.06 kB (59% of original 45.67 kB) of _astro/about-me.BmJPv8Yf.css.
09:21:32.692 Inlined 27.44 kB (60% of original 45.67 kB) of _astro/about-me.BmJPv8Yf.css.
09:21:32.722 Inlined 27.66 kB (60% of original 45.67 kB) of _astro/about-me.BmJPv8Yf.css.
09:21:32.736 Inlined 27.06 kB (59% of original 45.67 kB) of _astro/about-me.BmJPv8Yf.css.
09:21:32.740 _astro/about-me.BmJPv8Yf.css was successfully updated  （×9 回）
09:21:32.743 Successfully inlined a total of 9 HTML files.
```

### 何が起きているか

1. 本プロジェクトの HTML 9 枚（404 / index / about-me / contact / privacy-policy × ja 含む）がすべて **同じ CSS ファイル `_astro/about-me.BmJPv8Yf.css`（45.67 kB）** を参照している（Astro のデフォルトバンドル挙動）。
2. `@playform/inline` は HTML ごとに Beasties を 1 回走らせ、各 HTML に「そのページで必要な selector」にマッチするルールを `<style>` としてインライン化する。
3. Beasties の既定オプションは `pruneSource: true` のため、**インライン化されたルールを共有 CSS ファイルから削除**する。`@playform/inline@0.1.4` の `Target/Variable/Beasties.js` 既定値:
   ```js
   { preload: "media", inlineFonts: true, compress: true, pruneSource: true, reduceInlineStyles: false, external: true }
   ```
4. ログ上、同じ `_astro/about-me.BmJPv8Yf.css` が 9 回連続で「updated」されており、**ページ A のインライン化で剪定された selector が、ページ B で必要でもファイルから消えている**。
   - 例: トップページで使われるグリッド系 (`lg:grid-cols-2`) や画像系 (`max-w-[480px]`、`w-full`、`h-auto`) のうち、トップでインライン化された分はファイルから消える。
   - 別ページ（contact 等）が同じクラスをページ下部（非 critical 扱い）で使っていると、そのページの `<style>` にも共有ファイルにもルールが存在しなくなる。
5. 結果として、prod の一部ページで本来効くはずの Tailwind ユーティリティが効かず、**コンポーネントの配置（grid/flex/幅指定）や画像サイズ**が dev と異なる見た目になる。

### 他の選択肢の切り分け

- **`@utility container` の件**: 既定 container（breakpoint max-width）とカスタム余白指定がマージされて共存しているのは事実だが、これ自体は dev/prod 同一 CSS で差を生まない。Beasties の剪定で `.container` 系の一部メディアクエリが失われた場合は配置ずれに寄与し得る（副次要因）。
- **`<Picture densities={[1]}>` の srcset 重複**: Astro の既知挙動で、`srcset="file.avif, file.avif 1x"` のように同 URL が 2 度並ぶ。表示には致命的ではないが、画像サイズの見た目差の一部に寄与する可能性はある。主因ではない。
- **sharp は正常動作**: ログに `▶ /_astro/*.avif (before: 2149kB, after: 2kB) (+229ms) (1/12)` など 12 枚すべて optimize 済み。画像最適化自体は問題なし。

## 推奨対処

### 1. （即効・推奨）Beasties の `pruneSource` を無効化

`astro.config.mjs`:
```js
playformInline({
  Beasties: {
    pruneSource: false,   // 共有 CSS ファイルからルール削除を止める
    preload: "media",
    inlineFonts: true,
  },
}),
```

これで critical CSS の inline は維持しつつ、共有 `.css` ファイルは原状のまま残るので、どのページでも必要なルールがロードされる。

### 2. （代替）`@playform/inline` をいったん外す

```js
integrations: [alpinejs()],
```

で再ビルドし、表示差が解消するか確認。解消すれば原因確定。必要なら別の critical CSS 戦略（`astro-critters`、手動 inline 等）を検討。

### 3. `@utility container` の扱いを明示化（副次）

`src/styles/global.css:12-15`:
```css
@utility container {
    max-width: none;          /* 既定の breakpoint max-width を打ち消す */
    margin-inline: auto;
    padding-inline: 2rem;
}
```

もしくは `.container` 利用をやめて `mx-auto px-8` を直書き。

### 4. `<Picture>` の `densities={[1]}` を外す（副次）

`densities` を削除するか `widths={[480, 960]}` 方式へ移行すると srcset が単純化し、ブラウザ間の解釈差を減らせる。

## 確認手順

1. `astro.config.mjs` の Beasties 設定を上記に変更してローカルで `pnpm build && pnpm preview`。dev 表示と比較して差異が解消することを確認。
2. 解消したら Vercel にデプロイし本番で再確認。
3. （任意）container / densities の副次対処を追加。

## 環境情報（ログ抽出）

- Node.js: 24.x（`engines` 指定により Project Settings の 22.x が上書き）
- pnpm: 10.18.2（Corepack 経由）
- Astro: 5.18.1 / `@astrojs/vercel`: 9.0.5
- Tailwind: 4.2.2 / `@tailwindcss/typography`: 0.5.19
- `@playform/inline`: 0.1.4
- ビルド成功、image optimization 12 件完了、HTML 9 枚インライン処理完了。
