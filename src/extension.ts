import { splitSeparateNumbers } from "change-case";
import * as vscode from "vscode";

import { caseCommands } from "./cases.ts";
import { convertText, convertedTexts, planChange, spanOf } from "./plan.ts";

import type { CaseCommand, CaseOptions } from "./cases.ts";
import type { OffsetSelection, PlanOptions } from "./plan.ts";

interface Settings {
    readonly plan: PlanOptions;
    readonly cases: CaseOptions;
}

const readSettings = (document: vscode.TextDocument): Settings => {
    const configuration = vscode.workspace.getConfiguration("changeCase", document);
    const mergeAmbiguousCharacters = configuration.get("mergeAmbiguousCharacters", false);
    return {
        plan: {
            includeDot: configuration.get("includeDotInCurrentWord", false),
            selectConverted: configuration.get("selectConvertedText", true),
        },
        cases: configuration.get("separateNumbers", false)
            ? { mergeAmbiguousCharacters, split: splitSeparateNumbers }
            : { mergeAmbiguousCharacters },
    };
};

const offsetSelection = (document: vscode.TextDocument, selection: vscode.Selection): OffsetSelection => ({
    anchor: document.offsetAt(selection.anchor),
    active: document.offsetAt(selection.active),
});

const convertEditor = async (editor: vscode.TextEditor, command: CaseCommand): Promise<void> => {
    const { document } = editor;
    const settings = readSettings(document);
    const plan = planChange(
        document.getText(),
        editor.selections.map((selection) => offsetSelection(document, selection)),
        (text) => command.convert(text, settings.cases),
        settings.plan,
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

const copyEditor = async (editor: vscode.TextEditor, command: CaseCommand): Promise<void> => {
    const { document } = editor;
    const settings = readSettings(document);
    const texts = convertedTexts(
        document.getText(),
        editor.selections.map((selection) => offsetSelection(document, selection)),
        (text) => command.convert(text, settings.cases),
        settings.plan.includeDot,
    );
    if (texts.length === 0) return;
    const eol = document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
    await vscode.env.clipboard.writeText(texts.join(eol));
    vscode.window.setStatusBarMessage(`Change Case: copied as ${command.name}`, 3000);
};

interface Action {
    readonly run: (editor: vscode.TextEditor, command: CaseCommand) => Promise<void>;
    readonly placeHolder: string;
}

const convertAction: Action = {
    run: convertEditor,
    placeHolder: "What do you want to do to the current word / selection(s)?",
};
const copyAction: Action = {
    run: copyEditor,
    placeHolder: "Copy the current word / selection(s) as",
};

// The quick pick shows each conversion of the text itself, but only when there is exactly one
// piece of text on one line to convert. Otherwise it shows what each command does.
const previewText = (editor: vscode.TextEditor): string | undefined => {
    const [selection, ...others] = editor.selections;
    if (selection === undefined || others.length > 0 || !selection.isSingleLine) return undefined;
    const text = editor.document.getText();
    const { includeDot } = readSettings(editor.document).plan;
    const span = spanOf(text, offsetSelection(editor.document, selection), includeDot);
    return span.start === span.end ? undefined : text.slice(span.start, span.end);
};

const pickCommand = async (editor: vscode.TextEditor, action: Action): Promise<void> => {
    const preview = previewText(editor);
    const { cases } = readSettings(editor.document);
    const items = caseCommands.map((command) => ({
        label: command.name,
        description:
            preview === undefined
                ? command.description
                : `Convert to ${convertText(preview, (line) => command.convert(line, cases))}`,
        command,
    }));
    const picked = await vscode.window.showQuickPick(items, {
        matchOnDescription: true,
        placeHolder: action.placeHolder,
    });
    if (picked !== undefined) await action.run(editor, picked.command);
};

// A keybinding can pass the name of a command as the argument, for example "snake". Without
// one, the quick pick asks for it. A menu passes the URI of the document, which is not a name.
const runNamed = async (action: Action, name: string | vscode.Uri | undefined): Promise<void> => {
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined) return;
    if (name === undefined || name instanceof vscode.Uri) return pickCommand(editor, action);
    const command = caseCommands.find((candidate) => candidate.name === name);
    if (command === undefined) {
        void vscode.window.showErrorMessage(`Change Case has no command named "${name}".`);
        return;
    }
    await action.run(editor, command);
};

// The Command Palette lists the commands only while this key is true. A `when` clause on
// `editorLangId` is false in a notebook cell, but `activeTextEditor` is the cell editor there.
const updateTextEditorActive = (editor: vscode.TextEditor | undefined): void => {
    void vscode.commands.executeCommand("setContext", "changeCase.textEditorActive", editor !== undefined);
};

export const activate = (context: vscode.ExtensionContext): void => {
    updateTextEditorActive(vscode.window.activeTextEditor);
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(updateTextEditorActive),
        vscode.commands.registerCommand("extension.changeCase.commands", (name?: string | vscode.Uri) =>
            runNamed(convertAction, name),
        ),
        vscode.commands.registerCommand("extension.changeCase.copy", (name?: string | vscode.Uri) =>
            runNamed(copyAction, name),
        ),
        ...caseCommands.map((command) =>
            vscode.commands.registerCommand(`extension.changeCase.${command.name}`, async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor !== undefined) await convertEditor(editor, command);
            }),
        ),
    );
};
