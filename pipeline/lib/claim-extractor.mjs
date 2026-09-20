import { createEvidenceLocator } from "./evidence-locator.mjs";
import { inferSubjectScope } from "./evidence-engine.mjs";

const normalize=value=>String(value??"").replace(/\s+/g," ").trim();

function sentenceRanges(text){
  const value=String(text??"");
  const out=[];
  let start=0;
  const push=end=>{
    let left=start,right=end;
    while(left<right&&/\s/.test(value[left])) left++;
    while(right>left&&/\s/.test(value[right-1])) right--;
    if(right-left>=20) out.push({start:left,end:right,text:value.slice(left,right)});
    start=end;
  };
  for(let i=0;i<value.length;i++){
    const ch=value[i];
    if(!".!?".includes(ch)) continue;
    if(ch==="."&&/\d/.test(value[i-1]??"")&&/\d/.test(value[i+1]??"")) continue;
    if(ch==="."&&/[A-Za-z]/.test(value[i-1]??"")&&/[A-Za-z]/.test(value[i+1]??"")) continue;
    push(i+1);
  }
  if(start<value.length) push(value.length);
  return out;
}

function clauseRanges(range){
  const value=range.text;
  const boundaries=[];
  for(let i=0;i<value.length;i++){
    if(value[i]===";" && i>=24 && value.length-i>=24) boundaries.push(i+1);
  }
  if(boundaries.length===0) return [range];
  const out=[];
  let localStart=0;
  for(const boundary of [...boundaries,value.length]){
    let left=localStart,right=boundary;
    while(left<right&&/\s/.test(value[left])) left++;
    while(right>left&&/\s/.test(value[right-1])) right--;
    if(right-left>=20){
      out.push({
        start:range.start+left,
        end:range.start+right,
        text:value.slice(left,right)
      });
    }
    localStart=boundary;
  }
  return out.length?out:[range];
}

function claimKind(text,sectionTitle=""){
  const value=(String(sectionTitle)+" "+String(text)).toLowerCase();
  if(/\b(?:no significant|not significant|did not|failed to|no difference|no improvement)\b/.test(value)) return "negative_result";
  if(/\b(?:limitation|limited by|caution|uncertain|cannot conclude)\b/.test(value)) return "limitation";
  if(/\b(?:corrected|correction|erratum|retracted|retraction|expression of concern)\b/.test(value)) return "correction";
  if(/\b(?:increased|decreased|reduced|improved|greater|lower|higher|associated|noninferior|superior|showed|found|resulted|demonstrated|reported)\b/.test(value)) return "result";
  return "context";
}

function informationScore(text,sectionTitle=""){
  const value=String(text).toLowerCase();
  let score=0;
  if(/\b(?:increased|decreased|reduced|improved|greater|lower|higher|associated|noninferior|superior|showed|found|resulted|demonstrated|reported)\b/.test(value)) score+=3;
  if(/\b(?:randomized|randomised|double-blind|placebo-controlled|phase\s*[123i]+|systematic review|meta-analysis|cohort|trial)\b/.test(value)) score+=2;
  if(/\b(?:no significant|not significant|did not|failed to|no difference|no improvement)\b/.test(value)) score+=2;
  if(/\d/.test(value)) score+=1;
  if(/result|finding|conclusion|outcome|why stopped/i.test(sectionTitle)) score+=1;
  if(/^(?:background|objective|objectives|aim|aims|purpose)\b/i.test(value)) score-=1;
  return score;
}

export function extractAtomicClaims(document,{source=null,maxClaims=80,minLength=20,maxLength=420}={}){
  if(!document?.id||!Array.isArray(document.sections)) return [];
  const scope=inferSubjectScope(source);
  const candidates=[];

  for(const section of document.sections){
    for(const sentence of sentenceRanges(section.text)){
      const units=clauseRanges(sentence);
      for(const unit of units){
        const text=normalize(unit.text);
        if(text.length<minLength||text.length>maxLength) continue;
        const reference=createEvidenceLocator(document,section.id,unit.start,unit.end);
        candidates.push({
          text,
          claim_kind:claimKind(text,section.title),
          subject_scope:scope,
          score:informationScore(text,section.title),
          review_state:"machine_proposed",
          evidence:[{
            locator:reference.locator,
            excerpt_hash:reference.excerpt_hash,
            support:"supports"
          }]
        });
      }
    }
  }

  return candidates
    .sort((a,b)=>b.score-a.score||a.text.localeCompare(b.text))
    .slice(0,maxClaims);
}
