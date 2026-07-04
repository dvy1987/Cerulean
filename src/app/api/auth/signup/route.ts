import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isUsernameAvailable,
  setProfileUsername,
} from "@/lib/auth/username";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3–32 characters (letters, numbers, underscore)" },
        { status: 400 }
      );
    }
    if (!email?.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (!(await isUsernameAvailable(username))) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.toLowerCase() } },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      try {
        await setProfileUsername(data.user.id, username.toLowerCase());
      } catch {
        // Trigger may have set it from metadata
      }
    }

    return NextResponse.json({
      success: true,
      message: data.session
        ? "Account created"
        : "Account created — check email if confirmation is enabled, then sign in.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
