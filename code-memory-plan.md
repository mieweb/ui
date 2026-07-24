# CodeLookup "Memory" — frequently-used codes picklist

Personal MRU/frequency picklist for CodeLookup: on focus with an **empty query**, show a
"Frequently used" menu of the user's most-picked codes, scoped by **(userId, context)**.
Counts persist in IndexedDB; an optional `serverUrl` seeds the list and receives lazily
flushed count deltas. Off by default — enabled via a single `memory` prop.

> Working agreement: complete a milestone → check its boxes → run its verification →
> commit with the listed message (ask before committing, per repo policy).

## Decisions (locked)

- **Storage: IndexedDB** — house pattern (`src/components/AI/voiceprintStore.ts`,
  `src/components/SuperChat/render/attachmentCache.ts`): promise-wrapped, graceful
  no-IDB degradation, testable with `fake-indexeddb`.
- **Server sync: full sync** — GET seed once per (user, context) per session, merge
  `max(count)`; debounced POST of count deltas; `sendBeacon` on `pagehide`.
- **Identity: developer-supplied `userId`** — missing → `'anonymous'` bucket.
  Multi-user in one browser = separate buckets keyed `userId|context|fullid`.
- **Phase 1 = empty-query menu only** — personal ranking boost while typing is phase 2.
- **API: single prop** — `memory?: false | CodeLookupMemoryConfig`; absent/false = off.

## API sketch

- `CodeLookupMemoryConfig { context: string; userId?: string; serverUrl?: string; limit?: number /* default 8 */ }`
- `CodeLookupProps` gains `memory?: false | CodeLookupMemoryConfig`
- `CodeLookupProviderConfig` gains optional `memory` defaults (`userId`, `serverUrl`);
  per-instance `context` always comes from the prop.
- IDB: db `mieweb-codelookup-memory`, store `usage`, key `` `${userId}|${context}|${fullid}` ``,
  record `{ userId, context, fullid, label, codetype, fullcode, domain, count, lastUsed, pendingDelta }`
  (full display fields stored — no shard rehydration needed).
- Sync protocol:
  - `GET {serverUrl}?user={userId}&context={context}` → `[{fullid,label,codetype,fullcode,domain,count}]`
  - `POST {serverUrl}` body `{user, context, deltas:[{fullid,label,codetype,fullcode,domain,delta}]}`

---

## Milestone 1 — memory store (pure TS, no React)

`src/components/CodeLookup/memoryStore.ts`, modeled on `voiceprintStore.ts`.

- [x] IDB open/upgrade helper with `hasIndexedDB()` guard; all APIs no-op cleanly without IDB (SSR/tests)
- [x] `recordUse(scope, result: CodifyResult)` — increment `count` + `pendingDelta`, set `lastUsed`
- [x] `getTopCodes(scope, limit): Promise<MemoryEntry[]>` — sort `count` desc, `lastUsed` tiebreak
- [x] `seedFromServer(scope, serverUrl)` — once per scope per session; merge `max(count)`
- [x] `scheduleFlush(scope, serverUrl)` — debounced POST of pending deltas; `sendBeacon` on `pagehide`; reset `pendingDelta` on success
- [x] `clearMemory(scope)` — reset for a (user, context) bucket

**Commit:** `feat(CodeLookup): memory store — IndexedDB usage counts with lazy server sync`

## Milestone 2 — store tests

`src/components/CodeLookup/memoryStore.test.ts` (vitest + `fake-indexeddb`, already a devDep).

- [x] record → getTopCodes ordering (count desc, lastUsed tiebreak, limit)
- [x] multi-user isolation (alice vs bob, same browser/db)
- [x] context isolation (`med-orders` vs `presenting-meds`, same user)
- [x] seed merge (server counts vs local counts → max wins; new entries added)
- [x] delta flush: mocked fetch receives correct payload; `pendingDelta` reset; failure keeps deltas
- [x] IDB-unavailable → all APIs resolve as no-ops (no throw)

**Verify:** `pnpm vitest run src/components/CodeLookup/memoryStore.test.ts`
**Commit:** `test(CodeLookup): memory store coverage — isolation, seed merge, delta flush`

## Milestone 3 — CodeLookup wiring

`src/components/CodeLookup/CodeLookup.tsx` + `context.tsx` + `index.ts`.

- [x] `memory` prop; resolve scope from prop + provider defaults (`context.tsx`: add `memory` defaults to `CodeLookupProviderConfig`, instance prop wins)
- [x] On mount / scope change: `seedFromServer` (if `serverUrl`) then load `getTopCodes` into state
- [x] Empty-query branch (`!q` in the debounced search effect): show memory entries flagged `viaMemory` instead of clearing/closing; `onFocus` opens when entries exist; `dropdownOpen` gains memory disjunct
- [x] "Frequently used" group header row (aria-labelled listbox group); existing keyboard-nav machinery reused unchanged
- [x] `pick(r)`: `recordUse` + `scheduleFlush` + refresh cached top list
- [x] Respect `initialQuery`/`skipSearchRef` seeded path — menu only on true empty-query focus
- [x] Export `CodeLookupMemoryConfig`, `MemoryEntry`, `clearMemory` from the component barrel (`index.ts`) — NOT `src/index.ts` (worker bundling constraint)

**Verify:** `pnpm vitest run src/components/CodeLookup/engine.test.ts` (no regressions) + typecheck
**Commit:** `feat(CodeLookup): memory picklist — frequently-used codes menu on empty-query focus`

## Milestone 4 — story + docs

- [ ] `WithMemory` story in `CodeLookup.stories.tsx`: alice/bob user toggle × orders/presenting context toggle demonstrating isolation; stubbed `fetch` for `serverUrl` (or omit serverUrl and demo local-only)
- [ ] `README.md`: document prop, scope semantics (user + context), sync protocol, storage, disable, multi-user
- [ ] Manual pass in Storybook (http://localhost:6006): pick codes → refocus shows count-ordered picklist; user/context switch isolates; page reload persists

**Commit:** `docs(CodeLookup): memory picklist story and README`

## Milestone 5 — final checks

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm format:fix`
- [ ] Full `pnpm vitest run src/components/CodeLookup/`
- [ ] Open PR

---

## Phase 2 (explicitly deferred — do not build now)

- Personal-count boost in `searchShards` ranking while typing (compose with population `docPrior`)
- Wrapper components (MedicationEditor, OrderEditor, AllergyManager, esheet fields) forwarding `memory` contexts through their `codeLookup` configs
- Reference server endpoint implementation
