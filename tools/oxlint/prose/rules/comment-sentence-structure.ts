import { defineRule, type ESTree } from "@oxlint/plugins";

import { proseSentences, wordCount } from "../prose.ts";

/** Longest sentence a comment may hold. A backstop, not the target: CLAUDE.md asks for short
 *  sentences with one idea each. This limit only catches the ones no reader could follow. A
 *  limit of 30 words produced 257 findings when measured against a real codebase. */
const MAX_WORDS = 40;

/** How many dashes in one sentence mean the clauses are stacked.
 *
 *  Two dashes is one ordinary parenthetical and is correct punctuation. A limit of 2 produced 56
 *  findings that were nearly all of that kind. Three means a parenthetical inside a parenthetical,
 *  which is the thing that is hard to read. */
const MAX_DASHES = 2;

/** An em dash anywhere, or a hyphen with space on both sides. A hyphen inside a word does not
 *  count, so `low-hanging` and `data-slot` do not match. */
const DASH_PATTERN = /—|(?<=\s)-(?=\s)/gu;

/** One comment, or one block of `//` lines, as a single piece of text plus the source offset of
 *  every character in it. */
interface Run {
    readonly text: string;
    readonly offsets: ReadonlyArray<number>;
}

/** True when the comment is a `//` line that continues the one before it. */
function continuesRun(previous: ESTree.Comment | undefined, comment: ESTree.Comment): boolean {
    if (previous === undefined) return false;
    if (previous.type !== "Line" || comment.type !== "Line") return false;
    if (comment.loc.start.column !== previous.loc.start.column) return false;
    return comment.loc.start.line === previous.loc.end.line + 1;
}

/** Offsets of each character of `comment.value` in the source. `value` excludes the opening `//` or
 *  `/*`, and both are two characters wide. */
function offsetsOf(comment: ESTree.Comment): Array<number> {
    const base = comment.range[0] + 2;
    return Array.from({ length: comment.value.length }, (_unused, index) => base + index);
}

/** Group the comments into runs. A block comment is one run. Consecutive `//` lines join into one,
 *  because a paragraph written across five `//` lines is one paragraph, and measuring each line on
 *  its own would find nothing. */
function runsOf(comments: ReadonlyArray<ESTree.Comment>): ReadonlyArray<Run> {
    const runs: Array<Run> = [];
    let previous: ESTree.Comment | undefined = undefined;
    for (const comment of comments) {
        if (comment.type === "Shebang") {
            previous = undefined;
            continue;
        }
        const last = runs[runs.length - 1];
        if (last !== undefined && continuesRun(previous, comment)) {
            const joined = {
                text: last.text + "\n" + comment.value,
                offsets: [...last.offsets, comment.range[0], ...offsetsOf(comment)],
            };
            runs[runs.length - 1] = joined;
        } else {
            runs.push({ text: comment.value, offsets: offsetsOf(comment) });
        }
        previous = comment;
    }
    return runs;
}

/** Require comment sentences to stay short and to keep their clauses apart.
 *
 *  The rule has no fixer, on purpose. There is no mechanical way to turn one 47-word sentence into
 *  two good ones. It names the count and the policy section, and you write the replacement. */
export const commentSentenceStructureRule = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "Disallow over-long comment sentences and stacked clauses.",
        },
        messages: {
            longSentence:
                'This sentence is {{words}} words. Split it into shorter sentences, one idea each. See AGENTS.md / CLAUDE.md, "Documentation Language (B2 English)".',
            stackedDashes:
                'This sentence stacks {{dashes}} clauses behind dashes. Rewrite it as separate sentences. See AGENTS.md / CLAUDE.md, "Documentation Language (B2 English)".',
        },
    },
    createOnce(context) {
        return {
            Program() {
                for (const run of runsOf(context.sourceCode.getAllComments())) {
                    for (const sentence of proseSentences(run.text)) {
                        // `offsets` is as long as `text`, so both reads are in range. The config
                        // does not set `noUncheckedIndexedAccess`, so these are `number`, and an
                        // `=== undefined` guard here would be a type error rather than a check.
                        const range: [number, number] = [
                            run.offsets[sentence.start],
                            run.offsets[sentence.start + sentence.text.length - 1] + 1,
                        ];

                        const words = wordCount(sentence.text);
                        if (words > MAX_WORDS) {
                            context.report({
                                node: { range },
                                messageId: "longSentence",
                                data: { words: String(words) },
                            });
                        }

                        DASH_PATTERN.lastIndex = 0;
                        const dashes = sentence.text.match(DASH_PATTERN)?.length ?? 0;
                        if (dashes > MAX_DASHES) {
                            context.report({
                                node: { range },
                                messageId: "stackedDashes",
                                data: { dashes: String(dashes) },
                            });
                        }
                    }
                }
            },
        };
    },
});
