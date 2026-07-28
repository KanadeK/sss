import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/core/index.ts" },
    format: ["esm"],
    dts: true,
    clean: true,
    outDir: "dist-package",
    sourcemap: true,
    target: "node22",
  },
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    dts: false,
    clean: false,
    outDir: "dist-package",
    sourcemap: true,
    target: "node22",
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);
