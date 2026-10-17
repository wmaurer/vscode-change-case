import { defineRule } from "@oxlint/plugins";

import { withoutCodeSpans } from "../prose.ts";

/** Figures of speech that carry no technical meaning. Each one has a plain replacement, so banning
 *  it costs nothing.
 *
 *  Entries have to be figurative in essentially every sentence they can appear in. That test rejects
 *  most software "idioms", because they are dead metaphors that have become the exact term:
 *
 *    - `falls back` / `fallback`, the single most common candidate, is the name of a real
 *      behaviour rather than a figure of speech. Every use of it measured in the codebase this
 *      list came from - 16 of them - was correct.
 *    - `the whole point` is figurative, but the words are common and a B2 reader parses it. Banning
 *      it would trade five edits for no gain in reading.
 *    - `by hand`, `drop`, `clean up` are ordinary verbs here, not figures of speech. */
const IDIOMS = [
    "under the hood",
    "under the covers",
    "out of the box",
    "at the end of the day",
    "low-?hanging fruit",
    "silver bullet",
    "rabbit hole",
    "heavy lifting",
    "in a nutshell",
    "bells and whistles",
    "foot-?gun",
    "paper over",
    "hand-?wav(e|ing|y)",
    "hand-?rolled",
    "in the wild",
    "happy path",
    "boils? down",
] as const;

/** Verbs that give a thing a mind. The subject pattern in front of them keeps the match to a thing
 *  rather than a person, so "the caller decides" and "you tell it" are untouched.
 *
 *  Rejected, because each is the standard term for what it describes and not a figure of speech:
 *  `listens` (a DOM event listener), `knows`, `decides`, `tries`, `refuses`, `survives`. */
const PERSONIFYING_VERBS = [
    "owes",
    "promises",
    "speaks",
    "believes",
    "thinks",
    "remembers",
    "forgets",
    "cares",
    "feels",
    "hopes",
    "prefers",
    "likes",
    "hates",
    "complains",
    "worries",
    "wants",
] as const;

/** Low-frequency words. A B2 reader either does not know them or has to stop and work them out.
 *
 *  The rule names the word and stops there. It does NOT say what to write instead, and it has no
 *  fixer. The fix is almost never a one-word swap. That is because the plain word that fits
 *  depends on what the sentence is about. Swapping a word in place can also break the grammar
 *  around it, or leave the sentence naming something that does not exist. Read the comment and
 *  write it again. */
const VOCABULARY = [
    "affordances?",
    "heuristics?",
    "adornments?",
    "grandfather(ed|ing|s)?",
    "aforementioned",
    "obviates?",
    "precludes?",
    "ameliorates?",
    "orthogonal",
    "idiomatic",
    "salient",
    "germane",
    "spurious",
    "pathological",
    "degenerate",
    "myriad",
    "plethora",
    "paradigm",
    "holistic",
    "seamless",
] as const;

const IDIOM_PATTERN = new RegExp(String.raw`\b(${IDIOMS.join("|")})\b`, "giu");
const PERSONIFICATION_PATTERN = new RegExp(
    String.raw`\b(?:it|this|that|the [a-z]+) (?:${PERSONIFYING_VERBS.join("|")})\b`,
    "giu",
);
const VOCABULARY_PATTERN = new RegExp(String.raw`\b(${VOCABULARY.join("|")})\b`, "giu");

interface Finding {
    readonly messageId: "idiom" | "personification" | "vocabulary";
    readonly start: number;
    readonly end: number;
    readonly phrase: string;
}

function findAll(value: string): ReadonlyArray<Finding> {
    const prose = withoutCodeSpans(value);
    const findings: Array<Finding> = [];

    for (const [pattern, messageId] of [
        [VOCABULARY_PATTERN, "vocabulary"],
        [IDIOM_PATTERN, "idiom"],
        [PERSONIFICATION_PATTERN, "personification"],
    ] as const) {
        pattern.lastIndex = 0;
        for (let match = pattern.exec(prose); match !== null; match = pattern.exec(prose)) {
            findings.push({
                messageId,
                start: match.index,
                end: match.index + match[0].length,
                phrase: match[0],
            });
        }
    }

    return findings;
}

/** Require comment prose to use plain English that a B2 reader can follow.
 *
 *  The rule has no fixer, on purpose. Every finding is a sentence to rewrite by hand, not a word to
 *  replace: an automatic swap produced broken grammar and comments that named code which was not
 *  there. It points at the exact span and leaves the writing to you. */
export const plainEnglishCommentsRule = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "Disallow idioms, personification, and low-frequency vocabulary in comment prose.",
        },
        messages: {
            idiom: 'This comment uses a figure of speech ("{{phrase}}"). Rewrite the sentence to say the same thing in plain words. See AGENTS.md / CLAUDE.md, "Documentation Language (B2 English)".',
            personification:
                'This comment gives a thing a mind ("{{phrase}}"). Describe what the code does instead. See AGENTS.md / CLAUDE.md, "Documentation Language (B2 English)".',
            vocabulary:
                'This comment uses an uncommon word ("{{phrase}}"). Rewrite the sentence in plain words - do not swap this one word out, or the sentence around it stops making sense. See AGENTS.md / CLAUDE.md, "Documentation Language (B2 English)".',
        },
    },
    createOnce(context) {
        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    if (comment.type === "Shebang") continue;
                    // `value` excludes the opening `//` or `/*`, both two characters wide.
                    const base: number = comment.range[0] + 2;
                    for (const finding of findAll(comment.value)) {
                        context.report({
                            node: { range: [base + finding.start, base + finding.end] },
                            messageId: finding.messageId,
                            data: { phrase: finding.phrase },
                        });
                    }
                }
            },
        };
    },
});
