# 尺度登録ガイド

## ディレクトリ構成

```
psych-scales/
├── papers/                    # 論文PDFを置く場所
│   └── *.pdf
├── lib/
│   ├── types.ts               # スキーマ型定義
│   └── scales/
│       ├── index.ts           # 尺度レジストリ（登録リスト）
│       └── *.json             # 各尺度のデータ
└── docs/
    └── scale-registration-guide.md  # このファイル
```

---

## 登録済み尺度の確認

`lib/scales/index.ts` を開くと現在登録されている尺度の一覧が確認できます。

```typescript
const scaleList: Scale[] = [
  bigFiveS as Scale,   // ← ここに並んでいる
  // ...
];
```

各尺度の詳細（質問文・規準値など）は対応する `lib/scales/*.json` を参照してください。

---

## 手動登録の手順

### 1. JSONファイルを作成

`lib/scales/<id>.json` を作成します。ファイル名はURLになるので kebab-case で。

#### 完全スキーマ

```jsonc
{
  "meta": {
    "id": "scale-id",               // URL・ファイル名と一致させる（kebab-case）
    "name": "尺度の正式名称",
    "short_name": "略称",           // 省略可
    "description": "尺度の説明",    // 省略可
    "source": "著者 (年)",
    "apa_citation": "APA形式の完全引用文",  // 省略可
    "doi": "10.xxxx/xxxxx",         // 省略可
    "target": "大学生",             // 省略可（対象者）
    "language": "ja",               // "ja" または "en"
    "tags": ["タグ1", "タグ2"]      // 検索用タグ
  },
  "instructions": "以下の項目について回答してください。",  // 省略可
  "response_options": [
    { "value": 1, "label": "全く当てはまらない" },
    { "value": 2, "label": "あまり当てはまらない" },
    { "value": 3, "label": "どちらでもない" },
    { "value": 4, "label": "やや当てはまる" },
    { "value": 5, "label": "非常に当てはまる" }
  ],
  "items": [
    { "id": 1, "text": "質問文",     "subscale": "sub1", "reverse": false },
    { "id": 2, "text": "逆転項目文", "subscale": "sub1", "reverse": true  }
  ],
  "subscales": [
    {
      "id": "sub1",
      "name": "下位尺度名",
      "description": "説明",   // 省略可
      "norm_mean": 3.50,        // 省略可（項目平均ベースの規準値）
      "norm_sd": 0.80,          // 省略可
      "norm_source": "著者 (年) 大学生 N=200"  // 省略可
    }
  ],
  "clusters": [            // 省略可（論文にクラスタ分析がある場合のみ）
    {
      "name": "クラスタ名",
      "description": "説明",
      "conditions": [
        {
          "subscale": "sub1",
          "operator": ">",     // ">" "<" ">=" "<=" "==" "between"
          "value": 3.5,        // betweenの場合は [min, max]
          "use_deviation": false  // trueなら偏差値で比較
        }
      ],
      "conditions_logic": "AND"  // "AND" または "OR"（省略時AND）
    }
  ],
  "notes": "登録メモ（採点上の注意など）"  // 省略可
}
```

### 2. レジストリに追加

`lib/scales/index.ts` を編集して2行追加します。

```typescript
import bigFiveS from "./big-five-s.json";
import newScale from "./new-scale.json";    // ← 追加

const scaleList: Scale[] = [
  bigFiveS as Scale,
  newScale as Scale,    // ← 追加
];
```

### 3. 動作確認

```bash
npm run dev
```

ホーム画面に新しい尺度が表示されれば完了です。

---

## 注意事項

### norm_mean は「項目平均」ベースで入力する

このアプリは得点を**項目平均**（素点合計 ÷ 項目数）で計算します。
論文によっては規準値を**素点合計**で記載していることがあるので注意してください。

| 論文の記載 | 変換方法 |
|---|---|
| 項目平均の M/SD | そのまま入力 |
| 素点合計の M/SD | M ÷ 項目数、SD ÷ 項目数 で変換 |

### 逆転項目の変換式

`reverse: true` の項目は自動で以下の式で変換されます：

```
変換後スコア = 最小選択肢値 + 最大選択肢値 − 原点スコア
```

例：5件法（1〜5）の場合 → `1 + 5 − x = 6 − x`

### id はURLになる

`meta.id` はそのままURLパス（`/big-five-s`）になります。
登録後に変更するとブックマークが壊れるため、最初に確定させてください。

---

## Claude Code を使った自動登録

論文PDFを `papers/` ディレクトリに置いた後、Claude Code で以下のスキルを使うと自動登録できます。

```
/register-scale papers/論文名.pdf
```

詳細は `.claude/skills/register-scale/SKILL.md` を参照してください。
