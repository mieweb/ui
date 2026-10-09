import type { Meta, StoryObj } from '@storybook/react';
import { DateTime } from 'luxon';
import { ReviewCard } from './ReviewCard';

const longBody =
  'Booked a DOT physical for a new driver on short notice and they fit us in the same afternoon. ' +
  'Front desk had the paperwork ready, the provider explained the vision requirement clearly, and ' +
  'the results were uploaded before our driver got back to the yard. Parking is tight at lunch, ' +
  'so plan a few extra minutes. We have sent five more drivers since and the experience has been ' +
  'consistent each time — this is now our default clinic for the region.';

const meta: Meta<typeof ReviewCard> = {
  id: 'record-details-reviewcard',
  title: 'Components/Record details/ReviewCard',
  component: ReviewCard,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'record-details-rating',
          why: 'Shows the review score with a read-only Rating.',
        },
        {
          type: 'uses',
          target: 'data-display-clampedtext',
          why: 'Long review bodies clamp with a Show more toggle.',
        },
        {
          type: 'uses',
          target: 'data-display-avatar',
          why: "The author's photo or initials.",
        },
      ],
    },
    docs: {
      description: {
        component: `
### What it's for

One customer or patient review: author avatar and name, star \`Rating\`, a relative
("3 days ago") or absolute date, the source ("via Google"), the body clamped with
Show more, and an optional owner \`reply\`. Exported from the same entry as \`Rating\`.

### Use it when

- A clinic, provider or vendor profile lists its reviews.
- You show one featured testimonial with its score.

### Don't use it when

- The text is a conversation with back-and-forth — use a chat/thread component.
- There's no score — a plain quote or \`Card\` is simpler.

### Example

\`\`\`tsx
{reviews.map((r) => (
  <ReviewCard
    key={r.id}
    author={{ name: r.author, avatarUrl: r.photo }}
    date={r.createdAt}
    rating={r.stars}
    body={r.text}
    source={r.source}
    reply={r.response && <p>{r.response}</p>}
  />
))}
\`\`\`

### Limitations

- Renders an \`<article>\`; the date is a \`<time dateTime>\` whose \`title\` always shows the absolute date. The reply is a \`<section>\` region named by \`labels.reply\`.
- Dates use Luxon with \`locale\` (default: runtime locale); relative dates are computed at render, not live-updated.
- Logical padding/border on the reply, so it indents correctly in RTL. Theme tokens only (\`bg-card\`, \`border-border\`).
- Strings default to English; override through \`labels\` and \`ratingLabels\`.
`,
      },
    },
  },
  argTypes: {
    author: { description: '`{ name, avatarUrl? }` of the reviewer.' },
    date: { description: 'When the review was written — ISO string or Date.' },
    dateStyle: {
      description: 'Relative ("3 days ago") or localized absolute date.',
      control: 'radio',
      options: ['relative', 'absolute'],
    },
    locale: { description: 'BCP 47 locale for the date.', control: 'text' },
    rating: {
      description: 'Star rating, half-star precision.',
      control: { type: 'number', step: 0.5 },
    },
    body: { description: 'Review text; long bodies clamp.' },
    source: { description: 'Where the review came from.', control: 'text' },
    reply: { description: 'Owner response rendered under the review.' },
    bodyLines: { description: 'Lines shown before the body clamps.' },
    labels: {
      description: 'Overrides for the source, reply and Show more strings.',
    },
  },
  args: {
    author: { name: 'Marcus Webb' },
    date: DateTime.now().minus({ days: 3 }).toISO()!,
    rating: 4.5,
    body: 'Fast, friendly, and the results were in our portal the same day.',
    source: 'Google',
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ReviewCard>;

export const Default: Story = {};

export const LongBodyWithReply: Story = {
  args: {
    body: longBody,
    reply: (
      <p>
        <strong className="text-foreground">Clinic response:</strong> Thank you
        — we&apos;re glad the same-day slot worked for your team.
      </p>
    ),
  },
};

export const AbsoluteDate: Story = {
  // A fixed date keeps the visual baseline stable.
  args: {
    date: '2026-03-09T15:00:00Z',
    dateStyle: 'absolute',
    locale: 'fr-FR',
    source: undefined,
  },
};
