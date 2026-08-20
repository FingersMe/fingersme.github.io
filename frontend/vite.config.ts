import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static SPA build → outputs to dist/ (Netlify + GitHub Pages ready). No SSR, no server needed.
// `base` controls the public path: '/' for Netlify or a user page (username.github.io),
// '/<repo>/' for a GitHub project page. The Pages workflow sets VITE_BASE automatically.
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  build: { outDir: "dist", target: "es2020" },
});
