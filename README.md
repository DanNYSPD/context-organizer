<p align="center">
  <br />
  <a title="Learn more about Context Organizer" href="https://github.com/devaniljr/context-organizer"><img src="https://i.imgur.com/tttuG3d.png" alt="Context Organizer Logo" width="50%" /></a>
</p>

Tired of getting lost in projects where the files that matter are in folders far apart from each other? Context Organizer lets you organize your files by context, allowing you to navigate through your current work context in an organized way.

![context-organizer](https://github.com/devaniljr/context-organizer/assets/7834279/ef0ac99b-d361-4aa3-839c-8cf0b8eeaaf8)

## Features

### File Organization

1. **Flexible View Modes**: Choose to display folders in a tree structure or show only file names for a cleaner view:

![folder-files](https://github.com/devaniljr/context-organizer/assets/7834279/23e8ad64-86fe-48cf-932f-7c996fd972c9)

### Context Management

2. **Add to Context**: Right-click on any file in the explorer, editor tab, or within the editor and select `Add to context...` to add it to a specific context.

3. **New Context**: Click on the `New Context` button in the Context Organizer panel to create a new context for organizing related files.

4. **Rename Context**: Right-click on any context and select `Rename Context` to change its name.

5. **Remove Context**: Right-click on any context and select `Remove Context` to delete the entire context and all its file references.

### File Operations

6. **Remove from Context**: Right-click on any file within a context and select `Remove from context` to remove it from that specific context.

7. **Add to Stage**: Right-click on any file within a context and select `Add to stage` to stage the file for git commit.

8. **Add Note**: Right-click on any file within a context and select `Add Note` to attach notes or comments to specific files. Files with notes display a 📝 indicator and show the note on hover.

### Clipboard Operations

9. **Copy Context Contents**: Right-click on any context and select `Copy Context Contents to Clipboard` to copy all file contents from that context. Useful for providing context to AI tools.

10. **Copy Context Paths**: Right-click on any context and select `Copy Context Paths to clipboard` to copy all file paths in that context.

11. **Copy Relative Path**: Right-click on any file and select `Copy relative path to clipboard` to copy the file's relative path to your workspace.

## Installation

1. Open Visual Studio Code.
2. Go to Extensions.
3. Search for "Context Organizer".
4. Install the extension.

## Requirements

- VS Code version: ^1.83.0

## Extension Settings

You can configure the extension settings by changing the `.vscode/contexts.json` file in your workspace root.

### `contexts`

The file contains an object of contexts. Each context has a name (as the key) and an array of file paths (as the value) that are automatically set with the UI.

### `notes`

An optional object that stores notes for specific files. The key is the relative file path, and the value is the note text.

### `showFolders`

You can choose to show or hide the folders in the Context Organizer pane by setting the `showFolders` property to `true` or `false`.

### `orderAlphabetically`

If set to true, new files will be added in alphabetical order.

### Example `contexts.json`

```json
{
  "contexts": {
    "Frontend": [
      "src/components/Header.tsx",
      "src/components/Footer.tsx"
    ],
    "Backend": [
      "src/api/routes.ts",
      "src/api/controllers.ts"
    ]
  },
  "notes": {
    "src/components/Header.tsx": "Need to refactor this component"
  },
  "configs": {
    "showFolders": false,
    "orderAlphabetically": true
  }
}
```

## Known Issues

- Ensure the `.vscode` folder exists in your workspace root. If not, the extension will create it.

## Feedback

If you have suggestions or issues, please [open an issue](https://github.com/devaniljr/context-organizer).
