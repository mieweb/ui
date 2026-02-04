'use strict';

// src/utils/environment.ts
function isStorybookDocsMode() {
  if (typeof window === "undefined") return false;
  return window.location.search.includes("viewMode=docs");
}

exports.isStorybookDocsMode = isStorybookDocsMode;
//# sourceMappingURL=chunk-SCV7C55E.cjs.map
//# sourceMappingURL=chunk-SCV7C55E.cjs.map