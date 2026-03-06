---
name: file-reader
description: Read, preview, and analyze files. Supports text files, code, logs, CSV, JSON, YAML, and more. Use when the user asks to read, view, preview, check, or analyze file contents.
---

# File Reader Skill

A skill for reading, previewing, and analyzing files of various types.

## When to Use

- User asks to read, view, or show a file
- User asks to preview or check file contents
- User asks to analyze, summarize, or explain a file
- User wants to compare two files
- User wants to search for content inside files

## Supported File Types

- Plain text files (.txt, .log, .md, .rst)
- Code files (.py, .js, .ts, .go, .java, .c, .cpp, .rs, .rb, .sh, .sql, etc.)
- Data files (.json, .yaml, .yml, .toml, .xml, .csv, .tsv)
- Config files (.env, .ini, .conf, .cfg, .properties)
- Markup files (.html, .css, .svg)

## Instructions

### Reading a Single File

1. Confirm the file path provided by the user. If only a filename is given, search for it in the current working directory and common subdirectories.
2. Check if the file exists using `ls` or `test -f`.
3. If the file exists, use `cat` to display its contents.
4. For very large files (over 500 lines), ask the user whether to:
   - Show the first N lines (`head -n`)
   - Show the last N lines (`tail -n`)
   - Show a specific line range (`sed -n 'start,end p'`)
   - Search for specific content (`grep`)

### Previewing a File

1. Use `head -n 30` to show the first 30 lines as a preview.
2. Use `wc -l` to report the total line count.
3. Use `file` command to identify file type.
4. Use `ls -lh` to show file size and permissions.

### Analyzing a File

1. Read the file contents.
2. Report:
   - File type and encoding
   - Total lines and size
   - For code files: language, key structures (functions, classes, imports)
   - For data files: schema/structure, number of records
   - For log files: error/warning counts, time range
3. Provide a brief summary of what the file contains and its purpose.

### Comparing Two Files

1. Confirm both file paths.
2. Use `diff` to show differences between files.
3. Summarize the key differences in plain language.

### Searching File Contents

1. Use `grep -n` to search with line numbers.
2. Use `grep -i` for case-insensitive search.
3. Use `grep -r` for recursive search across directories.
4. Report matches with surrounding context using `grep -C 3`.

## Output Format

- Always show the file path at the top of the output.
- Use code blocks with appropriate language tags for syntax highlighting.
- For large outputs, paginate or truncate with clear indicators.
- Include line numbers when referencing specific parts of a file.

## Safety Rules

- Never read files outside the user's workspace unless explicitly authorized.
- Warn the user if a file appears to contain sensitive data (passwords, tokens, keys).
- Do not modify any files — this skill is read-only.
