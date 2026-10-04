import type { Meta, StoryObj } from '@storybook/react-vite';
import { FakeEhrStoryHost } from './FakeEhrStoryHost';

const meta: Meta<typeof FakeEhrStoryHost> = {
  id: 'encounter-orders-prescribing-simulation',
  title: 'Healthcare/Encounter & orders/PrescribingSimulation',
  component: FakeEhrStoryHost,
  tags: ['autodocs', 'scope:domain-specific', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'encounter-orders-prescriptionreadiness',
          why: 'The demo renders revision-specific readiness and issues using the published components.',
        },
        {
          type: 'uses',
          target: 'clinical-lists-medicationlist',
          why: 'The full medication editor completes drafts without making save imply send.',
        },
      ],
    },
    docs: {
      description: {
        component: `### What it's for

This demo-only EHR host connects the published UI and shared validator to an injected HTTP client and deterministic fake API. It shows validation, interactions, pregnancy precautions, dosing, PDMP, formulary/member benefit, PA, and simulated transmission as distinct outcomes. FakeEhrStoryHost is source-only and is not a package export.

### Use it when

Implementing or reviewing the EHR API integration. Start with Bare Lasix, save immediately, complete its details, then check readiness. Complete synthetic prescription demonstrates explicit review, simulated signing and acknowledgement. Select a scenario and variant to reproduce failures; reset drops records and pending jobs.

### Don't use it when

Providing real clinical recommendations or sending prescriptions. An EHR replaces the API transport and supplies maintained clinical evidence, jurisdiction and payer rules, authorization, signing and pharmacy integrations. Medication history can use MedicationList without opting into prescribing.

### Example

Save draft → Check readiness → resolve findings or current PDMP/PA requirements → individually select ready to sign → Review and select ready to sign → Simulate signing → Simulate send. Inspect serialized exchanges in the demo-only controls. A lost send response uses Recover send response; unknown delivery uses reconciliation before an eligible retry. The OpenAPI contract is at docs/prescribing-api.openapi.yaml in the repository.

### Limitations

All products, patients, evidence and outcomes are invented and display Simulation. Fixtures do not describe real Lasix safety or dosing. Acknowledgement does not mean dispensing. Controls use native labelled inputs, keyboard-accessible buttons and status/alert regions. Semantic theme tokens support brands/dark mode, wrapping controls accommodate mobile and RTL, and the demo clock runs only while mounted. Partial/outage results never become an all-clear badge. Unknown clinical coverage requires updated facts/evaluation; workflow-only PDMP/PA links can be refreshed independently.`,
      },
    },
  },
  argTypes: {
    initialScenario: {
      description:
        'Named deterministic synthetic scenario; the visible selector changes it during a session.',
    },
    initialVariant: {
      description:
        'Explicit scripted variant such as PDMP ambiguity, outage, or empty matched report.',
    },
    automaticClock: {
      description:
        'Progress scheduled fixture jobs while mounted; manual tests advance time explicitly.',
    },
  },
};
export default meta;
type Story = StoryObj<typeof FakeEhrStoryHost>;
export const Interactive: Story = { args: { initialScenario: 'lasix-draft' } };
export const LasixDraft: Story = { args: { initialScenario: 'lasix-draft' } };
export const CompleteDemo: Story = {
  args: { initialScenario: 'complete-demo' },
};
export const InteractionReview: Story = {
  args: { initialScenario: 'interaction-review' },
};
export const InteractionHistoryMissing: Story = {
  args: { initialScenario: 'interaction-history-missing' },
};
export const PregnancyPrecaution: Story = {
  args: { initialScenario: 'pregnancy-precaution' },
};
export const PregnancyUnknown: Story = {
  args: { initialScenario: 'pregnancy-unknown' },
};
export const DoseHigh: Story = { args: { initialScenario: 'dose-high' } };
export const DoseContextMissing: Story = {
  args: { initialScenario: 'dose-context-missing' },
};
export const DoseUnitConversion: Story = {
  args: { initialScenario: 'dose-unit-conversion' },
};
export const PdmpRequired: Story = {
  args: { initialScenario: 'pdmp-required' },
};
export const PdmpAmbiguousOrOutage: Story = {
  args: { initialScenario: 'pdmp-ambiguous-or-outage' },
};
export const CoveredVersusBenefit: Story = {
  args: { initialScenario: 'covered-versus-benefit' },
};
export const PaApproved: Story = { args: { initialScenario: 'pa-approved' } };
export const PaDeniedMoreInfo: Story = {
  args: { initialScenario: 'pa-denied-more-info' },
};
export const PaPendingSendAllowed: Story = {
  args: { initialScenario: 'pa-pending-send-allowed' },
};
export const ProviderUnavailable: Story = {
  args: { initialScenario: 'provider-unavailable' },
};
export const StaleEditAndConflict: Story = {
  args: { initialScenario: 'stale-edit-and-conflict' },
};
export const OverrideInvalidated: Story = {
  args: { initialScenario: 'override-invalidated' },
};
export const SigningDeclinedExpired: Story = {
  args: { initialScenario: 'signing-declined-expired' },
};
export const SendRejected: Story = {
  args: { initialScenario: 'send-rejected' },
};
export const SendResponseLost: Story = {
  args: { initialScenario: 'send-response-lost' },
};
export const SendUnknownReconciliation: Story = {
  args: { initialScenario: 'send-unknown-reconciliation' },
};
export const CancellationRejected: Story = {
  args: { initialScenario: 'cancellation-rejected' },
};
export const ResetReadonlyPermissions: Story = {
  args: { initialScenario: 'reset-readonly-permissions' },
};
