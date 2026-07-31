# Forms Backend (API) - Full Technical Explanation

This document explains the current Forms backend implementation inside `apps/api` in a practical, architecture-first way.

## 1) High-level architecture

The Forms backend lives under:

- `apps/api/src/domain/forms`

It follows a modular NestJS design with:

- Controller layer (`forms.controller.ts`, `forms-upload.controller.ts`)
- Facade layer (`forms-facade.service.ts`)
- Split services (commands, queries, submissions, exports, steps)
- Queue processor for webhook delivery
- DTO-based input validation
- Prisma for database access
- Redis for cache and temporary verification state
- S3 + Google Drive/Sheets integrations for files and automation

The module is registered in the global API app through:

- `apps/api/src/app.module.ts` -> `FormsModule`

## 2) Forms module composition

Main wiring file:

- `apps/api/src/domain/forms/forms.module.ts`

Key imports:

- `PrismaModule` (database)
- `EmailModule` (mail)
- `NotificationsModule` (real-time notifications)
- `RedisModule` (cache + rate/temporary state)
- `GoogleSheetsModule` and `GoogleDriveModule`
- `BullModule` queue named `form-webhook`

Key providers:

- `FormsFacadeService`
- `FormsCommandsService`
- `FormsQueriesService`
- `FormsSubmissionService`
- `FormsExportService`
- `FormsStepsService`
- `FormsEmailVerificationService`
- `FormWebhookQueueService` + `FormWebhookProcessor`
- `FormsUploadCleanupService`
- analytics and conditional logic services

## 3) API surface (endpoints)

Main controller:

- `apps/api/src/domain/forms/forms.controller.ts`

### 3.1 Public endpoints

- `GET /forms/public/user/:username` -> published forms by username
- `GET /forms/public/:slug` -> public form structure by slug
- `POST /forms/public/:slug/submit` -> public submission
- `POST /forms/public/:slug/verify-email/send` -> send email OTP code
- `POST /forms/public/:slug/verify-email/confirm` -> verify OTP code

Public routes use endpoint-level throttling policies for abuse control.

### 3.2 Authenticated creator endpoints

- CRUD:
  - `POST /forms`
  - `GET /forms`
  - `GET /forms/:id`
  - `PUT /forms/:id`
  - `PUT /forms/:id/status`
  - `DELETE /forms/:id`
- Utility:
  - `POST /forms/:id/duplicate`
  - `GET /forms/:id/export`
- Submissions:
  - `POST /forms/:id/submit` (authenticated submit path)
  - `GET /forms/:id/submissions`
  - `GET /forms/:id/submissions/summary`
  - `DELETE /forms/:id/submissions/:submissionId`
- Multi-step:
  - `GET /forms/:id/steps`
  - `PUT /forms/:id/steps`
- Analytics:
  - `GET /forms/:id/analytics`

Guards used:

- `JwtAuthGuard` (auth)
- `PlanGuard` with features/limits checks (`CheckLimit`, `CheckFeature`)

### 3.3 Upload endpoints

Upload controller:

- `apps/api/src/domain/forms/forms-upload.controller.ts`

Supports:

- Authenticated upload to local temp disk (multipart)
- Public upload by form slug (throttled)
- S3 presigned upload generation:
  - global form upload presign
  - form-specific presign
- upload confirmation endpoints

Validation includes MIME and size checks via `FileValidationPipe`.

## 4) Service layer architecture

Facade:

- `forms-facade.service.ts`

The controller depends on facade, and facade delegates to focused services:

- Commands: create/update/delete/status/duplicate
- Queries: read/list/public fetch
- Submissions: submission pipeline, pagination, webhook trigger
- Exports: CSV + analytics aggregates
- Steps: multi-step management
- Legacy methods still routed through `FormsService` for compatibility

### 4.1 Commands service

File:

- `services/forms-commands.service.ts`

Responsibilities:

- create form (with slug uniqueness generation)
- validate linked entities (event/store ownership)
- process cover and banner images (base64 -> WebP -> S3)
- create fields/steps transactionally
- duplicate forms
- status update/delete
- async post-actions:
  - send creation email
  - optional Google Sheets initialization

### 4.2 Queries service

File:

- `services/forms-queries.service.ts`

Responsibilities:

- list forms with filters + pagination
- public forms by username
- read by ID
- read by slug (with cache and async view increment)
- image URL transformation (S3 key -> presigned URL)
- lightweight public caching through Redis keys

### 4.3 Submission service

File:

- `services/forms-submission.service.ts`

Responsibilities:

- full submit pipeline:
  1. resolve form
  2. gate checks (`assertFormAcceptsSubmission`)
  3. recaptcha verification (`verifySubmissionRecaptcha`)
  4. conditional visibility/required fields logic
  5. payload validation via `ValidationService`
  6. file/signature processing (optionally Google Drive)
  7. save submission
  8. increment counters
  9. async side effects:
     - analytics tracking
     - real-time notifications
     - webhook queue job
     - notification email + auto-response
     - Google Sheets append

Also supports cursor pagination for submissions and submission deletion.

### 4.4 Export and analytics service

File:

- `services/forms-export.service.ts`

Provides:

- CSV export with escaped cells and deterministic field order
- analytics summary:
  - totals
  - completion rate
  - average completion time
  - submissions over time
  - field-level response analytics
  - drop-off metrics

### 4.5 Steps service

File:

- `services/forms-steps.service.ts`

Responsibilities:

- read steps
- full replacement update of steps + associated fields
- update `isMultiStep` flag in form

## 5) Data and DTO model

Main DTO files:

- `dto/create-form.dto.ts`
- `dto/update-form.dto.ts`
- `dto/submit-form.dto.ts`
- `dto/email-verification.dto.ts`

Key capabilities modeled in DTOs:

- form status/type
- multi-step form definitions
- field-level type system (input/layout/embed/advanced)
- conditional logic payloads
- file constraints (`allowedFileTypes`, `maxFileSize`, `maxFiles`)
- form behavior flags:
  - require auth
  - allow multiple submissions
  - one response per user
  - open/close windows
  - notification and auto-response settings
  - Google Sheets preference
  - storage provider hint

## 6) Security and protection mechanisms (currently present)

Already implemented controls include:

- global throttling in API app (`ThrottlerModule`)
- route-level throttle for sensitive public submit/verify/upload endpoints
- JWT guard for owner/admin actions
- Plan-based feature gating (`PlanGuard`)
- ownership checks before read/update/delete
- recaptcha enterprise verification for forms using RECAPTCHA field
- submission gate checks:
  - status window
  - max submissions
  - one-response policy
- file validation and safe filenames
- webhook queue with retries and exponential backoff
- short-lived presigned URL pattern for S3 object access

## 7) Asynchronous and integration flows

### 7.1 Webhooks

- Submission triggers enqueue into `form-webhook` queue.
- Processor consumes jobs and sends signed payloads through `WebhookService`.
- Failed jobs retry with exponential backoff.

### 7.2 Google Sheets

- Optional spreadsheet creation at form creation.
- Submission rows pushed asynchronously after save.

### 7.3 Google Drive

- Signature/file fields can be uploaded and converted into secure links.

### 7.4 Notifications and email

- Real-time notification pushed to form owner.
- Optional submission notification email.
- Optional auto-response email to submitter (if user is known).

## 8) Caching strategy

Two cache styles coexist:

- direct Redis key access in focused services
- `CacheManager` style invalidation in legacy/other services

Cached entities include:

- public form by slug
- public forms by username
- selected dashboard stats keys

## 9) Admin-side forms visibility

Admin endpoints:

- `apps/api/src/domain/admin/forms/forms.controller.ts`

Capabilities:

- global forms stats
- paginated list of forms with search/status filters
- protected by `JwtAuthGuard + RolesGuard` and `Role.ADMIN`

## 10) Current backend strengths

- clear modular domain design
- practical separation of read/write/submission concerns
- strong feature coverage (multi-step, files, analytics, webhook, integrations)
- multiple protection layers already in place
- good async behavior for non-critical side effects

## 11) Known architectural note

There is an intentional transition state:

- legacy `FormsService` still exists and is used in some paths
- newer split services (`commands/queries/submissions/exports/steps`) handle the main architecture

This is workable now, but can be unified further for consistency (covered in the improvements document).
