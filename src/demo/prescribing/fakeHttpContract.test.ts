import { describe, expect, it } from 'vitest';
import {
  prescribingRoutes,
  prescribingSchemas,
  validateSchema,
  matchRoute,
} from '../../prescribing/api/schemas';
import { createHttpClient } from '../../prescribing/api/createHttpClient';
import { createFakeEhrService } from './createFakeEhrService';
import { createFakeFetch } from './createFakeFetch';
import { createHarness, draftFromRecord } from './testSupport';
import { createSimulationClock } from './scheduler';

describe('fake prescribing HTTP contract', () => {
  it('saves and reopens coded concerns through HTTP while allowing incomplete free-text drafts', async () => {
    const h = createHarness({ scenarioId: 'lasix-draft' });
    const draft = h.service.controller.draft();
    draft.prescription = { indication: 'Uncoded concern' };
    const created = await h.client.createPrescription(draft, h.key());
    expect(
      (await h.client.getPrescription(created.body.data.id)).body.data
        .prescription
    ).toEqual({
      indication: 'Uncoded concern',
    });
    const details = {
      indication: 'Hypertension',
      concernId: 'chart-concern-1',
      indicationCode: {
        system: 'ICD-10-CM',
        code: 'I10',
        display: 'Essential hypertension',
        version: '2026',
      },
    };
    const coded = await h.client.updatePrescription(
      created.body.data.id,
      {
        ...draftFromRecord(created.body.data),
        prescription: details,
      },
      { ...h.key(), ifMatch: created.headers.etag }
    );
    expect(coded.body.data.contentRevision).toBe('2');
    expect(
      (await h.client.getPrescription(coded.body.data.id)).body.data
        .prescription
    ).toEqual(details);
    await h.client.updatePrescription(
      coded.body.data.id,
      {
        ...draftFromRecord(coded.body.data),
        prescription: { indication: 'Different uncoded concern' },
      },
      { ...h.key(), ifMatch: coded.headers.etag }
    );
    expect(
      (await h.client.getPrescription(coded.body.data.id)).body.data
        .prescription
    ).toEqual({
      indication: 'Different uncoded concern',
    });
  });
  it.each(['indicationCode', 'concernId'] as const)(
    'rejects reuse and submission of PA scope after changing %s even when display text is unchanged',
    async (field) => {
      const h = createHarness({ scenarioId: 'pa-approved' });
      const draft = h.service.controller.draft();
      draft.prescription = {
        ...draft.prescription,
        indication: 'Hypertension',
        concernId: 'chart-concern-1',
        indicationCode: { system: 'ICD-10-CM', code: 'I10', version: '2026' },
      };
      const { prescription, evaluation } = await h.createAndEvaluate(draft);
      const pa = (
        await h.client.createPriorAuthorization(
          {
            prescription: {
              id: prescription.id,
              revision: prescription.contentRevision,
            },
            evaluationId: evaluation.id,
            benefitType: 'pharmacy',
            reasonCode: 'simulation',
          },
          h.key()
        )
      ).body.data;
      expect(pa.scope).toMatchObject({
        concernId: draft.prescription.concernId,
        indicationCode: draft.prescription.indicationCode,
      });
      const form = (await h.client.getQuestionnaire(pa.id)).body.data;
      const ready = (
        await h.client.saveAnswers(
          pa.id,
          {
            questionnaireId: form.id,
            questionnaireVersion: form.version,
            answers: [
              { linkId: 'indication', value: 'Hypertension' },
              { linkId: 'tried-alternative', value: false },
            ],
          },
          { ...h.key(), ifMatch: `"${pa.id}:${pa.revision}"` }
        )
      ).body.data;
      const before = await h.client.getPrescription(prescription.id);
      const changedDraft = draftFromRecord(before.body.data);
      changedDraft.prescription = {
        ...changedDraft.prescription,
        ...(field === 'indicationCode'
          ? {
              indicationCode: {
                system: 'ICD-10-CM',
                code: 'I11.9',
                version: '2026',
              },
            }
          : { concernId: 'chart-concern-2' }),
      };
      const changed = await h.client.updatePrescription(
        prescription.id,
        changedDraft,
        {
          ...h.key(),
          ifMatch: before.headers.etag,
        }
      );
      expect((await h.currentEvaluation(evaluation.id)).validity).toBe('stale');
      const fresh = await h.client.createEvaluation(
        {
          subject: {
            kind: 'saved',
            prescription: {
              id: prescription.id,
              revision: changed.body.data.contentRevision,
            },
          },
          services: ['validation'],
        },
        h.key()
      );
      await expect(
        h.client.updateWorkflowContext(
          fresh.body.data.id,
          {
            pdmpQueryId: null,
            priorAuthorizationId: pa.id,
          },
          { ...h.key(), ifMatch: fresh.headers.etag }
        )
      ).rejects.toMatchObject({
        problem: { status: 422, code: 'PA_SCOPE_MISMATCH' },
      });
      await expect(
        h.client.submitPriorAuthorization(
          pa.id,
          {
            caseRevision: ready.revision,
            questionnaireVersion: form.version,
            submissionKind: 'initial',
          },
          h.key()
        )
      ).rejects.toMatchObject({
        problem: { status: 422, code: 'PA_SCOPE_MISMATCH' },
      });
    }
  );
  it('rejects malformed condition coding at the actual HTTP boundary before persistence', async () => {
    const service = createFakeEhrService({ scenarioId: 'lasix-draft' });
    const response = await createFakeFetch(service)(
      '/api/prescribing/v1/prescriptions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'bad-condition-code',
        },
        body: JSON.stringify({
          ...service.controller.draft(),
          prescription: {
            indication: 'Hypertension',
            indicationCode: { system: 'ICD-10-CM' },
          },
        }),
      }
    );
    expect(response.status).toBe(400);
    expect(service.controller.snapshot().records.prescriptions).toEqual([]);
  });
  it('logs a preserved mutation request exactly once after routing consumes the body', async () => {
    const service = createFakeEhrService({ scenarioId: 'lasix-draft' });
    const observed: Array<Promise<unknown>> = [];
    const client = createHttpClient({
      fetch: createFakeFetch(service, {
        onRequest(request, response) {
          observed.push(Promise.all([request.json(), response!.json()]));
        },
      }),
    });
    const result = await client.createPrescription(service.controller.draft(), {
      idempotencyKey: 'observer',
    });
    expect(result.status).toBe(201);
    expect(observed).toHaveLength(1);
    expect(await observed[0]).toMatchObject([
      { display: 'Lasix' },
      { data: { id: 'rx-0001' } },
    ]);
  });
  it('recovers create/update idempotency before rejecting now-stale preconditions', async () => {
    const h = createHarness();
    const draft = h.service.controller.draft();
    const first = await h.client.createPrescription(draft, {
      idempotencyKey: 'create',
    });
    expect(
      await h.client.createPrescription(draft, { idempotencyKey: 'create' })
    ).toEqual(first);
    await expect(
      h.client.createPrescription(
        { ...draft, display: 'changed' },
        { idempotencyKey: 'create' }
      )
    ).rejects.toMatchObject({
      problem: { status: 409, code: 'IDEMPOTENCY_CONFLICT' },
    });
    const update = {
      ...draftFromRecord(first.body.data),
      prescription: { ...draft.prescription, quantity: '12' },
    };
    const options = { idempotencyKey: 'update', ifMatch: first.headers.etag };
    const changed = await h.client.updatePrescription(
      first.body.data.id,
      update,
      options
    );
    expect(
      await h.client.updatePrescription(first.body.data.id, update, options)
    ).toEqual(changed);
    await expect(
      h.client.updatePrescription(first.body.data.id, update, {
        ...options,
        idempotencyKey: 'other',
      })
    ).rejects.toMatchObject({ problem: { status: 412 } });
  });
  it('rejects malformed schemas/JSON and actor/workflow spoofing at the boundary', async () => {
    const service = createFakeEhrService();
    const fetch = createFakeFetch(service);
    for (const body of [
      '{',
      JSON.stringify({ ...service.controller.draft(), actorId: 'other' }),
      JSON.stringify({ ...service.controller.draft(), signed: true }),
    ]) {
      const response = await fetch('/api/prescribing/v1/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'bad',
        },
        body,
      });
      expect(response.status).toBe(400);
      expect(response.headers.get('content-type')).toBe(
        'application/problem+json'
      );
      expect(
        validateSchema(await response.json(), prescribingSchemas.Problem)
      ).toEqual([]);
    }
    expect(service.controller.snapshot().records.prescriptions).toEqual([]);
  });
  it('does not leave records/jobs/events after an invalid evaluation foreign link', async () => {
    const h = createHarness();
    const prescription = (
      await h.client.createPrescription(h.service.controller.draft(), h.key())
    ).body.data;
    const before = h.service.controller.snapshot();
    await expect(
      h.client.createEvaluation(
        {
          subject: {
            kind: 'saved',
            prescription: { id: prescription.id, revision: '1' },
          },
          services: ['validation', 'interactions'],
          pdmpQueryId: 'nonexistent',
        },
        h.key()
      )
    ).rejects.toMatchObject({ problem: { status: 404 } });
    const after = h.service.controller.snapshot();
    for (const name of [
      'evaluations',
      'evaluationInputs',
      'events',
      'prescriptions',
    ])
      expect(after.records[name]).toEqual(before.records[name]);
    expect(after.jobs).toEqual(before.jobs);
    const created = (
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
    expect(created.id).toBe('ev-0001');
  });
  it('changes evaluation ETag when the first check completes while other checks remain pending', async () => {
    const h = createHarness();
    const prescription = (
      await h.client.createPrescription(h.service.controller.draft(), h.key())
    ).body.data;
    const initial = await h.client.createEvaluation(
      {
        subject: {
          kind: 'saved',
          prescription: { id: prescription.id, revision: '1' },
        },
        services: [
          'validation',
          'interactions',
          'pregnancy',
          'dosing',
          'formulary',
          'benefit',
        ],
      },
      h.key()
    );
    h.service.controller.advanceTime(100);
    const changed = await h.client.getEvaluation(initial.body.data.id);
    expect(changed.body.data.state).toBe('running');
    expect(changed.body.data.checks.interactions?.status).toBe('complete');
    expect(changed.headers.etag).not.toBe(initial.headers.etag);
    const untouched = await h.client.getEvaluation(initial.body.data.id);
    expect(untouched).toMatchObject({
      headers: { etag: changed.headers.etag },
      body: { data: { revision: changed.body.data.revision } },
    });
    await expect(
      h.client.createDecision(
        changed.body.data.id,
        {
          findingId: 'missing',
          action: 'override',
          reasonCode: 'simulation-review',
        },
        { ...h.key(), ifMatch: changed.headers.etag }
      )
    ).rejects.toMatchObject({ problem: { status: 404 } });
    expect(
      (await h.client.getEvaluation(initial.body.data.id)).headers.etag
    ).toBe(changed.headers.etag);
  });
  it('guards cancellation operation patient access, fetch namespace and abort before commit', async () => {
    const service = createFakeEhrService();
    const fetch = createFakeFetch(service);
    await expect(
      fetch('https://example.com/api/prescribing/v1/capabilities')
    ).rejects.toThrow('namespace');
    await expect(fetch('/unrelated')).rejects.toThrow('namespace');
    const controller = new AbortController();
    controller.abort();
    await expect(
      fetch('/api/prescribing/v1/prescriptions', {
        method: 'POST',
        body: JSON.stringify(service.controller.draft()),
        headers: { 'Idempotency-Key': 'aborted' },
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(service.controller.snapshot().records.prescriptions).toEqual([]);
    const other = createFakeEhrService({
      session: {
        id: 'other',
        actorId: 'staff',
        role: 'staff',
        allowedActions: ['*'],
        allowedPatientIds: [],
      },
    });
    await expect(
      other.getPatientContext('sim-patient-1')
    ).rejects.toMatchObject({ problem: { status: 403 } });
  });
  it('rejects clock inputs with missing dates instead of using hidden current time', () => {
    expect(() => createSimulationClock('12:00:00')).toThrow(
      'Invalid simulation start'
    );
    expect(() => createSimulationClock('2026-99-99T00:00:00Z')).toThrow(
      'Invalid simulation start'
    );
  });
  it('exercises every declared route through schema-checked Request/Response handlers', async () => {
    const observed = new Set<string>();
    const observer = (
      request: InstanceType<typeof globalThis.Request>,
      response: Response | null
    ) => {
      if (!response?.ok) return;
      const route = matchRoute(
        request.method,
        new URL(request.url).pathname.replace('/api/prescribing/v1', '')
      )!;
      observed.add(`${route.method} ${route.path}`);
    };
    async function routeHarness(scenarioId: string, variant?: string) {
      const service = createFakeEhrService({ scenarioId, variant });
      const client = createHttpClient({
        fetch: createFakeFetch(service, { onRequest: observer }),
      });
      let sequence = 0;
      const key = () => ({ idempotencyKey: `routes-${++sequence}` });
      const record = (
        await client.createPrescription(service.controller.draft(), key())
      ).body.data;
      const evaluation = (
        await client.createEvaluation(
          {
            subject: {
              kind: 'saved',
              prescription: { id: record.id, revision: '1' },
            },
            services: [
              'validation',
              'interactions',
              'pregnancy',
              'dosing',
              'formulary',
              'benefit',
            ],
          },
          key()
        )
      ).body.data;
      service.controller.runPendingJobs();
      return {
        service,
        client,
        key,
        record,
        evaluation: (await client.getEvaluation(evaluation.id)).body.data,
      };
    }
    const h = await routeHarness('interaction-review');
    await h.client.getCapabilities();
    await h.client.getPolicy('demo-outpatient');
    await h.client.getPatientContext('sim-patient-1');
    const products = (await h.client.searchDrugs('Sim')).body.data.items;
    await h.client.getDrug(products[0].id);
    await h.client.searchPharmacies('Synthetic');
    await h.client.listPrescriptions('sim-patient-1');
    const beforeUpdate = await h.client.getPrescription(h.record.id);
    await h.client.updatePrescription(
      h.record.id,
      draftFromRecord(beforeUpdate.body.data),
      { ...h.key(), ifMatch: beforeUpdate.headers.etag }
    );
    const currentRx = (await h.client.getPrescription(h.record.id)).body.data;
    const newEv = (
      await h.client.createEvaluation(
        {
          subject: {
            kind: 'saved',
            prescription: {
              id: currentRx.id,
              revision: currentRx.contentRevision,
            },
          },
          services: [
            'validation',
            'interactions',
            'pregnancy',
            'dosing',
            'formulary',
            'benefit',
          ],
        },
        h.key()
      )
    ).body.data;
    h.service.controller.runPendingJobs();
    let ev = (await h.client.getEvaluation(newEv.id)).body.data;
    await h.client.createDecision(
      ev.id,
      {
        findingId: ev.checks.interactions!.findings[0].id,
        action: 'override',
        reasonCode: 'simulation-review',
      },
      { ...h.key(), ifMatch: `"${ev.id}:${ev.revision}"` }
    );
    const query = (
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
    const report = await h.client.getPdmpQuery(query.id);
    await h.client.reviewPdmpQuery(
      query.id,
      {
        reviewedReportRevision: report.body.data.reportRevision!,
        purposeCode: 'treatment',
      },
      { ...h.key(), ifMatch: report.headers.etag }
    );
    ev = (await h.client.getEvaluation(ev.id)).body.data;
    const pa = (
      await h.client.createPriorAuthorization(
        {
          prescription: {
            id: currentRx.id,
            revision: currentRx.contentRevision,
          },
          evaluationId: ev.id,
          benefitType: 'pharmacy',
          reasonCode: 'simulation',
        },
        h.key()
      )
    ).body.data;
    const form = (await h.client.getQuestionnaire(pa.id)).body.data;
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
        { ...h.key(), ifMatch: `"${pa.id}:${pa.revision}"` }
      )
    ).body.data;
    const submission = (
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
    await h.client.getSubmission(pa.id, submission.id);
    h.service.controller.runPendingJobs();
    const approved = (await h.client.getPriorAuthorization(pa.id)).body.data;
    await h.client.cancelPriorAuthorization(
      pa.id,
      { caseRevision: approved.revision, reasonCode: 'simulation' },
      h.key()
    );
    h.service.controller.runPendingJobs();
    ev = (await h.client.getEvaluation(ev.id)).body.data;
    await h.client.updateWorkflowContext(
      ev.id,
      { pdmpQueryId: query.id, priorAuthorizationId: pa.id },
      { ...h.key(), ifMatch: `"${ev.id}:${ev.revision}"` }
    );
    const review = (
      await h.client.createReview(
        {
          patientId: 'sim-patient-1',
          selections: [
            {
              prescription: {
                id: currentRx.id,
                revision: currentRx.contentRevision,
              },
              evaluationId: ev.id,
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
    const complete = (
      await h.client.completeSigningSession(
        signing.id,
        {
          sessionRevision: signing.revision,
          completionReference: h.service.controller.completeSimulatedChallenge(
            signing.id
          ),
        },
        h.key()
      )
    ).body.data;
    await h.client.getSigningSession(signing.id);
    await h.client.getSignedArtifact(complete.artifacts[0].signedArtifactId);
    const tx = (
      await h.client.createTransmission(
        {
          prescription: {
            id: currentRx.id,
            revision: currentRx.contentRevision,
          },
          evaluationId: ev.id,
          signedArtifactId: complete.artifacts[0].signedArtifactId,
          pharmacyId: currentRx.pharmacyId!,
          transactionType: 'NewRx',
        },
        h.key()
      )
    ).body.data;
    h.service.controller.runPendingJobs();
    await h.client.getTransmission(tx.id);
    const cancel = (
      await h.client.cancelPrescription(
        currentRx.id,
        {
          revision: currentRx.contentRevision,
          reasonCode: 'simulation',
          transmissionId: tx.id,
        },
        h.key()
      )
    ).body.data;
    h.service.controller.runPendingJobs();
    await h.client.getCancellation(cancel.id);
    await h.client.replacePrescription(
      currentRx.id,
      {
        original: { id: currentRx.id, revision: currentRx.contentRevision },
        reasonCode: 'simulation',
        draft: h.service.controller.draft(),
      },
      h.key()
    );
    await h.client.getEvents(currentRx.id);
    const uncertain = await routeHarness(
      'send-unknown-reconciliation',
      'known-not-transmitted'
    );
    const review2 = (
      await uncertain.client.createReview(
        {
          patientId: uncertain.record.patientId,
          selections: [
            {
              prescription: { id: uncertain.record.id, revision: '1' },
              evaluationId: uncertain.evaluation.id,
              readyToSign: true,
            },
          ],
        },
        uncertain.key()
      )
    ).body.data;
    const signing2 = (
      await uncertain.client.createSigningSession(
        { reviewId: review2.id, reviewRevision: review2.revision },
        uncertain.key()
      )
    ).body.data;
    const completed2 = (
      await uncertain.client.completeSigningSession(
        signing2.id,
        {
          sessionRevision: signing2.revision,
          completionReference:
            uncertain.service.controller.completeSimulatedChallenge(
              signing2.id
            ),
        },
        uncertain.key()
      )
    ).body.data;
    const sent2 = (
      await uncertain.client.createTransmission(
        {
          prescription: { id: uncertain.record.id, revision: '1' },
          evaluationId: uncertain.evaluation.id,
          signedArtifactId: completed2.artifacts[0].signedArtifactId,
          pharmacyId: uncertain.record.pharmacyId!,
          transactionType: 'NewRx',
        },
        uncertain.key()
      )
    ).body.data;
    uncertain.service.controller.runPendingJobs();
    const unknown = (await uncertain.client.getTransmission(sent2.id)).body
      .data;
    await uncertain.client.reconcileTransmission(
      sent2.id,
      { operationRevision: unknown.revision },
      uncertain.key()
    );
    uncertain.service.controller.runPendingJobs();
    const failed = (await uncertain.client.getTransmission(sent2.id)).body.data;
    await uncertain.client.retryTransmission(
      sent2.id,
      {
        operationRevision: failed.revision,
        evaluationId: uncertain.evaluation.id,
        reasonCode: 'known-failure',
      },
      uncertain.key()
    );
    expect([...observed].sort()).toEqual(
      prescribingRoutes.map((route) => `${route.method} ${route.path}`).sort()
    );
  }, 20000);
});
