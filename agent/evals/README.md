# Agent team evals

Golden-question eval sets for the MIE UI agent team (#545, seeded by #587).
Each file covers one specialist domain with 20+ entries sourced from the real
adoption corpus — [lessons/](../../lessons/README.md), the generated and
hand-written [agent/skills/](../skills/), the installed
[mieweb-ui.instructions.md](../mieweb-ui.instructions.md), and past consumer
issues in this repo.

These files are maintainer-side quality tooling. They are **not** shipped by
`init-agent.mjs` — consumers get agents and skills, not the exam answers.

## Files

| File                           | Domain                               | Primary agent          |
| ------------------------------ | ------------------------------------ | ---------------------- |
| [selection.md](./selection.md) | Component selection / catalog        | MIE UI Design Agent    |
| [styling.md](./styling.md)     | Styling, tokens, brands, dark mode   | MIE UI Styling Agent   |
| [install.md](./install.md)     | Install, CSS foundation, wiring      | MIE UI Install Agent   |
| [a11y.md](./a11y.md)           | Accessibility                        | MIE UI A11y Agent      |
| [i18n.md](./i18n.md)           | Internationalization / RTL           | MIE UI i18n Agent      |
| [migration.md](./migration.md) | Migration / compliance (incl. icons) | MIE UI Migration Agent |
| [richtext.md](./richtext.md)   | Rich text / Kerebron editors         | MIE UI Rich Text Agent |
| [grids.md](./grids.md)         | DataVis NITRO + eSheet grids         | MIE UI Grids Agent     |
| [datavis.md](./datavis.md)     | Charts / maps / decks / org charts   | MIE UI DataVis Agent   |
| [views.md](./views.md)         | Views / dashboards / panels / shell  | MIE UI Views Agent     |

## Entry format

```markdown
### SEL-3 — Raw table replacement

- **Ask:** "What @mieweb/ui component replaces a raw `<table>`?"
- **Expect:** `Table` + composition slots for static rows; `DataVisNitroGrid`
  once sorting/filtering/paging/export is needed; never hand-roll grid features.
- **Agent:** MIE UI Design Agent
- **Source:** mieweb-ui.instructions.md — Rules 1, 3
```

- **Ask** — the question, phrased the way a consumer actually asks it.
- **Expect** — the key points a correct answer must contain. Not a transcript:
  an answer passes if every Expect point is present and nothing contradicts
  the corpus. Missing key points downgrade per the scoring procedure below
  (PARTIAL, or FAIL when the answer is wrong overall); inventing APIs or
  prescribing forbidden tooling is always FAIL.
- **Agent** — the specialist that should end up answering. When the question
  is posed to the MIE UI Design Agent, correct routing to this agent (or a
  correct direct answer where the orchestrator owns the domain, e.g.
  selection) is part of the pass criteria.
- **Source** — where the known-good answer lives, so graders can re-verify
  and corpus fixes have a target.

## Running a manual eval

1. Install the team into a sandbox app:
   `node <ui-repo>/agent/init-agent.mjs init-agent --experimental-agents`
   (run from the sandbox root; verify `pwd` first).
2. Open the installed agent for the domain under test (or start from the
   MIE UI Design Agent to also score routing).
3. Ask a sample of questions from the file — a stratified sample of 3–5 per
   domain is a meaningful smoke; the full set is for release-gating runs.
4. Score each answer PASS / PARTIAL / FAIL against **Expect**:
   - PASS — all key points present, no corpus contradictions.
   - PARTIAL — correct direction but a key point missing.
   - FAIL — wrong, invented, or missing answer; misrouted.
5. File every PARTIAL/FAIL as a corpus fix: if the knowledge exists but the
   agent missed it, fix the agent/skill prompt; if the knowledge is absent,
   add it to `lessons/` (and regenerate skills with `pnpm agent:skills` when
   the fix lands in generated inputs).

## Maintaining the sets

- Add entries when a real consumer question or issue exposes a gap — cite the
  issue number in **Source**.
- Update entries when the corpus changes (component retirements, new rules);
  stale Expect text is worse than no entry.
- Keep answers grounded: every Expect point must be verifiable in the cited
  source. Do not write aspirational answers.
