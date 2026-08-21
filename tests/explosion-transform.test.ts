import { describe, expect, it } from "vitest";
import { explodedPosition, normalize, positionDistance } from "../app/explosion/transform";
import type { Vec3Tuple } from "../app/domain/product";

describe("explosion transform", () => {
  it("总是从不可变装配坐标计算，不产生累计漂移", () => {
    const origin = [1.25, -0.5, 0.2] as const;
    const direction = [0.6, 0.8, 0.1] as const;
    let assembled: Vec3Tuple = origin;
    for (let index = 0; index < 20; index += 1) {
      const exploded = explodedPosition(origin, direction, 3.4, 1);
      expect(positionDistance(exploded, origin)).toBeCloseTo(3.4, 10);
      assembled = explodedPosition(origin, direction, 3.4, 0);
    }
    expect(assembled).toEqual(origin);
  });

  it("钳制 progress 并允许统一缩放爆炸距离", () => {
    expect(explodedPosition([0, 0, 0], [1, 0, 0], 2, 2, 0.5)).toEqual([1, 0, 0]);
    expect(explodedPosition([0, 0, 0], [1, 0, 0], 2, -1)).toEqual([0, 0, 0]);
  });

  it("零向量使用稳定的 X 轴兜底", () => {
    expect(normalize([0, 0, 0])).toEqual([1, 0, 0]);
  });
});
