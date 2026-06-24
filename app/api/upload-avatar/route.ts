import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  sanitizeSupabaseKey,
  validateSupabaseKey,
  friendlySupabaseError,
} from "@/lib/supabaseKeys";

const MAX_BYTES = 2 * 1024 * 1024;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = sanitizeSupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anonKey = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL is not set on the server" },
      { status: 503 }
    );
  }

  const key = serviceKey ?? anonKey;
  if (!key) {
    return NextResponse.json(
      {
        error:
          "Missing Supabase key — set SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel",
      },
      { status: 503 }
    );
  }

  const keyError = validateSupabaseKey(key);
  if (keyError) {
    return NextResponse.json({ error: keyError }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const slug = formData.get("slug");
  const file = formData.get("file");

  if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Invalid captain slug" }, { status: 400 });
  }
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 2 MB)" }, { status: 400 });
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await client.storage.from("avatars").upload(`${slug}.webp`, buffer, {
    upsert: true,
    contentType: "image/webp",
  });

  if (error) {
    const message = friendlySupabaseError(error.message);
    console.error("[upload-avatar]", error.message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    url: `${url}/storage/v1/object/public/avatars/${slug}.webp`,
  });
}
