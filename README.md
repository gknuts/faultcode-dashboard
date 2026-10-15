# Fault Code Dashboard

Interactive timeline dashboard for monitoring fault codes across rolling stock assets.

## What it does

Visualizes daily fault code occurrences per asset on a scrollable heatmap timeline. Each cell (bubble) represents one asset × fault code × day, sized by occurrence count. Users can filter by asset or fault code, navigate time periods, and qualify bubbles as normal/abnormal.

## Features

- **Heatmap timeline** — bubble size encodes occurrence count per day
- **Asset × fault code matrix** — rows group by asset, nested by fault code
- **Filtering** — filter by asset and/or fault code
- **Qualification** — mark bubbles normal/abnormal, persisted in local state
- **Hide rows** — collapse individual asset/fault code rows
- **Period navigation** — week / month / quarter views

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- TanStack Virtual (virtualized rows)
- D3 scale (bubble sizing)

## Getting started

```bash
npm install
npm run dev
```

## Deployment

Automatically deployed to GitHub Pages on push to `main` via GitHub Actions.

Live: https://gknuts.github.io/faultcode-dashboard/
