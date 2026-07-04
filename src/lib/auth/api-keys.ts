import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const KEY_PREFIX = "cer_";

export function generateApiKey(): { rawKey: string; prefix: string; hash: string } {
  const secret = randomBytes(32).toString("base64url");
  const rawKey = `${KEY_PREFIX}${secret}`;
  const prefix = rawKey.slice(0, 12);
  const hash = hashApiKey(rawKey);
  return { rawKey, prefix, hash };
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function isApiKeyToken(token: string): boolean {
  return token.startsWith(KEY_PREFIX);
}

export async function validateApiKey(
  rawKey: string
): Promise<{ userId: string; keyId: string } | null> {
  if (!isApiKeyToken(rawKey)) return null;

  const prefix = rawKey.slice(0, 12);
  const hash = hashApiKey(rawKey);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("api_keys")
    .select("id, user_id, key_hash")
    .eq("key_prefix", prefix)
    .maybeSingle();

  if (error || !data || data.key_hash !== hash) return null;

  await admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { userId: data.user_id, keyId: data.id };
}
