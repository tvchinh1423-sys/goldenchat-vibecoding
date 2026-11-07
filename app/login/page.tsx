"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LoginDialog } from "@/components/auth/login-dialog";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <LoginDialog
        open={true}
        onSuccess={() => {
          router.push("/inbox");
        }}
      />
    </div>
  );
}
