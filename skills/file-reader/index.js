const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

module.exports = function (api) {
  api.registerTool({
    name: "read_file",
    description:
      "Read the contents of a file. Can read the full file or a specific line range for large files.",
    parameters: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Absolute or relative path to the file to read",
        },
        startLine: {
          type: "number",
          description: "Optional start line number (1-based) for partial read",
        },
        endLine: {
          type: "number",
          description: "Optional end line number (1-based) for partial read",
        },
      },
      required: ["filePath"],
    },
    async execute(_id, params) {
      const { filePath, startLine, endLine } = params;
      const resolved = path.resolve(filePath);

      if (!fs.existsSync(resolved)) {
        return { content: [{ type: "text", text: `Error: File not found: ${resolved}` }] };
      }

      const stats = fs.statSync(resolved);
      if (stats.isDirectory()) {
        return { content: [{ type: "text", text: `Error: ${resolved} is a directory, not a file.` }] };
      }

      const raw = fs.readFileSync(resolved, "utf-8");
      const lines = raw.split("\n");
      const totalLines = lines.length;

      let output;
      if (startLine || endLine) {
        const s = Math.max(1, startLine || 1);
        const e = Math.min(totalLines, endLine || totalLines);
        const slice = lines.slice(s - 1, e);
        output =
          `File: ${resolved} (lines ${s}-${e} of ${totalLines})\n` +
          slice.map((l, i) => `${s + i}: ${l}`).join("\n");
      } else if (totalLines > 500) {
        const preview = lines.slice(0, 50);
        output =
          `File: ${resolved} (${totalLines} lines — showing first 50)\n` +
          preview.map((l, i) => `${i + 1}: ${l}`).join("\n") +
          `\n\n... (${totalLines - 50} more lines. Use startLine/endLine for a specific range.)`;
      } else {
        output =
          `File: ${resolved} (${totalLines} lines)\n` +
          lines.map((l, i) => `${i + 1}: ${l}`).join("\n");
      }

      return { content: [{ type: "text", text: output }] };
    },
  });

  api.registerTool({
    name: "preview_file",
    description:
      "Preview a file: shows the first 30 lines, total line count, file type, size, and permissions.",
    parameters: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Path to the file to preview",
        },
      },
      required: ["filePath"],
    },
    async execute(_id, params) {
      const resolved = path.resolve(params.filePath);

      if (!fs.existsSync(resolved)) {
        return { content: [{ type: "text", text: `Error: File not found: ${resolved}` }] };
      }

      const stats = fs.statSync(resolved);
      const raw = fs.readFileSync(resolved, "utf-8");
      const lines = raw.split("\n");
      const preview = lines.slice(0, 30);
      const ext = path.extname(resolved);
      const sizeKB = (stats.size / 1024).toFixed(1);
      const mode = "0" + (stats.mode & parseInt("777", 8)).toString(8);

      const header = [
        `File: ${resolved}`,
        `Type: ${ext || "(no extension)"}`,
        `Size: ${sizeKB} KB`,
        `Lines: ${lines.length}`,
        `Permissions: ${mode}`,
        `Modified: ${stats.mtime.toISOString()}`,
        `---`,
      ].join("\n");

      const body = preview.map((l, i) => `${i + 1}: ${l}`).join("\n");
      const footer =
        lines.length > 30 ? `\n... (${lines.length - 30} more lines)` : "";

      return { content: [{ type: "text", text: header + "\n" + body + footer }] };
    },
  });

  api.registerTool({
    name: "search_in_file",
    description:
      "Search for a text pattern (string or regex) inside a file or directory. " +
      "Returns matching lines with line numbers and surrounding context.",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Text or regex pattern to search for",
        },
        filePath: {
          type: "string",
          description: "File or directory path to search in",
        },
        ignoreCase: {
          type: "boolean",
          description: "Case-insensitive search (default: false)",
        },
        contextLines: {
          type: "number",
          description: "Number of context lines before/after each match (default: 3)",
        },
      },
      required: ["pattern", "filePath"],
    },
    async execute(_id, params) {
      const { pattern, filePath, ignoreCase, contextLines } = params;
      const resolved = path.resolve(filePath);

      if (!fs.existsSync(resolved)) {
        return { content: [{ type: "text", text: `Error: Path not found: ${resolved}` }] };
      }

      const flags = ["-n", "--color=never"];
      if (ignoreCase) flags.push("-i");
      flags.push(`-C ${contextLines || 3}`);

      const stats = fs.statSync(resolved);
      if (stats.isDirectory()) flags.push("-r");

      try {
        const result = execSync(
          `grep ${flags.join(" ")} -- ${JSON.stringify(pattern)} ${JSON.stringify(resolved)}`,
          { encoding: "utf-8", maxBuffer: 1024 * 1024 }
        );
        return { content: [{ type: "text", text: result.trim() }] };
      } catch (err) {
        if (err.status === 1) {
          return { content: [{ type: "text", text: "No matches found." }] };
        }
        return { content: [{ type: "text", text: `Error running search: ${err.message}` }] };
      }
    },
  });

  api.registerTool({
    name: "compare_files",
    description: "Compare two files and show their differences (unified diff).",
    parameters: {
      type: "object",
      properties: {
        fileA: { type: "string", description: "Path to the first file" },
        fileB: { type: "string", description: "Path to the second file" },
      },
      required: ["fileA", "fileB"],
    },
    async execute(_id, params) {
      const a = path.resolve(params.fileA);
      const b = path.resolve(params.fileB);

      for (const f of [a, b]) {
        if (!fs.existsSync(f)) {
          return { content: [{ type: "text", text: `Error: File not found: ${f}` }] };
        }
      }

      try {
        const result = execSync(
          `diff -u ${JSON.stringify(a)} ${JSON.stringify(b)}`,
          { encoding: "utf-8", maxBuffer: 1024 * 1024 }
        );
        return { content: [{ type: "text", text: result || "Files are identical." }] };
      } catch (err) {
        if (err.status === 1 && err.stdout) {
          return { content: [{ type: "text", text: err.stdout }] };
        }
        return { content: [{ type: "text", text: `Error comparing files: ${err.message}` }] };
      }
    },
  });
};
