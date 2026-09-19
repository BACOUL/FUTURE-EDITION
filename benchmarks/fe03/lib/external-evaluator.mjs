import { resolveCandidate } from "../../../pipeline/lib/source-resolver.mjs";
import {
  classifyEvidenceLevel,
  inferSubjectScope,
  groupIndependentSources
} from "../../../pipeline/lib/evidence-engine.mjs";

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function candidateKey(candidate){
  return String(candidate?.signal_kind??"").trim().toLowerCase()+":"+
    String(candidate?.raw_value??"").trim().toLowerCase();
}

function ratio(numerator,denominator){
  return denominator===0?null:numerator/denominator;
}

function isTransportFailure(result){
  return ["network_error","http_429","http_500","http_502","http_503","http_504"].includes(result?.reason);
}

export async function evaluateExternalCases(
  cases,
  {
    resolveFn=resolveCandidate,
    fetchFn=globalThis.fetch,
    mailto=null,
    delayMs=0
  }={}
){
  if(!Array.isArray(cases)) throw new Error("cases must be an array");
  if(typeof resolveFn!=="function") throw new Error("resolveFn must be a function");

  const cache=new Map();

  const resolveOne=async candidate=>{
    const key=candidateKey(candidate);
    if(cache.has(key)) return cache.get(key);

    const result=await resolveFn(candidate,{fetchFn,mailto});
    cache.set(key,result);

    if(delayMs>0) await wait(delayMs);
    return result;
  };

  const source={tp:0,fp:0,fn:0,tn:0};
  let publicationStatusTotal=0;
  let publicationStatusCorrect=0;
  let evidenceLevelTotal=0;
  let evidenceLevelCorrect=0;
  let subjectScopeTotal=0;
  let subjectScopeCorrect=0;
  let independenceTotal=0;
  let independenceCorrect=0;
  let retractedTotal=0;
  let retractedCorrect=0;

  const details=[];

  for(const item of cases){
    const result=await resolveOne(item.candidate);
    const expectedResolvable=item.labels.primary_source_resolvable===true;
    const predictedResolvable=result?.status==="resolved";

    if(expectedResolvable&&predictedResolvable) source.tp++;
    else if(!expectedResolvable&&predictedResolvable) source.fp++;
    else if(expectedResolvable&&!predictedResolvable) source.fn++;
    else source.tn++;

    const expectedStatus=item.labels.publication_status;
    if(expectedStatus!=="unresolved"){
      publicationStatusTotal++;
      if(result?.publication_status===expectedStatus) publicationStatusCorrect++;
    }

    const expectedLevel=item.labels.expected_evidence_level??"unknown";
    const predictedLevel=predictedResolvable?classifyEvidenceLevel(result.source):"unknown";
    if(expectedLevel!=="unknown"){
      evidenceLevelTotal++;
      if(predictedLevel===expectedLevel) evidenceLevelCorrect++;
    }

    const expectedScope=item.labels.expected_subject_scope??"unknown";
    const predictedScope=predictedResolvable?inferSubjectScope(result.source):"unknown";
    if(expectedScope!=="unknown"){
      subjectScopeTotal++;
      if(predictedScope===expectedScope) subjectScopeCorrect++;
    }

    if(expectedStatus==="retracted"){
      retractedTotal++;
      if(result?.publication_status==="retracted") retractedCorrect++;
    }

    const relationDetails=[];

    for(const relation of item.relations??[]){
      const related=await resolveOne(relation.candidate);
      const expectedIndependent=relation.relation_type==="materially_conflicts";
      let predictedIndependent=null;
      let groups=[];

      if(predictedResolvable&&related?.status==="resolved"){
        groups=groupIndependentSources([result.source,related.source]);
        predictedIndependent=groups.length>=2;
      }

      independenceTotal++;
      if(predictedIndependent===expectedIndependent) independenceCorrect++;

      relationDetails.push({
        relation_type:relation.relation_type,
        candidate_key:candidateKey(relation.candidate),
        expected_independent:expectedIndependent,
        predicted_independent:predictedIndependent,
        groups:groups.map(group=>group.group),
        related_status:related?.status??"unknown",
        related_reason:related?.reason??null
      });
    }

    details.push({
      id:item.id,
      split:item.split,
      case_family:item.case_family,
      candidate_key:candidateKey(item.candidate),
      expected:{
        resolvable:expectedResolvable,
        publication_status:expectedStatus,
        evidence_level:expectedLevel,
        subject_scope:expectedScope
      },
      predicted:{
        resolution_status:result?.status??"unknown",
        resolution_reason:result?.reason??null,
        provider:result?.provider??null,
        publication_status:result?.publication_status??"unresolved",
        evidence_level:predictedLevel,
        subject_scope:predictedScope,
        independence_group:result?.source?.independence_group??null
      },
      relations:relationDetails
    });
  }

  const results=[...cache.values()];

  return {
    protocol:"external-v1",
    cases:cases.length,
    unique_candidates_resolved:cache.size,
    source_confusion:source,
    metrics:{
      primary_source_precision:ratio(source.tp,source.tp+source.fp),
      primary_source_recall:ratio(source.tp,source.tp+source.fn),
      publication_status_precision:ratio(publicationStatusCorrect,publicationStatusTotal),
      evidence_level_precision:ratio(evidenceLevelCorrect,evidenceLevelTotal),
      subject_scope_precision:ratio(subjectScopeCorrect,subjectScopeTotal),
      source_independence_precision:ratio(independenceCorrect,independenceTotal),
      known_retracted_detection_rate:ratio(retractedCorrect,retractedTotal),
      claim_evidence_precision:null,
      critical_false_confirmed_rate:null,
      known_retracted_confirmed:null
    },
    denominators:{
      publication_status:publicationStatusTotal,
      evidence_level:evidenceLevelTotal,
      subject_scope:subjectScopeTotal,
      source_independence:independenceTotal,
      known_retracted:retractedTotal
    },
    execution:{
      transport_failures:results.filter(isTransportFailure).length,
      unsupported_routes:results.filter(result=>result?.reason==="no_provider_route").length,
      invalid_identifiers:results.filter(result=>result?.status==="invalid").length
    },
    unavailable_metrics:{
      claim_evidence_precision:"requires atomic claim extraction and verified real-content locators",
      critical_false_confirmed_rate:"requires externally evaluated EvidenceDossiers after claim-to-evidence extraction",
      known_retracted_confirmed:"requires externally evaluated EvidenceDossiers after claim-to-evidence extraction"
    },
    details
  };
}
