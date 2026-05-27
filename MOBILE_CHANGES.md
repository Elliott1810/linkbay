# Linkbay — Mobile Responsiveness Changes

**Goal:** Make all pages fully mobile responsive (375px–768px)  
**Completed:** 2026-05-07  
**TypeScript check:** ✅ Passed — no errors

---

## Approach

All responsive rules are implemented via `<style>` JSX tags within each component, using `@media (max-width: 768px)` breakpoints. The pattern used throughout:

1. Add a `className` to the target container div (e.g. `className="my-grid"`)
2. Target that class in a `<style>` block inside the same component
3. Override `gridTemplateColumns` and other layout properties at the breakpoint

This approach preserves the existing CSS variable / custom class architecture rather than switching to Tailwind utility classes.

---

## Files Modified

### `client/src/components/Header.tsx`

**Problem:** Mobile menu had no backdrop — tapping outside the menu didn't close it. No accessibility attribute on hamburger button.

**Changes:**
- Added semi-transparent backdrop `<div>` (fixed, covers full screen, `zIndex: 49`) that calls `setMenuOpen(false)` on tap
- Added `aria-expanded={menuOpen}` to the hamburger `<button>` for accessibility
- Added `onClick={() => setMenuOpen(false)}` to each mobile nav `<Link>` so the menu closes after navigation
- Set `position: relative; zIndex: 50` on the mobile dropdown so it renders above the backdrop

---

### `client/src/pages/HomePage.tsx`

**Problem:** Hero used a 2-column CSS grid that didn't collapse on mobile. Feature rows, pricing teaser grid, and CTA buttons didn't stack.

**Changes:**
- **Hero grid:** Added `className="hero-grid"` → collapses to `1fr` at ≤768px
- **Hero mockup:** Added `className="hero-mockup"` → hidden (`display: none`) on mobile to save space
- **Waitlist form:** Added `className="waitlist-form"` → input and button stack vertically (`flex-direction: column`) on mobile
- **Feature rows:** Added `className="feature-row-grid"` to each alternating feature section grid → collapses to `1fr` on mobile (was using hardcoded `gridTemplateColumns` with no responsive override)
- **Pricing teaser:** Added `className="pricing-teaser-grid"` to `repeat(3, 1fr)` grid → collapses to `1fr` on mobile
- **CTA buttons:** Added `flex: "1 1 auto"` and `maxWidth: 320` so buttons wrap naturally on small screens
- Added comprehensive `<style>` block covering all above classes at `@media (max-width: 768px)`

---

### `client/src/pages/DashboardPage.tsx`

**Problem:** Dashboard sidebar is invisible on mobile (hidden by CSS) but there was no mobile navigation replacement. Multiple 4-column and 3-column stat grids didn't collapse. Editor and settings panels were side-by-side.

**Changes:**

**Mobile bottom navigation bar** (new element):
- Added `<nav className="dashboard-bottom-nav">` fixed to the bottom of the screen (height 60px)
- 5 tabs: Overview, Editor (short for "Page Editor"), Analytics, Leads, Settings
- Each tab shows an icon + label; active tab uses `--color-primary` accent colour
- Leads tab shows a badge with new leads count (when > 0)
- Hidden on desktop via CSS (`@media (min-width: 769px) { display: none }`)

**Grid responsive classes added:**
| Class | Original columns | Mobile columns |
|---|---|---|
| `stats-grid` | `repeat(4, 1fr)` | `repeat(2, 1fr)` |
| `leads-stats-grid` | `repeat(3, 1fr)` | `repeat(2, 1fr)` |
| `overview-bottom-grid` | `2fr 1fr` | `1fr` |
| `analytics-bottom-grid` | `1fr 1fr` | `1fr` |
| `no-page-features-grid` | `repeat(3, 1fr)` | `1fr` |
| `phone-email-grid` | `1fr 1fr` | `1fr` |
| `settings-profile-grid` | `1fr 1fr` | `1fr` |

**Editor layout:**
- Added `className="editor-layout"` → stacks vertically on mobile (`flex-direction: column`)
- Added `className="editor-settings-panel"` → becomes a horizontal scroll area on mobile

**Other:**
- Added `className="dashboard-content"` → gains `padding-bottom: 60px` on mobile to clear the bottom nav bar
- Added `className="overview-header"` → `flex-wrap: wrap` on mobile so action buttons don't overflow

---

### `client/src/pages/BuilderPage.tsx`

**Problem:** Use-case selection grid and contact fields grid (Step 2) were 2-column and didn't collapse on small phones.

**Changes:**
- Added `className="usecase-grid"` to the use-case buttons grid → `1fr` at ≤480px
- Added `className="contact-grid"` to the Step 2 contact fields (phone + email side-by-side) → `1fr` at ≤480px
- Extended existing `<style>` block with `@media (max-width: 480px)` rules for both classes

> Note: The builder already hid `.builder-preview` and collapsed to single-column at 820px — those rules were left untouched.

---

### `client/src/pages/ProfilePage.tsx`

**Status:** ✅ Already mobile-friendly — no changes needed.

The profile page uses a single-column layout with `maxWidth: 520` and `padding: "2rem 1.25rem 4rem"` — works correctly on all screen sizes.

---

### `client/src/pages/TemplatesPage.tsx`

**Status:** ✅ Already mobile-friendly — no changes needed.

Uses `className="grid-3"` which already has responsive CSS in `index.css`: 3 columns → 2 columns at 900px → 1 column at 600px.

---

### `client/src/pages/PricingPage.tsx`

**Problem:** Pricing cards used `repeat(3, 1fr)` with a broken `.pricing-grid` class that had no matching CSS.

**Changes:**
- Added `className="pricing-cards-grid"` to the pricing cards container
- Added `<style>` block: `1fr` at ≤768px (and ≤900px for tablet)
- Feature comparison table already has `overflowX: "auto"` wrapper — no change needed
- FAQ accordion uses `container-narrow` which is already responsive — no change needed

---

### `client/src/pages/BlogArticlePage.tsx`

**Status:** ✅ Already mobile-friendly — no changes needed.

Uses `container-narrow` with `padding-inline: clamp(1.25rem, 5vw, 3rem)` — single-column layout that adapts fluidly.

---

### `client/src/pages/AuthPage.tsx`

**Status:** ✅ Already mobile-friendly — no changes needed.

Uses `maxWidth: 420` and `padding: "2rem 1rem"` — single-column form that works on all screen sizes.

---

## Bonus Fix

### `client/src/components/Footer.tsx`

**Problem:** Footer used a `2fr repeat(4, 1fr)` grid with fragile CSS selectors that weren't matching correctly on mobile.

**Changes:**
- Added `className="footer-grid"` to the footer columns container
- Updated media queries to target `.footer-grid` class: `1fr 1fr` at ≤900px → `1fr` at ≤600px

---

## CSS Architecture Summary

All new responsive rules follow this pattern:

```jsx
// 1. Add className to the container
<div className="my-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>

// 2. Override in <style> block
<style>{`
  @media (max-width: 768px) {
    .my-grid {
      grid-template-columns: 1fr !important;
    }
  }
`}</style>
```

### Breakpoints used
| Breakpoint | Usage |
|---|---|
| `max-width: 900px` | Tablet — pricing cards 2-col, footer 2-col |
| `max-width: 768px` | Mobile — all major layout collapses |
| `max-width: 480px` | Small phone — builder grids |

### Existing responsive classes (index.css — unchanged)
- `.grid-2`, `.grid-3`, `.grid-4` → already collapse to `1fr` at 600px
- `.nav-desktop { display: none }` at 768px
- `.nav-mobile-toggle { display: flex }` at 768px
- `container-narrow` → `clamp()` padding, fluid single column
