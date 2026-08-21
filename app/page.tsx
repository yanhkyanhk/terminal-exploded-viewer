import type { Metadata } from "next";
import { ViewerApp } from "./viewer/ViewerApp";

export const metadata: Metadata = {
  title: "AXON M1 · 3D 结构探索",
  description: "逐层拆解终端产品的模组与零件，探索内部结构。",
};

export default function Home() {
  return <ViewerApp />;
}
