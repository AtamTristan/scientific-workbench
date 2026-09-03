import { NextResponse } from "next/server";
import { exportedExecutionResult } from "@/lib/workbench/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const missionId = new URL(request.url).searchParams.get("missionId");
  if (!missionId) return NextResponse.json({ error: "missionId is required." }, { status: 400 });
  try {
    const result = await exportedExecutionResult(missionId);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${missionId}.execution-result.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ExecutionResult export failed." }, { status: 404 });
  }
}
