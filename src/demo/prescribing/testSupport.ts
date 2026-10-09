import { createHttpClient } from '../../prescribing/api/createHttpClient';
import type { PrescriptionDraft } from '../../prescribing/types';
import type {
  EvaluationRecord,
  PrescriptionRecord,
} from '../../prescribing/api/contracts';
import { createFakeEhrService } from './createFakeEhrService';
import type { FakeEhrServiceOptions } from './createFakeEhrService';
import { createFakeFetch } from './createFakeFetch';

/** Shared test helpers still exercise the serialized public API, not private mutations. */
export function createHarness(
  options: FakeEhrServiceOptions = { scenarioId: 'complete-demo' }
) {
  const service = createFakeEhrService(options);
  const client = createHttpClient({ fetch: createFakeFetch(service) });
  let sequence = 0;
  const key = () => ({ idempotencyKey: `test-${++sequence}` });
  const currentEvaluation = (id: string) =>
    client.getEvaluation(id).then((response) => response.body.data);
  const currentPrescription = (id: string) =>
    client.getPrescription(id).then((response) => response.body.data);
  async function createAndEvaluate(draft = service.controller.draft()) {
    const prescription = (await client.createPrescription(draft, key())).body
      .data;
    const initial = (
      await client.createEvaluation(
        {
          subject: {
            kind: 'saved',
            prescription: {
              id: prescription.id,
              revision: prescription.contentRevision,
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
        key()
      )
    ).body.data;
    service.controller.runPendingJobs();
    return {
      prescription: await currentPrescription(prescription.id),
      evaluation: await currentEvaluation(initial.id),
    };
  }
  async function sign(checked: EvaluationRecord) {
    if (checked.subject.kind !== 'saved')
      throw new Error('Expected saved evaluation');
    const prescription = await currentPrescription(
      checked.subject.prescription.id
    );
    const review = (
      await client.createReview(
        {
          patientId: prescription.patientId,
          selections: [
            {
              prescription: {
                id: prescription.id,
                revision: prescription.contentRevision,
              },
              evaluationId: checked.id,
              readyToSign: true,
            },
          ],
        },
        key()
      )
    ).body.data;
    const session = (
      await client.createSigningSession(
        { reviewId: review.id, reviewRevision: review.revision },
        key()
      )
    ).body.data;
    const completionReference = service.controller.completeSimulatedChallenge(
      session.id,
      'approved'
    );
    const completed = (
      await client.completeSigningSession(
        session.id,
        { sessionRevision: session.revision, completionReference },
        key()
      )
    ).body.data;
    return {
      session: completed,
      artifactId: completed.artifacts[0].signedArtifactId,
      evaluation: await currentEvaluation(checked.id),
      prescription: await currentPrescription(prescription.id),
    };
  }
  async function send(
    checked: EvaluationRecord,
    artifactId: string,
    idempotencyKey?: string
  ) {
    if (checked.subject.kind !== 'saved')
      throw new Error('Expected saved evaluation');
    const prescription = await currentPrescription(
      checked.subject.prescription.id
    );
    return client.createTransmission(
      {
        prescription: {
          id: prescription.id,
          revision: prescription.contentRevision,
        },
        evaluationId: checked.id,
        signedArtifactId: artifactId,
        pharmacyId: prescription.pharmacyId!,
        transactionType: 'NewRx',
      },
      idempotencyKey ? { idempotencyKey } : key()
    );
  }
  return {
    service,
    client,
    key,
    currentEvaluation,
    currentPrescription,
    createAndEvaluate,
    sign,
    send,
  };
}

export function draftFromRecord(record: PrescriptionRecord): PrescriptionDraft {
  const {
    id,
    contentRevision,
    patientId,
    encounterId,
    prescriberId,
    pharmacyId,
    intent,
    display,
    code,
    prescription,
  } = record;
  return {
    id,
    contentRevision,
    patientId,
    ...(encounterId ? { encounterId } : {}),
    prescriberId,
    ...(pharmacyId ? { pharmacyId } : {}),
    intent,
    display,
    ...(code ? { code } : {}),
    prescription,
  };
}
