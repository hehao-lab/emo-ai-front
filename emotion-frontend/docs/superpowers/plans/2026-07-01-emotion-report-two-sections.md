# Emotion Report Two Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current emotion report detail content with two dedicated sections for personality analysis and target relationship analysis.

**Architecture:** Keep the existing in-page settings detail flow, but add a report-specific rendering branch in `SettingsDetailScreen.vue` and simplify the `report` payload in `SettingsScreen.vue` so it only contains the two required analysis sections.

**Tech Stack:** Vue 3, uni-app single-file components, Node built-in test runner

## Global Constraints

- Keep the settings detail flow single-page and do not introduce navigation APIs.
- Do not affect the existing mood diary and history consultation special-case rendering.
- Replace the old generic report content instead of appending new content below it.

---

### Task 1: Lock the new report behavior in structure tests

**Files:**
- Modify: `D:\work3\emotion AI\emotion-frontend\tests\uniapp-structure.spec.mjs`

**Interfaces:**
- Consumes: existing string-based SFC assertions
- Produces: failing assertions for report-specific data and rendering

- [ ] Add assertions for `reportSections` in `SettingsScreen.vue`.
- [ ] Add assertions for `isReportDetail` and report-only render blocks in `SettingsDetailScreen.vue`.
- [ ] Add assertions that report no longer uses the generic action list.

### Task 2: Update report data structure

**Files:**
- Modify: `D:\work3\emotion AI\emotion-frontend\components\settings\SettingsScreen.vue`

**Interfaces:**
- Consumes: existing `detailMap`
- Produces: `report` entry with `reportSections`

- [ ] Replace the old generic `report.sections` and `report.actions`.
- [ ] Add the two required section payloads.

### Task 3: Add report-specific detail rendering

**Files:**
- Modify: `D:\work3\emotion AI\emotion-frontend\components\settings\SettingsDetailScreen.vue`

**Interfaces:**
- Consumes: `detail.reportSections`
- Produces: dedicated report summary and section cards

- [ ] Add report detection computed state.
- [ ] Render dedicated report layout.
- [ ] Exclude report from the generic section/action block.

### Task 4: Verify

**Files:**
- None

**Interfaces:**
- Consumes: project test script
- Produces: verification evidence

- [ ] Run `npm run check:uniapp`.
