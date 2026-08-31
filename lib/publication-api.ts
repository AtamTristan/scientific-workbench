import type { ScientificVisualizationArtifact } from "@/lib/scientific-artifacts/schema";

export type PublicationResult = {
  publication: {
    publicationId: string;
    slug: string;
    version: number;
    status: "published";
  };
  bundleUrl: string;
};

function apiBase() {
  return (process.env.NEXT_PUBLIC_SCIENTIFIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
}

async function expectJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error((await response.text()) || `Scientific API returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function publishArtifact(artifact: ScientificVisualizationArtifact, slug: string): Promise<PublicationResult> {
  await expectJson(await fetch(`${apiBase()}/api/v1/artifacts`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(artifact),
  }));
  const result = await expectJson<PublicationResult>(await fetch(`${apiBase()}/api/v1/artifacts/${encodeURIComponent(artifact.id)}/publish`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }),
  }));
  return { ...result, bundleUrl: `${apiBase()}${result.bundleUrl}` };
}
