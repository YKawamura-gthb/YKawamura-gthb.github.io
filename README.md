# Academic Website

A small static academic website ready for GitHub Pages.

## Customize

1. Replace the placeholder text in `index.html` under the `About me` and `Research` sections.
2. Edit `site-data.js` with your name, affiliation, ORCID URL, Google Scholar URL, citation count, and h-index.
3. Add your photo at `assets/profile-photo.jpg`.

## Publish on GitHub Pages

This repository is named `YKawamura-gthb.github.io`, so GitHub Pages can publish it as the root personal site:

`https://ykawamura-gthb.github.io`

In GitHub, go to **Settings > Pages** and publish from the `main` branch root if Pages is not already enabled.

## Google Scholar metrics

Google Scholar does not provide a standard public browser API for live citation and h-index widgets. This site uses `scholar-stats.json` for the visible widget, `publications.json` for the Research bibliography, and keeps fallback values in `site-data.js`.

The `.github/workflows/update-scholar-stats.yml` workflow refreshes these values and the publication list daily. It can also be run manually from the GitHub Actions tab.

Google Scholar may occasionally rate-limit automated requests. If that happens, the publication updater keeps the existing `publications.json` rather than replacing it with incomplete data. For the most reliable long-term publication automation, use ORCID or another API-friendly source as the canonical bibliography feed.
