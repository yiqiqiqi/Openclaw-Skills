---
name: file-manager
description: Manage files and directories — create, copy, move, rename, delete, organize, find, and list. Use when the user asks to manage, organize, create, copy, move, rename, or delete files and folders.
---

# File Manager Skill

A skill for performing file system operations including creating, copying, moving, renaming, deleting, and organizing files and directories.

## When to Use

- User asks to create files or directories
- User asks to copy, move, or rename files
- User asks to delete files or directories
- User asks to organize or sort files
- User asks to find files by name, type, size, or date
- User asks to list directory contents
- User asks to check disk usage or file sizes
- User asks to change file permissions

## Instructions

### Listing Directory Contents

1. Use `ls -la` to show all files with details (permissions, size, date).
2. Use `ls -lah` to show human-readable file sizes.
3. Use `tree -L 2` to show directory structure (if `tree` is available, otherwise use `find . -maxdepth 2 -type f`).
4. Sort options:
   - By name: `ls -la` (default)
   - By size: `ls -laS`
   - By time: `ls -lat`
   - By extension: `ls -laX`

### Creating Files and Directories

1. Create directories with `mkdir -p` (supports nested paths).
2. Create empty files with `touch`.
3. Create files with content using `cat > file << 'EOF'`.
4. Always confirm the target path before creating.

### Copying Files

1. Copy a file: `cp source destination`
2. Copy a directory recursively: `cp -r source destination`
3. Copy preserving attributes: `cp -a source destination`
4. **Before copying, check if the destination already exists** and warn the user to avoid overwriting.

### Moving / Renaming Files

1. Move or rename: `mv source destination`
2. For batch renaming, use a loop or `rename` command.
3. **Before moving, check if the destination already exists** and warn the user.

### Deleting Files and Directories

1. **Always confirm with the user before deleting anything.**
2. Delete a file: `rm file`
3. Delete a directory: `rm -r directory`
4. **Never use `rm -rf /` or any wildcard delete on system directories.**
5. For safer deletion, list what will be deleted first, then ask for confirmation.
6. Consider moving to a trash directory instead of permanent deletion when appropriate.

### Finding Files

1. Find by name: `find . -name "pattern"`
2. Find by extension: `find . -name "*.ext"`
3. Find by size: `find . -size +10M` (files larger than 10MB)
4. Find by modification time: `find . -mtime -7` (modified in last 7 days)
5. Find empty files/dirs: `find . -empty`
6. Find and list with details: `find . -name "pattern" -exec ls -lh {} \;`

### Organizing Files

1. Ask the user for the organization strategy:
   - By file type/extension
   - By date (year/month)
   - By size
   - Custom categories
2. Show the proposed organization plan before executing.
3. Create target directories first, then move files.
4. Report a summary of what was moved.

### Checking Disk Usage

1. Directory size: `du -sh directory`
2. Top largest files: `du -ah . | sort -rh | head -20`
3. Disk free space: `df -h`

### File Permissions

1. View permissions: `ls -la file`
2. Change permissions: `chmod` (explain the permission being set)
3. Change ownership: `chown` (requires appropriate privileges)

### Batch Operations

1. For batch operations, always:
   - Show the list of files that will be affected
   - Show the exact operations that will be performed
   - Ask for user confirmation before executing
2. Use dry-run when possible (e.g., `rsync --dry-run`)

## Output Format

- Show clear before/after state for move and rename operations.
- Use tables or lists for directory listings.
- Show progress for batch operations.
- Always confirm the result of the operation with `ls` or similar.

## Safety Rules

- **Always confirm before deleting files or directories.**
- **Never operate on system directories** (/etc, /usr, /bin, /var, etc.) unless explicitly authorized.
- **Check for existing files** before copy/move to prevent accidental overwrites.
- **Never use force flags** (rm -rf, cp -f) without explicit user approval.
- Keep operations within the user's workspace by default.
- For large batch operations, show a preview and get confirmation first.
