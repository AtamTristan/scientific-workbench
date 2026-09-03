import { NextResponse } from "next/server";
import { createExperimentPlan, inspectAdapter, repositoryAdapters } from "@/lib/workbench/adapters";
import { readWorkbenchState } from "@/lib/workbench/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const runId = url.searchParams.get("runId");
    const state = await readWorkbenchState();
    if (!projectId) return NextResponse.json({ adapters: repositoryAdapters });
    const project = state.projects.find((candidate) => candidate.id === projectId);
    if (!project) return NextResponse.json({ error: `Project ${projectId} does not exist.` }, { status: 404 });
    const diagnostic = await inspectAdapter(project);
    if (!runId) return NextResponse.json({ diagnostic });
    const run = state.runs.find((candidate) => candidate.id === runId && candidate.projectId === projectId);
    if (!run) return NextResponse.json({ error: `Run ${runId} does not exist for ${projectId}.` }, { status: 404 });
    return NextResponse.json({ diagnostic, plan: createExperimentPlan(project, run) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Adapter request failed." }, { status: 409 });
  }
}
