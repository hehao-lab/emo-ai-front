# Emotion Report Target Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the settings emotion report so it removes the summary card, supports selecting among multiple target people, and renders the two analysis blocks with separated title/body lines.

**Architecture:** Keep the existing in-page settings/detail flow intact. Store multi-target report data in `SettingsScreen.vue`, then let `SettingsDetailScreen.vue` manage the active target locally and render a dedicated report-only layout without falling back to the generic detail sections.

**Tech Stack:** Vue 3, uni-app single-file components, Node test runner structure tests

## Global Constraints

- Preserve the current single-page settings/detail interaction model.
- Do not add routing or use page navigation APIs.
- Do not break the existing dedicated handling for mood diary and history consultation.
- Keep the emotion report limited to `我的性格分析` and `目标人物的关系分析`.

---
