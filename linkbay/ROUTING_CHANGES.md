# Routing Changes: Hash → Path Routing

Migrated the Linkbay frontend from hash-based routing (`/#/path`) to standard browser path routing (`/path`).

## Files Changed

### 1. `client/src/App.tsx`
- **Removed** import: `import { useHashLocation } from "wouter/use-hash-location";`
- **Changed** `<Router hook={useHashLocation}>` → `<Router>`
- The default `<Router>` uses `useBrowserLocation` (path-based routing) automatically.

### 2. `client/src/main.tsx`
- **Removed** the hash initialization block:
  ```ts
  if (!window.location.hash) {
    window.location.hash = "#/";
  }
  ```
  This block was forcing the URL to `/#/` on first load; with path routing it is no longer needed or correct.

### 3. `client/src/pages/DashboardPage.tsx` (line 177)
- **Changed** URL construction for "Copy link" button:
  ```ts
  // Before
  const pageUrl = `${window.location.origin}/#/${page?.username}`;
  // After
  const pageUrl = `${window.location.origin}/${page?.username}`;
  ```

### 4. `client/src/pages/BuilderPage.tsx` (line 908, `StepLaunch` component)
- **Changed** URL construction for the launch screen copy button:
  ```ts
  // Before
  const fullUrl = `${window.location.origin}/#/${state.username}`;
  // After
  const fullUrl = `${window.location.origin}/${state.username}`;
  ```

## Files Verified (No Changes Needed)

### `server/routes.ts`
- Builder create endpoint already returns `pageUrl: \`/${page.username}\`` — correct, no hash prefix.

### `server/static.ts`
- Wildcard catch-all `app.use("/{*path}", ...)` already serves `index.html` for all non-API routes — supports path routing without changes.

### Route Order in `App.tsx`
- `/dashboard` is defined before `/:username` in the `<Switch>` — no conflict with the username wildcard route.

## Result

| URL type        | Before                                | After                        |
|-----------------|---------------------------------------|------------------------------|
| Home            | `https://linkbay.pplx.app/#/`         | `https://linkbay.pplx.app/`  |
| Dashboard       | `https://linkbay.pplx.app/#/dashboard`| `https://linkbay.pplx.app/dashboard` |
| User profile    | `https://linkbay.pplx.app/#/username` | `https://linkbay.pplx.app/username`  |
| Builder         | `https://linkbay.pplx.app/#/builder`  | `https://linkbay.pplx.app/builder`   |
