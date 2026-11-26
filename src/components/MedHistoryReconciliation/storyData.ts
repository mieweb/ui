/**
 * Shared fixtures for MedHistoryReconciliation stories and tests. Incoming
 * records mirror the NCPDP RxHistory sample (test patient, synthetic data);
 * chart records are synthetic. FDB medids and drug ids are placeholders.
 */

import type { MedHistoryRecord } from './types';

const brooklyn = {
  ncpdpid: '4222154',
  npi: '1235468844',
  name: 'Brooklyn @ Gates Pharmacy',
};
const shollenberger = {
  ncpdpid: '1655458',
  npi: '1972468322',
  name: 'Shollenberger Pharmacy',
};
const mcTavish = {
  npi: '2888888882',
  dea: 'BM3214549',
  firstName: 'Tarquin',
  lastName: 'McTavish',
};
const waterford = {
  npi: '1999999786',
  firstName: 'Fielding',
  lastName: 'Waterford-Fielding',
};
const brooklynSource = {
  label: 'Brooklyn @ Gates',
  kind: 'pharmacy' as const,
  messageRef: 'escript-1001',
};
const shollenbergerSource = {
  label: 'Shollenberger',
  kind: 'pharmacy' as const,
  messageRef: 'escript-1001',
};

function lancetFill(id: string, date: string): MedHistoryRecord {
  return {
    id,
    medication: {
      id,
      name: 'FreeStyle 28G lancets',
      quantity: '100',
      quantityUnit: 'each',
      startDate: date,
      substitution: '0',
      prescriber: 'Waterford-Fielding, Fielding',
    },
    codes: [{ system: 'NDC', code: '99073013001' }],
    dispensedDate: date,
    pharmacy: shollenberger,
    prescriber: waterford,
    sourceKey: `1655458|99073013001|${date}`,
    source: shollenbergerSource,
    warnings: [{ code: 'ndc-unknown' }],
  };
}

/** Incoming RxHistory records (Source A). */
export const incomingHistory: MedHistoryRecord[] = [
  {
    id: 'rxh-sprycel',
    medication: {
      id: 'rxh-sprycel',
      name: 'Sprycel 70 mg tablet',
      strength: '70 mg',
      doseForm: 'tablet',
      quantity: '60',
      quantityUnit: 'tablet',
      daysSupply: '60',
      startDate: '2026-05-07',
      patientSig: 'Take 1 tablet by mouth 1 (one) time each day.',
      substitution: '1',
      indication:
        'Chronic myelogenous leukemia, Philadelphia chromosome (Ph1) positive',
      pharmacyId: '4222154',
      prescriber: 'McTavish, Tarquin',
    },
    codes: [
      { system: 'NDC', code: '00003052411' },
      { system: 'RxNORM', code: '643177', display: 'SBD' },
      { system: 'FDB', code: '600001' },
    ],
    drugId: 'drug-dasatinib',
    dispensedDate: '2026-05-07',
    refillsRemaining: '1',
    pharmacy: brooklyn,
    prescriber: mcTavish,
    sourceKey: '4222154|PA-5434|2026-05-07',
    source: brooklynSource,
  },
  {
    id: 'rxh-methylpred',
    medication: {
      id: 'rxh-methylpred',
      name: 'methylPREDNISolone 4 MG DOSEPAK',
      strength: '4 mg',
      doseForm: 'tablet',
      quantity: '21',
      quantityUnit: 'tablet',
      daysSupply: '21',
      startDate: '2026-04-23',
      substitution: '0',
      prescriber: 'McTavish, Tarquin',
    },
    codes: [
      { system: 'NDC', code: '59762444002' },
      { system: 'RxNORM', code: '762675', display: 'GPK' },
      { system: 'FDB', code: '600002' },
    ],
    drugId: 'drug-methylprednisolone',
    dispensedDate: '2026-04-23',
    refillsRemaining: '0',
    pharmacy: brooklyn,
    prescriber: mcTavish,
    sourceKey: '4222154|PA-5398|2026-04-23',
    source: brooklynSource,
  },
  {
    id: 'rxh-syringe',
    medication: {
      id: 'rxh-syringe',
      name: 'BD 3mL syringe 25G x 1',
      quantity: '30',
      quantityUnit: 'each',
      startDate: '2026-04-12',
      substitution: '0',
      prescriber: 'McTavish, Tarquin',
    },
    dispensedDate: '2026-04-12',
    pharmacy: brooklyn,
    prescriber: mcTavish,
    sourceKey: '4222154|PA-5388|2026-04-12',
    source: brooklynSource,
    warnings: [{ code: 'ndc-missing' }],
  },
  {
    id: 'rxh-dexamethasone',
    medication: {
      id: 'rxh-dexamethasone',
      name: 'dexamethasone 4 mg/ml vial',
      strength: '4 mg/ml',
      doseForm: 'solution',
      quantity: '30',
      quantityUnit: 'milliliter',
      daysSupply: '90',
      startDate: '2026-04-12',
      patientSig: 'Inject 1.8 mg under the skin once daily',
      substitution: '0',
      prescriber: 'McTavish, Tarquin',
    },
    codes: [
      { system: 'NDC', code: '00641614501' },
      { system: 'RxNORM', code: '1116927', display: 'SCD' },
      { system: 'FDB', code: '600003' },
    ],
    drugId: 'drug-dexamethasone',
    dispensedDate: '2026-04-12',
    refillsRemaining: '0',
    pharmacy: brooklyn,
    prescriber: mcTavish,
    sourceKey: '4222154|PA-5387|2026-04-12',
    source: brooklynSource,
  },
  lancetFill('rxh-lancets-3', '2026-04-02'),
  {
    id: 'rxh-doxycycline',
    medication: {
      id: 'rxh-doxycycline',
      name: 'doxycycline hyclate 100 mg capsule',
      strength: '100 mg',
      doseForm: 'capsule',
      quantity: '20',
      quantityUnit: 'capsule',
      daysSupply: '10',
      startDate: '2026-03-02',
      patientSig: 'Take 1 capsule by mouth every 12 hours',
      substitution: '0',
      prescriber: 'Waterford-Fielding, Fielding',
    },
    codes: [
      { system: 'NDC', code: '00143314250' },
      { system: 'RxNORM', code: '1649988', display: 'SCD' },
      { system: 'FDB', code: '600004' },
    ],
    drugId: 'drug-doxycycline',
    dispensedDate: '2026-03-02',
    refillsRemaining: '0',
    pharmacy: shollenberger,
    prescriber: waterford,
    sourceKey: '1655458|PA-5369|2026-03-02',
    source: shollenbergerSource,
  },
  {
    id: 'rxh-tobradex',
    medication: {
      id: 'rxh-tobradex',
      name: 'Tobramycin and Dexamethasone Ophthalmic Suspension',
      doseForm: 'suspension',
      quantity: '10',
      quantityUnit: 'milliliter',
      daysSupply: '7',
      startDate: '2026-02-03',
      patientSig:
        'Instill two drops into the conjunctival sac every six hours for 7 days',
      substitution: '0',
      prescriber: 'Waterford-Fielding, Fielding',
    },
    codes: [
      { system: 'NDC', code: '24208029510' },
      { system: 'RxNORM', code: '309683', display: 'SCD' },
      { system: 'FDB', code: '600005' },
    ],
    drugId: 'drug-tobramycin-dexamethasone',
    dispensedDate: '2026-02-03',
    refillsRemaining: '0',
    pharmacy: shollenberger,
    prescriber: waterford,
    sourceKey: '1655458|PA-5358|2026-02-03',
    source: shollenbergerSource,
  },
  lancetFill('rxh-lancets-2', '2025-12-23'),
  lancetFill('rxh-lancets-1', '2025-09-19'),
];

/** The patient's current chart medications (Source B). */
export const chartHistory: MedHistoryRecord[] = [
  {
    id: 'chart-dasatinib',
    medication: {
      id: 'chart-dasatinib',
      name: 'dasatinib 70 mg tablet',
      status: 'taking',
      strength: '70 mg',
      doseForm: 'tablet',
      quantity: '60',
      quantityUnit: 'tablet',
      startDate: '2026-05-07',
      patientSig: 'Take 1 tablet by mouth once daily',
      pharmacyId: '4222154',
      prescriber: 'McTavish, Tarquin',
    },
    codes: [{ system: 'FDB', code: '600101' }],
    drugId: 'drug-dasatinib',
    prescriber: mcTavish,
  },
  {
    id: 'chart-methylpred',
    medication: {
      id: 'chart-methylpred',
      name: 'methylprednisolone 4 mg dose pack',
      status: 'unreconciled',
      strength: '4 mg',
      doseForm: 'tablet',
      quantity: '21',
      quantityUnit: 'tablet',
      startDate: '2026-04-23',
      pharmacyId: '4222154',
      prescriber: 'McTavish, Tarquin',
    },
  },
  {
    id: 'chart-doxycycline-old',
    medication: {
      id: 'chart-doxycycline-old',
      name: 'doxycycline hyclate 100 mg capsule',
      status: 'not-taking',
      strength: '100 mg',
      doseForm: 'capsule',
      quantity: '20',
      quantityUnit: 'capsule',
      startDate: '2025-06-01',
      patientSig: 'Take 1 capsule by mouth every 12 hours',
      pharmacyId: '1655458',
      prescriber: 'Waterford-Fielding, Fielding',
    },
    codes: [{ system: 'FDB', code: '600004' }],
    drugId: 'drug-doxycycline',
    prescriber: waterford,
  },
  {
    id: 'chart-lisinopril',
    medication: {
      id: 'chart-lisinopril',
      name: 'lisinopril 10 mg tablet',
      status: 'taking',
      strength: '10 mg',
      doseForm: 'tablet',
      startDate: '2025-01-15',
      patientSig: 'Take 1 tablet by mouth once daily',
    },
    codes: [{ system: 'FDB', code: '600201' }],
    drugId: 'drug-lisinopril',
  },
];
