import { convertText } from "./plan.ts";

import type { CaseCommand, CaseOptions } from "./cases.ts";

/** What `Change Case: Cycle` steps through: for each step, the text of every target. No two steps
 *  are the same, and the text from before the first step is one of them. `position` is the step shown now. */
export interface Cycle {
    readonly steps: ReadonlyArray<ReadonlyArray<string>>;
    readonly position: number;
}

/** The cycle from `originals`, the text of each target, through `cases`, positioned at `originals`.
 *  Every step converts from `originals`, so a case that loses information, such as constant on
 *  `i18n`, does not change the steps after it. All targets are in the same case at each step. */
export const startCycle = (
    originals: ReadonlyArray<string>,
    cases: ReadonlyArray<CaseCommand>,
    options: CaseOptions,
): Cycle => {
    const converted = cases.map((command) =>
        originals.map((text) => convertText(text, (line) => command.convert(line, options))),
    );
    const steps = new Map([...converted, originals].map((texts) => [JSON.stringify(texts), texts]));
    return { steps: [...steps.values()], position: [...steps.keys()].indexOf(JSON.stringify(originals)) };
};

export const advanceCycle = (cycle: Cycle): Cycle => ({
    ...cycle,
    position: (cycle.position + 1) % cycle.steps.length,
});

export type CycleSetting = { readonly cases: ReadonlyArray<CaseCommand> } | { readonly error: string };

/** The cases that the `changeCase.cycle` setting names, in its order. */
export const parseCycleSetting = (names: ReadonlyArray<string>, commands: ReadonlyArray<CaseCommand>): CycleSetting => {
    const cases: Array<CaseCommand> = [];
    const unknownNames: Array<string> = [];
    for (const name of names) {
        const command = commands.find((candidate) => candidate.name === name);
        if (command === undefined) unknownNames.push(`"${name}"`);
        else cases.push(command);
    }
    if (unknownNames.length > 0) {
        return { error: `The changeCase.cycle setting has no case named ${unknownNames.join(", ")}.` };
    }
    return { cases };
};
