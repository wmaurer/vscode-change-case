import * as assert from "node:assert/strict";

import { splitSeparateNumbers } from "change-case";

import packageJson from "../../package.json" with { type: "json" };
import { caseCommands } from "../cases.ts";
import baseline from "./change-case-3.1.0.json" with { type: "json" };

const convert = (name: string, text: string, options = {}): string | undefined =>
    caseCommands.find((command) => command.name === name)?.convert(text, options);

// change-case-3.1.0.json holds what version 1.0.0 of this extension produced. It was recorded by
// running change-case 3.1.0, the library that version used, over a list of inputs.
suite("case commands", () => {
    test("every command of version 1.0.0 converts the recorded inputs exactly as change-case 3.1.0 did", () => {
        const recorded = Object.entries(baseline);
        assert.equal(recorded.length, 16);
        for (const [name, cases] of recorded) {
            const expected = Object.entries(cases);
            assert.equal(expected.length, 55, `${name} has recorded inputs`);
            for (const [input, output] of expected) {
                assert.equal(convert(name, input), output, `${name}(${JSON.stringify(input)})`);
            }
        }
    });

    test("a few conversions, written out", () => {
        assert.equal(convert("camel", "XMLHttpRequest"), "xmlHttpRequest");
        assert.equal(convert("constant", "fooBar"), "FOO_BAR");
        assert.equal(convert("title", "foo_bar baz"), "Foo Bar Baz");
        assert.equal(convert("sentence", "fooBar"), "Foo bar");
        assert.equal(convert("swap", "Hello World"), "hELLO wORLD");
        assert.equal(convert("lowerFirst", "FooBar"), "fooBar");
        assert.equal(convert("upperFirst", "fooBar"), "FooBar");
    });

    test("pascalSnake joins capitalised words with underscores", () => {
        assert.equal(
            convert("pascalSnake", "CalculatorShouldCalculateCorrectOutputs"),
            "Calculator_Should_Calculate_Correct_Outputs",
        );
        assert.equal(convert("pascalSnake", "p_xyz_abc"), "P_Xyz_Abc");
    });

    test("proseTitle keeps punctuation and does not capitalise small words", () => {
        assert.equal(convert("proseTitle", "what's on the table: who knows?"), "What's on the Table: Who Knows?");
        assert.equal(convert("proseTitle", "one two three. four, five"), "One Two Three. Four, Five");
        assert.equal(convert("proseTitle", 'allow "neutral" arguments'), 'Allow "Neutral" Arguments');
    });

    test("proseSentence capitalises each sentence and keeps punctuation", () => {
        assert.equal(
            convert("proseSentence", "hello, world! how are you? fine. the end"),
            "Hello, world! How are you? Fine. The end",
        );
    });

    test("sponge changes only the case of each character, and uses both cases", () => {
        const text = "spongebob case, with punctuation and enough letters that both cases appear!";
        const sponged = convert("sponge", text) ?? "";
        assert.equal(sponged.toLowerCase(), text);
        assert.notEqual(sponged, text);
        assert.notEqual(sponged, text.toUpperCase());
    });

    test("the change-case options from the settings reach the conversion", () => {
        assert.equal(convert("camel", "first_name_1"), "firstName_1");
        assert.equal(convert("camel", "first_name_1", { mergeAmbiguousCharacters: true }), "firstName1");
        assert.equal(convert("snake", "firstName1"), "first_name1");
        assert.equal(convert("snake", "firstName1", { split: splitSeparateNumbers }), "first_name_1");
    });

    test("package.json contributes one command per case, plus the quick pick and copy commands", () => {
        const expected = [
            "extension.changeCase.commands",
            "extension.changeCase.copy",
            ...caseCommands.map((command) => `extension.changeCase.${command.name}`),
        ];
        const { commands, menus } = packageJson.contributes;
        assert.deepEqual(
            commands.map((command) => command.command),
            expected,
        );
        assert.deepEqual(
            menus.commandPalette.map((item) => item.command),
            expected,
        );
        assert.deepEqual(
            menus["changeCase.editorContext"].map((item) => item.command),
            expected,
        );
    });
});
