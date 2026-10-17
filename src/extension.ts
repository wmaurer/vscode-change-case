import { splitSeparateNumbers } from "change-case";
import * as vscode from "vscode";

import { caseCommands } from "./cases.ts";
import { advanceCycle, parseCycleSetting, startCycle } from "./cycle.ts";
import { convertText, convertedTexts, planChange, planReplace, spanOf, targetsOf } from "./plan.ts";

import type { CaseCommand, CaseOptions } from "./cases.ts";
import type { Cycle, CycleSetting } from "./cycle.ts";
import type { OffsetSelection, Plan, PlanOptions, Target } from "./plan.ts";

interface Settings {
    readonly plan: PlanOptions;
    readonly cases: CaseOptions;
    readonly cycle: CycleSetting;
}

const readSettings = (document: vscode.TextDocument): Settings => {
    const configuration = vscode.workspace.getConfiguration("changeCase", document);
    const mergeAmbiguousCharacters = configuration.get("mergeAmbiguousCharacters", false);
    // The settings editor checks the names, but a hand-edited settings.json can hold anything.
    const cycle = configuration.get<unknown>("cycle");
    return {
        plan: {
            includeDot: configuration.get("includeDotInCurrentWord", false),
            selectConverted: configuration.get("selectConvertedText", true),
        },
        cases: configuration.get("separateNumbers", false)
            ? { mergeAmbiguousCharacters, split: splitSeparateNumbers }
            : { mergeAmbiguousCharacters },
        cycle: Array.isArray(cycle)
            ? parseCycleSetting(cycle.map(String), caseCommands)
            : { error: "The changeCase.cycle setting must be a list of case names." },
    };
};

const offsetSelection = (document: vscode.TextDocument, selection: vscode.Selection): OffsetSelection => ({
    anchor: document.offsetAt(selection.anchor),
    active: document.offsetAt(selection.active),
});

/** Applies the edits as one undo step, then sets the selections. Returns `false` when the editor rejects the edits. */
const applyPlan = async (editor: vscode.TextEditor, plan: Plan): Promise<boolean> => {
    const { document } = editor;
    if (plan.edits.length > 0) {
        const applied = await editor.edit((builder) => {
            for (const { span, text } of plan.edits) {
                builder.replace(new vscode.Range(document.positionAt(span.start), document.positionAt(span.end)), text);
            }
        });
        if (!applied) return false;
    }
    editor.selections = plan.selections.map(
        ({ anchor, active }) => new vscode.Selection(document.positionAt(anchor), document.positionAt(active)),
    );
    return true;
};

const convertEditor = async (editor: vscode.TextEditor, command: CaseCommand): Promise<void> => {
    const { document } = editor;
    const settings = readSettings(document);
    const plan = planChange(
        document.getText(),
        editor.selections.map((selection) => offsetSelection(document, selection)),
        (text) => command.convert(text, settings.cases),
        settings.plan,
    );
    await applyPlan(editor, plan);
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

// A press of Cycle continues the last cycle while the document and the selections are as that press
// left them. Otherwise it starts a new cycle from the text as it is now.
interface CycleRun {
    readonly document: vscode.TextDocument;
    readonly version: number;
    readonly selections: ReadonlyArray<vscode.Selection>;
    readonly targets: ReadonlyArray<Target>;
    readonly cycle: Cycle;
}

let lastCycle: CycleRun | undefined;

const sameSelections = (a: ReadonlyArray<vscode.Selection>, b: ReadonlyArray<vscode.Selection>): boolean =>
    a.length === b.length &&
    a.every((selection, index) => {
        const other = b[index];
        return other !== undefined && selection.anchor.isEqual(other.anchor) && selection.active.isEqual(other.active);
    });

const cycleEditor = async (editor: vscode.TextEditor): Promise<void> => {
    const { document } = editor;
    const settings = readSettings(document);
    const setting = settings.cycle;
    if ("error" in setting) {
        void vscode.window.showErrorMessage(`Change Case: ${setting.error}`);
        return;
    }
    const text = document.getText();
    const previous =
        lastCycle?.document === document &&
        lastCycle.version === document.version &&
        sameSelections(lastCycle.selections, editor.selections)
            ? lastCycle
            : undefined;
    const targets =
        previous?.targets ??
        targetsOf(
            text,
            editor.selections.map((selection) => offsetSelection(document, selection)),
            settings.plan.includeDot,
        );
    const cycle = advanceCycle(
        previous?.cycle ??
            startCycle(
                targets.map(({ span }) => text.slice(span.start, span.end)),
                setting.cases,
                settings.cases,
            ),
    );
    const plan = planReplace(text, targets, cycle.steps[cycle.position] ?? [], settings.plan.selectConverted);
    if (!(await applyPlan(editor, plan))) return;
    lastCycle = { document, version: document.version, selections: editor.selections, targets: plan.converted, cycle };
};

// `vscode.prepareRename` is an API command that the vscode typings do not declare. It returns the
// name that the F2 rename box would show. With no rename provider, it returns the word at the position.
interface PreparedRename {
    readonly range: vscode.Range;
    readonly placeholder: string;
}

const symbolName = async (editor: vscode.TextEditor): Promise<string | undefined> => {
    const prepared = await vscode.commands.executeCommand<PreparedRename | undefined>(
        "vscode.prepareRename",
        editor.document.uri,
        editor.selection.active,
    );
    return prepared === undefined || prepared.placeholder === "" ? undefined : prepared.placeholder;
};

const renameEditor = async (editor: vscode.TextEditor, command: CaseCommand): Promise<void> => {
    const { document } = editor;
    try {
        const name = await symbolName(editor);
        if (name === undefined) {
            void vscode.window.showErrorMessage("Change Case: there is no symbol to rename at the cursor.");
            return;
        }
        const newName = command.convert(name, readSettings(document).cases);
        if (newName === name) return;
        const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit | undefined>(
            "vscode.executeDocumentRenameProvider",
            document.uri,
            editor.selection.active,
            newName,
        );
        if (edit === undefined || edit.size === 0) {
            void vscode.window.showErrorMessage("Change Case: the language cannot rename the symbol at the cursor.");
            return;
        }
        // As F2 does. Then `files.refactoring.autoSave` saves the files that the rename changed.
        await vscode.workspace.applyEdit(edit, { isRefactoring: true });
    } catch (error) {
        void vscode.window.showErrorMessage(`Change Case: ${error instanceof Error ? error.message : String(error)}`);
    }
};

interface Action {
    readonly run: (editor: vscode.TextEditor, command: CaseCommand) => Promise<void>;
    /** The text that the quick pick shows each conversion of, or `undefined` to show what each command does. */
    readonly preview: (editor: vscode.TextEditor) => Promise<string | undefined>;
    readonly placeHolder: string;
}

const convertAction: Action = {
    run: convertEditor,
    preview: (editor) => Promise.resolve(previewText(editor)),
    placeHolder: "What do you want to do to the current word / selection(s)?",
};
const copyAction: Action = {
    run: copyEditor,
    preview: (editor) => Promise.resolve(previewText(editor)),
    placeHolder: "Copy the current word / selection(s) as",
};
const renameAction: Action = {
    run: renameEditor,
    preview: (editor) => symbolName(editor).catch(() => undefined),
    placeHolder: "Rename the symbol at the cursor, in every file, as",
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
    const preview = await action.preview(editor);
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
        vscode.commands.registerCommand("extension.changeCase.rename", (name?: string | vscode.Uri) =>
            runNamed(renameAction, name),
        ),
        vscode.commands.registerCommand("extension.changeCase.cycle", async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor !== undefined) await cycleEditor(editor);
        }),
        ...caseCommands.map((command) =>
            vscode.commands.registerCommand(`extension.changeCase.${command.name}`, async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor !== undefined) await convertEditor(editor, command);
            }),
        ),
    );
};
