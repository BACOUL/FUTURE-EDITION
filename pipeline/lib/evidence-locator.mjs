import { createHash } from "node:crypto";

const sha256=text=>createHash("sha256").update(text).digest("hex");

export function createEvidenceLocator(document,sectionId,start,end){
  const section=(document.sections||[]).find(item=>item.id===sectionId);

  if(!section) throw new Error("unknown section "+sectionId);

  if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>section.text.length){
    throw new Error("invalid locator range");
  }

  const excerpt=section.text.slice(start,end);

  if(!excerpt.trim()) throw new Error("empty evidence excerpt");

  return {
    locator:document.id+"#"+sectionId+":"+start+"-"+end,
    excerpt_hash:sha256(excerpt),
    excerpt
  };
}

export function resolveEvidenceLocator(document,locator){
  const prefix=document.id+"#";

  if(typeof locator!=="string"||!locator.startsWith(prefix)){
    throw new Error("locator document mismatch");
  }

  const rest=locator.slice(prefix.length);
  const colon=rest.lastIndexOf(":");

  if(colon<1) throw new Error("invalid locator syntax");

  const sectionId=rest.slice(0,colon);
  const range=rest.slice(colon+1).split("-");

  if(range.length!==2) throw new Error("invalid locator range");

  const start=Number(range[0]);
  const end=Number(range[1]);
  const section=(document.sections||[]).find(item=>item.id===sectionId);

  if(!section) throw new Error("unknown section "+sectionId);

  if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>section.text.length){
    throw new Error("locator out of bounds");
  }

  return {
    section_id:sectionId,
    start,
    end,
    excerpt:section.text.slice(start,end)
  };
}

export function verifyEvidenceReference(document,reference){
  try{
    const resolved=resolveEvidenceLocator(document,reference.locator);

    if(reference.excerpt_hash&&sha256(resolved.excerpt)!==reference.excerpt_hash){
      return {ok:false,reason:"excerpt_hash_mismatch"};
    }

    return {ok:true,reason:null,...resolved};
  }catch(error){
    return {ok:false,reason:String(error?.message??error)};
  }
}

export function verifyClaimEvidenceLocators(document,claimDrafts=[]){
  const errors=[];

  for(let claimIndex=0;claimIndex<claimDrafts.length;claimIndex++){
    const claim=claimDrafts[claimIndex];

    if(!Array.isArray(claim.evidence)||claim.evidence.length===0){
      errors.push("claim["+claimIndex+"]: no evidence");
      continue;
    }

    for(let evidenceIndex=0;evidenceIndex<claim.evidence.length;evidenceIndex++){
      const result=verifyEvidenceReference(document,claim.evidence[evidenceIndex]);

      if(!result.ok){
        errors.push(
          "claim["+claimIndex+"].evidence["+evidenceIndex+"]: "+result.reason
        );
      }
    }
  }

  return {ok:errors.length===0,errors};
}


export function stampVerifiedClaimEvidence(document,claimDrafts=[]){
  return claimDrafts.map((claim,claimIndex)=>({
    ...claim,
    evidence:(claim.evidence||[]).map((reference,evidenceIndex)=>{
      const result=verifyEvidenceReference(document,reference);

      if(!result.ok){
        throw new Error(
          "claim["+claimIndex+"].evidence["+evidenceIndex+"]: "+result.reason
        );
      }

      return {
        ...reference,
        excerpt_hash:sha256(result.excerpt),
        verification_status:"verified"
      };
    })
  }));
}
