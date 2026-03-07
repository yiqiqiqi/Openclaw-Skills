const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

module.exports = {
  id: "skill-file-manager",
  name: "File Manager",
  description: "Manage files and directories — create, copy, move, rename, delete, organize, find, and list.",

  register(api) {
    api.registerTool({
      name: "list_directory",
      description:
        "List files and directories at a given path with details (size, permissions, modification date). " +
        "Supports sorting by name, size, time, or extension.",
      parameters: {
        type: "object",
        properties: {
          dirPath: {
            type: "string",
            description: "Path to the directory to list (default: current directory)",
          },
          sortBy: {
            type: "string",
            enum: ["name", "size", "time", "extension"],
            description: "Sort order (default: name)",
          },
          showTree: {
            type: "boolean",
            description: "Show directory tree structure (default: false)",
          },
          depth: {
            type: "number",
            description: "Max depth for tree view (default: 2)",
          },
        },
        required: [],
      },
      async execute(_id, params) {
        const dir = path.resolve(params.dirPath || ".");

        if (!fs.existsSync(dir)) {
          return { content: [{ type: "text", text: `Error: Directory not found: ${dir}` }] };
        }

        if (params.showTree) {
          const depth = params.depth || 2;
          try {
            const result = execSync(`tree -L ${depth} ${JSON.stringify(dir)}`, {
              encoding: "utf-8",
            });
            return { content: [{ type: "text", text: result }] };
          } catch {
            const result = execSync(
              `find ${JSON.stringify(dir)} -maxdepth ${depth} | head -100`,
              { encoding: "utf-8" }
            );
            return { content: [{ type: "text", text: result }] };
          }
        }

        const sortFlags = { name: "", size: "-S", time: "-t", extension: "-X" };
        const flag = sortFlags[params.sortBy] || "";
        const result = execSync(`ls -lah ${flag} ${JSON.stringify(dir)}`, {
          encoding: "utf-8",
        });
        return { content: [{ type: "text", text: `Directory: ${dir}\n\n${result}` }] };
      },
    });

    api.registerTool({
      name: "create_file_or_dir",
      description:
        "Create a new file (optionally with content) or directory. Creates parent directories automatically.",
      parameters: {
        type: "object",
        properties: {
          targetPath: {
            type: "string",
            description: "Path to the file or directory to create",
          },
          isDirectory: {
            type: "boolean",
            description: "If true, create a directory; otherwise create a file (default: false)",
          },
          content: {
            type: "string",
            description: "Initial content for the file (ignored if isDirectory is true)",
          },
        },
        required: ["targetPath"],
      },
      async execute(_id, params) {
        const target = path.resolve(params.targetPath);

        if (fs.existsSync(target)) {
          return { content: [{ type: "text", text: `Warning: Already exists: ${target}` }] };
        }

        if (params.isDirectory) {
          fs.mkdirSync(target, { recursive: true });
          return { content: [{ type: "text", text: `Directory created: ${target}` }] };
        }

        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, params.content || "", "utf-8");
        return { content: [{ type: "text", text: `File created: ${target}` }] };
      },
    });

    api.registerTool({
      name: "copy_file",
      description: "Copy a file or directory to a new location. Warns if the destination already exists.",
      parameters: {
        type: "object",
        properties: {
          source: { type: "string", description: "Source path" },
          destination: { type: "string", description: "Destination path" },
        },
        required: ["source", "destination"],
      },
      async execute(_id, params) {
        const src = path.resolve(params.source);
        const dst = path.resolve(params.destination);

        if (!fs.existsSync(src)) {
          return { content: [{ type: "text", text: `Error: Source not found: ${src}` }] };
        }
        if (fs.existsSync(dst)) {
          return {
            content: [{ type: "text", text: `Warning: Destination already exists: ${dst}. Overwrite not performed.` }],
          };
        }

        const isDir = fs.statSync(src).isDirectory();
        execSync(
          `cp ${isDir ? "-r" : ""} ${JSON.stringify(src)} ${JSON.stringify(dst)}`,
          { encoding: "utf-8" }
        );
        return { content: [{ type: "text", text: `Copied ${src} → ${dst}` }] };
      },
    });

    api.registerTool({
      name: "move_file",
      description: "Move or rename a file or directory. Warns if the destination already exists.",
      parameters: {
        type: "object",
        properties: {
          source: { type: "string", description: "Source path" },
          destination: { type: "string", description: "Destination path" },
        },
        required: ["source", "destination"],
      },
      async execute(_id, params) {
        const src = path.resolve(params.source);
        const dst = path.resolve(params.destination);

        if (!fs.existsSync(src)) {
          return { content: [{ type: "text", text: `Error: Source not found: ${src}` }] };
        }
        if (fs.existsSync(dst)) {
          return {
            content: [{ type: "text", text: `Warning: Destination already exists: ${dst}. Move not performed.` }],
          };
        }

        fs.renameSync(src, dst);
        return { content: [{ type: "text", text: `Moved ${src} → ${dst}` }] };
      },
    });

    api.registerTool({
      name: "delete_file",
      description:
        "Delete a file or directory. Requires the 'confirm' flag set to true as a safety measure.",
      parameters: {
        type: "object",
        properties: {
          targetPath: {
            type: "string",
            description: "Path to the file or directory to delete",
          },
          confirm: {
            type: "boolean",
            description: "Must be true to confirm deletion",
          },
        },
        required: ["targetPath", "confirm"],
      },
      async execute(_id, params) {
        const target = path.resolve(params.targetPath);

        if (!params.confirm) {
          return { content: [{ type: "text", text: "Deletion aborted: 'confirm' must be set to true." }] };
        }

        const forbidden = ["/", "/etc", "/usr", "/bin", "/var", "/home", "/root", "/sys", "/proc"];
        if (forbidden.includes(target)) {
          return { content: [{ type: "text", text: `Error: Refusing to delete system directory: ${target}` }] };
        }

        if (!fs.existsSync(target)) {
          return { content: [{ type: "text", text: `Error: Not found: ${target}` }] };
        }

        const stats = fs.statSync(target);
        if (stats.isDirectory()) {
          fs.rmSync(target, { recursive: true });
        } else {
          fs.unlinkSync(target);
        }

        return { content: [{ type: "text", text: `Deleted: ${target}` }] };
      },
    });

    api.registerTool({
      name: "find_files",
      description: "Find files matching criteria: name pattern, extension, size, or modification time.",
      parameters: {
        type: "object",
        properties: {
          dirPath: {
            type: "string",
            description: "Directory to search in (default: current directory)",
          },
          namePattern: {
            type: "string",
            description: "Glob pattern for file name (e.g. '*.js', 'README*')",
          },
          minSize: {
            type: "string",
            description: "Minimum file size (e.g. '10M', '1k')",
          },
          modifiedWithinDays: {
            type: "number",
            description: "Files modified within the last N days",
          },
        },
        required: [],
      },
      async execute(_id, params) {
        const dir = path.resolve(params.dirPath || ".");
        const args = [JSON.stringify(dir)];

        if (params.namePattern) {
          args.push(`-name ${JSON.stringify(params.namePattern)}`);
        }
        if (params.minSize) {
          args.push(`-size +${params.minSize}`);
        }
        if (params.modifiedWithinDays) {
          args.push(`-mtime -${params.modifiedWithinDays}`);
        }

        try {
          const result = execSync(`find ${args.join(" ")} | head -200`, {
            encoding: "utf-8",
          });
          return { content: [{ type: "text", text: result.trim() || "No files found." }] };
        } catch (err) {
          return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
      },
    });

    api.registerTool({
      name: "disk_usage",
      description: "Show disk usage for a directory, list largest files, or check free disk space.",
      parameters: {
        type: "object",
        properties: {
          dirPath: {
            type: "string",
            description: "Directory to check (default: current directory)",
          },
          showLargest: {
            type: "boolean",
            description: "Show the 20 largest files (default: false)",
          },
          showFreeSpace: {
            type: "boolean",
            description: "Show free disk space (default: false)",
          },
        },
        required: [],
      },
      async execute(_id, params) {
        const dir = path.resolve(params.dirPath || ".");
        const parts = [];

        parts.push(execSync(`du -sh ${JSON.stringify(dir)}`, { encoding: "utf-8" }).trim());

        if (params.showLargest) {
          const largest = execSync(
            `du -ah ${JSON.stringify(dir)} | sort -rh | head -20`,
            { encoding: "utf-8" }
          );
          parts.push("\nLargest entries:\n" + largest.trim());
        }

        if (params.showFreeSpace) {
          const df = execSync("df -h .", { encoding: "utf-8" });
          parts.push("\nDisk free space:\n" + df.trim());
        }

        return { content: [{ type: "text", text: parts.join("\n") }] };
      },
    });
  },
};
