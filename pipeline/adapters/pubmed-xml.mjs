function decodeXml(text){
  return String(text??"")
    .replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(Number.parseInt(hex,16)))
    .replace(/&#([0-9]+);/g,(_,dec)=>String.fromCodePoint(Number.parseInt(dec,10)))
    .replaceAll("&lt;","<")
    .replaceAll("&gt;",">")
    .replaceAll("&quot;",String.fromCharCode(34))
    .replaceAll("&apos;","'")
    .replaceAll("&amp;","&");
}

function stripTags(text){
  let out="";
  let inTag=false;

  for(const char of String(text??"")){
    if(char==="<"){inTag=true;continue;}
    if(char===">"){inTag=false;continue;}
    if(!inTag) out+=char;
  }

  return decodeXml(out)
    .replaceAll("\n"," ")
    .replaceAll("\r"," ")
    .replaceAll("\t"," ")
    .split(" ")
    .filter(Boolean)
    .join(" ")
    .trim();
}

function findOpen(xml,tag,start=0){
  let cursor=start;
  const token="<"+tag;

  while(cursor<xml.length){
    const index=xml.indexOf(token,cursor);
    if(index<0) return -1;
    const next=xml[index+token.length];
    if(next===">"||next==="/"||next===" "||next==="\n"||next==="\r"||next==="\t"){
      return index;
    }
    cursor=index+token.length;
  }

  return -1;
}

function block(xml,tag,start=0){
  const openStart=findOpen(xml,tag,start);
  if(openStart<0) return null;
  const openEnd=xml.indexOf(">",openStart);
  if(openEnd<0) return null;
  const close="</"+tag+">";
  const closeStart=xml.indexOf(close,openEnd+1);
  if(closeStart<0) return null;
  return {
    open:xml.slice(openStart,openEnd+1),
    inner:xml.slice(openEnd+1,closeStart),
    end:closeStart+close.length
  };
}

function allBlocks(xml,tag){
  const out=[];
  let cursor=0;

  while(cursor<xml.length){
    const item=block(xml,tag,cursor);
    if(!item) break;
    out.push(item);
    cursor=item.end;
  }

  return out;
}

function textOf(xml,tag){
  const item=block(xml,tag);
  return item?stripTags(item.inner):null;
}

function attribute(openTag,name){
  const token=name+'="';
  const start=openTag.indexOf(token);
  if(start<0) return null;
  const valueStart=start+token.length;
  const end=openTag.indexOf('"',valueStart);
  return end<0?null:decodeXml(openTag.slice(valueStart,end));
}

function normalizeRefType(value){
  const raw=String(value||"").toLowerCase();

  if(raw==="retractionin") return {direction:"updated_by",type:"retraction"};
  if(raw==="retractionof") return {direction:"updates",type:"retraction"};
  if(raw==="erratumin") return {direction:"updated_by",type:"correction"};
  if(raw==="erratumfor") return {direction:"updates",type:"correction"};
  if(raw==="expressionofconcernin") return {direction:"updated_by",type:"expression_of_concern"};
  if(raw==="expressionofconcernfor") return {direction:"updates",type:"expression_of_concern"};

  return null;
}

function publicationStatus(pubtypes,relations){
  if(pubtypes.includes("Retracted Publication")) return "retracted";
  const incoming=relations.filter(item=>item.direction==="updated_by");
  if(incoming.some(item=>item.type==="retraction")) return "retracted";
  if(incoming.some(item=>item.type==="expression_of_concern")) return "expression_of_concern";
  if(incoming.some(item=>item.type==="correction")) return "corrected";
  return "active";
}

function publicationKind(pubtypes){
  if(pubtypes.includes("Retraction Notice")) return "retraction_notice";
  if(pubtypes.includes("Published Erratum")) return "correction_notice";
  return "paper";
}

function meshScope(meshTerms=[]){
  const normalized=new Set(meshTerms.map(value=>String(value).trim().toLowerCase()));
  const hasHuman=normalized.has("humans");
  const hasAnimal=
    normalized.has("animals")||
    [...normalized].some(value=>["mice","rats","rabbits","swine","dogs","cats","primates"].some(term=>value===term||value.startsWith(term+"/")));

  if(hasHuman&&hasAnimal) return "mixed";
  if(hasHuman) return "human";
  if(hasAnimal) return "animal";
  return "unknown";
}

function explicitTechnologySignal(meshTerms=[],title="",abstract=""){
  const mesh=meshTerms.map(value=>String(value).trim().toLowerCase());
  const technologyMesh=mesh.some(value=>
    value.includes("artificial intelligence")||
    value.includes("deep learning")||
    value.includes("convolutional neural network")||
    value.includes("neural networks, computer")
  );
  if(!technologyMesh) return false;

  const text=(String(title)+" "+String(abstract)).toLowerCase();
  return /\b(?:benchmark|classification|classifier|accuracy|model performance|evaluation)\b/.test(text);
}

function textStudyStage(title="",abstract=""){
  const text=(String(title)+" "+String(abstract)).toLowerCase();

  if(/\b(?:systematic review|meta-analysis|meta analysis)\b/.test(text)) return "systematic_review";
  if(/\bphase\s*(?:i|1)\b/.test(text)&&/\b(?:trial|study)\b/.test(text)) return "phase1";
  if(/\bphase\s*(?:ii|2)(?:a|b)?\b/.test(text)&&/\b(?:trial|study)\b/.test(text)) return "phase2";
  if(/\bphase\s*(?:iii|3)\b/.test(text)&&/\b(?:trial|study)\b/.test(text)) return "phase3";
  if(/\b(?:randomized|randomised|randomly assigned|randomly allocated|random assignment)\b/.test(text)&&/\b(?:trial|study|experiment|families|participants|patients|children)\b/.test(text)) return "randomized_trial";
  if(/\b(?:observational|cohort|cross-sectional|retrospective|prospective)\b/.test(text)&&/\b(?:patient|patients|participant|participants|adult|adults|children|people|human|humans)\b/.test(text)){
    return "observational_human";
  }

  return "unknown";
}

function humanSemanticText(value=""){
  return String(value)
    .toLowerCase()
    .replace(/\bpatient[- ](?:derived|relevant|specific|matched|like)\b/g," ")
    .replace(/\bhuman[- ](?:derived|relevant|specific|matched|like)\b/g," ");
}

function subjectScope(meshTerms=[],title="",abstract=""){
  const scope=meshScope(meshTerms);
  const titleText=String(title).toLowerCase();
  const text=(String(title)+" "+String(abstract)).toLowerCase();
  const animalRe=/\b(?:mice|rats|rabbits|murine|porcine|swine|mouse model)\b/;
  const humanRe=/\b(?:patients?|participants?|individuals?|subjects?|people|adults?|children|humans?)\b/;
  const titleAnimal=animalRe.test(titleText);
  const titleHuman=humanRe.test(humanSemanticText(titleText));
  const explicitAnimal=titleAnimal||animalRe.test(text);
  const explicitHuman=titleHuman||humanRe.test(humanSemanticText(text));

  if(scope==="mixed"){
    if(titleAnimal&&!titleHuman) return "animal";
    if(titleHuman&&!titleAnimal&&!explicitAnimal) return "human";
    if(explicitAnimal&&!explicitHuman) return "animal";
    if(explicitHuman&&!explicitAnimal) return "human";
  }
  if(scope!=="unknown") return scope;
  if(explicitAnimal&&!explicitHuman) return "animal";
  if(explicitHuman&&!explicitAnimal) return "human";
  if(explicitTechnologySignal(meshTerms,title,abstract)) return "technology";
  return "unknown";
}

function studyStage(pubtypes,meshTerms=[],title="",abstract=""){
  const scope=meshScope(meshTerms);
  const titleText=String(title).toLowerCase();
  const text=(String(title)+" "+String(abstract)).toLowerCase();
  const animalRe=/\b(?:mice|rats|rabbits|murine|porcine|swine|mouse model)\b/;
  const humanRe=/\b(?:patients?|participants?|individuals?|subjects?|people|adults?|children|humans?)\b/;
  const titleAnimal=animalRe.test(titleText);
  const titleHuman=humanRe.test(humanSemanticText(titleText));
  const explicitAnimal=titleAnimal||animalRe.test(text);
  const explicitHuman=titleHuman||humanRe.test(humanSemanticText(text));

  if(scope==="animal"||(scope==="unknown"&&titleAnimal&&!titleHuman)||(scope==="unknown"&&explicitAnimal&&!explicitHuman)) return "preclinical_animal";
  if(pubtypes.includes("Systematic Review")||pubtypes.includes("Meta-Analysis")) return "systematic_review";
  // Explicit PubMed trial phase is more specific than the generic randomized-study tag.
  // Preserve the FE-03 evidence taxonomy: phase I/II = early_human, phase III = controlled_human.
  if(pubtypes.includes("Clinical Trial, Phase I")) return "phase1";
  if(pubtypes.includes("Clinical Trial, Phase II")) return "phase2";
  if(pubtypes.includes("Clinical Trial, Phase III")) return "phase3";
  const textual=textStudyStage(title,abstract);
  if(pubtypes.includes("Randomized Controlled Trial")||textual==="randomized_trial") return "randomized_trial";
  if(pubtypes.includes("Observational Study")) return "observational_human";

  if(textual!=="unknown") return textual;

  if(scope==="mixed") return "preclinical_animal";
  if(scope==="unknown"&&explicitTechnologySignal(meshTerms,title,abstract)) return "technology_benchmark";
  return "unknown";
}

function abstractSections(articleXml){
  return allBlocks(articleXml,"AbstractText")
    .map(item=>({
      label:attribute(item.open,"Label")||attribute(item.open,"NlmCategory")||null,
      nlm_category:attribute(item.open,"NlmCategory")||null,
      text:stripTags(item.inner)
    }))
    .filter(item=>item.text);
}

export function parsePubmedXml(xml){
  if(typeof xml!=="string"||!xml.includes("<PubmedArticle")) return null;

  const article=block(xml,"PubmedArticle");
  if(!article) return null;

  const pmid=textOf(article.inner,"PMID");
  const title=textOf(article.inner,"ArticleTitle");

  if(!pmid||!title) return null;

  const pubtypes=allBlocks(article.inner,"PublicationType")
    .map(item=>stripTags(item.inner))
    .filter(Boolean);

  const meshTerms=allBlocks(article.inner,"DescriptorName")
    .map(item=>stripTags(item.inner))
    .filter(Boolean);

  const abstract_sections=abstractSections(article.inner);
  const abstract=abstract_sections.map(item=>item.text).join(" ").trim()||null;

  let doi=null;
  for(const item of allBlocks(article.inner,"ArticleId")){
    if(String(attribute(item.open,"IdType")||"").toLowerCase()==="doi"){
      doi=stripTags(item.inner).toLowerCase();
      break;
    }
  }

  const relations=[];
  for(const item of allBlocks(article.inner,"CommentsCorrections")){
    const normalized=normalizeRefType(attribute(item.open,"RefType"));
    if(!normalized) continue;

    const relatedPmid=textOf(item.inner,"PMID");
    const refSource=textOf(item.inner,"RefSource");

    relations.push({
      direction:normalized.direction,
      type:normalized.type,
      external_id:relatedPmid?"pmid:"+relatedPmid:(refSource||"unknown"),
      source:"pubmed",
      label:attribute(item.open,"RefType")||null
    });
  }

  relations.sort((a,b)=>
    [a.direction,a.type,a.external_id].join("|")
      .localeCompare([b.direction,b.type,b.external_id].join("|"))
  );

  return {
    pmid,
    title,
    doi,
    abstract,
    abstract_sections,
    pubtypes,
    publication_status:publicationStatus(pubtypes,relations),
    kind:publicationKind(pubtypes),
    study_stage:studyStage(pubtypes,meshTerms,title,abstract),
    subject_scope:subjectScope(meshTerms,title,abstract),
    peer_reviewed:true,
    integrity_relations:relations,
    url:"https://pubmed.ncbi.nlm.nih.gov/"+pmid+"/",
    independence_group:doi?"doi:"+doi:"pubmed:"+pmid
  };
}
