# Fault Code Dashboard V2 — Specification

*2026-10-20*

---

## 1. Context & Motivation

**V1** displays fault codes per locomotive on a timeline: the user can see when a FC is abnormal, but cannot immediately understand the overall problem or its status (new? known? resolved?). Validation happens FC by FC — too granular, too much effort.

**V2** introduces a unifying concept: the **Anomalous Pattern**, which groups correlated FCs into a single object that the user treats as one entity.

---

## 2. Core Concept: Anomalous Pattern

An **anomalous pattern** is a group of correlated abnormal fault codes on a single locomotive.

**Attributes:**
- List of fault codes (≥1)
- Start date
- End date (optional — absent means pattern is still active)
- Status: `new` | `ongoing` | `resolved` | `ignored`

**Rules:**
- Patterns are **provided by the data layer** (created upstream) — the frontend does not create or merge them
- One pattern belongs to exactly **one locomotive**
- A pattern is `new` if it appeared since the **user's last session** (timestamp stored in localStorage)
- The user can **remove a FC** from a pattern if it doesn't belong
- The user can **add a FC** to an existing pattern
- **Validation applies to the whole pattern**, not to individual FCs
- Users **cannot manually merge** two patterns

---

## 3. Interface Structure

### Main View — Locomotive List

Left panel lists all locomotives. Each entry shows:
- Asset ID
- `new` badge (pink) — count of new patterns
- `ongoing` badge (orange) — count of ongoing patterns

Global filters: Asset selector, Fault codes selector, time range (3D / 1W / 1M), New/Ongoing toggles.

### Locomotive View — Patterns as Accordions

Three collapsible sections per locomotive:

1. **New** — patterns that appeared since the user's last session
2. **Ongoing** — previously seen patterns that are still active
3. **Resolved / Archived** — patterns that ended or were ignored

Each pattern row (collapsed) shows:
- Fault codes it contains (code + label)
- Start → end date (or "ongoing")
- Available actions

### Pattern Detail View — Timeline

The **timeline is only shown here**, inside a pattern — not at the top level.

It displays the occurrences of each FC that composes the pattern over time, so the user can inspect when each code fired within the pattern's lifespan.

---

## 4. User Actions (per pattern)

| Action | Description |
|---|---|
| **Abnormal / Normal** | Validate or dismiss the pattern |
| **Ignore** | Hide the pattern without validating |
| **Create a ticket** | For clients with ticketing integration |
| **Create an alert** | Create an alert rule (for eligible clients) |
| **Add FC to pattern** | Attach an isolated FC to this pattern |
| **Remove FC from pattern** | Detach a FC from the group |

---

## 5. State Persistence

User decisions (pattern status, last session timestamp) are stored in **localStorage**.  
Single-user app — no multi-user sync required.

The `new` vs `ongoing` distinction is derived at load time by comparing each pattern's first-seen date against the timestamp of the user's last session, stored in localStorage.

**MVP only:** a temporary "Simulate new session" button resets the last-session timestamp to now, so patterns currently marked `new` transition to `ongoing`. This replaces a real login flow for the prototype.

---

## 6. Resolved / Archived Section

Visible and expanded by default.
