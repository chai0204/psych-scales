# psych-scales — AI向けガイド

心理尺度の回答・採点・偏差値算出を行うWebアプリ。ブラウザ完結（サーバーへのデータ送信なし）。

## プロジェクト構成

```
psych-scales/
├── papers/          # 論文PDFを置く場所（尺度ごとにサブディレクトリ）
│   └── <尺度id>/   #   例: papers/big-five-s/paper.pdf, items.pdf ...
├── lib/
│   ├── types.ts     # スキーマ型定義（Scale, SubscaleResult など）
│   ├── scoring.ts   # スコアリングエンジン（逆転・偏差値・クラスタ判定）
│   └── scales/
│       ├── index.ts # 尺度レジストリ — 新規登録時はここを編集する
│       └── *.json   # 各尺度データ
├── app/
│   ├── page.tsx              # ホーム（尺度一覧・検索）
│   ├── [scaleId]/page.tsx    # 回答画面
│   └── [scaleId]/result/page.tsx  # 結果画面（偏差値・レーダーチャート・PDF/Md出力）
└── docs/
    └── scale-registration-guide.md  # 尺度登録の詳細ガイド
```

## スキル

| コマンド | 説明 |
|---|---|
| `/register-scale papers/<尺度id>/` | ディレクトリ内の全PDFを読み込んで尺度を登録する |

スキルの詳細は `.claude/skills/register-scale/SKILL.md` を参照。

## 尺度登録のクイックリファレンス

1. `papers/<尺度id>/` ディレクトリを作りPDFをすべて置く
2. `/register-scale papers/<尺度id>/` を実行
3. 確認後 `lib/scales/<id>.json` が生成され `lib/scales/index.ts` に追加される

手動登録の詳細は `docs/scale-registration-guide.md` を参照。

## 技術スタック

- Next.js 15 (webpack) + TypeScript + Tailwind v4 + shadcn/ui
- recharts（レーダーチャート）
- html2canvas-pro + jsPDF（PDF出力、oklch対応）
- Vercel hobby プランでデプロイ想定

## 尺度公開ルール

- **規準値（norm_mean, norm_sd）が揃っていない尺度はGUIに公開しない**
  - 偏差値が算出できない状態でユーザーに提供すると結果の解釈が不完全になるため
  - JSONファイル（`lib/scales/*.json`）は準備段階として先に作成してよい
  - `lib/scales/index.ts` への登録は、全下位尺度の規準値が揃ってから行う
- 保留中の尺度は `papers/README.md` で `⏸️ 保留` と明記し、不足情報を括弧内に記載する
- 規準値が論文本文にない場合（電子付録・OSFなど外部のみ）は、取得してから公開する

## 採点ロジック

- 得点は**項目平均**（素点合計 ÷ 項目数）を使用
- 逆転項目: `最小値 + 最大値 − 原点`
- 偏差値: `T = 10 × (項目平均 − 規準M) / 規準SD + 50`
- norm_mean/norm_sd は必ず**項目平均ベース**で登録する（素点合計ベースの場合は変換）

## 開発コマンド

```bash
npm run dev    # 開発サーバー（localhost:3000）
npm run build  # プロダクションビルド
npx tsc --noEmit  # 型チェック
```
