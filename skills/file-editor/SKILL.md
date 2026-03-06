---
name: file-editor
description: Edit and modify file contents — insert, replace, delete lines, append, prepend, find-and-replace, format, and refactor. Use when the user asks to edit, modify, update, fix, or change content inside a file.
---

# File Editor Skill

A skill for editing and modifying file contents, including line-level editing, find-and-replace, formatting, and content transformation.

## When to Use

- User asks to edit, modify, or update a file
- User asks to add, insert, or append content to a file
- User asks to remove or delete specific lines or content from a file
- User asks to replace text or do find-and-replace
- User asks to format or reformat a file
- User asks to merge content from multiple files
- User asks to fix or correct content in a file

## Instructions

### Before Any Edit

1. **Always read the file first** to understand its current state.
2. **Show the relevant section** that will be changed.
3. **Describe the planned change** clearly.
4. **Create a backup** for important files: `cp file file.bak` (ask user if they want this).

### Replacing Text

1. For single occurrence: use `sed -i 's/old/new/' file`
2. For all occurrences in a file: use `sed -i 's/old/new/g' file`
3. For all occurrences across multiple files: use `find . -name "pattern" -exec sed -i 's/old/new/g' {} \;`
4. **Always show a preview first** using `sed 's/old/new/g' file` (without `-i`) or `grep` the target text before modifying.

### Inserting Content

1. Insert at a specific line: `sed -i 'Ni\new content' file` (insert before line N)
2. Insert after a specific line: `sed -i 'Na\new content' file` (insert after line N)
3. Append to end of file: `echo "content" >> file`
4. Prepend to beginning: use a temp file or `sed -i '1i\new content' file`
5. Insert after a pattern match: `sed -i '/pattern/a\new content' file`

### Deleting Lines

1. Delete a specific line: `sed -i 'Nd' file` (delete line N)
2. Delete a range: `sed -i 'N,Md' file` (delete lines N through M)
3. Delete lines matching pattern: `sed -i '/pattern/d' file`
4. **Show what will be deleted first** before executing.

### Editing Code Files

1. Read and understand the file structure first.
2. Identify the exact location for changes (function, class, block).
3. For adding new functions/methods: find the appropriate insertion point.
4. For modifying existing code:
   - Show the current code block
   - Show the proposed change
   - Apply the change
   - Verify syntax if possible (e.g., `python -c "import ast; ast.parse(open('file').read())"` for Python)
5. Preserve indentation and coding style of the existing file.

### Editing Configuration Files

1. For JSON files: use `jq` for safe modifications when available, or edit with `sed`/`python`.
2. For YAML files: be careful with indentation; use `python -c "import yaml; ..."` to validate.
3. For .env files: use `sed` to update key=value pairs.
4. For INI/conf files: use `sed` to update within the correct section.
5. **Always validate the config file after editing** if a validator is available.

### Editing CSV/TSV Data Files

1. Add a column: use `awk` to insert at a position.
2. Remove a column: use `cut` or `awk`.
3. Modify values: use `awk` with conditions.
4. Add/remove rows: use `sed` or `awk`.
5. Always preserve the header row.

### Multi-File Edits

1. List all files that will be affected.
2. Show the change that will be applied to each file.
3. Get user confirmation.
4. Apply changes file by file, reporting progress.
5. Summarize all changes when done.

### Content Transformation

1. Change encoding: `iconv -f old_encoding -t new_encoding file > output`
2. Change line endings:
   - To Unix (LF): `sed -i 's/\r$//' file`
   - To Windows (CRLF): `sed -i 's/$/\r/' file`
3. Convert case: `tr '[:upper:]' '[:lower:]'` or `tr '[:lower:]' '[:upper:]'`
4. Remove trailing whitespace: `sed -i 's/[[:space:]]*$//' file`
5. Add/remove trailing newline.

## Output Format

- Show a clear diff-style output for every change made:
  ```
  - old line (removed)
  + new line (added)
  ```
- For multi-line changes, show enough context (3 lines before/after).
- After editing, show the modified section to confirm the change.
- Report total number of changes made.

## Safety Rules

- **Always read the file before editing** to understand context.
- **Show the planned change and get confirmation** for destructive edits (deletions, bulk replacements).
- **Offer to create a backup** before making significant changes.
- **Never blindly apply regex replacements** without previewing matches first.
- **Preserve file permissions and ownership** after editing.
- **Validate the file after editing** when possible (syntax check for code, schema validation for data files).
- For binary files, warn the user that text-based editing is not appropriate.
