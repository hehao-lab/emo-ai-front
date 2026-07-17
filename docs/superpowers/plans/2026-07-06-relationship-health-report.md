# Relationship Health Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` when continuing this plan task-by-task.

**Goal:** Build a backend-provided emotional analysis report with one personal portrait and per-target relationship health analyses.

**Architecture:** Expose `GET /v1/emotion/reports/relationship-health` as a backend-generated report. Because the local workspace currently does not have the Go/protobuf generation toolchain available, the endpoint is registered as a raw HTTP handler, matching the existing raw SSE handler pattern. The frontend maps the backend JSON shape into camelCase UI data and renders it in the existing settings report page.

**Tech Stack:** Go/Kratos backend, Vue 3 uni-app frontend, Node built-in test runner.

## Global Constraints

- Frontend consumes backend report data and does not calculate relationship health locally.
- Report content includes one personal portrait and one relationship health card per target profile.
- Existing report endpoints (`overview`, `trends`, `calendar`) remain unchanged.
- The relationship report raw handler authenticates with the existing Bearer token manager.
- Go, `buf`, and `wire` are unavailable in the current environment, so generated proto work and backend test execution must be deferred until the backend toolchain is installed.
- Do not refactor unrelated settings, profile, or chat flows.

## Task 1: Backend Report Usecase

**Files:**
- Modify: `emotion-backend/emo/emo-ai-service/internal/biz/emotion.go`

**Interfaces:**
- Consumes: existing `ProfileRepo` methods `FindPersonalProfile`, `ListTargetProfiles`, `ListImportantRecords`
- Produces: `func (uc *EmotionUsecase) RelationshipHealthReport(ctx context.Context, userID int64) (*RelationshipHealthReport, error)`

- [x] Add report structs in `biz/emotion.go`.
- [x] Inject `ProfileRepo` into `NewEmotionUsecase`.
- [x] Build deterministic backend-generated report copy from profile data and important records.
- [ ] Run Go tests after Go is installed or added to PATH.

## Task 2: Backend Raw HTTP Service

**Files:**
- Modify: `emotion-backend/emo/emo-ai-service/internal/service/emotion.go`
- Modify: `emotion-backend/emo/emo-ai-service/internal/server/http.go`
- Modify: `emotion-backend/emo/emo-ai-service/cmd/emo-ai-service/wire_gen.go`

**Interfaces:**
- Consumes: `EmotionUsecase.RelationshipHealthReport`
- Produces: `GET /v1/emotion/reports/relationship-health`
- Produces JSON fields: `personal_portrait`, `target_reports`

- [x] Add DTOs and mapper functions from biz report structs to JSON response structs.
- [x] Add raw HTTP handler and authenticate with Bearer token parsing.
- [x] Register the raw route in `NewHTTPServer`.
- [x] Manually update generated wire output to pass `profileRepo` and `tokenManager`.
- [ ] Regenerate Wire after `wire` is installed.

## Task 3: Frontend API Mapping

**Files:**
- Modify: `emotion-frontend/common/user-api.mjs`
- Test: `emotion-frontend/tests/chat-api.spec.mjs`

**Interfaces:**
- Produces: `fetchRelationshipHealthReport(options = {})`
- Produces normalized fields: `personalPortrait`, `targetReports`, string target IDs, array defaults

- [x] Add API test for `/v1/emotion/reports/relationship-health`.
- [x] Add request helper and mapper in `user-api.mjs`.
- [x] Keep trend report pointed at `/v1/emotion/reports/trends`.

## Task 4: Frontend Report Page

**Files:**
- Modify: `emotion-frontend/components/settings/SettingsDetailScreen.vue`
- Test: `emotion-frontend/tests/uniapp-structure.spec.mjs`

**Interfaces:**
- Consumes: `fetchRelationshipHealthReport`
- Renders: one personal portrait card and one relationship health card per target

- [x] Add structure test for report page imports, loads, and renders personal portrait plus target health cards.
- [x] Store relationship report state in `SettingsDetailScreen.vue`.
- [x] Load relationship report alongside existing overview/trend/calendar requests.
- [x] Add report template and styles.

## Task 5: Chat History ID Regression

**Files:**
- Add: `emotion-frontend/common/chat-id.mjs`
- Modify: `emotion-frontend/common/chat-api.mjs`
- Modify: `emotion-frontend/pages/index/index.vue`
- Modify: `emotion-frontend/components/home/HomeSideDrawer.vue`
- Test: `emotion-frontend/tests/chat-api.spec.mjs`
- Test: `emotion-frontend/tests/uniapp-structure.spec.mjs`

**Interfaces:**
- Produces: `normalizeChatId(value)`
- Produces: `isRemoteChatId(value)`

- [x] Add regression coverage for numeric backend chat session IDs.
- [x] Normalize backend chat session IDs to strings.
- [x] Use shared remote/local chat ID checks.
- [x] Pass whole chat records from the side drawer so cached messages are preserved.

## Verification

- [x] `node --test tests/chat-api.spec.mjs`
- [x] `node --test tests/uniapp-structure.spec.mjs`
- [ ] `npm run check:uniapp`
- [ ] `go test ./...` after Go is installed or added to PATH.
