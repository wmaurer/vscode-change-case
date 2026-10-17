import { eslintCompatPlugin } from "@oxlint/plugins";

import { commentSentenceStructureRule } from "./rules/comment-sentence-structure.ts";
import { noHistoryInPublicDocsRule } from "./rules/no-history-in-public-docs.ts";
import { plainEnglishCommentsRule } from "./rules/plain-english-comments.ts";

/** First-party Oxlint rules about the English in comments. Separate from
 *  `tools/oxlint/anti-slop`, which is vendored upstream source that PROVENANCE.md requires stay
 *  byte-identical and therefore cannot be added to. The master copy of this tree is
 *  `tools/scripts/rules/prose/` in the scaffold repo, with its tests in
 *  `tools/scripts/test/prose/`. Edit it there; every other copy is generated. */
const prosePlugin = eslintCompatPlugin({
    meta: { name: "prose" },
    rules: {
        "comment-sentence-structure": commentSentenceStructureRule,
        "no-history-in-public-docs": noHistoryInPublicDocsRule,
        "plain-english-comments": plainEnglishCommentsRule,
    },
});

export default prosePlugin;
