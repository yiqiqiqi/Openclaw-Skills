# Openclaw-Skills

OpenClaw plugin collection for file operations: reading, editing, and managing files.

## Plugins

| Plugin | ID | Tools |
|---|---|---|
| File Reader | `skill-file-reader` | `read_file`, `preview_file`, `search_in_file`, `compare_files` |
| File Editor | `skill-file-editor` | `replace_text`, `insert_lines`, `delete_lines`, `transform_file` |
| File Manager | `skill-file-manager` | `list_directory`, `create_file_or_dir`, `copy_file`, `move_file`, `delete_file`, `find_files`, `disk_usage` |

## Installation

### Method 1: openclaw plugins install (Recommended)

```bash
openclaw plugins install ./skills/file-reader
openclaw plugins install ./skills/file-editor
openclaw plugins install ./skills/file-manager
```

This installs, runs `npm install`, and enables the plugin in config automatically.

### Method 2: Manual installation

Copy each plugin folder into your OpenClaw extensions directory and run `npm install`:

```cmd
REM Windows example
xcopy /E /I "skills\file-reader" "%USERPROFILE%\.openclaw\extensions\skill-file-reader"
xcopy /E /I "skills\file-editor" "%USERPROFILE%\.openclaw\extensions\skill-file-editor"
xcopy /E /I "skills\file-manager" "%USERPROFILE%\.openclaw\extensions\skill-file-manager"

cd %USERPROFILE%\.openclaw\extensions\skill-file-reader && npm install
cd %USERPROFILE%\.openclaw\extensions\skill-file-editor && npm install
cd %USERPROFILE%\.openclaw\extensions\skill-file-manager && npm install
```

Then add plugin IDs to your OpenClaw config `plugins.allow`:

```json
{
  "plugins": {
    "allow": ["skill-file-reader", "skill-file-editor", "skill-file-manager"]
  }
}
```

Restart the gateway after installation.

## Privacy

All file operations run locally. No data is sent to external services.
