# 宇宙天道 · 产品设计文档

> 版本：v3.0
> 日期：2026-04-14
> 状态：实盘确认版

---

## 核心认知

**冰山效应的世界 = 测试世界，不是产品本身。**

框架与世界的边界：
- `agents/` → 框架层，通用，与具体世界无关
- `skills/` → 世界生成术，定义如何创建某类世界
- `worlds/` → 世界层，框架的产出目标

---

## 一、产品定位

通用多智能体叙事世界引擎——通过子代理协同，为任意虚构世界提供持续的推演、演化与熵变能力。

---

## 二、系统架构

```
agents/           框架层（5个，已激活）
├── 盘古/         世界创造与宪法起草
├── 女娲/         角色铸造与档案维护
├── 常羲/         时间推进与编年存档
├── 命匠/         叙事弧光编排
└── 熵君/         熵变事件设计

skills/           世界生成术（5个）
├── pangu-forge/       盘古铸造术
├── nvwa-forge/        女娲铸造术
├── mingjiang-forge/   命匠铸造术
├── shangjun-forge/    熵君铸造术
└── changxi-forge/     常羲铸造术

worlds/            世界层
└── 冰山效应的世界/  测试世界
    ├── world.md      世界宪法
    ├── _state.md     当前状态
    ├── characters/   6角色档案
    ├── geography/    3个地理节点
    ├── narratives/   叙事弧光
    ├── entropy/      熵变事件
    └── chronicles/   编年记录
```

---

## 三、子代理（已激活 4个）

| 代号 | 职责 | 文件 | 状态 |
|------|------|------|------|
| 女娲 | 角色铸造、档案维护 | agents/女娲/SOUL.md + IDENTITY.md | ✅ |
| 常羲 | 时间推进、编年存档 | agents/常羲/SOUL.md + IDENTITY.md | ✅ |
| 命匠 | 叙事弧光、因果网络 | agents/命匠/SOUL.md + IDENTITY.md | ✅ |
| 熵君 | 熵变事件、熵值管理 | agents/熵君/SOUL.md + IDENTITY.md | ✅ |

---

## 四、世界生成术（5个）

| 名称 | 对应代理 | 状态 |
|------|---------|------|
| pangu-forge | 盘古 | ✅ |
| nvwa-forge | 女娲 | ✅ |
| mingjiang-forge | 命匠 | ✅ |
| shangjun-forge | 熵君 | ✅ |
| changxi-forge | 常羲 | ✅ |

---

## 五、世界数据层（冰山效应的世界）

### 目录结构

```
冰山效应的世界/
├── world.md        ✅ 世界宪法
├── _state.md       ✅ 当前状态
├── characters/    ✅ 6个角色
├── geography/     ✅ 3个地理节点
├── narratives/    ✅ 叙事弧光
├── entropy/       ✅ 熵变事件
└── chronicles/    ✅ 编年记录
```

### 角色档案完整度

| 角色 | 完整度 | 文件状态 |
|------|--------|---------|
| bridge（陆深） | 高 | identity/personality/profile/timeline/possessions/relationships/fate/existence |
| chen-yuxuan（陈宇轩） | 高 | identity/personality/profile/timeline/possessions/relationships/fate/existence |
| shen-li（沈璃） | 高 | identity/personality/profile/timeline/possessions/relationships/fate/existence |
| ghost（林镜） | 中 | identity/personality/profile/timeline |
| qin-zhao（秦昭） | 中 | identity/personality/profile |
| wraith（幽灵/Wraith） | 低 | identity/profile |

### 地理节点（3个）

- abyssport
- mistfall
- starfire

### 叙事弧光

- iceberg-first-contact（第一幕：触碰）

### 熵变事件

- ent_001「回声」（幽灵数据包，已触发）

### 编年记录

- GL-172-03.md

---

## 六、角色档案标准（女娲规范）

profile.md 5字段标准：
- 基础信息：ID / 名称 / 性别 / 年龄 / 职业
- 性格标签：3-5个关键词
- 一句话介绍：≤50字
- 详细介绍：背景+处境+矛盾，3-5段
- 当前状态：心理/处境/关键物品/活跃事件

---

## 七、熵变哲学

**熵变是裂纹，不是爆炸。** 让真相通过异常形式自然浮现，不强制推进剧情。

- 熵值分级：0（冻结）→ 10（剧变）
- 熵变代号：ent_XXX
- 无 world.md 不注入熵变

---

## 八、项目状态

### 已完成

- [x] 天道主代理（SOUL/IDENTITY/MEMORY/AGENTS）
- [x] 盘古铸造完成（pangu-forge + agents/盘古/SOUL + IDENTITY）
- [x] 女娲 + 角色档案标准化（profile.md）
- [x] 常羲（推演之神）+ 规范化铸造流程
- [x] 冰山效应的世界完整数据层
- [x] 6个角色档案（含profile.md）
- [x] 盘古 + 世界创造流程规范化
- [x] CALL-GUIDE.md（含盘古章节）
- [x] PRODUCT.md 实盘确认版（v3.0）

### 待完成

- [ ] 补全 ghost 角色档案（timeline/possessions/relationships/fate/existence）
- [ ] 补全 qin-zhao 角色档案（timeline/possessions/relationships/fate/existence）
- [ ] 补全 wraith 角色档案（personality/timeline/possessions/relationships/fate/existence）
- [ ] 熵君正式版完善

---

## 九、设计原则

1. 框架与内容分离 — agents/ 通用，worlds/ 独立
2. 只记录已实现的内容
3. 无 world.md 不熵变
4. 子代理不主动，只响应召唤
5. 操作前必巡检

---

*本文档为实盘确认版，2026-04-14*
响应召唤
5. 操作前必巡检

---

*本文档为实盘确认版，2026-04-14*
 操作前必巡检

---

*本文档为实盘确认版，2026-04-14*
