import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AXON M1 · 3D 结构探索",
  description: "可交互的终端产品三级 3D 爆炸图。",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "AXON M1 · 3D 结构探索",
    description: "逐层探索终端产品的模组与零件结构。",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "AXON M1 · 3D 结构探索",
    description: "逐层探索终端产品的模组与零件结构。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
