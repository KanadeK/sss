import { createHash } from "node:crypto";
import { readdir, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import packageJson from "../package.json" with { type: "json" };

const root = process.cwd();
const releaseDirectory = join(root, "release");
await rm(releaseDirectory, { recursive: true, force: true });
await mkdir(releaseDirectory, { recursive: true });

await command(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
await command(process.platform === "win32" ? "npm.cmd" : "npm", [
  "pack",
  "--pack-destination",
  releaseDirectory,
]);

const webArchive = `sillcast-web-v${packageJson.version}.zip`;
await command("zip", ["-q", "-r", join(releaseDirectory, webArchive), "."], {
  cwd: join(root, "dist-web"),
});

const files = (await readdir(releaseDirectory))
  .filter((file) => file !== "SHA256SUMS")
  .sort();
const checksums = [];
for (const file of files) {
  const content = await readFile(join(releaseDirectory, file));
  checksums.push(`${createHash("sha256").update(content).digest("hex")}  ${file}`);
}
await writeFile(join(releaseDirectory, "SHA256SUMS"), `${checksums.join("\n")}\n`, "utf8");

process.stdout.write(`Release assets created in ${releaseDirectory}\n`);

function command(executable, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: options.cwd ?? root,
      stdio: "inherit",
      env: {
        ...process.env,
        NPM_CONFIG_CACHE: join(tmpdir(), "sillcast-release-npm-cache"),
      },
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${executable} exited with code ${code}`));
      }
    });
  });
}
