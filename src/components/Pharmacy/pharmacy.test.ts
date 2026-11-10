import { describe, it, expect } from 'vitest';
import type { MessageTranslator } from '../../utils/messages';
import {
  buildSearchParams,
  candidateLabel,
  chooseDefaultCandidate,
  classifyPharmacy,
  DEFAULT_SEARCH_FILTERS,
  describePharmacy,
  filtersFromLocation,
  normalizePharmId,
  parsePharmId,
  pharmacyTypeLabel,
  preferredPharmacyChoice,
  preferredRoleId,
  serviceLevelFlags,
  type CandidateRank,
  type Pharmacy,
  type PharmacyCandidate,
  type PharmacySearchFilters,
} from './pharmacy';

const m: MessageTranslator = (message, values) =>
  values
    ? message.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]))
    : message;

const pharmacy = (overrides: Partial<Pharmacy> = {}): Pharmacy => ({
  pharmId: '0000001',
  ncpdpid: '0000001',
  npi: '',
  storeName: 'Main Street Pharmacy',
  addressLine1: '100 Main St',
  city: 'Fort Wayne',
  state: 'IN',
  zip: '46805',
  phone: '5550100001',
  fax: '5550100002',
  serviceLevel: 3,
  mailOrder: false,
  ...overrides,
});

const candidate = (pharmId: string, preferred: CandidateRank = 0) =>
  ({
    ...pharmacy({ pharmId, ncpdpid: pharmId }),
    preferred,
  }) as PharmacyCandidate;

const filters = (
  overrides: Partial<PharmacySearchFilters> = {}
): PharmacySearchFilters => ({ ...DEFAULT_SEARCH_FILTERS, ...overrides });

describe('normalizePharmId / parsePharmId', () => {
  it('treats the placeholder "0" and blanks as no pharmacy', () => {
    expect(normalizePharmId('0')).toBe('');
    expect(normalizePharmId(' ')).toBe('');
    expect(normalizePharmId(undefined)).toBe('');
    expect(parsePharmId('0')).toBeNull();
    expect(parsePharmId('')).toBeNull();
    expect(parsePharmId('N')).toBeNull();
  });

  it('splits NPI ids and keeps NCPDP ids', () => {
    expect(parsePharmId('N1234567890')).toEqual({
      id: '1234567890',
      idType: 'npi',
    });
    expect(parsePharmId('1234567')).toEqual({ id: '1234567', idType: 'ncpdp' });
  });
});

describe('classification', () => {
  it('reads service level bits', () => {
    expect(serviceLevelFlags({ serviceLevel: 2051 })).toEqual({
      newRx: true,
      refillRequest: true,
      epcs: true,
    });
    expect(serviceLevelFlags({ serviceLevel: 0 })).toEqual({
      newRx: false,
      refillRequest: false,
      epcs: false,
    });
  });

  it.each([
    ['electronic', { serviceLevel: 1 }, 'E-prescribing'],
    ['electronic EPCS', { serviceLevel: 2049 }, 'E-prescribing + EPCS'],
    [
      'mail-order electronic',
      { serviceLevel: 1, mailOrder: true },
      'Mail order, e-prescribing',
    ],
    [
      'mail-order electronic EPCS',
      { serviceLevel: 2049, mailOrder: true },
      'Mail order, e-prescribing + EPCS',
    ],
    [
      'fax-only mail order',
      {
        pharmId: 'N1',
        ncpdpid: '',
        npi: '1',
        serviceLevel: 0,
        mailOrder: true,
      },
      'Mail order',
    ],
    [
      'local fax-only',
      { pharmId: 'N1', ncpdpid: '', npi: '1', serviceLevel: 0 },
      null,
    ],
    ['print only', { serviceLevel: 0 }, null],
  ] as const)('labels a %s pharmacy', (_, overrides, label) => {
    expect(pharmacyTypeLabel(classifyPharmacy(pharmacy(overrides)), m)).toBe(
      label
    );
  });

  it('treats an NCPDP pharmacy without NewRx but with an NPI as fax', () => {
    expect(
      classifyPharmacy(pharmacy({ serviceLevel: 0, npi: '1234567890' })).kind
    ).toBe('fax');
  });

  it('maps mail order to role 6 and everything else to role 5', () => {
    expect(preferredRoleId({ mailOrder: true })).toBe(6);
    expect(preferredRoleId({ mailOrder: false })).toBe(5);
  });

  it('builds the Make Preferred request, stripping the NPI prefix', () => {
    expect(
      preferredPharmacyChoice({ pharmId: 'N1990000001', mailOrder: false })
    ).toEqual({
      pharmId: 'N1990000001',
      id: '1990000001',
      idType: 'npi',
      roleId: 5,
    });
    expect(
      preferredPharmacyChoice({ pharmId: '9900004', mailOrder: true })
    ).toEqual({
      pharmId: '9900004',
      id: '9900004',
      idType: 'ncpdp',
      roleId: 6,
    });
    expect(
      preferredPharmacyChoice({ pharmId: '', mailOrder: true })
    ).toBeNull();
  });
});

describe('chooseDefaultCandidate', () => {
  it('leaves the placeholder when there are no candidates', () => {
    expect(chooseDefaultCandidate([])).toBe('');
  });

  it('selects a single candidate even when an override was requested', () => {
    expect(chooseDefaultCandidate([candidate('A')], 'Z')).toBe('A');
  });

  it('selects the override ahead of preferred pharmacies', () => {
    expect(
      chooseDefaultCandidate(
        [candidate('O', 2), candidate('P', 1), candidate('R')],
        'O'
      )
    ).toBe('O');
  });

  it('selects only the first of two preferred pharmacies', () => {
    expect(chooseDefaultCandidate([candidate('L', 1), candidate('M', 1)])).toBe(
      'L'
    );
  });

  it('selects the most recent pharmacy when none is preferred', () => {
    expect(chooseDefaultCandidate([candidate('A'), candidate('B')])).toBe('A');
  });

  it('keeps the placeholder when the requested override is missing', () => {
    expect(chooseDefaultCandidate([candidate('A'), candidate('B')], 'Z')).toBe(
      ''
    );
    expect(chooseDefaultCandidate([candidate('A'), candidate('B')], '0')).toBe(
      'A'
    );
  });
});

describe('buildSearchParams', () => {
  it('waits for a name on postal and state/city searches', () => {
    expect(buildSearchParams(filters({ postal: '46805' }), ' ')).toEqual({
      status: 'incomplete',
    });
  });

  it('sends the first 5 postal characters and omits empty fields', () => {
    expect(
      buildSearchParams(filters({ postal: '46805-1234', state: 'IN' }), 'walg')
    ).toEqual({
      status: 'ready',
      params: {
        query: 'walg',
        zip: '46805',
        excludeNpi: true,
        mailOnly: false,
      },
    });
  });

  it('sends state and city for a state/city search', () => {
    expect(
      buildSearchParams(
        filters({ method: 'statecity', state: 'IN', city: 'Ft Wayne' }),
        'main'
      )
    ).toEqual({
      status: 'ready',
      params: {
        query: 'main',
        state: 'IN',
        city: 'Ft Wayne',
        excludeNpi: true,
        mailOnly: false,
      },
    });
  });

  it('requires 6 digits for phone and fax, counting digits only', () => {
    expect(
      buildSearchParams(filters({ method: 'phone', phone: '555-01' }), '')
    ).toEqual({ status: 'invalid', field: 'phone' });
    expect(buildSearchParams(filters({ method: 'fax', fax: '' }), '')).toEqual({
      status: 'invalid',
      field: 'fax',
    });
  });

  it('runs phone and fax searches without a name, sending digits', () => {
    expect(
      buildSearchParams(
        filters({ method: 'fax', fax: '555 010-0', mailOnly: true }),
        ''
      )
    ).toEqual({
      status: 'ready',
      params: { fax: '5550100', excludeNpi: true, mailOnly: true },
    });
  });
});

describe('filtersFromLocation', () => {
  it('prefills postal, state and city', () => {
    expect(
      filtersFromLocation({
        state: 'IN',
        city: 'Fort Wayne',
        postal: '46805-1234',
      })
    ).toEqual(filters({ postal: '46805', state: 'IN', city: 'Fort Wayne' }));
  });

  it('falls back to defaults for an unknown patient', () => {
    expect(filtersFromLocation(null)).toEqual(filters());
  });
});

describe('display', () => {
  it('describes a pharmacy with address, phone and fax', () => {
    expect(describePharmacy(pharmacy(), m)).toBe(
      'Main Street Pharmacy - 100 Main St Fort Wayne IN (555) 010-0001 f: (555) 010-0002'
    );
  });

  it('hides the address of a SureScripts mail-order pharmacy', () => {
    expect(describePharmacy(pharmacy({ mailOrder: true, fax: '' }), m)).toBe(
      'Main Street Pharmacy - (555) 010-0001'
    );
  });

  it('appends ids when requested', () => {
    expect(
      describePharmacy(pharmacy({ fax: '', npi: '1234567890' }), m, {
        showIds: true,
      })
    ).toBe(
      'Main Street Pharmacy - 100 Main St Fort Wayne IN (555) 010-0001 NCPDPID: 0000001 NPI: 1234567890'
    );
  });

  it('labels candidate options', () => {
    expect(candidateLabel(pharmacy())).toBe(
      'Main Street Pharmacy - 100 Main St Fort Wayne, IN'
    );
  });
});
