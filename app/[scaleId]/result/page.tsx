"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getScaleById } from "@/lib/scales";
import type { ScoreResult, SubscaleResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function DeviationBar({ value }: { value: number }) {
  // 20〜80の範囲でバーを描画
  const clamped = Math.max(20, Math.min(80, value));
  const pct = ((clamped - 20) / 60) * 100;
  const color =
    value >= 60 ? "bg-blue-500" :
    value >= 40 ? "bg-green-500" :
    "bg-orange-400";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-2 relative">
        {/* 偏差値50のマーカー */}
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-300"
          style={{ left: `${((50 - 20) / 60) * 100}%` }} />
        <div
          className={`h-2 rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold w-10 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function SubscaleCard({ sub }: { sub: SubscaleResult }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-800">{sub.subscale_name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            素点合計: {sub.raw_score} / 項目平均: {sub.mean_score.toFixed(2)}
          </p>
        </div>
        {sub.deviation_score !== undefined && (
          <span className="text-2xl font-bold text-gray-700">{sub.deviation_score.toFixed(1)}</span>
        )}
      </div>
      {sub.deviation_score !== undefined && (
        <>
          <DeviationBar value={sub.deviation_score} />
          {sub.norm_source && (
            <p className="text-xs text-gray-400 mt-1">規準: {sub.norm_source}</p>
          )}
        </>
      )}
    </div>
  );
}

export default function ResultPage({ params }: { params: Promise<{ scaleId: string }> }) {
  const { scaleId } = use(params);
  const scale = getScaleById(scaleId);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`result_${scaleId}`);
    if (stored) {
      setResult(JSON.parse(stored));
    }
  }, [scaleId]);

  async function handleExportPDF() {
    if (!resultRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(resultRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(`${scaleId}_result.pdf`);
  }

  function handleExportMarkdown() {
    if (!result || !scale) return;
    const lines: string[] = [
      `# ${scale.meta.name} 結果`,
      ``,
      `**実施日**: ${new Date().toLocaleDateString("ja-JP")}`,
      `**出典**: ${scale.meta.source}`,
      ``,
      `## 下位尺度得点`,
      ``,
      `| 尺度 | 素点合計 | 項目平均 | 偏差値 |`,
      `|---|---|---|---|`,
      ...result.subscale_results.map((s) =>
        `| ${s.subscale_name} | ${s.raw_score} | ${s.mean_score.toFixed(2)} | ${s.deviation_score?.toFixed(1) ?? "—"} |`
      ),
    ];
    if (result.cluster) {
      lines.push(``, `## クラスタ判定`, ``, `**${result.cluster.name}**`);
      if (result.cluster.description) lines.push(``, result.cluster.description);
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ナビ */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← 一覧に戻る
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
              Markdown
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              PDF
            </Button>
          </div>
        </div>

        {/* キャプチャ対象 */}
        <div ref={resultRef}>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{scale.meta.name}</h1>
          <p className="text-sm text-gray-400 mb-6">{scale.meta.source} ・ {new Date().toLocaleDateString("ja-JP")} 実施</p>

          {/* 偏差値凡例 */}
          {result.subscale_results.some((s) => s.deviation_score !== undefined) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6 text-xs text-gray-500 flex gap-6">
              <span>偏差値バー: <span className="text-orange-400 font-semibold">■</span> 〜40　<span className="text-green-500 font-semibold">■</span> 40〜60　<span className="text-blue-500 font-semibold">■</span> 60〜</span>
              <span>縦線 = 偏差値50（平均）</span>
            </div>
          )}

          {/* 下位尺度カード */}
          <div className="space-y-3 mb-6">
            {result.subscale_results.map((sub) => (
              <SubscaleCard key={sub.subscale_id} sub={sub} />
            ))}
          </div>

          {/* クラスタ判定 */}
          {result.cluster && (
            <>
              <Separator className="my-6" />
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="font-semibold text-gray-700 mb-2">クラスタ判定</h2>
                <Badge className="text-base px-3 py-1">{result.cluster.name}</Badge>
                {result.cluster.description && (
                  <p className="text-sm text-gray-600 mt-3">{result.cluster.description}</p>
                )}
              </div>
            </>
          )}
        </div>

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
