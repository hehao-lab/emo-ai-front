# 情感分析报告双模块设计

## 目标

将“情感分析报告”从当前的通用设置详情布局，调整为专门的报告页内容，只保留两部分：

- 我的性格分析
- 目标人物的关系分析

## 约束

- 保持当前设置页与详情页的单页切换模式不变。
- 不新增新路由，不使用页面跳转 API。
- 不影响“心情日记”和“历史咨询”的现有专用渲染。
- 报告页要替换掉当前通用 `sections + actions` 的旧内容，而不是叠加。

## 实现思路

### `components/settings/SettingsScreen.vue`

- 将 `report` 配置改为仅服务这两个报告模块的数据结构。
- 保留 `title` 和 `summary` 作为报告头部信息。
- 新增专门的 `reportSections` 数组，承载两个分析模块的标题与正文。

### `components/settings/SettingsDetailScreen.vue`

- 新增 `isReportDetail` 计算属性。
- 对 `report` 增加专门渲染分支：
  - 顶部保留标题和摘要卡片
  - 主体渲染两个报告模块
- 让 `report` 不再落入通用 `detail-section-list` 和 `detail-actions` 渲染逻辑。

## 测试要求

- 更新结构测试，确认 `report` 数据结构和专门渲染分支存在。
- 运行 `npm run check:uniapp` 验证。
