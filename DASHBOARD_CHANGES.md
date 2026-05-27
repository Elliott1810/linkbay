# Dashboard Changes — Goals 3–7

All changes pass `npx tsc --noEmit` (0 errors) and `npx vite build` (successful).

---

## Goal 3: Dashboard Overview Panel

### 3a — AI Tip Box Removed
The "✦ AI tip" card that was in the quick-actions column has been removed entirely from `OverviewPanel`.

### 3b — Stats Fixed (Clicks, Click Rate, Leads)
- `OverviewPanel` now queries `/api/dashboard/stats?days=<N>` instead of the single-page analytics endpoint.
- Backend `getDashboardStats` updated in `storage.ts` to accept an optional `days` parameter:
  - With `days`: counts `page_events` rows (type=`view`, `link_click`) and `leads` rows within the window.
  - Without `days`: retains original behaviour (sums `click_count` from `page_links`, all-time).
- Route `GET /api/dashboard/stats` reads `?days` query param and passes it through.

### 3c — Date Range Selector (7d / 30d / 90d)
- A pill-button strip "7d / 30d / 90d" is rendered in the OverviewPanel header row.
- Changing the selected range re-queries both `/api/dashboard/stats?days=N` (for stat cards) and `/api/pages/${id}/analytics?days=N` (for the chart).
- The stat cards show the label "Xd window" to communicate the period.

### 3d — Share Your Link Section
Replaced the AI tip card with a new "Share your link" card containing:
- A URL display box (`linkbay.ai/<username>`) with an inline copy button.
- Three social-share buttons (X/Twitter, LinkedIn, WhatsApp) that open pre-filled share URLs in a new tab.
- The existing `CopyUrlButton` in the page header is preserved.

---

## Goal 4: Editor Panel — Show Existing Blocks

### New `BlockEditor` component in `DashboardPage.tsx`
- Parses `page.blocks` JSON when the editor loads (safe try/catch).
- Renders each block as an editable card below the links list.
- **Block types supported**: `text`, `poll`, `lead-form`.
- **Edit** — clicking "Edit" opens an inline form:
  - `text` → textarea for `content`.
  - `poll` → question input + per-option inputs, add/remove options (max 6).
  - `lead-form` → title, description, buttonText inputs.
- **Delete** — trash icon removes the block from the array and auto-saves.
- **Reorder** — up/down arrow buttons reposition blocks within the array.
- Saving calls `PATCH /api/pages/:id` with updated `blocks` JSON string.

---

## Goal 5: Analytics Panel Improvements

### Date Range Selector
- A "7d / 30d / 90d" button strip added to the analytics panel header.
- Selected `days` is passed as `?days=N` to `/api/pages/:id/analytics`.
- Chart title and stats labels dynamically reflect the chosen period.
- Export filename includes the selected period: `linkbay-analytics-<user>-30d.json`.

### Unique vs Repeat Visitors
- `schema.ts`: added `visitorId: text("visitor_id")` column to `pageEvents` table.
- `storage.ts`: migration `ALTER TABLE page_events ADD COLUMN visitor_id TEXT` (idempotent catch).
- `routes.ts` (`GET /api/pages/public/:username`): generates a 16-char SHA-256 hash of the client IP as `visitorId`, passed when recording view events.
- Analytics route computes `uniqueVisitors` (distinct non-null visitorIds on view events) and `repeatVisitors` (total views minus unique).
- Analytics panel now shows 6 stat cards: Total views, Views (Nd), Clicks (Nd), Click rate, **Unique visitors**, **Repeat visitors**.

---

## Goal 6: Leads Page Detail

### Table improvements
- Added **Message** column — truncated to 60 chars with "more/less" toggle for long messages.
- Added **Source** column (was already in data, now explicitly shown).
- Added **View** button column — opens the lead detail modal.

### Lead Detail Modal (`LeadDetailModal` component)
- Opens on "View" click; closes on overlay click or X button.
- Displays: name, email, source, date submitted, full message, status selector, internal notes textarea.
- Status changes fire `PATCH /api/leads/:id/status` inline.
- Notes are saved via new `PATCH /api/leads/:id/notes` endpoint.

### Notes feature
- `schema.ts`: `notes: text("notes")` added to `leads` table.
- `storage.ts`: migration `ALTER TABLE leads ADD COLUMN notes TEXT` (idempotent).
- `storage.ts`: new `updateLeadNotes(id, notes)` method.
- `IStorage` interface updated.
- `routes.ts`: new `PATCH /api/leads/:id/notes` route (auth + ownership required).

### CSV Export
- Export includes all columns: Name, Email, Message, Source, Status, Notes, Date.
- Values are properly CSV-escaped (double-quote escaping).
- File is named `leads-YYYY-MM-DD.csv`.

### Total lead count
- Panel subtitle now shows `N total lead(s) captured`.

---

## Goal 7: Lead Form Editor

### BuilderPage.tsx (Step 3)
- Added `"lead-form"` to the `BlockType` union.
- Added `title`, `formDescription`, `buttonText` fields to the `Block` interface.
- Added "📧 Add Lead form" button to the block-type selector row.
- When selected, renders a form with three text fields (title, description, button text) and a short explanation.
- `addLeadFormBlock()` creates a `lead-form` block with the configured fields and adds it to `state.blocks`.
- Existing lead-form blocks in the preview are displayed with title + button text summary.

### DashboardPage.tsx EditorPanel
- The `BlockEditor` component (Goal 4) already handles `lead-form` blocks:
  - Edit mode shows title, description, buttonText inputs.
  - Block list shows "📧 Lead Capture Form" with button text subtitle.
  - Delete and reorder arrows work the same as other block types.

---

## Files Changed

| File | Change |
|---|---|
| `shared/schema.ts` | Added `notes` to `leads`; added `visitorId` to `pageEvents` |
| `server/storage.ts` | Migrations for new columns; `getDashboardStats(days?)` with period filtering; `updateLeadNotes()` |
| `server/routes.ts` | Added `crypto` import; visitorId on page views; `?days` on dashboard/stats; new leads notes PATCH route; unique/repeat visitor stats in analytics |
| `client/src/pages/DashboardPage.tsx` | Complete rewrite incorporating Goals 3–6: OverviewPanel fixes, BlockEditor, AnalyticsPanel date range + unique visitors, LeadsPanel detail modal + notes + improved table |
| `client/src/pages/BuilderPage.tsx` | Goal 7: lead-form BlockType, builder Step3 lead-form add form, block display |
