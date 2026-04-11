"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getScaleById } from "@/lib/scales";
import { calculateScore, calculateScenarioScore } from "@/lib/scoring";
import type { ScoreResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function SurveyPage({ params }: { params: Promise<{ scaleId: string }> }) {
  const { scaleId } = use(params);
  const scale = getScaleById(scaleId);
  const router = useRouter();

  // Likert用
  const [responses, setResponses] = useState<Record<number, number>>({});
  // シナリオ用
  const [scenarioResponses, setScenarioResponses] = useState<Record<number, string[]>>({});

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

  const isScenario = scale.format === "scenario";

  // 進捗計算
  const totalCount = isScenario ? (scale.scenarios?.length ?? 0) : scale.items.length;
  const answeredCount = isScenario
    ? Object.values(scenarioResponses).filter(
        (selected) => selected.length === (scale.scenarios?.[0]?.select_count ?? 2)
      ).length
    : Object.keys(responses).length;
  const progress = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const allAnswered = answeredCount === totalCount && totalCount > 0;

  // Likert: 選択肢を選ぶ
  function handleSelect(itemId: number, value: number) {
    setResponses((prev) => ({ ...prev, [itemId]: value }));
  }

  // シナリオ: 選択肢をトグル
  function handleScenarioToggle(scenarioId: number, optionId: string, selectCount: number) {
    setScenarioResponses((prev) => {
      const current = prev[scenarioId] ?? [];
      if (current.includes(optionId)) {
        // 選択解除
        return { ...prev, [scenarioId]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= selectCount) {
        // 上限到達 → 何もしない
        return prev;
      }
      return { ...prev, [scenarioId]: [...current, optionId] };
    });
  }

  function handleSubmit() {
    if (!allAnswered || !scale) return;
    const r = isScenario
      ? calculateScenarioScore(scale, scenarioResponses)
      : calculateScore(scale, responses);
    setResult(r);
    setSubmitted(true);
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

        {isScenario ? (
          /* ========== シナリオ形式 ========== */
          <div className="space-y-4 mb-8">
            {scale.scenarios?.map((scenario, idx) => {
              const selected = scenarioResponses[scenario.id] ?? [];
              const isFull = selected.length >= scenario.select_count;
              const isDone = selected.length === scenario.select_count;
              return (
                <div
                  key={scenario.id}
                  className={`bg-white rounded-lg border px-4 py-4 transition-colors ${
                    isDone ? "border-blue-200" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-400">
                      場面 {idx + 1} / {scale.scenarios!.length}
                    </span>
                    <span className={`text-xs ${isDone ? "text-blue-600" : "text-gray-400"}`}>
                      {selected.length} / {scenario.select_count} 選択
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    {scenario.text}
                  </p>
                  <div className="space-y-2">
                    {scenario.options.map((opt) => {
                      const isSelected = selected.includes(opt.id);
                      const isDisabled = isFull && !isSelected;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleScenarioToggle(scenario.id, opt.id, scenario.select_count)}
                          disabled={isDisabled}
                          className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                            isSelected
                              ? "bg-blue-50 border-blue-300 text-blue-800"
                              : isDisabled
                                ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded border mr-2 text-xs ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-300 text-gray-400"
                          }`}>
                            {isSelected ? "✓" : ""}
                          </span>
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========== Likert形式（既存） ========== */
          <>
            {/* 選択肢凡例（モバイル: 一覧表示） */}
            <div className="sm:hidden bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4 text-xs text-gray-500">
              <span className="font-medium mr-2">選択肢：</span>
              {scale.response_options.map((opt, i) => (
                <span key={opt.value}>
                  <strong>{opt.value}</strong> = {opt.label}
                  {i < scale.response_options.length - 1 && <span className="mx-1.5 text-gray-300">|</span>}
                </span>
              ))}
            </div>

            {/* 選択肢ラベルヘッダー（デスクトップ: カラム固定表示） */}
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
          </>
        )}

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
            {allAnswered
              ? "結果を見る"
              : isScenario
                ? `あと${totalCount - answeredCount}場面回答してください`
                : `あと${totalCount - answeredCount}項目回答してください`}
          </Button>
        </div>
      </div>
    </main>
  );
}
