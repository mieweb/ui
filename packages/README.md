# Packages (Submodules as Workspace Members)

This directory contains git submodules that are automatically integrated into the
`@mieweb/ui` pnpm workspace. When a submodule depends on `@mieweb/ui`, the
workspace resolves it to the **local source** instead of fetching from npm —
giving you live, un-published changes during development.

When any of these packages are **cloned standalone** (outside this repo), there
is no workspace — they fall back to the published `@mieweb/ui` version from npm.
No code changes are needed — the same `package.json` works in both contexts.

## How it works

Three files in the repo root make this possible:

### 1. `pnpm-workspace.yaml`

Declares every directory under `packages/` as a workspace member:

```yaml
packages:
  - "packages/*"
```

### 2. `.npmrc`

Enables workspace linking in pnpm v10+ (where it defaults to `false`):

```ini
link-workspace-packages = true
```

### 3. `pnpm.overrides` in `package.json`

Because the root `@mieweb/ui` package has a `file:` dev-dependency on
`datavis` (for Storybook/builds), pnpm detects a **cyclic workspace
dependency** and falls back to the npm registry version. The override forces
the local link:

```jsonc
// package.json (root)
"pnpm": {
  "overrides": {
    "@mieweb/ui": "link:."
  }
}
```

This override only exists in the workspace root. When a submodule is cloned
standalone, there is no override — it installs `@mieweb/ui` from npm normally.

### Resolution summary

| Context | What happens to `"@mieweb/ui": "^0.2.2"` |
|---|---|
| **Inside this repo** (workspace active) | Resolved to the local root via `link:` — you always get the latest source. |
| **Cloned standalone** (no workspace root) | Installed from the npm registry as usual. |

No special syntax like `workspace:` is required in the submodule's
`package.json`. The standard semver range (`^0.2.2`) works everywhere.

## Existing submodules

| Submodule | Path | Depends on `@mieweb/ui` |
|---|---|---|
| `@mieweb/datavis` | `packages/datavis` | Yes |

## Adding a new submodule

### 1. Add the git submodule

```bash
git submodule add https://github.com/mieweb/<repo>.git packages/<repo>
```

This updates `.gitmodules` and creates the `packages/<repo>` directory.

### 2. Declare the dependency in the submodule's `package.json`

In the submodule's own `package.json`, list `@mieweb/ui` with a normal semver
range (not `workspace:`):

```json
{
  "dependencies": {
    "@mieweb/ui": "^0.2.2"
  }
}
```

This is the only thing needed. Because `pnpm-workspace.yaml` includes
`packages/*`, pnpm already knows about the new package.

### 3. Install from the workspace root

```bash
pnpm install
```

pnpm will symlink `@mieweb/ui` into the submodule's `node_modules` pointing at
the workspace root (via the override in the root `package.json`). You can verify:

```bash
node -e "console.log(require('fs').realpathSync('packages/<repo>/node_modules/@mieweb/ui'))"
# → /path/to/ui  (the workspace root)
```

### 4. If the root depends on the new submodule

If the root `package.json` adds a `file:` or `workspace:` dependency on the new
submodule (e.g. for Storybook stories), this creates a **cyclic dependency**:

```
@mieweb/ui → packages/<repo> → @mieweb/ui
```

The existing `pnpm.overrides` in the root already handles this — it forces
`@mieweb/ui` to resolve as `link:.` for all workspace members regardless of
cycles. No additional configuration is needed.

### 4. (Optional) Submodule uses npm internally

If the submodule has its own `package-lock.json` and contributors sometimes run
`npm install` inside it standalone, that still works — npm will pull `@mieweb/ui`
from the registry. The `pnpm-workspace.yaml` only takes effect when `pnpm install`
is run from the **workspace root**.

## Working with submodules day-to-day

### Initial clone (includes submodules)

```bash
git clone --recurse-submodules https://github.com/mieweb/ui.git
cd ui
pnpm install
```

### Already cloned — pull submodule updates

```bash
git submodule update --init --recursive
pnpm install
```

### Developing a submodule against local `@mieweb/ui` changes

Just edit code in both the root (`src/`) and the submodule (`packages/<repo>/`).
Because the workspace symlinks the local package, the submodule sees your changes
immediately (after a rebuild/HMR cycle if applicable).

### Publishing / CI in the submodule's own repo

When CI or another developer clones only the submodule repo (not through this
parent), there is no workspace. `npm install` or `pnpm install` inside that repo
will fetch `@mieweb/ui` from npm at the version specified in `package.json`.
No special handling is needed.

## FAQ

**Q: Do I need to use `workspace:^` protocol in the submodule's `package.json`?**

No. Using a plain semver range like `"^0.2.2"` is intentional — it keeps the
submodule installable standalone. The `workspace:` protocol would fail outside
the workspace context.

**Q: What if the local `@mieweb/ui` version doesn't satisfy the range?**

pnpm will warn you. Bump the version in the root `package.json` or relax the
range in the submodule's `package.json`.

**Q: Can submodules depend on each other?**

Yes. Any `packages/*` member can depend on any other workspace member. pnpm
resolves them all via symlinks.

**Q: Does this affect the submodule's lock file?**

When installing from the workspace root, pnpm uses the root `pnpm-lock.yaml`.
The submodule's own `package-lock.json` (if it has one) is only used when
someone runs `npm install` inside the submodule directly.
