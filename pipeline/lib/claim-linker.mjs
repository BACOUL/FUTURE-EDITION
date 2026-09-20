import { createEvidenceLocator } from "./evidence-locator.mjs";

const STOPWORDS=new Set([
  "a","an","and","are","as","at","be","been","between","by","for","from","had","has","have",
  "in","into","is","it","of","on","or","that","the","their","this","to","was","were","with"
]);

const IRREGULAR=new Map([
  ["mice","mouse"],
  ["children","child"],
  ["men","man"],
  ["women","woman"]
]);

function stem(token){
  if(IRREGULAR.has(token)) return IRREGULAR.get(token);
  if(token.length>5&&token.endsWith("ing")) return token.slice(0,-3);
  if(token.length>4&&token.endsWith("ed")) return token.slice(0,-2);
  if(token.length>4&&token.endsWith("ies")) return token.slice(0,-3)+"y";
  if(token.length>4&&token.endsWith("es")) return token.slice(0,-1);
  if(token.length>3&&token.endsWith("s")) return token.slice(0,-1);
  return token;
}

export function claimTerms(text){
  return String(text??"")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g," ")
    .split(" ")
    .filter(Boolean)
    .filter(token=>!STOPWORDS.has(token))
    .map(stem);
}

function sentenceRanges(text){
  const value=String(text??"");
  const ranges=[];
  let start=0;

  const push=end=>{
    let left=start;
    let right=end;
    while(left<right&&/\s/.test(value[left])) left++;
    while(right>left&&/\s/.test(value[right-1])) right--;
    if(right>left) ranges.push({start:left,end:right,text:value.slice(left,right)});
    start=end;
  };

  for(let i=0;i<value.length;i++){
    if(value[i]==="."||value[i]==="!"||value[i]==="?") push(i+1);
  }
  if(start<value.length) push(value.length);

  return ranges;
}

function bigrams(terms){
  const out=[];
  for(let i=0;i<terms.length-1;i++) out.push(terms[i]+" "+terms[i+1]);
  return out;
}

function documentFrequency(candidates){
  const df=new Map();
  for(const candidate of candidates){
    const unique=new Set(claimTerms(candidate.range.text));
    for(const term of unique) df.set(term,(df.get(term)??0)+1);
  }
  return df;
}

function scoreTerms(claimText,evidenceText,{df,totalCandidates,sectionTitle=""}={}){
  const claim=[...new Set(claimTerms(claimText))];
  const evidence=[...new Set(claimTerms(evidenceText))];
  if(claim.length===0||evidence.length===0) return 0;

  const evidenceSet=new Set(evidence);
  const weight=term=>1+Math.log((Math.max(1,totalCandidates)+1)/((df?.get(term)??0)+1));
  const totalClaimWeight=claim.reduce((sum,term)=>sum+weight(term),0);
  const overlapTerms=claim.filter(term=>evidenceSet.has(term));
  if(overlapTerms.length===0) return 0;

  const overlapWeight=overlapTerms.reduce((sum,term)=>sum+weight(term),0);
  const weightedRecall=overlapWeight/totalClaimWeight;
  const precision=overlapTerms.length/evidence.length;

  const claimSeq=claimTerms(claimText);
  const evidenceBigramSet=new Set(bigrams(claimTerms(evidenceText)));
  const claimBigrams=bigrams(claimSeq);
  const bigramRecall=claimBigrams.length
    ?claimBigrams.filter(term=>evidenceBigramSet.has(term)).length/claimBigrams.length
    :0;

  let score=0.72*weightedRecall+0.16*precision+0.12*bigramRecall;

  const claimNumbers=claim.filter(term=>/^[0-9]+$/.test(term));
  const evidenceNumbers=new Set(evidence.filter(term=>/^[0-9]+$/.test(term)));
  if(claimNumbers.some(term=>!evidenceNumbers.has(term))) score*=0.15;

  const claimRaw=String(claimText).toLowerCase();
  const evidenceRaw=String(evidenceText).toLowerCase();
  const resultClaim=/\b(?:reduced|increased|improved|greater|lower|higher|associated|noninferior|superior|reported|produced|showed|developed|included|uses?|primary endpoint|primary safety)\b/.test(claimRaw);
  const genericPurpose=/^(?:background|objective|objectives|aim|aims|purpose)?\s*:?[\s]*(?:the )?(?:aim|purpose|objective)\b/.test(evidenceRaw)||
    /\b(?:the purpose of (?:this|the) study|we aimed to|this study aimed to)\b/.test(evidenceRaw);
  if(resultClaim&&genericPurpose) score*=0.45;

  const claimNeg=/\b(?:no|not|did not|noninferior|without)\b/.test(claimRaw);
  const evidenceNeg=/\b(?:no|not|did not|noninferior|without)\b/.test(evidenceRaw);
  if(claimNeg!==evidenceNeg) score*=0.65;

  const title=String(sectionTitle).toLowerCase();
  if(/result|finding|conclusion|outcome/.test(title)) score*=1.06;

  return Math.min(1,score);
}

export function linkClaimToDocument(claimText,document,{minScore=0.12}={}){
  if(!document?.id||!Array.isArray(document.sections)) return null;

  const candidates=[];
  for(const section of document.sections){
    for(const range of sentenceRanges(section.text)){
      candidates.push({section,range});
    }
  }
  if(candidates.length===0) return null;

  const df=documentFrequency(candidates);
  let best=null;

  for(const candidate of candidates){
    const score=scoreTerms(claimText,candidate.range.text,{
      df,
      totalCandidates:candidates.length,
      sectionTitle:candidate.section.title
    });
    if(!best||score>best.score){
      best={...candidate,score};
    }
  }

  if(!best||best.score<minScore) return null;

  const reference=createEvidenceLocator(
    document,
    best.section.id,
    best.range.start,
    best.range.end
  );

  return {
    ...reference,
    section_id:best.section.id,
    section_title:best.section.title,
    score:Number(best.score.toFixed(6)),
    support:"supports"
  };
}
