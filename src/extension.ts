import * as vscode from 'vscode';
import { changeCaseCommands, runCommand, COMMAND_LABELS } from './change-case-commands';

export function activate(context: vscode.ExtensionContext) {
    vscode.commands.registerCommand('extension.changeCase.commands', changeCaseCommands);
    vscode.commands.registerCommand('extension.changeCase.camel', () => { runCommand(COMMAND_LABELS.camel) } );
    vscode.commands.registerCommand('extension.changeCase.constant', () => { runCommand(COMMAND_LABELS.constant) } );
    vscode.commands.registerCommand('extension.changeCase.dot', () => { runCommand(COMMAND_LABELS.dot) } );
    vscode.commands.registerCommand('extension.changeCase.kebab', () => { runCommand(COMMAND_LABELS.kebab) } );
    vscode.commands.registerCommand('extension.changeCase.lower', () => { runCommand(COMMAND_LABELS.lower) } );
    vscode.commands.registerCommand('extension.changeCase.lowerFirst', () => { runCommand(COMMAND_LABELS.lowerFirst) } );
    vscode.commands.registerCommand('extension.changeCase.no', () => { runCommand(COMMAND_LABELS.no) } );
    vscode.commands.registerCommand('extension.changeCase.param', () => { runCommand(COMMAND_LABELS.param) } );
    vscode.commands.registerCommand('extension.changeCase.pascal', () => { runCommand(COMMAND_LABELS.pascal) } );
    vscode.commands.registerCommand('extension.changeCase.path', () => { runCommand(COMMAND_LABELS.path) } );
    vscode.commands.registerCommand('extension.changeCase.sentence', () => { runCommand(COMMAND_LABELS.sentence) } );
    vscode.commands.registerCommand('extension.changeCase.snake', () => { runCommand(COMMAND_LABELS.snake) } );
    vscode.commands.registerCommand('extension.changeCase.swap', () => { runCommand(COMMAND_LABELS.swap) } );
    vscode.commands.registerCommand('extension.changeCase.title', () => { runCommand(COMMAND_LABELS.title) } );
    vscode.commands.registerCommand('extension.changeCase.upper', () => { runCommand(COMMAND_LABELS.upper) } );
    vscode.commands.registerCommand('extension.changeCase.upperFirst', () => { runCommand(COMMAND_LABELS.upperFirst) } );
}
