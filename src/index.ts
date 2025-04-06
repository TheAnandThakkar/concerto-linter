import * as fs from "fs";
import * as path from "path";
import { Spectral } from "@stoplight/spectral-core";
import { ruleset } from "./rules";

/**
 * Loads the configuration file for enabled rules.
 */
function loadConfig(): any {
  const configPath = path.join(__dirname, "../config.json");
  try {
    const configContent = fs.readFileSync(configPath, "utf8");
    return JSON.parse(configContent);
  } catch (error) {
    console.error(
      "Could not load config.json. Using default configuration.",
      error
    );
    return { enabledRules: {} };
  }
}

/**
 * Filters the full ruleset based on the configuration.
 */
function filterRuleset(
  ruleset: any,
  enabledRules: Record<string, boolean>
): any {
  const filtered = { ...ruleset };
  filtered.rules = Object.keys(ruleset.rules)
    .filter((ruleName) => enabledRules[ruleName] !== false) // default: enabled unless explicitly disabled
    .reduce((acc: any, ruleName: string) => {
      acc[ruleName] = ruleset.rules[ruleName];
      return acc;
    }, {});
  return filtered;
}

async function runLinter() {
  const config = loadConfig();
  const filePath = path.join(__dirname, "../sample.concerto.json");
  const fileContent = fs.readFileSync(filePath, "utf8");
  let data: any;

  try {
    data = JSON.parse(fileContent);
  } catch (error) {
    console.error("Error parsing sample.concerto.json:", error);
    return;
  }

  const spectral = new Spectral();
  const activeRuleset = filterRuleset(ruleset, config.enabledRules);
  spectral.setRuleset(activeRuleset);

  const results = await spectral.run(data);
  console.log("Linting results:");
  if (results.length === 0) {
    console.log("No issues found.");
  } else {
    results.forEach((result) => {
      console.log(`Path: ${result.path.join(".")}, Message: ${result.message}`);
    });
  }
}

runLinter();
