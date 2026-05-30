# Backend Changes: Goals 8 & 9

## Goal 8: Profile Picture Upload

### Packages installed
- `multer` + `@types/multer` — multipart form-data file upload handling
- `sharp` — image compression and WebP conversion

### `shared/schema.ts`
- Added `avatarUrl: text("avatar_url")` to the `users` table schema.

### `server/storage.ts`
- Added migration: `ALTER TABLE users ADD COLUMN avatar_url TEXT`
- Added `updateUserAvatar(userId, avatarUrl)` to `IStorage` interface
- Implemented `updateUserAvatar` in `DatabaseStorage`:
  ```ts
  async updateUserAvatar(userId: number, avatarUrl: string | null): Promise<User> {
    return db.update(schema.users).set({ avatarUrl }).where(eq(schema.users.id, userId)).returning().get();
  }
  ```

### `server/routes.ts`
- Added imports: `multer`, `sharp`, `path`, `fs`
- Added `POST /api/account/avatar` (auth required):
  - Accepts multipart file upload (field name: `avatar`)
  - Enforces 5MB file size limit
  - Accepts JPEG, PNG, WebP, GIF only
  - Resizes to 400×400 cover crop, saves as WebP (80% quality)
  - Saves to `uploads/avatars/avatar-{userId}-{timestamp}.webp`
  - Deletes old avatar file if one existed
  - Returns `{ success, avatarUrl, user }`
- Added `DELETE /api/account/avatar` (auth required):
  - Deletes avatar file from disk
  - Sets `avatarUrl` to `null` in DB
  - Returns `{ success }`
- Updated `GET /api/auth/me` response to include `avatarUrl` in the user object

### `server/index.ts`
- Added `import path from "path"`
- Added static file serving: `app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))`
  - Serves uploaded avatar images at `/uploads/avatars/<filename>`

---

## Goal 9: Page Background Picker

### `shared/schema.ts`
- Added `background: text("background").notNull().default("none")` to the `pages` table schema.

### `server/storage.ts`
- Added migration: `ALTER TABLE pages ADD COLUMN background TEXT NOT NULL DEFAULT 'none'`

### `server/routes.ts`
- Added `background: z.string().max(100).optional()` to the `PATCH /api/pages/:id` allowedFields validator
- Added `background: req.body.background || "none"` to the `POST /api/builder/create` page creation call

---

## TypeScript
All changes pass `npx tsc --noEmit` with zero errors.
