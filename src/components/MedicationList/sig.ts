/**
 * Sig (directions) handling for the medication editor. One term dictionary
 * drives all three uses, so a frequency or unit is defined once:
 *
 * - `expandSig` — practitioner shorthand → patient wording
 *   ("1 tab po bid" → "Take 1 tablet by mouth twice a day.")
 * - `parseSig` — route / frequency / PRN, shown under the patient sig
 * - `calculateQuantity` — dispense quantity from the sig × days supply
 *
 * Hosts extend or override the dictionary with server data (e.g. the
 * `rxlist_frequencies` table) through the editor's `sigTerms` prop.
 */

// =============================================================================
// Term dictionary
// =============================================================================

/** One dictionary entry. Abbreviations and patient wording both match. */
export interface SigTerm {
  /** Abbreviation as typed, e.g. 'bid', 'tab' */
  abbrev: string;
  /** Plural abbreviation, e.g. 'tabs' */
  abbrevPlural?: string;
  /** Patient wording the abbreviation expands to, e.g. 'twice a day' */
  term?: string;
  /** Plural patient wording, e.g. 'tablets' */
  termPlural?: string;
  /** Doses per day this term contributes (0 = none, e.g. units and routes) */
  perDay: number;
  /** Frequency name `parseSig` reports, e.g. 'Twice daily' */
  frequency?: string;
  /** Route `parseSig` reports, e.g. 'oral' */
  route?: string;
  /** Marks an as-needed term */
  prn?: boolean;
  /** Dose unit this term names (e.g. 'tablet') — must match the dose form */
  unit?: string;
  /** mL per unit for liquid measures (teaspoon = 4.92892) */
  ml?: number;
  /** mg per unit for mass doses, converted through the product strength */
  mg?: number;
  /** A dose unit quantity can never be calculated from (units, mEq) */
  noCalc?: boolean;
}

const freq = (
  abbrev: string,
  term: string,
  perDay: number,
  frequency: string
): SigTerm => ({ abbrev, term, perDay, frequency });

const route = (r: string, abbrev: string, term = abbrev): SigTerm => ({
  abbrev,
  term,
  perDay: 0,
  route: r,
});

const doseUnit = (
  unit: string,
  abbrev: string,
  abbrevPlural: string,
  term = abbrev,
  termPlural = abbrevPlural,
  extra: Partial<SigTerm> = {}
): SigTerm => ({
  abbrev,
  abbrevPlural,
  term,
  termPlural,
  perDay: 0,
  unit,
  ...extra,
});

const ONCE = 'Once daily';
const TWICE = 'Twice daily';
const THREE = 'Three times daily';
const FOUR = 'Four times daily';
const BEDTIME = 'Every bedtime';
const WEEKLY = 'Weekly';

/** Built-in sig vocabulary (English). */
export const DEFAULT_SIG_TERMS: SigTerm[] = [
  // —— Frequencies ——
  freq('qd', 'once a day', 1, ONCE),
  freq('daily', 'daily', 1, ONCE),
  freq('once daily', 'once daily', 1, ONCE),
  freq('once per day', 'once per day', 1, ONCE),
  freq('bid', 'twice a day', 2, TWICE),
  freq('twice daily', 'twice daily', 2, TWICE),
  freq('twice per day', 'twice per day', 2, TWICE),
  freq('tid', 'three times a day', 3, THREE),
  freq('three times daily', 'three times daily', 3, THREE),
  freq('3 times a day', '3 times a day', 3, THREE),
  freq('3 times daily', '3 times daily', 3, THREE),
  freq('qid', 'four times a day', 4, FOUR),
  freq('four times daily', 'four times daily', 4, FOUR),
  freq('4 times a day', '4 times a day', 4, FOUR),
  freq('4 times daily', '4 times daily', 4, FOUR),
  freq('qod', 'every other day', 0.5, 'Every other day'),
  freq('qam', 'every morning', 1, 'Every morning'),
  freq('qpm', 'every evening', 1, 'Every evening'),
  freq('qhs', 'at bedtime', 1, BEDTIME),
  freq('hs', 'at bedtime', 1, BEDTIME),
  freq('bedtime', 'bedtime', 1, BEDTIME),
  freq('at night', 'at night', 1, BEDTIME),
  freq('weekly', 'weekly', 1 / 7, WEEKLY),
  freq('once a week', 'once a week', 1 / 7, WEEKLY),
  { abbrev: 'prn', term: 'as needed', perDay: 0, prn: true },
  { abbrev: 'ac', term: 'before meals', perDay: 0 },
  { abbrev: 'pc', term: 'after meals', perDay: 0 },

  // —— Routes ——
  route('oral', 'po', 'by mouth'),
  route('oral', 'oral'),
  route('oral', 'orally'),
  route('sublingual', 'sl', 'under the tongue'),
  route('sublingual', 'sublingual'),
  route('sublingual', 'sublingually'),
  route('rectal', 'pr', 'rectally'),
  route('rectal', 'rectal'),
  route('subcutaneous', 'subq', 'subcutaneously'),
  route('subcutaneous', 'sq', 'subcutaneously'),
  route('subcutaneous', 'sc', 'subcutaneously'),
  route('subcutaneous', 'subcutaneous'),
  route('intramuscular', 'im', 'intramuscularly'),
  route('intramuscular', 'intramuscular'),
  route('intravenous', 'iv', 'intravenously'),
  route('intravenous', 'intravenous'),
  route('inhalation', 'inhale'),
  route('inhalation', 'inhaled'),
  route('inhalation', 'inhalation'),
  route('inhalation', 'nebulizer'),
  route('inhalation', 'nebulized'),
  route('ophthalmic', 'eye'),
  route('ophthalmic', 'eyes'),
  route('ophthalmic', 'ophthalmic'),
  route('otic', 'ear'),
  route('otic', 'ears'),
  route('otic', 'otic'),
  route('nasal', 'nostril'),
  route('nasal', 'nostrils'),
  route('nasal', 'nasal'),
  route('nasal', 'nasally'),
  route('nasal', 'intranasal'),
  route('nasal', 'intranasally'),
  route('vaginal', 'vaginal'),
  route('vaginal', 'vaginally'),
  route('topical', 'apply'),
  route('topical', 'topical'),
  route('topical', 'topically'),
  route('topical', 'transdermal'),
  route('topical', 'to skin'),
  route('topical', 'to the skin'),

  // —— Dose units ——
  doseUnit('tablet', 'tab', 'tabs', 'tablet', 'tablets'),
  doseUnit('capsule', 'cap', 'caps', 'capsule', 'capsules'),
  doseUnit('suppository', 'supp', 'supps', 'suppository', 'suppositories'),
  doseUnit('patch', 'patch', 'patches'),
  doseUnit('lozenge', 'lozenge', 'lozenges'),
  doseUnit('lozenge', 'troche', 'troches'),
  doseUnit('film', 'film', 'films'),
  doseUnit('puff', 'puff', 'puffs', 'puff', 'puffs', { route: 'inhalation' }),
  doseUnit('spray', 'spray', 'sprays'),
  doseUnit('drop', 'gtt', 'gtts', 'drop', 'drops'),
  doseUnit('applicator', 'applicatorful', 'applicatorfuls'),
  doseUnit('mL', 'ml', 'mls', 'mL', 'mL', { ml: 1 }),
  doseUnit('mL', 'milliliter', 'milliliters', undefined, undefined, { ml: 1 }),
  doseUnit('mL', 'tsp', 'tsps', 'teaspoon', 'teaspoons', { ml: 4.92892 }),
  doseUnit('mL', 'tbsp', 'tbsps', 'tablespoon', 'tablespoons', {
    ml: 14.7868,
  }),
  { abbrev: 'mg', perDay: 0, mg: 1 },
  { abbrev: 'milligram', abbrevPlural: 'milligrams', perDay: 0, mg: 1 },
  { abbrev: 'mcg', perDay: 0, mg: 0.001 },
  { abbrev: 'g', perDay: 0, mg: 1000 },
  { abbrev: 'gram', abbrevPlural: 'grams', perDay: 0, mg: 1000 },
  { abbrev: 'unit', abbrevPlural: 'units', perDay: 0, noCalc: true },
  { abbrev: 'meq', perDay: 0, noCalc: true },
];

interface LookupEntry {
  term: SigTerm;
  /** Matched through the abbreviation (so expansion applies) */
  viaAbbrev: boolean;
  /** Matched a plural spelling */
  plural: boolean;
}

type Lookup = Map<string, LookupEntry>;

function buildLookup(terms: SigTerm[]): Lookup {
  const lookup: Lookup = new Map();
  const add = (
    key: string | undefined,
    entry: Omit<LookupEntry, 'term'>,
    term: SigTerm
  ) => {
    if (key) lookup.set(key.toLowerCase(), { term, ...entry });
  };
  // Later entries (host terms) override earlier ones (built-ins); within an
  // entry the abbreviation wins ("ml" → "mL" still expands).
  for (const t of terms) {
    add(t.term, { viaAbbrev: false, plural: false }, t);
    add(t.termPlural, { viaAbbrev: false, plural: true }, t);
    add(t.abbrev, { viaAbbrev: true, plural: false }, t);
    add(t.abbrevPlural, { viaAbbrev: true, plural: true }, t);
  }
  return lookup;
}

const defaultLookup = buildLookup(DEFAULT_SIG_TERMS);
const lookupCache = new WeakMap<SigTerm[], Lookup>();

function lookupFor(terms?: SigTerm[]): Lookup {
  if (!terms || terms.length === 0) return defaultLookup;
  let lookup = lookupCache.get(terms);
  if (!lookup) {
    lookup = buildLookup([...DEFAULT_SIG_TERMS, ...terms]);
    lookupCache.set(terms, lookup);
  }
  return lookup;
}

// =============================================================================
// Recognizers — one phrase (1+ tokens) → what it contributes
// =============================================================================

/** Days per time unit (durations, "x/day", "per week", …). */
const DAY_UNITS = new Map<string, number>([
  ...['sec', 'second', 'seconds'].map((u) => [u, 1 / 86400] as const),
  ...['min', 'minute', 'minutes'].map((u) => [u, 1 / 1440] as const),
  ...['h', 'hr', 'hrs', 'hour', 'hours'].map((u) => [u, 1 / 24] as const),
  ...['d', 'dy', 'day', 'days'].map((u) => [u, 1] as const),
  ...['w', 'wk', 'wks', 'week', 'weeks'].map((u) => [u, 7] as const),
  ...['m', 'mo', 'mon', 'month', 'months'].map((u) => [u, 30] as const),
  ...['y', 'yr', 'yrs', 'year', 'years'].map((u) => [u, 365.2422] as const),
]);

/** Q-term interval units ("q6h", "every 2 days") — `m` is minutes here. */
const Q_UNITS = new Map<string, 'w' | 'd' | 'h' | 'min'>([
  ...['weeks', 'week', 'wks', 'wk', 'w'].map((u) => [u, 'w'] as const),
  ...['days', 'day', 'dys', 'dy', 'd'].map((u) => [u, 'd'] as const),
  ...['hours', 'hour', 'hrs', 'hr', 'h'].map((u) => [u, 'h'] as const),
  ...['minutes', 'minute', 'mins', 'min', 'm'].map((u) => [u, 'min'] as const),
]);

const Q_PER_DAY = {
  w: (n: number) => 1 / (n * 7),
  d: (n: number) => 1 / n,
  h: (n: number) => 24 / n,
  min: (n: number) => 1440 / n,
};
const Q_WORDS = { w: 'week', d: 'day', h: 'hour', min: 'minute' };

const WORD_NUMBERS = new Map(
  [
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
  ].map((w, i) => [w, i + 1] as const)
);
const WORD_FRACTIONS = new Map([
  ['half', 0.5],
  ['a half', 0.5],
  ['one half', 0.5],
  ['quarter', 0.25],
  ['a quarter', 0.25],
  ['one quarter', 0.25],
  ['three quarter', 0.75],
  ['three quarters', 0.75],
]);

/**
 * A dose amount: digits, decimals, fractions ("1/2", "1 1/2"), English words
 * ("one", "one and a half"), a range (upper bound — "1-2" → 2), or a "__"
 * blank still to be filled in.
 */
function parseAmount(s: string): number | 'blank' | null {
  if (/^_{2,}$/.test(s)) return 'blank';
  const range = /^([\d./]{1,9})-([\d./]{1,9})$/.exec(s);
  if (range) {
    const lo = parseAmount(range[1]);
    const hi = parseAmount(range[2]);
    return typeof lo === 'number' && typeof hi === 'number'
      ? Math.max(lo, hi)
      : null;
  }
  if (/^\d{1,6}(?:\.\d{1,4})?$/.test(s)) return Number(s);
  let m = /^(\d{1,4})\/(\d{1,4})$/.exec(s);
  if (m) return Number(m[2]) ? Number(m[1]) / Number(m[2]) : null;
  m = /^(\d{1,3}) (\d{1,2})\/(\d{1,2})$/.exec(s);
  if (m)
    return Number(m[3]) ? Number(m[1]) + Number(m[2]) / Number(m[3]) : null;
  const word = WORD_NUMBERS.get(s) ?? WORD_FRACTIONS.get(s);
  if (word !== undefined) return word;
  m = /^([a-z]{3,5}) and ([a-z ]{4,14})$/.exec(s);
  const whole = m && WORD_NUMBERS.get(m[1]);
  const part = m && WORD_FRACTIONS.get(m[2]);
  return whole && part ? whole + part : null;
}

/** What a recognized phrase contributes. */
interface Hit {
  /** Multiplicative per-day factor (0 = none) */
  perDay: number;
  /** A "__" amount blank */
  blank?: boolean;
  /** Dose unit named */
  unit?: string;
  /** mg per unit for a mass dose (converted through the strength) */
  mg?: number;
  /** Counts as a dosing frequency */
  isFrequency?: boolean;
  /** A time of day ("8am") — times add up rather than multiply */
  timeOfDay?: boolean;
  noCalc?: boolean;
  frequency?: string;
  route?: string;
  prn?: boolean;
  /** Dictionary entry (for expansion) */
  entry?: LookupEntry;
  /** Patient wording for a q-term ("every 6 hours") */
  expansion?: string;
}

const Q_RE =
  /^(q|every )[ .]{0,3}(\d{0,3})(?:-(\d{1,3}))?[ .]{0,3}([a-z]{1,7})$/;

function qTerm(phrase: string): Hit | null {
  const m = Q_RE.exec(phrase);
  const unit = m && Q_UNITS.get(m[4]);
  if (!m || !unit) return null;
  const first = m[2] ? Number(m[2]) : 1;
  // A range ("q4-6h") takes the shorter interval — the most doses.
  const n = m[3] ? Math.min(first, Number(m[3])) : first;
  if (n <= 0) return null;
  const every =
    n === 1 && !m[3]
      ? `every ${Q_WORDS[unit]}`
      : `every ${m[2]}${m[3] ? `-${m[3]}` : ''} ${Q_WORDS[unit]}s`;
  return {
    perDay: Q_PER_DAY[unit](n),
    isFrequency: true,
    frequency:
      n === 1 && unit === 'd'
        ? ONCE
        : n === 1 && unit === 'w'
          ? WEEKLY
          : undefined,
    expansion: m[1] === 'q' ? every : undefined,
  };
}

/** Unit word inside "2 tabs/day" — its unit / mL / mg contribution. */
function unitWord(word: string | undefined, lookup: Lookup): Hit | null {
  const t = word ? lookup.get(word)?.term : undefined;
  if (!t) return null;
  if (t.ml) return { perDay: t.ml, unit: 'mL' };
  return { perDay: 0, unit: t.unit, mg: t.mg, noCalc: t.noCalc };
}

/** Recognize a cleaned (lowercase, trailing punctuation dropped) phrase. */
function matchPhrase(phrase: string, lookup: Lookup): Hit | null {
  // 1. amount
  const amount = parseAmount(phrase);
  if (amount === 'blank') return { perDay: 0, blank: true };
  if (amount !== null) return { perDay: amount };

  // 2. q-term: "q6h", "every 2 days", "q4-6h"
  const q = qTerm(phrase);
  if (q) return q;

  // 3. "3x/day"
  let m = /^(\d{1,3})x\/([a-z]{1,7})$/.exec(phrase);
  const xDays = m && DAY_UNITS.get(m[2]);
  if (m && xDays) return { perDay: Number(m[1]) / xDays, isFrequency: true };

  // 4. "x 5 days" / "for 2 weeks" — a part duration (see partDuration)
  m = /^(?:x|for)\s{0,2}(\d{1,4})\s{0,2}([a-z]{1,7})$/.exec(phrase);
  if (m && DAY_UNITS.has(m[2])) return { perDay: 0 };

  // 5. "2 tabs/day", "5 ml per day"
  m = /^(\S{1,12})(?: (\S{1,15}))? per ([a-z]{1,7})$/.exec(
    phrase.replace(/\//g, ' per ')
  );
  const perAmount = m ? parseAmount(m[1]) : null;
  const perDays = m && DAY_UNITS.get(m[3]);
  if (m && typeof perAmount === 'number' && perDays) {
    const u = unitWord(m[2], lookup);
    return {
      ...u,
      perDay: (perAmount * (u?.perDay || 1)) / perDays,
      isFrequency: true,
    };
  }

  // 6. time of day: "8am", "9:30 pm" (counted, then added up)
  if (/^\d{1,2}(?::\d{2})?\s?(?:am|pm)$/.test(phrase)) {
    return { perDay: 0, timeOfDay: true };
  }

  // 7. weight / BSA dosing ("10 mg/kg") — never calculated
  if (
    /^[\d.]{1,10}\s{0,2}[a-z]{1,10}\s{0,2}\/\s{0,2}(?:kg|lb|m2)(?:\/day)?$/.test(
      phrase
    )
  ) {
    return { perDay: 0, noCalc: true };
  }

  // 8. dictionary
  const entry = lookup.get(phrase);
  if (!entry) return null;
  const t = entry.term;
  return {
    perDay: t.ml ?? t.perDay,
    unit: t.ml ? 'mL' : t.unit,
    mg: t.mg,
    noCalc: t.noCalc,
    isFrequency: t.perDay > 0,
    frequency: t.frequency,
    route: t.route,
    prn: t.prn,
    entry,
  };
}

// =============================================================================
// Scanning — longest phrase first, left to right
// =============================================================================

/** Longest phrase tried at each position (real phrases are ≤ 4 words). */
const MAX_PHRASE_TOKENS = 6;

interface Span<T> {
  start: number;
  end: number;
  hit: T | null;
}

const clean = (phrase: string) =>
  phrase
    .toLowerCase()
    .replace(/^\(/, '')
    .replace(/[.,;:!?)]+$/, '');

function scan<T>(
  tokens: string[],
  match: (phrase: string) => T | null
): Span<T>[] {
  const spans: Span<T>[] = [];
  for (let i = 0; i < tokens.length; ) {
    let span: Span<T> = { start: i, end: i, hit: null };
    const last = Math.min(tokens.length, i + MAX_PHRASE_TOKENS) - 1;
    for (let j = last; j >= i; j--) {
      const hit = match(clean(tokens.slice(i, j + 1).join(' ')));
      if (hit) {
        span = { start: i, end: j, hit };
        break;
      }
    }
    spans.push(span);
    i = span.end + 1;
  }
  return spans;
}

const tokenize = (text: string) => text.trim().split(/\s+/).filter(Boolean);

// =============================================================================
// expandSig / parseSig
// =============================================================================

/**
 * Expand practitioner shorthand into patient directions,
 * e.g. "1 tab po bid with food" → "Take 1 tablet by mouth twice a day with food."
 */
export function expandSig(shorthand: string, terms?: SigTerm[]): string {
  const tokens = tokenize(shorthand);
  if (tokens.length === 0) return '';
  const lookup = lookupFor(terms);

  const words: string[] = [];
  const spans = scan(tokens, (phrase) => {
    const entry = lookup.get(phrase);
    const t = entry?.term;
    if (entry?.viaAbbrev && t?.term && t.term !== phrase) {
      return {
        text: t.term,
        pluralText: t.termPlural ?? t.term,
        plural: entry.plural,
        unit: true,
      };
    }
    const q = entry ? null : qTerm(phrase);
    return q?.expansion
      ? { text: q.expansion, plural: false, unit: false }
      : null;
  });
  for (const { start, end, hit } of spans) {
    const raw = tokens.slice(start, end + 1).join(' ');
    if (!hit) {
      words.push(raw);
      continue;
    }
    let plural = hit.plural;
    if (hit.unit) {
      // the amount before a unit decides its number: "2 tab" → "2 tablets"
      const amount =
        (start >= 2 &&
          parseAmount(clean(`${tokens[start - 2]} ${tokens[start - 1]}`))) ||
        (start >= 1 ? parseAmount(clean(tokens[start - 1])) : null);
      if (amount === 'blank') plural = true;
      else if (typeof amount === 'number') plural = amount > 1;
    }
    const trailing = /[.,;:!?)]+$/.exec(raw)?.[0] ?? '';
    words.push(
      (plural && 'pluralText' in hit ? hit.pluralText : hit.text) + trailing
    );
  }

  let text = words.join(' ');
  // a leading amount (or a "__" blank to fill in) means "take"
  if (/^(\d|__)/.test(text)) text = `Take ${text}`;
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/** Ties go to the earlier name: specific before general. */
const ROUTE_PRIORITY = [
  'oral',
  'sublingual',
  'subcutaneous',
  'intramuscular',
  'intravenous',
  'inhalation',
  'ophthalmic',
  'otic',
  'nasal',
  'rectal',
  'vaginal',
  'topical',
];
const FREQUENCY_PRIORITY = [
  'Every other day',
  TWICE,
  THREE,
  FOUR,
  'Every morning',
  BEDTIME,
  'Every evening',
  WEEKLY,
  ONCE,
];

/** The highest-priority name (unlisted names — host terms — rank last). */
function pick(names: string[], priority: string[]): string | undefined {
  const rank = (n: string) => {
    const i = priority.indexOf(n);
    return i === -1 ? priority.length : i;
  };
  return names.reduce<string | undefined>(
    (best, n) => (best === undefined || rank(n) < rank(best) ? n : best),
    undefined
  );
}

/**
 * Derive route / frequency / PRN from free-text sig,
 * e.g. "1 tablet by mouth daily as needed" →
 * { route: 'oral', frequency: 'Once daily', prn: true }.
 */
export function parseSig(
  sig: string,
  terms?: SigTerm[]
): { route?: string; frequency?: string; prn: boolean } {
  const lookup = lookupFor(terms);
  const hits = scan(tokenize(sig), (p) => matchPhrase(p, lookup))
    .map((s) => s.hit)
    .filter((h): h is Hit => h !== null);
  return {
    route: pick(
      hits.flatMap((h) => h.route ?? []),
      ROUTE_PRIORITY
    ),
    frequency: pick(
      hits.flatMap((h) => h.frequency ?? []),
      FREQUENCY_PRIORITY
    ),
    prn: hits.some((h) => h.prn),
  };
}

// =============================================================================
// Dose forms — the sig dose a preset gets, and what quantity counts
// =============================================================================

const EYE = /\b(ophthalmic|eye)\b/;
const EAR = /\b(otic|ear)\b/;
const SEMISOLID = /\b(cream|ointment|gel|lotion|foam|shampoo)\b/;

interface DoseFormRule {
  matches: (form: string) => boolean;
  /** Practitioner-sig dose + route ("__" = amount the prescriber fills in) */
  sig: string;
  /** Unit quantity is counted in; omitted = quantity isn't calculated */
  unit?: string;
}

/**
 * Checked in order on the full (lowercased) dose form. Route words come
 * first so "ophthalmic solution" never reads "by mouth".
 */
const DOSE_FORM_RULES: DoseFormRule[] = [
  {
    matches: (f) => EYE.test(f) && SEMISOLID.test(f),
    sig: 'apply __ in __ eye',
  },
  { matches: (f) => EYE.test(f), sig: 'instill __ gtts in __ eye' },
  { matches: (f) => EAR.test(f), sig: 'instill __ gtts in __ ear' },
  {
    matches: (f) => /\b(nasal|nose)\b/.test(f),
    sig: 'use __ sprays in each nostril',
  },
  {
    matches: (f) =>
      /nebuli/.test(f) || (/inhal/.test(f) && /solution|suspension/.test(f)),
    sig: 'inhale __ ml via nebulizer',
  },
  { matches: (f) => /inhal/.test(f), sig: 'inhale 2 puffs' },
  { matches: (f) => /inject|intravenous/.test(f), sig: 'inject __ ml' },
  { matches: (f) => /vaginal/.test(f), sig: 'insert __ vaginally' },
  {
    matches: (f) => /suppositor/.test(f),
    sig: 'insert 1 supp pr',
    unit: 'suppository',
  },
  { matches: (f) => /rectal/.test(f), sig: 'insert __ pr' },
  {
    matches: (f) => /patch|transdermal/.test(f),
    sig: 'apply 1 patch',
    unit: 'patch',
  },
  { matches: (f) => /\bfilm\b/.test(f), sig: 'dissolve 1 film', unit: 'film' },
  {
    matches: (f) => /sublingual/.test(f) && /tablet/.test(f),
    sig: 'place 1 tab sl',
    unit: 'tablet',
  },
  { matches: (f) => /tablet|caplet/.test(f), sig: '1 tab po', unit: 'tablet' },
  {
    matches: (f) => /capsule|softgel|gelcap/.test(f),
    sig: '1 cap po',
    unit: 'capsule',
  },
  {
    matches: (f) => /lozenge|troche/.test(f),
    sig: 'dissolve 1 lozenge po',
    unit: 'lozenge',
  },
  {
    matches: (f) => /topical/.test(f) || SEMISOLID.test(f),
    sig: 'apply topically',
  },
  {
    matches: (f) => /oral|syrup|elixir/.test(f) && !/powder|spray|drop/.test(f),
    sig: '__ ml po',
    unit: 'mL',
  },
];

function doseFormRule(doseForm?: string): DoseFormRule | undefined {
  const form = doseForm?.toLowerCase().trim();
  return form ? DOSE_FORM_RULES.find((r) => r.matches(form)) : undefined;
}

/** The dose + route shorthand a dose form implies ('' when unknown). */
export function sigDoseFor(doseForm?: string): string {
  return doseFormRule(doseForm)?.sig ?? '';
}

// =============================================================================
// Quantity calculation
// =============================================================================

/**
 * Days in a days-supply text: a bare number ("30"), or units summed —
 * "2w" = 14, "1m 2w" = 44 (m = month = 30 days, y = 365). 0 when none.
 */
export function parseDurationDays(text: string): number {
  const s = text.trim().toLowerCase();
  if (/^\d{1,5}$/.test(s)) return Number(s);
  const perUnit: Record<string, number> = { d: 1, w: 7, m: 30, y: 365 };
  let days = 0;
  for (const m of s.matchAll(/(\d{1,5})\s{0,2}([dwmy])/g)) {
    days += Number(m[1]) * perUnit[m[2]];
  }
  return days;
}

/** Why a quantity couldn't be calculated. */
export type QuantityCalcFailure =
  /** The dose form isn't one quantity is counted for (cream, inhaler, …) */
  | 'form'
  /** The sig still has "__" amounts to fill in */
  | 'blank'
  /** The sig (or days supply) couldn't be understood */
  | 'unparsed';

export type QuantityCalcResult =
  | { quantity: number; unit: string }
  | { reason: QuantityCalcFailure };

export interface QuantityCalcInput {
  /** Directions; parts separated by ";" ("2 tabs bid x 5 days; then 1 tab daily") */
  sig: string;
  /** Days supply */
  days: number;
  /** Product dose form, e.g. 'tablet', 'oral suspension' */
  doseForm?: string;
  /** Product strength, e.g. '250 mg' — converts mass doses ("500 mg") */
  strength?: string;
  /** Extra dictionary terms */
  terms?: SigTerm[];
}

interface FormContext {
  unit: string;
  strengthMg?: number;
}

const MASS_TO_MG: Record<string, number> = { mg: 1, mcg: 0.001, g: 1000 };

function strengthToMg(strength?: string): number | undefined {
  const m = /^(\d{1,7}(?:\.\d{1,4})?)\s{0,2}(mg|mcg|g)$/i.exec(
    strength?.trim() ?? ''
  );
  return m ? Number(m[1]) * MASS_TO_MG[m[2].toLowerCase()] : undefined;
}

/** Units per day for one sig part, or why it can't be counted. */
function partPerDay(
  part: string,
  lookup: Lookup,
  form: FormContext
): { perDay: number } | { reason: QuantityCalcFailure } {
  const unparsed = { reason: 'unparsed' as const };
  let product = 0;
  let times = 0;
  let dose = false;
  let frequency = false;
  const units = new Set<string>();

  for (const { hit } of scan(tokenize(part), (p) => matchPhrase(p, lookup))) {
    if (!hit) continue;
    if (hit.blank) return { reason: 'blank' };
    if (hit.noCalc) return unparsed;
    if (hit.timeOfDay) {
      times += 1;
      frequency = true;
      continue;
    }
    let factor = hit.perDay;
    if (hit.mg) {
      // "500 mg" of a 250 mg tablet = 2 tablets; liquids and combination
      // strengths can't be converted
      if (form.unit === 'mL' || !form.strengthMg) return unparsed;
      factor = (factor || 1) * (hit.mg / form.strengthMg);
      units.add(form.unit);
      dose = true;
    }
    if (hit.unit) {
      units.add(hit.unit);
      dose = true;
    }
    if (hit.isFrequency) frequency = true;
    if (factor > 0) product = (product || 1) * factor;
  }
  if (times > 0) product = (product || 1) * times;

  // A bare number isn't a dose ("take if weight over 149 pounds")
  if (!dose && !frequency) return unparsed;
  // The dose unit must be what the product is counted in; liquids need an
  // explicit mL / tsp amount
  for (const u of units) if (u !== form.unit) return unparsed;
  if (units.size === 0 && form.unit === 'mL') return unparsed;
  return product > 0 ? { perDay: product } : unparsed;
}

const PART_DURATION_RE =
  /(?:^|\s)(?:x|for)\s{0,2}(\d{1,4})\s{0,2}([a-z]{1,7})$/;

/** Days a part states ("x 5 days"); 0 = unstated, -1 = "then …" remainder. */
function partDuration(part: string, last: boolean): number {
  const s = clean(part.trim());
  if (last && /^then\b/.test(s)) return -1;
  const m = PART_DURATION_RE.exec(s);
  const unitDays = m && DAY_UNITS.get(m[2]);
  return m && unitDays ? Number(m[1]) * unitDays : 0;
}

/**
 * Dispense quantity = Σ over ";"-separated sig parts of units/day × the days
 * each part covers ("x 5 days"; "then …" takes the rest; a part without a
 * duration runs for the whole supply — concurrent doses). Rounded up to a
 * whole unit.
 *
 * Calculated only for dose forms counted in a unit (tablets, capsules, …,
 * or mL for oral liquids with an mL / tsp dose).
 */
export function calculateQuantity({
  sig,
  days,
  doseForm,
  strength,
  terms,
}: QuantityCalcInput): QuantityCalcResult {
  const unit = doseFormRule(doseForm)?.unit;
  if (!unit) return { reason: 'form' };
  const parts = sig
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);
  if (!(days > 0) || parts.length === 0) return { reason: 'unparsed' };

  const lookup = lookupFor(terms);
  const form = { unit, strengthMg: strengthToMg(strength) };
  let total = 0;
  let remaining = days;
  for (const [i, part] of parts.entries()) {
    const result = partPerDay(part, lookup, form);
    if ('reason' in result) return result;
    const partDays = partDuration(part, i === parts.length - 1);
    if (partDays === 0) {
      total += result.perDay * days;
    } else if (partDays > 0) {
      const covered = Math.min(partDays, remaining);
      total += result.perDay * covered;
      remaining -= covered;
    } else {
      total += result.perDay * remaining;
    }
  }
  // round up — a partial tablet or mL is still dispensed (tolerate float noise)
  const quantity = Math.ceil(total - 1e-9);
  return quantity > 0 ? { quantity, unit } : { reason: 'unparsed' };
}
