# 登録済み心理尺度一覧

| ID | 尺度名 | 略称 | 項目数 | 形式 | 対象 | 出典 | 登録状態 |
|---|---|---|---|---|---|---|---|
| `big-five-s` | 日本語版 Big Five 短縮尺度 | Big Five-S | 29 | Likert 7件法 | 成人一般 | 並川ら (2012) | ✅ 公開中 |
| `bfi-2-j-student` | BFI-2-J（大学生規準） | BFI-2-J | 60 | Likert 5件法 | 大学生 | Yoshino et al. (2022) | ✅ 公開中 |
| `bfi-2-j-community` | BFI-2-J（一般成人規準） | BFI-2-J | 60 | Likert 5件法 | 成人一般 | Yoshino et al. (2022) | ✅ 公開中 |
| `bfi-2-s-j` | BFI-2-S-J（短縮版30項目） | BFI-2-S-J | 30 | Likert 5件法 | 成人一般 | Yoshino et al. (2026) | ⏸️ 保留（規準値未取得） |
| `ecr-go` | 一般他者版ECR | ECR-GO | 30 | Likert 7件法 | 大学生 | 中尾・加藤 (2004) | ✅ 公開中 |
| `ecr-rs-mother` | ECR-RS（母親版） | ECR-RS | 9 | Likert 7件法 | 成人一般 | Moreira et al. (2015) 日本語版 | ✅ 公開中 |
| `ecr-rs-father` | ECR-RS（父親版） | ECR-RS | 9 | Likert 7件法 | 成人一般 | Moreira et al. (2015) 日本語版 | ✅ 公開中 |
| `ecr-rs-partner` | ECR-RS（恋人版） | ECR-RS | 9 | Likert 7件法 | 成人一般 | Moreira et al. (2015) 日本語版 | ✅ 公開中 |
| `ecr-rs-friend` | ECR-RS（友人版） | ECR-RS | 9 | Likert 7件法 | 成人一般 | Moreira et al. (2015) 日本語版 | ✅ 公開中 |
| `bscs-j` | 日本語版セルフコントロール尺度短縮版 | BSCS-J | 13 | Likert 5件法 | 大学生 | 尾崎ら (2016) | ✅ 公開中 |
| `scri-j` | 日本語版セルフコンパッション反応尺度 | SCRI-J | 8場面 | シナリオ選択式 | 大学生 | 宮川・谷口 (2016) | ✅ 公開中 |
| `isw-j` | 仕事切り替え困難尺度 | — | 22 | Likert 5件法 | 正規雇用者 | 内村 (2022) | ✅ 公開中 |
| `indecisiveness-j` | 優柔不断尺度 | — | 16 | Likert 5件法 | 大学生 | 斎藤・緑川 (2016) | ✅ 公開中 |
| `ics-j` | 対人的好奇心尺度 | ICS | 11 | Likert 5件法 | 成人一般 | 西川・雨宮・楠見 (2022) | ✅ 公開中 |
| `sps-j` | 主観的生産性尺度 | SPS | 38 | Likert 5件法 | 就業者 | 市川・鈴木・谷沢・秋冨 (2024) | ⏸️ 保留（規準値未取得） |
| `grit-j` | 日本語版グリット尺度 | Grit-J | 12 | Likert 5件法 | 大学生・成人 | 竹橋ら (2019) | ✅ 公開中 |

## 備考

- **回答方向変換**: `grit-j` は原論文の回答方向（1=当てはまる〜5=当てはまらない）を一般的な方向に変換して登録
- **シナリオ形式**: `scri-j` は場面想定法（各場面4選択肢から2つ選択）
- **保留中の尺度**: `sps-j` と `bfi-2-s-j` はJSONファイルは作成済みだが、規準値（M, SD）が論文外の電子付録にのみ掲載されているため公開を保留中

## 尺度の追加方法

1. `papers/` に論文PDFを格納
2. `lib/scales/<scale-id>.json` を作成（`lib/types.ts` の `Scale` スキーマに従う）
3. `lib/scales/index.ts` に import と登録を追加
4. この README を更新

## 公開ルール

- **規準値（norm_mean, norm_sd）が揃っていない尺度は公開しない**。偏差値が算出できない状態でユーザーに提供すると結果の解釈が不完全になるため
- JSONファイルの作成（`lib/scales/` への配置）と、GUIへの公開（`index.ts` への登録）は分離する。JSONは準備段階として先に作成してよいが、`index.ts` への登録は規準値を含む全データが揃ってから行う
- 保留中の尺度はこのREADMEで `⏸️ 保留` と明記し、不足情報を括弧内に記載する
