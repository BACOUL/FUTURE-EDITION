import { evaluateExternalCases } from "./lib/external-evaluator.mjs";

const makeSource=(id,stage,group)=>({
  external_id:id,
  kind:"paper",
  tier:"A",
  title:id,
  url:"https://example.invalid/"+id,
  peer_reviewed:true,
  study_stage:stage,
  independence_group:group
});

const resolved=(source,status="active")=>({
  status:"resolved",
  provider:"fixture",
  reason:null,
  source,
  publication_status:status
});

const fixtures=new Map([
  ["pmid:1",resolved(makeSource("pmid:1","systematic_review","doi:10.1000/a"))],
  ["doi:10.1000/a",resolved(makeSource("10.1000/a","systematic_review","doi:10.1000/a"))],
  ["pmid:2",resolved(makeSource("pmid:2","randomized_trial","doi:10.1000/b"))],
  ["pmid:3",resolved(makeSource("pmid:3","randomized_trial","doi:10.1000/c"))],
  ["pmid:4",resolved(makeSource("pmid:4","randomized_trial","doi:10.1000/d"),"retracted")],
  ["doi:not-a-doi",{status:"invalid",provider:"fixture",reason:"invalid_identifier",source:null,publication_status:"unresolved"}]
]);

const resolveFn=async candidate=>{
  const key=String(candidate.signal_kind).toLowerCase()+":"+String(candidate.raw_value).toLowerCase();
  const result=fixtures.get(key);
  if(!result) throw new Error("missing fixture "+key);
  return result;
};

const cases=[
  {
    id:"FE03-EXT-9001",
    split:"dev",
    case_family:"dependent_echo",
    candidate:{signal_kind:"pmid",raw_value:"1",origin:"pubmed"},
    labels:{
      primary_source_resolvable:true,
      publication_status:"active",
      critical_safety_case:true,
      expected_subject_scope:"human",
      expected_evidence_level:"replicated_human"
    },
    relations:[{
      relation_type:"same_primary_origin",
      candidate:{signal_kind:"doi",raw_value:"10.1000/a",origin:"crossref"},
      basis:["fixture"]
    }]
  },
  {
    id:"FE03-EXT-9002",
    split:"dev",
    case_family:"contradiction",
    candidate:{signal_kind:"pmid",raw_value:"2",origin:"pubmed"},
    labels:{
      primary_source_resolvable:true,
      publication_status:"active",
      critical_safety_case:true,
      expected_subject_scope:"human",
      expected_evidence_level:"controlled_human"
    },
    relations:[{
      relation_type:"materially_conflicts",
      candidate:{signal_kind:"pmid",raw_value:"3",origin:"pubmed"},
      basis:["fixture"]
    }]
  },
  {
    id:"FE03-EXT-9003",
    split:"dev",
    case_family:"retracted_publication",
    candidate:{signal_kind:"pmid",raw_value:"4",origin:"pubmed"},
    labels:{
      primary_source_resolvable:true,
      publication_status:"retracted",
      critical_safety_case:true,
      expected_subject_scope:"human",
      expected_evidence_level:"controlled_human"
    }
  },
  {
    id:"FE03-EXT-9004",
    split:"dev",
    case_family:"invalid_identifier",
    candidate:{signal_kind:"doi",raw_value:"not-a-doi",origin:"manual"},
    labels:{
      primary_source_resolvable:false,
      publication_status:"unresolved",
      critical_safety_case:true,
      expected_subject_scope:"unknown",
      expected_evidence_level:"unknown"
    }
  }
];

const result=await evaluateExternalCases(cases,{resolveFn,delayMs:0});

const mustEqual=(actual,expected,label)=>{
  if(actual!==expected) throw new Error(label+": expected "+expected+", got "+actual);
};

mustEqual(result.metrics.primary_source_precision,1,"source precision");
mustEqual(result.metrics.primary_source_recall,1,"source recall");
mustEqual(result.metrics.publication_status_precision,1,"status precision");
mustEqual(result.metrics.evidence_level_precision,1,"evidence precision");
mustEqual(result.metrics.subject_scope_precision,1,"scope precision");
mustEqual(result.metrics.source_independence_precision,1,"independence precision");
mustEqual(result.metrics.known_retracted_detection_rate,1,"retraction detection");
mustEqual(result.metrics.claim_evidence_precision,null,"claim metric must remain unavailable");
mustEqual(result.metrics.critical_false_confirmed_rate,null,"FCR must remain unavailable");
mustEqual(result.execution.transport_failures,0,"transport failures");

console.log(
  "FE03_EXTERNAL_EVALUATOR_PASS|cases=4|source_precision=1|source_recall=1"+
  "|status=1|evidence_level=1|scope=1|independence=1|retraction=1"+
  "|claim_metric_unavailable=1|external_fcr_unavailable=1"
);
