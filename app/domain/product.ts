export type Vec3Tuple = readonly [number, number, number];
export type NodeType = "product" | "module" | "part";
export type PartShape = "box" | "cylinder";

export interface ExplosionConfig {
  readonly direction: Vec3Tuple;
  readonly distance: number;
}

export interface PartNode {
  readonly id: string;
  readonly type: "part";
  readonly name: string;
  readonly role: string;
  readonly material: string;
  readonly position: Vec3Tuple;
  readonly size: Vec3Tuple;
  readonly color: string;
  readonly shape?: PartShape;
  readonly explosion: ExplosionConfig;
}

export interface ModuleNode {
  readonly id: string;
  readonly type: "module";
  readonly name: string;
  readonly code: string;
  readonly role: string;
  readonly position: Vec3Tuple;
  readonly size: Vec3Tuple;
  readonly color: string;
  readonly explosion: ExplosionConfig;
  readonly parts: readonly PartNode[];
}

export interface ProductNode {
  readonly id: string;
  readonly type: "product";
  readonly name: string;
  readonly model: string;
  readonly modules: readonly ModuleNode[];
}

const parts = (moduleId: string, values: readonly Omit<PartNode, "type" | "id">[]): readonly PartNode[] =>
  values.map((part, index) => ({ ...part, id: `${moduleId}-part-${index + 1}`, type: "part" }));

export const product: ProductNode = {
  id: "axon-m1",
  type: "product",
  name: "AXON M1",
  model: "模块化移动终端概念机",
  modules: [
    {
      id: "display-module", type: "module", name: "显示模组", code: "DSP-01", role: "图像显示与触控输入",
      position: [0, 0, 0.27], size: [2.94, 5.68, 0.1], color: "#193140",
      explosion: { direction: [0, 0, 1], distance: 2.9 },
      parts: parts("display-module", [
        { name: "保护玻璃", role: "表面防护", material: "铝硅玻璃", position: [0, 0, 0.05], size: [2.92, 5.66, 0.045], color: "#2b6174", explosion: { direction: [0, 0, 1], distance: 0.8 } },
        { name: "OLED 面板", role: "图像显示", material: "柔性 OLED", position: [0, 0, 0], size: [2.84, 5.56, 0.035], color: "#243b55", explosion: { direction: [0.7, 0, 0.8], distance: 0.85 } },
        { name: "触控层", role: "触控感应", material: "ITO 薄膜", position: [0, 0, -0.04], size: [2.78, 5.48, 0.025], color: "#41758a", explosion: { direction: [-0.7, 0, -0.8], distance: 0.75 } },
      ]),
    },
    {
      id: "camera-module", type: "module", name: "影像模组", code: "CAM-02", role: "多焦段图像采集",
      position: [-0.82, 1.76, 0.08], size: [1.12, 1.52, 0.24], color: "#18252f",
      explosion: { direction: [-0.58, 0.78, 0.24], distance: 3.4 },
      parts: parts("camera-module", [
        { name: "主摄镜组", role: "广角成像", material: "光学玻璃", position: [-0.23, 0.28, 0.08], size: [0.48, 0.48, 0.2], shape: "cylinder", color: "#101820", explosion: { direction: [-0.8, 0.8, 0.5], distance: 1.2 } },
        { name: "长焦镜组", role: "光学变焦", material: "光学玻璃", position: [0.24, 0.28, 0.08], size: [0.4, 0.4, 0.2], shape: "cylinder", color: "#111e28", explosion: { direction: [0.8, 0.8, 0.5], distance: 1.1 } },
        { name: "CMOS 传感器", role: "光电转换", material: "硅基芯片", position: [0, -0.2, -0.02], size: [0.68, 0.52, 0.12], color: "#284861", explosion: { direction: [0, -1, -0.5], distance: 0.95 } },
        { name: "影像控制板", role: "信号处理", material: "FR-4", position: [0, -0.5, -0.06], size: [0.92, 0.26, 0.08], color: "#1d584d", explosion: { direction: [0, -1, 0.2], distance: 1.25 } },
      ]),
    },
    {
      id: "logic-module", type: "module", name: "主控模组", code: "PCB-03", role: "计算、存储与无线通信",
      position: [0.55, 1.42, 0.01], size: [1.55, 1.26, 0.18], color: "#19493f",
      explosion: { direction: [0.92, 0.28, 0.16], distance: 3.5 },
      parts: parts("logic-module", [
        { name: "系统芯片", role: "中央计算", material: "硅 / 陶瓷", position: [-0.3, 0.18, 0.08], size: [0.48, 0.48, 0.12], color: "#283746", explosion: { direction: [-0.8, 0.7, 0.6], distance: 1.05 } },
        { name: "存储芯片", role: "数据存储", material: "硅 / 环氧树脂", position: [0.32, 0.18, 0.07], size: [0.42, 0.34, 0.1], color: "#33495a", explosion: { direction: [0.9, 0.6, 0.5], distance: 0.95 } },
        { name: "射频前端", role: "蜂窝通信", material: "复合封装", position: [-0.32, -0.3, 0.06], size: [0.5, 0.25, 0.1], color: "#315b5a", explosion: { direction: [-0.9, -0.7, 0.4], distance: 1 } },
        { name: "主逻辑板", role: "电气连接", material: "FR-4", position: [0, 0, 0], size: [1.5, 1.2, 0.055], color: "#1d5a49", explosion: { direction: [0.6, -0.8, -0.4], distance: 0.9 } },
      ]),
    },
    {
      id: "battery-module", type: "module", name: "能源模组", code: "BAT-04", role: "整机能量供给",
      position: [0, -0.28, -0.01], size: [2.36, 2.95, 0.2], color: "#26313a",
      explosion: { direction: [0.94, -0.12, 0.2], distance: 3.7 },
      parts: parts("battery-module", [
        { name: "电芯 A", role: "能量存储", material: "锂聚合物", position: [-0.56, 0, 0], size: [1.08, 2.74, 0.15], color: "#313d47", explosion: { direction: [-1, 0, 0.3], distance: 1.05 } },
        { name: "电芯 B", role: "能量存储", material: "锂聚合物", position: [0.56, 0, 0], size: [1.08, 2.74, 0.15], color: "#37444d", explosion: { direction: [1, 0, 0.3], distance: 1.05 } },
        { name: "保护电路", role: "充放电管理", material: "FR-4", position: [0, 1.28, 0.1], size: [1.7, 0.22, 0.08], color: "#245044", explosion: { direction: [0, 1, 0.7], distance: 0.9 } },
      ]),
    },
    {
      id: "audio-module", type: "module", name: "声学模组", code: "AUD-05", role: "立体声输出与拾音",
      position: [0, -2.14, 0.01], size: [2.42, 0.68, 0.18], color: "#29343e",
      explosion: { direction: [-0.12, -0.96, 0.22], distance: 3.1 },
      parts: parts("audio-module", [
        { name: "扬声器单元", role: "低频输出", material: "钕磁体", position: [-0.68, 0, 0.04], size: [0.82, 0.48, 0.14], color: "#344553", explosion: { direction: [-1, -0.3, 0.5], distance: 0.95 } },
        { name: "共振腔", role: "声压增强", material: "工程塑料", position: [0.18, 0, 0], size: [0.78, 0.46, 0.12], color: "#293943", explosion: { direction: [0, -1, -0.4], distance: 0.85 } },
        { name: "线性马达", role: "触觉反馈", material: "铜 / 钢", position: [0.86, 0, 0.02], size: [0.46, 0.46, 0.14], shape: "cylinder", color: "#66594c", explosion: { direction: [1, -0.3, 0.5], distance: 0.95 } },
      ]),
    },
    {
      id: "frame-module", type: "module", name: "结构模组", code: "FRM-06", role: "支撑、防护与散热",
      position: [0, 0, -0.2], size: [3.14, 5.88, 0.24], color: "#18232c",
      explosion: { direction: [0, 0, -1], distance: 2.6 },
      parts: parts("frame-module", [
        { name: "中框", role: "结构承载", material: "再生铝", position: [0, 0, 0.03], size: [3.12, 5.86, 0.13], color: "#26343f", explosion: { direction: [0, 0, 1], distance: 0.75 } },
        { name: "石墨散热层", role: "热量扩散", material: "高导热石墨", position: [0, 0, -0.05], size: [2.64, 4.9, 0.035], color: "#1e2d35", explosion: { direction: [-0.5, 0, -1], distance: 0.9 } },
        { name: "后盖", role: "背部防护", material: "复合玻璃", position: [0, 0, -0.12], size: [3.08, 5.8, 0.08], color: "#203341", explosion: { direction: [0.5, 0, -1], distance: 1.05 } },
      ]),
    },
  ],
};

export const getModule = (moduleId: string | null) => product.modules.find((module) => module.id === moduleId) ?? null;

export const getPart = (partId: string | null) => {
  for (const productModule of product.modules) {
    const part = productModule.parts.find((candidate) => candidate.id === partId);
    if (part) return { module: productModule, part };
  }
  return null;
};
