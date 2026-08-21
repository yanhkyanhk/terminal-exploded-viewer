"use client";

import { Canvas } from "@react-three/fiber";
import { Component, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useViewerController } from "../controller/use-viewer-controller";
import { getModule, getPart, product } from "../domain/product";
import { describeModelSource, modelSource } from "../domain/model-source";
import { ProductScene } from "../scene/ProductScene";
import { levelLabel, useViewerStore } from "../state/viewer-store";

class SceneErrorBoundary extends Component<{ children: ReactNode; onError: (message: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onError(error.message); }
  render() { return this.state.failed ? null : this.props.children; }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function ViewerApp() {
  const controller = useViewerController();
  const [sceneKey, setSceneKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const level = useViewerStore((state) => state.level);
  const selectedModuleId = useViewerStore((state) => state.selectedModuleId);
  const selectedPartId = useViewerStore((state) => state.selectedPartId);
  const hoveredNodeId = useViewerStore((state) => state.hoveredNodeId);
  const isAnimating = useViewerStore((state) => state.isAnimating);
  const explosionScale = useViewerStore((state) => state.explosionScale);
  const sceneStatus = useViewerStore((state) => state.sceneStatus);
  const sceneError = useViewerStore((state) => state.sceneError);
  const reducedMotion = useViewerStore((state) => state.reducedMotion);

  const handleSceneError = useCallback((message: string) => {
    useViewerStore.getState().setSceneStatus("error", message || "三维场景初始化失败");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => useViewerStore.getState().setReducedMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (!supportsWebGL()) handleSceneError("当前浏览器或设备未启用 WebGL。请开启硬件加速后重试。");
  }, [handleSceneError, sceneKey]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (helpOpen) setHelpOpen(false);
        else if (level !== "PRODUCT") controller.back();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [controller, helpOpen, level]);

  const activeModule = useMemo(() => {
    const hovered = getModule(hoveredNodeId);
    return hovered ?? getModule(selectedModuleId);
  }, [hoveredNodeId, selectedModuleId]);
  const activePart = useMemo(() => getPart(hoveredNodeId)?.part ?? getPart(selectedPartId)?.part ?? null, [hoveredNodeId, selectedPartId]);
  const panelData = activePart
    ? { index: "03 / PART", name: activePart.name, summary: activePart.role, metaA: "所属模组", valueA: getPart(activePart.id)?.module.name ?? "—", metaB: "材料", valueB: activePart.material }
    : activeModule
      ? { index: "02 / MODULE", name: activeModule.name, summary: activeModule.role, metaA: "模组编号", valueA: activeModule.code, metaB: "零件数量", valueB: String(activeModule.parts.length) }
      : { index: "01 / PRODUCT", name: product.name, summary: product.model, metaA: "当前层级", valueA: levelLabel[level], metaB: "功能模组", valueB: String(product.modules.length) };

  const primaryAction = () => {
    if (level === "PRODUCT") controller.enterModules();
    else if (level === "MODULE" && activeModule) controller.enterModule(activeModule.id);
    else if (level === "PART") controller.back();
  };

  const primaryLabel = level === "PRODUCT"
    ? "开始拆解"
    : level === "MODULE"
      ? activeModule ? `拆解${activeModule.name}` : "选择一个模组"
      : "返回模组层";

  const retry = () => {
    controller.reset();
    useViewerStore.getState().setSceneStatus("loading");
    setSceneKey((value) => value + 1);
  };

  return (
    <main className="viewer-shell">
      <a className="skip-link" href="#structure-list">跳过三维场景，查看结构列表</a>
      <header className="topbar">
        <a className="brand" href="#viewer" aria-label="AXON 结构实验室首页">
          <span className="brand-mark" aria-hidden="true"><b>A</b></span>
          <span>AXON LAB</span>
        </a>
        <nav className="breadcrumb" aria-label="当前结构层级">
          <button className={level === "PRODUCT" ? "active" : ""} type="button" onClick={controller.reset}>整机</button>
          <i aria-hidden="true" />
          <button className={level === "MODULE" ? "active" : ""} type="button" disabled={level === "PRODUCT"} onClick={() => level === "PART" && controller.back()}>模组</button>
          <i aria-hidden="true" />
          <button className={level === "PART" ? "active" : ""} type="button" disabled>零件</button>
        </nav>
        <div className="top-actions">
          <button className="quiet-button" type="button" onClick={controller.reset} disabled={level === "PRODUCT" && !isAnimating}>复位</button>
          <button className="quiet-button" type="button" onClick={() => setHelpOpen(true)}>使用帮助</button>
        </div>
      </header>

      <section className="hero-copy">
        <p className="eyebrow">TERMINAL PRODUCT / 01</p>
        <h1>AXON M1<br /><span>结构探索</span></h1>
        <p className="intro">点击整机逐层拆解，探索终端产品内部的功能模组与精密零件。</p>
        <div className="status-line"><span className={`status-dot ${isAnimating ? "working" : ""}`} />{isAnimating ? "结构变换中" : `${levelLabel[level]}视图 · 可交互`}</div>
      </section>

      <section className="stage" id="viewer" aria-label="三维产品结构查看器">
        {sceneStatus !== "error" && (
          <SceneErrorBoundary key={sceneKey} onError={handleSceneError}>
            <Canvas
              camera={{ position: [7.2, 3.8, 8.4], fov: 36, near: 0.1, far: 100 }}
              dpr={[1, 1.75]}
              gl={{ antialias: true, powerPreference: "high-performance" }}
              onCreated={() => window.setTimeout(() => useViewerStore.getState().setSceneStatus("ready"), 260)}
            >
              <Suspense fallback={null}><ProductScene controller={controller} /></Suspense>
            </Canvas>
          </SceneErrorBoundary>
        )}
        <div className="stage-vignette" aria-hidden="true" />
        <div className="axis-label">X / Y / Z — FREE ORBIT</div>
        {sceneStatus === "loading" && (
          <div className="loading-overlay" role="status" aria-live="polite">
            <span className="loading-ring" /><b>正在建立场景映射</b><small>{describeModelSource(modelSource)}</small>
          </div>
        )}
        {sceneStatus === "error" && (
          <div className="error-panel" role="alert">
            <span>WEBGL / ERROR</span><h2>三维场景未能启动</h2><p>{sceneError}</p><button type="button" onClick={retry}>重新加载</button>
          </div>
        )}
      </section>

      <aside className="info-panel" aria-label="当前对象信息">
        <p className="panel-index">{panelData.index}</p>
        <h2>{panelData.name}</h2>
        <p>{panelData.summary}</p>
        <dl>
          <div><dt>{panelData.metaA}</dt><dd>{panelData.valueA}</dd></div>
          <div><dt>{panelData.metaB}</dt><dd>{panelData.valueB}</dd></div>
          <div><dt>交互状态</dt><dd className="cyan">{isAnimating ? "BUSY" : "READY"}</dd></div>
        </dl>
        <button className="primary-action" type="button" onClick={primaryAction} disabled={isAnimating || (level === "MODULE" && !activeModule)}>
          <span>{primaryLabel}</span><b aria-hidden="true">→</b>
        </button>
      </aside>

      <aside className="module-rail" id="structure-list" aria-label="产品结构列表">
        <span>{level === "PART" ? "PART INDEX" : "MODULE INDEX"}</span>
        <ol>
          {level === "PART" && activeModule ? activeModule.parts.map((part, index) => (
            <li key={part.id}>
              <button
                type="button"
                className={selectedPartId === part.id || hoveredNodeId === part.id ? "active" : ""}
                disabled={isAnimating}
                onMouseEnter={() => useViewerStore.getState().setHover(part.id)}
                onMouseLeave={() => useViewerStore.getState().setHover(null)}
                onClick={() => controller.selectPart(activeModule.id, part.id)}
              ><b>{String(index + 1).padStart(2, "0")}</b><span>{part.name}</span></button>
            </li>
          )) : product.modules.map((module, index) => (
            <li key={module.id}>
              <button
                type="button"
                className={selectedModuleId === module.id || hoveredNodeId === module.id ? "active" : ""}
                disabled={level === "PRODUCT" || isAnimating}
                onMouseEnter={() => level === "MODULE" && useViewerStore.getState().setHover(module.id)}
                onMouseLeave={() => useViewerStore.getState().setHover(null)}
                onClick={() => level === "MODULE" && controller.enterModule(module.id)}
              ><b>{String(index + 1).padStart(2, "0")}</b><span>{module.name}</span></button>
            </li>
          ))}
        </ol>
      </aside>

      <footer className="control-dock" aria-label="三维场景控制">
        {level !== "PRODUCT" && <button className="dock-button" type="button" onClick={controller.back} disabled={isAnimating}>← 返回上层</button>}
        <span>拖拽旋转</span><i /><span>滚轮缩放</span><i /><span>右键平移</span>
        <label className="explode-control"><span>爆炸距离</span><input aria-label="爆炸距离" type="range" min="0.35" max="1.35" step="0.05" value={explosionScale} onChange={(event) => useViewerStore.getState().setExplosionScale(Number(event.target.value))} disabled={level === "PRODUCT"} /></label>
        <strong>{level === "PRODUCT" ? "01" : level === "MODULE" ? "02" : "03"} — 03</strong>
      </footer>

      <div className="sr-live" aria-live="polite">当前位于{levelLabel[level]}层级。{activePart ? `已选择${activePart.name}。` : activeModule ? `当前对象${activeModule.name}。` : ""}</div>

      {helpOpen && (
        <div className="dialog-backdrop">
          <button className="dialog-dismiss" type="button" aria-label="关闭帮助" onClick={() => setHelpOpen(false)} />
          <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <p className="panel-index">INTERACTION GUIDE</p><h2 id="help-title">如何探索结构</h2>
            <ol><li><b>01</b><span>拖拽旋转，滚轮或双指缩放。</span></li><li><b>02</b><span>点击整机展开六个功能模组。</span></li><li><b>03</b><span>点击任一模组查看其组成零件。</span></li><li><b>ESC</b><span>随时逐级返回上一层。</span></li></ol>
            <label className="motion-toggle"><input type="checkbox" checked={reducedMotion} onChange={(event) => useViewerStore.getState().setReducedMotion(event.target.checked)} />减少动态效果</label>
            <button className="primary-action" type="button" onClick={() => setHelpOpen(false)}><span>开始探索</span><b aria-hidden="true">×</b></button>
          </section>
        </div>
      )}
    </main>
  );
}
