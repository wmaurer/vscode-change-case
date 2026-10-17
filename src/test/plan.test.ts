import * as assert from "node:assert/strict";

import { caseCommands } from "../cases.ts";
import { convertText, convertedTexts, planChange, wordAt } from "../plan.ts";

const snake = (text: string): string =>
    caseCommands.find((command) => command.name === "snake")?.convert(text, {}) ?? "";
const planOptions = { includeDot: false, selectConverted: true };

suite("wordAt", () => {
    test("finds the word around the offset, with dashes, slashes, underscores and dollars", () => {
        assert.deepEqual(wordAt("x = $foo-bar/baz_qux;", 8, false), { start: 4, end: 20 });
    });

    test("stops at a dot unless dots are included", () => {
        assert.deepEqual(wordAt("this.fooBar()", 7, false), { start: 5, end: 11 });
        assert.deepEqual(wordAt("this.fooBar()", 7, true), { start: 0, end: 11 });
    });

    test("finds a word with letters outside ASCII", () => {
        assert.deepEqual(wordAt("une crème-brûlée", 6, false), { start: 4, end: 16 });
    });

    test("finds a word that ends at the offset", () => {
        assert.deepEqual(wordAt("foo bar", 3, false), { start: 0, end: 3 });
    });

    test("finds nothing in a run of punctuation", () => {
        assert.deepEqual(wordAt("- item", 0, false), { start: 0, end: 0 });
        assert.deepEqual(wordAt("a // b", 3, false), { start: 3, end: 3 });
        assert.deepEqual(wordAt("a ... b", 3, true), { start: 3, end: 3 });
    });

    test("finds nothing between two spaces", () => {
        assert.deepEqual(wordAt("foo  bar", 4, false), { start: 4, end: 4 });
    });

    test("looks only at the line of the offset", () => {
        assert.deepEqual(wordAt("foo\nbar", 4, false), { start: 4, end: 7 });
        assert.deepEqual(wordAt("foo\r\nbar", 3, false), { start: 0, end: 3 });
    });
});

suite("convertText", () => {
    test("converts each line on its own and keeps line breaks and indentation", () => {
        assert.equal(convertText("  fooBar\r\n\r\n\tbazQux  \n", snake), "  foo_bar\r\n\r\n\tbaz_qux  \n");
    });
});

suite("planChange", () => {
    test("shifts later selections on the same line by the change in length", () => {
        const plan = planChange(
            "fooBar bazQux",
            [
                { anchor: 1, active: 1 },
                { anchor: 9, active: 9 },
            ],
            snake,
            planOptions,
        );
        assert.deepEqual(plan, {
            edits: [
                { span: { start: 0, end: 6 }, text: "foo_bar" },
                { span: { start: 7, end: 13 }, text: "baz_qux" },
            ],
            selections: [
                { anchor: 0, active: 7 },
                { anchor: 8, active: 15 },
            ],
            converted: [
                { span: { start: 0, end: 7 }, reversed: false },
                { span: { start: 8, end: 15 }, reversed: false },
            ],
        });
    });

    test("merges a selection and a cursor that cover the same text into one edit", () => {
        const plan = planChange(
            "fooBar",
            [
                { anchor: 0, active: 3 },
                { anchor: 5, active: 5 },
            ],
            snake,
            planOptions,
        );
        assert.deepEqual(plan, {
            edits: [{ span: { start: 0, end: 6 }, text: "foo_bar" }],
            selections: [{ anchor: 0, active: 7 }],
            converted: [{ span: { start: 0, end: 7 }, reversed: false }],
        });
    });

    test("keeps the direction of a backwards selection", () => {
        const plan = planChange("fooBar", [{ anchor: 6, active: 0 }], snake, planOptions);
        assert.deepEqual(plan.selections, [{ anchor: 7, active: 0 }]);
    });

    test("leaves a cursor that touches no word where it is, after earlier edits move it", () => {
        const plan = planChange(
            "fooBar  x",
            [
                { anchor: 0, active: 0 },
                { anchor: 7, active: 7 },
            ],
            snake,
            planOptions,
        );
        assert.deepEqual(plan.selections, [
            { anchor: 0, active: 7 },
            { anchor: 8, active: 8 },
        ]);
    });

    test("makes no edit when the text is already converted, but still selects it", () => {
        assert.deepEqual(planChange("foo_bar", [{ anchor: 2, active: 2 }], snake, planOptions), {
            edits: [],
            selections: [{ anchor: 0, active: 7 }],
            converted: [{ span: { start: 0, end: 7 }, reversed: false }],
        });
    });

    test("puts the cursor at the end of each converted text when selectConverted is off, and still reports the converted spans", () => {
        const plan = planChange(
            "fooBar bazQux",
            [
                { anchor: 6, active: 0 },
                { anchor: 9, active: 9 },
            ],
            snake,
            { includeDot: false, selectConverted: false },
        );
        assert.deepEqual(plan.selections, [
            { anchor: 7, active: 7 },
            { anchor: 15, active: 15 },
        ]);
        assert.deepEqual(plan.converted, [
            { span: { start: 0, end: 7 }, reversed: true },
            { span: { start: 8, end: 15 }, reversed: false },
        ]);
    });
});

suite("convertedTexts", () => {
    test("converts each selection and each word at a cursor once, in document order, and skips empty cursors", () => {
        const selections = [
            { anchor: 9, active: 9 },
            { anchor: 0, active: 6 },
            { anchor: 2, active: 2 },
            { anchor: 14, active: 14 },
        ];
        assert.deepEqual(convertedTexts("fooBar bazQux  ", selections, snake, false), ["foo_bar", "baz_qux"]);
    });
});
