import { defineRule } from "@oxlint/plugins";

import type { ESTree, SourceCode } from "@oxlint/plugins";

/** Phrases that state how the code CHANGED rather than how it works now.
 *
 *  Every entry has to be historical in essentially every English sentence it can appear in, because
 *  the rule reads prose and cannot parse it. That test excludes several obvious-looking candidates:
 *
 *    - bare `used to`, because "a selector used to find the element" is a purpose, not a past tense.
 *      `used to be` is unambiguous and is here; `used to` alone is not and is not.
 *    - bare `moved to`, because "focus moved to the next option" describes behaviour. `has moved to`
 *      and `was moved to` are the historical forms and are here.
 *    - `deprecated`, because `@deprecated` is a TSDoc tag describing the CURRENT state of an API.
 *    - ISO dates, because any code that formats or parses a date carries format examples, and
 *      those are legitimate prose.
 *    - `changed`, because `Changed` is a Message name across this codebase.
 *
 *  `no longer` is the one entry that is not airtight: it can describe a runtime condition ("a dump
 *  that no longer has the expected shape"). It stays because it is the most common history marker by
 *  far, and the runtime reading is nearly always clearer rewritten as "does not". */
const HISTORY_PHRASES = [
    "no longer",
    "previously",
    "formerly",
    "used to be",
    "renamed from",
    "renamed to",
    "in the past",
    "currently unused",
    "is now called",
    "has moved to",
    "was moved to",
    "as of version",
] as const;

const HISTORY_PATTERN = new RegExp(String.raw`\b(${HISTORY_PHRASES.join("|")})\b`, "giu");

/** True for a `/** … *\/` block. A `/* … *\/` block and a `//` line comment are internal English by
 *  the rule in CLAUDE.md, and neither reaches a consumer. */
function isTsDoc(comment: ESTree.Comment): boolean {
    return comment.type === "Block" && comment.value.startsWith("*");
}

/** True when `node` sits under an `export`. Signatures inside a non-exported local interface are
 *  internal, so they are not consumer-visible and the rule leaves them alone.
 *
 *  This reads the declaration form only. A declaration exported separately, as `const x = …` followed
 *  by `export { x }`, is NOT seen as exported. A codebase that exports at the declaration
 *  everywhere loses nothing to that gap; closing it would need a Program-level pass over the
 *  export specifiers. */
function isExported(node: ESTree.Node): boolean {
    let current: ESTree.Node | null | undefined = node;
    while (current) {
        if (current.type === "ExportNamedDeclaration" || current.type === "ExportDefaultDeclaration") return true;
        current = current.parent;
    }
    return false;
}

function firstHistoryPhrase(sourceCode: SourceCode, node: ESTree.Node): string | undefined {
    for (const comment of sourceCode.getCommentsBefore(node)) {
        if (!isTsDoc(comment)) continue;
        HISTORY_PATTERN.lastIndex = 0;
        const match = HISTORY_PATTERN.exec(comment.value);
        if (match) return match[1];
    }
    return undefined;
}

/** Require consumer-visible TSDoc to describe the present behaviour rather than the change history. */
export const noHistoryInPublicDocsRule = defineRule({
    meta: {
        type: "problem",
        docs: {
            description:
                "Disallow migration and change-history prose in the TSDoc of exported declarations and their members.",
        },
        messages: {
            historyInPublicDoc:
                'This exported TSDoc says how the code changed ("{{phrase}}"). Document how it works NOW: state the present behaviour and delete the history. Rationale that is genuinely about the current design belongs in an internal comment below the docstring. See AGENTS.md / CLAUDE.md, "Documentation Describes the Current State".',
        },
    },
    createOnce(context) {
        const checkDoc = (node: ESTree.Node) => {
            if (!isExported(node)) return;
            const phrase = firstHistoryPhrase(context.sourceCode, node);
            if (phrase === undefined) return;
            context.report({ node, messageId: "historyInPublicDoc", data: { phrase } });
        };

        return {
            ExportNamedDeclaration: checkDoc,
            ExportDefaultDeclaration: checkDoc,
            TSPropertySignature: checkDoc,
            TSMethodSignature: checkDoc,
        };
    },
});
