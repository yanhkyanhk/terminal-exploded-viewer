"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef } from "react";
import { getModule, getPart } from "../domain/product";
import { isSameSnapshot, transitionViewer, type ViewerEvent } from "../state/machine";
import { selectSnapshot, useViewerStore } from "../state/viewer-store";

export function useViewerController() {
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const run = useCallback((event: ViewerEvent) => {
    const state = useViewerStore.getState();
    if (state.isAnimating) return false;

    if (event.type === "ENTER_MODULE" && !getModule(event.moduleId)) return false;
    if (event.type === "SELECT_PART") {
      const match = getPart(event.partId);
      if (!match || match.module.id !== event.moduleId) return false;
    }

    const next = transitionViewer(selectSnapshot(state), event);
    if (isSameSnapshot(next, selectSnapshot(state))) return false;

    if (event.type === "SELECT_PART") {
      useViewerStore.setState({ selectedPartId: next.selectedPartId, hoveredNodeId: null });
      return true;
    }

    const token = state.transitionToken + 1;
    const targetModuleProgress = next.level === "PRODUCT" ? 0 : 1;
    const targetPartProgress = next.level === "PART" ? 1 : 0;
    const motion = { module: state.moduleProgress, part: state.partProgress };
    const duration = state.reducedMotion ? 0.01 : 0.72;

    useViewerStore.setState({
      ...next,
      hoveredNodeId: null,
      isAnimating: true,
      transitionToken: token,
      focusNonce: state.focusNonce + 1,
    });

    timeline.current?.kill();
    timeline.current = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        if (useViewerStore.getState().transitionToken === token) {
          useViewerStore.setState({
            moduleProgress: targetModuleProgress,
            partProgress: targetPartProgress,
            isAnimating: false,
          });
        }
      },
    });

    timeline.current.to(motion, {
      module: targetModuleProgress,
      part: targetPartProgress,
      duration,
      onUpdate: () => {
        if (useViewerStore.getState().transitionToken === token) {
          useViewerStore.setState({ moduleProgress: motion.module, partProgress: motion.part });
        }
      },
    });
    return true;
  }, []);

  const reset = useCallback(() => {
    timeline.current?.kill();
    const state = useViewerStore.getState();
    useViewerStore.setState({
      level: "PRODUCT",
      selectedModuleId: null,
      selectedPartId: null,
      hoveredNodeId: null,
      isAnimating: false,
      moduleProgress: 0,
      partProgress: 0,
      transitionToken: state.transitionToken + 1,
      focusNonce: state.focusNonce + 1,
    });
  }, []);

  useEffect(() => () => { timeline.current?.kill(); }, []);

  return {
    enterModules: () => run({ type: "ENTER_MODULES" }),
    enterModule: (moduleId: string) => run({ type: "ENTER_MODULE", moduleId }),
    selectPart: (moduleId: string, partId: string) => run({ type: "SELECT_PART", moduleId, partId }),
    back: () => run({ type: "BACK" }),
    reset,
  };
}
