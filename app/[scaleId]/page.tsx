"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getScaleById } from "@/lib/scales";
import { calculateScore } from "@/lib/scoring";
import type { ScoreResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function SurveyPage({ params }: { params: Promise<{ scaleId: string }> }) {
  const { scaleId } = use(params);
  const scale = getScaleById(scaleId);
  const router = useRouter();

  const [responses, setResponses] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);

  if (!scale) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">尺度が見つかりません: {scaleId}</p>
          <Link href="/" className="text-blue-600 hover:underline">← 一覧に戻る</Link>
        </div>
      </main>
    );
  }

  const answeredCount = Object.keys(responses).length;
  const totalCount = scale.items.length;
  const progress = Math.round((answeredCount / totalCount) * 100);
  const allAnswered = answeredCount === totalCount;

  function handleSelect(itemId: number, value: number) {
    setResponses((prev) => ({ ...prev, [itemId]: value }));
  }

  function handleSubmit() {
    if (!allAnswered || !scale) return;
    const r = calculateScore(scale, responses);
    setResult(r);
    setSubmitted(true);
    // 結果をsessionStorageに保存してresultページへ
    sessionStorage.setItem(`result_${scaleId}`, JSON.stringify(r));
    router.push(`/${scaleId}/result`);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
            ← 一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{scale.meta.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{scale.meta.source}</p>
        </div>

        {/* 教示文 */}
        {scale.instructions && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
            {scale.instructions}
          </div>
        )}

        {/* 選択肢ラベルヘッダー（固定表示） */}
        <div className="hidden sm:grid mb-4 text-xs text-gray-400 text-center"
          style={{ gridTemplateColumns: `1fr repeat(${scale.response_options.length}, 1fr)` }}>
          <div />
          {scale.response_options.map((opt) => (
            <div key={opt.value}>{opt.label}</div>
          ))}
        </div>

        {/* 質問項目 */}
        <div className="space-y-2 mb-8">
          {scale.items.map((item, idx) => {
            const selected = responses[item.id];
            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg border px-4 py-3 transition-colors ${
                  selected !== undefined ? "border-blue-200" : "border-gray-200"
                }`}
              >
                {/* モバイル: 縦並び */}
                <p className="text-sm text-gray-700 mb-3">
                  <span className="text-gray-400 mr-2">{idx + 1}.</span>
                  {item.text}
                </p>
                <div className={`grid gap-1`}
                  style={{ gridTemplateColumns: `repeat(${scale.response_options.length}, 1fr)` }}>
                  {scale.response_options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(item.id, opt.value)}
                      className={`flex flex-col items-center justify-center rounded py-2 px-1 text-xs transition-colors ${
                        selected === opt.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <span className="font-bold">{opt.value}</span>
                      <span className="hidden sm:block text-[10px] leading-tight text-center mt-0.5 opacity-80">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-gray-50 pt-2 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-gray-500 shrink-0">
              {answeredCount} / {totalCount}
            </span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full"
          >
            {allAnswered ? "結果を見る" : `あと${totalCount - answeredCount}項目回答してください`}
          </Button>
        </div>
      </div>
    </main>
  );
}
