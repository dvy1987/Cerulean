import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveEmailForLogin(
  usernameOrEmail: string
): Promise<string | null> {
  const input = usernameOrEmail.trim();
  if (input.includes("@")) return input;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .ilike("username", input)
    .maybeSingle();

  if (error || !data?.email) return null;
  return data.email;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", username.trim())
    .maybeSingle();
  return !data;
}

export async function setProfileUsername(
  userId: string,
  username: string
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ username: username.trim(), updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}
