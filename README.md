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

## Updates

Google Scholar metrics are refreshed daily by `.github/workflows/update-scholar-stats.yml`. The workflow updates only the sidebar stats in `site-data.js` and `index.html`.

The Research bibliography is edited manually in `index.html`.
