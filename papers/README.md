# 登録済み心理尺度一覧

| ID | 尺度名 | 略称 | 項目数 | 形式 | 対象 | 出典 | 登録状態 |
|---|---|---|---|---|---|---|---|
| `big-five-s` | 日本語版 Big Five 短縮尺度 | Big Five-S | 29 | Likert 7件法 | 成人一般 | 並川ら (2012) | ✅ 登録済 |
| `bfi-2-j-student` | BFI-2-J（大学生規準） | BFI-2-J | 60 | Likert 5件法 | 大学生 | Yoshino et al. (2022) | ✅ 登録済 |
| `bfi-2-j-community` | BFI-2-J（一般成人規準） | BFI-2-J | 60 | Likert 5件法 | 成人一般 | Yoshino et al. (2022) | ✅ 登録済 |
| `bfi-2-s-j` | BFI-2-S-J（短縮版30項目） | BFI-2-S-J | 30 | Likert 5件法 | 成人一般 | Yoshino et al. (2026) | ✅ 登録済 |
| `ecr-go` | 一般他者版ECR | ECR-GO | 30 | Likert 7件法 | 大学生 | 中尾・加藤 (2004) | ✅ 登録済 |
| `ecr-rs-mother` | ECR-RS（母親版） | ECR-RS | 9 | Likert 7件法 | 成人一般 | Moreira et al. (2015) 日本語版 | ✅ 登録済 |
| `ecr-rs-father` | ECR-RS（父親版） | ECR-RS | 9 | Likert 7件法 | 成人一般 | Moreira et al. (2015) 日本語版 | ✅ 登録済 |
| `ecr-rs-partner` | ECR-RS（恋人版） | ECR-RS | 9 | Likert 7件法 | 成人一般 | Moreira et al. (2015) 日本語版 | ✅ 登録済 |
| `ecr-rs-friend` | ECR-RS（友人版） | ECR-RS | 9 | Likert 7件法 | 成人一般 | Moreira et al. (2015) 日本語版 | ✅ 登録済 |
| `bscs-j` | 日本語版セルフコントロール尺度短縮版 | BSCS-J | 13 | Likert 5件法 | 大学生 | 尾崎ら (2016) | ✅ 登録済 |
| `scri-j` | 日本語版セルフコンパッション反応尺度 | SCRI-J | 8場面 | シナリオ選択式 | 大学生 | 宮川・谷口 (2016) | ✅ 登録済 |
| `isw-j` | 仕事切り替え困難尺度 | — | 22 | Likert 5件法 | 正規雇用者 | 内村 (2022) | ✅ 登録済 |
| `indecisiveness-j` | 優柔不断尺度 | — | 16 | Likert 5件法 | 大学生 | 斎藤・緑川 (2016) | ✅ 登録済 |
| `ics-j` | 対人的好奇心尺度 | ICS | 11 | Likert 5件法 | 成人一般 | 西川・雨宮・楠見 (2022) | ✅ 登録済 |
| `sps-j` | 主観的生産性尺度 | SPS | 38 | Likert 5件法 | 就業者 | 市川・鈴木・谷沢・秋冨 (2024) | ✅ 登録済 |
| `grit-j` | 日本語版グリット尺度 | Grit-J | 12 | Likert 5件法 | 大学生・成人 | 竹橋ら (2019) | ✅ 登録済 |

## 備考

- **偏差値なし**: `sps-j`（規準値はJ-STAGE電子付録のみ）、`bfi-2-s-j`（規準値はOSF電子付録のみ）
- **回答方向変換**: `grit-j` は原論文の回答方向（1=当てはまる〜5=当てはまらない）を一般的な方向に変換して登録
- **シナリオ形式**: `scri-j` は場面想定法（各場面4選択肢から2つ選択）

## 尺度の追加方法

1. `papers/` に論文PDFを格納
2. `lib/scales/<scale-id>.json` を作成（`lib/types.ts` の `Scale` スキーマに従う）
3. `lib/scales/index.ts` に import と登録を追加
4. この README を更新
