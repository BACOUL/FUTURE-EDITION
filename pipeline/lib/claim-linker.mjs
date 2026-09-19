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

function scoreTerms(claimText,evidenceText){
  const claim=[...new Set(claimTerms(claimText))];
  const evidence=[...new Set(claimTerms(evidenceText))];
  if(claim.length===0||evidence.length===0) return 0;

  const evidenceSet=new Set(evidence);
  const overlap=claim.filter(term=>evidenceSet.has(term)).length;
  if(overlap===0) return 0;

  const precision=overlap/evidence.length;
  const recall=overlap/claim.length;
  const f1=(2*precision*recall)/(precision+recall);

  const claimNumbers=claim.filter(term=>/^[0-9]+$/.test(term));
  const evidenceNumbers=new Set(evidence.filter(term=>/^[0-9]+$/.test(term)));
  const numericMismatch=claimNumbers.some(term=>!evidenceNumbers.has(term));

  return numericMismatch?f1*0.5:f1;
}

export function linkClaimToDocument(claimText,document,{minScore=0.12}={}){
  if(!document?.id||!Array.isArray(document.sections)) return null;

  let best=null;

  for(const section of document.sections){
    for(const range of sentenceRanges(section.text)){
      const score=scoreTerms(claimText,range.text);
      if(!best||score>best.score){
        best={section,range,score};
      }
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
