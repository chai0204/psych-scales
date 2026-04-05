// 心理尺度スキーマの型定義
// PDFから尺度を登録する際はこのスキーマに従ってJSONを作成する

export interface ResponseOption {
  value: number;    // 実際のスコア値（例: 1〜5）
  label: string;   // 表示ラベル（例: "全く当てはまらない"）
}

export interface ScaleItem {
  id: number;
  text: string;
  subscale: string;        // 所属する下位尺度のID
  reverse: boolean;        // 逆転項目かどうか
}

export interface Subscale {
  id: string;
  name: string;
  description?: string;
  // 元論文の規準値（偏差値計算に使用）
  norm_mean?: number;
  norm_sd?: number;
  // 規準値がない場合の代替（項目数で正規化など）
  norm_source?: string;    // 規準値の出典（例: "著者ら(2005) 大学生N=200"）
}

// クラスタ分類（論文でクラスタ分析が行われている場合のみ使用）
export interface ClusterCondition {
  subscale: string;
  operator: ">" | "<" | ">=" | "<=" | "==" | "between";
  value: number | [number, number];  // betweenの場合は[min, max]
  use_deviation?: boolean;           // trueなら偏差値で比較
}

export interface Cluster {
  name: string;
  description?: string;
  conditions: ClusterCondition[];    // すべての条件をANDで評価
  conditions_logic?: "AND" | "OR";  // 条件の結合ロジック（デフォルトAND）
}

export interface ScaleMeta {
  id: string;
  name: string;
  short_name?: string;              // 一覧表示用の短縮名
  description?: string;             // 尺度の説明
  source: string;                   // 出典（例: "山田 & 田中 (2005)"）
  apa_citation?: string;            // APA形式の完全引用文
  doi?: string;
  target?: string;                  // 対象者（例: "成人一般", "大学生"）
  language: "ja" | "en";
  tags?: string[];                  // 検索用タグ（例: ["人格", "自己効力感"]）
}

export interface Scale {
  meta: ScaleMeta;
  instructions?: string;            // 回答者への教示文
  response_options: ResponseOption[];
  items: ScaleItem[];
  subscales: Subscale[];
  clusters?: Cluster[];            // クラスタ定義（任意）
  notes?: string;                  // 登録時のメモ（採点方法の補足など）
}

// スコアリング結果の型
export interface SubscaleResult {
  subscale_id: string;
  subscale_name: string;
  raw_score: number;
  max_score: number;               // 満点（最大選択肢値 × 項目数）
  item_count: number;
  mean_score: number;              // 素点の平均（項目数で割った値）
  deviation_score?: number;        // 偏差値（規準値がある場合）
  norm_mean?: number;
  norm_sd?: number;
  norm_source?: string;
}

export interface ScoreResult {
  scale_id: string;
  scale_name: string;
  subscale_results: SubscaleResult[];
  cluster?: Cluster;               // 該当クラスタ（クラスタ定義がある場合）
  responses: Record<number, number>; // item_id -> response_value
}
