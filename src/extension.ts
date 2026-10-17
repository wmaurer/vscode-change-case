import * as vscode from "vscode";

import { caseCommands } from "./cases.ts";
import { convertText, planChange, spanOf } from "./plan.ts";

import type { CaseCommand } from "./cases.ts";
import type { OffsetSelection } from "./plan.ts";

const includeDotInCurrentWord = (document: vscode.TextDocument): boolean =>
    vscode.workspace.getConfiguration("changeCase", document).get("includeDotInCurrentWord", false);

const offsetSelection = (document: vscode.TextDocument, selection: vscode.Selection): OffsetSelection => ({
    anchor: document.offsetAt(selection.anchor),
    active: document.offsetAt(selection.active),
});

const runCommand = async (command: CaseCommand): Promise<void> => {
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined) return;
    const { document } = editor;

    const plan = planChange(
        document.getText(),
        editor.selections.map((selection) => offsetSelection(document, selection)),
        command.convert,
        includeDotInCurrentWord(document),
    );

    if (plan.edits.length > 0) {
        const applied = await editor.edit((builder) => {
            for (const { span, text } of plan.edits) {
                builder.replace(new vscode.Range(document.positionAt(span.start), document.positionAt(span.end)), text);
            }
        });
        if (!applied) return;
    }

    editor.selections = plan.selections.map(
        ({ anchor, active }) => new vscode.Selection(document.positionAt(anchor), document.positionAt(active)),
    );
};

// The quick pick shows each conversion of the text itself, but only when there is exactly one
// piece of text on one line to convert. Otherwise it shows what each command does.
const previewText = (editor: vscode.TextEditor): string | undefined => {
    const [selection, ...others] = editor.selections;
    if (selection === undefined || others.length > 0 || !selection.isSingleLine) return undefined;
    const text = editor.document.getText();
    const span = spanOf(text, offsetSelection(editor.document, selection), includeDotInCurrentWord(editor.document));
    return span.start === span.end ? undefined : text.slice(span.start, span.end);
};

const pickCommand = async (): Promise<void> => {
    const editor = vscode.window.activeTextEditor;
    const preview = editor === undefined ? undefined : previewText(editor);
    const items = caseCommands.map((command) => ({
        label: command.name,
        description:
            preview === undefined ? command.description : `Convert to ${convertText(preview, command.convert)}`,
        command,
    }));
    const picked = await vscode.window.showQuickPick(items, {
        matchOnDescription: true,
        placeHolder: "What do you want to do to the current word / selection(s)?",
    });
    if (picked !== undefined) await runCommand(picked.command);
};

export const activate = (context: vscode.ExtensionContext): void => {
    context.subscriptions.push(
        vscode.commands.registerCommand("extension.changeCase.commands", pickCommand),
        ...caseCommands.map((command) =>
            vscode.commands.registerCommand(`extension.changeCase.${command.name}`, () => runCommand(command)),
        ),
    );
};
