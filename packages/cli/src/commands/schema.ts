/**
 * @module schema
 * @description Schema introspection command. Outputs JSON Schema for any CLI command,
 * enabling agent introspection without static docs.
 *
 * Usage: vibe schema generate.image
 *        vibe schema edit.silence-cut
 *        vibe schema --list
 */

import { Command } from "commander";
import { exitWithError, generalError, usageError } from "./output.js";

export const schemaCommand = new Command("schema")
  .description("Show JSON schema for a CLI command")
  .argument("[command]", "Command path (e.g., generate.image, edit.silence-cut)")
  .option("--list", "List all available command paths")
  .action((commandPath: string | undefined, options: { list?: boolean }) => {
    const program = schemaCommand.parent;
    if (!program) {
      exitWithError(generalError("Schema command must be registered on a program"));
    }

    if (options.list || !commandPath) {
      listCommands(program);
      return;
    }

    const parts = commandPath.split(".");

    if (parts.length === 1) {
      // Single command (e.g., "export", "setup", "doctor")
      const cmd = program.commands.find(
        (c: Command) => c.name() === parts[0]
      );
      if (!cmd) {
        exitWithError(usageError(`Unknown command: ${parts[0]}`, `Run 'vibe schema --list' to see all available commands.`));
      }
      const schema = buildSchema(cmd as Command, parts[0]);
      console.log(JSON.stringify(schema, null, 2));
      return;
    }

    if (parts.length !== 2) {
      exitWithError(usageError(
        `Invalid command path: ${commandPath}. Use format: group.action (e.g., generate.image)`,
        `Run 'vibe schema --list' to see all available commands.`
      ));
    }

    const [groupName, actionName] = parts;

    const groupCmd = program.commands.find(
      (c: Command) => c.name() === groupName
    );
    if (!groupCmd) {
      const availableGroups = program.commands
        .filter((c: Command) => (c as Command).commands.length > 0)
        .map((c: Command) => c.name())
        .join(", ");
      exitWithError(usageError(`Unknown group: ${groupName}`, `Available groups: ${availableGroups}`));
    }

    const actionCmd = (groupCmd as Command).commands.find(
      (c: Command) => c.name() === actionName
    );
    if (!actionCmd) {
      const availableActions = (groupCmd as Command).commands
        .map((c: Command) => c.name())
        .join(", ");
      exitWithError(usageError(`Unknown action: ${actionName} in group ${groupName}`, `Available actions: ${availableActions}`));
    }

    const toolName = `${groupName}_${actionName.replace(/-/g, "_")}`;
    const schema = buildSchema(actionCmd as Command, toolName);
    console.log(JSON.stringify(schema, null, 2));
  });

function listCommands(program: Command): void {
  const commands: { path: string; description: string }[] = [];
  const skipTopLevel = new Set(["help", "schema"]);

  for (const group of program.commands) {
    const name = group.name();
    if (skipTopLevel.has(name)) continue;

    const subCmds = (group as Command).commands;
    if (subCmds.length === 0) {
      // Top-level command without subcommands (e.g., export, setup, doctor)
      const desc = (group as Command).description() || "";
      if (desc.toLowerCase().includes("deprecated")) continue;
      commands.push({ path: name, description: desc });
      continue;
    }

    for (const sub of subCmds) {
      const desc = (sub as Command).description() || "";
      if (desc.toLowerCase().includes("deprecated")) continue;
      commands.push({
        path: `${name}.${(sub as Command).name()}`,
        description: desc,
      });
    }
  }

  console.log(JSON.stringify(commands, null, 2));
}

function extractEnumFromDescription(description: string): string[] | undefined {
  // Match patterns like "Provider: gemini, openai, grok, runway"
  const providerMatch = description.match(
    /(?:Provider|Providers?):\s*([a-z0-9,\s-]+?)(?:\s*\(|$)/i
  );
  if (providerMatch) {
    return providerMatch[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Match patterns like "Style: vivid, natural"
  const styleMatch = description.match(
    /^[A-Z][a-z]+:\s*([a-z0-9,\s-]+?)(?:\s*\(|$)/
  );
  if (styleMatch) {
    const values = styleMatch[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (values.length >= 2 && values.length <= 10) return values;
  }

  return undefined;
}

function inferType(
  opt: { flags: string; defaultValue?: unknown },
  name: string
): string {
  // Check flags for numeric hints
  const numericFlags = [
    "<number>",
    "<seconds>",
    "<sec>",
    "<dB>",
    "<pixels>",
    "<ms>",
    "<n>",
    "<count>",
    "<duration>",
  ];
  if (numericFlags.some((f) => opt.flags.includes(f))) {
    return "number";
  }

  // Check name for numeric hints
  const numericNames = [
    "count",
    "duration",
    "retries",
    "fadeIn",
    "fadeOut",
    "start",
    "end",
    "time",
    "threshold",
    "padding",
    "pageSize",
    "maxResults",
    "fps",
    "bitrate",
    "width",
    "height",
  ];
  if (numericNames.includes(name)) {
    return "number";
  }

  // Check default value type
  if (typeof opt.defaultValue === "number") return "number";
  if (typeof opt.defaultValue === "boolean") return "boolean";

  // Boolean flags (no value argument)
  if (opt.flags.includes("<") && opt.flags.includes(">")) {
    return "string";
  }

  return "boolean";
}

function buildSchema(
  cmd: Command,
  toolName: string
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  // Extract arguments
  for (const arg of cmd.registeredArguments || []) {
    const name = arg.name();
    const prop: Record<string, unknown> = {
      type: "string",
      description: arg.description,
    };

    if (arg.variadic) {
      prop.type = "array";
      prop.items = { type: "string" };
    }

    properties[name] = prop;
    if (arg.required) {
      required.push(name);
    }
  }

  // Extract options
  for (const opt of cmd.options) {
    const name = camelCase(
      opt.long?.replace(/^--/, "") || opt.short?.replace(/^-/, "") || ""
    );
    if (!name || name === "help") continue;

    const prop: Record<string, unknown> = {
      description: opt.description,
    };

    // Infer type
    prop.type = inferType(
      { flags: opt.flags, defaultValue: opt.defaultValue },
      name
    );

    // Extract enum values from description
    if (opt.description) {
      const enumValues = extractEnumFromDescription(opt.description);
      if (enumValues) {
        prop.enum = enumValues;
      }
    }

    // Default value
    if (opt.defaultValue !== undefined) {
      prop.default = opt.defaultValue;
      // Fix stringified numbers
      if (prop.type === "number" && typeof opt.defaultValue === "string") {
        const num = Number(opt.defaultValue);
        if (!isNaN(num)) prop.default = num;
      }
    }

    properties[name] = prop;
  }

  return {
    name: toolName,
    description: cmd.description(),
    parameters: {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    },
  };
}

function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
