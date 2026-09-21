import { pathToFileURL } from "node:url";
import { resolveCandidate } from "./lib/source-resolver.mjs";

const CUTOFF = "2026-06-01";

const plans = [
  {
    id: "P-Q001-PUBMED",
    provider: "pubmed",
    question_id: "Q-001",
    query: '(cancer[Title/Abstract]) AND ("randomized trial"[Title/Abstract] OR "phase 3"[Title/Abstract]) AND 2026/06/01:3000[pdat]'
  },
  {
    id: "P-Q003-PUBMED",
    provider: "pubmed",
    question_id: "Q-003",
    query: '"spinal cord injury"[Title/Abstract] AND (stimulation[Title/Abstract] OR neuroprosthesis[Title/Abstract] OR "brain-spine"[Title/Abstract]) AND 2026/06/01:3000[pdat]'
  },
  {
    id: "P-Q007-PUBMED",
    provider: "pubmed",
    question_id: "Q-007",
    query: '(CRISPR[Title/Abstract] OR "gene editing"[Title/Abstract]) AND (clinical[Title/Abstract] OR trial[Title/Abstract]) AND 2026/06/01:3000[pdat]'
  },
  {
    id: "P-Q005-ARXIV",
    provider: "arxiv",
    question_id: "Q-005",
    query: 'all:"robot manipulation" AND (all:generalization OR all:autonomy)'
  },
  {
    id: "P-Q008-ARXIV",
    provider: "arxiv",
    question_id: "Q-008",
    query: 'all:"scientific discovery" AND (all:agent OR all:autonomous)'
  },
  {
    id: "P-Q009-ARXIV",
    provider: "arxiv",
    question_id: "Q-009",
    query: 'all:"quantum error correction"'
  }
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchRetry(url, options = {}, attempts = 4) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, options);
      last = response;
      if (response.ok) return response;
      if (![429,500,502,503,504].includes(response.status)) return response;
    } catch (error) {
      last = error;
    }
    await wait(500 * Math.pow(2, i));
  }
  if (last instanceof Error) throw last;
  return last;
}

const decodeXml = (value) => String(value ?? "")
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&quot;", '"')
  .replaceAll("&apos;", "'");

function atomValue(xml, tag) {
  const m = String(xml).match(new RegExp("<"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+tag+">", "i"));
  return m ? decodeXml(m[1]).replace(/\s+/g, " ").trim() : null;
}

function arxivEntries(xml) {
  const out = [];
  const re = /<entry>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = re.exec(String(xml))) !== null) {
    const entry = m[1];
    const idUrl = atomValue(entry, "id");
    const id = String(idUrl ?? "").split("/abs/").pop()?.replace(/v\d+$/i, "");
    const published = atomValue(entry, "published");
    const title = atomValue(entry, "title");
    if (id) out.push({ id, published, title });
  }
  return out;
}

async function collectPubmed(plan, perPlan) {
  const url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax="+perPlan+"&sort=pub+date&term="+encodeURIComponent(plan.query);
  const response = await fetchRetry(url,{headers:{accept:"application/json"}});
  if (!response?.ok) return { plan_id: plan.id, status:"collection_failed", http_status:response?.status ?? null, entries:[] };
  const payload = await response.json();
  const ids = payload?.esearchresult?.idlist ?? [];
  return {
    plan_id: plan.id,
    status:"ok",
    entries: ids.map((id) => ({
      question_id: plan.question_id,
      signal_kind:"pmid",
      raw_value:String(id),
      origin:"pubmed",
      hint_date:null,
      hint_title:null
    }))
  };
}

async function collectArxiv(plan, perPlan) {
  const url = "https://export.arxiv.org/api/query?search_query="+encodeURIComponent(plan.query)+"&start=0&max_results="+perPlan+"&sortBy=submittedDate&sortOrder=descending";
  const response = await fetchRetry(url,{headers:{accept:"application/atom+xml,application/xml,text/xml"}});
  if (!response?.ok) return { plan_id: plan.id, status:"collection_failed", http_status:response?.status ?? null, entries:[] };
  const entries = arxivEntries(await response.text())
    .filter((x) => !x.published || x.published.slice(0,10) >= CUTOFF)
    .map((x) => ({
      question_id: plan.question_id,
      signal_kind:"arxiv",
      raw_value:x.id,
      origin:"arxiv",
      hint_date:x.published?.slice(0,10) ?? null,
      hint_title:x.title ?? null
    }));
  return { plan_id: plan.id, status:"ok", entries };
}

export async function runLivingSlice({perPlan=3, retrievedAt=new Date().toISOString()}={}) {
  const collections = [];
  for (const plan of plans) {
    const result = plan.provider === "pubmed"
      ? await collectPubmed(plan, perPlan)
      : await collectArxiv(plan, perPlan);
    collections.push(result);
  }

  const pre = [];
  const seenSignal = new Set();
  for (const batch of collections) {
    for (const item of batch.entries) {
      const key = item.signal_kind+":"+item.raw_value.toLowerCase();
      if (seenSignal.has(key)) continue;
      seenSignal.add(key);
      pre.push(item);
    }
  }

  const resolved = [];
  const unresolved = [];
  let ordinal = 1;
  for (const item of pre) {
    const candidate = {
      id:"CAND-"+String(60000+ordinal).padStart(6,"0"),
      received_at:retrievedAt,
      signal_kind:item.signal_kind,
      raw_value:item.raw_value,
      question_ids:[item.question_id],
      origin:item.origin,
      signal_url:null,
      notes:"FE-06R2 living editorial input slice; candidate only, no scientific state change without review."
    };
    ordinal++;
    const result = await resolveCandidate(candidate,{fetchFn:fetch,retrievedAt});
    const row = {
      candidate,
      source_hint:{title:item.hint_title,date:item.hint_date},
      resolution:{
        status:result.status,
        provider:result.provider,
        reason:result.reason ?? null,
        publication_status:result.publication_status ?? null,
        source:result.source ?? null
      },
      editorial_status:"candidate_only",
      human_review_required:true,
      canonical_state_effect:"none_until_review"
    };
    if (result.status === "resolved" && result.source) resolved.push(row);
    else unresolved.push(row);
  }

  const deduped = [];
  const seenOrigin = new Set();
  for (const row of resolved) {
    const source = row.resolution.source;
    const key = String(source.independence_group ?? (source.url || source.external_id)).toLowerCase();
    if (seenOrigin.has(key)) continue;
    seenOrigin.add(key);
    deduped.push(row);
  }

  const perQuestion = new Map();
  for (const row of deduped) {
    const qid=row.candidate.question_ids[0];
    if(!perQuestion.has(qid)) perQuestion.set(qid,[]);
    if(perQuestion.get(qid).length<2) perQuestion.get(qid).push(row);
  }
  const selected=[...perQuestion.values()].flat().slice(0,10);

  return {
    schema_version:"fe06r/r2-living-editorial-input/v1",
    generated_at:retrievedAt,
    cutoff:CUTOFF,
    candidate_policy:"candidate_only; no claim, assessment or Change is promoted without explicit review",
    plans:collections.map((x)=>({plan_id:x.plan_id,status:x.status,http_status:x.http_status??null,detected:x.entries.length})),
    metrics:{
      raw_detected:pre.length,
      resolved:resolved.length,
      unresolved:unresolved.length,
      deduplicated_resolved:deduped.length,
      selected:selected.length,
      questions_covered:new Set(selected.flatMap((x)=>x.candidate.question_ids)).size,
      technology_questions_covered:new Set(selected.flatMap((x)=>x.candidate.question_ids).filter((x)=>["Q-005","Q-008","Q-009"].includes(x))).size
    },
    candidates:selected,
    unresolved:unresolved.map((x)=>({
      candidate_id:x.candidate.id,
      question_ids:x.candidate.question_ids,
      signal_kind:x.candidate.signal_kind,
      raw_value:x.candidate.raw_value,
      provider:x.resolution.provider,
      reason:x.resolution.reason
    }))
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg=process.argv.find((x)=>x.startsWith("--per-plan="));
  const perPlan=arg?Number(arg.split("=")[1]):3;
  const out=await runLivingSlice({perPlan});
  process.stdout.write(JSON.stringify(out,null,2)+"\n");
}
