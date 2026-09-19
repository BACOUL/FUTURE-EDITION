function decodeXml(text){
  return String(text??"")
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

function studyStage(pubtypes){
  if(pubtypes.some(x=>x.includes("Clinical Trial, Phase I"))) return "phase1";
  if(pubtypes.some(x=>x.includes("Clinical Trial, Phase II"))) return "phase2";
  if(pubtypes.some(x=>x.includes("Clinical Trial, Phase III"))) return "phase3";
  if(pubtypes.includes("Randomized Controlled Trial")) return "randomized_trial";
  if(pubtypes.includes("Systematic Review")||pubtypes.includes("Meta-Analysis")) return "systematic_review";
  if(pubtypes.includes("Observational Study")) return "observational_human";
  return "unknown";
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
    pubtypes,
    publication_status:publicationStatus(pubtypes,relations),
    kind:publicationKind(pubtypes),
    study_stage:studyStage(pubtypes),
    peer_reviewed:true,
    integrity_relations:relations,
    url:"https://pubmed.ncbi.nlm.nih.gov/"+pmid+"/",
    independence_group:"pubmed:"+pmid
  };
}
