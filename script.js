const siteData = window.SITE_DATA || {};

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
setLink('.profile-links a[href^="https://scholar.google.com"]', siteData.googleScholarUrl);
setText("#metric-citations", siteData.metrics?.citations);
setText("#metric-hindex", siteData.metrics?.hIndex);
setText("#metrics-updated", siteData.metrics?.updated);

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    const tabName = button.dataset.tab;

    document.querySelectorAll(".tab-button").forEach((tab) => {
      tab.classList.toggle("is-active", tab === button);
      tab.setAttribute("aria-selected", String(tab === button));
    });

    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === tabName);
    });
  });
});

document.querySelectorAll(".topic-card").forEach((topic) => {
  topic.addEventListener("mouseenter", () => {
    if (window.matchMedia("(hover: hover)").matches) {
      topic.open = true;
    }
  });
});
