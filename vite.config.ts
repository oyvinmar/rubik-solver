/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // Registered from main.tsx so the page reloads when an update activates.
      injectRegister: false,
      includeAssets: ["favicon.ico", "favicon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Rubik's Cube Solver",
        short_name: "Cube Solver",
        description: "Enter your scrambled 3×3 cube and follow a short solution, move by move.",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0f172a",
        theme_color: "#0f172a",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        // cubing.js chunks for other puzzles, which a 3x3 never loads.
        globIgnores: [
          "**/node_modules/**/*",
          "sw.js",
          "workbox-*.js",
          "**/puzzles-dynamic-4x4x4-*.js",
          "**/puzzles-dynamic-megaminx-*.js",
          "**/puzzles-dynamic-unofficial-*.js",
          "**/puzzles-dynamic-side-events-*.js",
          "**/big-puzzle-orientation-*.js",
          "**/puzzle-geometry-*.js",
        ],
      },
    }),
  ],
  build: {
    // Minification strips licence comments, so collect them in a file instead.
    license: { fileName: "licenses.txt" },
  },
  worker: {
    format: "es",
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
