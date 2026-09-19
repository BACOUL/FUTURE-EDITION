import { linkClaimToDocument } from "./lib/claim-linker.mjs";
import { verifyEvidenceReference } from "./lib/evidence-locator.mjs";

const cases=[
  {
    claim:"The gamified digital mental health intervention reduced child anxiety severity compared with a waitlist.",
    expected:"The gamified DMHI demonstrated efficacy for reducing child anxiety severity in comparison to a waitlist."
  },
  {
    claim:"No objective responses were observed in this Phase I study.",
    expected:"No objective responses were noted."
  },
  {
    claim:"Semaglutide treatment extended lifespan in female mice.",
    expected:"Continued treatment extended mouse lifespan."
  },
  {
    claim:"The interim analysis found no statistically significant difference between the two study arms.",
    expected:"Interim analysis: no statistically significant difference in the 2 study arms."
  }
];

for(let index=0;index<cases.length;index++){
  const item=cases[index];
  const document={
    id:"DOC-"+String(index+1).padStart(6,"0"),
    source_external_id:"fixture-"+String(index+1),
    retrieved_at:"2099-01-01T00:00:00Z",
    license_scope:"metadata_only",
    sections:[
      {
        id:"context",
        title:"Context",
        text:"This unrelated sentence discusses background information only."
      },
      {
        id:"evidence",
        title:"Evidence",
        text:item.expected+" Additional unrelated context follows."
      }
    ]
  };

  const linked=linkClaimToDocument(item.claim,document);
  if(!linked) throw new Error("case "+index+" did not link");
  if(linked.excerpt!==item.expected) throw new Error("case "+index+" linked wrong sentence: "+linked.excerpt);
  if(!verifyEvidenceReference(document,linked).ok) throw new Error("case "+index+" locator did not verify");
}

const unrelated={
  id:"DOC-999999",
  source_external_id:"fixture-unrelated",
  retrieved_at:"2099-01-01T00:00:00Z",
  license_scope:"metadata_only",
  sections:[{id:"abstract",title:"Abstract",text:"A telescope measured a distant galaxy."}]
};

if(linkClaimToDocument("A randomized trial improved human survival.",unrelated,{minScore:0.2})!==null){
  throw new Error("unrelated claim produced evidence");
}

console.log("FE03_CLAIM_LINKER_TEST_PASS|positive=4|wrong_sentence=0|locator_verified=4|unrelated_rejected=1");
