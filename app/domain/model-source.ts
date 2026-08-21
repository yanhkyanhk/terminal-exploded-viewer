export type ModelSource =
  | { readonly kind: "glb"; readonly url: string }
  | { readonly kind: "procedural" };

export const modelSource: ModelSource = { kind: "procedural" };

export const describeModelSource = (source: ModelSource) =>
  source.kind === "glb" ? `GLB: ${source.url}` : "内置程序化演示模型";
