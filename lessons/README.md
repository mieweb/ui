# Lessons Learned

Hard-won integration lessons from real-world projects that consumed `@mieweb/ui`.

These documents capture pitfalls, workarounds, and recommended changes discovered during real-world integrations. They serve three purposes:

1. **For consumers** — avoid the same traps when integrating `@mieweb/ui` into a Tailwind 4 project.
2. **For maintainers** — track improvements that should be made to the library itself so consumers don't have to work around these issues.
3. **For organizations** — standardize adoption, local development, and upstream contribution of components.

## Start Here

| File | Audience | Summary |
|------|----------|---------|
| [adopting-mieweb-ui.md](adopting-mieweb-ui.md) | Consumers | **Generic adoption guide** — audit, resolution, testing (brand/dark mode), gap detection for any project |
| [execution-plan.md](execution-plan.md) | AI / Consumers | **Step-by-step execution plan** — ordered migration steps for AI agents or developers to convert any project |
| [component-policy.md](component-policy.md) | Organizations | **Component policy** — use first → build locally → contribute upstream |
| [compliance-prompt.md](compliance-prompt.md) | AI / Consumers | **Reusable AI prompt** — paste into any coding session to audit and migrate a project |

## Reference

| File | Audience | Summary |
|------|----------|---------|
| [tailwind4-integration.md](tailwind4-integration.md) | Consumers + Maintainers | Tailwind CSS 4 setup, dark mode, brand switching, `@source`, CSS variable fallbacks |
| [migration-meteor-blaze-to-react.md](migration-meteor-blaze-to-react.md) | Consumers | Meteor-specific migration playbook: Meteor 2 Blaze → Meteor 3 React + TypeScript + Tailwind 4 + @mieweb/ui |
| [recommended-changes.md](recommended-changes.md) | Maintainers | Proposed library changes to eliminate consumer-side workarounds |
