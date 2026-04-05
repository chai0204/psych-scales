"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { getScaleById } from "@/lib/scales";
import type { Scale, ScoreResult, SubscaleResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ---- max_score のフォールバック計算（古いsessionStorageデータ対応）----
function enrichResults(results: SubscaleResult[], scale: Scale): SubscaleResult[] {
  const maxResponseVal = Math.max(...scale.response_options.map((o) => o.value));
  return results.map((sub) => ({
    ...sub,
    max_score: sub.max_score ?? maxResponseVal * sub.item_count,
  }));
}

// ---- Deviation bar (inline styles only — for both UI and PDF capture) ----
function DeviationBar({ value }: { value: number }) {
  const clamped = Math.max(20, Math.min(80, value));
  const pct = ((clamped - 20) / 60) * 100;
  const markerPct = ((50 - 20) / 60) * 100;
  const color = value >= 60 ? "#3b82f6" : value >= 40 ? "#22c55e" : "#fb923c";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, backgroundColor: "#f3f4f6", borderRadius: 9999, height: 8, position: "relative" }}>
        <div style={{
          position: "absolute", top: "50%", transform: "translateY(-50%)",
          width: 2, height: 16, backgroundColor: "#d1d5db", left: `${markerPct}%`,
        }} />
        <div style={{
          height: 8, borderRadius: 9999, backgroundColor: color,
          width: `${pct}%`, transition: "width 0.3s",
        }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: "bold", width: 40, textAlign: "right" }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ---- Subscale card ----
function SubscaleCard({ sub }: { sub: SubscaleResult }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <strong style={{ color: "#1f2937", fontSize: 15 }}>{sub.subscale_name}</strong>
        {sub.deviation_score !== undefined && (
          <span style={{ fontSize: 24, fontWeight: "bold", color: "#374151" }}>
            {sub.deviation_score.toFixed(1)}
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
        素点: {sub.raw_score} / {sub.max_score}　項目平均: {sub.mean_score.toFixed(2)}　項目数: {sub.item_count}
      </p>
      {sub.deviation_score !== undefined && (
        <>
          <DeviationBar value={sub.deviation_score} />
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
            偏差値 = 10 × (項目平均 − {sub.norm_mean}) / {sub.norm_sd} + 50
            {sub.norm_source && `　規準: ${sub.norm_source}`}
          </p>
        </>
      )}
    </div>
  );
}

// ---- Hidden print template (inline styles only, no oklch) ----
function PrintTemplate({
  scale, result, printRef,
}: {
  scale: Scale;
  result: ScoreResult;
  printRef: React.RefObject<HTMLDivElement | null>;
}) {
  const hasDeviation = result.subscale_results.some((s) => s.deviation_score !== undefined);
  const radarData = result.subscale_results.map((s) => ({
    name: s.subscale_name,
    value: s.deviation_score ?? s.mean_score,
  }));
  const radarMin = hasDeviation ? 20 : 1;
  const radarMax = hasDeviation ? 80 : Math.max(...result.subscale_results.map((s) => s.max_score / s.item_count));

  return (
    <div
      ref={printRef}
      style={{
        position: "fixed", left: "-9999px", top: 0,
        width: 740, padding: "40px 48px", background: "#fff",
        fontFamily: "sans-serif", color: "#111",
      }}
    >
      {/* Title */}
      <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>{scale.meta.name}</h1>
      <p style={{ fontSize: 11, color: "#888", marginBottom: 24 }}>
        {scale.meta.source}　実施日: {new Date().toLocaleDateString("ja-JP")}
      </p>

      {/* レーダーチャート（固定サイズ — ResponsiveContainer不使用でhtml2canvas対応） */}
      {radarData.length >= 3 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, borderBottom: "1px solid #e5e7eb", paddingBottom: 4 }}>
            {hasDeviation ? "偏差値プロファイル" : "得点プロファイル"}
          </h2>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <RadarChart width={500} height={320} data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} />
              <PolarRadiusAxis
                angle={90}
                domain={[radarMin, radarMax]}
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                tickCount={4}
                stroke="#e5e7eb"
              />
              <Radar name="得点" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
            </RadarChart>
          </div>
        </div>
      )}

      {/* 採点方法 */}
      <h2 style={{ fontSize: 13, fontWeight: "bold", marginBottom: 6, borderBottom: "1px solid #e5e7eb", paddingBottom: 4 }}>
        採点方法
      </h2>
      <div style={{ fontSize: 11, color: "#555", lineHeight: 1.8, marginBottom: 20 }}>
        <p>・得点は項目平均（素点合計 ÷ 項目数）を使用</p>
        <p>・逆転項目は (最小値 + 最大値 − 原点) で変換</p>
        {hasDeviation && (
          <>
            <p>・偏差値 T = 10 × (項目平均 − 規準M) / 規準SD + 50</p>
            <p>・偏差値の解釈は正規分布を仮定（規準集団との相対比較）</p>
          </>
        )}
      </div>

      {/* 下位尺度 */}
      <h2 style={{ fontSize: 13, fontWeight: "bold", marginBottom: 10, borderBottom: "1px solid #e5e7eb", paddingBottom: 4 }}>
        下位尺度得点
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {result.subscale_results.map((sub) => (
          <SubscaleCard key={sub.subscale_id} sub={sub} />
        ))}
      </div>

      {/* クラスタ */}
      {result.cluster && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, borderBottom: "1px solid #e5e7eb", paddingBottom: 4 }}>
            クラスタ判定
          </h2>
          <p style={{ fontSize: 14, fontWeight: "bold", color: "#2563eb" }}>{result.cluster.name}</p>
          {result.cluster.description && (
            <p style={{ fontSize: 12, color: "#555", marginTop: 6 }}>{result.cluster.description}</p>
          )}
        </div>
      )}

      {/* APA引用 */}
      {scale.meta.apa_citation && (
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 4 }}>引用文献</p>
          <p style={{ fontSize: 10, color: "#888", lineHeight: 1.7 }}>{scale.meta.apa_citation}</p>
        </div>
      )}
    </div>
  );
}

// ---- Main page ----
export default function ResultPage({ params }: { params: Promise<{ scaleId: string }> }) {
  const { scaleId } = use(params);
  const scale = getScaleById(scaleId);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`result_${scaleId}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setResult(JSON.parse(stored));
  }, [scaleId]);

  async function handleExportPDF() {
    if (!printRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      // キャプチャ前にページの全スタイルシートを除去し oklch エラーを回避
      onclone: (_clonedDoc, element) => {
        // clonedDoc内のlink/styleタグをすべて削除（inline stylesのみ残す）
        element.ownerDocument.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => el.remove());
      },
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const imgW = pageW - 20;
    const imgH = (canvas.height * imgW) / canvas.width;

    // 複数ページ対応
    const pageH = pdf.internal.pageSize.getHeight() - 20;
    if (imgH <= pageH) {
      pdf.addImage(imgData, "PNG", 10, 10, imgW, imgH);
    } else {
      let remainH = imgH;
      let srcY = 0;
      while (remainH > 0) {
        const sliceH = Math.min(pageH, remainH);
        const sliceCanvas = document.createElement("canvas");
        const ratio = canvas.width / imgW;
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceH * ratio;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, srcY * ratio, canvas.width, sliceH * ratio, 0, 0, canvas.width, sliceH * ratio);
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 10, 10, imgW, sliceH);
        remainH -= sliceH;
        srcY += sliceH;
        if (remainH > 0) pdf.addPage();
      }
    }

    pdf.save(`${scaleId}_result.pdf`);
  }

  function handleExportMarkdown() {
    if (!result || !scale) return;
    const enriched = enrichResults(result.subscale_results, scale);
    const lines: string[] = [
      `# ${scale.meta.name} 結果`,
      ``,
      `**実施日**: ${new Date().toLocaleDateString("ja-JP")}`,
      `**出典**: ${scale.meta.source}`,
      ``,
      `## 採点方法`,
      ``,
      `- 得点は項目平均（素点合計 / 項目数）を使用`,
      `- 逆転項目は (最小値 + 最大値 − 原点) で変換`,
      `- 偏差値 T = 10 × (項目平均 − 規準M) / 規準SD + 50`,
      `- 偏差値の解釈は正規分布を仮定（規準集団との相対比較）`,
      ``,
      `## 下位尺度得点`,
      ``,
      `| 尺度 | 素点 / 満点 | 項目平均 | 偏差値 | 規準 M (SD) |`,
      `|---|---|---|---|---|`,
      ...enriched.map((s) =>
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

  const enriched = enrichResults(result.subscale_results, scale);
  const hasDeviation = enriched.some((s) => s.deviation_score !== undefined);
  const radarMin = hasDeviation ? 20 : 1;
  const radarMax = hasDeviation ? 80 : Math.max(...enriched.map((s) => s.max_score / s.item_count));
  const radarData = enriched.map((s) => ({
    name: s.subscale_name,
    value: s.deviation_score ?? s.mean_score,
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 隠しPDFテンプレート（html2canvas用） */}
      <PrintTemplate scale={scale} result={{ ...result, subscale_results: enriched }} printRef={printRef} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ナビ */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← 一覧に戻る</Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportMarkdown}>Markdown</Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>PDF</Button>
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{scale.meta.name}</h1>
        <p className="text-sm text-gray-400 mb-6">
          {scale.meta.source}　・　{new Date().toLocaleDateString("ja-JP")} 実施
        </p>

        {/* レーダーチャート */}
        {enriched.length >= 3 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">
              {hasDeviation ? "偏差値プロファイル" : "得点プロファイル"}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[radarMin, radarMax]} tick={{ fontSize: 9 }} tickCount={4} />
                <Radar name="得点" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
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
          {enriched.map((sub) => (
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
