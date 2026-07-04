import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateApiKey, isApiKeyToken } from "@/lib/auth/api-keys";

export interface AuthContext {
  userId: string;
  method: "session" | "api_key";
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthContext | null> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();

    if (isApiKeyToken(token)) {
      const apiAuth = await validateApiKey(token);
      if (apiAuth) {
        return { userId: apiAuth.userId, method: "api_key" };
      }
      return null;
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { userId: user.id, method: "session" };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
