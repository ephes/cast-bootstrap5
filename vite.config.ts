import { resolve } from "path";
import { defineConfig } from "vite";
import type { UserConfig as VitestUserConfigInterface } from "vitest/config"

const vitestConfig: VitestUserConfigInterface = {
  test: {
    globals: true,
    environment: "jsdom",
  },
}

export default defineConfig({
  plugins: [],
  test: vitestConfig.test,
  root: resolve("./js/"),
  base: "/static/",
  server: {
    host: "0.0.0.0",
    port: 5173,
    open: false,
    watch: {
      usePolling: true,
      disableGlobbing: false,
    },
  },
  resolve: {
    extensions: [".js", ".json", ".ts"],
    alias: {
      "@": resolve("./js/src/"),
    },
  },
  build: {
    outDir: resolve("./cast_bootstrap5/static/cast_bootstrap5/bundler"),
    assetsDir: "",
    manifest: true,
    emptyOutDir: true,
    target: "es2015",
    rollupOptions: {
      input: {
        main: resolve("./js/src/gallery/image-gallery.ts")
      },
      output: {
        chunkFileNames: undefined,
      },
    },
  },
})
