const fs = require("node:fs");

const scholarBase = "https://scholar.google.co.jp";
const scholarUrl = `${scholarBase}/citations?user=TOmnEFgAAAAJ&hl=en&pagesize=100`;

const topics = [
  {
    key: "stroke",
    title: "Stroke, neuroinflammation, and biomarkers",
    description: "Intracerebral hemorrhage, post-stroke seizures, immune signatures, and biofluid biomarkers.",
    papers: []
  },
  {
    key: "ai",
    title: "Clinical AI and machine learning",
    description: "Time-series modelling, clinical prediction, implementation barriers, and decision support.",
    papers: []
  },
  {
    key: "vascular",
    title: "Vascular biomechanics, aortopathy, and mechanobiology",
    description: "Aortic remodeling, mechanosensing, progeria, Marfan syndrome, and arterial mechanics.",
    papers: []
  }
];

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&alpha;/g, "alpha")
    .replace(/&beta;/g, "beta")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function hasJapaneseText(value) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(value);
}

function absoluteUrl(url) {
  if (!url) {
    return "";
  }

  if (url.startsWith("http")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${scholarBase}${url}`;
  }

  return url;
}

function parseRows(html) {
  const rows = [...html.matchAll(/<tr class="gsc_a_tr">([\s\S]*?)<\/tr>/g)];

  return rows.map((row) => {
    const content = row[1];
    const titleMatch = content.match(/<a href="([^"]+)" class="gsc_a_at">([\s\S]*?)<\/a>/);
    const citationMatch = content.match(/<td class="gsc_a_c">[\s\S]*?<a href="([^"]*)" class="gsc_a_ac[^"]*">([^<]*)<\/a>/);
    const grayMatches = [...content.matchAll(/<div class="gs_gray">([\s\S]*?)<\/div>/g)].map((match) => stripTags(match[1]));
    const yearMatch = content.match(/<span class="gsc_a_h[^"]*">([^<]*)<\/span>/);

    return {
      title: titleMatch ? stripTags(titleMatch[2]) : "",
      detailUrl: titleMatch ? absoluteUrl(decodeEntities(titleMatch[1])) : "",
      scholarUrl: citationMatch && citationMatch[1] ? absoluteUrl(decodeEntities(citationMatch[1])) : "",
      citationCount: citationMatch ? Number(stripTags(citationMatch[2]).replace(/,/g, "")) || 0 : 0,
      authors: grayMatches[0] || "",
      venue: grayMatches[1] || "",
      year: yearMatch ? stripTags(yearMatch[1]) : ""
    };
  });
}

function classifyPaper(paper) {
  const text = `${paper.title} ${paper.venue}`.toLowerCase();

  if (/stroke|intracerebral|hemorrhage|haemorrhage|seizure|epilepsy|microglia|monocyte|neuro|biomarker|penumbra|dwi/.test(text)) {
    return "stroke";
  }

  if (/machine learning|artificial intelligence|\bai\b|flow matching|time series|electronic health record|clinical risk|atrial fibrillation|prediction|deep learning|physician buy-in/.test(text)) {
    return "ai";
  }

  return "vascular";
}

function boldAuthorName(value) {
  return value
    .replace(/\bYuki Kawamura\b/g, "<strong>Yuki Kawamura</strong>")
    .replace(/\bY Kawamura\b/g, "<strong>Y. Kawamura</strong>");
}

function citationFor(paper) {
  const year = paper.year ? `, ${paper.year}` : "";
  return boldAuthorName(`${paper.authors}. ${paper.venue}${year}.`.replace(/\s+/g, " "));
}

function dedupe(papers) {
  const byTitle = new Map();

  papers.forEach((paper) => {
    const key = paper.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const existing = byTitle.get(key);

    if (!existing || Number(paper.year || 0) > Number(existing.year || 0) || paper.url.includes("pmc.ncbi.nlm.nih.gov")) {
      byTitle.set(key, paper);
    }
  });

  return [...byTitle.values()].sort((a, b) => Number(b.year || 0) - Number(a.year || 0) || a.title.localeCompare(b.title));
}

async function fetchText(url) {
  let response;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 Academic website publications updater"
      }
    });

    if (response.ok || response.status !== 429) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 15000));
  }

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.text();
}

async function main() {
  let html;

  try {
    html = await fetchText(scholarUrl);
  } catch (error) {
    if (fs.existsSync("publications.json")) {
      const current = JSON.parse(fs.readFileSync("publications.json", "utf8"));
      const paperCount = current.topics?.reduce((count, topic) => count + (topic.papers?.length || 0), 0) || 0;

      if (paperCount > 0) {
        console.warn(`Could not refresh publications (${error.message}); keeping ${paperCount} existing entries.`);
        return;
      }
    }

    throw error;
  }

  const rows = parseRows(html).filter((paper) => paper.title && !hasJapaneseText(paper.title));
  const papers = [];

  for (const row of rows.filter((paper) => paper.scholarUrl && !hasJapaneseText(paper.authors) && !hasJapaneseText(paper.venue))) {
    papers.push({
      title: row.title,
      citation: citationFor(row),
      year: row.year,
      url: row.scholarUrl
    });
  }

  dedupe(papers).forEach((paper) => {
    const topic = topics.find((candidate) => candidate.key === classifyPaper(paper));
    topic.papers.push(paper);
  });

  const output = {
    updated: new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date()),
    topics
  };

  fs.writeFileSync("publications.json", `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Updated publications: ${papers.length} linked entries`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
