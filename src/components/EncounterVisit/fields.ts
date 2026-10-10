import { getFieldComponent, registerCustomFieldTypes } from '@esheet/fields';
import { EncounterVitalsField } from './EncounterVitalsField';
import { EncounterAssessmentField } from './EncounterAssessmentField';
import { EncounterNarrativeField } from './EncounterNarrativeField';

/** Register encounter fields when missing, retaining any host-supplied editors. */
export function registerEncounterFieldTypes(): void {
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
