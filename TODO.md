# Real Estate Platform - Implementation TODO

## ✅ OTP Email Verification System (COMPLETED)
- [x] `prisma/schema.prisma` — Added `isEmailVerified` to User + `EmailVerification` model
- [x] `src/lib/otp.ts` — OTP generation (crypto.randomInt), bcrypt hashing, expiry/rate-limit helpers
- [x] `src/lib/mailer.ts` — Nodemailer transporter singleton, bilingual HTML email template
- [x] `src/app/api/auth/send-otp/route.ts` — POST with IP rate limit, 60s cooldown, 3/hr limit
- [x] `src/app/api/auth/verify-otp/route.ts` — POST with 5-attempt limit, timing-safe compare, atomic transaction
- [x] `src/app/api/auth/register/route.ts` — Auto-sends OTP, returns `requiresEmailVerification: true`
- [x] `src/components/auth/OtpInput.tsx` — 6-digit auto-advance, paste support, RTL/LTR
- [x] `src/app/[locale]/auth/verify-email/page.tsx` — Countdown timer, resend cooldown, auto-submit
- [x] `src/app/[locale]/auth/register/page.tsx` — **FIXED**: Redirects to verify-email when `requiresEmailVerification=true`
- [x] `src/app/[locale]/auth/login/page.tsx` — **FIXED**: Shows green verified banner on `?verified=1`
- [x] `test-full-flow.mjs` — 29/29 tests passing

---


## Phase 1: Project Setup & Configuration ✅
- [x] Create TODO.md
- [x] Create package.json with all dependencies
- [x] Create next.config.ts / next.config.mjs
- [x] Create tailwind.config.ts
- [x] Create tsconfig.json
- [x] Create postcss.config.js
- [x] Create .env.example
- [x] Create .gitignore

## Phase 2: Database & Prisma ✅
- [x] Create prisma/schema.prisma (Users, Properties, Bookings, Contacts)
- [x] Create src/lib/prisma.ts (Prisma client singleton)
- [x] Database migrated (SQLite for dev, MySQL-ready for prod)
- [x] Database seeded (2 users + 6 properties)
- [x] Added isEmailVerified to User model
- [x] Added EmailVerification model (OTP storage)

## Phase 3: Authentication & Security ✅
- [x] Create src/lib/jwt.ts (JWT sign/verify utilities)
- [x] Create src/lib/auth.ts (getAuthUser helper)
- [x] Create src/lib/rate-limit.ts (LRU-based rate limiting, dev/prod aware)
- [x] Create src/lib/validations.ts (Zod schemas for all entities)
- [x] Create src/middleware.ts (i18n routing + admin route protection)
- [x] Create src/lib/otp.ts (crypto.randomInt CSPRNG, bcrypt hash, expiry/rate-limit helpers)
- [x] Create src/lib/mailer.ts (Nodemailer singleton, bilingual HTML email template)

## Phase 4: API Routes ✅ (36/36 + 20/20 OTP tests passing)
- [x] POST /api/auth/register (422 validation, 409 duplicate, 201 success + auto OTP send)
- [x] POST /api/auth/login (401 wrong creds, 200 success + JWT)
- [x] GET /api/auth/me (401 no token, 200 authenticated)
- [x] POST /api/auth/logout
- [x] POST /api/auth/send-otp (IP rate limit, 60s cooldown, 3/hr max, upsert OTP)
- [x] POST /api/auth/verify-otp (5 attempts max, timing-safe bcrypt.compare, atomic transaction)
- [x] GET /api/properties (filtering: type, city, price, bedrooms, featured)
- [x] POST /api/properties (admin only, 401 unauth)
- [x] GET/PUT/DELETE /api/properties/[id]
- [x] POST /api/bookings (auth required, 409 duplicate prevention)
- [x] GET /api/bookings (admin list)
- [x] POST /api/contact (422 validation, 201 success)
- [x] GET /api/admin/stats (admin only, full dashboard stats)
- [x] POST /api/upload (image upload)

## Phase 5: i18n Configuration ✅
- [x] Create src/i18n.ts (next-intl config)
- [x] Create messages/en.json (full English translations)
- [x] Create messages/ar.json (full Arabic translations)
- [x] RTL/LTR support via locale-aware layout

## Phase 6: Components ✅
- [x] Navbar (bilingual, language switcher, auth state)
- [x] Footer (bilingual)
- [x] PropertyCard (bilingual, responsive)
- [x] FilterBar (price, city, type, bedrooms)
- [x] PropertyMap (Leaflet-based, dynamic)
- [x] AdminSidebar
- [x] PropertyForm (create/edit)
- [x] BookingForm
- [x] ShareButtons (social sharing + WhatsApp)
- [x] AnalyticsCharts (pure SVG, admin dashboard)
- [x] OtpInput (6-digit auto-advance, paste support, RTL/LTR aware)

## Phase 7: Frontend Pages ✅
- [x] /[locale]/layout.tsx (RTL/LTR, fonts, providers)
- [x] /[locale]/page.tsx (Home: hero + featured properties)
- [x] /[locale]/properties/page.tsx (listing + filters)
- [x] /[locale]/properties/[id]/page.tsx (detail + map + booking + owner contact)
- [x] /[locale]/properties/new/page.tsx (user property creation)
- [x] /[locale]/properties/[id]/edit/page.tsx (owner edit + 24h cooldown)
- [x] /[locale]/auth/login/page.tsx
- [x] /[locale]/auth/register/page.tsx
- [x] /[locale]/auth/verify-email/page.tsx (OTP input, countdown, resend cooldown)
- [x] /[locale]/admin/page.tsx (dashboard stats + SVG analytics charts)
- [x] /[locale]/admin/properties/page.tsx (CRUD table)
- [x] /[locale]/admin/properties/new/page.tsx
- [x] /[locale]/admin/properties/[id]/edit/page.tsx
- [x] /[locale]/admin/bookings/page.tsx
- [x] /[locale]/booking/[id]/page.tsx
- [x] /[locale]/contact/page.tsx
- [x] /[locale]/profile/page.tsx

## Phase 8: SEO & Performance ✅
- [x] Dynamic metadata per page (title, description, OG tags)
- [x] JSON-LD structured data for properties
- [x] src/app/sitemap.ts (dynamic sitemap)
- [x] src/app/robots.ts
- [x] next/image optimization
- [x] Security headers (X-Frame-Options, CSP, HSTS)

## Phase 9: Deployment Configuration ✅
- [x] deployment/nginx.conf (reverse proxy + SSL)
- [x] deployment/ecosystem.config.js (PM2 cluster mode)
- [x] deployment/setup.sh (full Ubuntu VPS setup)
- [x] deployment/ssl-setup.sh (Let's Encrypt)
- [x] DEPLOYMENT.md (step-by-step guide)

## Phase 10: Types & Utilities ✅
- [x] src/types/index.ts (all TypeScript types)
- [x] src/hooks/useAuth.ts
- [x] src/hooks/useProperties.ts
- [x] src/lib/utils.ts

## ✅ OTP Email Verification System — COMPLETE (20/20 tests passing)

### Files Created/Modified:
- [x] `prisma/schema.prisma` — `isEmailVerified Boolean @default(false)` on User + `EmailVerification` model
- [x] `src/lib/otp.ts` — OTP generation (crypto.randomInt), hashing (bcrypt), expiry/rate-limit helpers
- [x] `src/lib/mailer.ts` — Nodemailer transporter singleton, bilingual HTML email template
- [x] `src/app/api/auth/send-otp/route.ts` — POST with IP rate limit, 60s cooldown, 3/hr limit, upsert OTP
- [x] `src/app/api/auth/verify-otp/route.ts` — POST with 5-attempt limit, timing-safe compare, atomic transaction
- [x] `src/app/api/auth/register/route.ts` — Updated: auto-sends OTP on registration, devOtp in dev mode
- [x] `src/components/auth/OtpInput.tsx` — 6-digit auto-advance, paste support, keyboard nav, RTL/LTR
- [x] `src/app/[locale]/auth/verify-email/page.tsx` — Countdown timer, resend cooldown, auto-submit on 6 digits
- [x] `test-otp-system.mjs` — Comprehensive test: 20/20 passing ✅

### OTP Security Properties:
| Property | Value |
|----------|-------|
| Generation | `crypto.randomInt(100000, 999999)` — CSPRNG, always 6 digits |
| Storage | `bcrypt.hash(otp, 10)` — never plain text in DB |
| Expiry | 10 minutes |
| Resend cooldown | 60 seconds between sends |
| Max sends/hour | 3 per email per hour |
| Max attempts | 5 per OTP → auto-invalidated on exhaustion |
| One-time use | Deleted immediately after successful verify |
| Timing safety | `bcrypt.compare()` — constant-time comparison |
| Email enumeration | Generic error messages for non-existent emails |
| Dev mode | OTP in console + response body (never in production) |

## TEST RESULTS ✅
- Original API tests:  36/36 ✅
- OTP system tests:    20/20 ✅
- Owner contact tests:  5/5  ✅
- New features tests:   all  ✅
- **TOTAL: 61+ tests passing**
