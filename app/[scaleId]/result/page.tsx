"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { getScaleById } from "@/lib/scales";
import type { ScoreResult, SubscaleResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ---- Deviation bar ----
function DeviationBar({ value }: { value: number }) {
  const clamped = Math.max(20, Math.min(80, value));
  const pct = ((clamped - 20) / 60) * 100;
  const color =
    value >= 60 ? "#3b82f6" : value >= 40 ? "#22c55e" : "#fb923c";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-2 relative">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-300"
          style={{ left: `${((50 - 20) / 60) * 100}%` }}
        />
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold w-10 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

// ---- Subscale card ----
function SubscaleCard({ sub }: { sub: SubscaleResult }) {
  const maxVal = sub.max_score;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-gray-800">{sub.subscale_name}</h3>
        {sub.deviation_score !== undefined && (
          <span className="text-2xl font-bold text-gray-700">
            {sub.deviation_score.toFixed(1)}
          </span>
        )}
      </div>

      {/* 素点 / 満点 */}
      <p className="text-xs text-gray-500 mb-2">
        素点: {sub.raw_score} / {maxVal}　項目平均: {sub.mean_score.toFixed(2)}　項目数: {sub.item_count}
      </p>

      {/* 偏差値バー */}
      {sub.deviation_score !== undefined && (
        <>
          <DeviationBar value={sub.deviation_score} />
          {/* 計算方式の注記 */}
          <p className="text-xs text-gray-400 mt-1.5">
            偏差値 = 10 × (項目平均 − {sub.norm_mean}) / {sub.norm_sd} + 50
            {sub.norm_source && `　規準: ${sub.norm_source}`}
          </p>
        </>
      )}
    </div>
  );
}

// ---- PDF export (programmatic, oklch不使用) ----
async function exportPDF(
  scaleName: string,
  scaleId: string,
  source: string,
  apaCitation: string | undefined,
  results: SubscaleResult[],
  clusterName?: string,
  clusterDesc?: string,
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = W - margin * 2;
  let y = 20;

  const line = (text: string, size = 10, bold = false, color: [number, number, number] = [30, 30, 30]) => {
    pdf.setFontSize(size);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setTextColor(...color);
    pdf.text(text, margin, y);
    y += size * 0.45 + 2;
  };

  const gap = (n = 4) => { y += n; };

  // Title
  line(scaleName, 16, true);
  line(`${source}　実施日: ${new Date().toLocaleDateString("ja-JP")}`, 9, false, [100, 100, 100]);
  gap(6);

  // Section: 統計方法の注記
  line("採点方法", 11, true);
  gap(1);
  line("・各下位尺度の得点は項目平均（素点合計 / 項目数）を使用", 8, false, [80, 80, 80]);
  line("・逆転項目は (最小値 + 最大値 − 原点) で変換", 8, false, [80, 80, 80]);
  line("・偏差値 T = 10 × (項目平均 − 規準M) / 規準SD + 50", 8, false, [80, 80, 80]);
  line("・偏差値の解釈は正規分布を仮定（規準集団との相対比較）", 8, false, [80, 80, 80]);
  gap(6);

  // Section: 下位尺度結果
  line("下位尺度得点", 11, true);
  gap(2);

  for (const sub of results) {
    if (y > 250) { pdf.addPage(); y = 20; }

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 30, 30);
    pdf.text(sub.subscale_name, margin, y);

    if (sub.deviation_score !== undefined) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(37, 99, 235);
      pdf.text(`T = ${sub.deviation_score.toFixed(1)}`, W - margin - 20, y, { align: "right" });
    }
    y += 5;

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `素点: ${sub.raw_score} / ${sub.max_score}　項目平均: ${sub.mean_score.toFixed(2)}　項目数: ${sub.item_count}`,
      margin, y,
    );
    y += 4;

    // bar
    if (sub.deviation_score !== undefined) {
      const barW = contentW * 0.7;
      const barH = 3;
      const barX = margin;
      pdf.setFillColor(230, 230, 230);
      pdf.roundedRect(barX, y, barW, barH, 1, 1, "F");

      const clamped = Math.max(20, Math.min(80, sub.deviation_score));
      const fillPct = (clamped - 20) / 60;
      const fillColor: [number, number, number] =
        sub.deviation_score >= 60 ? [59, 130, 246] :
        sub.deviation_score >= 40 ? [34, 197, 94] : [251, 146, 60];
      pdf.setFillColor(...fillColor);
      pdf.roundedRect(barX, y, barW * fillPct, barH, 1, 1, "F");

      // 偏差値50マーカー
      const markerX = barX + barW * (30 / 60);
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(0.3);
      pdf.line(markerX, y - 1, markerX, y + barH + 1);
      y += 5;

      if (sub.norm_source) {
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`規準: ${sub.norm_source}`, margin, y);
        y += 3.5;
      }
    }
    gap(3);
  }

  // Section: クラスタ
  if (clusterName) {
    if (y > 240) { pdf.addPage(); y = 20; }
    gap(2);
    line("クラスタ判定", 11, true);
    gap(1);
    line(clusterName, 10, true, [37, 99, 235]);
    if (clusterDesc) {
      gap(1);
      const wrapped = pdf.splitTextToSize(clusterDesc, contentW);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80, 80, 80);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 5;
    }
    gap(4);
  }

  // Section: 引用文献
  if (apaCitation) {
    if (y > 250) { pdf.addPage(); y = 20; }
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, W - margin, y);
    gap(4);
    line("引用文献", 9, true, [80, 80, 80]);
    gap(1);
    const wrapped = pdf.splitTextToSize(apaCitation, contentW);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(80, 80, 80);
    pdf.text(wrapped, margin, y);
  }

  pdf.save(`${scaleId}_result.pdf`);
}

// ---- Main page ----
export default function ResultPage({ params }: { params: Promise<{ scaleId: string }> }) {
  const { scaleId } = use(params);
  const scale = getScaleById(scaleId);
  const [result, setResult] = useState<ScoreResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`result_${scaleId}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setResult(JSON.parse(stored));
  }, [scaleId]);

  function handleExportMarkdown() {
    if (!result || !scale) return;
    const lines: string[] = [
      `# ${scale.meta.name} 結果`,
      ``,
      `**実施日**: ${new Date().toLocaleDateString("ja-JP")}`,
      `**出典**: ${scale.meta.source}`,
      ``,
      `## 採点方法`,
      ``,
      `- 各下位尺度の得点は項目平均（素点合計 / 項目数）を使用`,
      `- 逆転項目は (最小値 + 最大値 − 原点) で変換`,
      `- 偏差値 T = 10 × (項目平均 − 規準M) / 規準SD + 50`,
      `- 偏差値の解釈は正規分布を仮定（規準集団との相対比較）`,
      ``,
      `## 下位尺度得点`,
      ``,
      `| 尺度 | 素点 / 満点 | 項目平均 | 偏差値 | 規準 M (SD) |`,
      `|---|---|---|---|---|`,
      ...result.subscale_results.map((s) =>
        `| ${s.subscale_name} | ${s.raw_score} / ${s.max_score} | ${s.mean_score.toFixed(2)} | ${s.deviation_score?.toFixed(1) ?? "—"} | ${s.norm_mean !== undefined ? `${s.norm_mean} (${s.norm_sd})` : "—"} |`
      ),
    ];
    if (result.cluster) {
      lines.push(``, `## クラスタ判定`, ``, `**${result.cluster.name}**`);
      if (result.cluster.description) lines.push(``, result.cluster.description);
    }
    if (scale.meta.apa_citation) {
      lines.push(``, `## 引用文献`, ``, scale.meta.apa_citation);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scaleId}_result.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!scale) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">尺度が見つかりません</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">結果が見つかりません。先に回答してください。</p>
          <Link href={`/${scaleId}`} className="text-blue-600 hover:underline">← 回答に戻る</Link>
        </div>
      </main>
    );
  }

  // Radar chart data: 偏差値があれば偏差値、なければ項目平均
  const radarData = result.subscale_results.map((s) => ({
    name: s.subscale_name,
    value: s.deviation_score ?? s.mean_score,
    fullMark: s.deviation_score !== undefined ? 80 : undefined,
  }));
  const hasDeviation = result.subscale_results.some((s) => s.deviation_score !== undefined);
  const radarMin = hasDeviation ? 20 : 1;
  const radarMax = hasDeviation ? 80 : Math.max(...result.subscale_results.map((s) => s.max_score / s.item_count));

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ナビ */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← 一覧に戻る</Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportMarkdown}>Markdown</Button>
            <Button
              variant="outline" size="sm"
              onClick={() =>
                exportPDF(
                  scale.meta.name, scaleId, scale.meta.source,
                  scale.meta.apa_citation,
                  result.subscale_results,
                  result.cluster?.name,
                  result.cluster?.description,
                )
              }
            >
              PDF
            </Button>
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{scale.meta.name}</h1>
        <p className="text-sm text-gray-400 mb-6">
          {scale.meta.source}　・　{new Date().toLocaleDateString("ja-JP")} 実施
        </p>

        {/* レーダーチャート */}
        {result.subscale_results.length >= 3 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">
              {hasDeviation ? "偏差値プロファイル" : "得点プロファイル"}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[radarMin, radarMax]}
                  tick={{ fontSize: 9 }}
                  tickCount={4}
                />
                <Radar
                  name="得点"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                />
                <Tooltip formatter={(v) => typeof v === "number" ? v.toFixed(1) : v} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 偏差値凡例 */}
        {hasDeviation && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 mb-4 text-xs text-gray-500 flex flex-wrap gap-4">
            <span>
              <span style={{ color: "#fb923c" }}>■</span> ～40
              <span style={{ color: "#22c55e" }}>■</span> 40～60
              <span style={{ color: "#3b82f6" }}>■</span> 60～
            </span>
            <span>縦線 = 偏差値50（規準集団平均）</span>
          </div>
        )}

        {/* 下位尺度カード */}
        <div className="space-y-3 mb-6">
          {result.subscale_results.map((sub) => (
            <SubscaleCard key={sub.subscale_id} sub={sub} />
          ))}
        </div>

        {/* 統計的注記 */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6 text-xs text-blue-700 space-y-1">
          <p className="font-semibold mb-1">採点方法・解釈上の注意</p>
          <p>・得点は<strong>項目平均</strong>（素点合計 ÷ 項目数）を使用</p>
          <p>・逆転項目は (最小値 + 最大値 − 原点) で変換済み</p>
          {hasDeviation && (
            <>
              <p>・偏差値 <strong>T = 10 × (項目平均 − 規準M) / 規準SD + 50</strong></p>
              <p>・偏差値は規準集団との相対比較であり、<strong>正規分布を仮定</strong>している</p>
            </>
          )}
        </div>

        {/* クラスタ判定 */}
        {result.cluster && (
          <>
            <Separator className="my-6" />
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <h2 className="font-semibold text-gray-700 mb-2">クラスタ判定</h2>
              <Badge className="text-base px-3 py-1">{result.cluster.name}</Badge>
              {result.cluster.description && (
                <p className="text-sm text-gray-600 mt-3">{result.cluster.description}</p>
              )}
            </div>
          </>
        )}

        {/* APA引用文献 */}
        {scale.meta.apa_citation && (
          <>
            <Separator className="my-4" />
            <div className="text-xs text-gray-400">
              <p className="font-semibold mb-1">引用文献</p>
              <p className="leading-relaxed">{scale.meta.apa_citation}</p>
            </div>
          </>
        )}

        {/* 再回答 */}
        <div className="mt-8 text-center">
          <Link href={`/${scaleId}`}>
            <Button variant="outline">もう一度回答する</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
