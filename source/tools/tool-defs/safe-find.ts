import { t } from "structural";
import { ToolError, defineTool } from "../common.ts";
import { Transport } from "../../transports/transport-common.ts";

const ALLOWED_PATTERN = /^[a-zA-Z0-9._*?[\]-]*$/;

const ArgumentsSchema = t.subtype({
  dirPath: t.optional(t.str.comment("Relative directory path within the working directory")),
  pattern: t.optional(t.str.comment("Filename pattern (* and ? wildcards only)")),
  type: t.optional(t.str.comment("File type: f=file, d=directory, l=symlink")),
  maxDepth: t.optional(t.num.comment("Max depth (default 5)")),
  maxResults: t.optional(t.num.comment("Max results (default 100)")),
});

const Schema = t
  .subtype({
    name: t.value("safe-find"),
    arguments: ArgumentsSchema,
  })
  .comment("Search files safely - restricted to working directory with limited features");

function validateRelativePath(path: string | undefined): void {
  if (!path || path === "." || path === "./") return;

  if (path.startsWith("/") || path.startsWith("~")) {
    throw new ToolError("Only relative paths within working directory allowed");
  }

  if (path.includes("..") || path.includes("//")) {
    throw new ToolError("Cannot use .. or // in path");
  }

  if (!ALLOWED_PATTERN.test(path)) {
    throw new ToolError("Invalid characters in path");
  }
}

function validatePattern(pattern: string): void {
  if (!ALLOWED_PATTERN.test(pattern)) {
    throw new ToolError("Invalid characters in pattern - only * ? [ ] and alphanumerics allowed");
  }
}

function validateType(type: string): void {
  const validTypes = new Set(["f", "d", "l"]);
  if (!validTypes.has(type)) {
    throw new ToolError("Invalid file type - must be f (file), d (directory), or l (symlink)");
  }
}

export default defineTool<t.GetType<typeof Schema>>(async () => ({
  Schema,
  ArgumentsSchema,
  validate: async () => null,
  async run(abortSignal, transport, call) {
    const args = call.arguments || {};
    validateRelativePath(args["dirPath"]);
    if (args["pattern"]) validatePattern(args["pattern"]);
    if (args["type"]) validateType(args["type"]);

    const searchPath = args["dirPath"] || ".";
    const maxDepth = args["maxDepth"] || 5;
    const maxResults = args["maxResults"] || 100;

    const cmdParts = ["find", searchPath, "-xdev", "-maxdepth", String(maxDepth)];

    if (args["pattern"]) {
      cmdParts.push("-name", args["pattern"]);
    }
    if (args["type"]) {
      cmdParts.push("-type", args["type"]);
    }

    cmdParts.push("-print0");

    const cmd = cmdParts.map(arg => `'${arg}'`).join(" ");

    const output = await transport.shell(abortSignal, cmd, 15000);

    const results = output
      .split("\0")
      .filter(s => s)
      .slice(0, maxResults);
    return { content: results.join("\n"), lines: results.length };
  },
}));
