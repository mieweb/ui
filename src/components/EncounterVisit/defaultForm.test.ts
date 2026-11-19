import { describe, expect, it } from 'vitest';
import { DEFAULT_ENCOUNTER_FORM } from './defaultForm';
import { getEncounterFormSections, validateEncounterForm } from './definition';

describe('DEFAULT_ENCOUNTER_FORM', () => {
  it('passes native encounter form validation', () => {
    expect(() => validateEncounterForm(DEFAULT_ENCOUNTER_FORM)).not.toThrow();
  });

  it('derives the eleven stock section views from the native form', () => {
    expect(
      getEncounterFormSections(DEFAULT_ENCOUNTER_FORM).map(({ id, kind }) => ({
        id,
        kind,
      }))
    ).toEqual([
      { id: 'hpi', kind: 'narrative' },
      { id: 'history', kind: 'observations' },
      { id: 'ros', kind: 'observations' },
      { id: 'vitals', kind: 'vitals' },
      { id: 'exam', kind: 'observations' },
      { id: 'conditions', kind: 'conditions' },
      { id: 'medications', kind: 'medications' },
      { id: 'allergies', kind: 'allergies' },
      { id: 'assessment', kind: 'assessment' },
      { id: 'plan', kind: 'plan' },
      { id: 'follow-up', kind: 'observations' },
    ]);
  });
});
