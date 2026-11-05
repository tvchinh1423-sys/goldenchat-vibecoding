"use client";
import { useState } from "react";
import { loginCRM } from "@/lib/crm/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function CRMAccessPanel({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mx-auto max-w-md space-y-4 rounded-2xl border bg-white p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await loginCRM(password);
          setPassword("");
          onLogin();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Chưa đăng nhập được CRM.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-lg font-semibold">CRM Golden Palace</h2>
      <p className="text-sm leading-6 text-muted-foreground">
        Đăng nhập để quản lý khách hàng và lịch hẹn dùng chung của đội tư vấn.
      </p>
      <label className="block text-sm">
        Mật khẩu CRM
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={256}
          className="mt-2"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Đang mở CRM..." : "Đăng nhập CRM"}
      </Button>
    </form>
  );
}
