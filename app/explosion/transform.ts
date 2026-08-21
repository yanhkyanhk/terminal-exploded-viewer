import type { Vec3Tuple } from "../domain/product";

export const normalize = ([x, y, z]: Vec3Tuple): Vec3Tuple => {
  const length = Math.hypot(x, y, z);
  return length > 1e-8 ? [x / length, y / length, z / length] : [1, 0, 0];
};

export const explodedPosition = (
  origin: Vec3Tuple,
  direction: Vec3Tuple,
  distance: number,
  progress: number,
  scale = 1,
): Vec3Tuple => {
  const [dx, dy, dz] = normalize(direction);
  const offset = distance * Math.min(1, Math.max(0, progress)) * scale;
  return [origin[0] + dx * offset, origin[1] + dy * offset, origin[2] + dz * offset];
};

export const positionDistance = (left: Vec3Tuple, right: Vec3Tuple) =>
  Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
