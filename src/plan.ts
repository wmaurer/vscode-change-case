/** A range of document text, as character offsets from the start of the document. `start <= end`. */
export interface Span {
    readonly start: number;
    readonly end: number;
}

/** A selection, as document offsets. `anchor` is where the selection starts, `active` is where the cursor is. */
export interface OffsetSelection {
    readonly anchor: number;
    readonly active: number;
}

/** Replace the text in `span` with `text`. The span is in offsets of the document before any edit. */
export interface Edit {
    readonly span: Span;
    readonly text: string;
}

/** What one command does to a document: the edits to apply together, then the selections to set afterwards. */
export interface Plan {
    readonly edits: ReadonlyArray<Edit>;
    readonly selections: ReadonlyArray<OffsetSelection>;
}

// A Change Case word is wider than an editor word: it keeps `$`, `_`, `-` and `/`, and dots
// when the setting asks for them, so that `foo-bar` or `some/path` converts as one unit.
const wordPattern = /[\p{L}\p{M}\p{N}_$/-]+/gu;
const wordWithDotPattern = /[\p{L}\p{M}\p{N}_$/.-]+/gu;

// A run of only `-`, `/`, `$` or `.` is punctuation, such as a list bullet or `//`. Most
// conversions would delete it, so a word needs at least one letter or digit.
const letterOrDigitPattern = /[\p{L}\p{N}]/u;

/** The Change Case word that touches `offset`, or an empty span at `offset` when no word touches it. */
export const wordAt = (text: string, offset: number, includeDot: boolean): Span => {
    const lineStart = offset === 0 ? 0 : text.lastIndexOf("\n", offset - 1) + 1;
    const lineBreak = text.indexOf("\n", offset);
    const line = text.slice(lineStart, lineBreak === -1 ? text.length : lineBreak);
    for (const match of line.matchAll(includeDot ? wordWithDotPattern : wordPattern)) {
        const start = lineStart + match.index;
        const end = start + match[0].length;
        if (start <= offset && offset <= end && letterOrDigitPattern.test(match[0])) return { start, end };
    }
    return { start: offset, end: offset };
};

/** The text a command converts for `selection`: the selected text, or the word at the cursor when nothing is selected. */
export const spanOf = (text: string, selection: OffsetSelection, includeDot: boolean): Span =>
    selection.anchor === selection.active
        ? wordAt(text, selection.active, includeDot)
        : { start: Math.min(selection.anchor, selection.active), end: Math.max(selection.anchor, selection.active) };

// change-case and title-case both remove line breaks, and change-case also removes the
// whitespace around the text, so each line is converted on its own.
const lineBreakPattern = /(\r\n|\r|\n)/;
const convertLine = (line: string, convert: (text: string) => string): string => {
    const core = line.trim();
    if (core === "") return line;
    const leading = line.slice(0, line.length - line.trimStart().length);
    const trailing = line.slice(line.trimEnd().length);
    return `${leading}${convert(core)}${trailing}`;
};

/** Apply `convert` to each line of `text` on its own. Line breaks and the whitespace around each line are kept. */
export const convertText = (text: string, convert: (text: string) => string): string =>
    text
        .split(lineBreakPattern)
        .map((part, index) => (index % 2 === 1 ? part : convertLine(part, convert)))
        .join("");

interface Target {
    readonly span: Span;
    readonly reversed: boolean;
}

// Two cursors in one word give the same span twice, and the editor rejects overlapping edits.
// So targets that overlap, or that start at the same offset, become one target over both.
const mergeOverlapping = (targets: ReadonlyArray<Target>): ReadonlyArray<Target> =>
    targets
        .toSorted((a, b) => a.span.start - b.span.start)
        .reduce<ReadonlyArray<Target>>((merged, target) => {
            const previous = merged.at(-1);
            if (
                previous === undefined ||
                (target.span.start >= previous.span.end && target.span.start !== previous.span.start)
            ) {
                return [...merged, target];
            }
            const union = { start: previous.span.start, end: Math.max(previous.span.end, target.span.end) };
            return [...merged.slice(0, -1), { span: union, reversed: previous.reversed }];
        }, []);

const mergedTargets = (
    text: string,
    selections: ReadonlyArray<OffsetSelection>,
    includeDot: boolean,
): ReadonlyArray<Target> =>
    mergeOverlapping(
        selections.map((selection) => ({
            span: spanOf(text, selection, includeDot),
            reversed: selection.anchor > selection.active,
        })),
    );

/** How a command finds its text and what it selects afterwards. These come from the settings. */
export interface PlanOptions {
    /** Treat dots as part of the word at a cursor. */
    readonly includeDot: boolean;
    /** Select each converted text. When `false`, the cursor goes to the end of each converted text. */
    readonly selectConverted: boolean;
}

/** Plan how `convert`, applied to each line, changes `text` at each of `selections`.
 *
 *  After the edits, each converted span is selected in the direction of the selection it came from,
 *  or the cursor is at its end. A cursor that touches no word gets no edit and stays where it is. */
export const planChange = (
    text: string,
    selections: ReadonlyArray<OffsetSelection>,
    convert: (text: string) => string,
    options: PlanOptions,
): Plan => {
    const edits: Array<Edit> = [];
    const newSelections: Array<OffsetSelection> = [];
    // Each edit moves the text after it by the change in length, so later spans shift by the sum so far.
    let shift = 0;
    for (const { span, reversed } of mergedTargets(text, selections, options.includeDot)) {
        const original = text.slice(span.start, span.end);
        const replacement = convertText(original, convert);
        const start = span.start + shift;
        const end = start + replacement.length;
        if (replacement !== original) edits.push({ span, text: replacement });
        if (!options.selectConverted) newSelections.push({ anchor: end, active: end });
        else newSelections.push(reversed ? { anchor: end, active: start } : { anchor: start, active: end });
        shift += replacement.length - original.length;
    }
    return { edits, selections: newSelections };
};

/** The converted text at each of `selections`, in document order. Cursors that touch no word give nothing. */
export const convertedTexts = (
    text: string,
    selections: ReadonlyArray<OffsetSelection>,
    convert: (text: string) => string,
    includeDot: boolean,
): ReadonlyArray<string> =>
    mergedTargets(text, selections, includeDot)
        .filter(({ span }) => span.start < span.end)
        .map(({ span }) => convertText(text.slice(span.start, span.end), convert));
