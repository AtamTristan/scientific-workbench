"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Braces, Check, Code2, Database, Download, ExternalLink, FileJson,
  FlaskConical, Images, NotebookTabs, Play, Table2, Workflow,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { wildGadExampleArtifact as wildGadArtifact } from "@/examples/artifacts/wild-gad";
import { publishArtifact, type PublicationResult } from "@/lib/publication-api";

const runs = [
  { id: "legacy-seminar-matrix", experiment: "Cross-dataset matrix", status: "Imported", artifacts: 8 },
  { id: "pca-3d-six-models", experiment: "PCA projection export", status: "Validated", artifacts: 7 },
  { id: "sampling-stability", experiment: "3k / 4k stability", status: "Imported", artifacts: 4 },
];

const navigationItems = [
  { icon: Workflow, label: "Overview" },
  { icon: FlaskConical, label: "Experiments" },
  { icon: Play, label: "Runs" },
  { icon: FileJson, label: "Artifacts" },
  { icon: Braces, label: "Findings" },
];

const futureTools = [
  { icon: Code2, label: "Editors" },
  { icon: NotebookTabs, label: "Notebooks" },
  { icon: Database, label: "Data tools" },
];

const projectData = [
  { icon: Database, title: "PCA-3D projections", detail: "6 models · 63,000 points", path: "public/data/projections" },
  { icon: Table2, title: "Analysis matrices", detail: "Matrix, summary and screening results", path: "projects/wild-gad/artifacts" },
  { icon: Images, title: "PCA figures", detail: "6 preserved seminar figures", path: "analysis/matrix/figures/pca" },
  { icon: FileJson, title: "Selections", detail: "Rankings, top-k, drift and stability", path: "artifacts/legacy-seminar/selections" },
];

export function ProjectWorkspace() {
  const [downloaded, setDownloaded] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publication, setPublication] = useState<PublicationResult | null>(null);
  const [publishError, setPublishError] = useState("");
  const visualizerUrl = process.env.NEXT_PUBLIC_VISUALIZER_URL ?? "http://127.0.0.1:5173";
  const download = () => {
    const blob = new Blob([JSON.stringify(wildGadArtifact, null, 2)], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = "wild-gad-embedding-space.artifact.json";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1800);
  };
  const publish = async () => {
    setPublishing(true); setPublishError("");
    try { setPublication(await publishArtifact(wildGadArtifact, "wild-gad")); }
    catch (error) { setPublishError(error instanceof Error ? error.message : "Publication failed"); }
    finally { setPublishing(false); }
  };

  return <div className="workspace">
    <aside className="work-nav">
      <div className="work-brand"><Image className="work-brand-logo" src="/scientific-platform-mark-64.png" width={36} height={36} alt=""/><span>Scientific<br/><b>Workbench</b></span></div>
      <nav>{navigationItems.map(({icon:Icon,label})=><button key={label} className={label==="Overview"?"active":""}><Icon size={16}/>{label}</button>)}</nav>
      <div className="future-tools"><span>SCIENTIFIC PROGRAMMING</span>{futureTools.map(({icon:Icon,label})=><div key={label}><Icon size={15}/>{label}<small>Later</small></div>)}</div>
      <Link href={visualizerUrl}>← Science Visualizer</Link>
    </aside>
    <main className="work-main">
      <div className="project-top"><div><span className="status-pill">ACTIVE · RESEARCH MODE</span><h1>WILD-GAD Embedding Space Analysis</h1><p>Seminar project · Semantic Information Systems</p></div><div className="project-actions"><Button variant="outline" onClick={download}>{downloaded?<Check size={15}/>:<Download size={15}/>} {downloaded?"Exported":"Export artifact"}</Button><Button onClick={publish} disabled={publishing}>{publishing?"Publishing…":"Publish via API"}</Button>{publication&&<span className="publish-status success">Published v{publication.publication.version}</span>}{publishError&&<span className="publish-status error">{publishError}</span>}</div></div>
      <Tabs defaultValue="overview">
        <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="runs">Runs</TabsTrigger><TabsTrigger value="data">Project data</TabsTrigger><TabsTrigger value="artifacts">Visualization artifacts</TabsTrigger><TabsTrigger value="integration">Tool integrations</TabsTrigger></TabsList>
        <TabsContent value="overview">
          <div className="research-chain">{["Question","Hypothesis","Method","Experiment","Run","Artifact","Finding"].map((item,index)=><div key={item}><span>0{index+1}</span><b>{item}</b>{index<6&&<i>→</i>}</div>)}</div>
          <div className="work-grid"><section><div className="section-title"><h2>Recent runs</h2><span>3 imported</span></div>{runs.map(run=><div className="run-row" key={run.id}><Play size={15}/><div><b>{run.experiment}</b><code>{run.id}</code></div><span>{run.artifacts} artifacts</span><em>{run.status}</em></div>)}</section><section><div className="section-title"><h2>Visualization handoff</h2><span>Schema 1.0</span></div><div className="artifact-card"><div><FileJson/><span><b>Embedding Space</b><small>wild-gad-embedding-space-v1</small></span></div><dl><div><dt>Renderer</dt><dd>embedding-space</dd></div><div><dt>Source run</dt><dd>legacy-seminar-matrix</dd></div><div><dt>Claim status</dt><dd>exploratory</dd></div></dl><Link href={`${visualizerUrl}/research-cases/wild-gad`}>Open in Visualizer <ExternalLink size={13}/></Link></div></section></div>
        </TabsContent>
        <TabsContent value="runs"><div className="table-view">{runs.map(run=><div className="run-row" key={run.id}><Play/><div><b>{run.experiment}</b><code>{run.id}</code></div><span>{run.artifacts} artifacts</span><em>{run.status}</em></div>)}</div></TabsContent>
        <TabsContent value="data"><div className="data-inventory">{projectData.map(({icon:Icon,title,detail,path})=><div key={title}><Icon/><span><b>{title}</b><small>{detail}</small><code>{path}</code></span><em>IMPORTED</em></div>)}</div></TabsContent>
        <TabsContent value="artifacts"><div className="artifact-card wide"><h2>Scientific Visualization Artifact</h2><p>A versioned, validated boundary. The Workbench sends draft research provenance to FastAPI; the Visualizer consumes only an exported public release and still works without the API.</p><Button onClick={download}><Download/> Download JSON</Button>{publication&&<a className="bundle-link" href={publication.bundleUrl}>Download publication bundle <ExternalLink size={13}/></a>}</div></TabsContent>
        <TabsContent value="integration"><div className="integration-grid">{[["PyCharm","Code, tests, Python environments","Adapter boundary"],["Jupyter Notebook","Exploration and executable narratives","Notebook bridge"],["DataGrip","Database inspection and query workflows","Data-source adapter"],["Anaconda","Environment and package management","Environment manifest"]].map(([name,detail,status])=><div key={name}><small>{status}</small><h3>{name}</h3><p>{detail}</p><span>Planned · no fake integration</span></div>)}</div></TabsContent>
      </Tabs>
    </main>
  </div>;
}
