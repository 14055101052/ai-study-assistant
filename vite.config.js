import { defineConfig } from "vite";
export default defineConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  server: { proxy: { "/api": "http://localhost:3000" } },
  build: { outDir: "dist" },
});
