# 重要记录交互设计

## 目标

补齐侧边栏“重要记录”的新增、展示、查看、编辑、删除闭环，保持当前 uni-app 单页壳层结构，不引入新的页面跳转。

## 约束

- 继续使用 `pages/index/index.vue` 作为单页状态壳层。
- 继续使用 `HomeSideDrawer.vue` 展示侧边栏入口与记录摘要。
- 继续使用 `HomeFeatureScreen.vue` 承载新增、查看、编辑页面态。
- 不使用 `uni.navigateTo`、`uni.redirectTo`、`uni.reLaunch`。

## 记录字段

每条重要记录包含以下字段：

- `title`
- `recordTime`
- `eventDescription`
- `resolution`
- `concernPoint`
- `satisfaction`
- `createdAt`
- `updatedAt`
- `id`

## 交互规则

- 当侧边栏暂无重要记录时，点击“重要记录”模块任意位置进入新增记录页。
- 当侧边栏已有重要记录时，模块空白区域不响应。
- 当侧边栏已有重要记录时，点击某条记录进入查看页。
- 当侧边栏已有重要记录时，底部“新增记录”按钮进入新增页。
- 新增成功后，记录立即显示在侧边栏重要记录区域。
- 查看页支持进入编辑。
- 查看页支持删除当前记录。
- 编辑保存后，侧边栏与详情页同步更新。

## 组件职责

### `pages/index/index.vue`

- 持有重要记录数组。
- 持有当前查看中的重要记录 id。
- 负责创建、更新、删除记录。
- 负责切换 `important-record-create`、`important-record-detail`、`important-record-edit` 页面态。

### `components/home/HomeSideDrawer.vue`

- 根据 `importantRecords` 是否为空切换空态和列表态。
- 空态点击整块区域触发新增。
- 列表态点击记录触发查看。
- 列表态底部按钮触发新增。

### `components/home/HomeFeatureScreen.vue`

- 新增页渲染可编辑表单。
- 查看页渲染只读详情。
- 编辑页复用表单并回填当前记录。
- 通过事件把保存、编辑、删除动作抛回壳层。

## 测试要求

- 结构测试覆盖壳层状态、侧边栏事件绑定、重要记录页面态和 CRUD 事件连线。
- 最终运行 `npm run check:uniapp` 验证。
