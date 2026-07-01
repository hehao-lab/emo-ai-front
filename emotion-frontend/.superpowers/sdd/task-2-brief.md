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
    if (section.title === '目标人物的关系分�?) {
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
- Placeholder scan: no `TODO`, `TBD`, or implied “fill this later�?steps remain.
- Type consistency: the plan uses one stable target interface across both files: `id`, `name`, `relationshipLabel`, `headline`, `summary`, and `relationshipAnalysis`.
