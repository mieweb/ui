/**
 * Story and test fixtures: a small fictional pharmacy directory, patients
 * that exercise every default-selection rule, and an in-memory
 * `PharmacyDataSource`.
 *
 * The fake search is deliberately simple (name begins/contains, a distance
 * table, ft → fort city aliases). The real multi-pass search belongs to the
 * host's server. All names, ids and numbers are fictional; phone numbers use
 * the reserved 555-01xx range.
 */

import type { PatientLocation, PharmacyDataSource } from './dataSource';
import {
  normalizePharmId,
  PreferredPharmacyRole,
  type Pharmacy,
  type PharmacyCandidate,
  type PharmacySearchParams,
} from './pharmacy';

const ncpdp = (
  ncpdpid: string,
  fields: Omit<Pharmacy, 'pharmId' | 'ncpdpid' | 'npi'> & { npi?: string }
): Pharmacy => ({ pharmId: ncpdpid, ncpdpid, npi: '', ...fields });

const npiOnly = (
  npi: string,
  fields: Omit<Pharmacy, 'pharmId' | 'ncpdpid' | 'npi'>
): Pharmacy => ({ pharmId: `N${npi}`, ncpdpid: '', npi, ...fields });

/** Keyed by role in the stories, not by id, so tests read clearly. */
export const storyPharmacies = {
  /** Electronic, New + Refill, at the patient's zip. */
  main: ncpdp('9900001', {
    storeName: 'Main Street Pharmacy',
    addressLine1: '100 Main St',
    city: 'Fort Wayne',
    state: 'IN',
    zip: '46805',
    phone: '2605550101',
    fax: '2605550102',
    serviceLevel: 3,
    mailOrder: false,
  }),
  /** Electronic + EPCS. */
  corner: ncpdp('9900002', {
    storeName: 'Corner Drug',
    addressLine1: '220 Oak Ave',
    city: 'Fort Wayne',
    state: 'IN',
    zip: '46807',
    phone: '2605550103',
    fax: '2605550104',
    serviceLevel: 2051,
    mailOrder: false,
  }),
  /** Electronic, New only; no fax. */
  wellway: ncpdp('9900003', {
    storeName: 'Wellway Pharmacy #12',
    addressLine1: '4800 Coldwater Rd',
    city: 'Fort Wayne',
    state: 'IN',
    zip: '46815',
    phone: '2605550105',
    fax: '',
    serviceLevel: 1,
    mailOrder: false,
  }),
  /** SureScripts mail order: address hidden in results. */
  mail: ncpdp('9900004', {
    storeName: 'MailMeds Direct',
    addressLine1: '1 Distribution Way',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85001',
    phone: '8005550106',
    fax: '',
    serviceLevel: 1,
    mailOrder: true,
  }),
  /** SureScripts mail order + EPCS. */
  mailEpcs: ncpdp('9900005', {
    storeName: 'CareMail Pharmacy',
    addressLine1: '75 Commerce St',
    city: 'Nashville',
    state: 'TN',
    zip: '37201',
    phone: '8005550107',
    fax: '8005550108',
    serviceLevel: 2049,
    mailOrder: true,
  }),
  /** NPI-only, fax. Hidden while Exclude NPI is on. */
  riverside: npiOnly('1990000001', {
    storeName: 'Riverside Apothecary',
    addressLine1: '12 Spy Run Ave',
    city: 'Fort Wayne',
    state: 'IN',
    zip: '46802',
    phone: '2605550109',
    fax: '2605550110',
    serviceLevel: 0,
    mailOrder: false,
  }),
  /** NPI-only mail order. */
  prairieMail: npiOnly('1990000002', {
    storeName: 'Prairie Mail Pharmacy',
    addressLine1: '900 Grand Ave',
    city: 'Des Moines',
    state: 'IA',
    zip: '50309',
    phone: '5155550111',
    fax: '5155550112',
    serviceLevel: 0,
    mailOrder: true,
  }),
  /** NCPDP without NewRx, but has an NPI and fax: Fax Only. */
  oldTown: ncpdp('9900008', {
    npi: '1990000003',
    storeName: 'Old Town Pharmacy',
    addressLine1: '305 Wells St',
    city: 'Fort Wayne',
    state: 'IN',
    zip: '46803',
    phone: '2605550113',
    fax: '2605550114',
    serviceLevel: 0,
    mailOrder: false,
  }),
  /** No NewRx, no fax, no NPI: Print Only. */
  hilltop: ncpdp('9900009', {
    storeName: 'Hilltop Health Shop',
    addressLine1: '58 Hill Rd',
    city: 'Fort Wayne',
    state: 'IN',
    zip: '46804',
    phone: '2605550115',
    fax: '',
    serviceLevel: 0,
    mailOrder: false,
  }),
  /** Name contains "wellway" without starting with it. */
  northside: ncpdp('9900010', {
    storeName: 'Northside Wellway',
    addressLine1: '6100 N Clinton St',
    city: 'Fort Wayne',
    state: 'IN',
    zip: '46825',
    phone: '2605550116',
    fax: '2605550117',
    serviceLevel: 3,
    mailOrder: false,
  }),
  /** Same state, outside the 100-mile radius. */
  capitol: ncpdp('9900011', {
    storeName: 'Capitol Pharmacy',
    addressLine1: '1 Monument Cir',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46204',
    phone: '3175550118',
    fax: '3175550119',
    serviceLevel: 3,
    mailOrder: false,
  }),
  /** Another state, inside the radius. */
  lakeview: ncpdp('9900012', {
    storeName: 'Lakeview Pharmacy',
    addressLine1: '400 Summit St',
    city: 'Toledo',
    state: 'OH',
    zip: '43604',
    phone: '4195550120',
    fax: '4195550121',
    serviceLevel: 3,
    mailOrder: false,
  }),
  /** Site custom pharmacy with an address line 2. */
  clinic: ncpdp('C000013', {
    storeName: 'Clinic Dispensary',
    addressLine1: '2000 Medical Park Dr',
    addressLine2: 'Suite 200',
    city: 'Fort Wayne',
    state: 'IN',
    zip: '46805',
    phone: '2605550122',
    fax: '2605550123',
    serviceLevel: 1,
    mailOrder: false,
  }),
  /** Text expansion. */
  longName: ncpdp('9900014', {
    storeName: 'Saint Elizabeth Community Health Pharmacy and Wellness Center',
    addressLine1: '12345 West Jefferson Boulevard',
    addressLine2: 'Medical Office Building B, Floor 3',
    city: 'Fort Wayne',
    state: 'IN',
    zip: '46804',
    phone: '2605550124',
    fax: '2605550125',
    serviceLevel: 3,
    mailOrder: false,
  }),
} satisfies Record<string, Pharmacy>;

export const storyDirectory: readonly Pharmacy[] =
  Object.values(storyPharmacies);

/** Miles from the patient's zip. Absent = more than 100 miles away. */
const ZIP_DISTANCES: Record<string, Record<string, number>> = {
  '46805': {
    '46805': 0,
    '46802': 2,
    '46803': 2,
    '46807': 3,
    '46815': 5,
    '46804': 6,
    '46825': 7,
    '43604': 95,
  },
};

const CITIES: Record<string, string[]> = {
  IN: ['Elkhart', 'Fishers', 'Fort Branch', 'Fort Wayne', 'Indianapolis'],
  OH: ['Cleveland', 'Columbus', 'Fort Recovery', 'Toledo'],
};

/** Short state list until the shared US list lands. */
export const storyStateOptions = [
  { value: 'AZ', label: 'Arizona' },
  { value: 'IA', label: 'Iowa' },
  { value: 'IN', label: 'Indiana' },
  { value: 'OH', label: 'Ohio' },
  { value: 'TN', label: 'Tennessee' },
];

const normalizeCity = (city: string) =>
  city
    .trim()
    .toLowerCase()
    .replace(/^ft\.?\s+/, 'fort ');

// =============================================================================
// Patients
// =============================================================================

interface StoryPatient {
  location: PatientLocation | null;
  preferred: { local?: string; mail?: string };
  /** pharmId → days since last use. */
  history: Record<string, number>;
}

const P = storyPharmacies;
const FORT_WAYNE: PatientLocation = {
  country: 'US',
  state: 'IN',
  city: 'Fort Wayne',
  postal: '46805-1234',
};

/** Patients covering each default-selection rule. */
export const storyPatients = {
  'no-history': { location: FORT_WAYNE, preferred: {}, history: {} },
  'single-faxed': {
    location: FORT_WAYNE,
    preferred: {},
    history: { [P.oldTown.pharmId]: 12 },
  },
  'preferred-and-recent': {
    location: FORT_WAYNE,
    preferred: { local: P.main.pharmId },
    history: {
      [P.corner.pharmId]: 2,
      [P.wellway.pharmId]: 5,
      [P.riverside.pharmId]: 9,
      [P.northside.pharmId]: 20,
      [P.longName.pharmId]: 40,
      [P.clinic.pharmId]: 60,
    },
  },
  'two-preferred': {
    location: FORT_WAYNE,
    preferred: { local: P.corner.pharmId, mail: P.mail.pharmId },
    history: { [P.main.pharmId]: 3 },
  },
  unknown: { location: null, preferred: {}, history: {} },
} satisfies Record<string, StoryPatient>;

export type StoryPatientId = keyof typeof storyPatients;

const findPharmacy = (pharmId: string) =>
  storyDirectory.find((p) => p.pharmId === pharmId) ?? null;

/** Ranks a patient's candidates the way the WebChart endpoint does. */
function rankCandidates(
  patient: StoryPatient,
  overridePharmId?: string
): PharmacyCandidate[] {
  const rows = new Map<string, PharmacyCandidate>();
  const add = (pharmId: string, preferred: 0 | 1 | 2, elapsed: number) => {
    const pharmacy = findPharmacy(pharmId);
    if (!pharmacy) return;
    const existing = rows.get(pharmId);
    rows.set(pharmId, {
      ...pharmacy,
      preferred: Math.max(existing?.preferred ?? 0, preferred) as 0 | 1 | 2,
      elapsed: Math.min(existing?.elapsed ?? Infinity, elapsed),
    });
  };
  for (const pharmId of Object.values(patient.preferred)) {
    if (pharmId) add(pharmId, 1, 0);
  }
  for (const [pharmId, elapsed] of Object.entries(patient.history)) {
    add(pharmId, 0, elapsed);
  }
  const override = normalizePharmId(overridePharmId);
  if (override) add(override, 2, 0);
  return [...rows.values()]
    .sort(
      (a, b) => b.preferred - a.preferred || (a.elapsed ?? 0) - (b.elapsed ?? 0)
    )
    .slice(0, 5);
}

/** Candidates for presentational stories. */
export function storyCandidates(
  patientId: StoryPatientId,
  overridePharmId?: string
): PharmacyCandidate[] {
  return rankCandidates(storyPatients[patientId], overridePharmId);
}

// =============================================================================
// Search
// =============================================================================

function searchDirectory(params: PharmacySearchParams): Pharmacy[] {
  let pool = storyDirectory.filter(
    (p) =>
      (!params.excludeNpi || p.ncpdpid !== '') &&
      (!params.mailOnly || p.mailOrder)
  );

  const number = params.phone ?? params.fax;
  if (number) {
    const field = params.phone ? 'phone' : 'fax';
    return pool.filter((p) => p[field].startsWith(number)).slice(0, 100);
  }

  const query = params.query?.toLowerCase() ?? '';
  const begins = pool.filter((p) =>
    p.storeName.toLowerCase().startsWith(query)
  );
  const contains = pool.filter(
    (p) => !begins.includes(p) && p.storeName.toLowerCase().includes(query)
  );
  pool = [...begins, ...contains];

  // Mail-order pharmacies ship anywhere, so location never excludes them.
  if (params.zip) {
    const distances = ZIP_DISTANCES[params.zip] ?? {};
    const distance = (p: Pharmacy) =>
      p.mailOrder ? Infinity : (distances[p.zip] ?? -1);
    return pool
      .filter((p) => p.mailOrder || distance(p) >= 0)
      .sort((a, b) => distance(a) - distance(b))
      .slice(0, 30);
  }
  if (params.state) {
    const city = params.city ? normalizeCity(params.city) : '';
    pool = pool.filter(
      (p) =>
        p.mailOrder ||
        (p.state === params.state && (!city || normalizeCity(p.city) === city))
    );
  }
  return pool.slice(0, 100);
}

// =============================================================================
// Fake data source
// =============================================================================

export interface FakePharmacySourceOptions {
  /** Latency for every call. `Infinity` never resolves (loading state). */
  delayMs?: number;
  failCandidates?: boolean;
  failSearch?: boolean;
  failSave?: boolean;
  /** Called after each call resolves, for story logs. */
  onCall?: (name: keyof PharmacyDataSource, args: unknown[]) => void;
}

const abortError = () => new globalThis.DOMException('Aborted', 'AbortError');

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    if (ms === Infinity) return;
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(abortError());
    });
  });
}

/**
 * An in-memory `PharmacyDataSource` over the fixtures. Each source has its
 * own copy of the patients, so "Make Preferred" in one story does not leak
 * into another.
 */
export function createFakePharmacySource(
  options: FakePharmacySourceOptions = {}
): PharmacyDataSource {
  const { delayMs = 0, onCall } = options;
  const patients: Record<string, StoryPatient> = JSON.parse(
    JSON.stringify(storyPatients)
  );

  const call = async <T>(
    name: keyof PharmacyDataSource,
    args: unknown[],
    signal: AbortSignal | undefined,
    fail: boolean | undefined,
    run: () => T
  ): Promise<T> => {
    await wait(delayMs, signal);
    if (fail) throw new Error(`${name} failed`);
    const result = run();
    onCall?.(name, args);
    return result;
  };

  return {
    getCandidates: (patId, overridePharmId, signal) =>
      call(
        'getCandidates',
        [patId, overridePharmId],
        signal,
        options.failCandidates,
        () => {
          const patient = patients[patId];
          return patient ? rankCandidates(patient, overridePharmId) : [];
        }
      ),
    getPatientLocation: (patId, signal) =>
      call(
        'getPatientLocation',
        [patId],
        signal,
        false,
        () => patients[patId]?.location ?? null
      ),
    searchPharmacies: (params, signal) =>
      call('searchPharmacies', [params], signal, options.failSearch, () =>
        searchDirectory(params)
      ),
    getPharmacy: (pharmId, signal) =>
      call('getPharmacy', [pharmId], signal, false, () =>
        findPharmacy(pharmId)
      ),
    searchCities: (query, state, signal) =>
      call('searchCities', [query, state], signal, false, () =>
        (state ? (CITIES[state] ?? []) : Object.values(CITIES).flat()).filter(
          (city) => city.toLowerCase().startsWith(query.trim().toLowerCase())
        )
      ),
    setPreferred: (request) =>
      call('setPreferred', [request], undefined, options.failSave, () => {
        const patient = patients[request.patId];
        if (!patient) throw new Error('Unknown patient');
        const slot =
          request.roleId === PreferredPharmacyRole.MailOrder ? 'mail' : 'local';
        patient.preferred[slot] = request.pharmId;
      }),
  };
}
