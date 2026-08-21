import { describe, expect, it } from "vitest";
import { Group, Mesh } from "three";
import { SceneRegistry } from "../app/scene/scene-registry";

describe("SceneRegistry", () => {
  it("可从子 Mesh 解析到逻辑节点 ID", () => {
    const registry = new SceneRegistry();
    const productGroup = new Group();
    const child = new Mesh();
    productGroup.add(child);
    registry.register("camera-module", productGroup);
    expect(registry.getNodeId(child)).toBe("camera-module");
    expect(registry.getObject("camera-module")).toBe(productGroup);
  });

  it("阻止重复逻辑节点注册到不同对象", () => {
    const registry = new SceneRegistry();
    registry.register("battery-module", new Group());
    expect(() => registry.register("battery-module", new Group())).toThrow(/Duplicate scene node id/);
  });
});
