"use client";

import { useState } from "react";
import { isPersistenceEnabled } from "@/lib/config";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isPersistenceEnabled()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold mb-2">Supabase not configured</h1>
          <p className="text-sm text-muted">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable login.
          </p>
          <a href="/" className="inline-block mt-4 text-sm text-cerulean-600 hover:underline">
            Continue to app (local mode)
          </a>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Sign in failed");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim(),
        email: email.trim(),
        password,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Sign up failed");
      setLoading(false);
      return;
    }

    setMessage(data.message ?? "Account created — you can sign in now.");
    setMode("signin");
    setPassword("");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lifted border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cerulean-400 to-cerulean-600 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">C</span>
          </div>
          <h1 className="text-lg font-semibold text-cerulean-800">Cerulean</h1>
        </div>

        <p className="text-sm text-muted mb-6">
          {mode === "signin"
            ? "Sign in with your username and password."
            : "Create an account. Your username is stored in your profile; your password is secured by Supabase Auth."}
        </p>

        <form
          onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
          className="space-y-4"
        >
          <div>
            <label className="text-xs text-muted block mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
              autoComplete="username"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cerulean-100 focus:border-cerulean-300"
            />
            <p className="text-[10px] text-muted mt-1">Letters, numbers, underscore only</p>
          </div>

          {mode === "signup" && (
            <div>
              <label className="text-xs text-muted block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cerulean-100 focus:border-cerulean-300"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-muted block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cerulean-100 focus:border-cerulean-300"
            />
          </div>

          {message && (
            <p className="text-xs text-cerulean-700 bg-cerulean-50 border border-cerulean-100 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-medium py-2.5 bg-cerulean-500 text-white rounded-lg hover:bg-cerulean-600 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
          className="mt-4 text-xs text-cerulean-600 hover:text-cerulean-700"
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
