/** Shared text handling for the two comment-prose rules. Both read the same comment text, and both
 *  need code removed from the text and offsets that still point into the original. */

/** A piece of comment text with the index it starts at. The index is into whatever string was
 *  passed in, so a caller can report the exact span in the source. */
export interface Span {
    readonly text: string;
    readonly start: number;
}

/** The comment text with every code span blanked out, keeping the length so a match offset is still
 *  an offset into the original.
 *
 *  CLAUDE.md keeps code identifiers verbatim: they are not prose. A banned word inside backticks is
 *  naming a symbol, so it passes; the same word in a sentence is prose, so it does not. Newlines are
 *  kept, so a fenced block does not change the line structure that `chunks` reads. */
export function withoutCodeSpans(value: string): string {
    return value.replace(/```[\s\S]*?```|`[^`]*`/gu, (span) => span.replace(/[^\n]/gu, " "));
}

/** The comment text with the leading `*` of each TSDoc line blanked out, keeping the length.
 *
 *  Without this, `chunks` reads every TSDoc continuation line as a `*` bullet and breaks the
 *  paragraph apart, which hides every long sentence in a block comment. */
export function withoutDocPrefix(value: string): string {
    return value.replace(/^[ \t]*\*/gmu, (prefix) => " ".repeat(prefix.length));
}

/** A line that starts a new piece of text: a bullet, a numbered item, a `@tag`, or a blank line. */
const CHUNK_BOUNDARY = /^\s*(?:[-*+]\s|\d+[.)]\s|@\w+|$)/u;

/** Break the text at bullet, tag and blank lines.
 *
 *  This runs before sentence splitting and it is the highest-value step in the pipeline. Bullets
 *  often end in `;` rather than `.`, so without it a five-item list reads as one sentence of a
 *  hundred words and the count is meaningless. */
export function chunks(text: string): ReadonlyArray<Span> {
    const found: Array<Span> = [];
    let start = 0;
    let cursor = 0;
    for (const line of text.split("\n")) {
        if (CHUNK_BOUNDARY.test(line) && cursor > start) {
            found.push({ text: text.slice(start, cursor), start });
            start = cursor;
        }
        cursor += line.length + 1;
    }
    if (start < text.length) found.push({ text: text.slice(start), start });
    return found;
}

/** Text that ends in a period but does not end a sentence: a short abbreviation. */
const NOT_A_SENTENCE_END = /\b(?:e\.g|i\.e|etc|vs|cf)\.$/u;

/** Split the text after `.`, `!` or `?` followed by whitespace. One closing quote or bracket may
 *  sit between the punctuation and the whitespace, so a sentence that ends inside a quotation still
 *  ends. That closing character starts the next sentence, which keeps the abbreviation check
 *  reading a slice that ends in the period. */
export function sentences(text: string): ReadonlyArray<Span> {
    const found: Array<Span> = [];
    const boundary = /[.!?]["')\]]?(?=\s)/gu;
    let start = 0;
    for (let match = boundary.exec(text); match !== null; match = boundary.exec(text)) {
        const end = match.index + 1;
        if (NOT_A_SENTENCE_END.test(text.slice(start, end))) continue;
        found.push({ text: text.slice(start, end), start });
        start = end;
        while (start < text.length && /\s/u.test(text[start])) start += 1;
        boundary.lastIndex = start;
    }
    if (text.slice(start).trim().length > 0) found.push({ text: text.slice(start), start });
    return found;
}

/** Words in a sentence. A token counts only when it holds a letter or a digit, so a bare dash or a
 *  `(1)` does not inflate the number. */
export function wordCount(sentence: string): number {
    return sentence
        .trim()
        .split(/\s+/u)
        .filter((token) => /[A-Za-z0-9]/u.test(token)).length;
}

/** The whole pipeline: blank the code and the TSDoc stars, break into chunks, then split each chunk
 *  into sentences. Each `start` is an index into `value`. */
export function proseSentences(value: string): ReadonlyArray<Span> {
    const prose = withoutDocPrefix(withoutCodeSpans(value));
    const found: Array<Span> = [];
    for (const chunk of chunks(prose)) {
        for (const sentence of sentences(chunk.text)) {
            found.push({ text: sentence.text, start: chunk.start + sentence.start });
        }
    }
    return found;
}
