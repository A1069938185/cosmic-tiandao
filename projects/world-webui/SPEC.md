# 世界可视化控制台 — 设计方案

> 项目代号：WorldSight（世界之眼）
> 版本：v0.1 草案

---

## 一、设计目标

通过 Web 界面实现：
1. **世界可视化** — 地图、关系网络、熵值仪表盘
2. **操作控制** — 世界创建、角色生成、推演执行、熵变注入
3. **实时监控** — 子代理运行状态、推演进度、日志流
4. **完全可拓展** — 支持多世界、多子代理、多插件

---

## 二、架构概览

```
┌─────────────────────────────────────────────────────────┐
│                     Web UI (React)                      │
│   Dashboard · Map · Characters · Simulation · Logs    │
└──────────────────────┬────────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼────────────────────────────────┐
│               World Controller (Node.js)               │
│   REST API · Session Manager · Event Emitter           │
└──────┬──────────────────┬──────────────────┬──────────┘
       │                  │                  │
┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│  OpenClaw   │   │ File System │   │  Message    │
│  Gateway    │   │ World Data  │   │  Queue      │
│ (sessions)  │   │  (JSON/MD)  │   │  (Redis)    │
└──────┬──────┘   └─────────────┘   └─────────────┘
       │
┌──────▼──────────────────────────────────────────────┐
│           Sub-Agents (Existing Infrastructure)        │
│  常羲 · 女娲 · 命匠 · 熵君 · 蓐收 · 待铸造 ...      │
└─────────────────────────────────────────────────────┘
```

**核心理念：World Controller 作为薄中间层，连接 Web UI 和 OpenClaw 子代理系统。不重复造轮子，复用一切现有基础设施。**

---

## 三、技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 前端框架 | **React 18 + TypeScript** | 组件化、生态成熟、D3.js 集成好 |
| 构建工具 | **Vite** | 快速 HMR，开发体验好 |
| 可视化 | **D3.js** | 关系图、熵值曲线、地理地图 |
| 流程图 | **React Flow** | 叙事弧光可视化、状态机展示 |
| UI 组件库 | **shadcn/ui** (Radix) | 可定制、无版权顾虑 |
| 后端 | **Node.js + Fastify** | 轻量、高性能、TypeScript 友好 |
| 实时通信 | **WebSocket (ws)** | 推演实时日志流 |
| 持久化 | **File System** | 复用现有 `worlds/` 结构 |
| 可选队列 | **Redis + Bull** | 高并发时解耦子代理调用（初期可省略） |

---

## 四、模块设计

### 4.1 World Controller（后端核心）

```
world-controller/
├── src/
│   ├── index.ts              # 入口，初始化 Fastify + WebSocket
│   ├── routes/
│   │   ├── world.ts          # 世界 CRUD
│   │   ├── character.ts       # 角色管理
│   │   ├── simulation.ts      # 推演控制（召唤常羲）
│   │   ├── agent.ts           # 子代理直接调用
│   │   └── entropy.ts         # 熵变管理（召唤熵君）
│   ├── services/
│   │   ├── openclaw.ts        # OpenClaw Gateway 通信封装
│   │   ├── worldfs.ts          # 文件系统读写（复用现有结构）
│   │   ├── session.ts          # 子代理 Session 管理
│   │   └── plugin.ts           # 插件系统
│   ├── types/
│   │   └── world.d.ts          # 共享类型定义
│   └── plugins/               # 可插拔插件目录
│       └── 示例插件...
├── world-controller.config.ts
└── package.json
```

**OpenClaw 通信协议：**

World Controller 通过两种方式和 OpenClaw 交互：

```
方式 A：sessions_spawn（推荐，用于召唤子代理）
→ 调用 OpenClaw Gateway API
→ 传入子代理 SOUL.md + 任务参数
→ 获取 session_key，通过 WebSocket 监听进度

方式 B：直接读写 worlds/ 目录
→ 子代理执行后的产物（character档案、编年记录等）
→ World Controller 直接读取并在 UI 渲染
```

### 4.2 Web UI（前端）

```
world-webui/
├── src/
│   ├── main.tsx
│   ├── App.tsx                # 路由 + 全局状态
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx      # 世界总览仪表盘
│   │   ├── WorldMap.tsx        # 地理可视化
│   │   ├── Characters.tsx      # 角色网络图
│   │   ├── Simulation.tsx      # 推演控制台
│   │   ├── Chronicles.tsx      # 编年记录浏览
│   │   ├── Entropy.tsx         # 熵变监控面板
│   │   ├── WorldBuilder.tsx    # 新世界创建
│   │   └── Settings.tsx        # 系统设置
│   │
│   ├── components/
│   │   ├── world/
│   │   │   ├── EntropyGauge.tsx    # 熵值仪表盘（D3仪表盘）
│   │   │   ├── TimelineBar.tsx     # 世界时间轴
│   │   │   └── WorldStateCard.tsx  # 世界状态卡片
│   │   ├── characters/
│   │   │   ├── CharacterGraph.tsx  # 关系网络图（D3 force-directed）
│   │   │   ├── CharacterCard.tsx   # 角色卡片
│   │   │   └── PersonalityChart.tsx # 人格雷达图
│   │   ├── simulation/
│   │   │   ├── SimulationControl.tsx  # 推演启动/暂停
│   │   │   ├── DayProgress.tsx        # 逐日进度
│   │   │   └── AgentLogStream.tsx     # 子代理日志流
│   │   ├── world-builder/
│   │   │   ├── WorldWizard.tsx    # 世界创建向导
│   │   │   ├── ConstitutionEditor.tsx # 宪法编辑器
│   │   │   └── LayerDesigner.tsx  # 社会双层结构设计器
│   │   └── ui/                   # 通用 UI 组件
│   │
│   ├── hooks/
│   │   ├── useWorld.ts          # 世界状态 Hook
│   │   ├── useSimulation.ts     # 推演状态 Hook
│   │   └── useWebSocket.ts      # WebSocket Hook
│   │
│   ├── store/
│   │   └── worldStore.ts        # Zustand 全局状态
│   │
│   └── lib/
│       ├── api.ts               # 后端 API 封装
│       └── worldParser.ts        # 解析 worlds/ JSON/MD
│
├── world-webui.config.ts
└── package.json
```

---

## 五、核心页面功能

### 5.1 Dashboard（仪表盘）

```
┌─────────────────────────────────────────────────────────┐
│  🌐 冰山效应的世界          GL 172年3月11日   [熵值]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 可见层   │ │ 不可见层  │ │ 活跃角色 │ │ 熵变事件 │   │
│  │ 熵值 5   │ │ 熵值 2   │ │   6      │ │   1      │   │
│  │ ████░░░ │ │ ██░░░░░ │ │          │ │          │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│  ┌─────────────────────┐ ┌─────────────────────────┐   │
│  │   角色关系网络       │ │    叙事弧光进度          │   │
│  │   [D3 力导向图]     │ │    冰山初触 ████░░ 80%   │   │
│  │                     │ │    第二幕即将触发         │   │
│  └─────────────────────┘ └─────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 最新事件 (GL 172年3月)                           │   │
│  │ · 3/11 常羲推演完成 · 5天简报已生成              │   │
│  │ · 3/11 熵变「回声」第一道痕迹触发                │   │
│  │ · 3/9  秦昭发现被监控，开始调查                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [🚀 开始新推演]   [➕ 创建角色]   [💥 注入熵变]       │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Characters（角色网络）

- **D3 力导向图**：节点 = 角色，边 = 关系（可见层实线 / 不可见层虚线）
- **点击节点**：侧边抽屉展示角色完整档案
- **筛选器**：按层级（可见/不可见/两层之间）筛选
- **时间回溯**：拖动时间轴，查看某时间点的关系快照

### 5.3 Simulation Control（推演控制台）

```
┌─────────────────────────────────────────────────────────┐
│  常羲 · 推演控制台                          [状态: 待命] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  推演天数：[  7  ] 天    详细程度：[ 里程碑 ▼  ]       │
│                                                         │
│  起始时间：GL 172年3月12日                              │
│                                                         │
│  [ ▶ 开始推演 ]                                         │
│                                                         │
│  ── 实时日志 ──────────────────────────────              │
│  [常羲] 准备阶段：读取世界宪法...完成                    │
│  [常羲] 加载角色档案：陈宇轩、沈璃、秦昭...完成          │
│  [常羲] 开始逐日推演...                                  │
│  [常羲] 第1天 · 3月12日：每日简报生成中...              │
│  [熵君] ⚠ 检测到熵变信号：信息获取 (陈宇轩)             │
│  [常羲] 第1天深入场景展开...                             │
│  ...                                                    │
│                                                         │
│  ── 推演进度 ──────────────────────────────             │
│  ████████░░░░░░░░░░░░░░░  第2天 / 共7天               │
└─────────────────────────────────────────────────────────┘
```

### 5.4 World Builder（新世界创建向导）

**Step 1：基础设定**
- 世界名称、架空类型（奇幻/科幻/架空历史...）
- 科技水平、故事尺度、时间起点

**Step 2：核心主题**
- 谎言与真相（双层社会结构设计器）
- 主题冲突配置

**Step 3：宪法生成**
- 基于模板生成 `world.md`
- 支持手动编辑

**Step 4：基础设施**
- 自动创建 `characters/`、`geography/`、`narratives/` 等目录
- 召唤女娲生成首批角色

---

## 六、数据流设计

### 6.1 推演执行流程（完整数据流）

```
用户点击"开始推演"
       ↓
Web UI → POST /api/simulation/start
       ↓
World Controller → sessions_spawn(常羲)
       ↓
常羲 session 运行 → 读取 worlds/[world-id]/
       ↓
每日推演输出 → 追加写入 chronicles/GL-YYYY-MM.md
       ↓
同时 → WebSocket 推送实时日志到前端
       ↓
推演完成 → 更新 _state.md
       ↓
World Controller → 通知女娲（WebSocket / 异步）
       ↓
前端刷新 Dashboard（熵值、角色状态、弧光进度）
```

### 6.2 熵变注入流程

```
用户选择"注入熵变" → 选择熵变类型 → 配置参数
       ↓
Web UI → POST /api/entropy/inject
       ↓
World Controller → sessions_spawn(熵君)
       ↓
熵君执行 → 输出熵变报告 → 写入 entropy/ent_xxx/report.md
       ↓
World Controller → 推送熵变事件卡片到前端
       ↓
Dashboard 熵值仪表盘实时刷新
```

---

## 七、API 设计

### 基础结构

```
Base URL: http://localhost:3001/api

响应格式：
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "...", "agent": "常羲" }
}

错误格式：
{
  "success": false,
  "error": { "code": "AGENT_TIMEOUT", "message": "..." }
}
```

### 核心端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/worlds` | 列出所有世界 |
| POST | `/worlds` | 创建新世界 |
| GET | `/worlds/:id` | 获取世界状态 |
| PATCH | `/worlds/:id/state` | 更新世界状态 |
| GET | `/worlds/:id/characters` | 列出所有角色 |
| GET | `/worlds/:id/characters/:cid` | 获取角色完整档案 |
| POST | `/worlds/:id/characters` | 召唤女娲创造角色 |
| GET | `/worlds/:id/chronicles` | 获取编年记录 |
| POST | `/worlds/:id/simulate` | 召唤常羲开始推演 |
| GET | `/worlds/:id/simulate/stream` | WebSocket：推演实时日志 |
| POST | `/worlds/:id/entropy` | 召唤熵君注入熵变 |
| GET | `/agents` | 列出所有子代理状态 |
| POST | `/agents/:id/summon` | 召唤指定子代理 |

---

## 八、可拓展性设计

### 8.1 多世界并行

```
world-controller 支持同时运行多个世界。
每个世界有独立的工作目录和 session 池。

世界隔离：
- 文件系统：worlds/[world-id]/ 完全隔离
- 子代理：同一个子代理可同时在不同世界运行（独立 session）
- WebSocket：每个世界有独立的 channel
```

### 8.2 插件系统

```
plugins/
├── custom-agent/      # 自定义子代理类型
├── visualization/     # 自定义可视化组件
└── generator/         # 自定义生成器（角色模板、世界模板）

插件接口（plugin.ts）：
interface WorldPlugin {
  name: string
  version: string
  onAgentSpawn?: (agent: AgentContext) => void
  onSimulationTick?: (tick: TickContext) => void
  customRoutes?: FastifyRoute[]
  customComponents?: ReactComponent[]
}
```

### 8.3 世界模板系统

```
templates/
├── 冰山效应/       # 谎言与真相主题模板
├── 赛博朋克/       # 科技与控制主题
└── 奇幻纪元/       # 魔法与王国主题

每个模板包含：
- world.md 宪法模板
- characters/_templates/ 角色模板
- narratives/ 预设弧光结构
- geography/ 预设地理
```

### 8.4 子代理可拓展

现有子代理通过 SOUL.md 扩展功能，无需修改 World Controller 代码。
新增子代理只需：
1. 在 `skills/XXX-forge/` 创建 SKILL.md
2. 在 `agents/XXX/` 创建 SOUL.md + IDENTITY.md
3. 更新 `subagents.md`
4. Web UI 的 agent 下拉菜单自动发现新子代理

---

## 九、开发阶段划分

### Phase 1：最小可用版本（MVP）
- [ ] World Controller 骨架（Fastify + WebSocket）
- [ ] 世界列表 + Dashboard
- [ ] 角色档案浏览（读取现有 JSON）
- [ ] 常羲推演触发（调用 OpenClaw）
- [ ] 推演日志实时流（WebSocket）
- [ ] 熵值仪表盘（静态渲染）

**预计工作量**：2-3 周

### Phase 2：可视化增强
- [ ] D3.js 角色关系网络图
- [ ] 编年记录时间轴浏览
- [ ] 熵变事件卡片
- [ ] 世界地图地理可视化

**预计工作量**：2-3 周

### Phase 3：完整控制台
- [ ] 世界创建向导
- [ ] 女娲召唤（角色生成）
- [ ] 熵君注入（熵变控制）
- [ ] 命匠弧光管理
- [ ] 子代理状态监控

**预计工作量**：3-4 周

### Phase 4：可拓展性
- [ ] 插件系统
- [ ] 世界模板系统
- [ ] 多世界并行支持
- [ ] 移动端适配

**预计工作量**：2-3 周

---

## 十、目录结构（完整）

```
C:\Users\OseasyVM\.qclaw\workspace-agent-7d863614\
├── agents/                    # 现有子代理（通用工具）
│   ├── 女娲/
│   ├── 命匠/
│   ├── 熵君/
│   ├── 常羲/
│   └── 蓐收/
│
├── worlds/                    # 现有世界数据
│   └── 冰山效应的世界/
│       ├── world.md
│       ├── characters/
│       ├── narratives/
│       ├── entropy/
│       ├── geography/
│       └── chronicles/
│
├── skills/                    # 现有铸造术
│   ├── nvwa-forge/
│   ├── mingjiang-forge/
│   ├── shangjun-forge/
│   └── 常羲-forge/
│
├── projects/                  # 新项目目录
│   └── world-webui/           # Web 可视化控制台项目
│       ├── world-controller/ # 后端（Node.js）
│       │   ├── src/
│       │   ├── plugins/
│       │   ├── templates/
│       │   └── package.json
│       │
│       └── world-webui/       # 前端（React）
│           ├── src/
│           │   ├── pages/
│           │   ├── components/
│           │   ├── hooks/
│           │   └── store/
│           ├── public/
│           └── package.json
│
└── subagents.md               # 现有子代理清单
```

---

## 十一、OpenClaw 集成方案

### 方案选择：Gateway API 直连

World Controller 直接调用 OpenClaw Gateway（已内置 HTTP Server）。

```
World Controller           OpenClaw Gateway
    │                            │
    │── sessions_spawn ──────────→ 启动子代理 session
    │                            │
    │←── session_key ────────────  │
    │                            │
    │── sessions_history ─────────→ 读取 session 历史
    │                            │
    │←── 实时输出 ────────────────  WebSocket 推送
    │                            │
    │── sessions_send ────────────→ 向 session 发送消息
```

**优点**：无需额外 Agent Runtime，复用 OpenClaw 已有能力
**缺点**：受限于 OpenClaw 的 session 管理能力

---

## 十二、优先实现顺序建议

```
第一步：搭建项目结构（Vite + Fastify 骨架）
       ↓
第二步：实现 world-controller → OpenClaw 的通信封装
       ↓
第三步：Dashboard + 世界状态读取（最小 UI）
       ↓
第四步：常羲推演触发 + WebSocket 日志流
       ↓
第五步：角色档案浏览 + D3 关系图
       ↓
第六步：世界创建向导
       ↓
第七步：插件系统 + 多世界支持
```

---

*本方案为初稿，请审阅后决定实施范围和优先级。*
