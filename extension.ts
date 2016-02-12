import { commands } from 'vscode';
import { changeCaseCommands, runCommand, COMMAND_LABELS } from './change-case-commands';

export function activate() {

    console.log('Extension \'vscode-change-case\' is now active');

    commands.registerCommand('extension.changeCase.commands', changeCaseCommands);
    commands.registerCommand('extension.changeCase.camel', () => { runCommand(COMMAND_LABELS.camel) } );
    commands.registerCommand('extension.changeCase.constant', () => { runCommand(COMMAND_LABELS.constant) } );
    commands.registerCommand('extension.changeCase.dot', () => { runCommand(COMMAND_LABELS.dot) } );
    commands.registerCommand('extension.changeCase.lower', () => { runCommand(COMMAND_LABELS.lower) } );
    commands.registerCommand('extension.changeCase.lowerFirst', () => { runCommand(COMMAND_LABELS.lowerFirst) } );
    commands.registerCommand('extension.changeCase.param', () => { runCommand(COMMAND_LABELS.param) } );
    commands.registerCommand('extension.changeCase.pascal', () => { runCommand(COMMAND_LABELS.pascal) } );
    commands.registerCommand('extension.changeCase.path', () => { runCommand(COMMAND_LABELS.path) } );
    commands.registerCommand('extension.changeCase.sentence', () => { runCommand(COMMAND_LABELS.sentence) } );
    commands.registerCommand('extension.changeCase.snake', () => { runCommand(COMMAND_LABELS.snake) } );
    commands.registerCommand('extension.changeCase.swap', () => { runCommand(COMMAND_LABELS.swap) } );
    commands.registerCommand('extension.changeCase.title', () => { runCommand(COMMAND_LABELS.title) } );
    commands.registerCommand('extension.changeCase.upper', () => { runCommand(COMMAND_LABELS.upper) } );
    commands.registerCommand('extension.changeCase.upperFirst', () => { runCommand(COMMAND_LABELS.upperFirst) } );

}
