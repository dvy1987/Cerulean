import { NextRequest, NextResponse } from "next/server";
import {
  authenticateRequest,
  unauthorizedResponse,
} from "@/lib/auth/request-auth";

const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

export function rateLimitResponse(request: NextRequest, userId: string): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const key = `${userId}:${ip}`;
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Too many requests — please slow down and try again shortly." },
      { status: 429 }
    );
  }

  return null;
}

export async function withRateLimit(
  request: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  return rateLimitResponse(request, userId);
}

export async function requireAuthWithRateLimit(
  request: NextRequest
): Promise<
  | { auth: { userId: string; method: "session" | "api_key" }; rateLimited: false }
  | { auth: null; rateLimited: true; response: NextResponse }
  | { auth: null; rateLimited: false; response: NextResponse }
> {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return { auth: null, rateLimited: false, response: unauthorizedResponse() };
  }
  const limited = rateLimitResponse(request, auth.userId);
  if (limited) {
    return { auth: null, rateLimited: true, response: limited };
  }
  return { auth, rateLimited: false };
}
