"use client";

import { useState, useEffect, useCallback } from "react";

type Token = {
  id: string;
  email: string;
  note: string | null;
  max_uses: number;
  use_count: number;
  expires_at: string;
  created_at: string;
  revoked: boolean;
  uses: Array<{ at: string; ip: string }>;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function StatusBadge({ token }: { token: Token }) {
  const expired = new Date(token.expires_at) < new Date();
  if (token.revoked) return <span style={badge("#ef4444")}>失効</span>;
  if (expired) return <span style={badge("#9ca3af")}>期限切れ</span>;
  if (token.use_count >= token.max_uses) return <span style={badge("#f59e0b")}>上限到達</span>;
  return <span style={badge("#10b981")}>有効</span>;
}

function badge(color: string) {
  return {
    background: color,
    color: "#fff",
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: "bold",
  } as React.CSSProperties;
}

// ログインフォーム
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      onLogin();
    } else {
      setError("パスワードが正しくありません");
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", padding: 32, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 24, textAlign: "center" }}>
        管理者ログイン
      </h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          required
          style={inputStyle}
        />
        {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{error}</p>}
        <button type="submit" disabled={loading} style={btnStyle("#1d4ed8")}>
          {loading ? "認証中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}

// トークン発行フォーム
function IssueForm({ onIssued }: { onIssued: () => void }) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [maxUses, setMaxUses] = useState(3);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [accessUrl, setAccessUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, note, max_uses: maxUses, expires_in_days: expiresInDays }),
    });
    if (res.ok) {
      const data = await res.json();
      setAccessUrl(data.access_url);
      setMessage(`発行しました。以下のリンクを ${email} に共有してください。`);
      setEmail("");
      setNote("");
      onIssued();
    } else {
      const d = await res.json();
      setMessage(`エラー: ${d.error}`);
      setAccessUrl("");
    }
    setLoading(false);
  }

  return (
    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 24, marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>アクセス権を発行</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス *"
          required
          style={inputStyle}
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="メモ（例: 田中さん）"
          style={inputStyle}
        />
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>使用回数上限</label>
            <input
              type="number"
              min={1}
              max={100}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>有効期限</label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              style={inputStyle}
            >
              <option value={1}>1日</option>
              <option value={7}>1週間</option>
              <option value={30}>1ヶ月</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} style={btnStyle("#1d4ed8")}>
          {loading ? "送信中..." : "発行してメールを送る"}
        </button>
        {message && <p style={{ fontSize: 13, color: "#6b7280" }}>{message}</p>}
        {accessUrl && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 6, padding: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                readOnly
                value={accessUrl}
                style={{ ...inputStyle, flex: 1, fontSize: 12, background: "#fff" }}
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(accessUrl);
                }}
                style={{ ...btnStyle("#10b981"), width: "auto", padding: "8px 16px", whiteSpace: "nowrap" }}
              >
                コピー
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

// トークン一覧
function TokenList({ tokens, onRevoke }: { tokens: Token[]; onRevoke: (id: string) => void }) {
  if (tokens.length === 0) {
    return <p style={{ color: "#9ca3af", fontSize: 14 }}>発行済みトークンはありません</p>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {tokens.map((t) => (
        <div
          key={t.id}
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 16,
            opacity: t.revoked ? 0.6 : 1,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <strong style={{ fontSize: 15 }}>{t.email}</strong>
              {t.note && <span style={{ color: "#6b7280", fontSize: 13, marginLeft: 8 }}>({t.note})</span>}
            </div>
            <StatusBadge token={t} />
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", display: "grid", gap: 2 }}>
            <span>使用回数: {t.use_count} / {t.max_uses}</span>
            <span>有効期限: {formatDate(t.expires_at)}</span>
            <span>発行日時: {formatDate(t.created_at)}</span>
            {t.uses.length > 0 && (
              <details style={{ marginTop: 4 }}>
                <summary style={{ cursor: "pointer" }}>アクセス履歴 ({t.uses.length}件)</summary>
                <div style={{ marginTop: 4, paddingLeft: 8 }}>
                  {t.uses.map((u, i) => (
                    <div key={i}>{formatDate(u.at)} — {u.ip}</div>
                  ))}
                </div>
              </details>
            )}
          </div>
          {!t.revoked && (
            <button
              onClick={() => onRevoke(t.id)}
              style={{ ...btnStyle("#ef4444"), marginTop: 12, padding: "4px 12px", fontSize: 12 }}
            >
              失効させる
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// メイン
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);

  const fetchTokens = useCallback(async () => {
    const res = await fetch("/api/admin/tokens");
    if (res.ok) {
      setTokens(await res.json());
      setLoggedIn(true);
    } else if (res.status === 401) {
      setLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTokens();
  }, [fetchTokens]);

  async function handleRevoke(id: string) {
    if (!confirm("このトークンを失効させますか？")) return;
    await fetch(`/api/admin/tokens/${id}`, { method: "DELETE" });
    fetchTokens();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
  }

  if (loggedIn === null) return null;
  if (!loggedIn) return <LoginForm onLogin={fetchTokens} />;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: "bold" }}>アクセス管理</h1>
        <button onClick={handleLogout} style={btnStyle("#6b7280")}>ログアウト</button>
      </div>
      <IssueForm onIssued={fetchTokens} />
      <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>発行済みトークン</h2>
      <TokenList tokens={tokens} onRevoke={handleRevoke} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 4,
};

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
  };
}
