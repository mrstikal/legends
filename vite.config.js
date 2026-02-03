import { defineConfig } from "vite";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";

function eleventyPlugin() {
  let eleventyProcess;

  return {
    name: "eleventy-watch",
    configureServer(server) {
      const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

      eleventyProcess = spawn(pnpmCmd, ["exec", "eleventy", "--watch"], {
        stdio: "inherit",
        cwd: process.cwd(),
        env: {
          ...process.env,
          ELEVENTY_ENV: process.env.ELEVENTY_ENV || "development",
        },
        shell: process.platform === "win32",
      });

      server.middlewares.use((req, res, next) => {
        try {
          const urlPath = (req.url || "/").split("?")[0];

          if (urlPath.startsWith("/assets/")) {
            const filePath = path.resolve(process.cwd(), "dist", urlPath.slice(1));
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const contentTypeByExt = {
                ".webp": "image/webp",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".svg": "image/svg+xml",
                ".css": "text/css; charset=utf-8",
                ".js": "text/javascript; charset=utf-8",
              };
              res.setHeader("Content-Type", contentTypeByExt[ext] || "application/octet-stream");
              res.end(fs.readFileSync(filePath));
              return;
            }
          }

          if (urlPath === "/" || urlPath.endsWith(".html")) {
            const rel = urlPath === "/" ? "index.html" : urlPath.slice(1);
            const filePath = path.resolve(process.cwd(), "dist", rel);

            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(fs.readFileSync(filePath, "utf-8"));
              return;
            }
          }
        } catch {
          // ignore
        }
        next();
      });

      // ... existing code ...
    },
    // ... existing code ...
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    eleventyPlugin(),
  ],

  server: {
    port: 5173,
    strictPort: true,
  },

  build: {
    outDir: "dist",
    emptyOutDir: false,
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/assets/main.js"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});