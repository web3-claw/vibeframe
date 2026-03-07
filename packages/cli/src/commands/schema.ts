/**
 * @module schema
 * @description Schema introspection command. Outputs JSON Schema for any CLI command,
 * enabling agent introspection without static docs.
 *
 * Usage: vibe schema generate.image
 *        vibe schema edit.silence-cut
 */

import { Command } from "commander";

export const schemaCommand = new Command("schema")
  .description("Show JSON schema for a CLI command")
  .argument("<command>", "Command path (e.g., generate.image, edit.silence-cut)")
  .action((commandPath: string) => {
    // Access the parent program to find commands
    const program = schemaCommand.parent;
    if (!program) {
      console.error("Schema command must be registered on a program");
      process.exit(1);
    }

    const parts = commandPath.split(".");
    if (parts.length !== 2) {
      console.error(
        `Invalid command path: ${commandPath}. Use format: group.action (e.g., generate.image)`
      );
      process.exit(1);
    }

    const [groupName, actionName] = parts;

    // Find the group command
    const groupCmd = program.commands.find(
      (c: Command) => c.name() === groupName
    );
    if (!groupCmd) {
      console.error(`Unknown group: ${groupName}`);
      console.error(
        `Available groups: ${program.commands.map((c: Command) => c.name()).join(", ")}`
      );
      process.exit(1);
    }

    // Find the action command
    const actionCmd = (groupCmd as Command).commands.find(
      (c: Command) => c.name() === actionName
    );
    if (!actionCmd) {
      console.error(`Unknown action: ${actionName} in group ${groupName}`);
      console.error(
        `Available actions: ${(groupCmd as Command).commands
          .map((c: Command) => c.name())
          .join(", ")}`
      );
      process.exit(1);
    }

    // Build JSON schema from Commander options and arguments
    const toolName = `${groupName}_${actionName.replace(/-/g, "_")}`;
    const schema = buildSchema(actionCmd as Command, toolName);
    console.log(JSON.stringify(schema, null, 2));
  });

function buildSchema(
  cmd: Command,
  toolName: string
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  // Extract arguments
  for (const arg of cmd.registeredArguments || []) {
    const name = arg.name();
    properties[name] = {
      type: "string",
      description: arg.description,
    };
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

    // Detect type from default value or flags
    if (
      opt.flags.includes("<number>") ||
      opt.flags.includes("<seconds>") ||
      opt.flags.includes("<sec>") ||
      opt.flags.includes("<dB>") ||
      opt.flags.includes("<pixels>")
    ) {
      prop.type = "number";
    } else if (opt.flags.includes("<") && opt.flags.includes(">")) {
      prop.type = "string";
    } else {
      prop.type = "boolean";
    }

    if (opt.defaultValue !== undefined) {
      prop.default = opt.defaultValue;
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
