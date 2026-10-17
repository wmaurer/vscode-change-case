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

    test("runs the command picked from the quick pick", async () => {
        const editor = await openEditor("foo_bar", [[2, 2]]);
        const picking = vscode.commands.executeCommand("extension.changeCase.commands");
        await sleep(500);
        await vscode.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem");
        await picking;
        assert.deepEqual(describe(editor), { text: "fooBar", selections: ["0-6"] });
    });

    test("does nothing when the quick pick is closed without a choice", async () => {
        const editor = await openEditor("foo_bar", [[2, 2]]);
        const picking = vscode.commands.executeCommand("extension.changeCase.commands");
        await sleep(500);
        await vscode.commands.executeCommand("workbench.action.closeQuickOpen");
        await picking;
        assert.deepEqual(describe(editor), { text: "foo_bar", selections: ["2-2"] });
    });

    test("does nothing when no editor is open", async () => {
        await vscode.commands.executeCommand("extension.changeCase.camel");
        assert.equal(vscode.window.activeTextEditor, undefined);
    });
});
