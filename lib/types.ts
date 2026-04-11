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
  group?: string;           // 表示グループ（例: "domain", "facet"）
  computed_from?: string[]; // 子下位尺度IDのリスト（これが指定された場合、子の全項目を集約してスコアを計算）
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

// シナリオ形式の選択肢（場面想定法尺度用）
export interface ScenarioOption {
  id: string;           // 選択肢ID（例: "1a", "1b"）
  text: string;         // 選択肢テキスト
  is_target: boolean;   // true=得点対象（SC反応等）, false=フィラー
}

export interface Scenario {
  id: number;           // 場面番号
  text: string;         // 場面の記述
  options: ScenarioOption[];
  select_count: number; // 選択する数（例: 2）
}

export interface Scale {
  meta: ScaleMeta;
  instructions?: string;            // 回答者への教示文
  format?: "likert" | "scenario";   // 回答形式（デフォルト: likert）
  response_options: ResponseOption[];
  items: ScaleItem[];
  subscales: Subscale[];
  scenarios?: Scenario[];           // シナリオ形式の場面リスト
  clusters?: Cluster[];            // クラスタ定義（任意）
  notes?: string;                  // 登録時のメモ（採点方法の補足など）
}

// スコアリング結果の型
export interface SubscaleResult {
  subscale_id: string;
  subscale_name: string;
  subscale_description?: string; // subscale.description をそのまま引き継ぐ
  group?: string;               // subscale.group をそのまま引き継ぐ
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
  responses: Record<number, number>; // item_id -> response_value（likert用）
  scenario_responses?: Record<number, string[]>; // scenario_id -> 選択したoption ID（scenario用）
}
