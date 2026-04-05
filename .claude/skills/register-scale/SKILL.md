# /register-scale スキル

## 概要

`papers/` ディレクトリに置いた論文PDFから尺度データを抽出し、アプリへの登録まで自動で行う。

## 呼び出し形式

```
/register-scale papers/<ファイル名>.pdf
```

引数なしで呼んだ場合は `papers/` 内の未登録PDFを一覧表示して選択を促す。

---

## 実行手順

### Step 1: PDFの確認

引数で指定されたPDFファイルを読み込む。

```
Read(papers/<ファイル名>.pdf)
```

ファイルが存在しない場合は `papers/` ディレクトリの内容を一覧表示してユーザーに確認する。

### Step 2: 既存登録の確認

重複登録を防ぐため、現在の登録済み尺度を確認する。

```
Read(lib/scales/index.ts)
```

### Step 3: PDFから尺度情報を抽出

PDFの内容から以下の情報を読み取る。抽出が曖昧な箇所はユーザーに確認する。

**必須情報：**
- 尺度の正式名称・略称
- 全質問文と項目番号
- 逆転項目の一覧
- 選択肢の文言とスコア値（何件法か）
- 下位尺度の構成（どの項目がどの下位尺度に属するか）
- APA形式の引用文献情報（著者・年・タイトル・雑誌・DOI）

**あれば取得する情報：**
- 規準値（M, SD, N, 対象者）— **項目平均ベースか素点合計ベースかを確認**
- 教示文
- クラスタ分析の結果（クラスタ名・判別条件）
- 対象者（大学生・成人一般など）

### Step 4: norm_mean の単位確認

規準値（M/SD）が見つかった場合、**項目平均か素点合計かをPDFの記載から判断**する。

- 素点合計ベースの場合：`norm_mean = M ÷ 項目数`、`norm_sd = SD ÷ 項目数` に変換する
- 判断できない場合：ユーザーに確認してから入力する

### Step 5: IDの決定

`meta.id` を決定する。ルール：
- kebab-case（例: `self-efficacy-general`）
- 既存IDと重複しないこと
- URLとして使われるため、英数字とハイフンのみ

候補をユーザーに提示して確認を取る。

### Step 6: JSONファイルの生成

`lib/scales/<id>.json` を作成する。スキーマは `lib/types.ts` の `Scale` 型に従う。
テンプレートは `docs/scale-registration-guide.md` を参照。

生成したJSONをユーザーに提示して**確認を取ってから**ファイルを書き込む。

### Step 7: レジストリへの登録

`lib/scales/index.ts` を編集してimportと配列への追加を行う。

```typescript
import newScale from "./<id>.json";

const scaleList: Scale[] = [
  // 既存 ...
  newScale as Scale,
];
```

### Step 8: 型チェック

```bash
Bash(cd /home/shun/dev/psych-scales && npx tsc --noEmit)
```

エラーがあれば修正する。

### Step 9: 動作確認の案内

登録完了後、ユーザーに以下を案内する：
1. `npm run dev` でdevサーバーを起動してホーム画面を確認
2. 尺度をクリックして回答・結果画面を確認
3. 問題なければ `git add -A && git commit` でコミット

### Step 10: コミット

ユーザーから問題ないとの確認が取れたら：

```bash
git add lib/scales/<id>.json lib/scales/index.ts
git commit -m "feat: <尺度名>を登録"
```

---

## 注意事項

- 著作権の観点から、論文PDFの内容（質問文など）はリポジトリにそのまま公開しないよう注意する
- 規準値の単位（項目平均 vs 素点合計）は必ず確認する — 間違えると偏差値が狂う
- クラスタ条件は論文に明記された判別基準のみ使用する（独自解釈しない）
- 抽出が不確かな部分は必ずユーザーに確認してから進む
