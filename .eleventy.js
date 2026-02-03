import fs from "node:fs";
import path from "node:path";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "public": "/" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  const inlineSvgCache = new Map();

  eleventyConfig.addNunjucksShortcode("inlineSvg", function (assetPathFromAssets) {
    if (typeof assetPathFromAssets !== "string" || !assetPathFromAssets.trim()) {
      throw new Error(`inlineSvg: očekávám string, dostal jsem: ${typeof assetPathFromAssets}`);
    }

    const normalized = assetPathFromAssets.replace(/^\/+/, ""); // zamezí "/images/..." vs "images/..."
    const fullPath = path.resolve(process.cwd(), "src", "assets", normalized);

    if (inlineSvgCache.has(fullPath)) {
      return inlineSvgCache.get(fullPath);
    }

    const svg = fs.readFileSync(fullPath, "utf-8");
    inlineSvgCache.set(fullPath, svg);
    return svg;
  });

  function viteTags(entry) {
    const isDev = (process.env.ELEVENTY_ENV || "development") !== "production";
    const devServerUrl = "http://localhost:5173";

    if (isDev) {
      return `
<script type="module" src="${devServerUrl}/@vite/client"></script>
<script type="module" src="${devServerUrl}/${entry}"></script>
`.trim();
    }

    const manifestPath = path.resolve("dist", ".vite", "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const chunk = manifest[entry];

    if (!chunk) {
      throw new Error(`Vite manifest: entry "${entry}" nebyl nalezen.`);
    }

    const cssLinks = (chunk.css || [])
      .map((href) => `<link rel="stylesheet" href="${href}">`)
      .join("\n");

    const moduleScript = `<script type="module" src="${chunk.file}"></script>`;

    return [cssLinks, moduleScript].filter(Boolean).join("\n");
  }

  eleventyConfig.addNunjucksGlobal("viteTags", viteTags);

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "dist",
    },
  };
}