import { describe, expect, it } from 'vitest';
import { validatePrescription } from '../../prescribing/validate';
import { demoPrescriptionPolicy } from '../../prescribing/policy';
import { createHarness, draftFromRecord } from './testSupport';
import { prescribingScenarios } from './scenarios';

describe('deterministic fake EHR', () => {
  it('refreshes an expired PDMP workflow link without rerunning fresh clinical checks', async () => {
    const h = createHarness({ scenarioId: 'pdmp-required' });
    const { evaluation } = await h.createAndEvaluate();
    const query = async () => {
      const report = (
        await h.client.createPdmpQuery(
          {
            patientId: 'sim-patient-1',
            prescriberId: 'sim-prescriber-1',
            jurisdictions: ['SIM'],
            purposeCode: 'treatment',
            attestation: true,
          },
          h.key()
        )
      ).body.data;
      h.service.controller.runPendingJobs();
      const completed = await h.client.getPdmpQuery(report.id);
      await h.client.reviewPdmpQuery(
        report.id,
        {
          reviewedReportRevision: completed.body.data.reportRevision!,
          purposeCode: 'treatment',
        },
        { ...h.key(), ifMatch: completed.headers.etag }
      );
      return report.id;
    };
    const firstId = await query();
    let current = await h.currentEvaluation(evaluation.id);
    await h.client.updateWorkflowContext(
      evaluation.id,
      { pdmpQueryId: firstId, priorAuthorizationId: null },
      { ...h.key(), ifMatch: `"${current.id}:${current.revision}"` }
    );
    const before = await h.currentEvaluation(evaluation.id);
    h.service.controller.applyContextEvent('expire-pdmp-report');
    expect((await h.currentEvaluation(evaluation.id)).validity).toBe('expired');
    const nextId = await query();
    current = await h.currentEvaluation(evaluation.id);
    await h.client.updateWorkflowContext(
      evaluation.id,
      { pdmpQueryId: nextId, priorAuthorizationId: null },
      { ...h.key(), ifMatch: `"${current.id}:${current.revision}"` }
    );
    const restored = await h.currentEvaluation(evaluation.id);
    expect(restored.validity).toBe('current');
    expect(restored.gates.review.state).toBe('pass');
    expect(restored.inputFingerprint).toBe(before.inputFingerprint);
    expect(restored.checks).toEqual(before.checks);
  });
  it('saves and reopens incomplete Lasix without inventing clinical claims', async () => {
    const h = createHarness({ scenarioId: 'lasix-draft' });
    const { prescription, evaluation } = await h.createAndEvaluate();
    expect(prescription.display).toBe('Lasix');
    expect(prescription.prescription).toEqual({});
    expect(evaluation.validation.dataState).toBe('incomplete');
    expect(evaluation.checks.interactions?.status).toBe('partial');
    expect(
      Object.values(evaluation.checks).flatMap((check) => check?.findings ?? [])
    ).toEqual([]);
    expect(evaluation.gates.transmit.state).not.toBe('pass');
  });
  it('uses the exact shared validator and separates content from workflow revisions', async () => {
    const h = createHarness();
    const { prescription, evaluation } = await h.createAndEvaluate();
    const input = h.service.controller.validationInput(prescription);
    input.evaluatedAt = evaluation.createdAt;
    expect(evaluation.validation).toEqual(
      validatePrescription(input, demoPrescriptionPolicy)
    );
    expect(prescription.contentRevision).toBe('1');
    expect(Number(prescription.recordVersion)).toBeGreaterThan(1);
    expect(evaluation.gates.review.state).toBe('pass');
    expect(evaluation.gates.sign.state).toBe('unknown');
    const signed = await h.sign(evaluation);
    expect(signed.evaluation.gates.transmit.state).toBe('pass');
    const operation = (await h.send(signed.evaluation, signed.artifactId)).body
      .data;
    h.service.controller.runPendingJobs();
    expect((await h.client.getTransmission(operation.id)).body.data.state).toBe(
      'acknowledged'
    );
    expect((await h.currentPrescription(prescription.id)).contentRevision).toBe(
      '1'
    );
  });
  it('GET polling never advances pending providers', async () => {
    const h = createHarness();
    const record = (
      await h.client.createPrescription(h.service.controller.draft(), h.key())
    ).body.data;
    const evaluation = (
      await h.client.createEvaluation(
        {
          subject: {
            kind: 'saved',
            prescription: { id: record.id, revision: '1' },
          },
          services: ['validation', 'interactions'],
        },
        h.key()
      )
    ).body.data;
    expect(
      (await h.currentEvaluation(evaluation.id)).checks.interactions?.status
    ).toBe('pending');
    expect((await h.currentEvaluation(evaluation.id)).revision).toBe(
      evaluation.revision
    );
    h.service.controller.advanceTime(100);
    expect(
      (await h.currentEvaluation(evaluation.id)).checks.interactions?.status
    ).toBe('complete');
    expect((await h.currentEvaluation(evaluation.id)).gates.review.state).toBe(
      'unknown'
    );
  });
  it('keeps a resolved interaction visible and cannot override missing history', async () => {
    for (const scenarioId of [
      'interaction-review',
      'interaction-history-missing',
    ]) {
      const h = createHarness({ scenarioId });
      const { evaluation } = await h.createAndEvaluate();
      const finding = evaluation.checks.interactions!.findings[0];
      await h.client.createDecision(
        evaluation.id,
        {
          findingId: finding.id,
          action: 'override',
          reasonCode: 'simulation-review',
        },
        { ...h.key(), ifMatch: `"${evaluation.id}:${evaluation.revision}"` }
      );
      const after = await h.currentEvaluation(evaluation.id);
      expect(after.checks.interactions!.findings).toHaveLength(1);
      expect(after.decisions).toHaveLength(1);
      expect(after.gates.review.state).toBe(
        scenarioId === 'interaction-review' ? 'pass' : 'unknown'
      );
    }
  });
  it('supports explicit dosing conversion and missing renal/weight inputs', async () => {
    const converted = await createHarness({
      scenarioId: 'dose-unit-conversion',
    }).createAndEvaluate();
    expect(converted.evaluation.checks.dosing?.data).toMatchObject({
      weightKg: '70',
    });
    for (const variant of ['weight', 'renal']) {
      const result = await createHarness({
        scenarioId: 'dose-context-missing',
        variant,
      }).createAndEvaluate();
      expect(result.evaluation.checks.dosing?.status).toBe('partial');
      expect(
        result.evaluation.checks.dosing?.missingInputs.length
      ).toBeGreaterThan(0);
    }
    const high = await createHarness({
      scenarioId: 'dose-high',
    }).createAndEvaluate();
    expect(high.evaluation.checks.dosing?.findings[0].code).toBe(
      'DEMO_DOSE_HIGH'
    );
  });
  it('requires explicit PDMP review and workflow linking; matched empty is reviewable', async () => {
    const h = createHarness({
      scenarioId: 'pdmp-ambiguous-or-outage',
      variant: 'empty',
    });
    const { prescription, evaluation } = await h.createAndEvaluate();
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
    const complete = (await h.client.getPdmpQuery(query.id)).body.data;
    expect(complete.state).toBe('complete');
    expect(complete.match).toBe('matched');
    expect(complete.entries).toEqual([]);
    await h.client.updateWorkflowContext(
      evaluation.id,
      { pdmpQueryId: query.id, priorAuthorizationId: null },
      {
        ...h.key(),
        ifMatch: `"${evaluation.id}:${(await h.currentEvaluation(evaluation.id)).revision}"`,
      }
    );
    let checked = await h.currentEvaluation(evaluation.id);
    expect(checked.gates.sign.state).toBe('unknown');
    await h.client.reviewPdmpQuery(
      query.id,
      {
        reviewedReportRevision: complete.reportRevision!,
        purposeCode: 'treatment',
      },
      { ...h.key(), ifMatch: `"${query.id}:${complete.revision}"` }
    );
    checked = await h.currentEvaluation(evaluation.id);
    const signed = await h.sign(checked);
    expect(signed.session.mode).toBe('epcs');
    expect(signed.evaluation.gates.transmit.state).toBe('pass');
  });
  it('binds PA approval to complete answers and matching coverage/product scope', async () => {
    const h = createHarness({ scenarioId: 'pa-approved' });
    const { prescription, evaluation } = await h.createAndEvaluate();
    const pa = (
      await h.client.createPriorAuthorization(
        {
          prescription: {
            id: prescription.id,
            revision: prescription.contentRevision,
          },
          evaluationId: evaluation.id,
          benefitType: 'pharmacy',
          reasonCode: 'required-by-benefit',
        },
        h.key()
      )
    ).body.data;
    const form = (await h.client.getQuestionnaire(pa.id)).body.data;
    const partial = (
      await h.client.saveAnswers(
        pa.id,
        {
          questionnaireId: form.id,
          questionnaireVersion: form.version,
          answers: [{ linkId: 'indication', value: 'Synthetic indication' }],
        },
        { ...h.key(), ifMatch: `"${pa.id}:${pa.revision}"` }
      )
    ).body.data;
    expect(partial.state).toBe('questionnaire-needed');
    const ready = (
      await h.client.saveAnswers(
        pa.id,
        {
          questionnaireId: form.id,
          questionnaireVersion: form.version,
          answers: [
            { linkId: 'indication', value: 'Synthetic indication' },
            { linkId: 'tried-alternative', value: false },
          ],
        },
        { ...h.key(), ifMatch: `"${pa.id}:${partial.revision}"` }
      )
    ).body.data;
    const submitted = (
      await h.client.submitPriorAuthorization(
        pa.id,
        {
          caseRevision: ready.revision,
          questionnaireVersion: form.version,
          submissionKind: 'initial',
        },
        h.key()
      )
    ).body.data;
    expect(
      (await h.client.getSubmission(pa.id, submitted.id)).body.data.state
    ).toBe('queued');
    h.service.controller.runPendingJobs();
    expect((await h.client.getPriorAuthorization(pa.id)).body.data.state).toBe(
      'approved'
    );
    const current = await h.currentEvaluation(evaluation.id);
    await h.client.updateWorkflowContext(
      evaluation.id,
      { pdmpQueryId: null, priorAuthorizationId: pa.id },
      { ...h.key(), ifMatch: `"${evaluation.id}:${current.revision}"` }
    );
    const signed = await h.sign(await h.currentEvaluation(evaluation.id));
    expect(signed.evaluation.gates.transmit.state).toBe('pass');
    h.service.controller.applyContextEvent('revoke-pa');
    expect(
      (await h.currentEvaluation(evaluation.id)).gates.transmit.state
    ).toBe('unknown');
  });
  it('invalidates old overrides and late checks after content/context edit', async () => {
    const h = createHarness({ scenarioId: 'override-invalidated' });
    const { prescription, evaluation } = await h.createAndEvaluate();
    await h.client.createDecision(
      evaluation.id,
      {
        findingId: evaluation.checks.interactions!.findings[0].id,
        action: 'override',
        reasonCode: 'simulation-review',
      },
      { ...h.key(), ifMatch: `"${evaluation.id}:${evaluation.revision}"` }
    );
    const current = await h.currentPrescription(prescription.id);
    const draft = draftFromRecord(current);
    draft.prescription.dose = '6';
    await h.client.updatePrescription(current.id, draft, {
      ...h.key(),
      ifMatch: `"${current.id}:${current.recordVersion}"`,
    });
    const stale = await h.currentEvaluation(evaluation.id);
    expect(stale.validity).toBe('stale');
    expect(stale.decisions).toHaveLength(1);
    expect(stale.gates.review.state).not.toBe('pass');
    h.service.controller.applyContextEvent('record-pregnancy-observation');
    expect((await h.currentEvaluation(evaluation.id)).validity).toBe('stale');
  });
  it('blocks duplicate sends after response loss, then recovers one operation with the same key', async () => {
    const h = createHarness({ scenarioId: 'send-response-lost' });
    const { evaluation } = await h.createAndEvaluate();
    const signed = await h.sign(evaluation);
    await expect(
      h.send(signed.evaluation, signed.artifactId, 'lost-send')
    ).rejects.toThrow('response loss');
    const recovered = (
      await h.send(signed.evaluation, signed.artifactId, 'lost-send')
    ).body.data;
    await expect(
      h.send(signed.evaluation, signed.artifactId, 'different-send')
    ).rejects.toMatchObject({ problem: { code: 'LOGICAL_SEND_EXISTS' } });
    expect(h.service.controller.snapshot().records.transmissions).toHaveLength(
      1
    );
    h.service.controller.runPendingJobs();
    expect((await h.client.getTransmission(recovered.id)).body.data.state).toBe(
      'acknowledged'
    );
  });
  it('reconciles unknown delivery without a new attempt and retries only known failure', async () => {
    const h = createHarness({
      scenarioId: 'send-unknown-reconciliation',
      variant: 'known-not-transmitted',
    });
    const { evaluation } = await h.createAndEvaluate();
    const signed = await h.sign(evaluation);
    const tx = (await h.send(signed.evaluation, signed.artifactId)).body.data;
    h.service.controller.runPendingJobs();
    let current = (await h.client.getTransmission(tx.id)).body.data;
    expect(current.state).toBe('unknown-outcome');
    await expect(
      h.client.retryTransmission(
        tx.id,
        {
          operationRevision: current.revision,
          evaluationId: evaluation.id,
          reasonCode: 'retry',
        },
        h.key()
      )
    ).rejects.toMatchObject({ problem: { code: 'RETRY_NOT_PERMITTED' } });
    await h.client.reconcileTransmission(
      tx.id,
      { operationRevision: current.revision },
      h.key()
    );
    h.service.controller.runPendingJobs();
    current = (await h.client.getTransmission(tx.id)).body.data;
    expect(current.state).toBe('failed');
    expect(current.attemptCount).toBe(1);
    const retried = (
      await h.client.retryTransmission(
        tx.id,
        {
          operationRevision: current.revision,
          evaluationId: evaluation.id,
          reasonCode: 'known-failure',
        },
        h.key()
      )
    ).body.data;
    expect(retried.id).toBe(tx.id);
    expect(retried.attemptCount).toBe(2);
    h.service.controller.runPendingJobs();
    expect((await h.client.getTransmission(tx.id)).body.data.state).toBe(
      'acknowledged'
    );
  });
  it('keeps signed content immutable, cancellation rejection and replacement history separate', async () => {
    const h = createHarness({ scenarioId: 'cancellation-rejected' });
    const { evaluation } = await h.createAndEvaluate();
    const signed = await h.sign(evaluation);
    const original = await h.currentPrescription(signed.prescription.id);
    await expect(
      h.client.updatePrescription(original.id, draftFromRecord(original), {
        ...h.key(),
        ifMatch: `"${original.id}:${original.recordVersion}"`,
      })
    ).rejects.toMatchObject({ problem: { code: 'SIGNED_CONTENT_IMMUTABLE' } });
    const sent = (await h.send(signed.evaluation, signed.artifactId)).body.data;
    h.service.controller.runPendingJobs();
    const cancellation = (
      await h.client.cancelPrescription(
        original.id,
        {
          revision: original.contentRevision,
          reasonCode: 'replacement',
          transmissionId: sent.id,
          signedArtifactId: signed.artifactId,
        },
        h.key()
      )
    ).body.data;
    h.service.controller.runPendingJobs();
    expect(
      (
        await h.client.request<
          import('../../prescribing/api/contracts').CancellationRecord
        >('GET', `/cancellations/${cancellation.id}`)
      ).body.data.state
    ).toBe('rejected');
    const replacement = (
      await h.client.replacePrescription(
        original.id,
        {
          original: { id: original.id, revision: original.contentRevision },
          reasonCode: 'correction',
          draft: h.service.controller.draft(),
        },
        h.key()
      )
    ).body.data;
    expect(replacement.replacesPrescriptionId).toBe(original.id);
    expect((await h.currentPrescription(original.id)).lifecycle).toBe(
      'transmitted'
    );
  });
  it('expires passing gates without editing or GET-triggered jobs', async () => {
    const h = createHarness();
    const { evaluation } = await h.createAndEvaluate();
    expect(evaluation.gates.review.state).toBe('pass');
    h.service.controller.advanceTime(86400000);
    const expired = await h.currentEvaluation(evaluation.id);
    expect(expired.validity).toBe('expired');
    expect(expired.gates.review.state).toBe('unknown');
  });
  it('isolates sessions, resets IDs/jobs and exposes all 24 named scenarios', async () => {
    expect(prescribingScenarios).toHaveLength(24);
    const h = createHarness();
    await h.createAndEvaluate();
    const other = createHarness();
    expect(other.service.controller.snapshot().records.prescriptions).toEqual(
      []
    );
    h.service.controller.reset('complete-demo');
    expect(h.service.controller.snapshot().jobs).toEqual([]);
    expect(
      (await h.client.createPrescription(h.service.controller.draft(), h.key()))
        .body.data.id
    ).toBe('rx-0001');
    h.service.controller.dispose();
    expect(h.service.controller.snapshot().jobs).toEqual([]);
  });
});
