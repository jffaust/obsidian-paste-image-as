This is a plugin that provides an alternative to the built-in behavior of Obsidian where an image in the clipboard will be pasted as a PNG.

This plugin will provide two alternative formats: JPEG and WebP. For each alternative format, appropriate settings will be exposed in the plugin's Settings as to control the quality of the image/level of compression.

The plugin settings will also include a dropdown to choose which format to use when pasting.

Finally, the plugin will also add an Obsidian Command to invoke the action of pasting from Clipboard into the current context (markdown note or json canvas). The user will be free to set the keyboard shortcut that they want using Obsidian's built-in command hotkey assignments.

## Notes

- Refer to `AGENTS.md` for AI-specific instructions on how to develop Obsidian plugins
- The project uses pnpm to manage libraries
