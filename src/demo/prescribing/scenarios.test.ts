import { describe, expect, it } from 'vitest';
import { createHarness } from './testSupport';
import type { EvaluationRecord } from '../../prescribing/api/contracts';
import { checkDosing, checkInteractions, checkPregnancy } from './providers';
import type { ProviderSnapshot } from './providers';
import { getScenario, prescribingScenarios } from './scenarios';
import { makeContext, makeProducts, known } from './fixtures';

const etag = (id: string, revision: string) => `"${id}:${revision}"`;
async function requestPa(
  h: ReturnType<typeof createHarness>,
  evaluation: EvaluationRecord
) {
  if (evaluation.subject.kind !== 'saved') throw new Error('saved required');
  const record = (
    await h.client.createPriorAuthorization(
      {
        prescription: evaluation.subject.prescription,
        evaluationId: evaluation.id,
        benefitType: 'pharmacy',
        reasonCode: 'synthetic-benefit-requirement',
      },
      h.key()
    )
  ).body.data;
  const ready = (
    await h.client.saveAnswers(
      record.id,
      {
        questionnaireId: record.questionnaire.id,
        questionnaireVersion: record.questionnaire.version,
        answers: [
          { linkId: 'indication', value: 'Synthetic indication' },
          { linkId: 'tried-alternative', value: false },
        ],
      },
      { ...h.key(), ifMatch: etag(record.id, record.revision) }
    )
  ).body.data;
  await h.client.submitPriorAuthorization(
    record.id,
    {
      caseRevision: ready.revision,
      questionnaireVersion: ready.questionnaire.version,
      submissionKind: 'initial',
    },
    h.key()
  );
  return record;
}
function providerSnapshot(scenarioId = 'complete-demo'): ProviderSnapshot {
  const scenario = getScenario(scenarioId);
  const now = '2026-10-03T12:00:00.000Z';
  const h = createHarness({ scenarioId });
  return {
    draft: h.service.controller.draft(),
    product:
      makeProducts(now).find((product) => product.id === scenario.product) ??
      null,
    context: makeContext(scenario, now),
    related: [],
    scenario,
    now,
  };
}

describe('named synthetic scenario coverage', () => {
  it('validates all questionnaire answer types, calendar dates and conjunction conditions while allowing partial saves', async () => {
    const h = createHarness({ scenarioId: 'pa-approved' });
    const { evaluation } = await h.createAndEvaluate();
    if (evaluation.subject.kind !== 'saved') throw new Error('saved required');
    let pa = (
      await h.client.createPriorAuthorization(
        {
          prescription: evaluation.subject.prescription,
          evaluationId: evaluation.id,
          benefitType: 'pharmacy',
          reasonCode: 'simulation',
        },
        h.key()
      )
    ).body.data;
    const save = async (
      answers: import('../../prescribing/api/contracts').QuestionnaireAnswer[]
    ) => {
      pa = (
        await h.client.saveAnswers(
          pa.id,
          {
            questionnaireId: pa.questionnaire.id,
            questionnaireVersion: pa.questionnaire.version,
            answers,
          },
          { ...h.key(), ifMatch: etag(pa.id, pa.revision) }
        )
      ).body.data;
      return pa;
    };
    const invalid = await save([
      { linkId: 'indication', value: true },
      { linkId: 'tried-alternative', value: 'false' },
      { linkId: 'visit-date', value: '2026-99-99' },
      { linkId: 'severity', value: 'not-an-option' },
      { linkId: 'days', value: 1.5 },
      { linkId: 'measurement', value: '1.5' },
      { linkId: 'unknown', value: 'x' },
      { linkId: 'days', value: 3 },
    ]);
    expect(invalid.state).toBe('questionnaire-needed');
    expect(
      new Set(invalid.answerIssues.map((issue) => issue.fieldPath))
    ).toEqual(
      new Set([
        'indication',
        'tried-alternative',
        'visit-date',
        'severity',
        'days',
        'measurement',
        'unknown',
      ])
    );
    const base = [
      { linkId: 'indication', value: 'Synthetic indication' },
      { linkId: 'tried-alternative', value: false },
      { linkId: 'visit-date', value: '2026-10-03' },
      { linkId: 'severity', value: 'severe' },
      { linkId: 'days', value: 3 },
      { linkId: 'measurement', value: 1.5 },
    ];
    expect((await save(base)).state).toBe('ready-to-submit');
    const conditional = base.map((answer) =>
      answer.linkId === 'tried-alternative'
        ? { ...answer, value: true }
        : answer
    );
    const missing = await save(conditional);
    expect(missing.answerIssues.map((issue) => issue.fieldPath)).toEqual([
      'alternative-reason',
      'severe-alternative-note',
    ]);
    expect(
      (
        await save([
          ...conditional,
          { linkId: 'alternative-reason', value: 'Invented reason' },
          {
            linkId: 'severe-alternative-note',
            value: 'Invented severe reason',
          },
        ])
      ).state
    ).toBe('ready-to-submit');
  });
  it.each(prescribingScenarios.filter((scenario) => !scenario.readOnly))(
    'evaluates $id with serializable synthetic domain results',
    async (scenario) => {
      const h = createHarness({ scenarioId: scenario.id });
      const { evaluation } = await h.createAndEvaluate();
      expect(JSON.parse(JSON.stringify(evaluation))).toEqual(evaluation);
      for (const result of Object.values(evaluation.checks))
        for (const evidence of result?.evidence ?? []) {
          expect(evidence.synthetic).toBe(true);
          expect(evidence.referenceUrl).toMatch(/^urn:mieweb:simulation:/);
        }
      if (scenario.id === 'lasix-draft')
        expect(evaluation.validation.dataState).toBe('incomplete');
      if (scenario.interaction)
        expect(evaluation.checks.interactions?.findings.length).toBeGreaterThan(
          0
        );
      if (scenario.pregnancy === 'precaution')
        expect(evaluation.checks.pregnancy?.findings.length).toBeGreaterThan(0);
      if (scenario.pregnancy === 'unknown')
        expect(evaluation.checks.pregnancy?.outcome).toBe('unknown');
      if (scenario.unavailable)
        expect(
          evaluation.checks[
            scenario.unavailable as keyof typeof evaluation.checks
          ]?.status
        ).toBe('unavailable');
    }
  );
  it.each(['ambiguous', 'partial', 'stale', 'unavailable'])(
    'preserves PDMP %s without a reviewable report',
    async (variant) => {
      const h = createHarness({
        scenarioId: 'pdmp-ambiguous-or-outage',
        variant,
      });
      const { prescription, evaluation } = await h.createAndEvaluate();
      const query = (
        await h.client.createPdmpQuery(
          {
            patientId: prescription.patientId,
            prescriberId: prescription.prescriberId,
            jurisdictions:
              variant === 'partial' ? ['SIM', 'SIM-NEIGHBOR'] : ['SIM'],
            purposeCode: 'treatment',
            attestation: true,
          },
          h.key()
        )
      ).body.data;
      h.service.controller.runPendingJobs();
      const report = (await h.client.getPdmpQuery(query.id)).body.data;
      if (variant === 'ambiguous') expect(report.match).toBe('ambiguous');
      else if (variant !== 'stale') expect(report.state).toBe(variant);
      await expect(
        h.client.reviewPdmpQuery(
          query.id,
          {
            reviewedReportRevision: report.reportRevision ?? '1',
            purposeCode: 'treatment',
          },
          { ...h.key(), ifMatch: etag(query.id, report.revision) }
        )
      ).rejects.toMatchObject({ problem: { status: 422 } });
      const current = await h.currentEvaluation(evaluation.id);
      await h.client.updateWorkflowContext(
        evaluation.id,
        { pdmpQueryId: query.id, priorAuthorizationId: null },
        { ...h.key(), ifMatch: etag(evaluation.id, current.revision) }
      );
      expect((await h.currentEvaluation(evaluation.id)).gates.sign.state).toBe(
        'unknown'
      );
    }
  );
  it.each([
    'interactions',
    'pregnancy',
    'dosing',
    'formulary',
    'benefit',
    'pdmp',
  ])('preserves provider outage for %s', async (variant) => {
    const h = createHarness({ scenarioId: 'provider-unavailable', variant });
    const { evaluation, prescription } = await h.createAndEvaluate();
    if (variant === 'pdmp') {
      const query = (
        await h.client.createPdmpQuery(
          {
            patientId: prescription.patientId,
            prescriberId: prescription.prescriberId,
            jurisdictions: ['SIM'],
            purposeCode: 'treatment',
            attestation: true,
          },
          h.key()
        )
      ).body.data;
      h.service.controller.runPendingJobs();
      expect((await h.client.getPdmpQuery(query.id)).body.data.state).toBe(
        'unavailable'
      );
    } else
      expect(
        evaluation.checks[variant as keyof typeof evaluation.checks]?.status
      ).toBe('unavailable');
    expect(evaluation.gates.transmit.state).not.toBe('pass');
  });
  it.each(['restricted', 'nonpreferred', 'unsupported', 'inactive'])(
    'keeps plan and member benefit scope distinct for %s',
    async (variant) => {
      const h = createHarness({
        scenarioId: 'covered-versus-benefit',
        variant,
      });
      const { evaluation } = await h.createAndEvaluate();
      if (variant === 'restricted') {
        expect(evaluation.checks.formulary?.data).toMatchObject({
          coverage: 'covered',
        });
        expect(evaluation.checks.benefit?.data).toMatchObject({
          coverage: 'not-covered',
          patientCostEstimate: null,
        });
      }
      if (variant === 'nonpreferred')
        expect(evaluation.checks.benefit?.data).toMatchObject({
          patientCostEstimate: { amount: '35.00' },
        });
      if (['unsupported', 'inactive'].includes(variant))
        expect(evaluation.checks.benefit?.status).toBe('partial');
    }
  );
  it.each(['denied', 'more-info'])(
    'supports PA %s and preserves form/answer history',
    async (variant) => {
      const h = createHarness({ scenarioId: 'pa-denied-more-info', variant });
      const { evaluation } = await h.createAndEvaluate();
      const initial = await requestPa(h, evaluation);
      h.service.controller.runPendingJobs();
      let pa = (await h.client.getPriorAuthorization(initial.id)).body.data;
      expect(pa.state).toBe(
        variant === 'denied' ? 'denied' : 'more-information-needed'
      );
      if (variant === 'denied') {
        expect(pa.decision?.reasons.length).toBeGreaterThan(0);
        await expect(
          h.client.submitPriorAuthorization(
            pa.id,
            {
              caseRevision: pa.revision,
              questionnaireVersion: pa.questionnaire.version,
              submissionKind: 'appeal',
            },
            h.key()
          )
        ).rejects.toMatchObject({ problem: { code: 'APPEAL_UNSUPPORTED' } });
      } else {
        expect(pa.questionnaire.version).toBe('2');
        const form = (await h.client.getQuestionnaire(pa.id)).body.data;
        expect(
          form.items.some((item) => item.linkId === 'additional-note')
        ).toBe(true);
        pa = (
          await h.client.saveAnswers(
            pa.id,
            {
              questionnaireId: form.id,
              questionnaireVersion: form.version,
              answers: [
                ...pa.answers,
                {
                  linkId: 'additional-note',
                  value: 'Invented additional information',
                },
              ],
            },
            { ...h.key(), ifMatch: etag(pa.id, pa.revision) }
          )
        ).body.data;
        await h.client.submitPriorAuthorization(
          pa.id,
          {
            caseRevision: pa.revision,
            questionnaireVersion: form.version,
            submissionKind: 'additional-information',
          },
          h.key()
        );
        h.service.controller.runPendingJobs();
        expect(
          (await h.client.getPriorAuthorization(pa.id)).body.data.state
        ).toBe('approved');
        expect(
          h.service.controller.snapshot().records.submissions
        ).toHaveLength(2);
      }
    }
  );
  it('permits transmission while PA remains pending only under the no-hold policy', async () => {
    const h = createHarness({ scenarioId: 'pa-pending-send-allowed' });
    const { evaluation } = await h.createAndEvaluate();
    const pa = await requestPa(h, evaluation);
    h.service.controller.runPendingJobs();
    expect((await h.client.getPriorAuthorization(pa.id)).body.data.state).toBe(
      'pending'
    );
    const current = await h.currentEvaluation(evaluation.id);
    await h.client.updateWorkflowContext(
      evaluation.id,
      { pdmpQueryId: null, priorAuthorizationId: pa.id },
      { ...h.key(), ifMatch: etag(evaluation.id, current.revision) }
    );
    const signed = await h.sign(await h.currentEvaluation(evaluation.id));
    expect(signed.evaluation.gates.transmit.state).toBe('pass');
    expect((await h.send(signed.evaluation, signed.artifactId)).status).toBe(
      202
    );
  });
  it.each(['declined', 'expired'])(
    'creates no signing artifact when challenge is %s',
    async (variant) => {
      const h = createHarness({
        scenarioId: 'signing-declined-expired',
        variant,
      });
      const { prescription, evaluation } = await h.createAndEvaluate();
      const review = (
        await h.client.createReview(
          {
            patientId: prescription.patientId,
            selections: [
              {
                prescription: { id: prescription.id, revision: '1' },
                evaluationId: evaluation.id,
                readyToSign: true,
              },
            ],
          },
          h.key()
        )
      ).body.data;
      const signing = (
        await h.client.createSigningSession(
          { reviewId: review.id, reviewRevision: review.revision },
          h.key()
        )
      ).body.data;
      if (variant === 'expired') h.service.controller.advanceTime(300000);
      const current = (await h.client.getSigningSession(signing.id)).body.data;
      const reference = h.service.controller.completeSimulatedChallenge(
        signing.id
      );
      if (variant === 'declined')
        expect(
          (
            await h.client.completeSigningSession(
              signing.id,
              {
                sessionRevision: current.revision,
                completionReference: reference,
              },
              h.key()
            )
          ).body.data.state
        ).toBe('declined');
      else
        await expect(
          h.client.completeSigningSession(
            signing.id,
            {
              sessionRevision: current.revision,
              completionReference: reference,
            },
            h.key()
          )
        ).rejects.toMatchObject({
          problem: { code: 'SIGNING_SESSION_INACTIVE' },
        });
      expect(h.service.controller.snapshot().records.artifacts).toEqual([]);
    }
  );
  it.each([
    'acknowledged',
    'known-not-transmitted',
    'still-unknown',
    'unavailable',
  ])('reconciliation %s never adds a transmission attempt', async (variant) => {
    const h = createHarness({
      scenarioId: 'send-unknown-reconciliation',
      variant,
    });
    const { evaluation } = await h.createAndEvaluate();
    const signed = await h.sign(evaluation);
    const tx = (await h.send(signed.evaluation, signed.artifactId)).body.data;
    h.service.controller.runPendingJobs();
    const unknown = (await h.client.getTransmission(tx.id)).body.data;
    await h.client.reconcileTransmission(
      tx.id,
      { operationRevision: unknown.revision },
      h.key()
    );
    h.service.controller.runPendingJobs();
    const result = (await h.client.getTransmission(tx.id)).body.data;
    expect(result.attemptCount).toBe(1);
    expect(result.state).toBe(
      variant === 'acknowledged'
        ? 'acknowledged'
        : variant === 'known-not-transmitted'
          ? 'failed'
          : 'unknown-outcome'
    );
    expect(result.reconciliation.status).toBe(
      variant === 'unavailable' ? 'unavailable' : 'complete'
    );
  });
  it.each(['read-only', 'unsupported', 'precommit-failure'])(
    'enforces permission/capability/precommit variant %s',
    async (variant) => {
      const h = createHarness({
        scenarioId: 'reset-readonly-permissions',
        variant,
      });
      if (variant === 'read-only')
        await expect(
          h.client.createPrescription(h.service.controller.draft(), h.key())
        ).rejects.toMatchObject({ problem: { status: 403 } });
      if (variant === 'unsupported') {
        const rx = (
          await h.client.createPrescription(
            h.service.controller.draft(),
            h.key()
          )
        ).body.data;
        await expect(
          h.client.createEvaluation(
            {
              subject: {
                kind: 'saved',
                prescription: { id: rx.id, revision: '1' },
              },
              services: ['validation', 'interactions'],
            },
            h.key()
          )
        ).rejects.toMatchObject({ problem: { code: 'SERVICE_UNSUPPORTED' } });
      }
      if (variant === 'precommit-failure') {
        const key = h.key();
        await expect(
          h.client.createPrescription(h.service.controller.draft(), key)
        ).rejects.toMatchObject({ problem: { status: 503 } });
        expect(h.service.controller.snapshot().records.prescriptions).toEqual(
          []
        );
        expect(
          (await h.client.createPrescription(h.service.controller.draft(), key))
            .body.data.id
        ).toBe('rx-0001');
      }
    }
  );
  it('unknown routes, PRN maximums and unsupported pairs remain unknown within explicit coverage', () => {
    const snapshot = providerSnapshot();
    snapshot.draft.prescription.route = 'intravenous';
    expect(checkDosing(snapshot).missingInputs).toContain('prescription.route');
    snapshot.draft.prescription.route = 'oral';
    snapshot.draft.prescription.prn = true;
    snapshot.draft.prescription.maxDailyDose = 'not a dose';
    expect(checkDosing(snapshot).missingInputs).toContain(
      'prescription.maxDailyDose'
    );
    snapshot.draft.prescription.frequency = 'tapered';
    expect(checkDosing(snapshot).data).toMatchObject({ dailyAmount: null });
    snapshot.context.medicationExposures = [
      {
        id: 'unknown-exposure',
        productId: 'unsupported',
        ingredientIds: ['unsupported-ingredient'],
        status: 'active',
        use: 'reported',
        sourceRevision: '1',
        effectiveAt: snapshot.now,
      },
    ];
    expect(checkInteractions(snapshot).coverage.excludedSubjects).toHaveLength(
      1
    );
    expect(checkInteractions(snapshot).outcome).toBe('unknown');
    snapshot.context.pregnancy = known(
      'not-pregnant',
      '2026-10-02T12:00:00.000Z'
    );
    expect(checkPregnancy(snapshot).status).toBe('partial');
  });
  it('dosing freshness follows observed weight rather than later retrieval time', () => {
    const snapshot = providerSnapshot('dose-unit-conversion');
    snapshot.context.measurements.weight = known(
      { value: '70', unit: 'kg', method: 'synthetic-measurement' },
      '2026-10-03T11:00:00.000Z'
    );
    expect(checkDosing(snapshot).expiresAt).toBe('2026-10-04T11:00:00.000Z');
  });
  it('rejects wrong quantity/product/plan PA applicability and retains approval only in its scope', async () => {
    const h = createHarness({ scenarioId: 'pa-approved' });
    const { evaluation, prescription } = await h.createAndEvaluate();
    const pa = await requestPa(h, evaluation);
    h.service.controller.runPendingJobs();
    h.service.controller.applyContextEvent('change-coverage');
    const newEv = (
      await h.client.createEvaluation(
        {
          subject: {
            kind: 'saved',
            prescription: { id: prescription.id, revision: '1' },
          },
          services: ['validation'],
        },
        h.key()
      )
    ).body.data;
    await expect(
      h.client.updateWorkflowContext(
        newEv.id,
        { pdmpQueryId: null, priorAuthorizationId: pa.id },
        { ...h.key(), ifMatch: etag(newEv.id, newEv.revision) }
      )
    ).rejects.toMatchObject({ problem: { code: 'PA_SCOPE_MISMATCH' } });
    expect((await h.client.getPriorAuthorization(pa.id)).body.data.state).toBe(
      'approved'
    );
  });
});
