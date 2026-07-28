import { access, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const required = [
  "dist-web/index.html",
  "dist-web/favicon.svg",
  "dist-package/index.js",
  "dist-package/index.d.ts",
  "dist-package/cli.js",
];

for (const file of required) {
  await access(join(root, file));
}

const cli = await run(process.execPath, [
  "dist-package/cli.js",
  "examples/tokyo-south-window.json",
]);
if (!cli.stdout.includes("Direct sun:") || cli.code !== 0) {
  throw new Error(`CLI smoke test failed:\n${cli.stdout}\n${cli.stderr}`);
}

const port = 4_176;
const server = spawn(
  process.execPath,
  [
    join(root, "node_modules", "vite", "bin", "vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
);

try {
  const response = await waitFor(`http://127.0.0.1:${port}/`);
  const html = await response.text();
  if (!html.includes("SillCast") || !html.includes('id="root"')) {
    throw new Error("Preview returned an unexpected HTML document.");
  }

  const assetMatch = /src="([^"]+assets\/[^"]+\.js)"/.exec(html);
  if (!assetMatch?.[1]) {
    throw new Error("Built JavaScript asset was not referenced by index.html.");
  }
  const assetUrl = new globalThis.URL(assetMatch[1], `http://127.0.0.1:${port}/`);
  const assetResponse = await globalThis.fetch(assetUrl);
  if (!assetResponse.ok || (await assetResponse.text()).length < 10_000) {
    throw new Error("Built JavaScript asset was missing or unexpectedly small.");
  }
} finally {
  await stopServer(server);
}

const builtHtml = await readFile(join(root, "dist-web/index.html"), "utf8");
if (/fonts\.googleapis|google-analytics|plausible|posthog/i.test(builtHtml)) {
  throw new Error("Unexpected external analytics or font request found in the build.");
}

process.stdout.write("Smoke checks passed: package, CLI, preview, and assets.\n");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function waitFor(url) {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await globalThis.fetch(url);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => globalThis.setTimeout(resolve, 100));
  }
  throw new Error(`Preview did not become ready: ${String(lastError)}`);
}

function stopServer(serverProcess) {
  return new Promise((resolve) => {
    if (serverProcess.exitCode !== null) {
      resolve();
      return;
    }
    serverProcess.once("close", resolve);
    serverProcess.kill("SIGTERM");
  });
}
