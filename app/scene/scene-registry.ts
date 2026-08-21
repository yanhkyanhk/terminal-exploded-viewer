import type { Object3D } from "three";

export class SceneRegistry {
  private readonly byNodeId = new Map<string, Object3D>();
  private readonly byObjectId = new Map<number, string>();

  register(nodeId: string, object: Object3D) {
    const existing = this.byNodeId.get(nodeId);
    if (existing && existing !== object) throw new Error(`Duplicate scene node id: ${nodeId}`);
    this.byNodeId.set(nodeId, object);
    object.traverse((child) => this.byObjectId.set(child.id, nodeId));
  }

  unregister(nodeId: string) {
    const object = this.byNodeId.get(nodeId);
    if (!object) return;
    object.traverse((child) => this.byObjectId.delete(child.id));
    this.byNodeId.delete(nodeId);
  }

  getObject(nodeId: string) {
    return this.byNodeId.get(nodeId) ?? null;
  }

  getNodeId(object: Object3D | null): string | null {
    let cursor = object;
    while (cursor) {
      const nodeId = this.byObjectId.get(cursor.id) ?? cursor.userData.nodeId;
      if (typeof nodeId === "string") return nodeId;
      cursor = cursor.parent;
    }
    return null;
  }

  clear() {
    this.byNodeId.clear();
    this.byObjectId.clear();
  }
}

export const sceneRegistry = new SceneRegistry();
