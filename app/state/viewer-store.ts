"use client";

import { create } from "zustand";
import type { ViewerLevel, ViewerSnapshot } from "./machine";

export type SceneStatus = "loading" | "ready" | "error";

interface ViewerStore extends ViewerSnapshot {
  hoveredNodeId: string | null;
  isAnimating: boolean;
  transitionToken: number;
  moduleProgress: number;
  partProgress: number;
  explosionScale: number;
  focusNonce: number;
  sceneStatus: SceneStatus;
  sceneError: string | null;
  reducedMotion: boolean;
  setHover: (nodeId: string | null) => void;
  setExplosionScale: (value: number) => void;
  setSceneStatus: (status: SceneStatus, error?: string | null) => void;
  setReducedMotion: (value: boolean) => void;
}

export const useViewerStore = create<ViewerStore>((set) => ({
  level: "PRODUCT",
  selectedModuleId: null,
  selectedPartId: null,
  hoveredNodeId: null,
  isAnimating: false,
  transitionToken: 0,
  moduleProgress: 0,
  partProgress: 0,
  explosionScale: 1,
  focusNonce: 0,
  sceneStatus: "loading",
  sceneError: null,
  reducedMotion: false,
  setHover: (hoveredNodeId) => set((state) => state.isAnimating ? state : { hoveredNodeId }),
  setExplosionScale: (value) => set({ explosionScale: Math.min(1.35, Math.max(0.35, value)) }),
  setSceneStatus: (sceneStatus, sceneError = null) => set({ sceneStatus, sceneError }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));

export const selectSnapshot = (state: ViewerStore): ViewerSnapshot => ({
  level: state.level,
  selectedModuleId: state.selectedModuleId,
  selectedPartId: state.selectedPartId,
});

export const levelLabel: Record<ViewerLevel, string> = {
  PRODUCT: "整机",
  MODULE: "模组",
  PART: "零件",
};
