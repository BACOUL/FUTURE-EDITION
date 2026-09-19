import { createEvidenceLocator,resolveEvidenceLocator,verifyEvidenceReference,verifyClaimEvidenceLocators } from "./lib/evidence-locator.mjs";

const document={
  id:"DOC-000001",
  source_external_id:"10.1000/synthetic",
  retrieved_at:"2099-01-01T00:00:00Z",
  license_scope:"permitted_excerpt",
  sections:[
    {
      id:"abstract",
      title:"Abstract",
      text:"Background. Primary result improved by 25 percent. Limitation: synthetic fixture only."
    },
    {
      id:"results",
      title:"Results",
      text:"The primary endpoint changed from 10 to 7.5 in the treated group."
    }
  ]
};

const phrase="Primary result improved by 25 percent";
const start=document.sections[0].text.indexOf(phrase);
const ref=createEvidenceLocator(
  document,
  "abstract",
  start,
  start+phrase.length
);

if(!ref.locator.startsWith("DOC-000001#abstract:")){
  throw new Error("locator syntax");
}

if(resolveEvidenceLocator(document,ref.locator).excerpt!==phrase){
  throw new Error("locator resolution");
}

if(!verifyEvidenceReference(document,ref).ok){
  throw new Error("reference verification");
}

const claims=[{
  text:"Synthetic improvement claim.",
  evidence:[{
    locator:ref.locator,
    excerpt_hash:ref.excerpt_hash,
    support:"supports"
  }]
}];

const good=verifyClaimEvidenceLocators(document,claims);

if(!good.ok) throw new Error(good.errors.join(" | "));

const tampered=structuredClone(claims);
tampered[0].evidence[0].excerpt_hash="0".repeat(64);

if(verifyClaimEvidenceLocators(document,tampered).ok){
  throw new Error("tampered hash accepted");
}

const wrongDoc=structuredClone(claims);
wrongDoc[0].evidence[0].locator=wrongDoc[0].evidence[0].locator.replace(
  "DOC-000001",
  "DOC-999999"
);

if(verifyClaimEvidenceLocators(document,wrongDoc).ok){
  throw new Error("wrong document accepted");
}

let boundsRejected=false;

try{
  createEvidenceLocator(document,"abstract",0,9999);
}catch{
  boundsRejected=true;
}

if(!boundsRejected) throw new Error("out of bounds locator accepted");

console.log("FE03_LOCATOR_TEST_PASS|verified=1|tamper_rejected=1|wrong_document_rejected=1|bounds_rejected=1");
