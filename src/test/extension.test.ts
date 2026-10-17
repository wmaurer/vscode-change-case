import * as assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";

import * as vscode from "vscode";

interface Run {
    readonly text: string;
    readonly selections: ReadonlyArray<string>;
}

const describe = (editor: vscode.TextEditor): Run => ({
    text: editor.document.getText(),
    selections: editor.selections.map((selection) => {
        const anchor = editor.document.offsetAt(selection.anchor);
        const active = editor.document.offsetAt(selection.active);
        return `${anchor}-${active}`;
    }),
});

const openEditor = async (text: string, selections: ReadonlyArray<readonly [number, number]>) => {
    const document = await vscode.workspace.openTextDocument({ content: text });
    const editor = await vscode.window.showTextDocument(document);
    editor.selections = selections.map(
        ([anchor, active]) => new vscode.Selection(document.positionAt(anchor), document.positionAt(active)),
    );
    return editor;
};

// The quick pick opens some time after its command starts, and nothing reports when. So the
// command is sent again until the pick settles. Sending it with no quick pick open does nothing.
const answerQuickPick = async (picking: Thenable<unknown>, command: string): Promise<void> => {
    let settled = false;
    const done = Promise.resolve(picking).then(() => {
        settled = true;
    });
    for (let attempt = 0; attempt < 50 && !settled; attempt += 1) {
        await sleep(100);
        await vscode.commands.executeCommand(command);
    }
    await done;
};

// Types the command into the Command Palette and accepts the first item until the document changes.
// A command that the palette does not list leaves the document as it is.
const runFromPalette = async (title: string, document: vscode.TextDocument): Promise<string> => {
    const before = document.getText();
    await vscode.commands.executeCommand("workbench.action.quickOpen", `>${title}`);
    for (let attempt = 0; attempt < 50 && document.getText() === before; attempt += 1) {
        await sleep(100);
        await vscode.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem");
    }
    await vscode.commands.executeCommand("workbench.action.closeQuickOpen");
    return document.getText();
};

const run = async (
    command: string,
    text: string,
    selections: ReadonlyArray<readonly [number, number]>,
): Promise<Run> => {
    const editor = await openEditor(text, selections);
    await vscode.commands.executeCommand(`extension.changeCase.${command}`);
    return describe(editor);
};

suite("Change Case in the editor", () => {
    teardown(async () => {
        await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    });

    test("converts the word at the cursor and selects it", async () => {
        assert.deepEqual(await run("camel", "const some-value = 1", [[8, 8]]), {
            text: "const someValue = 1",
            selections: ["6-15"],
        });
    });

    test("converts at every cursor and keeps each selection on its converted text", async () => {
        assert.deepEqual(
            await run("pascal", "foo_bar baz_qux", [
                [2, 2],
                [10, 10],
            ]),
            { text: "FooBar BazQux", selections: ["0-6", "7-13"] },
        );
    });

    test("one undo reverts the conversion at every cursor", async () => {
        const editor = await openEditor("foo_bar baz_qux", [
            [2, 2],
            [10, 10],
        ]);
        await vscode.commands.executeCommand("extension.changeCase.pascal");
        await vscode.commands.executeCommand("undo");
        assert.equal(editor.document.getText(), "foo_bar baz_qux");
    });

    test("converts a word once when two cursors are in it", async () => {
        assert.deepEqual(
            await run("camel", "foo_bar", [
                [1, 1],
                [5, 5],
            ]),
            { text: "fooBar", selections: ["0-6"] },
        );
    });

    test("converts each line of a selection on its own and keeps CRLF line breaks and indentation", async () => {
        const text = "    foo bar\r\n    baz qux";
        assert.deepEqual(await run("camel", text, [[0, text.length]]), {
            text: "    fooBar\r\n    bazQux",
            selections: ["0-22"],
        });
    });

    test("keeps the direction of a backwards selection", async () => {
        assert.deepEqual(await run("snake", "fooBar", [[6, 0]]), { text: "foo_bar", selections: ["7-0"] });
    });

    test("converts a word with letters outside ASCII", async () => {
        assert.deepEqual(await run("camel", "crème-brûlée", [[1, 1]]), {
            text: "crèmeBrûlée",
            selections: ["0-11"],
        });
    });

    test("does nothing at a cursor that touches no word", async () => {
        assert.deepEqual(await run("upper", "foo  bar", [[4, 4]]), { text: "foo  bar", selections: ["4-4"] });
    });

    test("does nothing at a cursor on punctuation, such as a list bullet", async () => {
        assert.deepEqual(await run("camel", "- item", [[1, 1]]), { text: "- item", selections: ["1-1"] });
    });

    test("includes dots in the word at the cursor when changeCase.includeDotInCurrentWord is on", async () => {
        assert.deepEqual(await run("snake", "foo.barBaz", [[6, 6]]), {
            text: "foo.bar_baz",
            selections: ["4-11"],
        });

        const configuration = vscode.workspace.getConfiguration("changeCase");
        await configuration.update("includeDotInCurrentWord", true, vscode.ConfigurationTarget.Global);
        try {
            assert.deepEqual(await run("snake", "foo.barBaz", [[6, 6]]), {
                text: "foo_bar_baz",
                selections: ["0-11"],
            });
        } finally {
            await configuration.update("includeDotInCurrentWord", undefined, vscode.ConfigurationTarget.Global);
        }
    });

    test("runs the command picked from the quick pick, which lists camel first", async () => {
        const editor = await openEditor("foo_bar", [[2, 2]]);
        await answerQuickPick(
            vscode.commands.executeCommand("extension.changeCase.commands"),
            "workbench.action.acceptSelectedQuickOpenItem",
        );
        assert.deepEqual(describe(editor), { text: "fooBar", selections: ["0-6"] });
    });

    test("does nothing when the quick pick is closed without a choice", async () => {
        const editor = await openEditor("foo_bar", [[2, 2]]);
        await answerQuickPick(
            vscode.commands.executeCommand("extension.changeCase.commands"),
            "workbench.action.closeQuickOpen",
        );
        assert.deepEqual(describe(editor), { text: "foo_bar", selections: ["2-2"] });
    });

    test("runs the command named in the argument, as a keybinding can pass it", async () => {
        const editor = await openEditor("fooBar", [[2, 2]]);
        await vscode.commands.executeCommand("extension.changeCase.commands", "snake");
        assert.deepEqual(describe(editor), { text: "foo_bar", selections: ["0-7"] });
    });

    test("opens the quick pick when a menu passes the document URI", async () => {
        const editor = await openEditor("foo_bar", [[2, 2]]);
        await answerQuickPick(
            vscode.commands.executeCommand("extension.changeCase.commands", editor.document.uri),
            "workbench.action.acceptSelectedQuickOpenItem",
        );
        assert.deepEqual(describe(editor), { text: "fooBar", selections: ["0-6"] });
    });

    test("runs from the Command Palette when a text editor is active", async () => {
        const editor = await openEditor("foo_bar", [[2, 2]]);
        assert.equal(await runFromPalette("Change Case: upper", editor.document), "FOO_BAR");
    });

    test("runs from the Command Palette in a notebook cell", async () => {
        const data = new vscode.NotebookData([
            new vscode.NotebookCellData(vscode.NotebookCellKind.Code, "foo_bar", "python"),
        ]);
        const notebook = await vscode.workspace.openNotebookDocument("jupyter-notebook", data);
        await vscode.window.showNotebookDocument(notebook);
        await vscode.commands.executeCommand("notebook.focusTop");
        await vscode.commands.executeCommand("notebook.cell.edit");
        const cell = notebook.cellAt(0).document;
        for (let attempt = 0; attempt < 50 && vscode.window.activeTextEditor?.document !== cell; attempt += 1) {
            await sleep(100);
        }
        assert.equal(await runFromPalette("Change Case: upper", cell), "FOO_BAR");
    });

    test("copies the converted text at every cursor and leaves the document as it is", async () => {
        const editor = await openEditor("fooBar bazQux", [
            [2, 2],
            [9, 9],
        ]);
        await vscode.commands.executeCommand("extension.changeCase.copy", "snake");
        const eol = editor.document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
        assert.equal(await vscode.env.clipboard.readText(), `foo_bar${eol}baz_qux`);
        assert.deepEqual(describe(editor), { text: "fooBar bazQux", selections: ["2-2", "9-9"] });
    });

    test("puts the cursor after the converted text when changeCase.selectConvertedText is off", async () => {
        const configuration = vscode.workspace.getConfiguration("changeCase");
        await configuration.update("selectConvertedText", false, vscode.ConfigurationTarget.Global);
        try {
            assert.deepEqual(await run("snake", "fooBar = 1", [[2, 2]]), {
                text: "foo_bar = 1",
                selections: ["7-7"],
            });
        } finally {
            await configuration.update("selectConvertedText", undefined, vscode.ConfigurationTarget.Global);
        }
    });

    test("passes changeCase.separateNumbers and changeCase.mergeAmbiguousCharacters to change-case", async () => {
        const configuration = vscode.workspace.getConfiguration("changeCase");
        await configuration.update("separateNumbers", true, vscode.ConfigurationTarget.Global);
        await configuration.update("mergeAmbiguousCharacters", true, vscode.ConfigurationTarget.Global);
        try {
            assert.equal((await run("snake", "firstName1", [[2, 2]])).text, "first_name_1");
            assert.equal((await run("camel", "first_name_1", [[2, 2]])).text, "firstName1");
        } finally {
            await configuration.update("separateNumbers", undefined, vscode.ConfigurationTarget.Global);
            await configuration.update("mergeAmbiguousCharacters", undefined, vscode.ConfigurationTarget.Global);
        }
    });

    test("does nothing when no editor is open", async () => {
        await vscode.commands.executeCommand("extension.changeCase.camel");
        assert.equal(vscode.window.activeTextEditor, undefined);
    });
});
