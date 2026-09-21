import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const port=Number(process.env.PORT||4322);
const root=new URL("../dist-v2/",import.meta.url);
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".xml":"application/xml; charset=utf-8",".txt":"text/plain; charset=utf-8"};
const server=createServer(async(req,res)=>{
  try{
    const raw=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    let rel=raw.replace(/^\/+/, "");
    if(!rel) rel="index.html";
    else if(raw.endsWith("/")) rel+="index.html";
    const url=new URL(rel,root);
    const data=await readFile(url);
    res.writeHead(200,{"content-type":mime[extname(rel)]||"application/octet-stream","cache-control":"no-store"});
    res.end(data);
  }catch{
    res.writeHead(404,{"content-type":"text/plain; charset=utf-8"});
    res.end("Not found");
  }
});
server.listen(port,"127.0.0.1",()=>console.log("FE06R_V2_SERVER|http://127.0.0.1:"+port));
