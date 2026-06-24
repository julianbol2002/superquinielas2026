/** Trim whitespace and accidental wrapping quotes from Vercel/Supabase copy-paste. */
export function sanitizeSupabaseKey(
  key: string | undefined
): string | undefined {
  if (!key) return undefined;
  let trimmed = key.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
}

/** Returns a user-facing message when the key format is wrong, else null. */
export function validateSupabaseKey(key: string | undefined): string | null {
  const sanitized = sanitizeSupabaseKey(key);
  if (!sanitized) {
    return "Supabase API key is missing";
  }
  if (!sanitized.startsWith("eyJ")) {
    return "Invalid Supabase API key — paste the anon or service_role JWT from Supabase → Settings → API (starts with eyJ)";
  }
  if (sanitized.split(".").length !== 3) {
    return "Invalid Supabase API key — JWT must have three segments separated by dots";
  }
  return null;
}

/** Map cryptic Supabase auth errors to actionable setup hints. */
export function friendlySupabaseError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("jws") ||
    lower.includes("jwt") ||
    lower.includes("invalid api key")
  ) {
    return "Invalid Supabase API key on the server — in Vercel, re-copy NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY from Supabase → Settings → API (no extra spaces or quotes)";
  }
  if (lower.includes("row-level security") || lower.includes("policy")) {
    return "Storage permission denied — run the avatars SQL block in supabase/schema.sql";
  }
  if (lower.includes("bucket") && lower.includes("not found")) {
    return "avatars bucket not found — run the Storage SQL in supabase/schema.sql";
  }
  return message;
}
