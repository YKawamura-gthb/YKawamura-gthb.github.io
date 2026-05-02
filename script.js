const siteData = window.SITE_DATA || {};
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) {
    element.textContent = value;
  }
}

function setLink(selector, href) {
  const element = document.querySelector(selector);
  if (element && href) {
    element.href = href;
  }
}

setText(".identity h1", siteData.name);
setText(".role", siteData.role);
setText(".photo-placeholder", siteData.initials);
setLink('.profile-links a[href^="https://orcid.org"]', siteData.orcidUrl);
setLink('.profile-links a[href*="scholar.google"]', siteData.googleScholarUrl);
function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en") : value;
}

function setMetric(selector, value, animate = true) {
  const element = document.querySelector(selector);
  const number = Number(value);

  if (!element || !Number.isFinite(number)) {
    return;
  }

  element.dataset.value = String(number);

  if (!animate || prefersReducedMotion.matches) {
    element.textContent = formatNumber(number);
    return;
  }

  const start = Math.max(0, Math.floor(number * 0.72) - 3);
  const duration = 1150;
  const started = performance.now();

  function tick(now) {
    const progress = Math.min((now - started) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (number - start) * eased);

    if (element.textContent !== formatNumber(current)) {
      element.classList.remove("is-flipping");
      void element.offsetWidth;
      element.textContent = formatNumber(current);
      element.classList.add("is-flipping");
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = formatNumber(number);
      element.classList.remove("is-flipping");
    }
  }

  requestAnimationFrame(tick);
}

function applyMetrics(metrics, animate = true) {
  setMetric("#metric-citations", metrics?.citations, animate);
  setMetric("#metric-hindex", metrics?.hIndex, animate);
  setText("#metrics-updated", metrics?.updated);
}

applyMetrics(siteData.metrics, false);

fetch("scholar-stats.json", { cache: "no-store" })
  .then((response) => (response.ok ? response.json() : null))
  .then((metrics) => {
    if (metrics) {
      applyMetrics(metrics, true);
    }
  })
  .catch(() => {
    applyMetrics(siteData.metrics, true);
  });

function createPublicationTopic(topic, isOpen = false) {
  const details = document.createElement("details");
  details.className = "topic-card";
  details.open = isOpen;

  const summary = document.createElement("summary");
  const text = document.createElement("span");
  const title = document.createElement("strong");
  const description = document.createElement("small");
  const count = document.createElement("span");

  title.textContent = topic.title;
  description.textContent = topic.description;
  count.className = "paper-count";
  count.textContent = `${topic.papers.length} ${topic.papers.length === 1 ? "paper" : "papers"}`;

  text.append(title, description);
  summary.append(text, count);

  const list = document.createElement("ol");
  list.className = "publication-list";

  topic.papers.forEach((paper) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const meta = document.createElement("span");

    link.href = paper.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = paper.title;
    meta.innerHTML = paper.citation.replace(/<(?!\/?strong\b)[^>]*>/g, "");

    item.append(link, meta);
    list.append(item);
  });

  details.append(summary, list);
  return details;
}

function attachTopicHover() {
  document.querySelectorAll(".topic-card").forEach((topic) => {
    topic.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover)").matches) {
        topic.open = true;
      }
    });
  });
}

fetch("publications.json", { cache: "no-store" })
  .then((response) => (response.ok ? response.json() : null))
  .then((data) => {
    const container = document.querySelector("#publication-topics");
    if (!container || !data?.topics?.length) {
      return;
    }

    container.replaceChildren(...data.topics.map((topic, index) => createPublicationTopic(topic, index === 0)));
    attachTopicHover();
  })
  .catch(() => {});

function activateTab(tabName) {
  document.querySelectorAll(".tab-button").forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === tabName);
  });
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    const tabName = button.dataset.tab;
    document.getElementById(tabName)?.scrollIntoView({ behavior: "smooth", block: "start" });
    activateTab(tabName);
  });
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible?.target.id) {
      activateTab(visible.target.id);
    }
  },
  {
    root: null,
    rootMargin: "-25% 0px -45% 0px",
    threshold: [0.2, 0.45, 0.7]
  }
);

document.querySelectorAll(".tab-panel").forEach((panel) => {
  sectionObserver.observe(panel);
});

attachTopicHover();
