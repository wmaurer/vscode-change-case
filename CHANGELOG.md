# Change Log

## 2.0.0 - 2026-10-17

### Added

- `pascalSnake` converts to `Foo_Bar` ([#48](https://github.com/wmaurer/vscode-change-case/issues/48), [#22](https://github.com/wmaurer/vscode-change-case/issues/22)).
- `proseTitle` converts to English title case with title-case. It keeps punctuation and does not capitalise small words such as a, of and the. It only changes letters to upper case, so for text such as `Developing A Software Renderer` or `TEST: SOMEthing`, run `lower` first ([#18](https://github.com/wmaurer/vscode-change-case/issues/18), [#28](https://github.com/wmaurer/vscode-change-case/issues/28), [#20](https://github.com/wmaurer/vscode-change-case/issues/20), [#10](https://github.com/wmaurer/vscode-change-case/issues/10), [#29](https://github.com/wmaurer/vscode-change-case/issues/29)).
- `proseSentence` capitalises the first letter of every sentence with title-case, and keeps punctuation. Like every command, it converts one line at a time, so it also capitalises the first word of each line (part of [#30](https://github.com/wmaurer/vscode-change-case/issues/30) and [#45](https://github.com/wmaurer/vscode-change-case/issues/45)).
- `sponge` converts to a random case for every character ([#41](https://github.com/wmaurer/vscode-change-case/issues/41)).
- `Change Case: Copy As...` copies the converted text to the clipboard and leaves the document as it is. A keybinding can pass the name of a command, for example `"args": "snake"` ([#37](https://github.com/wmaurer/vscode-change-case/issues/37)).
- A `Change Case` submenu in the editor context menu ([#21](https://github.com/wmaurer/vscode-change-case/issues/21)).
- The `changeCase.selectConvertedText` setting. Turn it off to put the cursor after the converted text instead of selecting it ([#31](https://github.com/wmaurer/vscode-change-case/issues/31)).
- The `changeCase.separateNumbers` and `changeCase.mergeAmbiguousCharacters` settings, which pass the change-case options of the same names ([#23](https://github.com/wmaurer/vscode-change-case/issues/23)).
- The readme explains how to run the commands and how to add keyboard shortcuts ([#34](https://github.com/wmaurer/vscode-change-case/issues/34), [#35](https://github.com/wmaurer/vscode-change-case/issues/35)).

### Changed

- Requires VS Code 1.90 or later.
- Commands are grouped under the `Change Case` category in the Command Palette, for example `Change Case: camel`. The command IDs are the same, so your keybindings keep working.
- The Command Palette lists the commands only when a text editor or a notebook cell is active ([#49](https://github.com/wmaurer/vscode-change-case/issues/49)).
- The description of `constant` says "screaming snake case". The quick pick finds it by that name when it shows descriptions, which is when there is no preview ([#38](https://github.com/wmaurer/vscode-change-case/issues/38)).
- The whitespace before and after the converted text is kept. For example, `camel` on a selected `    foo bar` gives `    fooBar`. Before, it gave `fooBar`.
- When you type in the quick pick, it also matches the description or the preview of each command.
- Uses change-case 5. For 55 test inputs, the 16 commands of version 1.0.0 give the same output as with change-case 3, the version used before.

### Fixed

- Closing the quick pick without a choice no longer causes an error.
- A command run with no open editor, or with the cursor away from any word, no longer causes an error. This includes a column selection over an empty line ([#13](https://github.com/wmaurer/vscode-change-case/issues/13), [#49](https://github.com/wmaurer/vscode-change-case/issues/49), [#12](https://github.com/wmaurer/vscode-change-case/issues/12)).
- Two cursors in the same word no longer stop the command. The word is converted once.
- A selection over several lines keeps its indentation and its line breaks, including CRLF line breaks on Linux and macOS and LF line breaks on Windows ([#52](https://github.com/wmaurer/vscode-change-case/issues/52)).
- `snake` converts kebab case text such as `some-kebab-name`, at the cursor and in a selection ([#53](https://github.com/wmaurer/vscode-change-case/issues/53)).
- The word at the cursor can contain letters outside ASCII, such as `crème-brûlée`.
- A backwards selection stays backwards after the conversion.
- The `changeCase.includeDotInCurrentWord` setting is shown in the Settings editor, and it can be set per language.
- The quick pick shows its placeholder text.

## 1.0.0

- First stable release.
