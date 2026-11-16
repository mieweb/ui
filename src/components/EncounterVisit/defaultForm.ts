import type { FormDefinition } from '@esheet/core';

/**
 * The default anonymous encounter template as a frozen native eSheet form —
 * the hand-maintained single source of truth going forward (mieweb/ui#772).
 * defaultForm.test.ts proves it equivalent to converting the legacy
 * DEFAULT_ENCOUNTER_VISIT_DEFINITION, so edit this literal directly.
 *
 * Encounter fieldTypes (encounterNarrative, encounterVitals, ...) extend the
 * stock eSheet union, hence the widening cast — matching legacy.ts.
 */
export const DEFAULT_ENCOUNTER_FORM: FormDefinition = {
  id: 'anonymous-encounter',
  title: 'Encounter visit',
  pages: [
    {
      id: 'anonymous-encounter:visit',
      title: 'Encounter visit',
      fields: [
        {
          id: 'encounter:hpi:section',
          fieldType: 'section',
          title: 'History of present illness',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'narrative',
          },
          fields: [
            {
              id: 'encounter:hpi:narrative',
              fieldType: 'encounterNarrative',
              question: 'History of present illness',
              width: 'full',
              _sourceData: {
                encounterHideLabel: true,
                encounterFindings: [
                  {
                    id: 'no-fever',
                    label: 'No fever',
                    text: 'Denies fever.',
                  },
                  {
                    id: 'no-trauma',
                    label: 'No trauma',
                    text: 'Denies recent trauma.',
                  },
                  {
                    id: 'no-radiation',
                    label: 'No radiation',
                    text: 'Pain does not radiate.',
                  },
                ],
              },
            },
          ],
        },
        {
          id: 'encounter:history:section',
          fieldType: 'section',
          title: 'Patient history',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'observations',
          },
          fields: [
            {
              id: 'encounter:history:narrative',
              fieldType: 'encounterNarrative',
              question: 'Patient history narrative',
              width: 'full',
              _sourceData: {
                encounterHideLabel: true,
                encounterFindings: [
                  {
                    id: 'patient-source',
                    label: 'Patient provided history',
                    text: 'History provided by the patient.',
                  },
                  {
                    id: 'records-reviewed',
                    label: 'Records reviewed',
                    text: 'History supplemented by available records.',
                  },
                ],
              },
            },
            {
              id: 'encounter:history:observation:medical',
              question: 'Medical history',
              width: 'full',
              _sourceData: {
                id: 'medical',
                label: 'Medical history',
                findings: [
                  {
                    id: 'reviewed',
                    label: 'History reviewed',
                    text: 'Medical history reviewed.',
                  },
                  {
                    id: 'no-additional-history',
                    label: 'No additional history',
                    text: 'No additional medical history reported.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'reviewed',
                    label: 'History reviewed',
                    text: 'Medical history reviewed.',
                  },
                  {
                    id: 'no-additional-history',
                    label: 'No additional history',
                    text: 'No additional medical history reported.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:history:observation:surgical',
              question: 'Surgical history',
              width: 'full',
              _sourceData: {
                id: 'surgical',
                label: 'Surgical history',
                findings: [
                  {
                    id: 'no-surgeries',
                    label: 'No prior surgery',
                    text: 'No previous surgery reported.',
                  },
                  {
                    id: 'reviewed',
                    label: 'History reviewed',
                    text: 'Surgical history reviewed.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'no-surgeries',
                    label: 'No prior surgery',
                    text: 'No previous surgery reported.',
                  },
                  {
                    id: 'reviewed',
                    label: 'History reviewed',
                    text: 'Surgical history reviewed.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:history:observation:family',
              question: 'Family history',
              width: 'full',
              _sourceData: {
                id: 'family',
                label: 'Family history',
                findings: [
                  {
                    id: 'unknown',
                    label: 'History unknown',
                    text: 'Family history unknown.',
                  },
                  {
                    id: 'noncontributory',
                    label: 'No pertinent history',
                    text: 'No pertinent family history reported.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'unknown',
                    label: 'History unknown',
                    text: 'Family history unknown.',
                  },
                  {
                    id: 'noncontributory',
                    label: 'No pertinent history',
                    text: 'No pertinent family history reported.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:history:observation:social',
              question: 'Social history',
              width: 'full',
              _sourceData: {
                id: 'social',
                label: 'Social history',
                findings: [
                  {
                    id: 'never-smoked',
                    label: 'Never smoked',
                    text: 'Never smoked.',
                  },
                  {
                    id: 'no-alcohol',
                    label: 'No alcohol use',
                    text: 'Denies alcohol use.',
                  },
                  {
                    id: 'no-recreational-drugs',
                    label: 'No recreational drug use',
                    text: 'Denies recreational drug use.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'never-smoked',
                    label: 'Never smoked',
                    text: 'Never smoked.',
                  },
                  {
                    id: 'no-alcohol',
                    label: 'No alcohol use',
                    text: 'Denies alcohol use.',
                  },
                  {
                    id: 'no-recreational-drugs',
                    label: 'No recreational drug use',
                    text: 'Denies recreational drug use.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
          ],
        },
        {
          id: 'encounter:ros:section',
          fieldType: 'section',
          title: 'Review of systems',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'observations',
          },
          fields: [
            {
              id: 'encounter:ros:narrative',
              fieldType: 'encounterNarrative',
              question: 'Review of systems narrative',
              width: 'full',
              _sourceData: {
                encounterHideLabel: true,
                encounterFindings: [
                  {
                    id: 'pertinent-hpi',
                    label: 'Additional symptoms in HPI',
                    text: 'Additional symptoms are documented in the history of present illness.',
                  },
                  {
                    id: 'limited-review',
                    label: 'Limited review',
                    text: 'Review of systems limited by patient condition.',
                  },
                ],
              },
            },
            {
              id: 'encounter:ros:observation:constitutional',
              question: 'Constitutional',
              width: 'full',
              _sourceData: {
                id: 'constitutional',
                label: 'Constitutional',
                findings: [
                  {
                    id: 'no-fever-chills',
                    label: 'No fever or chills',
                    text: 'Denies fever or chills.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'no-fever-chills',
                    label: 'No fever or chills',
                    text: 'Denies fever or chills.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:ros:observation:cardiovascular',
              question: 'Cardiovascular',
              width: 'full',
              _sourceData: {
                id: 'cardiovascular',
                label: 'Cardiovascular',
                findings: [
                  {
                    id: 'no-chest-pain',
                    label: 'No chest pain',
                    text: 'Denies chest pain.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'no-chest-pain',
                    label: 'No chest pain',
                    text: 'Denies chest pain.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:ros:observation:respiratory',
              question: 'Respiratory',
              width: 'full',
              _sourceData: {
                id: 'respiratory',
                label: 'Respiratory',
                findings: [
                  {
                    id: 'no-dyspnea',
                    label: 'No dyspnea',
                    text: 'Denies shortness of breath.',
                  },
                  {
                    id: 'no-cough',
                    label: 'No cough',
                    text: 'Denies cough.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'no-dyspnea',
                    label: 'No dyspnea',
                    text: 'Denies shortness of breath.',
                  },
                  {
                    id: 'no-cough',
                    label: 'No cough',
                    text: 'Denies cough.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:ros:observation:musculoskeletal',
              question: 'Musculoskeletal',
              width: 'full',
              _sourceData: {
                id: 'musculoskeletal',
                label: 'Musculoskeletal',
                findings: [
                  {
                    id: 'back-pain',
                    label: 'Back pain',
                    text: 'Reports back pain.',
                  },
                  {
                    id: 'no-joint-swelling',
                    label: 'No joint swelling',
                    text: 'Denies joint swelling.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'back-pain',
                    label: 'Back pain',
                    text: 'Reports back pain.',
                  },
                  {
                    id: 'no-joint-swelling',
                    label: 'No joint swelling',
                    text: 'Denies joint swelling.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:ros:observation:neurological',
              question: 'Neurological',
              width: 'full',
              _sourceData: {
                id: 'neurological',
                label: 'Neurological',
                findings: [
                  {
                    id: 'no-weakness',
                    label: 'No weakness',
                    text: 'Denies weakness.',
                  },
                  {
                    id: 'no-numbness-tingling',
                    label: 'No numbness / tingling',
                    text: 'Denies numbness or tingling.',
                  },
                  {
                    id: 'no-bowel-bladder-changes',
                    label: 'No bowel / bladder changes',
                    text: 'Denies bowel or bladder changes.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'no-weakness',
                    label: 'No weakness',
                    text: 'Denies weakness.',
                  },
                  {
                    id: 'no-numbness-tingling',
                    label: 'No numbness / tingling',
                    text: 'Denies numbness or tingling.',
                  },
                  {
                    id: 'no-bowel-bladder-changes',
                    label: 'No bowel / bladder changes',
                    text: 'Denies bowel or bladder changes.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
          ],
        },
        {
          id: 'encounter:vitals:section',
          fieldType: 'section',
          title: 'Vitals',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'vitals',
          },
          fields: [
            {
              id: 'encounter:vitals:observation:value',
              fieldType: 'encounterVitals',
              question: 'Vitals',
              _sourceData: {},
              width: 'full',
            },
          ],
        },
        {
          id: 'encounter:exam:section',
          fieldType: 'section',
          title: 'Physical examination',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'observations',
          },
          fields: [
            {
              id: 'encounter:exam:narrative',
              fieldType: 'encounterNarrative',
              question: 'Physical examination narrative',
              width: 'full',
              _sourceData: {
                encounterHideLabel: true,
                encounterFindings: [
                  {
                    id: 'focused',
                    label: 'Focused examination',
                    text: 'Focused examination performed.',
                  },
                  {
                    id: 'limited-by-pain',
                    label: 'Limited by pain',
                    text: 'Examination limited by pain.',
                  },
                ],
              },
            },
            {
              id: 'encounter:exam:observation:general',
              question: 'General appearance',
              width: 'full',
              _sourceData: {
                id: 'general',
                label: 'General appearance',
                findings: [
                  {
                    id: 'no-distress',
                    label: 'No acute distress',
                    text: 'No acute distress.',
                  },
                  {
                    id: 'alert',
                    label: 'Alert',
                    text: 'Alert and conversant.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'no-distress',
                    label: 'No acute distress',
                    text: 'No acute distress.',
                  },
                  {
                    id: 'alert',
                    label: 'Alert',
                    text: 'Alert and conversant.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:exam:observation:head-neck',
              question: 'Head and neck',
              width: 'full',
              _sourceData: {
                id: 'head-neck',
                label: 'Head and neck',
                findings: [
                  {
                    id: 'no-cervical-nodes',
                    label: 'No cervical lymphadenopathy',
                    text: 'No palpable cervical lymphadenopathy.',
                  },
                  {
                    id: 'no-oral-lesions',
                    label: 'No oral lesions',
                    text: 'No visible oral lesions.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'no-cervical-nodes',
                    label: 'No cervical lymphadenopathy',
                    text: 'No palpable cervical lymphadenopathy.',
                  },
                  {
                    id: 'no-oral-lesions',
                    label: 'No oral lesions',
                    text: 'No visible oral lesions.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:exam:observation:cardiovascular',
              question: 'Cardiovascular',
              width: 'full',
              _sourceData: {
                id: 'cardiovascular',
                label: 'Cardiovascular',
                findings: [
                  {
                    id: 'regular',
                    label: 'Regular rhythm',
                    text: 'Regular rate and rhythm.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'regular',
                    label: 'Regular rhythm',
                    text: 'Regular rate and rhythm.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:exam:observation:respiratory',
              question: 'Respiratory',
              width: 'full',
              _sourceData: {
                id: 'respiratory',
                label: 'Respiratory',
                findings: [
                  {
                    id: 'clear',
                    label: 'Clear lungs',
                    text: 'Lungs clear to auscultation bilaterally.',
                  },
                  {
                    id: 'nonlabored',
                    label: 'Nonlabored',
                    text: 'Breathing is nonlabored.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'clear',
                    label: 'Clear lungs',
                    text: 'Lungs clear to auscultation bilaterally.',
                  },
                  {
                    id: 'nonlabored',
                    label: 'Nonlabored',
                    text: 'Breathing is nonlabored.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:exam:observation:abdomen',
              question: 'Abdomen',
              width: 'full',
              _sourceData: {
                id: 'abdomen',
                label: 'Abdomen',
                findings: [
                  {
                    id: 'soft',
                    label: 'Soft / nontender',
                    text: 'Abdomen soft and nontender.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'soft',
                    label: 'Soft / nontender',
                    text: 'Abdomen soft and nontender.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:exam:observation:musculoskeletal',
              question: 'Musculoskeletal / back',
              width: 'full',
              _sourceData: {
                id: 'musculoskeletal',
                label: 'Musculoskeletal / back',
                findings: [
                  {
                    id: 'no-midline-tenderness',
                    label: 'No midline tenderness',
                    text: 'No midline spinal tenderness.',
                  },
                  {
                    id: 'paraspinal-tenderness',
                    label: 'Paraspinal tenderness',
                    text: 'Paraspinal tenderness is present.',
                  },
                  {
                    id: 'range-of-motion',
                    label: 'Preserved range of motion',
                    text: 'Spinal range of motion is preserved.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'no-midline-tenderness',
                    label: 'No midline tenderness',
                    text: 'No midline spinal tenderness.',
                  },
                  {
                    id: 'paraspinal-tenderness',
                    label: 'Paraspinal tenderness',
                    text: 'Paraspinal tenderness is present.',
                  },
                  {
                    id: 'range-of-motion',
                    label: 'Preserved range of motion',
                    text: 'Spinal range of motion is preserved.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:exam:observation:neurological',
              question: 'Neurological',
              width: 'full',
              _sourceData: {
                id: 'neurological',
                label: 'Neurological',
                findings: [
                  {
                    id: 'symmetric-strength',
                    label: 'Symmetric leg strength',
                    text: 'Strength symmetric in both lower extremities.',
                  },
                  {
                    id: 'light-touch',
                    label: 'Intact light touch',
                    text: 'Sensation intact to light touch in both lower extremities.',
                  },
                  {
                    id: 'steady-gait',
                    label: 'Steady gait',
                    text: 'Gait is steady.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'symmetric-strength',
                    label: 'Symmetric leg strength',
                    text: 'Strength symmetric in both lower extremities.',
                  },
                  {
                    id: 'light-touch',
                    label: 'Intact light touch',
                    text: 'Sensation intact to light touch in both lower extremities.',
                  },
                  {
                    id: 'steady-gait',
                    label: 'Steady gait',
                    text: 'Gait is steady.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:exam:observation:skin',
              question: 'Skin',
              width: 'full',
              _sourceData: {
                id: 'skin',
                label: 'Skin',
                findings: [
                  {
                    id: 'warm-dry',
                    label: 'Warm / dry',
                    text: 'Skin warm and dry.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'warm-dry',
                    label: 'Warm / dry',
                    text: 'Skin warm and dry.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
          ],
        },
        {
          id: 'encounter:conditions:section',
          fieldType: 'section',
          title: 'Conditions',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'conditions',
          },
          fields: [
            {
              id: 'encounter:conditions:observation:value',
              fieldType: 'encounterConditions',
              question: 'Conditions',
              _sourceData: {
                encounterRequireCoding: true,
              },
              width: 'full',
            },
          ],
        },
        {
          id: 'encounter:medications:section',
          fieldType: 'section',
          title: 'Presenting medications',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'medications',
          },
          fields: [
            {
              id: 'encounter:medications:observation:value',
              fieldType: 'encounterMedications',
              question: 'Presenting medications',
              _sourceData: {
                encounterRequireCoding: true,
              },
              width: 'full',
            },
          ],
        },
        {
          id: 'encounter:allergies:section',
          fieldType: 'section',
          title: 'Allergies and intolerances',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'allergies',
          },
          fields: [
            {
              id: 'encounter:allergies:observation:value',
              fieldType: 'encounterAllergies',
              question: 'Allergies and intolerances',
              _sourceData: {
                encounterRequireCoding: true,
              },
              width: 'full',
            },
          ],
        },
        {
          id: 'encounter:assessment:section',
          fieldType: 'section',
          title: 'Assessment and orders',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'assessment',
          },
          fields: [
            {
              id: 'encounter:assessment:observation:value',
              fieldType: 'encounterAssessment',
              question: 'Assessment and orders',
              _sourceData: {
                encounterRequireCoding: true,
              },
              width: 'full',
            },
          ],
        },
        {
          id: 'encounter:plan:section',
          fieldType: 'section',
          title: 'Plan',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'plan',
          },
          fields: [
            {
              id: 'encounter:plan:narrative',
              fieldType: 'encounterNarrative',
              question: 'Plan narrative',
              width: 'full',
              _sourceData: {
                encounterHideLabel: true,
                encounterFindings: [
                  {
                    id: 'questions',
                    label: 'Questions answered',
                    text: 'Questions were answered.',
                  },
                  {
                    id: 'understanding',
                    label: 'Understanding confirmed',
                    text: 'Patient verbalized understanding of the plan.',
                  },
                ],
              },
            },
            {
              id: 'encounter:plan:observation:value',
              fieldType: 'encounterPlan',
              question: 'Plan',
              _sourceData: {
                encounterRequireCoding: true,
              },
              width: 'full',
            },
          ],
        },
        {
          id: 'encounter:follow-up:section',
          fieldType: 'section',
          title: 'Follow-up and appointments',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'observations',
          },
          fields: [
            {
              id: 'encounter:follow-up:narrative',
              fieldType: 'encounterNarrative',
              question: 'Follow-up and appointments narrative',
              width: 'full',
              _sourceData: {
                encounterHideLabel: true,
                encounterFindings: [
                  {
                    id: 'arrangements-reviewed',
                    label: 'Arrangements reviewed',
                    text: 'Follow-up arrangements reviewed with the patient.',
                  },
                  {
                    id: 'patient-to-schedule',
                    label: 'Patient will schedule',
                    text: 'Patient will contact the office to schedule follow-up.',
                  },
                ],
              },
            },
            {
              id: 'encounter:follow-up:observation:interval',
              question: 'Return interval',
              width: 'full',
              _sourceData: {
                id: 'interval',
                label: 'Return interval',
                findings: [
                  {
                    id: 'one-week',
                    label: '1 week',
                    text: '1 week',
                  },
                  {
                    id: 'one-month',
                    label: '1 month',
                    text: '1 month',
                  },
                  {
                    id: 'three-months',
                    label: '3 months',
                    text: '3 months',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'one-week',
                    label: '1 week',
                    text: '1 week',
                  },
                  {
                    id: 'one-month',
                    label: '1 month',
                    text: '1 month',
                  },
                  {
                    id: 'three-months',
                    label: '3 months',
                    text: '3 months',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
            {
              id: 'encounter:follow-up:observation:appointment',
              question: 'Appointment details',
              width: 'full',
              _sourceData: {
                id: 'appointment',
                label: 'Appointment details',
                findings: [
                  {
                    id: 'scheduled',
                    label: 'Appointment scheduled',
                    text: 'Appointment scheduled.',
                  },
                  {
                    id: 'patient-to-schedule',
                    label: 'Patient to schedule',
                    text: 'Patient to schedule appointment.',
                  },
                  {
                    id: 'scheduling-pending',
                    label: 'Scheduling pending',
                    text: 'Appointment scheduling pending.',
                  },
                ],
                encounterFindings: [
                  {
                    id: 'scheduled',
                    label: 'Appointment scheduled',
                    text: 'Appointment scheduled.',
                  },
                  {
                    id: 'patient-to-schedule',
                    label: 'Patient to schedule',
                    text: 'Patient to schedule appointment.',
                  },
                  {
                    id: 'scheduling-pending',
                    label: 'Scheduling pending',
                    text: 'Appointment scheduling pending.',
                  },
                ],
              },
              fieldType: 'encounterNarrative',
            },
          ],
        },
      ],
    },
  ],
} as unknown as FormDefinition;
