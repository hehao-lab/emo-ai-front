# Emotion Report Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the settings emotion report detail page into a conclusion-first report view with a current target card, a core judgment card, and two analysis cards.

**Architecture:** Keep the existing single-page settings detail flow and reuse the current `report` entry inside `SettingsScreen.vue`. Extend each target record with short judgment fields, then let `SettingsDetailScreen.vue` render a dedicated report-only layout that updates the judgment card and relationship analysis when the selected target changes while keeping the personality analysis static.

**Tech Stack:** Vue 3 SFCs, uni-app templates, scoped SCSS, Node built-in test runner

## Global Constraints

- Preserve the current single-page settings/detail interaction model.
- Do not add routing or use page navigation APIs.
- Do not break the dedicated handling for mood diary, history consultation, or important records.
- Keep the report limited to `我的性格分析` and `目标人物的关系分析`.
- Redesign only the emotion report detail page; do not refactor unrelated settings flows.
- Do not revert unrelated dirty worktree changes.

---

### Task 1: Extend report data for conclusion-first content

**Files:**
- Modify: `D:/work3/emotion AI/emotion-frontend/tests/uniapp-structure.spec.mjs`
- Modify: `D:/work3/emotion AI/emotion-frontend/components/settings/SettingsScreen.vue`
- Test: `D:/work3/emotion AI/emotion-frontend/tests/uniapp-structure.spec.mjs`

**Interfaces:**
- Consumes: existing `detailMap.report` shape in `SettingsScreen.vue`
- Produces: `detailMap.report.defaultTargetId`, `detailMap.report.reportTargets[].headline`, `detailMap.report.reportTargets[].summary`, `detailMap.report.reportTargets[].relationshipAnalysis`, and the existing static `reportSections`

- [ ] **Step 1: Write the failing structure test for report data**

```js
test('emotion report data exposes per-target conclusion fields', () => {
  const settingsScreen = read('components/settings/SettingsScreen.vue');

  assert.equal(settingsScreen.includes("defaultTargetId: 'target-lin'"), true);
  assert.equal(settingsScreen.includes('reportTargets: ['), true);
  assert.equal(settingsScreen.includes('headline:'), true);
  assert.equal(settingsScreen.includes('summary:'), true);
  assert.equal(settingsScreen.includes('relationshipAnalysis:'), true);
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run:

```bash
node --test tests/uniapp-structure.spec.mjs --test-name-pattern="emotion report data exposes per-target conclusion fields"
```

Expected: `FAIL` with one or more `false !== true` assertions because the current report targets do not include conclusion fields.

- [ ] **Step 3: Add the conclusion-first data fields in `SettingsScreen.vue`**

```js
report: {
  key: 'report',
  title: '情感分析报告',
  summary: '把与你和目标人物相关的核心判断浓缩成两段关键信息，帮助你快速把握关系现状。',
  defaultTargetId: 'target-lin',
  reportTargets: [
    {
      id: 'target-lin',
      name: '小林',
      relationshipLabel: '暧昧对象',
      headline: '当前更适合低压沟通，不适合追问结果',
      summary: '先稳定互动节奏，再观察回应质量，会比直接要答案更有效。',
      relationshipAnalysis: '小林在关系中更偏向先观察后表达，对情绪压力比较敏感，因此会优先维持自己的节奏感。他对你并不是没有回应，而是更需要在低压力、不被紧逼的互动下，才更容易稳定释放好感和真实想法。',
    },
    {
      id: 'target-zhou',
      name: '阿周',
      relationshipLabel: '前任',
      headline: '先恢复稳定互动，再讨论关系定义',
      summary: '边界清晰和节奏可预期，比情绪推动更能让关系重新靠近。',
      relationshipAnalysis: '阿周在这段关系中更在意边界能否清晰，如果互动里带有追问或立刻要结果的压力，他会先退后以保持安全感。你们的关键不在于谁先表态，而在于能否先恢复稳定、可预期的沟通节奏，让对方看到你的情绪和行动都更平稳。',
    },
    {
      id: 'target-xu',
      name: '小许',
      relationshipLabel: '相亲对象',
      headline: '先看持续回应，再决定是否加速推进',
      summary: '让互动自然累积，比过早定义关系更容易看清对方投入度。',
      relationshipAnalysis: '小许更关注相处过程中的舒适度和信息是否对等，如果你能给到清晰、具体、不繁琐的反馈，他对关系的投入会提升得更快。目前比起立刻定义关系，更适合先通过稳定频率的互动来确认他是否持续感到安心和被理解。',
    },
  ],
  reportSections: [
    {
      title: '我的性格分析',
      body: '你在关系里更偏向敏感细腻和高投入型，会更在意回应速度、情绪确认和对方是否真正理解你的需求。\n\n你擅长觉察细节，也容易因为对方态度变化而反复思考，因此在亲密关系里既有共情力，也更容易在不确定时感到消耗。',
    },
    {
      title: '目标人物的关系分析',
      body: '',
    },
  ],
},
```

- [ ] **Step 4: Run the targeted test to verify it passes**

Run:

```bash
node --test tests/uniapp-structure.spec.mjs --test-name-pattern="emotion report data exposes per-target conclusion fields"
```

Expected: `PASS` for the new data-shape test.

- [ ] **Step 5: Commit**

```bash
git add tests/uniapp-structure.spec.mjs components/settings/SettingsScreen.vue
git commit -m "feat: add conclusion-first emotion report data"
```

### Task 2: Redesign the report detail layout around current target and core judgment

**Files:**
- Modify: `D:/work3/emotion AI/emotion-frontend/tests/uniapp-structure.spec.mjs`
- Modify: `D:/work3/emotion AI/emotion-frontend/components/settings/SettingsDetailScreen.vue`
- Test: `D:/work3/emotion AI/emotion-frontend/tests/uniapp-structure.spec.mjs`

**Interfaces:**
- Consumes: `props.detail.defaultTargetId`, `props.detail.reportTargets`, `props.detail.reportSections`
- Produces: `activeReportTargetId`, `activeReportTarget`, `reportCards`, `selectReportTarget(targetId)`, `report-person-card`, `report-conclusion-card`, and the report-specific render path

- [ ] **Step 1: Update the failing structure test for the new report hierarchy**

```js
test('emotion report detail renders a target card, conclusion card, and two analysis cards', () => {
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(detailScreen.includes('class="report-person-card"'), true);
  assert.equal(detailScreen.includes('class="report-conclusion-card"'), true);
  assert.equal(detailScreen.includes('class="report-target-switcher"'), true);
  assert.equal(detailScreen.includes('v-for="target in detail.reportTargets"'), true);
  assert.equal(detailScreen.includes('activeReportTarget.value?.headline'), true);
  assert.equal(detailScreen.includes('activeReportTarget.value?.summary'), true);
  assert.equal(detailScreen.includes('activeReportTarget.value?.relationshipAnalysis'), true);
  assert.equal(detailScreen.includes('class="report-summary-card"'), false);
  assert.equal(detailScreen.includes('v-for="section in reportCards"'), true);
});
```

- [ ] **Step 2: Run the targeted report test to verify it fails**

Run:

```bash
node --test tests/uniapp-structure.spec.mjs --test-name-pattern="emotion report detail renders"
```

Expected: `FAIL` because the current detail screen does not yet render `report-person-card` or `report-conclusion-card`.

- [ ] **Step 3: Replace the report branch in `SettingsDetailScreen.vue` with the conclusion-first layout**

```vue
const activeReportTargetId = ref('')
const activeReportTarget = computed(() => (
  props.detail.reportTargets?.find((target) => target.id === activeReportTargetId.value)
  || props.detail.reportTargets?.[0]
  || null
))
const reportCards = computed(() => (
  props.detail.reportSections?.map((section) => {
    if (section.title === '目标人物的关系分析') {
      return {
        ...section,
        body: activeReportTarget.value?.relationshipAnalysis || '',
      }
    }

    return section
  }) || []
))

watch(
  () => props.detail,
  (detail) => {
    if (detail?.key !== 'report') {
      activeReportTargetId.value = ''
      return
    }

    activeReportTargetId.value = detail.defaultTargetId || detail.reportTargets?.[0]?.id || ''
  },
  { immediate: true },
)

const selectReportTarget = (targetId) => {
  activeReportTargetId.value = targetId
}
```

```vue
<view v-if="isReportDetail" class="report-detail">
  <view class="report-person-card">
    <view class="report-person-card__top">
      <text class="report-person-card__eyebrow">当前分析对象</text>
      <text class="report-person-card__title">{{ activeReportTarget?.name }}</text>
      <text class="report-person-card__meta">{{ activeReportTarget?.relationshipLabel }}</text>
    </view>

    <view class="report-target-switcher">
      <view
        v-for="target in detail.reportTargets"
        :key="target.id"
        class="report-target-chip"
        :class="{ 'report-target-chip--active': target.id === activeReportTargetId }"
        hover-class="report-target-chip--pressed"
        @tap="selectReportTarget(target.id)"
      >
        <text class="report-target-chip__name">{{ target.name }}</text>
        <text class="report-target-chip__meta">{{ target.relationshipLabel }}</text>
      </view>
    </view>
  </view>

  <view class="report-conclusion-card">
    <text class="report-conclusion-card__eyebrow">当前结论</text>
    <text class="report-conclusion-card__headline">{{ activeReportTarget?.headline }}</text>
    <text class="report-conclusion-card__summary">{{ activeReportTarget?.summary }}</text>
  </view>

  <view class="report-section-list">
    <view v-for="section in reportCards" :key="section.title" class="report-section-card">
      <text class="report-section-card__title">{{ section.title }}</text>
      <text class="report-section-card__body">{{ section.body }}</text>
    </view>
  </view>
</view>
```

- [ ] **Step 4: Apply the new visual hierarchy in the report styles**

```scss
.report-person-card,
.report-conclusion-card,
.report-section-card {
  box-shadow: var(--shadow-soft);
}

.report-person-card {
  margin-top: 28rpx;
  padding: 30rpx 30rpx 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 250, 241, 0.94);
  border: 1px solid rgba(214, 168, 118, 0.28);
}

.report-conclusion-card {
  margin-top: 18rpx;
  padding: 32rpx 30rpx;
  border-radius: 34rpx;
  background: linear-gradient(135deg, #fff2dc 0%, #fde3c7 100%);
  border: 1px solid rgba(196, 127, 64, 0.18);
}

.report-conclusion-card__headline {
  margin-top: 14rpx;
  color: #6f3f11;
  font-size: 28px;
  font-weight: 900;
  line-height: 1.18;
  text-wrap: balance;
}

.report-conclusion-card__summary {
  margin-top: 16rpx;
  color: rgba(99, 67, 36, 0.88);
  font-size: 14px;
  line-height: 1.6;
}

.report-target-switcher {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 22rpx;
}

.report-target-chip--active {
  transform: translateY(-2rpx);
  border-color: rgba(196, 127, 64, 0.52);
  background: rgba(255, 243, 225, 0.98);
}
```

- [ ] **Step 5: Run the full verification suite**

Run:

```bash
npm run check:uniapp
```

Expected: `PASS` with `46/46` tests green and no report-layout regressions.

- [ ] **Step 6: Commit**

```bash
git add tests/uniapp-structure.spec.mjs components/settings/SettingsDetailScreen.vue
git commit -m "feat: redesign emotion report detail hierarchy"
```

## Self-Review

- Spec coverage: the plan covers the current target card, the core judgment card, dynamic target switching, the two analysis cards, and the report-only layout boundary.
- Placeholder scan: no `TODO`, `TBD`, or implied “fill this later” steps remain.
- Type consistency: the plan uses one stable target interface across both files: `id`, `name`, `relationshipLabel`, `headline`, `summary`, and `relationshipAnalysis`.
