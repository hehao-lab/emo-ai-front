# Important Record CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete important-record create/view/edit/delete flow inside the existing single-page uni-app shell.

**Architecture:** Keep important-record state in `pages/index/index.vue`, render summaries in `HomeSideDrawer.vue`, and reuse `HomeFeatureScreen.vue` for create/detail/edit page states. All interactions stay in-page through props and emits instead of native navigation APIs.

**Tech Stack:** Vue 3, uni-app single-file components, Node built-in test runner

## Global Constraints

- Keep the app single-page and do not introduce `uni.navigateTo`, `uni.redirectTo`, or `uni.reLaunch`.
- Use the existing `featureKey` pattern for page-state switching.
- Preserve the current sidebar/chat behavior while adding important-record behavior.
- Record fields must include title, record time, event description, resolution, concern point, and satisfaction.

---

### Task 1: Lock the expected behavior in tests

**Files:**
- Modify: `D:\work3\emotion AI\emotion-frontend\tests\uniapp-structure.spec.mjs`

**Interfaces:**
- Consumes: existing string-based structure assertions for Vue SFCs
- Produces: failing assertions for important-record sidebar behavior and CRUD event wiring

- [ ] Add assertions for `importantRecords`, `activeImportantRecord`, and important-record CRUD handlers.
- [ ] Add assertions for drawer empty/list states and `open-important-record`.
- [ ] Add assertions for feature-screen create/detail/edit states and save/edit/delete emits.

### Task 2: Implement shell state and routing

**Files:**
- Modify: `D:\work3\emotion AI\emotion-frontend\pages\index\index.vue`

**Interfaces:**
- Consumes: feature screen props/emits and drawer props/emits
- Produces: `importantRecords`, `activeImportantRecord`, `openImportantRecordCreate`, `openImportantRecordDetail`, `openImportantRecordEdit`, `saveImportantRecord`, `deleteImportantRecord`

- [ ] Add important-record shell state and computed helpers.
- [ ] Add create/detail/edit open handlers.
- [ ] Add save and delete handlers.
- [ ] Wire new props and emits into `HomeFeatureScreen` and `HomeSideDrawer`.

### Task 3: Implement drawer rendering

**Files:**
- Modify: `D:\work3\emotion AI\emotion-frontend\components\home\HomeSideDrawer.vue`

**Interfaces:**
- Consumes: `importantRecords: Array`
- Produces: `open-page` create event and `open-important-record` detail event

- [ ] Render the empty important-record state as a full-area create trigger.
- [ ] Render saved records in the sidebar with title, preview, and time.
- [ ] Render the bottom “新增记录” button when records exist.

### Task 4: Implement feature-screen create/detail/edit UI

**Files:**
- Modify: `D:\work3\emotion AI\emotion-frontend\components\home\HomeFeatureScreen.vue`

**Interfaces:**
- Consumes: `featureKey`, `activeImportantRecord`
- Produces: `save-important-record`, `edit-important-record`, `delete-important-record`

- [ ] Add props for important-record data.
- [ ] Add local form state and sync logic for create/edit.
- [ ] Replace the old placeholder important-record form with the real record form.
- [ ] Add a read-only detail layout with edit/delete actions.

### Task 5: Verify

**Files:**
- None

**Interfaces:**
- Consumes: project test script
- Produces: verification evidence for completion

- [ ] Run `npm run check:uniapp`.
- [ ] Review the diff for the touched files only.
