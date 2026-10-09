# Specification — Fault Codes Dashboard

## 1. Context, goal and scope

The application is a front-end-only single-page app, with no backend, that shows on a timeline the daily number of occurrences of each fault code for each railway asset, and lets the user qualify each day as Abnormal or Normal. This document targets a code generation tool: every rule is written to be implemented as stated. The whole user interface is in English.

**In scope**

- Loading data from a static JSON file.
- Filter bar: Asset select, Fault codes select, 6 checkboxes, Week / Month period selector with navigation.
- Left-hand list of assets (collapsible) and their fault codes.
- Right-hand timeline: one column per day, one bubble per asset + fault code + day, size proportional to the number of occurrences, colour based on status.
- Coloured group rings around the bubbles of the same group.
- Vertical "today" line.
- Qualifying a bubble through an Abnormal | Normal menu.
- Hiding a whole row (Not interesting) with the eye icon.
- Persisting user actions in localStorage and the view state in the URL.

**Out of scope** (implement nothing, display nothing)

- Backend, API, authentication, roles, change history.
- Live Map, Reporting and New corrective event links, RailGenius menu, Support button, user menu.
- The "Inspect" button visible on the mockup.
- Today and 3D presets.
- Data tooltips on hover, multi-selection of bubbles.
- Light theme, mobile and tablet layouts.

## 2. Technical constraints and stack

The chosen stack is Vite + React 18 + TypeScript, with the timeline rendered in SVG, built as a static site with no application server.

| Need | Choice | Note |
| --- | --- | --- |
| Build | Vite 5, `npm run build` outputs a static `dist/` folder | Deployable on any static file host |
| UI | React 18 + strict TypeScript | Function components and hooks only |
| Styling | Tailwind CSS 3 with the section 5 tokens in `tailwind.config` | No heavy component library |
| Global state | Zustand | A single store, see section 4 |
| Dates | date-fns | All dates as `YYYY-MM-DD`, local time, no time of day, no time zone |
| Bubble scale | d3-scale (`scaleSqrt`) | The only d3 module used |
| Multi-select dropdowns | react-select, dark-styled | Built-in search |
| Vertical virtualisation | @tanstack/react-virtual | Mandatory: up to about 10,000 rows |
| Popover | @floating-ui/react | Positions the Abnormal / Normal menu |
| Icons | lucide-react | `ChevronUp`, `ChevronDown`, `EyeOff`, `ChevronLeft`, `ChevronRight`, `Calendar`, `Clock` |

**Constraints**

- Desktop only, minimum supported width 1280 px, target 1920 px. Browsers: latest Chrome, Edge, Firefox.
- No horizontal scrolling: the timeline takes all remaining width and the day columns share that width equally.
- Vertical scrolling is allowed in the rows area only; the filter bar, the top date axis and the footer stay fixed.
- Reference volume: about 100 assets, about 100 fault codes per asset, 31 days displayed. Scrolling must stay smooth (60 fps) at this volume, hence virtualisation: only visible rows plus a 10-row overscan are rendered.
- Expected folder structure: `src/data` (loading and types), `src/store`, `src/components`, `src/lib` (date and scale calculations), `public/data/faults.json`.

## 3. Input data model

On start-up the app reads a single file `public/data/faults.json` with `fetch('/data/faults.json')`, containing occurrences already aggregated per day. While loading, show "Loading…" centred; on a network error or invalid JSON, show "Unable to load fault data." in red with a "Retry" button.

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
  color?: string;   // optional hex colour; otherwise assigned by the app (section 8)
}

interface DailyOccurrence {
  assetId: string;
  faultCode: string;
  date: ISODate;
  count: number;                    // integer >= 1
  status: 'abnormal' | 'normal';    // initial status provided by the source
  groupId?: string;                 // present if the bubble belongs to a group
}
```

**Data validation rules**

- There is at most one `DailyOccurrence` per `assetId` + `faultCode` + `date` triple. On a duplicate, sum the `count` values and keep `abnormal` if either is abnormal; log a console warning.
- An occurrence whose `assetId` or `faultCode` is unknown is ignored with a console warning.
- All occurrences of the same `groupId` share the same `assetId` and the same `date` (a group links several fault codes of one asset on one day). An occurrence that breaks this rule is shown without a group ring.
- A timeline row is an `assetId` + `faultCode` pair present in `occurrences`. Row key: `` `${assetId}|${faultCode}` ``. Bubble key: `` `${assetId}|${faultCode}|${date}` ``.

**Minimal example**

```json
{
  "assets": [{ "id": "485001", "label": "485 001" }],
  "faultCodes": [
    { "code": "281F", "description": "Meld Druck/Temp/Vist-Einzelwerte" },
    { "code": "2011", "description": "MMI bus failure (reception)" }
  ],
  "groups": [{ "id": "g1", "color": "#3B6FE0" }],
  "occurrences": [
    { "assetId": "485001", "faultCode": "281F", "date": "2026-02-12", "count": 4, "status": "abnormal", "groupId": "g1" },
    { "assetId": "485001", "faultCode": "2011", "date": "2026-02-12", "count": 2, "status": "abnormal", "groupId": "g1" },
    { "assetId": "485001", "faultCode": "2011", "date": "2026-02-13", "count": 17, "status": "normal" }
  ]
}
```

Also provide a `scripts/generate-mock.ts` script that produces a realistic `faults.json`: 100 assets, 100 fault codes per asset, 90 days ending today, about 40 % of days with an occurrence, `count` between 1 and 50 with a decreasing distribution, 30 % `abnormal` statuses, a few groups of 2 to 3 fault codes.

## 4. State, localStorage and URL

User decisions (qualifications, hidden rows, collapsed assets) live in localStorage; the view state (period, filters) lives in the URL so a link can be shared. The source JSON is never modified.

**localStorage** (prefix `fcd:`, JSON values, read on start-up, written immediately on every change, every read and write wrapped in `try/catch`; on failure the app works without persistence)

| Key | Type | Content |
| --- | --- | --- |
| `fcd:validations` | `Record<string, { status: 'abnormal' \| 'normal'; validatedAt: string }>` | Key = bubble key; `validatedAt` in ISO 8601 |
| `fcd:hiddenRows` | `string[]` | Row keys marked Not interesting |
| `fcd:collapsedAssets` | `string[]` | `assetId` of collapsed assets |
| `fcd:version` | `number` | Schema version, value `1` |

**Computation rules**

- Effective status of a bubble = `validations[key].status` if present, otherwise `occurrence.status` from the JSON.
- A bubble is "Validated" if and only if its key exists in `fcd:validations`, whatever the chosen status.
- A row is "Not interesting" if its key is in `fcd:hiddenRows`, otherwise "Interesting".

**URL** (query string, updated with `history.replaceState` on every change, read on start-up; an invalid value is ignored and replaced by the default)

| Parameter | Values | Default |
| --- | --- | --- |
| `view` | `1W` or `1M` | `1M` |
| `end` | date `YYYY-MM-DD`, last displayed day | today |
| `assets` | comma-separated list of `assetId` | absent = all |
| `codes` | comma-separated list of fault codes | absent = all |
| `filters` | subset of `val,nval,int,nint,abn,norm` | all 6 values, all checked |

Example: `?view=1M&end=2026-02-24&assets=485001,485003&codes=281F,2011&filters=val,nval,int,nint,abn,norm`.

The UI offers no button to reset user data; for testing, expose `window.fcdReset()` in the console, which clears the `fcd:` keys and reloads the page.

## 5. Layout and design system

The screen fills 100 % of the window (`100vh`, no page scrolling) and is split into five fixed horizontal bands; only the rows area scrolls.

```
┌────────────────────────────────────────────────────────────────────┐
│ Header (48 px): logo + "Fault Codes Dashboard"                     │
├────────────────────────────────────────────────────────────────────┤
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

**Horizontal grid**: fixed 420 px left column, timeline over all remaining width, 56 px action column on the right holding the eye icon. These three columns are aligned across the axis header, the rows and the footer. Screen side margins: 8 px.

**Colours** (declare as Tailwind tokens and CSS variables)

| Token | Value | Usage |
| --- | --- | --- |
| `bg-app` | `#000000` | General background and asset rows |
| `bg-panel` | `#2A2A2C` | Filter bar |
| `bg-row` | `#161618` | Background band of a fault code row in the timeline |
| `bg-row-left` | `#0B0B0C` | Background of a fault code row in the left column |
| `bg-control` | `#1C1C1E` | Selects, fault code badge, segmented control |
| `border` | `#3A3A3C` | Control and badge borders |
| `grid` | `#1F1F22` | Vertical day ticks and horizontal row separators |
| `text` | `#FFFFFF` | Primary text |
| `text-muted` | `#A1A1AA` | Descriptions, axis labels, column headers |
| `accent` | `#6C4BF5` | Asset vertical bar, header pill, eye hover |
| `abnormal` | `#F0436A` | Abnormal bubble |
| `normal` | `#2ECC71` | Normal bubble |
| `today` | `#4A4A4E` | "Today" line and triangle |
| `hover-halo` | `rgba(255,255,255,0.18)` | Bubble hover shadow |

**Typography**: `Inter` font, fallback `system-ui, sans-serif`. Asset label 16 px bold; fault code 15 px bold; description 14 px regular `text-muted`; column headers 12 px uppercase `text-muted`; axis dates 12 px `text-muted`; checkbox labels 15 px `text-muted`.

**Header**: `bg-app` background; on the left a rounded `accent` pill (6 px radius) containing a four-dot white logo and the text "Fault Codes Dashboard" in white, 15 px bold. Nothing else in the header.

## 6. Filter bar and period selector

The filter bar (`bg-panel` background, 96 px high, 40 px horizontal padding) lays out from left to right: the Asset select, the Fault codes select, three pairs of checkboxes, then on the far right the period selector. Any change updates the view and the URL immediately.

**Asset select** (300 px wide, 68 px high)

- Small "Asset" label, 13 px `text-muted`, above the value; down chevron on the right, separated by a vertical `border` line.
- Multi-select with search on the asset label. Placeholder "Select...". No selection = all assets shown.
- With 1 selection, show the label; with several, show "N assets".

**Fault codes select** (540 px wide, same style)

- "Fault codes" label. Multi-select with case-insensitive search on code and description. Options shown as `281F — Meld Druck/Temp/Vist-Einzelwerte`.
- No selection = displayed value "All". With 1 selection, show the code; with several, "N fault codes".

**Checkboxes**: three columns of two boxes, white box with a black tick when checked, 18 px, label on the right.

| Column | Top box | Bottom box | Applies to |
| --- | --- | --- | --- |
| 1 | Validated | Not validated | Each bubble |
| 2 | Interesting | Not interesting (hided) | Each row |
| 3 | Abnormal | Normal | Each bubble (effective status) |

Filtering rules:

1. A bubble is shown if its Validated / Not validated category is checked AND its effective Abnormal / Normal status is checked.
2. An Interesting row is shown if "Interesting" is checked. A Not interesting row is shown if "Not interesting (hided)" is checked; it is then rendered dimmed (section 7). If the box is unchecked, the row disappears entirely.
3. A row with no occurrence in the displayed period is not rendered.
4. A row whose bubbles are all filtered out by rule 1 stays displayed, empty.
5. An asset with no rendered row disappears, header included.
6. If nothing is displayed, show "No fault codes match the current filters." in `text-muted`, centred in the rows area.

**Period selector** (right-aligned)

- Segmented control with two buttons "1W" and "1M", 48 px high, `border` border, 10 px radius; the active button has a white background and bold black text, the inactive one white text on a transparent background.
- To its right: left arrow, period text (e.g. "24 Jan – 24 Feb 2026", 20 px white), calendar icon, right arrow.
- 1W period: 7 days, from `end − 6 days` to `end` inclusive. 1M period: from the same day of the previous month to `end` inclusive (e.g. 24 Jan → 24 Feb = 32 days). If that day does not exist in the previous month, use the last day of that month.
- Text format: `d MMM – d MMM yyyy`; if the two dates are in different years, `d MMM yyyy – d MMM yyyy`.
- Left arrow: moves `end` back by one whole period (7 days in 1W, 1 month in 1M). Right arrow: moves forward by one whole period, never past today; disabled (30 % opacity) when `end` is today.
- Switching between 1M and 1W keeps `end`.
- Clicking the calendar icon opens a dark date picker to choose `end`, with future dates disabled.

## 7. Asset / fault code list (left column)

The left column lists assets sorted by ascending label, each followed by its fault codes in order of first appearance in the JSON; each row of this column is pixel-aligned with its timeline row.

**Column header** (40 px high, `bg-app` background, `grid` bottom border): "ASSET" 28 px from the left edge, a 16 px vertical `border` line, then "FAULT CODE". 12 px, uppercase, `text-muted`.

**Asset row** (56 px high, `bg-app` background, no band in the timeline)

- Chevron 24 px from the edge: `ChevronUp` when the asset is expanded, `ChevronDown` when collapsed, 14 px, `text-muted`.
- 6 × 36 px `accent` vertical bar, 3 px radius, 52 px from the edge.
- Asset label (e.g. "485 001") 16 px bold white, 12 px from the bar.
- Clicking anywhere on the row collapses or expands the asset; the state is saved in `fcd:collapsedAssets`. A collapsed asset shows only its asset row.

**Fault code row** (64 px high: a 52 px band plus 12 px spacing)

- Code badge 72 px from the edge: `bg-control` background, 1 px `border` border, 6 px radius, 6 × 12 px padding, 15 px bold white text, 72 px minimum width, centred text.
- Description 12 px from the badge, 14 px `text-muted`, single line, truncated with an ellipsis; the `title` attribute holds the full description.
- No click interaction on this part of the row.

**Not interesting row** (shown only if "Not interesting (hided)" is checked): the whole row, left column and timeline, at 35 % opacity; the badge loses its border and its text becomes `text-muted`. Bubbles of a Not interesting row are not clickable and have no hover shadow.

**Action column** (56 px, right of the timeline, on each fault code row)

- 22 px `EyeOff` icon, centred.
- Interesting row: `text-muted` icon at 60 % opacity. Not interesting row: white icon at 100 % opacity (not dimmed by the row opacity).
- Hover: `accent` icon, pointer cursor, and after 300 ms a label appears above-left: `#2A2A2C` pill, 14 px `text-muted` text, 999 px radius, 6 × 14 px padding, reading "Not interesting" on an Interesting row and "Interesting" on a Not interesting row.
- Click: toggles the row between Interesting and Not interesting and updates `fcd:hiddenRows`. If "Not interesting (hided)" is unchecked, the row disappears at once.

## 8. Timeline, bubbles, groups and "today" line

The timeline splits its width into N equal columns, one per day of the period (7 in 1W, 28 to 32 in 1M), and places at most one bubble per row and per day, centred in its column. The day is the smallest unit, whatever the period.

**Geometry**

- `W` = timeline width / N. Horizontal centre of column `i` (0 = first day): `(i + 0.5) × W`. Vertical centre: middle of the 52 px band.
- Each fault code row is an `<svg>` as wide as the timeline and 52 px high, with a `bg-row` background rectangle across its full width.
- No vertical day separator inside the rows.

**Bubble size**

- `r = scaleSqrt().domain([1, maxCount]).range([rMin, rMax]).clamp(true)(count)`, so the area is proportional to the number of occurrences.
- `rMin` = 3 px. `rMax` = `min(14, 0.4 × W)` px.
- `maxCount` = the largest `count` among occurrences in the displayed period for the assets and fault codes kept by the two selects, ignoring the checkboxes (checking or unchecking a box never changes bubble sizes). If `maxCount` is 1, all bubbles use `rMin`.
- The scale is therefore shared by every row on screen, so sizes are comparable across assets.

**Colour**: solid `abnormal` or `normal` fill according to the effective status (section 4), no stroke, no drop shadow. Abnormal bubbles are fully opaque; Normal bubbles use the pure green normal token with fill-opacity 0.4, which reads as green-grey on the dark background (do not bake the dimmed colour into the token). No visual difference between a Validated and a Not validated bubble.

**Hovering a clickable bubble** (all bubbles of Interesting rows)

- A `hover-halo` disc of radius `r + 8` px appears behind the bubble (120 ms opacity transition), pointer cursor.
- Hit area: a circle of radius `max(r + 4, 10)` px, so small bubbles stay easy to target.
- No tooltip.

**Group rings**

- For each displayed occurrence with a valid `groupId`, draw an unfilled circle with a 2 px stroke and radius `rMax + 5` px, centred on the bubble, below the bubble and above the band background.
- All members of a group thus have the same ring, in the same colour, in the same column on different rows of the same asset.
- Colour: `group.color` if provided, otherwise a colour from the palette below picked by a stable hash of `groupId` (same colour from one session to the next): `#D9E94A`, `#3B6FE0`, `#2EC4B6`, `#FF9F1C`, `#B07CF7`, `#5BC0EB`, `#9BE564`, `#FF7AC6`.
- If a member is hidden by a filter, its ring is hidden too; the other members keep theirs.
- No group-specific interaction: no hover, no click.

**Date axis** (top, 40 px high, repeated in the footer)

- A small 6 px `grid` vertical tick at every day boundary.
- `d MMM` labels (e.g. "28 Jan"), 12 px `text-muted`, centred on their column: every day in 1W; in 1M, the first day then every fourth day.
- The top axis stays fixed during vertical scrolling.

**Footer** (56 px high, `#111113` background, `grid` top border): in the left column, a 16 px `Clock` icon then the period text (e.g. "24 Jan – 24 Feb 2026") 14 px `text-muted`; in the timeline, the same axis as the top one.

**"Today" line**

- Shown only if today is within the period.
- 1 px vertical line in `today` colour, centred on today's column, from the top of the upper axis to the bottom of the footer axis, above the bands and below the bubbles, not capturing clicks (`pointer-events: none`).
- Solid downward-pointing triangle, 12 px wide, `#D4D4D8`, at the top of the upper axis.

## 9. Interactions

Clicking a bubble opens a two-option menu, Abnormal and Normal; the choice is saved immediately and the bubble changes colour. This is the only action available on a bubble.

**Qualification menu**

1. Click on a clickable bubble (section 8): the bubble keeps its hover halo while the menu is open.
2. The menu appears to the right of the bubble, vertically centred on it, 12 px away; if there is not enough room on the right, it flips to the left (`@floating-ui/react`, `offset`, `flip`, `shift` middlewares).
3. Appearance: `#1C1C1E` pill, 1 px `border` border, 999 px radius, 6 px padding, `0 8px 24px rgba(0,0,0,0.6)` shadow. Two buttons "Abnormal" and "Normal", 16 px bold white, separated by a 14 px vertical `text-muted` line. The button matching the current effective status has a `#2A2A2E` background and a 1 px `#4A4A4E` border, 999 px radius, 4 × 14 px padding.
4. Clicking a button saves `{ status, validatedAt: new Date().toISOString() }` in `fcd:validations` under the bubble key, closes the menu and updates the colour. Clicking the already-active status saves it too: the bubble becomes Validated without changing colour.
5. Closing without a choice: Escape key, click outside the menu, scrolling the rows area, changing the period or a filter.
6. Only one menu open at a time; clicking another bubble closes the first and opens the new one.
7. If the qualified bubble no longer matches the checked filters (e.g. it becomes Validated while "Validated" is unchecked), it disappears once the menu closes.

**Keyboard and accessibility**

- Every clickable bubble is focusable (`tabIndex=0`, `role="button"`, `aria-label` such as "281F on 12 Feb 2026, 4 occurrences, abnormal"). Enter or Space opens the menu.
- In the menu, left and right arrows move between buttons, Enter confirms, Escape closes and returns focus to the bubble.
- 2 px `accent` focus outline around bubbles, buttons, checkboxes and eye icons.

**Other interactions** (detailed in sections 6 and 7): collapsing an asset by clicking its row, toggling Interesting / Not interesting with the eye icon, filters and period navigation.

## 10. Acceptance criteria

The build is accepted when every scenario below passes, both as a manual test with the dataset produced by `scripts/generate-mock.ts` and as automated tests (Vitest + Testing Library for logic, Playwright for user journeys).

- [ ] `npm install && npm run dev` starts the app; `npm run build` produces a `dist/` that works when served statically, with no application server.
- [ ] On first load: 1M view ending today, all assets, all fault codes, all 6 boxes checked.
- [ ] With 100 assets × 100 fault codes, vertical scrolling stays smooth and no horizontal scrollbar appears between 1280 and 2560 px wide.
- [ ] Each day of the period has exactly one column; an occurrence on 12 February appears in the 12 February column, in 1W as in 1M.
- [ ] A bubble with `count` = `maxCount` has radius `rMax`; a bubble with `count` = 1 has a 3 px radius.
- [ ] The arrows move forward and back by one whole period; the right arrow is disabled when the period ends today.
- [ ] Qualifying an Abnormal bubble as Normal turns it `normal`, and that status survives a page reload.
- [ ] Unchecking "Validated" hides all qualified bubbles and only them; unchecking "Abnormal" hides all bubbles whose effective status is abnormal.
- [ ] Clicking a row's eye makes it Not interesting: dimmed if "Not interesting (hided)" is checked, absent otherwise; the state survives a reload.
- [ ] Collapsing an asset leaves only its asset row; the state survives a reload.
- [ ] Bubbles of the same group carry a ring of the same colour and radius; the colour does not change after a reload.
- [ ] Copying the URL and opening it in a new tab restores the same period and filters.
- [ ] The "today" line is visible if and only if today is within the period.
- [ ] A missing or invalid `faults.json` shows the error message and the "Retry" button, never a blank screen.
- [ ] Every action in section 9 can be done with the keyboard alone.

## 11. Assumptions

These choices were not settled explicitly; they are applied throughout this document and can be changed without affecting the rest.

| Topic | Chosen option | Alternative |
| --- | --- | --- |
| Clickable bubbles | Abnormal and Normal, so a qualification can be corrected | Abnormal bubbles only |
| Bubble scale | Square root, shared by the whole screen, radius 3 to 14 px | One scale per row |
| Scrolling | No horizontal scrolling, vertical scrolling in the rows area (100 assets do not fit on one screen) | Paginated assets |
| Displayed rows | Only asset + fault code pairs with at least one occurrence in the period | Every pair present in the JSON |
| Navigating into the future | Not allowed: the period ends today at the latest, so the "today" line is always on the last column when visible | Allow future dates |
| Group colours | Provided by the JSON, otherwise an 8-colour palette by `groupId` hash | Always assigned by the app |
| Validated bubble | No visual difference from a Not validated bubble | Small dot or outline marking the qualification |
| Display order | Assets by ascending label, fault codes by order of appearance in the JSON | Fault codes sorted by code |
