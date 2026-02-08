# Cache-Busting Strategy – Krealoftet

## Overview

This project uses a **query parameter versioning** strategy (`?v=X.X.X`) combined with a **versioned service worker** to ensure browsers always receive the latest assets after a deploy.

---

## Version Locations

There are exactly **two places** where the version must be updated on every deploy:

### 1. HTML files – Asset query parameters

All `<link>` and `<script>` tags referencing local CSS/JS include a `?v=` query string.

**Files that contain versioned references:**

| File | Assets |
|---|---|
| `index.html` | `main.css?v=X.X.X`, `main.js?v=X.X.X` |
| `privatlivspolitik.html` | `main.css?v=X.X.X`, `main.js?v=X.X.X` |
| `handelsbetingelser.html` | `main.css?v=X.X.X`, `main.js?v=X.X.X` |
| `faq-ofte-stillede-sporgsmal.html` | `main.css?v=X.X.X`, `main.js?v=X.X.X` |

**Pattern to find:**

```
/styles/main.css?v=
/js/main.js?v=
```

### 2. Service Worker – `CACHE_VERSION`

File: `sw.js`, line 9:

```js
const CACHE_VERSION = 'X.X.X';
```

This controls the service worker cache name (`krealoftet-vX.X.X`). When updated, the service worker automatically purges all old caches on activation.

---

## Deploy Checklist

When deploying changes to CSS, JS, or HTML:

1. **Bump the version string** in all locations listed above (use the same version everywhere).
2. **Use semantic versioning:**
   - `PATCH` (1.0.0 → 1.0.1): Small fixes, typos, minor style tweaks
   - `MINOR` (1.0.0 → 1.1.0): New features, new sections, component changes
   - `MAJOR` (1.0.0 → 2.0.0): Full redesigns, breaking layout changes
3. **Deploy all files** — HTML files, `sw.js`, and any changed CSS/JS.

---

## AI Agent Instructions

When an AI agent is asked to bump the cache version (e.g. after making CSS/JS changes):

### Step-by-step

1. **Determine the new version** based on the scope of changes (see semantic versioning above).
2. **Find the current version** by searching for `?v=` in any HTML file or `CACHE_VERSION` in `sw.js`.
3. **Replace the version in all 5 files:**

   **Search pattern (regex):**
   ```
   \?v=[\d]+\.[\d]+\.[\d]+
   ```
   **Replace with:**
   ```
   ?v=NEW_VERSION
   ```

   **Files to update:**
   - `index.html` (2 occurrences: CSS + JS)
   - `privatlivspolitik.html` (2 occurrences)
   - `handelsbetingelser.html` (2 occurrences)
   - `faq-ofte-stillede-sporgsmal.html` (2 occurrences)
   - `sw.js` (1 occurrence: `CACHE_VERSION`)

4. **Verify** that all 9 occurrences are updated to the same version.

### Quick verification command

```bash
grep -rn "?v=" *.html && grep "CACHE_VERSION" sw.js
```

Expected output: All lines should show the same version string.

---

## What Does NOT Need Versioning

- **Images** (`/assets/images/`) — Use unique filenames. If an image is replaced with the same name, bump `CACHE_VERSION` in `sw.js`.
- **Favicons** (`/assets/icons/`) — Rarely change. Bump `CACHE_VERSION` if updated.
- **Third-party scripts** (Cookiebot, Embla, Google Fonts) — Managed externally, not cached by query param.

---

## Service Worker Behavior

| Asset type | Strategy | Reason |
|---|---|---|
| HTML pages | Network-first | Always serve latest content |
| CSS & JS | Network-first | Always serve latest code, cache as offline fallback |
| Images & fonts | Cache-first | Immutable by filename, fast repeat loads |

The service worker uses `skipWaiting()` and `clients.claim()` to activate immediately — no need for users to close/reopen tabs.

---

## File Structure Reference

```
/
├── index.html                        ← versioned CSS/JS refs
├── privatlivspolitik.html            ← versioned CSS/JS refs
├── handelsbetingelser.html           ← versioned CSS/JS refs
├── faq-ofte-stillede-sporgsmal.html  ← versioned CSS/JS refs
├── sw.js                             ← CACHE_VERSION
├── styles/
│   └── main.css                      ← compiled output
├── js/
│   └── main.js                       ← application logic
└── CACHE-BUSTING.md                  ← this file
```

