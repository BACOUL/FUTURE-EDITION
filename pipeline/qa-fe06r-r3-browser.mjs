import { chromium } from "playwright";
import { mkdir, rm, writeFile } from "node:fs/promises";
const base=process.env.FE06R_V2_BASE_URL||"http://127.0.0.1:4322";
const outDir=new URL("../benchmarks/fe06r/r3-browser-qa/",import.meta.url);
const shotDir=new URL("./screenshots/",outDir);
await rm(outDir,{recursive:true,force:true});await mkdir(shotDir,{recursive:true});
const widths=[360,390,768,1440];
const pages=[
  {id:"home-v2",path:"/",markers:["Quand l’IA formule l’hypothèse","Ce que nous enquêtons maintenant","Une question qui vient de bouger"],selectors:[".hero",".signals",".observatory-band",".watch"]},
  {id:"article-v2",path:"/avance/robin-ia-hypothese-laboratoire/",markers:["Une IA a proposé des pistes. Des chercheurs les ont testées.","CE QUI CHANGE RÉELLEMENT","Ce que ce résultat ne permet pas de dire"],selectors:[".article-hero",".article-figure",".article-body",".limits",".verify"]},
  {id:"observatory-v2",path:"/observatoires/ia-decouvertes-scientifiques/",markers:["Oui — dans un sens limité mais désormais mieux étayé.","La trajectoire en six moments","Cinq étapes. Une seule possède aujourd’hui un état validé."],selectors:[".obs-hero",".timeline",".milestones",".next-proof"]},
  {id:"evidence-v2",path:"/preuves/ev-2026-008006/",markers:["Pourquoi Robin renforce le niveau de confiance","L’AFFIRMATION SOUTENUE","SOURCE PRIMAIRE","DÉCISION ÉDITORIALE"],selectors:[".evidence-hero",".evidence-layout",".claim-quote"]}
];
const browser=await chromium.launch({headless:true});const results=[];let failures=0;
for(const def of pages){for(const width of widths){const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});const response=await page.goto(base+def.path,{waitUntil:"networkidle"});const result={page:def.id,path:def.path,width,http_status:response?.status()??null,pass:true,failures:[],screenshot:"screenshots/"+def.id+"-"+width+".png",metrics:{}};
if(!response||response.status()!==200){result.pass=false;result.failures.push("HTTP "+(response?.status()??"none"))}
const text=await page.locator("body").innerText();for(const m of def.markers){if(!text.includes(m)){result.pass=false;result.failures.push("missing marker "+m)}}for(const s of def.selectors){if(await page.locator(s).count()===0){result.pass=false;result.failures.push("missing selector "+s)}}
const geo=await page.evaluate(()=>{const r=document.documentElement;const b=document.body;const h1=document.querySelector("h1")?.getBoundingClientRect();return{viewport:innerWidth,scrollWidth:r.scrollWidth,bodyWidth:b.scrollWidth,h1:h1?{left:h1.left,right:h1.right,top:h1.top,height:h1.height}:null,firstScreenText:(document.elementFromPoint(innerWidth/2,Math.min(500,innerHeight-1))?.closest("section")?.innerText||"").slice(0,600)}});result.metrics=geo;
if(geo.scrollWidth>width+1||geo.bodyWidth>width+1){result.pass=false;result.failures.push("horizontal overflow")}
if(!geo.h1||geo.h1.left<-1||geo.h1.right>width+1){result.pass=false;result.failures.push("h1 outside viewport")}
if(width<=620){if(await page.locator(".desktop-nav").evaluate(el=>getComputedStyle(el).display)!=="none"){result.pass=false;result.failures.push("desktop nav visible on mobile")}}
const empty=await page.locator('a[href=""],a:not([href])').count();if(empty){result.pass=false;result.failures.push("empty links "+empty)}
await page.screenshot({path:new URL(result.screenshot,outDir).pathname,fullPage:true});if(!result.pass) failures++;results.push(result);await page.close();}}
await browser.close();
const report={schema_version:"fe06r/r3-browser-qa/v1",generated_at:new Date().toISOString(),base_url:base,widths,pages:pages.map(x=>x.id),checks:results.length,failures,pass:failures===0,results};
await writeFile(new URL("report.json",outDir),JSON.stringify(report,null,2)+"\n");
console.log("FE06R_R3_BROWSER_QA_"+(report.pass?"PASS":"FAIL")+"|checks="+results.length+"|failures="+failures);
if(!report.pass) process.exit(1);
