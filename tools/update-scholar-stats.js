const fs = require("node:fs");

const scholarUrl = "https://scholar.google.co.jp/citations?user=TOmnEFgAAAAJ&hl=en&pagesize=100";

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractStats(html) {
  const text = decodeEntities(html.replace(/\s+/g, " "));
  const citedMatch = text.match(/Cited by\s+([0-9,]+)/i);
  const tableCells = [...html.matchAll(/<td[^>]*class="gsc_rsb_std"[^>]*>([0-9,]+)<\/td>/g)].map((match) =>
    Number(match[1].replace(/,/g, ""))
  );

  const citations = citedMatch ? Number(citedMatch[1].replace(/,/g, "")) : tableCells[0];
  const hIndex = tableCells[2];
  const i10Index = tableCells[4];

  if (![citations, hIndex, i10Index].every(Number.isFinite)) {
    throw new Error("Could not parse Google Scholar metrics.");
  }

  return {
    citations,
    hIndex,
    i10Index,
    updated: new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date())
  };
}

function updateSiteData(metrics) {
  const path = "site-data.js";
  const source = fs.readFileSync(path, "utf8");
  const next = source.replace(
    /metrics:\s*\{[\s\S]*?\n  \}/,
    `metrics: {
    citations: "${metrics.citations}",
    hIndex: "${metrics.hIndex}",
    i10Index: "${metrics.i10Index}",
    updated: "${metrics.updated}"
  }`
  );

  if (source === next) {
    return false;
  }

  fs.writeFileSync(path, next);
  return true;
}

function updateIndex(metrics) {
  const path = "index.html";
  const source = fs.readFileSync(path, "utf8");
  const next = source
    .replace(/(<span id="metrics-updated">)[^<]*(<\/span>)/, `$1${metrics.updated}$2`)
    .replace(
      /(<dd id="metric-citations" class="flip-number" data-metric="citations" data-value=")[^"]*(">)[^<]*(<\/dd>)/,
      `$1${metrics.citations}$2${metrics.citations}$3`
    )
    .replace(
      /(<dd id="metric-hindex" class="flip-number" data-metric="hIndex" data-value=")[^"]*(">)[^<]*(<\/dd>)/,
      `$1${metrics.hIndex}$2${metrics.hIndex}$3`
    );

  if (source === next) {
    return false;
  }

  fs.writeFileSync(path, next);
  return true;
}

async function main() {
  const response = await fetch(scholarUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 Academic website metrics updater"
    }
  });

  if (!response.ok) {
    throw new Error(`Google Scholar returned ${response.status}`);
  }

  const html = await response.text();
  const metrics = extractStats(html);
  const changed = updateSiteData(metrics) || updateIndex(metrics);

  console.log(
    `Scholar stats: citations=${metrics.citations}, hIndex=${metrics.hIndex}, i10Index=${metrics.i10Index}, changed=${changed}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
