# Change Case Extension for Visual Studio Code

A wrapper around [change-case](https://github.com/blakeembrey/change-case) for Visual Studio Code.
Quickly change the case of the current selection or current word.

With one cursor, or one selection on one line, the `Change Case: Commands` quick pick shows a preview of each option:

![change-case-preview](https://cloud.githubusercontent.com/assets/2899448/10712456/3c5e29b6-7a9c-11e5-9ce4-7eb944889696.gif)

`change-case` also works with multiple cursors:

![change-case-multi](https://cloud.githubusercontent.com/assets/2899448/10712454/1a9019e8-7a9c-11e5-8f06-91fd2d7e21bf.gif)

_Note:_ Please read the [documentation](https://code.visualstudio.com/docs/editor/codebasics#_multiple-selections-multicursor) on how to use multiple cursors in Visual Studio Code.

## Install

Install it from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=wmaurer.change-case). Or, in VS Code 1.90 or later, launch Quick Open (Ctrl/Cmd+P), paste the following command, and press enter.

```
ext install wmaurer.change-case
```

## How it works

- With a selection, the command converts the selected text. A selection over several lines is converted one line at a time, and the line breaks and the indentation stay as they are.
- With a cursor and no selection, the command converts the word at the cursor, and then selects it. A word here can contain `-`, `_`, `/` and `$`, so `some-value` converts as one word.
- With several cursors or selections, the command converts each one, and one undo reverts them all.

You can run the commands in three ways:

- In the Command Palette (Ctrl/Cmd+Shift+P), type `Change Case`. The commands are listed when a text editor or a notebook cell is active.
- Right-click in the editor and open the `Change Case` submenu.
- Press a keyboard shortcut that you set. See [Keyboard shortcuts](#keyboard-shortcuts).

## Commands

In the Command Palette, each command is listed as `Change Case: <name>`.

- `extension.changeCase.commands`: List all Change Case commands, with a preview of each conversion when there is one cursor or one selection on one line
- `extension.changeCase.copy`: Copy the current word or selection to the clipboard in another case, and leave the document as it is. With several cursors, the texts are copied on separate lines.
- `extension.changeCase.rename`: Rename the symbol at the cursor in another case. See [Rename a symbol](#rename-a-symbol).
- `extension.changeCase.cycle`: Convert the current word or selection to the next case in the `changeCase.cycle` setting. See [Cycle through cases](#cycle-through-cases).
- `extension.changeCase.camel`: Convert to a string with the separators denoted by having the next letter capitalised
- `extension.changeCase.constant`: Convert to an upper case, underscore separated string (screaming snake case)
- `extension.changeCase.dot`: Convert to a lower case, period separated string
- `extension.changeCase.kebab`: Convert to a lower case, dash separated string (alias for param case)
- `extension.changeCase.lower`: Convert to a string in lower case
- `extension.changeCase.lowerFirst`: Convert to a string with the first character lower cased
- `extension.changeCase.no`: Convert the string without any casing (lower case, space separated)
- `extension.changeCase.param`: Convert to a lower case, dash separated string
- `extension.changeCase.pascal`: Convert to a string denoted in the same fashion as camelCase, but with the first letter also capitalised
- `extension.changeCase.pascalSnake`: Convert to an underscore separated string with the first letter of every word capitalised, for example `Foo_Bar`
- `extension.changeCase.path`: Convert to a lower case, slash separated string
- `extension.changeCase.proseSentence`: Capitalise the first letter of every sentence, and keep all other characters
- `extension.changeCase.proseTitle`: Capitalise the words of an English title, but not small words such as a, of and the. Punctuation is kept.
- `extension.changeCase.sentence`: Convert to a lower case, space separated string
- `extension.changeCase.snake`: Convert to a lower case, underscore separated string
- `extension.changeCase.sponge`: Convert to a string with a random case for every character
- `extension.changeCase.swap`: Convert to a string with every character case reversed
- `extension.changeCase.title`: Convert to a space separated string with the first character of every word upper cased
- `extension.changeCase.upper`: Convert to a string in upper case
- `extension.changeCase.upperFirst`: Convert to a string with the first character upper cased

`title`, `sentence` and `no` come from change-case, which removes punctuation. `proseTitle` and `proseSentence` come from [title-case](https://github.com/blakeembrey/change-case/tree/main/packages/title-case), which keeps it. They only change letters to upper case, so a word in capitals stays as it is. To change text such as `THE END`, run `lower` first. All commands convert one line at a time, so `proseSentence` also capitalises the first word of each line.

## Rename a symbol

The other commands only change the text in the editor. `Change Case: Rename Symbol As...` asks for a case, and then renames the symbol at the cursor, as F2 does. The language updates every reference to the symbol, also in other files, and the files are saved as after F2. It works in every language that supports F2 rename.

## Cycle through cases

`Change Case: Cycle` converts the current word or selection to the next case in the `changeCase.cycle` setting. By default, the cases are camel, snake, constant, pascal and kebab, so `fooBar` becomes `foo_bar`, then `FOO_BAR`, `FooBar`, `foo-bar` and `fooBar` again. Cases that give the same text are skipped, so `foo` goes to `FOO`, then `Foo`. Each step converts the text as it was before the first press, so you can always get back to it, also for a name such as `i18n` that constant case changes for good. The cycle starts again when you move the cursor or edit the text. Bind the command to a key, and press the key until you have the case you want.

## Keyboard shortcuts

The extension adds no shortcuts. To add one, run `Preferences: Open Keyboard Shortcuts (JSON)` and add an entry such as:

```json
[
    { "key": "ctrl+alt+c", "command": "extension.changeCase.camel", "when": "editorTextFocus" },
    { "key": "ctrl+alt+k", "command": "extension.changeCase.commands", "when": "editorTextFocus" },
    { "key": "ctrl+alt+s", "command": "extension.changeCase.copy", "args": "snake", "when": "editorTextFocus" },
    { "key": "ctrl+alt+r", "command": "extension.changeCase.rename", "args": "camel", "when": "editorTextFocus" },
    { "key": "ctrl+alt+.", "command": "extension.changeCase.cycle", "when": "editorTextFocus" }
]
```

`extension.changeCase.commands`, `extension.changeCase.copy` and `extension.changeCase.rename` take the name of a command as an optional argument, as in the `copy` and `rename` entries. Without it, they open the quick pick.

## Settings

You can set each of these per language, for example `"[properties]": { "changeCase.includeDotInCurrentWord": true }`.

- `changeCase.includeDotInCurrentWord` (default `false`): When a command runs on the word at the cursor, treat dots as part of the word.
- `changeCase.selectConvertedText` (default `true`): Select the converted text after a command. When it is off, the cursor goes to the end of the converted text, so you can continue to type.
- `changeCase.separateNumbers` (default `false`): Treat numbers as separate words. For example, `snake` converts `firstName1` to `first_name_1`, but also `i18n` to `i_18_n`.
- `changeCase.cycle` (default `["camel", "snake", "constant", "pascal", "kebab"]`): The cases that `Change Case: Cycle` goes through, in order.
- `changeCase.mergeAmbiguousCharacters` (default `false`): In `camel` and `pascal`, join a word that starts with a number without an underscore. For example, `camel` converts `first_name_1` to `firstName1`, not `firstName_1`.

## Development

Requires Node.js 22.18 or later and pnpm 10.

```bash
pnpm install
pnpm test        # builds the tests and runs them in a downloaded copy of VS Code
pnpm typecheck   # tsc -b
pnpm lint        # oxlint, type-aware
pnpm fmt:check   # oxfmt
pnpm vsix        # builds change-case-<version>.vsix
pnpm publish:openvsx  # publishes to Open VSX, with the token in OVSX_PAT
```

Press F5 in VS Code to start an Extension Development Host with the extension loaded.

## Support

[Create an issue](https://github.com/wmaurer/vscode-change-case/issues).
