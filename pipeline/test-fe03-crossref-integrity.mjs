import { adapterByProvider } from "./adapters/normalize.mjs";
import { buildDossier } from "./lib/evidence-engine.mjs";

const originalDoi="10.1177/1758835920922055";
const noticeDoi="10.1177/17588359231172420";

const notice=adapterByProvider.crossref({
  message:{
    DOI:noticeDoi,
    type:"journal-article",
    title:["Retraction to "+originalDoi],
    URL:"https://doi.org/"+noticeDoi,
    "update-to":[
      {
        DOI:originalDoi,
        type:"retraction",
        source:"publisher",
        label:"Retraction"
      },
      {
        DOI:noticeDoi,
        type:"retraction",
        source:"retraction-watch",
        label:"Retraction"
      }
    ]
  }
});

if(notice.publication_status!=="active"){
  throw new Error("retraction notice incorrectly marked retracted");
}

if(notice.source.kind!=="retraction_notice"){
  throw new Error("retraction notice kind not detected");
}

if(!notice.integrity_relations.some(item=>
  item.direction==="updates"&&
  item.type==="retraction"&&
  item.external_id===originalDoi
)){
  throw new Error("retraction target relation missing");
}

const original=adapterByProvider.crossref({
  message:{
    DOI:originalDoi,
    type:"journal-article",
    title:["Original article"],
    URL:"https://doi.org/"+originalDoi,
    "updated-by":[
      {
        DOI:noticeDoi,
        type:"retraction",
        source:"publisher",
        label:"Retraction"
      }
    ]
  }
});

if(original.publication_status!=="retracted"){
  throw new Error("retracted original not detected from updated-by");
}

if(original.source.kind!=="paper"){
  throw new Error("original article incorrectly converted to notice");
}

const dossier=buildDossier({
  id:"DOS-000201",
  candidate:{id:"CAND-000201"},
  resolution:{status:notice.status,provider:notice.provider,reason:notice.reason},
  source:notice.source,
  publication_status:notice.publication_status,
  integrity_relations:notice.integrity_relations,
  claimDrafts:[{
    text:"This record is a retraction notice.",
    claim_kind:"regulatory",
    subject_scope:"unknown",
    evidence:[{locator:"metadata:update-to",support:"context"}]
  }],
  contradictions:[],
  limitations:[],
  observed_at:"2099-01-01T00:00:00Z"
});

if(dossier.safety.decision!=="investigate"){
  throw new Error("integrity notice should enter review/investigation path");
}

if(!dossier.safety.reasons.includes("integrity_notice")){
  throw new Error("integrity notice safety reason missing");
}

console.log("FE03_CROSSREF_INTEGRITY_PASS|notice_active=1|target_retracted=1|direction_preserved=1|notice_review_gate=1");
