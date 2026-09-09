import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MotionProvider } from './MotionProvider';
import { Animated, AnimatedPresence } from './Animated';
import { Button } from '../components/Button';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof MotionProvider> = {
  id: 'foundations-motion',
  title: 'Foundations/Motion',
  component: MotionProvider,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

Opting an application into real animations. Components ship with CSS transitions and look finished without any of this; wrapping the app in \`<MotionProvider>\` from \`@mieweb/ui/motion\` upgrades the ones that support it to spring-driven transforms and, crucially, **exit** animations, which CSS cannot express for an element that unmounts.

The opt-in is resolved in the module graph, not by a prop. \`motion\` is an optional peer dependency imported only by the \`@mieweb/ui/motion\` entry, so an app that never imports that entry never pays for it and its bundle is unchanged.

This page documents the layer itself; the subject in every story below is a panel built from \`Animated\` rather than a library component. To see what motion does to a component, use the **Motion** story on that component's own page — [Modal](?path=/story/overlays-modal--motion) and [Sidebar](?path=/story/overlays-sidebar--motion) are the two wired up so far.

### Use it when

- The product wants motion as a deliberate, consistent layer rather than per-component one-offs.
- You need an element to animate *out*. A component that returns \`null\` on close has no element left for CSS to transition.
- You want motion policy — duration, easing, reduced-motion handling — configured once at the root.

### Don't use it when

- A single component needs a bespoke transition. Pass it a \`className\` with a CSS transition instead; that costs nothing.
- The animation is a looping or decorative effect (spinners, skeletons). Those stay in CSS.
- Bundle size is the binding constraint and the CSS transitions already look right — that is the supported default, not a degraded mode.

### Example

Install the optional peer dependency, then wrap the app once:

\`\`\`sh
npm install motion
\`\`\`

\`\`\`tsx
import { MotionProvider } from '@mieweb/ui/motion';

createRoot(el).render(
  <MotionProvider>
    <App />
  </MotionProvider>
);
\`\`\`

That is the entire opt-in. Existing \`<Modal>\` and \`<Sidebar>\` call sites need no changes. To animate a component of your own on the same presets:

\`\`\`tsx
import { Animated, AnimatedPresence } from '@mieweb/ui';

<AnimatedPresence>
  {open && (
    <Animated key="panel" preset="modalContent" mode="presence" className="...">
      {children}
    </Animated>
  )}
</AnimatedPresence>
\`\`\`

Note that import is from \`@mieweb/ui\`, not \`@mieweb/ui/motion\`: \`Animated\` renders a plain element when no provider is present, so a component written this way still works in apps that have not opted in. The stories below are built exactly this way.

### Limitations

- Only \`Modal\` and \`Sidebar\` are wired up so far. Every other component ignores the provider and keeps its CSS transitions.
- \`reducedMotion\` defaults to \`'user'\`, which drops transforms and keeps opacity when the OS asks for reduced motion. Verify both paths — they are different code.
- Motion holds an element at rest with a \`transform\`, and a transformed ancestor becomes the containing block for \`position: fixed\` descendants. Components that are only sometimes animated should pass \`enabled={false}\` the rest of the time, as \`Sidebar\` does on desktop.
- \`disabled\` forces every component back onto the CSS path. It exists for test runs, where springs make assertions timing-dependent. Flipping it remounts \`Animated\` elements (they swap between motion components and plain tags), so set it once per suite rather than toggling it mid-interaction.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/motion',
      relationships: [
        {
          type: 'composes with',
          target: 'overlays-modal',
          why: 'MotionProvider upgrades Modal to spring transitions and gives it a real exit animation, which the CSS path cannot do because the dialog unmounts on close.',
        },
        {
          type: 'composes with',
          target: 'overlays-sidebar',
          why: 'MotionProvider fades the rail\u2019s labels on desktop collapse and upgrades the mobile drawer to a spring slide with a fading backdrop.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description:
        "Disable this layer's animations, forcing every component onto its CSS fallback. A runtime is still supplied — this is not the same branch as omitting the provider, though the rendered output matches.",
      table: { category: 'Behaviour' },
    },
    reducedMotion: {
      control: 'select',
      options: ['user', 'always', 'never'],
      description: 'How to honor the OS "reduce motion" setting.',
      table: { category: 'Accessibility' },
    },
  },
  args: {
    disabled: false,
    reducedMotion: 'user',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Demos
// =============================================================================

function Stage({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 p-8">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-prose text-sm">{hint}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * The subject for every story on this page is a panel built from `Animated`,
 * not a library component.
 *
 * Deliberate: this page documents the layer, so demonstrating it with `Modal`
 * would duplicate that component's own Motion story and blur whose behaviour
 * is on show. It doubles as the reference for consumers animating something
 * the library does not cover.
 */
function PanelDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen((isOpen) => !isOpen)}>
        {open ? 'Hide panel' : 'Show panel'}
      </Button>
      <AnimatedPresence>
        {open && (
          <Animated
            key="panel"
            preset="modalContent"
            mode="presence"
            className="border-border bg-card max-w-md rounded-xl border p-6 shadow-lg"
          >
            <p className="text-sm">
              This panel is not a library component. It composes{' '}
              <code>Animated</code> and <code>AnimatedPresence</code> against
              the shared presets, and renders as a plain <code>div</code> in
              apps that have not opted in.
            </p>
          </Animated>
        )}
      </AnimatedPresence>
    </div>
  );
}

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  render: (args) => (
    <MotionProvider {...args}>
      <Stage
        title="With motion"
        hint="Show and hide the panel. It springs in, and on hide it animates out before unmounting — the enter is the obvious half, the exit is the half CSS cannot do."
      >
        <PanelDemo />
      </Stage>
    </MotionProvider>
  ),
};

export const WithoutMotion: Story = {
  args: { disabled: true },
  render: (args) => (
    <MotionProvider {...args}>
      <Stage
        title="Without motion"
        hint="What an app that has not imported @mieweb/ui/motion gets. `Animated` renders a plain element, so the panel appears and disappears on the frame it is toggled."
      >
        <PanelDemo />
      </Stage>
    </MotionProvider>
  ),
};

export const ReducedMotion: Story = {
  args: { reducedMotion: 'always' },
  render: (args) => (
    <MotionProvider {...args}>
      <Stage
        title="Reduced motion"
        hint="What a user with `prefers-reduced-motion` sees. Transforms are dropped and only opacity animates — the panel still enters and exits, it just does not travel or scale."
      >
        <PanelDemo />
      </Stage>
    </MotionProvider>
  ),
};
