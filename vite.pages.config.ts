import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/terminal-exploded-viewer/",
  plugins: [react()],
  build: {
    outDir: "dist-pages",
  },
});
