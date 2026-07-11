import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In | Twinkle & Hex",
  description: "Sign in to the Twinkle & Hex admin dashboard.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-ink mb-1 text-center">Twinkle & Hex</h1>
        <p className="text-sm text-plum mb-6 text-center">Sign in to continue</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
