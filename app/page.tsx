"use client";

import { useState } from "react";
import Link from "next/link";
import { getAllScales } from "@/lib/scales";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const scales = getAllScales();
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? scales.filter(
        (s) =>
          s.meta.name.includes(query) ||
          s.meta.short_name?.includes(query) ||
          s.meta.tags?.some((t) => t.includes(query)) ||
          s.meta.source.includes(query)
      )
    : scales;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">心理尺度</h1>
        <p className="text-gray-500 mb-8 text-sm">
          尺度を選択して回答を開始してください。回答結果はこのブラウザ上でのみ計算され、サーバーには送信されません。
        </p>

        <Input
          placeholder="尺度名・タグで検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-6"
        />

        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-12">該当する尺度が見つかりません</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((scale) => (
              <Link key={scale.meta.id} href={`/${scale.meta.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">
                          {scale.meta.name}
                          {scale.meta.short_name && (
                            <span className="text-sm font-normal text-gray-400 ml-2">
                              ({scale.meta.short_name})
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-0.5">{scale.meta.source}</CardDescription>
                      </div>
                      <div className="text-sm text-gray-400 shrink-0">
                        {scale.items.length}項目
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {scale.meta.description && (
                      <p className="text-sm text-gray-600 mb-2">{scale.meta.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {scale.meta.target && (
                        <Badge variant="outline" className="text-xs">対象: {scale.meta.target}</Badge>
                      )}
                      {scale.meta.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
