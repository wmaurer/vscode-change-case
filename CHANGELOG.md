# Change Log

## [Unreleased]

### Changed

- Requires VS Code 1.90 or later.
- Commands are grouped under the `Change Case` category in the Command Palette, for example `Change Case: camel`. The command IDs are the same, so your keybindings keep working.
- Uses change-case 5. The output of every command is the same as with change-case 3, the version used before.

### Fixed

- Closing the quick pick without a choice no longer causes an error.
- A command run with no open editor, or with the cursor away from any word, no longer causes an error.
- Two cursors in the same word no longer stop the command. The word is converted once.
- A selection over several lines keeps its indentation and its line breaks, including CRLF line breaks on Linux and macOS and LF line breaks on Windows.
- The word at the cursor can contain letters outside ASCII, such as `crème-brûlée`.
- A backwards selection stays backwards after the conversion.
- The `changeCase.includeDotInCurrentWord` setting is shown in the Settings editor, and it can be set per language.
- The quick pick shows its placeholder text.

## 1.0.0

- First stable release.
