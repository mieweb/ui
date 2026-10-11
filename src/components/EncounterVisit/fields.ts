import { getFieldComponent, registerCustomFieldTypes } from '@esheet/fields';
import { EncounterVitalsField } from './EncounterVitalsField';
import { EncounterAssessmentField } from './EncounterAssessmentField';
import { EncounterNarrativeField } from './EncounterNarrativeField';
import { EncounterMedicationField } from './EncounterMedicationField';
import { EncounterAllergyField } from './EncounterAllergyField';
import { EncounterConditionsField } from './EncounterConditionsField';
import { EncounterPlanField } from './EncounterPlanField';

/** Register encounter fields when missing, retaining any host-supplied editors. */
export function registerEncounterFieldTypes(): void {
  const clinicalFields = {
    encounterMedications: {
      label: 'Encounter medications',
      component: EncounterMedicationField,
    },
    encounterAllergies: {
      label: 'Encounter allergies',
      component: EncounterAllergyField,
    },
    encounterConditions: {
      label: 'Encounter conditions',
      component: EncounterConditionsField,
    },
    encounterPlan: { label: 'Encounter plan', component: EncounterPlanField },
  };
  for (const [type, { label, component }] of Object.entries(clinicalFields)) {
    if (!getFieldComponent(type))
      registerCustomFieldTypes({
        [type]: {
          label,
          category: 'rich',
          answerType: 'text',
          hasOptions: false,
          hasMatrix: false,
          defaultProps: { question: label },
          component,
        },
      });
  }
  if (!getFieldComponent('encounterNarrative')) {
    registerCustomFieldTypes({
      encounterNarrative: {
        label: 'Encounter narrative',
        category: 'rich',
        answerType: 'text',
        hasOptions: false,
        hasMatrix: false,
        defaultProps: { question: 'Narrative' },
        component: EncounterNarrativeField,
      },
    });
  }
  if (!getFieldComponent('encounterVitals')) {
    registerCustomFieldTypes({
      encounterVitals: {
        label: 'Encounter vitals',
        category: 'rich',
        answerType: 'text',
        hasOptions: false,
        hasMatrix: false,
        defaultProps: { question: 'Vitals' },
        component: EncounterVitalsField,
      },
    });
  }
  if (!getFieldComponent('encounterAssessment')) {
    registerCustomFieldTypes({
      encounterAssessment: {
        label: 'Encounter assessment and plan',
        category: 'rich',
        answerType: 'text',
        hasOptions: false,
        hasMatrix: false,
        defaultProps: { question: 'Assessment and plan' },
        component: EncounterAssessmentField,
      },
    });
  }
}
