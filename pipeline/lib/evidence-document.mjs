import { createHash } from "node:crypto";

const normalizeSpace=value=>String(value??"")
  .replaceAll("\n"," ")
  .replaceAll("\r"," ")
  .replaceAll("\t"," ")
  .split(" ")
  .filter(Boolean)
  .join(" ")
  .trim();

const stripMarkup=value=>normalizeSpace(
  String(value??"").replace(/<[^>]*>/g," ")
);

const sectionId=value=>String(value??"section")
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g,"-")
  .replace(/^-+|-+$/g,"")
  .slice(0,64)||"section";

function documentId(candidate){
  const match=String(candidate?.id??"").match(/^CAND-([0-9]{6})$/);
  if(match) return "DOC-"+match[1];

  const seed=[
    candidate?.signal_kind??"",
    candidate?.raw_value??"",
    candidate?.origin??""
  ].join("|");
  const hex=createHash("sha256").update(seed).digest("hex").slice(0,12);
  const numeric=Number.parseInt(hex,16)%1000000;
  return "DOC-"+String(numeric).padStart(6,"0");
}

function addSection(sections,id,title,text){
  const normalized=normalizeSpace(text);
  if(!normalized) return;
  const base=sectionId(id);
  let unique=base;
  let suffix=2;
  while(sections.some(item=>item.id===unique)){
    unique=(base+"-"+suffix).slice(0,64);
    suffix++;
  }
  sections.push({id:unique,title:normalizeSpace(title)||unique,text:normalized});
}

function addPubmedSections(sections,payload){
  const parts=Array.isArray(payload?.abstract_sections)?payload.abstract_sections:[];
  for(let index=0;index<parts.length;index++){
    const item=parts[index];
    const label=normalizeSpace(item?.label)||"Abstract "+String(index+1);
    addSection(sections,"abstract-"+String(index+1),label,item?.text);
  }
  if(parts.length===0) addSection(sections,"abstract","Abstract",payload?.abstract);
}

function addClinicalTrialsSections(sections,payload){
  const protocol=payload?.protocolSection??{};
  const description=protocol.descriptionModule??{};
  const status=protocol.statusModule??{};

  addSection(sections,"brief-summary","Brief summary",description.briefSummary);
  addSection(sections,"detailed-description","Detailed description",description.detailedDescription);
  addSection(sections,"why-stopped","Why stopped",status.whyStopped);

  const outcomes=protocol.outcomesModule??{};
  const groups=[
    ["primary-outcome",outcomes.primaryOutcomes],
    ["secondary-outcome",outcomes.secondaryOutcomes],
    ["other-outcome",outcomes.otherOutcomes]
  ];

  for(const [prefix,items] of groups){
    for(let index=0;index<(items??[]).length;index++){
      const item=items[index]??{};
      const text=[
        item.measure,
        item.description,
        item.timeFrame?"Time frame: "+item.timeFrame:null
      ].filter(Boolean).join(". ");
      addSection(
        sections,
        prefix+"-"+String(index+1),
        normalizeSpace(item.measure)||prefix.replaceAll("-"," "),
        text
      );
    }
  }

  const resultOutcomes=payload?.resultsSection?.outcomeMeasuresModule?.outcomeMeasures??[];
  for(let index=0;index<resultOutcomes.length;index++){
    const item=resultOutcomes[index]??{};
    const text=[
      item.title,
      item.description,
      item.timeFrame
    ].filter(Boolean).join(". ");
    addSection(
      sections,
      "result-outcome-"+String(index+1),
      normalizeSpace(item.title)||"Result outcome "+String(index+1),
      text
    );
  }
}

function addOfficialWebSections(sections,payload){
  addSection(sections,"summary","Summary",payload?.description);

  const paragraphs=Array.isArray(payload?.paragraphs)?payload.paragraphs:[];
  for(let index=0;index<Math.min(paragraphs.length,200);index++){
    addSection(
      sections,
      "paragraph-"+String(index+1),
      "Paragraph "+String(index+1),
      paragraphs[index]
    );
  }

  if(paragraphs.length===0) addSection(sections,"page","Page",payload?.body);
}

export function buildEvidenceDocument(provider,payload,{
  candidate,
  source,
  retrievedAt=new Date().toISOString()
}={}){
  if(!source?.external_id) return null;

  const sections=[];
  let license_scope="metadata_only";

  if(provider==="crossref"){
    const record=payload?.message??payload;
    addSection(sections,"abstract","Abstract",stripMarkup(record?.abstract));
  }else if(provider==="pubmed"){
    addPubmedSections(sections,payload);
  }else if(provider==="clinicaltrials"){
    license_scope="registry_record";
    addClinicalTrialsSections(sections,payload);
  }else if(provider==="arxiv"){
    addSection(sections,"abstract","Abstract",payload?.summary);
  }else if(provider==="biorxiv"||provider==="medrxiv"){
    addSection(sections,"abstract","Abstract",payload?.abstract);
  }else if(provider==="nhs_england"){
    license_scope="official_record";
    addOfficialWebSections(sections,payload);
  }

  if(sections.length===0) return null;

  return {
    id:documentId(candidate),
    source_external_id:String(source.external_id),
    retrieved_at:String(retrievedAt),
    license_scope,
    sections
  };
}
