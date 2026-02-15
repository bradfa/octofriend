import { t } from "structural";
import { fileTracker } from "../file-tracker.ts";
import { attempt, attemptUntrackedStat, defineTool } from "../common.ts";

const ArgumentsSchema = t.subtype({
  filePath: t.str.comment("Path to file to read"),
  offset: t.optional(t.num.comment("Starting line number (1-indexed) to read from")),
  limit: t.optional(t.num.comment("Maximum number of lines to read")),
});
const Schema = t
  .subtype({
    name: t.value("read"),
    arguments: ArgumentsSchema,
  })
  .comment(
    `Reads file contents as UTF-8. Prefer this to Unix tools like \`cat\`.

Use offset and limit when you only need to see a specific section of a large file
that you've already located via grep or other tools. This is more efficient than
reading the entire file into context.`,
  );

export default defineTool<t.GetType<typeof Schema>>(async () => ({
  Schema,
  ArgumentsSchema,
  async validate(abortSignal, transport, toolCall) {
    await attemptUntrackedStat(transport, abortSignal, toolCall.arguments.filePath);
    return null;
  },
  async run(abortSignal, transport, call) {
    const { filePath } = call.arguments;
    const offset = call.arguments?.offset;
    const limit = call.arguments?.limit;

    return attempt(`No such file ${filePath}`, async () => {
      const fullContent = await fileTracker.read(transport, abortSignal, filePath);
      const allLines = fullContent.split("\n");

      let content = fullContent;
      if (offset !== undefined) {
        const start = Math.max(0, offset - 1);
        const end = limit !== undefined ? start + limit : undefined;
        content = allLines.slice(start, end).join("\n");
      } else if (limit !== undefined) {
        content = allLines.slice(0, limit).join("\n");
      }

      return {
        content,
        lines: content.split("\n").length,
      };
    });
  },
}));
