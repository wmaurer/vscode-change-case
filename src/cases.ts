import {
    camelCase,
    capitalCase,
    constantCase,
    dotCase,
    kebabCase,
    noCase,
    pascalCase,
    pascalSnakeCase,
    pathCase,
    sentenceCase,
    snakeCase,
} from "change-case";
import { spongeCase } from "sponge-case";
import { titleCase } from "title-case";

import type { PascalCaseOptions } from "change-case";

/** The change-case options that the settings control. Commands that do not use change-case ignore them. */
export type CaseOptions = Pick<PascalCaseOptions, "split" | "mergeAmbiguousCharacters">;

/** One Change Case command: a name for the command palette and the quick pick, and the conversion it applies. */
export interface CaseCommand {
    readonly name: string;
    readonly description: string;
    /** Converts one line of text, without the whitespace around it. */
    readonly convert: (text: string, options: CaseOptions) => string;
}

const lowerCase = (text: string): string => text.toLowerCase();
const upperCase = (text: string): string => text.toUpperCase();
const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);
const upperFirst = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const swapCase = (text: string): string =>
    Array.from(text, (character) => {
        const upper = character.toUpperCase();
        return upper === character ? character.toLowerCase() : upper;
    }).join("");

/** Every command, in the order the quick pick lists them. Each `name` is also the suffix of its command ID. */
export const caseCommands: ReadonlyArray<CaseCommand> = [
    {
        name: "camel",
        description: "Convert to a string with the separators denoted by having the next letter capitalised",
        convert: camelCase,
    },
    {
        name: "constant",
        description: "Convert to an upper case, underscore separated string (screaming snake case)",
        convert: constantCase,
    },
    { name: "dot", description: "Convert to a lower case, period separated string", convert: dotCase },
    {
        name: "kebab",
        description: "Convert to a lower case, dash separated string (alias for param case)",
        convert: kebabCase,
    },
    { name: "lower", description: "Convert to a string in lower case", convert: lowerCase },
    {
        name: "lowerFirst",
        description: "Convert to a string with the first character lower cased",
        convert: lowerFirst,
    },
    {
        name: "no",
        description: "Convert the string without any casing (lower case, space separated)",
        convert: noCase,
    },
    { name: "param", description: "Convert to a lower case, dash separated string", convert: kebabCase },
    {
        name: "pascal",
        description:
            "Convert to a string denoted in the same fashion as camelCase, but with the first letter also capitalised",
        convert: pascalCase,
    },
    {
        name: "pascalSnake",
        description: "Convert to an underscore separated string with the first letter of every word capitalised",
        convert: pascalSnakeCase,
    },
    { name: "path", description: "Convert to a lower case, slash separated string", convert: pathCase },
    {
        name: "proseSentence",
        description: "Capitalise the first letter of every sentence, and keep all other characters",
        convert: (text) => titleCase(text, { sentenceCase: true }),
    },
    {
        name: "proseTitle",
        description: "Capitalise the words of an English title, but not small words such as a, of and the",
        convert: (text) => titleCase(text),
    },
    { name: "sentence", description: "Convert to a lower case, space separated string", convert: sentenceCase },
    { name: "snake", description: "Convert to a lower case, underscore separated string", convert: snakeCase },
    {
        name: "sponge",
        description: "Convert to a string with a random case for every character",
        convert: (text) => spongeCase(text),
    },
    { name: "swap", description: "Convert to a string with every character case reversed", convert: swapCase },
    {
        name: "title",
        description: "Convert to a space separated string with the first character of every word upper cased",
        convert: capitalCase,
    },
    { name: "upper", description: "Convert to a string in upper case", convert: upperCase },
    {
        name: "upperFirst",
        description: "Convert to a string with the first character upper cased",
        convert: upperFirst,
    },
];
