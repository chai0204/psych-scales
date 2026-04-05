"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "リンクが無効です。",
  revoked: "このリンクは無効化されています。",
  expired: "リンクの有効期限が切れています。",
  limit: "このリンクの使用回数上限に達しました。",
};

function AccessContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const error = params.get("error");

  useEffect(() => {
    if (token) {
      window.location.href = `/api/auth/verify?token=${token}`;
    }
  }, [token]);

  if (token) {
    return (
      <div style={{ textAlign: "center", marginTop: 80, color: "#6b7280" }}>
        <p>認証中...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "80px auto",
        padding: 32,
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16, color: "#1f2937" }}>
        アクセス制限
      </h1>
      {error ? (
        <p style={{ color: "#ef4444", marginBottom: 16 }}>
          {ERROR_MESSAGES[error] ?? "エラーが発生しました。"}
        </p>
      ) : null}
      <p style={{ color: "#6b7280", fontSize: 14 }}>
        このサイトはアクセスリンクが必要です。
        <br />
        管理者からメールで送られたリンクからアクセスしてください。
      </p>
    </div>
  );
}

export default function AccessPage() {
  return (
    <Suspense>
      <AccessContent />
    </Suspense>
  );
}
