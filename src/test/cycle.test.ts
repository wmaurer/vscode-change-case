import * as assert from "node:assert/strict";

import { caseCommands } from "../cases.ts";
import { advanceCycle, parseCycleSetting, startCycle } from "../cycle.ts";

const defaultCases = ["camel", "snake", "constant", "pascal", "kebab"].flatMap((name) =>
    caseCommands.filter((command) => command.name === name),
);

// The texts that pressing Cycle `presses` times shows, one string per press, starting from `originals`.
const press = (originals: ReadonlyArray<string>, presses: number, cases = defaultCases): ReadonlyArray<string> => {
    const shown: Array<string> = [];
    let cycle = startCycle(originals, cases, {});
    for (let count = 0; count < presses; count += 1) {
        cycle = advanceCycle(cycle);
        shown.push((cycle.steps[cycle.position] ?? []).join(" | "));
    }
    return shown;
};

suite("cycle", () => {
    test("goes through each case in turn, and back to the first", () => {
        assert.deepEqual(press(["fooBar"], 5), ["foo_bar", "FOO_BAR", "FooBar", "foo-bar", "fooBar"]);
    });

    test("starts after the case that the text is in", () => {
        assert.deepEqual(press(["FOO_BAR"], 2), ["FooBar", "foo-bar"]);
    });

    test("skips cases that give the same text, so a one-word name reaches every result", () => {
        assert.deepEqual(press(["foo"], 3), ["FOO", "Foo", "foo"]);
    });

    test("converts from the text before the first press, so a case that loses information does not stick", () => {
        assert.deepEqual(press(["i18n"], 3), ["I18N", "I18n", "i18n"]);
        assert.deepEqual(press(["get_x_y"], 5), ["GET_X_Y", "GetXY", "get-x-y", "getXY", "get_x_y"]);
    });

    test("returns to text that is in none of the cases after the last case", () => {
        assert.deepEqual(press(["Foo bar"], 6), ["fooBar", "foo_bar", "FOO_BAR", "FooBar", "foo-bar", "Foo bar"]);
    });

    test("puts every target in the same case, starting from the first case when they are in different cases", () => {
        assert.deepEqual(press(["fooBar", "foo_bar"], 2), ["fooBar | fooBar", "foo_bar | foo_bar"]);
        assert.deepEqual(press(["fooBar", "bazQux"], 1), ["foo_bar | baz_qux"]);
    });

    test("converts each line of a target on its own", () => {
        assert.deepEqual(press(["fooBar\n  bazQux"], 1), ["foo_bar\n  baz_qux"]);
    });
});

suite("the changeCase.cycle setting", () => {
    test("gives the named cases in the order of the setting", () => {
        assert.deepEqual(parseCycleSetting(["snake", "camel"], caseCommands), {
            cases: [
                caseCommands.find((command) => command.name === "snake"),
                caseCommands.find((command) => command.name === "camel"),
            ],
        });
    });

    test("names each unknown case", () => {
        assert.deepEqual(parseCycleSetting(["camelCase", "snake", "snake_case"], caseCommands), {
            error: 'The changeCase.cycle setting has no case named "camelCase", "snake_case".',
        });
    });
});
