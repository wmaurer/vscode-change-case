import * as assert from "node:assert/strict";

import packageJson from "../../package.json" with { type: "json" };
import { caseCommands } from "../cases.ts";
import baseline from "./change-case-3.1.0.json" with { type: "json" };

// change-case-3.1.0.json holds what version 1.0.0 of this extension produced. It was recorded by
// running change-case 3.1.0, the library that version used, over a list of inputs.
suite("case commands", () => {
    test("every command converts the recorded inputs exactly as change-case 3.1.0 did", () => {
        const recorded = new Map(Object.entries(baseline));
        for (const command of caseCommands) {
            const expected = new Map(Object.entries(recorded.get(command.name) ?? {}));
            assert.equal(expected.size, 55, `${command.name} has recorded inputs`);
            for (const [input, output] of expected) {
                assert.equal(command.convert(input), output, `${command.name}(${JSON.stringify(input)})`);
            }
        }
    });

    test("a few conversions, written out", () => {
        const convert = (name: string, text: string): string | undefined =>
            caseCommands.find((command) => command.name === name)?.convert(text);
        assert.equal(convert("camel", "XMLHttpRequest"), "xmlHttpRequest");
        assert.equal(convert("constant", "fooBar"), "FOO_BAR");
        assert.equal(convert("title", "foo_bar baz"), "Foo Bar Baz");
        assert.equal(convert("sentence", "fooBar"), "Foo bar");
        assert.equal(convert("swap", "Hello World"), "hELLO wORLD");
        assert.equal(convert("lowerFirst", "FooBar"), "fooBar");
        assert.equal(convert("upperFirst", "fooBar"), "FooBar");
    });

    test("package.json contributes one command per case, plus the quick pick command", () => {
        const contributed = packageJson.contributes.commands.map((command) => command.command).toSorted();
        const expected = [
            "extension.changeCase.commands",
            ...caseCommands.map((command) => `extension.changeCase.${command.name}`),
        ].toSorted();
        assert.deepEqual(contributed, expected);
    });
});
