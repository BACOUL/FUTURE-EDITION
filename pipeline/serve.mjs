import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 4321);
const root = new URL("../dist/", import.meta.url).pathname;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

createServer(async (req, res) => {
  try {
    const raw = decodeURIComponent((req.url || "/").split("?")[0]);
    const safe = normalize(raw).replace(/^([.][.][/\\])+/, "");
    let path = join(root, safe);
    const info = await stat(path).catch(() => null);
    if (info?.isDirectory()) path = join(path, "index.html");
    else if (!info && !extname(path)) path = join(path, "index.html");
    const body = await readFile(path);
    res.writeHead(200, { "content-type": mime[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`FUTURE_SITE_SERVING|http://127.0.0.1:${port}`);
});
