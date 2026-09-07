# Catalog family pages

One MDX page per **family** in [.storybook/taxonomy.json](../../.storybook/taxonomy.json),
titled `<Tier>/<Family>/Overview`. Each page is the family's landing page in the Storybook sidebar
and holds the **one comparison table** that every member links to (through its `Related` list,
rendered from `parameters.catalog.relationships`).

Rules:

- One file per family, named after the family (`Grids.mdx`, `Feedback.mdx`).
- The table lists every member with "use it when" / "not when" in one line each, linking by stable
  id (`?path=/docs/<id>--docs`), never by title.
- Family-level policy (e.g. "grids start with DataVis NITRO") lives here and is quoted, not
  paraphrased, by the member pages and by CONTRIBUTING / agent rules.
- `pnpm catalog:check` warns for families without an Overview page.
