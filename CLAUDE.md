# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

GitHub profile repo for Matt Wicks. The README.md is auto-updated by GitHub Actions with blog posts (RSS), YouTube videos (API), and stats cards.

## Commands

```bash
bun install          # install deps
bun scripts/fetch-blog-posts.js      # update blog section in README
bun scripts/fetch-youtube-videos.js  # update YouTube section (needs YOUTUBE_API_KEY env var)
```

## Architecture

- **README.md** — the profile. Content between HTML comment markers (`<!-- BLOG-POST-LIST:START/END -->`, `<!-- YOUTUBE-VIDEOS-LIST:START/END -->`) is machine-managed. Don't hand-edit those sections.
- **scripts/** — ESM scripts (run via Bun) that parse RSS/YouTube feeds and splice content into README via marker comments
- **profile/** — Generated stats SVGs (committed by CI, not hand-edited)
- **.github/workflows/**
  - `daily-update.yml` — runs every 4h + on push: fetches blog & YouTube, auto-commits
  - `daily-stats.yml` — runs at midnight: regenerates stats cards via `readme-tools/github-readme-stats-action`

## Key Details

- Runtime & package manager: **Bun**
- YouTube API key is a GitHub Actions secret (`YOUTUBE_API_KEY`)
- Videos with "zz" prefix in title are filtered out
- Blog feed: `wicksipedia.com/rss.xml` (top 10)
- YouTube: channel + playlist feed (top 10, sorted by date)
- Auto-commits use `stefanzweifel/git-auto-commit-action`
