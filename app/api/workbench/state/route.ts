import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { applyWorkbenchAction, workbenchSnapshot } from "@/lib/workbench/store";
import { workbenchActionSchema } from "@/lib/workbench/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await workbenchSnapshot(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const action = workbenchActionSchema.parse(await request.json());
    await applyWorkbenchAction(action);
    return NextResponse.json(await workbenchSnapshot(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof ZodError ? error.issues.map((issue) => issue.message).join("; ") : error instanceof Error ? error.message : "Workbench action failed.";
    return NextResponse.json({ error: message }, { status: error instanceof ZodError ? 400 : 409 });
  }
}

