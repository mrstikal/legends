import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export default function eleventyPlugin() {
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

      server.watcher.add(resolve("dist/**/*.html"));
      server.watcher.on("change", (file) => {
        if (file.endsWith(".html")) {
          server.ws.send({ type: "full-reload", path: "*" });
        }
      });
    },
    closeBundle() {
      if (eleventyProcess) eleventyProcess.kill();
    },
  };
}