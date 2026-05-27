# Security Review — Linkbay

Reviewed: `server/routes.ts`, `server/storage.ts`, `server/index.ts`, `shared/schema.ts`, `client/src/components/ui/chart.tsx`

---

## Security Review Results

### BLOCK (must fix before publishing)

_No BLOCK-level findings._ No hardcoded secrets or critical-severity CVEs were found.

---

### WARN (inform user, let them decide)

**W1 — High-severity dependency vulnerabilities in `tar` / `node-gyp` / `sqlite3` (build-time only)**
- **File:** `package-lock.json` (transitive deps under `sqlite3 → node-gyp → tar`)
- **Detail:** `npm audit` reports 5 HIGH packages, all tracing back to `tar ≤ 7.5.10`. CVEs include path-traversal / arbitrary file write ([GHSA-34x7-hfp2-rc4v](https://github.com/advisories/GHSA-34x7-hfp2-rc4v), [GHSA-83g3-92jg-28cx](https://github.com/advisories/GHSA-83g3-92jg-28cx), [GHSA-qffp-2rhf-9h96](https://github.com/advisories/GHSA-qffp-2rhf-9h96), [GHSA-9ppj-qmqm-q256](https://github.com/advisories/GHSA-9ppj-qmqm-q256), [GHSA-8qq5-rm4j-mr97](https://github.com/advisories/GHSA-8qq5-rm4j-mr97)). These packages are used only during `npm install` (native compilation of `sqlite3`), not at request-serve time — so runtime exploitability is low. However they are real CVEs and should be resolved before shipping.
- **Suggested fix:** Run `npm audit fix` or upgrade `sqlite3` to a version that pulls in a patched `node-gyp`/`tar`. Alternatively, switch to `better-sqlite3`, which has no native build dependency on `node-gyp` and has no known high CVEs.

**W2 — Mass assignment on `PATCH /api/links/:id` — unsanitized `req.body` passed to ORM `set()`**
- **File:** `server/routes.ts:299`, `server/storage.ts:253`
- **Detail:** The route validates the `url` field for javascript: scheme but then calls `storage.updateLink(id, req.body)` without stripping extra fields. `updateLink` performs `db.update(pageLinks).set(data)` directly. Although TypeScript types `data` as `Partial<InsertPageLink>`, this is erased at runtime — an authenticated attacker can POST `{ "clickCount": 99999 }` or `{ "pageId": <another_user_page_id> }` and the ORM will write those columns. The `pageId` overwrite in particular could be used to silently move a link to another user's page (ownership confusion).
- **Suggested fix:** Validate and allowlist fields in the route handler before passing to storage, mirroring the pattern already used in `PATCH /api/pages/:id`:
  ```ts
  const allowedFields = z.object({
    label: z.string().min(1).max(100).optional(),
    url: z.string().url().optional(),
    icon: z.string().max(10).optional(),
    style: z.string().max(40).optional(),
    position: z.number().int().optional(),
    active: z.boolean().optional(),
  });
  const data = allowedFields.parse(req.body);
  const link = await storage.updateLink(id, data);
  ```

**W3 — `dangerouslySetInnerHTML` in `chart.tsx` — low-risk but worth noting**
- **File:** `client/src/components/ui/chart.tsx:81`
- **Detail:** The `ChartStyle` component injects CSS via `dangerouslySetInnerHTML`. The injected content is built from `THEMES` (a static object) and `config` values (`color` strings and theme keys) passed in by the caller. If any `config` value ever originates from user-supplied data (e.g. an accent color from the DB), a malformed value could inject CSS. Currently the accent color is validated server-side with `/^#[0-9a-fA-F]{6}$/` (routes.ts:221), which limits exploitability. The pattern is still worth monitoring if new chart configs are added.
- **Suggested fix:** No immediate action required given current data flow. If config values are ever derived from free-text user input, sanitize them before passing to `ChartStyle`.

**W4 — Fallback hardcoded session secret in development**
- **File:** `server/index.ts:65`
- **Detail:** `secret: sessionSecret || "linkbay-dev-secret-change-in-prod"`. The code correctly errors out in production if `SESSION_SECRET` is unset (line 54–57), so the fallback only applies when `NODE_ENV !== "production"`. Risk is low as long as the production environment always sets `SESSION_SECRET`. Confirm the deployment config (e.g. `.pplx.app` environment) injects this variable before go-live.
- **Suggested fix:** Verify `SESSION_SECRET` is set in the deployment environment. Consider removing the fallback string entirely so any misconfiguration fails loudly in all environments, not just production.

---

### PASS

- **Check 2 — Hardcoded secrets:** No API keys, private keys, AWS credentials, Slack tokens, or hardcoded passwords found in source files.
- **Check 4a — CORS:** No open `Access-Control-Allow-Origin: *` or unconfigured `cors()` middleware found.
- **Check 4b — Auth middleware on mutation endpoints:** All owner-facing POST/PATCH/DELETE routes (`/api/pages`, `/api/pages/:id`, `/api/pages/:id/publish`, `/api/pages/:id/unpublish`, `/api/links/:id`, `/api/pages/:pageId/links`, `/api/pages/:pageId/links/reorder`, `/api/leads/:id/status`, `/api/account/profile`, `/api/account/password`, `/api/account`) are protected with `requireAuth`. Public endpoints (`/api/pages/public/:username`, `/api/pages/:pageId/leads`, `/api/links/:linkId/click`) are correctly unauthenticated by design.
- **Check 3a — eval / innerHTML / document.write:** No `eval()`, `new Function()`, `innerHTML =`, or `document.write()` calls with user-controlled input found. The single `dangerouslySetInnerHTML` instance (W3 above) uses static/validated data.
- **Auth implementation:** bcrypt with cost factor 12, rate limiting via `authLimiter` on signup/login/builder endpoints, Zod validation on all input schemas, `assertOwnsPage` ownership check on all owner-scoped operations.
