export type ViewerLevel = "PRODUCT" | "MODULE" | "PART";

export interface ViewerSnapshot {
  readonly level: ViewerLevel;
  readonly selectedModuleId: string | null;
  readonly selectedPartId: string | null;
}

export type ViewerEvent =
  | { readonly type: "ENTER_MODULES" }
  | { readonly type: "ENTER_MODULE"; readonly moduleId: string }
  | { readonly type: "SELECT_PART"; readonly partId: string; readonly moduleId: string }
  | { readonly type: "BACK" }
  | { readonly type: "RESET" };

export const initialViewerSnapshot: ViewerSnapshot = {
  level: "PRODUCT",
  selectedModuleId: null,
  selectedPartId: null,
};

export function transitionViewer(state: ViewerSnapshot, event: ViewerEvent): ViewerSnapshot {
  if (event.type === "RESET") return initialViewerSnapshot;

  if (event.type === "ENTER_MODULES" && state.level === "PRODUCT") {
    return { level: "MODULE", selectedModuleId: null, selectedPartId: null };
  }

  if (event.type === "ENTER_MODULE" && state.level === "MODULE") {
    return { level: "PART", selectedModuleId: event.moduleId, selectedPartId: null };
  }

  if (
    event.type === "SELECT_PART" &&
    state.level === "PART" &&
    state.selectedModuleId === event.moduleId
  ) {
    return { ...state, selectedPartId: event.partId };
  }

  if (event.type === "BACK" && state.level === "PART") {
    return { level: "MODULE", selectedModuleId: null, selectedPartId: null };
  }

  if (event.type === "BACK" && state.level === "MODULE") {
    return initialViewerSnapshot;
  }

  return state;
}

export const isSameSnapshot = (left: ViewerSnapshot, right: ViewerSnapshot) =>
  left.level === right.level &&
  left.selectedModuleId === right.selectedModuleId &&
  left.selectedPartId === right.selectedPartId;
