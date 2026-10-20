# Specification — Fault Codes Dashboard

> **Version 1.0 — MVP livré** (mis à jour le 2026-10-20 pour refléter l'état réel du code)

## 1. Context, goal and scope

The application is a front-end-only single-page app, with no backend, that shows on a timeline the daily number of occurrences of each fault code for each railway asset, and lets the user qualify each day as Abnormal or Normal. The whole user interface is in English.

**In scope — implemented**

- Loading data from a static JSON file (with `BASE_URL` support for GitHub Pages subpath deployment).
- Filter bar: Asset multi-select, Fault code single-select, 6 checkboxes, Week / Month period selector with navigation.
- Back-navigation buttons: when an asset or fault code is selected, a purple pill button with `ChevronLeft` appears in the filter bar to clear that selection.
- Left-hand list of assets (collapsible) and their fault codes. Asset label is clickable to set the asset filter. Fault code badge is clickable to set the code filter.
- Right-hand timeline: one column per day, one bubble per asset + fault code + day, size proportional to the number of occurrences, colour based on status.
- Vertical "today" line and triangle.
- Qualifying a bubble through an Abnormal | Normal menu.
- Hiding a whole row (Not interesting) with the eye icon.
- Persisting user actions in localStorage and the view state in the URL.
- Single-code mode: when exactly one fault code is selected, each asset row becomes a 64 px bubble row directly (no sub-rows beneath it).
- Visual separators between groups of abnormal-only rows and normal-only rows when both status filters are active.
- GitHub Pages deployment via GitHub Actions; live at `https://gknuts.github.io/faultcode-dashboard/`.
- `window.fcdReset()` console helper to clear localStorage and reload.

**Out of scope — not implemented**

- Backend, API, authentication, roles, change history.
- Live Map, Reporting and New corrective event links, RailGenius menu, Support button, user menu.
- The "Inspect" button.
- Today and 3D presets.
- Data tooltips on hover, multi-selection of bubbles.
- Light theme, mobile and tablet layouts.
- Group rings (code written in `BubbleRow.tsx` but the component is not used in the rendered timeline).
- Hover halo on bubbles (same: code exists in `BubbleRow.tsx`, not rendered).
- Automated tests (Vitest, Playwright). `scripts/generate-mock.ts` exists but no test suite.
- Header band (48 px): `Header.tsx` component exists but is not rendered in `App.tsx`.

## 2. Technical constraints and stack

Vite + React 19 + TypeScript, timeline rendered inline (SVG circles inside `<div>` rows), built as a static site.

| Need | Choice | Note |
| --- | --- | --- |
| Build | Vite 8, `npm run build` outputs a static `dist/` folder | `base: '/faultcode-dashboard/'` for GitHub Pages |
| UI | React 19 + strict TypeScript | Function components and hooks only |
| Styling | Tailwind CSS 3 + inline styles | Mixed: Tailwind for flex/layout, inline styles for colours and component-specific sizing |
| Global state | Zustand 5 | Single store (`src/store/index.ts`) |
| Dates | date-fns 4 | All dates as `YYYY-MM-DD`, local time, no time zone |
| Bubble scale | d3-scale (`scaleSqrt`) | Only d3 module used |
| Asset select | react-select 5 — multi, dark-styled | Shows label (1 selection) or "N assets" (N > 1) or placeholder |
| Fault code select | react-select 5 — **single**, dark-styled | Shows code (1 selection) or "All" (none) |
| Vertical virtualisation | @tanstack/react-virtual 3 | Overscan 5 rows |
| Popover | @floating-ui/react | Positions the Abnormal / Normal menu |
| Icons | lucide-react | `ChevronUp`, `ChevronDown`, `ChevronLeft`, `ChevronRight`, `EyeOff`, `Calendar`, `Clock` |

**Constraints**

- Desktop only, minimum supported width 1280 px, target 1920 px. Browsers: latest Chrome, Edge, Firefox.
- No horizontal scrolling: the timeline takes all remaining width and the day columns share that width equally.
- Vertical scrolling is allowed in the rows area only; the filter bar, the top date axis and the footer stay fixed.
- Reference volume: about 100 assets, about 100 fault codes per asset, 31 days displayed. Virtualisation: only visible rows plus a 5-row overscan are rendered.
- Folder structure implemented: `src/data/` (loader, types), `src/store/`, `src/components/`, `src/lib/` (dates, scale, url, localStorage), `public/data/faults.json`, `scripts/generate-mock.ts`.

## 3. Input data model

On start-up the app reads `public/data/faults.json` with `fetch(`${BASE_URL}/data/faults.json`)` (`BASE_URL` = `import.meta.env.BASE_URL` stripped of trailing slash). While loading, shows "Loading…" centred on a black background; on error, shows "Unable to load fault data." in red (`#EF4444`) with a purple `accent`-coloured "Retry" button.

```typescript
type ISODate = string; // 'YYYY-MM-DD'

interface FaultData {
  assets: Asset[];
  faultCodes: FaultCode[];
  groups: Group[];
  occurrences: DailyOccurrence[];
}

interface Asset {
  id: string;        // stable identifier, e.g. '485001'
  label: string;     // displayed text, e.g. '485 001'
}

interface FaultCode {
  code: string;        // e.g. '281F'
  description: string; // e.g. 'Meld Druck/Temp/Vist-Einzelwerte'
}

interface Group {
  id: string;       // e.g. 'g-485001-2026-01-28'
  color?: string;   // optional hex colour
}

interface DailyOccurrence {
  assetId: string;
  faultCode: string;
  date: ISODate;
  count: number;                    // integer >= 1
  status: 'abnormal' | 'normal';
  groupId?: string;
}
```

**Data validation rules (implemented in `src/data/loader.ts`)**

- On duplicate `assetId + faultCode + date`: sum `count` values, keep `abnormal` if either is abnormal; log `console.warn`.
- Occurrence with unknown `assetId` or `faultCode`: ignored with `console.warn`.
- Group validation: all occurrences of the same `groupId` must share the same `assetId`. If not, the `groupId` field is stripped from all those occurrences (they show without a ring). Date consistency within groups is **not** validated.
- A timeline row is an `assetId + faultCode` pair with at least one occurrence in the displayed period. Row key: `` `${assetId}|${faultCode}` ``. Bubble key: `` `${assetId}|${faultCode}|${date}` ``.

**`scripts/generate-mock.ts`** exists and generates `public/data/faults.json` (run with `tsx`). Detailed mock parameters are defined in the script.

## 4. State, localStorage and URL

User decisions (qualifications, hidden rows, collapsed assets) live in localStorage; view state (period, filters) lives in the URL. The source JSON is never modified.

**localStorage** (prefix `fcd:`, JSON values, wrapped in `try/catch`; on failure the app works without persistence)

| Key | Type | Content |
| --- | --- | --- |
| `fcd:validations` | `Record<string, { status: 'abnormal' \| 'normal'; validatedAt: string }>` | Key = bubble key; `validatedAt` = `new Date().toISOString()` |
| `fcd:hiddenRows` | `string[]` | Row keys marked Not interesting |
| `fcd:collapsedAssets` | `string[]` | `assetId` of collapsed assets |
| `fcd:version` | `number` | Schema version = `1`; on mismatch all `fcd:` keys are cleared |

All reads and writes are in `src/lib/localStorage.ts`. On start-up, `initStorage()` checks the version and clears stale data if the version number changed.

**Computation rules**

- Effective status of a bubble = `validations[key].status` if present, else `occurrence.status` from JSON.
- A bubble is "Validated" if and only if its key exists in `fcd:validations`.
- A row is "Not interesting" if its key is in `fcd:hiddenRows`.

**URL** (query string, updated with `history.replaceState` on every change, read on start-up; invalid values replaced by defaults)

| Parameter | Values | Default |
| --- | --- | --- |
| `view` | `1W` or `1M` | `1M` |
| `end` | `YYYY-MM-DD` | today + 15 days (so today is roughly centred in the 1M period) |
| `assets` | comma-separated `assetId` list | absent = all |
| `codes` | comma-separated fault code list (single value in practice) | absent = all |
| `filters` | subset of `val,nval,int,nint,abn,norm` | `val,nval,int,nint` (Validated, Not validated, Interesting, Not interesting checked; Abnormal and Normal **unchecked** by default) |

Example: `?view=1M&end=2026-02-24&assets=485001&codes=281F&filters=val,nval,int,nint,abn,norm`.

`window.fcdReset()` clears all `fcd:` keys and reloads the page.

## 5. Layout and design system

The screen fills 100 % of the window (`100vh`, no page scrolling) and is split into fixed horizontal bands; only the rows area scrolls.

```
┌────────────────────────────────────────────────────────────────────┐
│ Filter bar (96 px)                                                 │
├──────────────────────────┬─────────────────────────────────┬───────┤
│ ASSET   FAULT CODE       │ date axis (40 px)           ▼   │       │
├──────────────────────────┼─────────────────────────────────┼───────┤
│ ^ ▌485 001               │                                 │       │
│   [0686] Tempera urgeb…  │ ·  ●  ◉  ●  ·  ·  ●             │  eye  │
│   [281F] Meld Druck/…    │ ·  ●  ◎  ·  ●  ·                │  eye  │  ← scrolls
│ ...                      │                                 │       │
├──────────────────────────┼─────────────────────────────────┼───────┤
│ ⏱ 24 Jan – 24 Feb 2026   │ date axis (40 px)               │       │
└──────────────────────────┴─────────────────────────────────┴───────┘
   left column 420 px        timeline (remaining width)        56 px
```

Note: the 48 px Header band is **not rendered**. The screen starts with the Filter bar. `Header.tsx` exists as a component but is not mounted.

**Horizontal grid**: fixed 420 px left column, timeline over all remaining width (measured via `ResizeObserver` on the container element), 56 px action column on the right. These three columns are aligned across the axis header, the rows and the footer.

**Colours**

| Token | Value | Usage |
| --- | --- | --- |
| `bg-app` | `#000000` | General background and asset rows |
| `bg-panel` | `#2A2A2C` | Filter bar |
| `bg-row-left` | `#0B0B0C` | Fault code row in the left column and action column |
| `bg-row` | `rgba(255,255,255,0.09)` | Background band of a fault code row in the timeline (≈ `#161616` on black) |
| `bg-control` | `#1C1C1E` | Selects, fault code badge |
| `border` | `#3A3A3C` | Control and badge borders |
| `grid` | `#1F1F22` | Top axis tick and row separator borders |
| `text` | `#FFFFFF` | Primary text |
| `text-muted` | `#A1A1AA` | Descriptions, axis labels, column headers |
| `accent` | `#6C4BF5` | Accent bar, back-button pill hover |
| `accent-dark` | `#5831E2` | Back-navigation button background |
| `abnormal` | `#F0436A` | Abnormal bubble (fill-opacity 1) |
| `normal` | `#2ECC71` | Normal bubble (fill-opacity 0.4) |
| `today` | `#4A4A4E` | "Today" line |
| `today-triangle` | `#D4D4D8` | Today triangle at top axis |
| `footer-bg` | `#111113` | Footer background |

**Typography**: `Inter` font (loaded via `index.css` or system fallback `system-ui, sans-serif`). Asset label 16 px bold; fault code badge 15 px bold; description 14 px `text-muted`; column headers 12 px uppercase `text-muted`; axis labels 12 px `text-muted`; checkbox labels 14 px.

## 6. Filter bar and period selector

The filter bar (`bg-panel` background, 96 px high, 40 px horizontal padding) lays out left-to-right: back button(s), Asset select, Fault code select, three pairs of checkboxes, spacer, period selector. Any change updates the view and the URL immediately.

**Back-navigation buttons** (left of Asset select)

- If `selectedCodes` is non-empty: a pill button with `ChevronLeft` (16 px) in `accent-dark` appears. Clicking it clears `selectedCodes`.
- If `selectedAssets` is non-empty: a second pill button with `ChevronLeft` appears. Clicking it clears `selectedAssets` and also resets `filters.abnormal` and `filters.normal` to `false`.
- Both buttons may be visible simultaneously when both selections are active.

**Asset select** (300 px wide)

- Small "Asset" label above. Multi-select with search on asset label. Placeholder "Select…". `controlShouldRenderValue: false`; custom `ValueContainer`: shows label (1 selection) or "N assets" (N > 1) or placeholder "Select…". No selection = all assets shown.
- `accentColor: '#FFFFFF'` on checkboxes in the dropdown.

**Fault code select** (420 px wide) — **single-select**

- "Fault codes" label. Single-select (not multi) with case-insensitive search on code and description. Options shown as `281F — Meld Druck/Temp/Vist-Einzelwerte`. Custom `ValueContainer`: shows code (1 selection) or "All" (no selection). Selecting a code activates single-code mode (see section 7).

**Checkboxes**: three columns of two boxes, 18 px `accentColor: '#FFFFFF'`, label on the right (14 px).

| Column | Top box | Bottom box | Applies to |
| --- | --- | --- | --- |
| 1 | Validated | Not validated | Each bubble |
| 2 | Interesting | Not interesting | Each row |
| 3 | Abnormal | Normal | Rows by effective status |

**Filtering rules (as implemented)**

1. Bubble visibility: shown if its Validated / Not validated category matches the checked box(es).
2. Row filtering by interesting/notInteresting: if only "Interesting" is checked → hide not-interesting rows; if only "Not interesting" is checked → hide interesting rows; if both or neither → show all.
3. Row filtering by abnormal/normal status: operates at the **row level** (whether the row has any abnormal or normal occurrences in the period), not per-bubble. When both are checked, rows are split into two groups (abnormal-leading rows first, then normal-only rows), separated by a visual separator. When only "Abnormal" is checked, only rows that have at least one abnormal occurrence and no normal occurrences are shown. When only "Normal" is checked, only rows that have at least one normal occurrence and no abnormal occurrences are shown. When neither is checked: no filtering by status (all rows shown).
4. A row with no occurrence in the displayed period is not rendered.
5. An asset with no rendered row is not rendered.
6. If nothing is displayed: "No fault codes match the current filters." centred in `text-muted`.

**Period selector** (right-aligned)

- Segmented control: "1W" and "1M" buttons, 48 px high, `border` border, 10 px radius; active = white background black bold text, inactive = white text transparent background.
- Left arrow (`ChevronLeft`), period text (e.g. "24 Jan – 24 Feb 2026", 20 px, `minWidth: 180`, centred), calendar icon (`Calendar`), right arrow (`ChevronRight`).
- 1W: 7 days, `end − 6 days` to `end` inclusive. 1M: `subMonths(end, 1)` to `end` (date-fns handles month-end overflow). Switching 1M ↔ 1W keeps `end`.
- Text format: `d MMM – d MMM yyyy`; cross-year: `d MMM yyyy – d MMM yyyy`.
- Left arrow: `navigateEnd(view, end, -1)` (−7 days in 1W, −1 month in 1M). Right arrow: same in the positive direction; **not disabled** when `end` reaches today (no opacity or pointer-events guard).
- Calendar icon: calls `dateInputRef.current?.showPicker?.()` on a hidden native `<input type="date">` (value = `end`); no future-date restriction in the picker. On change, calls `setEnd(e.target.value)`.

## 7. Asset / fault code list (left column)

**Column header** (40 px high, `bg-app`, `grid` bottom border): "ASSET" 28 px from edge, 1 px `border` vertical separator, "FAULT CODE". 12 px, uppercase, `text-muted`.

**Asset row** (56 px high, `bg-app`)

- Chevron 4 px margin + 24 px: `ChevronDown` (collapsed) / `ChevronUp` (expanded), 14 px, `text-muted`. Hidden (replaced by empty space) in single-code mode.
- 6 × 36 px `accent` bar, 3 px radius, 22 px from chevron.
- Asset label 12 px from bar, 16 px bold white. **Clicking the label** sets `selectedAssets` to `[assetId]` and sets both `filters.abnormal` and `filters.normal` to `true`.
- Clicking the chevron (when not in single-code mode) toggles collapsed state in `fcd:collapsedAssets`.

**Fault code row** (64 px high = 52 px band + ~12 px gap spacing)

- Code badge 72 px from edge: `bg-control`, 1 px `border`, 6 px radius, 6 × 12 px padding, 15 px bold white, 72 px minimum width, centred. **Clicking the badge** calls `setSelectedCodes([code])` (activates single-code mode). Badge cursor is `pointer`.
- Description 12 px from badge, 14 px `text-muted`, truncated with ellipsis, `maxWidth: 220`, `title` = full description.

**Single-code mode** (when exactly one fault code is selected)

- Sub-rows disappear. Each asset row is promoted to a 64 px bubble row: it shows the asset label (left column) and bubbles for that fault code (timeline). Chevron is hidden. The row `type` is `'asset'` with a `faultCode` property set.

**Separator rows** (when both Abnormal and Normal filters are checked)

- A `type: 'separator'` row is inserted between the last abnormal-leading row and the first normal-only row for each asset. Height 20 px (offset contribution); rendered as a `bg-row-left`-coloured div.

**Not interesting row** (when "Not interesting" filter is checked)

- Left column and timeline row at 35 % opacity. Badge loses its border and text becomes `text-muted` (implemented via `row.isHidden` flag).
- Bubbles of a not-interesting row have no hover, are not clickable, and `pointerEvents: 'none'` is not explicitly set — clicking them does nothing because the `onClick` is conditionally absent (`onClick={row.isHidden ? undefined : ...}`).

**Action column** (56 px, right, on each fault code row and single-code asset row; background `bg-row-left`)**

- `EyeButton` component: `EyeOff` icon 22 px, centred.
- Interesting row: `text-muted` at 60 % opacity. Not interesting row: white at 100 % opacity.
- Hover: `accent` colour, pointer cursor; after 300 ms, tooltip appears (right: 40 px, `bg-panel`, 999 px radius, 14 px `text-muted`): "Not interesting" on interesting row, "Interesting" on not-interesting row.
- Click: calls `toggleHiddenRow(rowKey)`. The eye button itself has `tabIndex={0}`, `role="button"`, `aria-label`, Enter/Space keyboard support.

## 8. Timeline, bubbles, and "today" line

The timeline rows are `<div>` elements with an `<svg>` child. There is **no** `BubbleRow` component used in the rendered app (it is implemented in `src/components/BubbleRow.tsx` but not mounted).

**Geometry**

- `W` = `timelineWidth / N`. Column centre `i`: `(i + 0.5) × W`. Vertical centre: `row.height / 2`.
- Each row: a `<div>` `position: absolute`, `height: row.height`, `background: rgba(255,255,255,0.09)`, `opacity: row.isHidden ? 0.35 : 1`. Inside: an `<svg>` the same dimensions.

**Bubble size** (implemented in `src/lib/scale.ts`)

- `r = scaleSqrt().domain([1, maxCount]).range([rMin, rMax]).clamp(true)(count)`.
- `rMin` = 3 px. `rMax` = `min(14, 0.4 × W)` px.
- `maxCount` = largest `count` in the displayed period among the assets and fault codes kept by the two selects (checkbox filters excluded).
- If `maxCount ≤ 1`, all bubbles use `rMin`.

**Colour**

- Abnormal: `#F0436A`, `fillOpacity: 1`.
- Normal: `#2ECC71`, `fillOpacity: 0.4`.
- Effective status from `validations[bubbleKey]?.status ?? occurrence.status`.

**Bubble interaction (as rendered in `App.tsx`)**

- Each visible bubble is a `<circle>` with `cursor: row.isHidden ? 'default' : 'pointer'` and `onClick` set only when `!row.isHidden`.
- No hover halo, no enlarged hit area, no `tabIndex`, no `aria-label`, no focus outline — these are implemented in `BubbleRow.tsx` (unused).
- Bubble filters: `if (isValidated && !filters.validated) return null` and `if (!isValidated && !filters.notValidated) return null`.

**Group rings** — **not rendered**. The `BubbleRow.tsx` component contains full group ring logic (palette, hash, `getGroupColor`), but this component is not mounted.

**Date axis** (top, 40 px, SVG; repeated in footer)

- Tick: `<line>` at each day boundary (x = `i × W`), from y=34 to y=40, stroke `#1F1F22`.
- Label: `<text>` centred in column, y=22, `text-muted`, 12 px, `d MMM` format.
  - 1W: label every day. 1M: label first day and every 4th day (`i === 0 || i % 4 === 0`).
  - First label: `text-anchor: start`, x = left edge + 2. Last label: `text-anchor: end`, x = right edge − 2. Others: `text-anchor: middle`.

**Footer** (56 px, `footer-bg`, `grid` top border)

- Left column (420 px): `Clock` icon (16 px `text-muted`) + period text (14 px `text-muted`).
- Timeline: `DateAxis` component (same as top).
- Action column: 56 px empty div.

**"Today" line**

- Shown only if today is in `dates`. `todayIndex = dates.indexOf(todayISO())`. `todayX = (todayIndex + 0.5) × columnWidth`.
- 1 px vertical `<div>` `position: absolute`, `left: 420 + todayX`, full height of the scroll container (`height: totalHeight`), `background: #4A4A4E`, `pointerEvents: none`, `zIndex: 1`.
- Downward-pointing triangle at the bottom of the top axis: `<div>` with CSS borders, `left: todayX - 6`, `bottom: 0`, `border-top: 8px solid #D4D4D8`.

## 9. Interactions

**Qualification menu**

1. Clicking a bubble on an interesting row opens the menu. The bubble's SVG `<circle>` element is passed as the reference element to `@floating-ui/react`.
2. Placement: `'right'`, middlewares: `offset(12)`, `flip()`, `shift({ padding: 8 })`, `autoUpdate`.
3. Appearance: `#1C1C1E` pill, 1 px `#3A3A3C` border, 999 px radius, 6 px padding, `0 8px 24px rgba(0,0,0,0.6)` shadow. Two buttons "Abnormal" and "Normal", 16 px bold white, separated by a 1 px × 14 px `text-muted` vertical line. Active-status button: `#2A2A2E` background, `1px solid #4A4A4E`, 999 px radius, `4px 14px` padding.
4. On button click: saves `{ status, validatedAt: new Date().toISOString() }` in `fcd:validations`, calls `onClose()`, closes menu. Bubble colour updates immediately.
5. Close: Escape key; click outside the menu div; scroll in the rows area; changing period or a filter (any store mutation that re-renders clears `openMenuBubble` via `handleScroll` or `handleMenuClose`).
6. Only one menu open at a time.
7. Keyboard: `ArrowLeft` → focus Abnormal button. `ArrowRight` → focus Normal button. `Escape` → close. On open, focus goes to the button matching current status.

**Clicking the asset label**: sets `selectedAssets = [assetId]`, sets `filters.abnormal = true`, sets `filters.normal = true`.

**Clicking the fault code badge**: sets `selectedCodes = [code]` (enters single-code mode).

**Back button (codes)**: clears `selectedCodes`.

**Back button (assets)**: clears `selectedAssets`, sets `filters.abnormal = false`, `filters.normal = false`.

**Collapsing an asset**: clicking the chevron toggles `fcd:collapsedAssets`. In single-code mode, the chevron is absent and the asset is never collapsible.

**Eye icon**: `EyeButton` toggles `fcd:hiddenRows`. If "Not interesting" filter is unchecked, the row vanishes immediately; if it is checked, the row becomes dimmed.

**Scroll**: if `openMenuBubble` is set, scrolling the rows area closes the menu (`onScroll` → `setOpenMenuBubble(null)`).

## 10. Deployment

- `vite.config.ts` sets `base: '/faultcode-dashboard/'`.
- `src/data/loader.ts` computes `BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, '')` and fetches `${BASE_URL}/data/faults.json`.
- GitHub Actions workflow deploys to GitHub Pages on push to `master`.
- Live URL: `https://gknuts.github.io/faultcode-dashboard/`

## 11. State of the acceptance criteria (original list)

| Criterion | Status |
| --- | --- |
| `npm install && npm run dev` starts; `npm run build` produces a working static `dist/` | ✅ |
| GitHub Pages deployment with correct subpath | ✅ |
| On first load: 1M view, all assets, all fault codes | ✅ (but `end` defaults to today+15 days, not today; `abn`/`norm` filters default to unchecked) |
| Smooth scrolling at 100 assets × 100 fault codes | ✅ (virtualisation, overscan 5) |
| Each day has exactly one column; occurrences land in the correct day | ✅ |
| Bubble with `count = maxCount` has radius `rMax`; `count = 1` has 3 px | ✅ |
| Arrows move by one period; right arrow disabled when `end` = today | ⚠️ navigation correct, but right arrow is not visually disabled |
| Qualifying a bubble changes its colour and persists after reload | ✅ |
| Unchecking "Validated" hides qualified bubbles only | ✅ |
| Unchecking "Abnormal"/"Normal" filters rows by status | ⚠️ implemented at row level, not per-bubble |
| Eye icon makes row not-interesting; survives reload | ✅ |
| Collapsing asset survives reload | ✅ |
| Group rings same colour; stable across reloads | ❌ group rings not rendered in the app |
| Copying the URL restores period and filters | ✅ |
| "Today" line visible iff today is in period | ✅ |
| Error state shows message and Retry; never blank screen | ✅ |
| Every action doable with keyboard alone | ⚠️ eye button ✅, qualification menu ✅, bubbles ❌ (no tabIndex on rendered bubbles) |
| Automated tests (Vitest + Playwright) | ❌ not implemented |

## 12. Known deviations from the original spec

| Topic | Spec | Implemented |
| --- | --- | --- |
| Header | 48 px band rendered | `Header.tsx` exists but not mounted |
| Default `end` | Today | Today + 15 days |
| Default filters | All 6 checked | `val, nval, int, nint` only (abn/norm unchecked) |
| Fault code select | Multi-select, 540 px | Single-select, 420 px |
| Right arrow when `end`=today | 30 % opacity, disabled | No visual disable |
| Calendar date picker | Custom dark picker | Native browser `<input type="date">` |
| Group rings | Rendered | Not rendered (code in unused `BubbleRow.tsx`) |
| Hover halo | Rendered | Not rendered (code in unused `BubbleRow.tsx`) |
| Hit area | `max(r+4, 10)` transparent circle | Direct click on the bubble circle |
| Bubble keyboard accessibility | `tabIndex=0`, `role="button"`, `aria-label` | Not on rendered circles |
| Abnormal/Normal filter | Per-bubble effective status | Per-row (any abnormal/normal occurrence) |
| Asset label | No click interaction | Click sets asset filter |
| Fault code badge | No click interaction | Click sets code filter |
| Back-navigation buttons | Not in spec | Implemented |
| Single-code mode | Not in spec | Implemented |
| Separator rows | Not in spec | Implemented |
| Row height for fault code | 64 px + 12 px gap | 64 px height + 7.5 px gap |
| React version | React 18 | React 19 |
