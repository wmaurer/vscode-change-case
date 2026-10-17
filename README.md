# Change Case Extension for Visual Studio Code

A wrapper around [change-case](https://github.com/blakeembrey/change-case) for Visual Studio Code.
Quickly change the case of the current selection or current word.

If only one word is selected, the `extension.changeCase.commands` command gives you a preview of each option:

![change-case-preview](https://cloud.githubusercontent.com/assets/2899448/10712456/3c5e29b6-7a9c-11e5-9ce4-7eb944889696.gif)

`change-case` also works with multiple cursors:

![change-case-multi](https://cloud.githubusercontent.com/assets/2899448/10712454/1a9019e8-7a9c-11e5-8f06-91fd2d7e21bf.gif)

_Note:_ Please read the [documentation](https://code.visualstudio.com/docs/editor/codebasics#_multiple-selections-multicursor) on how to use multiple cursors in Visual Studio Code.

## Install

Launch VS Code Quick Open (Ctrl/Cmd+P), paste the following command, and press enter.

```
ext install wmaurer.change-case
```

## How it works

- With a selection, the command converts the selected text. A selection over several lines is converted one line at a time, and the line breaks and the indentation stay as they are.
- With a cursor and no selection, the command converts the word at the cursor, and then selects it. A word here can contain `-`, `_`, `/` and `$`, so `some-value` converts as one word.
- With several cursors or selections, the command converts each one, and one undo reverts them all.

## Commands

In the Command Palette, each command is listed as `Change Case: <name>`.

- `extension.changeCase.commands`: List all Change Case commands, with a preview if only one word is selected
- `extension.changeCase.camel`: Convert to a string with the separators denoted by having the next letter capitalised
- `extension.changeCase.constant`: Convert to an upper case, underscore separated string
- `extension.changeCase.dot`: Convert to a lower case, period separated string
- `extension.changeCase.kebab`: Convert to a lower case, dash separated string (alias for param case)
- `extension.changeCase.lower`: Convert to a string in lower case
- `extension.changeCase.lowerFirst`: Convert to a string with the first character lower cased
- `extension.changeCase.no`: Convert the string without any casing (lower case, space separated)
- `extension.changeCase.param`: Convert to a lower case, dash separated string
- `extension.changeCase.pascal`: Convert to a string denoted in the same fashion as camelCase, but with the first letter also capitalised
- `extension.changeCase.path`: Convert to a lower case, slash separated string
- `extension.changeCase.sentence`: Convert to a lower case, space separated string
- `extension.changeCase.snake`: Convert to a lower case, underscore separated string
- `extension.changeCase.swap`: Convert to a string with every character case reversed
- `extension.changeCase.title`: Convert to a space separated string with the first character of every word upper cased
- `extension.changeCase.upper`: Convert to a string in upper case
- `extension.changeCase.upperFirst`: Convert to a string with the first character upper cased

## Settings

- `changeCase.includeDotInCurrentWord` (default `false`): When a command runs on the word at the cursor, treat dots as part of the word. You can set it per language, for example `"[properties]": { "changeCase.includeDotInCurrentWord": true }`.

## Development

Requires Node.js 22.18 or later and pnpm 10.

```bash
pnpm install
pnpm test        # builds the tests and runs them in a downloaded copy of VS Code
pnpm typecheck   # tsc -b
pnpm lint        # oxlint, type-aware
pnpm fmt:check   # oxfmt
pnpm vsix        # builds change-case-<version>.vsix
```

Press F5 in VS Code to start an Extension Development Host with the extension loaded.

## Support

[Create an issue](https://github.com/wmaurer/vscode-change-case/issues).
