import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;
const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), tailwindcss()],
    base: isTauri ? "/" : "/TrKixel/",

    // Prevent Vite from obscuring Rust errors
    clearScreen: false,

    server: {
        // Tauri expects a fixed port, fail if that port is not available
        port: 5173,
        strictPort: true,
        // If the host Tauri is expecting is set, use it
        host: host || false,
        hmr: host
            ? {
                  protocol: "ws",
                  host,
                  port: 1421,
              }
            : undefined,
        watch: {
            // Tell Vite to ignore watching `src-tauri`
            ignored: ["**/src-tauri/**"],
        },
    },

    // Env variables starting with these prefixes will be exposed in
    // Tauri's source code through `import.meta.env`
    envPrefix: ["VITE_", "TAURI_ENV_*"],

    build: {
        // Tauri uses Chromium on Windows and WebKit on macOS and Linux
        target:
            process.env.TAURI_ENV_PLATFORM === "windows"
                ? "chrome105"
                : "safari13",
        // Don't minify for debug builds
        minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
        // Produce sourcemaps for debug builds
        sourcemap: !!process.env.TAURI_ENV_DEBUG,
    },
});
