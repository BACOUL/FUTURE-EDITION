const decodeEntity=value=>String(value??"")
  .replaceAll("&amp;","&")
  .replaceAll("&lt;","<")
  .replaceAll("&gt;",">")
  .replaceAll("&quot;",String.fromCharCode(34))
  .replaceAll("&#39;","'")
  .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));

const normalizeSpace=value=>decodeEntity(String(value??""))
  .replaceAll("\n"," ")
  .replaceAll("\r"," ")
  .replaceAll("\t"," ")
  .split(" ")
  .filter(Boolean)
  .join(" ")
  .trim();

function removeBlocks(html,tag){
  return String(html??"").replace(new RegExp("<"+tag+"\\b[^>]*>[\\s\\S]*?<\\/"+tag+">","gi")," ");
}

function stripTags(html){
  return normalizeSpace(String(html??"").replace(/<[^>]+>/g," "));
}

function firstTag(html,tag){
  const match=String(html??"").match(new RegExp("<"+tag+"\\b[^>]*>([\\s\\S]*?)<\\/"+tag+">","i"));
  return match?stripTags(match[1]):null;
}

function escapeRegex(value){
  return String(value).replace(/[.*+?^$()|[\]\\{}]/g,"\\$&");
}


function jsonLdArticle(html){
  const scripts=[];
  const re=/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while((match=re.exec(String(html??"")))!==null) scripts.push(match[1]);

  const candidates=[];
  const visit=value=>{
    if(!value) return;
    if(Array.isArray(value)){ for(const item of value) visit(item); return; }
    if(typeof value!=="object") return;
    candidates.push(value);
    if(value["@graph"]) visit(value["@graph"]);
  };

  for(const script of scripts){
    try{ visit(JSON.parse(script)); }catch{}
  }

  for(const item of candidates){
    const type=Array.isArray(item["@type"])?item["@type"].join(" "):String(item["@type"]??"");
    if(!/(Article|NewsArticle|Report|WebPage)/i.test(type)) continue;
    const title=normalizeSpace(item.headline||item.name);
    const body=normalizeSpace(item.articleBody||item.text||item.description);
    if(title&&body.length>=20){
      return {
        title,
        description:normalizeSpace(item.description)||null,
        body,
        paragraphs:[body]
      };
    }
  }
  return null;
}

function metaContent(html,property){
  const escaped=escapeRegex(property);
  const a=String(html??"").match(new RegExp("<meta[^>]+(?:property|name)=[\"']"+escaped+"[\"'][^>]+content=[\"']([^\"']+)[\"'][^>]*>","i"));
  if(a) return decodeEntity(a[1]).trim();
  const b=String(html??"").match(new RegExp("<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+(?:property|name)=[\"']"+escaped+"[\"'][^>]*>","i"));
  return b?decodeEntity(b[1]).trim():null;
}

export function parseOfficialWebHtml(html,{url}={}){
  if(typeof html!=="string"||html.length<20) return null;

  const structured=jsonLdArticle(html);

  let cleaned=removeBlocks(html,"script");
  cleaned=removeBlocks(cleaned,"style");
  cleaned=removeBlocks(cleaned,"noscript");

  const title=structured?.title||metaContent(cleaned,"og:title")||firstTag(cleaned,"title")||firstTag(cleaned,"h1")||null;
  const description=structured?.description||metaContent(cleaned,"description")||null;

  const paragraphs=[];
  const re=/<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while((match=re.exec(cleaned))!==null){
    const text=stripTags(match[1]);
    if(text.length>=20) paragraphs.push(text);
  }

  const body=paragraphs.length?paragraphs.join("\n"):(structured?.body||stripTags(cleaned));
  const finalParagraphs=paragraphs.length?paragraphs:(structured?.paragraphs||[]);

  if(!title||body.length<20) return null;

  return {
    url:String(url??""),
    title,
    description,
    body,
    paragraphs:finalParagraphs
  };
}
