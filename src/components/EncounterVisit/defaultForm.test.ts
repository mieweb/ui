import { describe, expect, it } from 'vitest';
import { DEFAULT_ENCOUNTER_FORM } from './defaultForm';
import { getEncounterFormSections } from './definition';
import {
  DEFAULT_ENCOUNTER_VISIT_DEFINITION,
  encounterFormFromLegacy,
} from './legacy';

describe('DEFAULT_ENCOUNTER_FORM', () => {
  it('stays equivalent to converting the legacy default definition', () => {
    expect(DEFAULT_ENCOUNTER_FORM).toEqual(
      encounterFormFromLegacy(DEFAULT_ENCOUNTER_VISIT_DEFINITION)
    );
  });

  it('derives the legacy sections losslessly', () => {
    expect(getEncounterFormSections(DEFAULT_ENCOUNTER_FORM)).toEqual(
      DEFAULT_ENCOUNTER_VISIT_DEFINITION.sections
    );
  });
});
