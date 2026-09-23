import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from './Collapsible';
import { Button } from '../Button';
// Story-only import. Stories are not tsup entries, so this never reaches dist
// and `motion` stays an optional peer dependency for consumers.
import { MotionProvider } from '../../motion/MotionProvider';

const meta: Meta<typeof Collapsible> = {
  id: 'layout-collapsible',
  title: 'Components/Layout/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**One headless show/hide region.** \`Collapsible\` holds the state (\`open\` + \`onOpenChange\` controlled, or \`defaultOpen\` uncontrolled; \`disabled\` blocks toggling) and exposes it through context and \`data-state="open|closed"\`; \`CollapsibleTrigger\` is an **unstyled** \`<button>\` wired with \`aria-expanded\` / \`aria-controls\`; \`CollapsibleContent\` is the \`role="region"\` panel, **unmounted when closed** unless \`forceMount\` (then \`hidden\`). You bring every class.

### Use it when

- A single "Advanced settings" / "Show details" toggle whose trigger and panel must match the surrounding design exactly.
- The hidden content is expensive or stateful and should mount only on open (default) — or must stay alive (\`forceMount\`).
- You are building a bespoke disclosure (e.g. a row that expands inline) and only want the state + aria plumbing.

### Don't use it when

- Several labelled sections stack in one list — \`Accordion\` (styled, single/multiple, heading levels, animated).
- The user switches between peer views rather than revealing extra content — \`Tabs\`.
- Inside a \`Card\` you just need a "Show more" tail — \`CardCollapsible\`.
- The disclosure is a navigation group inside the sidebar rail — [\`SidebarNavGroup\`](?path=/docs/overlays-sidebar--docs). It shares this component's measured-height animation and \`forceMount\` trade-off, but adds the rail styling, the icon-only collapsed state, and the sidebar's accordion (\`groupId\`).

### Example

\`\`\`tsx
const [showAdvanced, setShowAdvanced] = useState(false);

<Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-muted px-4 py-2 text-sm font-medium">
    Advanced settings
    <ChevronDownIcon className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} aria-hidden="true" />
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2 space-y-3 rounded-md border border-border p-4">
    <RetryPolicyFields />
  </CollapsibleContent>
</Collapsible>
\`\`\`

Controlled here so the chevron can read the same state; \`defaultOpen\` alone works for fire-and-forget.

### Limitations

- Accessibility: trigger is \`<button type="button" aria-expanded aria-controls={contentId}>\` (ids from \`useId()\`); content is \`role="region" aria-labelledby={triggerId}\`. With the default unmount, \`aria-controls\` points at an element that does not exist while closed — use \`forceMount\` if that matters to your AT testing. Keyboard is native button behaviour only.
- **No animation by default** — content appears and disappears instantly unless the app opts into motion (see below). No icon, no styling, no \`asChild\`: the trigger is always a real \`<button>\`, so it cannot wrap a link or another button.
- \`disabled\` disables the trigger and ignores toggles, but does not close an already-open panel.
- RTL / responsive / theming: nothing built in — all classes are yours. No strings. No third-party dependencies.

### Motion

An app that opts into [\`@mieweb/ui/motion\`](?path=/docs/foundations-motion--docs) gets a height expand and collapse. This is the one component where motion adds a **capability** rather than polish: \`height: auto\` is not interpolable in CSS, so the alternative is a hard-coded \`max-height\` that either clips tall content or eases against dead space on short content. Motion measures the real height instead. See the **Motion** story below; nothing changes at the call site.

Two caveats worth knowing before you rely on it:

- **\`forceMount\` is deliberately never animated.** It depends on \`hidden\` to keep collapsed content out of the tab order, and \`display: none\` cannot be animated through. Animating it would let keyboard users tab into a visually collapsed panel.
- **This preset honours \`prefers-reduced-motion\` itself**, rather than relying on the provider. \`MotionConfig reducedMotion="user"\` drops transform and layout animations, and \`height\` is neither of those as far as motion is concerned — so it would otherwise keep animating for users who asked it not to.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'layout-accordion',
          why: 'Collapsible is one unstyled trigger + region whose content unmounts when closed; Accordion is a styled, animated stack of panels from an items array.',
        },
        {
          type: 'composes with',
          target: 'foundations-motion',
          why: 'MotionProvider animates the panel to its natural height, which CSS cannot do because height: auto is not interpolable.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-72">
      <CollapsibleTrigger className="bg-muted hover:bg-muted/80 flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium">
        Advanced settings
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border mt-2 rounded-md border p-4 text-sm">
        These settings are hidden until expanded.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-72">
      <CollapsibleTrigger className="bg-muted hover:bg-muted/80 flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium">
        Details
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border mt-2 rounded-md border p-4 text-sm">
        Visible from the start.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const Controlled: Story = {
  render: () => <ControlledCollapsible />,
};

function ControlledCollapsible() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-72">
      <CollapsibleTrigger className="bg-muted hover:bg-muted/80 flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium">
        {open ? 'Hide' : 'Show'} content
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border mt-2 rounded-md border p-4 text-sm">
        Controlled externally.
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// Motion
// ============================================================================

/**
 * A/B harness for the motion opt-in.
 *
 * Two panels of very different heights, because the height animation is the
 * whole point and a single short panel hides how badly a fixed `max-height`
 * would behave across both.
 *
 * Flipping the switch remounts the `Animated` element (it swaps between a
 * motion component and a plain tag), so compare by repeating the gesture with
 * the switch set each way rather than flipping it mid-animation.
 */
function MotionDemo() {
  const [motionEnabled, setMotionEnabled] = useState(true);

  return (
    <MotionProvider disabled={!motionEnabled}>
      <div className="flex w-80 flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMotionEnabled((enabled) => !enabled)}
            aria-pressed={motionEnabled}
          >
            Motion: {motionEnabled ? 'on' : 'off'}
          </Button>
          <p className="text-muted-foreground text-xs">
            Expand each panel with the switch set each way.
          </p>
        </div>

        <Collapsible>
          <CollapsibleTrigger className="bg-muted hover:bg-muted/80 flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium">
            Short panel
          </CollapsibleTrigger>
          <CollapsibleContent className="border-border mt-2 rounded-md border p-4 text-sm">
            One line of content.
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger className="bg-muted hover:bg-muted/80 flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium">
            Tall panel
          </CollapsibleTrigger>
          <CollapsibleContent className="border-border mt-2 space-y-3 rounded-md border p-4 text-sm">
            <p>
              Both panels animate to their own natural height from the same
              preset, with no per-instance tuning.
            </p>
            <p>
              A CSS <code>max-height</code> transition would need a number big
              enough for this panel, which would then make the short one ease
              against empty space before anything moved.
            </p>
            <p>
              That is the trade motion removes here, and the reason this is the
              one preset justified by capability rather than polish.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </MotionProvider>
  );
}

export const Motion: Story = {
  render: () => <MotionDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Collapsible under `@mieweb/ui/motion`. With motion on, each panel animates to its own natural height on expand and back down on collapse; with it off both appear and disappear instantly, because the content unmounts and `height: auto` gives CSS nothing to interpolate. Note the panel is clipped with `overflow-hidden` while travelling. This preset checks `prefers-reduced-motion` itself — with the OS setting on, both panels stay instant even with the switch on. The provider is normally mounted once at the app root; it is local here so the comparison can be toggled.',
      },
    },
  },
};
