const fs = require("fs");
const path = require("path");

module.exports = {
  id: "skill-file-editor",
  name: "File Editor",
  description: "Edit and modify file contents — insert, replace, delete lines, append, prepend, find-and-replace, format, and refactor.",

  register(api) {
    api.registerTool({
      name: "replace_text",
      description:
        "Find and replace text in a file. Supports single or global replacement, " +
        "with optional regex mode. Supports dry-run preview.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path to the file to edit" },
          search: { type: "string", description: "Text or regex pattern to search for" },
          replace: { type: "string", description: "Replacement text" },
          replaceAll: { type: "boolean", description: "Replace all occurrences (default: false)" },
          useRegex: { type: "boolean", description: "Treat search as regex (default: false)" },
          dryRun: { type: "boolean", description: "Preview changes without applying (default: false)" },
        },
        required: ["filePath", "search", "replace"],
      },
      async execute(_id, params) {
        const { filePath, search, replace, replaceAll, useRegex, dryRun } = params;
        const resolved = path.resolve(filePath);

        if (!fs.existsSync(resolved)) {
          return { content: [{ type: "text", text: `Error: File not found: ${resolved}` }] };
        }

        const original = fs.readFileSync(resolved, "utf-8");
        const flags = replaceAll ? "g" : "";
        const regex = useRegex
          ? new RegExp(search, flags)
          : new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);

        const modified = original.replace(regex, replace);

        if (modified === original) {
          return { content: [{ type: "text", text: "No matches found. File unchanged." }] };
        }

        const allMatches = original.match(
          new RegExp(regex.source, regex.flags + (regex.flags.includes("g") ? "" : "g"))
        );
        const count = allMatches ? allMatches.length : 0;
        const applied = replaceAll ? count : Math.min(count, 1);

        if (dryRun) {
          return {
            content: [{
              type: "text",
              text: `[DRY RUN] Would replace ${applied} occurrence(s) of "${search}" with "${replace}" in ${resolved}.\nNo changes applied.`,
            }],
          };
        }

        fs.writeFileSync(resolved, modified, "utf-8");
        return {
          content: [{
            type: "text",
            text: `Replaced ${applied} occurrence(s) of "${search}" with "${replace}" in ${resolved}.`,
          }],
        };
      },
    });

    api.registerTool({
      name: "insert_lines",
      description:
        "Insert text at a specific line number, after a pattern match, at the beginning, or at the end of a file.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path to the file" },
          content: { type: "string", description: "Text content to insert" },
          position: {
            type: "string",
            enum: ["before_line", "after_line", "beginning", "end", "after_pattern"],
            description: "Where to insert the content",
          },
          lineNumber: { type: "number", description: "Line number (1-based) for before_line/after_line" },
          pattern: { type: "string", description: "Pattern to match for after_pattern position" },
        },
        required: ["filePath", "content", "position"],
      },
      async execute(_id, params) {
        const { filePath, content, position, lineNumber, pattern } = params;
        const resolved = path.resolve(filePath);

        if (!fs.existsSync(resolved)) {
          return { content: [{ type: "text", text: `Error: File not found: ${resolved}` }] };
        }

        const lines = fs.readFileSync(resolved, "utf-8").split("\n");
        const newLines = content.split("\n");

        switch (position) {
          case "beginning":
            lines.unshift(...newLines);
            break;
          case "end":
            lines.push(...newLines);
            break;
          case "before_line":
            if (!lineNumber || lineNumber < 1 || lineNumber > lines.length) {
              return { content: [{ type: "text", text: `Error: Invalid line number: ${lineNumber}` }] };
            }
            lines.splice(lineNumber - 1, 0, ...newLines);
            break;
          case "after_line":
            if (!lineNumber || lineNumber < 1 || lineNumber > lines.length) {
              return { content: [{ type: "text", text: `Error: Invalid line number: ${lineNumber}` }] };
            }
            lines.splice(lineNumber, 0, ...newLines);
            break;
          case "after_pattern": {
            if (!pattern) {
              return { content: [{ type: "text", text: "Error: 'pattern' is required for after_pattern position." }] };
            }
            const idx = lines.findIndex((l) => l.includes(pattern));
            if (idx === -1) {
              return { content: [{ type: "text", text: `Error: Pattern "${pattern}" not found in file.` }] };
            }
            lines.splice(idx + 1, 0, ...newLines);
            break;
          }
          default:
            return { content: [{ type: "text", text: `Error: Unknown position: ${position}` }] };
        }

        fs.writeFileSync(resolved, lines.join("\n"), "utf-8");
        return {
          content: [{
            type: "text",
            text: `Inserted ${newLines.length} line(s) at ${position}${lineNumber ? " " + lineNumber : ""}${pattern ? ' "' + pattern + '"' : ""} in ${resolved}.`,
          }],
        };
      },
    });

    api.registerTool({
      name: "delete_lines",
      description:
        "Delete specific lines from a file by line number, range, or matching pattern. Supports dry-run preview.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path to the file" },
          startLine: { type: "number", description: "Start line number (1-based)" },
          endLine: { type: "number", description: "End line number (1-based)" },
          pattern: { type: "string", description: "Delete all lines matching this pattern" },
          dryRun: { type: "boolean", description: "Preview deletions without applying (default: false)" },
        },
        required: ["filePath"],
      },
      async execute(_id, params) {
        const { filePath, startLine, endLine, pattern, dryRun } = params;
        const resolved = path.resolve(filePath);

        if (!fs.existsSync(resolved)) {
          return { content: [{ type: "text", text: `Error: File not found: ${resolved}` }] };
        }

        const lines = fs.readFileSync(resolved, "utf-8").split("\n");
        let toDelete = [];

        if (pattern) {
          toDelete = lines.map((l, i) => (l.includes(pattern) ? i : -1)).filter((i) => i !== -1);
        } else if (startLine && endLine) {
          for (let i = startLine - 1; i < Math.min(endLine, lines.length); i++) {
            toDelete.push(i);
          }
        } else {
          return { content: [{ type: "text", text: "Error: Provide either startLine+endLine or pattern." }] };
        }

        if (toDelete.length === 0) {
          return { content: [{ type: "text", text: "No lines matched. File unchanged." }] };
        }

        const preview = toDelete.map((i) => `  ${i + 1}: ${lines[i]}`).join("\n");

        if (dryRun) {
          return {
            content: [{
              type: "text",
              text: `[DRY RUN] Would delete ${toDelete.length} line(s):\n${preview}\nNo changes applied.`,
            }],
          };
        }

        const remaining = lines.filter((_, i) => !toDelete.includes(i));
        fs.writeFileSync(resolved, remaining.join("\n"), "utf-8");

        return {
          content: [{
            type: "text",
            text: `Deleted ${toDelete.length} line(s) from ${resolved}:\n${preview}`,
          }],
        };
      },
    });

    api.registerTool({
      name: "transform_file",
      description:
        "Transform file content: convert line endings, change case, or remove trailing whitespace.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path to the file" },
          action: {
            type: "string",
            enum: ["to_unix_lf", "to_windows_crlf", "to_lowercase", "to_uppercase", "trim_trailing_whitespace"],
            description: "Transformation to apply",
          },
        },
        required: ["filePath", "action"],
      },
      async execute(_id, params) {
        const { filePath, action } = params;
        const resolved = path.resolve(filePath);

        if (!fs.existsSync(resolved)) {
          return { content: [{ type: "text", text: `Error: File not found: ${resolved}` }] };
        }

        let content = fs.readFileSync(resolved, "utf-8");
        let description;

        switch (action) {
          case "to_unix_lf":
            content = content.replace(/\r\n/g, "\n");
            description = "Converted line endings to Unix (LF)";
            break;
          case "to_windows_crlf":
            content = content.replace(/\r?\n/g, "\r\n");
            description = "Converted line endings to Windows (CRLF)";
            break;
          case "to_lowercase":
            content = content.toLowerCase();
            description = "Converted content to lowercase";
            break;
          case "to_uppercase":
            content = content.toUpperCase();
            description = "Converted content to uppercase";
            break;
          case "trim_trailing_whitespace":
            content = content.split("\n").map((l) => l.trimEnd()).join("\n");
            description = "Removed trailing whitespace from all lines";
            break;
          default:
            return { content: [{ type: "text", text: `Error: Unknown action: ${action}` }] };
        }

        fs.writeFileSync(resolved, content, "utf-8");
        return { content: [{ type: "text", text: `${description} in ${resolved}.` }] };
      },
    });
  },
};
