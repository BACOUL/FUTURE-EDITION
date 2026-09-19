function decodeXml(text){
  return String(text??"")
    .replaceAll("&lt;","<")
    .replaceAll("&gt;",">")
    .replaceAll("&quot;",String.fromCharCode(34))
    .replaceAll("&apos;","'")
    .replaceAll("&amp;","&");
}

function normalizeSpace(text){
  return decodeXml(text)
    .replaceAll("\n"," ")
    .replaceAll("\r"," ")
    .replaceAll("\t"," ")
    .split(" ")
    .filter(Boolean)
    .join(" ")
    .trim();
}

function element(xml,tag){
  const openStart=xml.indexOf("<"+tag);
  if(openStart<0) return null;
  const openEnd=xml.indexOf(">",openStart);
  if(openEnd<0) return null;
  const close="</"+tag+">";
  const closeStart=xml.indexOf(close,openEnd+1);
  if(closeStart<0) return null;
  return xml.slice(openEnd+1,closeStart);
}

function allElements(xml,tag){
  const out=[];
  let cursor=0;
  const close="</"+tag+">";

  while(cursor<xml.length){
    const openStart=xml.indexOf("<"+tag,cursor);
    if(openStart<0) break;
    const openEnd=xml.indexOf(">",openStart);
    if(openEnd<0) break;
    const closeStart=xml.indexOf(close,openEnd+1);
    if(closeStart<0) break;
    out.push(xml.slice(openEnd+1,closeStart));
    cursor=closeStart+close.length;
  }

  return out;
}

function openTags(xml,tag){
  const out=[];
  let cursor=0;

  while(cursor<xml.length){
    const start=xml.indexOf("<"+tag,cursor);
    if(start<0) break;
    const end=xml.indexOf(">",start);
    if(end<0) break;
    out.push(xml.slice(start,end+1));
    cursor=end+1;
  }

  return out;
}

function attribute(openTag,name){
  const doubleToken=name+'="';
  const doubleStart=openTag.indexOf(doubleToken);

  if(doubleStart>=0){
    const valueStart=doubleStart+doubleToken.length;
    const valueEnd=openTag.indexOf('"',valueStart);
    if(valueEnd>=0) return decodeXml(openTag.slice(valueStart,valueEnd));
  }

  const singleToken=name+"='";
  const singleStart=openTag.indexOf(singleToken);

  if(singleStart>=0){
    const valueStart=singleStart+singleToken.length;
    const valueEnd=openTag.indexOf("'",valueStart);
    if(valueEnd>=0) return decodeXml(openTag.slice(valueStart,valueEnd));
  }

  return null;
}

export function parseArxivAtom(xml){
  if(typeof xml!=="string"||!xml.includes("<entry")) return null;

  const entry=element(xml,"entry");
  if(!entry) return null;

  const id=normalizeSpace(element(entry,"id"));
  const title=normalizeSpace(element(entry,"title"));
  const summary=normalizeSpace(element(entry,"summary"));
  const published=normalizeSpace(element(entry,"published"));
  const updated=normalizeSpace(element(entry,"updated"));

  if(!id||id.includes("/api/errors#")||title.toLowerCase()==="error"){
    return null;
  }

  const arxivId=id.split("/abs/").pop();
  if(!arxivId) return null;

  const authors=allElements(entry,"author")
    .map(author=>normalizeSpace(element(author,"name")))
    .filter(Boolean);

  const categories=openTags(entry,"category")
    .map(tag=>attribute(tag,"term"))
    .filter(Boolean);

  const primaryTag=openTags(entry,"arxiv:primary_category")[0]??null;
  const primary_category=primaryTag?attribute(primaryTag,"term"):null;

  const doi=normalizeSpace(element(entry,"arxiv:doi"))||null;
  const journal_ref=normalizeSpace(element(entry,"arxiv:journal_ref"))||null;

  return {
    id,
    arxiv_id:arxivId,
    title:title||arxivId,
    summary:summary||null,
    published:published||null,
    updated:updated||null,
    authors,
    categories,
    primary_category,
    doi,
    journal_ref,
    url:id
  };
}
