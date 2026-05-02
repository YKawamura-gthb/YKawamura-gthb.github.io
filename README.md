# Academic Website

A small static academic website ready for GitHub Pages.

## Customize

1. Replace the placeholder text in `index.html` under the `About me` and `Research` sections.
2. Edit `site-data.js` with your name, affiliation, ORCID URL, Google Scholar URL, citation count, and h-index.
3. Add your photo at `assets/profile-photo.jpg`.

## Publish on GitHub Pages

This repository can be published through GitHub Pages from **Settings > Pages** using the main branch root.

Because the repository is named `yuki-kawamura`, the project site URL will usually be:

`https://ykawamura-gthb.github.io/yuki-kawamura/`

For a root personal site at `https://ykawamura-gthb.github.io`, rename the repository to `YKawamura-gthb.github.io`.

## Google Scholar metrics

Google Scholar does not provide a standard public browser API for live citation and h-index widgets. This template uses editable values in `site-data.js`, which is the most reliable option for a static GitHub Pages site. A later version can add a scheduled GitHub Action to update these values automatically.
