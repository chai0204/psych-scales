import type { Scale, ScoreResult, SubscaleResult, Cluster, ClusterCondition } from "./types";

// 偏差値の計算: 10 * (x - mean) / sd + 50
function calcDeviationScore(raw: number, mean: number, sd: number): number {
  if (sd === 0) return 50;
  return 10 * ((raw - mean) / sd) + 50;
}

// 逆転項目のスコア変換
// response_optionsのmin/maxから自動計算
function reverseScore(value: number, min: number, max: number): number {
  return min + max - value;
}

export function calculateScore(
  scale: Scale,
  responses: Record<number, number> // item_id -> 選択した value
): ScoreResult {
  const values = scale.response_options.map((o) => o.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  // 下位尺度ごとにスコアを集計
  const subscaleScores: Record<string, number[]> = {};
  for (const sub of scale.subscales) {
    subscaleScores[sub.id] = [];
  }

  for (const item of scale.items) {
    const raw = responses[item.id];
    if (raw === undefined) continue;
    const score = item.reverse ? reverseScore(raw, minVal, maxVal) : raw;
    subscaleScores[item.subscale].push(score);
  }

  const subscaleResults: SubscaleResult[] = scale.subscales.map((sub) => {
    const scores = subscaleScores[sub.id] ?? [];
    const rawSum = scores.reduce((a, b) => a + b, 0);
    const mean = scores.length > 0 ? rawSum / scores.length : 0;

    const deviation =
      sub.norm_mean !== undefined && sub.norm_sd !== undefined
        ? calcDeviationScore(mean, sub.norm_mean, sub.norm_sd)
        : undefined;

    return {
      subscale_id: sub.id,
      subscale_name: sub.name,
      raw_score: rawSum,
      max_score: maxVal * scores.length,
      item_count: scores.length,
      mean_score: mean,
      deviation_score: deviation !== undefined ? Math.round(deviation * 10) / 10 : undefined,
      norm_mean: sub.norm_mean,
      norm_sd: sub.norm_sd,
      norm_source: sub.norm_source,
    };
  });

  // クラスタ判定
  const cluster = scale.clusters
    ? determineCluster(scale.clusters, subscaleResults)
    : undefined;

  return {
    scale_id: scale.meta.id,
    scale_name: scale.meta.name,
    subscale_results: subscaleResults,
    cluster,
    responses,
  };
}

function evaluateCondition(
  cond: ClusterCondition,
  results: SubscaleResult[]
): boolean {
  const sub = results.find((r) => r.subscale_id === cond.subscale);
  if (!sub) return false;

  const val = cond.use_deviation ? (sub.deviation_score ?? sub.mean_score) : sub.mean_score;

  switch (cond.operator) {
    case ">":  return val > (cond.value as number);
    case "<":  return val < (cond.value as number);
    case ">=": return val >= (cond.value as number);
    case "<=": return val <= (cond.value as number);
    case "==": return val === (cond.value as number);
    case "between": {
      const [lo, hi] = cond.value as [number, number];
      return val >= lo && val <= hi;
    }
  }
}

function determineCluster(
  clusters: Cluster[],
  results: SubscaleResult[]
): Cluster | undefined {
  for (const cluster of clusters) {
    const logic = cluster.conditions_logic ?? "AND";
    const matches =
      logic === "AND"
        ? cluster.conditions.every((c) => evaluateCondition(c, results))
        : cluster.conditions.some((c) => evaluateCondition(c, results));
    if (matches) return cluster;
  }
  return undefined;
}
