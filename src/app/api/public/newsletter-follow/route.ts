import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  email: z.string().email(),
  source: z.enum(["tilda", "website"]).optional().default("tilda"),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400, headers: corsHeaders }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const supabase = await createClient();
  const { error } = await supabase.schema("speu").from("newsletter_followers").insert({
    email,
    source: parsed.data.source,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true }, { headers: corsHeaders });
    }
    return NextResponse.json(
      { ok: false, error: "create_failed" },
      { status: 500, headers: corsHeaders }
    );
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}
