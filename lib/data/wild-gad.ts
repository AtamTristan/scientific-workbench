export type ModelKey = "mbert" | "scibert" | "roberta" | "sbert-minilm" | "sbert-specter" | "e5-small";
export type DatasetKey = "cora" | "pubmed" | "amazon_computers" | "reddit2_s50000" | "webkb" | "wikics" | "yelp_s50000";

export type ModelMetric = {
  key: ModelKey; label: string; variance: readonly [number, number, number];
  intra: number; inter: number; ratio: number; separation: number;
  sameDomainRatio: number; crossDomainRatio: number;
};

export const models: readonly ModelMetric[] = [
  { key: "mbert", label: "mBERT", variance: [47.97, 29.74, 3.29], intra: .0326, inter: .1446, ratio: 4.44, separation: .78, sameDomainRatio: 5.49, crossDomainRatio: 4.26 },
  { key: "scibert", label: "SciBERT", variance: [57.36, 19.51, 6.02], intra: .0350, inter: .1800, ratio: 5.14, separation: .71, sameDomainRatio: 6.82, crossDomainRatio: 4.86 },
  { key: "roberta", label: "RoBERTa", variance: [65.14, 12.2, 4.72], intra: .0134, inter: .0684, ratio: 5.10, separation: .72, sameDomainRatio: 6.68, crossDomainRatio: 4.83 },
  { key: "sbert-minilm", label: "SBERT MiniLM", variance: [33.53, 8.38, 4.93], intra: .1590, inter: .3146, ratio: 1.98, separation: .99, sameDomainRatio: 2.00, crossDomainRatio: 1.98 },
  { key: "sbert-specter", label: "SBERT SPECTER", variance: [65.0, 7.37, 4.92], intra: .0219, inter: .0785, ratio: 3.59, separation: .78, sameDomainRatio: 4.40, crossDomainRatio: 3.45 },
  { key: "e5-small", label: "E5-small", variance: [39.18, 6.41, 3.6], intra: .0286, inter: .0629, ratio: 2.20, separation: .95, sameDomainRatio: 2.30, crossDomainRatio: 2.18 },
] as const;

export const datasets = [
  { key: "cora", label: "Cora", shortLabel: "Cora", domain: "Citation", color: "#7dd3fc" },
  { key: "pubmed", label: "PubMed", shortLabel: "PubMed", domain: "Citation", color: "#a78bfa" },
  { key: "amazon_computers", label: "Amazon Computers", shortLabel: "Amazon", domain: "Reviews", color: "#fb7185" },
  { key: "reddit2_s50000", label: "Reddit2", shortLabel: "Reddit", domain: "Social", color: "#fbbf24" },
  { key: "webkb", label: "WebKB", shortLabel: "WebKB", domain: "Web", color: "#34d399" },
  { key: "wikics", label: "WikiCS", shortLabel: "WikiCS", domain: "Web", color: "#60a5fa" },
  { key: "yelp_s50000", label: "Yelp", shortLabel: "Yelp", domain: "Reviews", color: "#f472b6" },
] as const satisfies readonly { key: DatasetKey; label: string; shortLabel: string; domain: string; color: string }[];

// Reported seminar result at sampling size 4,000.
export const top1: Record<DatasetKey, Record<ModelKey, DatasetKey>> = {
  amazon_computers: { "e5-small": "cora", mbert: "pubmed", roberta: "cora", "sbert-minilm": "cora", "sbert-specter": "cora", scibert: "cora" },
  cora: { "e5-small": "pubmed", mbert: "amazon_computers", roberta: "amazon_computers", "sbert-minilm": "pubmed", "sbert-specter": "reddit2_s50000", scibert: "amazon_computers" },
  pubmed: { "e5-small": "cora", mbert: "reddit2_s50000", roberta: "reddit2_s50000", "sbert-minilm": "reddit2_s50000", "sbert-specter": "yelp_s50000", scibert: "reddit2_s50000" },
  reddit2_s50000: { "e5-small": "pubmed", mbert: "pubmed", roberta: "pubmed", "sbert-minilm": "pubmed", "sbert-specter": "pubmed", scibert: "pubmed" },
  webkb: { "e5-small": "cora", mbert: "cora", roberta: "cora", "sbert-minilm": "cora", "sbert-specter": "cora", scibert: "cora" },
  wikics: { "e5-small": "cora", mbert: "pubmed", roberta: "pubmed", "sbert-minilm": "pubmed", "sbert-specter": "yelp_s50000", scibert: "yelp_s50000" },
  yelp_s50000: { "e5-small": "pubmed", mbert: "wikics", roberta: "wikics", "sbert-minilm": "pubmed", "sbert-specter": "pubmed", scibert: "wikics" },
};

export const samplingStability = { budgetA: 3000, budgetB: 4000, top1StableFraction: .86, configurations: 42 } as const;
