import { NextResponse } from "next/server";
import { z } from "zod";
import { createAnonServerClient } from "@/lib/supabase/server";

const serviceRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  serviceType: z.enum(["composition", "text-to-song", "mixing"]),
  description: z.string().min(20),
  budget: z.string().optional(),
  deadline: z.string().optional(),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = serviceRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const supabase = createAnonServerClient();
  const { error } = await supabase.schema("speu").from("service_requests").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    service_type: parsed.data.serviceType,
    description: parsed.data.description,
    budget: parsed.data.budget ?? null,
    deadline: parsed.data.deadline || null,
    source: "website",
  });

  if (error) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
