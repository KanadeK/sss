import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import {
  exposureToCsv,
  exposureToJson,
  simulateDay,
  validateScenario,
  type Scenario,
} from "./core/index";

const version = "0.1.0";

function help(): string {
  return `SillCast ${version}

Predict whether a point inside a room receives direct sun through a window.

Usage:
  sillcast <scenario.json> [--format summary|json|csv] [--out <file>]
  sillcast --help
  sillcast --version

Examples:
  sillcast examples/tokyo-south-window.json
  sillcast examples/london-east-desk.json --format csv --out exposure.csv
`;
}

function parseArguments(args: string[]): {
  input: string;
  format: "summary" | "json" | "csv";
  output?: string;
} {
  const positional = args.filter((argument) => !argument.startsWith("--"));
  const input = positional[0];
  if (!input) {
    throw new Error("A scenario JSON file is required.");
  }

  const formatIndex = args.indexOf("--format");
  const requestedFormat = formatIndex >= 0 ? args[formatIndex + 1] : "summary";
  if (!["summary", "json", "csv"].includes(requestedFormat ?? "")) {
    throw new Error(`Unsupported format "${requestedFormat}".`);
  }

  const outputIndex = args.indexOf("--out");
  const output = outputIndex >= 0 ? args[outputIndex + 1] : undefined;
  if (outputIndex >= 0 && !output) {
    throw new Error("--out requires a file path.");
  }

  return {
    input,
    format: requestedFormat as "summary" | "json" | "csv",
    ...(output ? { output } : {}),
  };
}

function summary(scenario: Scenario, result: ReturnType<typeof simulateDay>): string {
  const intervalText =
    result.intervals.length === 0
      ? "none"
      : result.intervals
          .map((interval) => `${interval.startLabel}-${interval.endLabel}`)
          .join(", ");
  return [
    `Scenario: ${scenario.name ?? "Untitled"}`,
    `Date: ${scenario.date} (${scenario.site.timeZone})`,
    `Direct sun: ${result.totalMinutes} minutes`,
    `Intervals: ${intervalText}`,
    `Aperture-weighted exposure: ${result.weightedHours.toFixed(2)} hours`,
    `Resolution: ${scenario.stepMinutes} minutes`,
  ].join("\n");
}

export async function runCli(args: string[]): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(help());
    return 0;
  }
  if (args.includes("--version") || args.includes("-v")) {
    process.stdout.write(`${version}\n`);
    return 0;
  }

  try {
    const options = parseArguments(args);
    const inputPath = resolve(options.input);
    const scenario = JSON.parse(await readFile(inputPath, "utf8")) as Scenario;
    validateScenario(scenario);
    const result = simulateDay(scenario);
    const content =
      options.format === "json"
        ? exposureToJson(scenario, result)
        : options.format === "csv"
          ? exposureToCsv(result)
          : `${summary(scenario, result)}\n`;

    if (options.output) {
      await writeFile(resolve(options.output), content, "utf8");
      process.stdout.write(`Wrote ${resolve(options.output)}\n`);
    } else {
      process.stdout.write(content);
    }
    return 0;
  } catch (error) {
    process.stderr.write(
      `sillcast: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await runCli(process.argv.slice(2));
}
