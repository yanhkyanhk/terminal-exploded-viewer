import { describe, expect, it } from "vitest";
import { initialViewerSnapshot, transitionViewer } from "../app/state/machine";

describe("viewer state machine", () => {
  it("只允许 PRODUCT → MODULE → PART 的逐级进入", () => {
    const illegal = transitionViewer(initialViewerSnapshot, { type: "ENTER_MODULE", moduleId: "camera-module" });
    expect(illegal).toBe(initialViewerSnapshot);

    const modules = transitionViewer(initialViewerSnapshot, { type: "ENTER_MODULES" });
    expect(modules).toEqual({ level: "MODULE", selectedModuleId: null, selectedPartId: null });

    const parts = transitionViewer(modules, { type: "ENTER_MODULE", moduleId: "camera-module" });
    expect(parts).toEqual({ level: "PART", selectedModuleId: "camera-module", selectedPartId: null });
  });

  it("PART 返回 MODULE 时清空选择且不跳过层级", () => {
    const parts = { level: "PART", selectedModuleId: "camera-module", selectedPartId: "camera-module-part-1" } as const;
    const modules = transitionViewer(parts, { type: "BACK" });
    expect(modules).toEqual({ level: "MODULE", selectedModuleId: null, selectedPartId: null });
    expect(transitionViewer(modules, { type: "BACK" })).toEqual(initialViewerSnapshot);
  });

  it("只接受当前展开模组内的零件选择", () => {
    const parts = { level: "PART", selectedModuleId: "camera-module", selectedPartId: null } as const;
    expect(transitionViewer(parts, { type: "SELECT_PART", moduleId: "logic-module", partId: "logic-module-part-1" })).toBe(parts);
    expect(transitionViewer(parts, { type: "SELECT_PART", moduleId: "camera-module", partId: "camera-module-part-1" }).selectedPartId).toBe("camera-module-part-1");
  });

  it("RESET 从任意层级恢复确定初态", () => {
    expect(transitionViewer({ level: "PART", selectedModuleId: "battery-module", selectedPartId: null }, { type: "RESET" })).toEqual(initialViewerSnapshot);
  });
});
