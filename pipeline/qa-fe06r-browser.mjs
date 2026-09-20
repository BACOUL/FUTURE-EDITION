import { chromium } from "playwright";
import { mkdir, writeFile, rm } from "node:fs/promises";

const base = process.env.FE06R_BASE_URL || "http://127.0.0.1:4321";
const outDir = new URL("../benchmarks/fe06r/browser-qa/", import.meta.url);
const shotDir = new URL("./screenshots/", outDir);
await rm(outDir, { recursive: true, force: true });
await mkdir(shotDir, { recursive: true });

const widths = [360, 390, 768, 1440];
const pages = [
  {
    id: "R1-home",
    path: "/",
    markers: ["KNOWLEDGE CLOCK", "REFERENCE EDITION", "REALITY CHECK · RC-001", "WATCH HORIZON", "FUTURE GRAPH"],
    selectors: [".home2-lead", ".state-plate", ".delta-block", ".home2-reality", ".home2-watch"]
  },
  {
    id: "R2-article",
    path: "/avance/nif-ignition-fusion-2022/",
    markers: ["AVANCÉE DE RÉFÉRENCE", "EVIDENCE SPINE", "CE QUE CELA NE PROUVE PAS", "WATCH HORIZON", "AGENT VIEW"],
    selectors: [".article-hero", ".delta-block", ".evidence-spine", ".watch-horizon", ".article-agent-dock"]
  },
  {
    id: "R3-observatory",
    path: "/questions/energie-de-fusion-commerciale/",
    markers: ["STATE ROOM", "TIMEGLASS", "MILESTONE FIELD", "EVIDENCE LANDSCAPE", "CONTRADICTION SPLIT", "AGENT STATE"],
    selectors: [".state-plate", ".obs2-timeglass", ".obs2-milestone-grid", ".obs2-evidence-grid", ".obs2-agent-dock"]
  },
  {
    id: "R4-methodology",
    path: "/methodologie/",
    markers: ["R4 · OPEN THE MACHINE", "DECISION PIPELINE", "SOURCE HIERARCHY", "EVIDENCE LADDERS", "STATE RESOLUTION", "CORRECTION TRAIL", "ONE TRUTH · MULTIPLE VIEWS"],
    selectors: [".method2-flow", ".method2-source-grid", ".method2-ladders", ".method2-state-grid", ".method2-correction-flow", ".method2-machine-stack"]
  }
];

const browser = await chromium.launch({ headless: true });
const results = [];
let failures = 0;

for (const pageDef of pages) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const url = base + pageDef.path;
    const response = await page.goto(url, { waitUntil: "networkidle" });
    const result = {
      page: pageDef.id,
      path: pageDef.path,
      width,
      http_status: response?.status() ?? null,
      pass: true,
      failures: [],
      metrics: {},
      screenshot: `screenshots/${pageDef.id}-${width}.png`
    };

    if (!response || response.status() !== 200) {
      result.pass = false;
      result.failures.push(`HTTP status ${response?.status() ?? "none"}`);
    }

    const bodyText = await page.locator("body").innerText();
    for (const marker of pageDef.markers) {
      if (!bodyText.includes(marker)) {
        result.pass = false;
        result.failures.push(`missing marker: ${marker}`);
      }
    }

    for (const selector of pageDef.selectors) {
      const count = await page.locator(selector).count();
      if (!count) {
        result.pass = false;
        result.failures.push(`missing selector: ${selector}`);
      }
    }

    const geometry = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const h1 = document.querySelector("h1");
      const h1Rect = h1?.getBoundingClientRect() ?? null;
      return {
        document_scroll_width: root.scrollWidth,
        body_scroll_width: body.scrollWidth,
        viewport_width: window.innerWidth,
        document_height: root.scrollHeight,
        h1: h1Rect ? {
          left: h1Rect.left,
          right: h1Rect.right,
          top: h1Rect.top,
          width: h1Rect.width,
          height: h1Rect.height
        } : null
      };
    });

    result.metrics = geometry;

    if (geometry.document_scroll_width > width + 1 || geometry.body_scroll_width > width + 1) {
      result.pass = false;
      result.failures.push(`horizontal overflow: document=${geometry.document_scroll_width}, body=${geometry.body_scroll_width}, viewport=${width}`);
    }

    if (!geometry.h1) {
      result.pass = false;
      result.failures.push("missing h1");
    } else if (geometry.h1.left < -1 || geometry.h1.right > width + 1) {
      result.pass = false;
      result.failures.push(`h1 outside viewport: left=${geometry.h1.left}, right=${geometry.h1.right}`);
    }

    const nav = await page.evaluate(() => {
      const mobile = document.querySelector(".mobile-dock");
      const desktop = document.querySelector(".desktop-nav");
      const style = (el) => el ? getComputedStyle(el).display : "missing";
      return { mobile: style(mobile), desktop: style(desktop) };
    });
    result.metrics.navigation = nav;

    if (width <= 700) {
      if (nav.mobile === "none" || nav.mobile === "missing") {
        result.pass = false;
        result.failures.push("mobile dock not visible on mobile");
      }
      if (nav.desktop !== "none") {
        result.pass = false;
        result.failures.push("desktop navigation still visible on mobile");
      }
    } else {
      if (nav.desktop === "none" || nav.desktop === "missing") {
        result.pass = false;
        result.failures.push("desktop navigation not visible on tablet/desktop");
      }
    }

    const emptyLinks = await page.locator('a[href=""], a:not([href])').count();
    if (emptyLinks) {
      result.pass = false;
      result.failures.push(`empty links: ${emptyLinks}`);
    }

    await page.screenshot({
      path: new URL(result.screenshot, outDir).pathname,
      fullPage: true
    });

    if (!result.pass) failures++;
    results.push(result);
    await page.close();
  }
}

await browser.close();

const report = {
  schema_version: "fe06r/browser-qa/v1",
  generated_at: new Date().toISOString(),
  base_url: base,
  pages: pages.map((p) => p.id),
  widths,
  checks: results.length,
  failures,
  pass: failures === 0,
  results
};

await writeFile(new URL("report.json", outDir), JSON.stringify(report, null, 2) + "\n");
console.log(`FE06R_BROWSER_QA_${report.pass ? "PASS" : "FAIL"}|pages=${pages.length}|widths=${widths.length}|checks=${results.length}|failures=${failures}`);

if (!report.pass) {
  for (const result of results.filter((x) => !x.pass)) {
    console.error(`- ${result.page}@${result.width}: ${result.failures.join("; ")}`);
  }
  process.exit(1);
}
