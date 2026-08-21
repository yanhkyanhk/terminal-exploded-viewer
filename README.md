# AXON M1 · 终端产品 3D 爆炸图

一个基于浏览器的三级 3D 产品结构查看器。用户可以从整机进入模组层，再进入单个模组的零件层，并严格逐级返回。

## 环境要求

- Node.js 22.13 或更高版本
- 支持 WebGL 的最新版 Chrome、Edge、Firefox 或 Safari
- 推荐开启硬件加速

## 安装与运行

```bash
npm install
npm run dev
```

开发服务默认运行在 `http://localhost:3000`。

## 验证与构建

```bash
npm test
npx tsc --noEmit
npm run build
```

也可以使用 `npm run check` 连续执行测试和生产构建。

## 交互方式

- 拖拽：旋转视角
- 滚轮 / 双指：缩放
- 右键拖拽：平移
- 点击整机：展开全部功能模组
- 点击模组：仅展开该模组的零件
- 点击零件：查看名称、所属模组、功能和材料
- `Esc`、面包屑或“返回上层”：逐级返回
- “复位”：从任意状态恢复整机视图
- 爆炸距离滑块：连续调整当前爆炸距离

## 技术选型

- React 19 + TypeScript
- Vite / vinext
- Three.js + React Three Fiber + Drei
- Zustand：只保存业务 ID、层级状态和动画数值
- GSAP：可逆爆炸进度和相机缓动
- Vitest：状态机、变换计算和场景映射测试

## 目录结构

```text
app/
├── controller/   # 交互命令与动画编排
├── domain/       # Product / Module / Part 纯领域模型
├── explosion/    # 无副作用的爆炸位置计算
├── scene/        # R3F 场景、相机与 SceneRegistry
├── state/        # 有限状态机与 Zustand Store
├── viewer/       # 页面交互 UI
├── globals.css
├── layout.tsx
└── page.tsx
tests/            # 状态、变换与映射测试
worker/           # Sites / Cloudflare Worker 入口
```

## 架构说明

领域模型、Three.js 场景对象和 Viewer 状态相互分离：

1. `domain/product.ts` 定义稳定的业务 ID、装配坐标和爆炸配置，不导入 Three.js。
2. `SceneRegistry` 单独管理业务节点与运行时 `Object3D` 的映射；Zustand 不保存 Mesh。
3. `transitionViewer` 只允许 `PRODUCT → MODULE → PART` 以及对应的逐级返回。
4. 动画始终用不可变装配坐标、目标坐标和 `progress` 计算当前位置，不使用累加位移，因此重复往返不会漂移。
5. 动画过程中导航命令被锁定；每次变换带 token，过期回调不能污染新状态。
6. 进入零件层时只有当前模组的 Parts 展开，其他模组保持模组层爆炸状态。
7. 相机位置与 OrbitControls target 同步缓动，保证当前结构始终位于视野内。

## 模型来源与 GLB 接入

首版使用代码内置的程序化概念机模型，不包含第三方模型或纹理，仓库可以独立运行。`app/domain/model-source.ts` 保留了 `procedural | glb` 模型来源接口；接入真实 GLB 时，应在加载完成后通过 `SceneRegistry` 注册业务节点，并保留现有状态机、爆炸计算与错误/重试流程。

## 响应式与无障碍

- 桌面端采用全屏 3D 舞台、右侧信息面板和底部控制坞。
- 窄屏将信息面板下沉，并减少常驻标签与辅助提示。
- 提供跳过 3D 的结构列表入口、键盘焦点、`aria-live` 状态播报和减少动态效果选项。
- WebGL 不可用或场景初始化失败时显示明确错误信息和重试入口。
