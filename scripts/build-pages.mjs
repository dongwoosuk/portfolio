import { spawnSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const built = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build", "--webpack"], {
  stdio: "inherit", env: { ...process.env, GITHUB_PAGES: "true" }, windowsHide: true,
});
if (built.status !== 0) process.exit(built.status ?? 1);

// Public assets in JSX, video tags and serialized project data need the Pages
// repository prefix too. Next handles route links and its own chunks itself.
async function prefixAssets(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) { await prefixAssets(file); continue; }
    if (!/\.(html|js|css|json|txt)$/.test(entry.name)) continue;
    const content = await readFile(file, "utf8");
    const updated = content.replace(/(?<![\w/])\/(work|images)\//g, "/portfolio/$1/");
    if (updated !== content) await writeFile(file, updated);
  }
}
await prefixAssets(".next-pages");
await writeFile(".next-pages/.nojekyll", "");
console.log("GitHub Pages export ready: .next-pages/ (base path /portfolio)");
