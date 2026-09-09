# @mieweb/ui Component Documentation Audit

> Read-only baseline audit of consumer-facing component documentation against
> [CONTRIBUTING.md](CONTRIBUTING.md) (_Component PR Rationale and Evidence_,
> _Reviewing Component Guidance_), [.github/copilot-instructions.md](.github/copilot-instructions.md),
> [agent/mieweb-ui.instructions.md](agent/mieweb-ui.instructions.md), and
> [lessons/component-policy.md](lessons/component-policy.md).
> Date: 2026-09-05. Branch: `harmonize-instructions`. No files were changed by the audit.

## Method

**Consumer documentation** = Storybook autodocs surface: `parameters.docs.description.component`,
story-level descriptions, `argTypes` descriptions, JSDoc on the exported component, and `*.mdx`
pages. `MAINTAINERS.md` / `README.md` next to code were read for context but **not** counted as
consumer documentation (CONTRIBUTING: "Consumers never need these").

**Rubric** — six dimensions scored 0–3 (0 missing · 1 vague/boilerplate/API-only · 2 useful but
incomplete · 3 concrete, accurate, sufficient to guide a decision):

| #   | Dimension     | Question                                                                                          |
| --- | ------------- | ------------------------------------------------------------------------------------------------- |
| P   | Purpose       | What user problem does it solve, and why does it belong in the library?                           |
| S   | Selection     | When should it be used, and when should it not?                                                   |
| A   | Alternatives  | Which components or compositions were considered, and what are the tradeoffs?                     |
| R   | Relationships | Are alternatives/companions/replacements linked _with explanation_, discoverable from both pages? |
| C   | Composition   | Is there a realistic example with neighbouring components, state ownership, constraints?          |
| L   | Limitations   | Are a11y, responsive, theme, i18n/RTL, dependency and behavioural limits explained?               |

Grades: **A** 16–18 (requires ≥2 in every dimension and no misleading guidance) · **B** 13–15 ·
**C** 9–12 · **D** 5–8 · **F** 0–4. Points were not awarded for headings or prose volume.

**Process.** Inventory built from `.storybook/main.ts` globs, `src/index.ts`, subpath entries and
`tsup.config.ts` (not `storybook-static`). Rubric calibrated by hand on ReadingProgressBar /
TableOfContents and Table / DataVis NITRO, then the remaining inventory was audited in eight
alphabetical batches. Two conflicting batch results were re-verified against source (Autocomplete;
TableOfContents ↔ SectionSpyNav reciprocity). All internal `?path=` links were enumerated and their
target titles checked.

---

## 1. Coverage summary

| Metric                                | Value                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Inventory source                      | `.storybook/main.ts` (`src/**/*.mdx`, `src/**/*.stories.*`), `src/index.ts`, `src/{datavis,esheet,ag-grid,kerebron,q}.ts`, `tsup.config.ts` |
| Component folders (`src/components/`) | 190                                                                                                                                         |
| Story files / MDX pages               | 197 / 4                                                                                                                                     |
| Graded entries                        | 186 (variants and structural subcomponents folded into their owning component)                                                              |
| Not graded — Storybook-only demos     | `Dashboard` (story-only folder; also contains `.bak`, `.backup`, `.broken` files), `Colors` (Foundations swatches)                          |
| Not graded — non-component MDX        | `src/Introduction.mdx`, `src/Branding.mdx`                                                                                                  |
| Public export with **no story**       | `RowActionToolbar` — [src/index.ts](src/index.ts#L151)                                                                                      |
| Storybook-only, not exported          | `YChart` — page does not say so ([YChart.stories.tsx](src/components/YChart/YChart.stories.tsx#L524-L527))                                  |
| Deprecated integration                | `AGGrid` (+ Enhanced story) — banner present on both stories                                                                                |
| Verified internal Storybook links     | 2 in the entire catalog (Table → DataVis NITRO; ConditionEditor → CodeLookup)                                                               |

**Blockers and limits.** Audit performed at source level, not against a rendered Storybook.
`HeyOzwell` `gotoStory()` dynamic links and ESheet submodule-built pages are marked _unverified_.
`Accordion` scored 8–11 across reviewers and is reported as 8 (D) pending re-check.

### Conflicts between governing documents

Reported, not resolved:

1. **Table policy strength differs three ways.** [agent/mieweb-ui.instructions.md](agent/mieweb-ui.instructions.md#L10-L14):
   `Table` only if the human _explicitly insists_. [CONTRIBUTING.md](CONTRIBUTING.md#L263-L268):
   NITRO "for new work". [Table.stories.tsx](src/components/Table/Table.stories.tsx#L39): "use
   `Table` … in lightweight situations". [lessons/component-policy.md](lessons/component-policy.md#L15)
   lists `Table` as an "Always Available" primitive with no caveat.
2. **Component anatomy differs.** [lessons/component-policy.md](lessons/component-policy.md#L118-L124)
   prescribes `MyWidget.scss` and no test/MAINTAINERS file; [CONTRIBUTING.md](CONTRIBUTING.md#L144-L152)
   prescribes Tailwind/CVA, a test and `MAINTAINERS.md`, no SCSS.
3. **PR requirements differ.** component-policy Tier 3 step 6 asks for "purpose, screenshot,
   Storybook link"; CONTRIBUTING's _Component PR Rationale and Evidence_ requires alternatives,
   relationships, boundaries, RTL/i18n evidence, etc. CONTRIBUTING itself states "Agent rules and
   component policy must agree" ([CONTRIBUTING.md](CONTRIBUTING.md#L36-L38)).
4. **Stale counts and entries.** Agent rules and policy say "126+ components" (190 folders exist);
   the agent category table omits the Healthcare and Product/Provider families. CONTRIBUTING's
   layout and exports sections omit the `@mieweb/ui/kerebron` and `@mieweb/ui/q` entries present in
   [package.json](package.json#L164-L182) and [tsup.config.ts](tsup.config.ts#L9-L10). CONTRIBUTING's
   MAINTAINERS table lists 6 modules; 8 exist (`CustomizableDashboard`, `SuperChat` missing).

---

## 2. Grade table

Scores are `P S A R C L`. Evidence points at `description.component` or records its absence.

### Calibration set

| Component                                                                              | P S A R C L | Total | Grade | Evidence                                                                                                                                       |
| -------------------------------------------------------------------------------------- | ----------- | ----- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [ReadingProgressBar](src/components/ReadingProgressBar/ReadingProgressBar.stories.tsx) | 2 1 0 0 2 1 | 6     | D     | [stories:12-14](src/components/ReadingProgressBar/ReadingProgressBar.stories.tsx#L12-L14); no link to Progress/TOC/SectionSpyNav               |
| [TableOfContents](src/components/TableOfContents/TableOfContents.stories.tsx)          | 1 0 0 0 2 1 | 4     | F     | no `description.component` ([stories:9-24](src/components/TableOfContents/TableOfContents.stories.tsx#L9-L24)); a11y claims only in demo prose |
| [Table](src/components/Table/Table.stories.tsx)                                        | 2 2 2 2 2 1 | 11    | C     | [stories:39](src/components/Table/Table.stories.tsx#L39) one-way verified link to NITRO                                                        |
| [DataVis NITRO (Grid)](src/components/DataVisNITRO/DataVisNITRO.stories.tsx)           | 2 1 0 0 2 1 | 7     | D     | [stories:63-66](src/components/DataVisNITRO/DataVisNITRO.stories.tsx#L63-L66) describes the wrapper only                                       |

### A (16–18)

| Component          | P S A R C L | Total | Evidence                                                |
| ------------------ | ----------- | ----- | ------------------------------------------------------- |
| SuperChat overview | 3 3 2 3 3 2 | 16    | [SuperChat.mdx](src/components/SuperChat/SuperChat.mdx) |

### B (13–15)

| Component                                                                     | P S A R C L | Total | Evidence                                                                                                                                                                    |
| ----------------------------------------------------------------------------- | ----------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CodeLookup](src/components/CodeLookup/CodeLookup.stories.tsx)                | 3 3 2 2 3 2 | 15    | [stories:18-43](src/components/CodeLookup/CodeLookup.stories.tsx#L18-L43)                                                                                                   |
| [Autocomplete](src/components/Autocomplete/Autocomplete.stories.tsx)          | 3 3 2 1 3 2 | 14    | [stories:53-110](src/components/Autocomplete/Autocomplete.stories.tsx#L53-L110); names no sibling pickers                                                                   |
| [MedicationList](src/components/MedicationList/MedicationList.stories.tsx)    | 3 3 3 2 2 1 | 14    | [stories:14-29](src/components/MedicationList/MedicationList.stories.tsx#L14-L29) layer table                                                                               |
| [OrderEditor](src/components/OrderEditor/OrderEditor.stories.tsx)             | 3 2 2 2 3 1 | 13    | [stories:6](src/components/OrderEditor/OrderEditor.stories.tsx#L6) + [JSDoc](src/components/OrderEditor/OrderEditor.tsx#L1-L33); MedicationEditor/CodeLookup named in prose |
| [CollabStatus](src/components/CollabStatus/CollabStatus.stories.tsx)          | 3 3 1 1 3 2 | 13    | [stories:8-49](src/components/CollabStatus/CollabStatus.stories.tsx#L8-L49); no ConnectionStatus link                                                                       |
| [ConditionEditor](src/components/ConditionEditor/ConditionEditor.stories.tsx) | 3 3 1 2 3 1 | 13    | [stories:16-42](src/components/ConditionEditor/ConditionEditor.stories.tsx#L16-L42); verified link to CodeLookup                                                            |
| [SectionSpyNav](src/components/SectionSpyNav/SectionSpyNav.stories.tsx)       | 3 2 2 2 2 2 | 13    | [stories:9-18](src/components/SectionSpyNav/SectionSpyNav.stories.tsx#L9-L18); TOC does **not** reciprocate                                                                 |

### C (9–12)

| Component                                                                                                | Total | Note                                                                                                               |
| -------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| [HeyOzwell overview (mdx)](src/components/AI/HeyOzwell/HeyOzwell.mdx)                                    | 12    | purpose + quick start; deps (Whisper/ONNX models) not listed for consumers                                         |
| [AudioRecorder](src/components/AudioRecorder/AudioRecorder.stories.tsx)                                  | 12    | features, install, example; no RecordButton link                                                                   |
| [DocumentScanner](src/components/DocumentScanner/DocumentScanner.stories.tsx)                            | 12    | strong usage example; camera/file-size limits absent                                                               |
| [RichEditor](src/components/RichEditor/RichEditor.stories.tsx)                                           | 12    | strong JSDoc, no `description.component`; no RichTextEditor link; peers only in [src/kerebron.ts](src/kerebron.ts) |
| [AIChat](src/components/AI/AIChat.stories.tsx)                                                           | 11    | anatomy + Messaging reuse; SuperChat/OzwellChat distinction absent                                                 |
| [AllergyList](src/components/AllergyList/AllergyList.stories.tsx)                                        | 11    | tri-state guidance; NKA pattern not generalised                                                                    |
| [ButtonGroup](src/components/ButtonGroup/ButtonGroup.stories.tsx)                                        | 11    | excellent JSDoc; Button does not link back                                                                         |
| [GlossaryTooltip](src/components/GlossaryTooltip/GlossaryTooltip.stories.tsx)                            | 11    | "sibling of SourceTip" one-way                                                                                     |
| [MediaEditor](src/components/MediaEditor/MediaEditor.stories.tsx)                                        | 11    | MediaPlayer relationship stated, not compared                                                                      |
| [PresentingProblems](src/components/PresentingProblems/PresentingProblems.stories.tsx)                   | 11    | encounter-scope semantics clear; ProblemList link one-way                                                          |
| [Table](src/components/Table/Table.stories.tsx)                                                          | 11    | see calibration                                                                                                    |
| [CustomizableDashboard](src/components/CustomizableDashboard/CustomizableDashboard.stories.tsx)          | 10    | "pair with DashboardWidget" one-way; ReportDashboard absent                                                        |
| [HealthSurveillance](src/components/HealthSurveillance/HealthSurveillance.stories.tsx)                   | 10    | no "when not"                                                                                                      |
| [ProblemList](src/components/ProblemList/ProblemList.stories.tsx)                                        | 10    | model well explained; L=0                                                                                          |
| [RichTextEditor](src/components/RichTextEditor/RichTextEditor.stories.tsx)                               | 10    | no RichEditor/Markdown link                                                                                        |
| [SourceTip](src/components/SourceTip/SourceTip.stories.tsx)                                              | 10    | R corrected to 0 — does not mention GlossaryTooltip                                                                |
| [VisuallyHidden](src/components/VisuallyHidden/VisuallyHidden.stories.tsx)                               | 10    | strong a11y use cases                                                                                              |
| [ClampedText](src/components/ClampedText/ClampedText.stories.tsx)                                        | 9     | no Text link                                                                                                       |
| [DataVisNitroGraph](src/components/DataVisNITRO/DataVisNitroGraph.stories.tsx)                           | 9     | peer deps/subpath not stated; Sparkline not linked                                                                 |
| [ErrorPage](src/components/ErrorPage/ErrorPage.stories.tsx)                                              | 9     | no Alert/LoadingPage comparison                                                                                    |
| [FreshnessBadge](src/components/FreshnessBadge/FreshnessBadge.stories.tsx)                               | 9     | no Badge/CountBadge comparison                                                                                     |
| [HandsFreeChat](src/components/AI/HeyOzwell/HandsFreeChat.stories.tsx)                                   | 9     | parent/sibling relationships unstated                                                                              |
| [HeyOzwell demo](src/components/AI/HeyOzwell/HeyOzwell.stories.tsx)                                      | 9     | limitations sparse                                                                                                 |
| [KeyboardShortcutsOverlay](src/components/KeyboardShortcutsOverlay/KeyboardShortcutsOverlay.stories.tsx) | 9     | CommandPalette not mentioned                                                                                       |
| [MediaPlayer](src/components/MediaPlayer/MediaPlayer.stories.tsx)                                        | 9     | AudioPlayer not compared                                                                                           |

### D (5–8)

| Total | Components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8     | [Accordion](src/components/Accordion/Accordion.stories.tsx)\* · [CopyButton](src/components/CopyButton/CopyButton.stories.tsx) · [Modal](src/components/Modal/Modal.stories.tsx) · [RowActionToolbar](src/components/RowActionToolbar/RowActionToolbar.tsx) (JSDoc only, no story)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 7     | [AlertDialog](src/components/AlertDialog/AlertDialog.stories.tsx) · [AIMessage](src/components/AI/AIMessage.stories.tsx) · [DataVis NITRO](src/components/DataVisNITRO/DataVisNITRO.stories.tsx) · [ESheet Builder](src/components/ESheet/EsheetBuilder.stories.tsx) · [FilterSummaryBar](src/components/FilterSummaryBar/FilterSummaryBar.stories.tsx) · [Label](src/components/Label/Label.stories.tsx) · [Markdown](src/components/Markdown/MarkdownRenderer.stories.tsx) · [ServicePicker](src/components/ServicePicker/ServicePicker.stories.tsx) · [Sparkline](src/components/Sparkline/Sparkline.stories.tsx) · [SuperChat panel](src/components/SuperChat/SuperChat.stories.tsx) · [SuperChatConversations](src/components/SuperChat/SuperChatConversations.stories.tsx)                                                                                                                                                                                                                                                      |
| 6     | [ReadingProgressBar](src/components/ReadingProgressBar/ReadingProgressBar.stories.tsx) · [AGGrid](src/components/AGGrid/AGGrid.stories.tsx) · [AIChat (Voice)](src/components/AI/AIChatVoice.stories.tsx) · [Q](src/components/Q/Q.stories.tsx) · [SuperChatInbox](src/components/SuperChat/SuperChatInbox.stories.tsx) · [Text](src/components/Text/Text.stories.tsx) · [ThemeProvider](src/components/ThemeProvider/ThemeProvider.stories.tsx) · [Timeline](src/components/Timeline/Timeline.stories.tsx) · [Tooltip](src/components/Tooltip/Tooltip.stories.tsx) · [TranscriptView](src/components/TranscriptView/TranscriptView.stories.tsx) · [VisitScribe](src/components/AI/HeyOzwell/VisitScribe.stories.tsx) · [WakeWord](src/components/AI/HeyOzwell/WakeWord/WakeWord.stories.tsx)                                                                                                                                                                                                                                         |
| 5     | [AddressForm](src/components/Address/AddressForm.stories.tsx) · [AudioPlayer](src/components/AudioPlayer/AudioPlayer.stories.tsx) · [BusinessHoursEditor](src/components/BusinessHoursEditor/BusinessHoursEditor.stories.tsx) · [Collapsible](src/components/Collapsible/Collapsible.stories.tsx) · [DropzoneOverlay](src/components/DropzoneOverlay/DropzoneOverlay.stories.tsx) · [Icons](src/components/Icons/Icons.stories.tsx) · [OrderList](src/components/OrderList/OrderList.stories.tsx) · [OzwellChat](src/components/AI/OzwellChat.stories.tsx) · [PatientHeader](src/components/PatientHeader/PatientHeader.stories.tsx) · [PermissionsEditor](src/components/PermissionsEditor/PermissionsEditor.stories.tsx) · [PhoneInputGroup](src/components/PhoneInput/PhoneInputGroup.stories.tsx) · [ResultsEntryForm](src/components/ResultsEntryForm/ResultsEntryForm.stories.tsx) · [StepIndicator](src/components/StepIndicator/StepIndicator.stories.tsx) · [VoiceSetup](src/components/AI/HeyOzwell/VoiceSetup.stories.tsx) |

\* reviewer variance 8–11; re-check.

### F (0–4) — ~110 entries

Nearly all lack `description.component`. Number after each name is the total score.

**Core primitives**

[Button](src/components/Button/Button.stories.tsx) 4 · [Input](src/components/Input/Input.stories.tsx) 2 ·
[Select](src/components/Select/Select.stories.tsx) 4 · [Checkbox](src/components/Checkbox/Checkbox.stories.tsx) 3 ·
[Radio](src/components/Radio/Radio.stories.tsx) 2 · [Switch](src/components/Switch/Switch.stories.tsx) 3 ·
[Toggle](src/components/Toggle/Toggle.stories.tsx) 3 · [Textarea](src/components/Textarea/Textarea.stories.tsx) 3 ·
[Dropdown](src/components/Dropdown/Dropdown.stories.tsx) 4 · [Card](src/components/Card/Card.stories.tsx) 2 ·
[Badge](src/components/Badge/Badge.stories.tsx) 2 · [Avatar](src/components/Avatar/Avatar.stories.tsx) 2 ·
[Alert](src/components/Alert/Alert.stories.tsx) 2 · [Toast](src/components/Toast/Toast.stories.tsx) 3 ·
[Spinner](src/components/Spinner/Spinner.stories.tsx) 3 · [Skeleton](src/components/Skeleton/Skeleton.stories.tsx) 3 ·
[Progress](src/components/Progress/Progress.stories.tsx) 4 · [Tabs](src/components/Tabs/Tabs.stories.tsx) 4 ·
[Breadcrumb](src/components/Breadcrumb/Breadcrumb.stories.tsx) 2 · [Pagination](src/components/Pagination/Pagination.stories.tsx) 4 ·
[Sheet](src/components/Sheet/Sheet.stories.tsx) 2 · [Sidebar](src/components/Sidebar/Sidebar.stories.tsx) 1 ·
[AppHeader](src/components/AppHeader/AppHeader.stories.tsx) 1 · [PageHeader](src/components/PageHeader/PageHeader.stories.tsx) 4 ·
[SiteHeader](src/components/SiteHeader/SiteHeader.stories.tsx) 2 · [SiteFooter](src/components/SiteFooter/SiteFooter.stories.tsx) 2 ·
[DateInput](src/components/DateInput/DateInput.stories.tsx) 4 · [DateRangePicker](src/components/DateRangePicker/DateRangePicker.stories.tsx) 4 ·
[FloatingWindow](src/components/FloatingWindow/FloatingWindow.stories.tsx) 3 · [DockablePanel](src/components/DockablePanel/DockablePanel.stories.tsx) 4 ·
[LoadingPage](src/components/LoadingPage/LoadingPage.stories.tsx) 2 · [CommandPalette](src/components/CommandPalette/CommandPalette.stories.tsx) 2 ·
[ScrollArea](src/components/ScrollArea/ScrollArea.stories.tsx) 2 · [Separator](src/components/Separator/Separator.stories.tsx) 1 ·
[Slider](src/components/Slider/Slider.stories.tsx) 3 · [TableOfContents](src/components/TableOfContents/TableOfContents.stories.tsx) 4 ·
[WebsiteInput](src/components/WebsiteInput/WebsiteInput.stories.tsx) 3 · [PhoneInput](src/components/PhoneInput/PhoneInput.stories.tsx) 2 ·
[LanguageSelector](src/components/LanguageSelector/LanguageSelector.stories.tsx) 3 · [CookieConsent](src/components/CookieConsent/CookieConsent.stories.tsx) 2 ·
[ConnectionStatus](src/components/ConnectionStatus/ConnectionStatus.stories.tsx) 2 · [CountBadge](src/components/CountBadge/CountBadge.stories.tsx) 3 ·
[ServiceBadge](src/components/ServiceBadge/ServiceBadge.stories.tsx) 2 · [StripeBadge](src/components/StripeBadge/StripeBadge.stories.tsx) 3 ·
[Address](src/components/Address/Address.stories.tsx) 1 · [BusinessHours](src/components/BusinessHours/BusinessHours.stories.tsx) 1 ·
[AdditionalFields](src/components/AdditionalFields/AdditionalFields.stories.tsx) 4 · [QuickAction](src/components/QuickAction/QuickAction.stories.tsx) 2 ·
[QuickLinksCard](src/components/QuickLinksCard/QuickLinksCard.stories.tsx) 2 · [DashboardWidget](src/components/DashboardWidget/DashboardWidget.stories.tsx) 4 ·
[CSVColumnMapper](src/components/CSVColumnMapper/CSVColumnMapper.stories.tsx) 2 · [FileManager](src/components/FileManager/FileManager.stories.tsx) 3 ·
[RecordButton](src/components/RecordButton/RecordButton.stories.tsx) 4 · [PillSelect](src/components/PillSelect/PillSelect.stories.tsx) 4 ·
[ProductVersion](src/components/ProductVersion/ProductVersion.stories.tsx) 4 · [SchedulePicker](src/components/SchedulePicker/SchedulePicker.stories.tsx) 2 ·
[ScheduleCalendar](src/components/ScheduleCalendar/ScheduleCalendar.stories.tsx) 1 · [NotificationCenter](src/components/NotificationCenter/NotificationCenter.stories.tsx) 3 ·
[OnboardingWizard](src/components/OnboardingWizard/OnboardingWizard.stories.tsx) 2 · [KeyboardShortcutsOverlay](src/components/KeyboardShortcutsOverlay/KeyboardShortcutsOverlay.stories.tsx) — see C.

**AI / chat leaf pages**

[ComposerModelSelector](src/components/AI/ComposerModelSelector.stories.tsx) 0 · [Reconciliation](src/components/AI/Reconciliation.stories.tsx) 1 ·
[MCPToolCall](src/components/AI/MCPToolCall.stories.tsx) 4 · [VoiceManager](src/components/AI/HeyOzwell/VoiceManager.stories.tsx) 4 ·
[SpeakerVerify](src/components/AI/HeyOzwell/SpeakerVerify/SpeakerVerify.stories.tsx) 3 · [Messaging module](src/components/Messaging/Messaging.stories.tsx) 3 ·
[ESheet Renderer](src/components/ESheet/EsheetRenderer.stories.tsx) 4.

**Healthcare**

[Assessment](src/components/Assessment/Assessment.stories.tsx) 4 · [CaseManagementHeader](src/components/CaseManagementHeader/CaseManagementHeader.stories.tsx) 3 ·
[WebChartReportViewer](src/components/WebChartReportViewer/WebChartReportViewer.stories.tsx) 4.

**Product / app-workflow (BlueHive-style screens)**

- Orders: [OrderCard](src/components/OrderCard/OrderCard.stories.tsx) 2 · [OrderConfirmationWizard](src/components/OrderConfirmationWizard/OrderConfirmationWizard.stories.tsx) 3 · [OrderLookupForm](src/components/OrderLookupForm/OrderLookupForm.stories.tsx) 2 · [OrderSidebar](src/components/OrderSidebar/OrderSidebar.stories.tsx) 2
- Employers / employees: [EmployerContactCard](src/components/EmployerContactCard/EmployerContactCard.stories.tsx) 3 · [EmployerList](src/components/EmployerList/EmployerList.stories.tsx) 3 · [EmployerPricingCard](src/components/EmployerPricingCard/EmployerPricingCard.stories.tsx) 3 · [EmployerServiceModal](src/components/EmployerServiceModal/EmployerServiceModal.stories.tsx) 3 · [EmployerView](src/components/EmployerView/EmployerView.stories.tsx) 3 · [EmployeeForm](src/components/EmployeeForm/EmployeeForm.stories.tsx) 3 · [EmployeeProfile](src/components/EmployeeProfile/EmployeeProfile.stories.tsx) 3
- Billing: [InvoiceList](src/components/InvoiceList/InvoiceList.stories.tsx) 4 · [InvoiceView](src/components/InvoiceView/InvoiceView.stories.tsx) 2 · [InvoicePaymentPage](src/components/InvoicePaymentPage/InvoicePaymentPage.stories.tsx) 2 · [PaymentMethod](src/components/PaymentMethod/PaymentMethod.stories.tsx) 4 · [PaymentHistoryTable](src/components/PaymentHistoryTable/PaymentHistoryTable.stories.tsx) 2 · [PendingClaimsTable](src/components/PendingClaimsTable/PendingClaimsTable.stories.tsx) 2 · [CreateInvoiceModal](src/components/CreateInvoiceModal/CreateInvoiceModal.stories.tsx) 3
- Providers: [ProviderCard](src/components/ProviderCard/ProviderCard.stories.tsx) 2 · [ProviderDetailHeader](src/components/ProviderDetailHeader/ProviderDetailHeader.stories.tsx) 2 · [ProviderOverview](src/components/ProviderOverview/ProviderOverview.stories.tsx) 2 · [ProviderSearchBar](src/components/ProviderSearchBar/ProviderSearchBar.stories.tsx) 3 · [ProviderSearchFilters](src/components/ProviderSearchFilters/ProviderSearchFilters.stories.tsx) 3 · [ProviderSelector](src/components/ProviderSelector/ProviderSelector.stories.tsx) 3 · [ProviderSettings](src/components/ProviderSettings/ProviderSettings.stories.tsx) 2 · [ProviderUsersTable](src/components/ProviderUsersTable/ProviderUsersTable.stories.tsx) 2 · [ClaimProviderForm](src/components/ClaimProviderForm/ClaimProviderForm.stories.tsx) 2
- Services: [ServiceAccordion](src/components/ServiceAccordion/ServiceAccordion.stories.tsx) 2 · [ServiceCard](src/components/ServiceCard/ServiceCard.stories.tsx) 3 · [ServiceGrid](src/components/ServiceGrid/ServiceGrid.stories.tsx) 2 · [ServiceGeneralSettings](src/components/ServiceGeneralSettings/ServiceGeneralSettings.stories.tsx) 1 · [ServicePricingManager](src/components/ServicePricingManager/ServicePricingManager.stories.tsx) 1 · [ServiceShippingSettings](src/components/ServiceShippingSettings/ServiceShippingSettings.stories.tsx) 1 · [SetupServiceModal](src/components/SetupServiceModal/SetupServiceModal.stories.tsx) 1 · [RecurringServiceCard](src/components/RecurringServiceCard/RecurringServiceCard.stories.tsx) 1
- Users / auth / integrations: [AuthDialog](src/components/AuthDialog/AuthDialog.stories.tsx) 0 · [BookingDialog](src/components/BookingDialog/BookingDialog.stories.tsx) 0 · [HRISProviderSelector](src/components/HRISProviderSelector/HRISProviderSelector.stories.tsx) 0 · [CheckrIntegration](src/components/CheckrIntegration/CheckrIntegration.stories.tsx) 2 · [SSOConfigForm](src/components/SSOConfigForm/SSOConfigForm.stories.tsx) 2 · [InviteUserModal](src/components/InviteUserModal/InviteUserModal.stories.tsx) 3 · [EditUserRoleModal](src/components/EditUserRoleModal/EditUserRoleModal.stories.tsx) 3 · [AddContactModal](src/components/AddContactModal/AddContactModal.stories.tsx) 2 · [CreateReferralModal](src/components/CreateReferralModal/CreateReferralModal.stories.tsx) 2 · [RejectionModal](src/components/RejectionModal/RejectionModal.stories.tsx) 1
- Other: [InventoryManager](src/components/InventoryManager/InventoryManager.stories.tsx) 3 · [ReportDashboard](src/components/ReportDashboard/ReportDashboard.stories.tsx) 1 · [HelpSupportPanel](src/components/HelpSupportPanel/HelpSupportPanel.stories.tsx) 3 · [CountryDropdown](src/components/CountryDropdown/CountryDropdown.stories.tsx) 2 · [CountryCodeDropdown](src/components/CountryCodeDropdown/CountryCodeDropdown.stories.tsx) 2

**Distribution:** A 1 · B 7 · C 25 · D 43 · F ≈110. Median ≈ 3 / 18.

---

## 3. Highest-priority findings

1. **The mandated default grid has the weakest selection guidance of the trio.**
   [DataVisNITRO.stories.tsx:63-66](src/components/DataVisNITRO/DataVisNITRO.stories.tsx#L63-L66)
   only says it wraps `@mieweb/datavis`. It never states it is the default for all tables, never
   links to `Table` or `AGGrid`, never names the peers (`@mieweb/datavis`, `datavis-ace`) or the
   `@mieweb/ui/datavis` subpath, and the material a11y limitation is only a code comment
   ([stories:54-59](src/components/DataVisNITRO/DataVisNITRO.stories.tsx#L54-L59),
   `a11y: { disable: true }`). _Effect:_ a developer on the NITRO page cannot tell why it is
   preferred or what it costs. _Correction:_ add purpose/selection paragraph, reciprocal link to
   Table, install block, and an explicit accessibility limitation.
2. **Table page contradicts its own guidance.** [Table.stories.tsx:39](src/components/Table/Table.stories.tsx#L39)
   says use `Table` only when lightweight, then the Playground
   ([stories:585-604](src/components/Table/Table.stories.tsx#L585-L604)) hand-rolls sorting,
   filtering, pinned columns and column menus — what agent Rule 1 forbids. _Correction:_ label the
   Playground as the point at which to reach for NITRO, or remove grid features from the example.
3. **Three raw tables ship with no rationale against policy.** `PaymentHistoryTable`,
   `PendingClaimsTable`, `ProviderUsersTable` have no description and never say why they exist
   instead of `DataVisNitroGrid` / `Table`. _Correction:_ one-paragraph "why not NITRO" or a note
   that they are domain compositions on `Table`.
4. **Agent Rule 2 (ButtonGroup for 2+ buttons) is invisible on the Button page.**
   [Button.stories.tsx](src/components/Button/Button.stories.tsx) has no description;
   [ButtonGroup.tsx:25-43](src/components/ButtonGroup/ButtonGroup.tsx#L25-L43) has the rule, no
   link from Button. _Correction:_ add the rule + link to Button's `description.component`.
5. **RichEditor vs RichTextEditor — most confusable pair, zero cross-reference.** Neither story has
   a description; neither names the other. Kerebron peers, `kerebron.css` and the `/kerebron-wasm`
   asset requirement live only in [src/kerebron.ts](src/kerebron.ts) JSDoc and README.
   _Correction:_ both pages state entry point, format and peers, with reciprocal links; also link
   `Markdown` (render) and `Textarea`.
6. **Deprecation notice has no navigable replacement link.**
   [DeprecationBanner.tsx:8-9](src/components/AGGrid/DeprecationBanner.tsx#L8-L9) names DataVis
   NITRO and the subpath but no `?path=` link; NITRO page never says it replaces AGGrid.
   _Correction:_ link both ways; add a short migration pointer.
7. **YChart page misleads by omission.** [YChart.stories.tsx:524-527](src/components/YChart/YChart.stories.tsx#L524-L527)
   reads like a normal component; only [MAINTAINERS.md](src/components/YChart/MAINTAINERS.md) says
   it is not exported. _Correction:_ first line: "Storybook showcase only — not exported from
   `@mieweb/ui`."
8. **RowActionToolbar is a public export with no documentation page.** _Correction:_ add a story or
   remove it from the barrel.
9. **Selection guidance hidden in provider notes.** MedicationList's "start with
   `MedicationReconciliation`" lives in its README (story layer table partly mitigates); CodeLookup,
   SuperChat and RichEditor also lean on READMEs. If consumers never need those files, the guidance
   must move into stories.
10. **Toast a11y claim in agent rules is undocumented on the page.** Rule 8 says Toast "announces via
    aria-live for free"; implementation has `role="alert"` / `aria-live="polite"`
    ([Toast.tsx:148](src/components/Toast/Toast.tsx#L148), [Toast.tsx:238](src/components/Toast/Toast.tsx#L238))
    but the story has no description. Documentation gap, not a defect.

---

## 4. Relationship gaps

Only two verified Storybook-internal links exist in the catalog. Every other relationship is
prose-only and one-way. Families where a developer must choose and no page helps:

| Family         | Pages                                                                                                | Why it matters                                      | Current state                                    |
| -------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| Grids          | Table / DataVisNITRO / AGGrid / Pagination                                                           | Library's #1 policy                                 | Table → NITRO only                               |
| Feedback       | Alert / AlertDialog / Toast / NotificationCenter                                                     | Agent Rule 8                                        | none                                             |
| Loading        | Spinner / Skeleton / LoadingPage / Progress / CircularProgress                                       | Agent Rule 8                                        | none; CircularProgress undocumented              |
| Overlays       | Modal / AlertDialog / Sheet / FloatingWindow / DockablePanel / Sidebar                               | Focus-trap and layering choices                     | AlertDialog JSDoc mentions Modal only            |
| Boolean inputs | Checkbox / Switch / Toggle / Radio / PillSelect                                                      | Form semantics vs toolbar state                     | none                                             |
| Pickers        | Select / Dropdown / Autocomplete / CommandPalette / CodeLookup / ProviderSelector                    | Menu-vs-value confusion                             | Autocomplete describes wiring, names no siblings |
| Dates          | DateInput / DateRangePicker / SchedulePicker / ScheduleCalendar / BusinessHours(Editor)              | Agent Rule 11                                       | none                                             |
| Headers        | AppHeader / SiteHeader / PageHeader / PatientHeader / CaseManagementHeader / ProviderDetailHeader    | Layout skeleton choice                              | none                                             |
| Badges         | Badge / CountBadge / ServiceBadge / FreshnessBadge / StripeBadge                                     | Similar look, different intent                      | none                                             |
| In-page nav    | TableOfContents / SectionSpyNav / ReadingProgressBar                                                 | CONTRIBUTING's own complementary-components example | SectionSpyNav → TOC one-way; TOC and RPB silent  |
| Tips           | Tooltip / GlossaryTooltip / SourceTip                                                                | Interaction grammar differs (hover vs pin)          | GlossaryTooltip → SourceTip one-way              |
| Editors        | RichEditor / RichTextEditor / Markdown / Textarea                                                    | Different entry points and peers                    | none                                             |
| Media          | AudioPlayer / MediaPlayer / MediaEditor / TranscriptView / AudioRecorder / RecordButton              | RecordButton wraps AudioRecorder                    | none                                             |
| Chat           | AIChat / OzwellChat / SuperChat / Messaging / HeyOzwell                                              | Three chat surfaces                                 | only SuperChat.mdx maps them                     |
| Dashboards     | Card / DashboardWidget / QuickLinksCard / CustomizableDashboard / ReportDashboard / Dashboard (demo) | Widget vs container                                 | CustomizableDashboard → DashboardWidget one-way  |
| File intake    | DropzoneOverlay / FileManager / DocumentScanner                                                      | Same user task                                      | none                                             |
| Clinical lists | ProblemList / PresentingProblems / ConditionEditor / MedicationList / AllergyList                    | Encounter vs chart scope                            | Problem/Presenting prose one-way                 |

---

## 5. Strong examples worth using as templates

- [SuperChat.mdx](src/components/SuperChat/SuperChat.mdx) — vocabulary, related-surfaces table,
  three quick-start compositions, sanitization contract, plugin deps. The only A.
- [MedicationList.stories.tsx:14-29](src/components/MedicationList/MedicationList.stories.tsx#L14-L29)
  — "Which layer do I use?" table. Best _Selection_ pattern.
- [Autocomplete.stories.tsx:53-110](src/components/Autocomplete/Autocomplete.stories.tsx#L53-L110)
  — data-agnostic contract, two wiring patterns, real-API recipe. Best _Composition_ pattern.
- [CodeLookup.stories.tsx:18-43](src/components/CodeLookup/CodeLookup.stories.tsx#L18-L43) —
  offline/worker/OPFS limitations stated plainly. Best _Limitations_ pattern.
- [Table.stories.tsx:39](src/components/Table/Table.stories.tsx#L39) — one-line "prefer X; use this
  only when…" with a verified link. Minimal viable _Selection + Relationship_ for primitives.
- [ButtonGroup.tsx:25-43](src/components/ButtonGroup/ButtonGroup.tsx#L25-L43) — behaviour-driven
  rationale.
- [SectionSpyNav.stories.tsx:9-18](src/components/SectionSpyNav/SectionSpyNav.stories.tsx#L9-L18) /
  [GlossaryTooltip.stories.tsx:10-21](src/components/GlossaryTooltip/GlossaryTooltip.stories.tsx#L10-L21)
  — concise "complement to…" / "sibling of…" phrasing; needs the reciprocal side.

---

---

## 6. Next steps

The catalog-size assessment and the phased plan to bring every family to an A live in
[revamp-doc-plan.md](revamp-doc-plan.md). Re-audits after each phase update the grade table above.
