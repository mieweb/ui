import { describe, it, expect } from 'vitest';
import {
  cosine,
  centroid,
  clusterEmbeddings,
  labelClusters,
  attributeSegments,
  mergeTurns,
  inferSpeakerRoles,
  type DiarizedSegment,
} from './diarize';

const f = (...xs: number[]) => Float32Array.from(xs);

// two clearly-separated speaker groups: group A dominated by dim 0, group B by dim 1.
const A = [
  f(1, 0, 0, 0),
  f(1, 0, 0.05, 0),
  f(0.98, 0, 0, 0.05),
  f(1, 0.02, 0, 0.03),
];
const B = [f(0, 1, 0, 0), f(0, 0.98, 0.04, 0), f(0.03, 1, 0, 0)];

describe('cosine / centroid', () => {
  it('cosine is 1 for identical, ~0 for orthogonal', () => {
    expect(cosine(f(1, 0), f(1, 0))).toBeCloseTo(1, 5);
    expect(cosine(f(1, 0), f(0, 1))).toBeCloseTo(0, 5);
  });
  it('centroid averages + normalizes', () => {
    const c = centroid([f(1, 0), f(1, 0)]);
    expect(c[0]).toBeCloseTo(1, 5);
    expect(c[1]).toBeCloseTo(0, 5);
  });
});

describe('clusterEmbeddings', () => {
  it('recovers two speakers from two separated groups', () => {
    const labels = clusterEmbeddings([...A, ...B], { threshold: 0.5 });
    const distinct = new Set(labels);
    expect(distinct.size).toBe(2);
    // all of A share one cluster, all of B share another, and they differ
    const aLabels = labels.slice(0, A.length);
    const bLabels = labels.slice(A.length);
    expect(new Set(aLabels).size).toBe(1);
    expect(new Set(bLabels).size).toBe(1);
    expect(aLabels[0]).not.toBe(bLabels[0]);
  });

  it('collapses a single group to one cluster', () => {
    expect(new Set(clusterEmbeddings(A, { threshold: 0.5 })).size).toBe(1);
  });

  it('respects the maxSpeakers hard cap', () => {
    const labels = clusterEmbeddings([...A, ...B], {
      threshold: 0.5,
      maxSpeakers: 1,
    });
    expect(new Set(labels).size).toBe(1);
  });

  it('default threshold (0.65) merges same-speaker variation that 0.5 would over-split', () => {
    // two embeddings from one voice that drifted apart: cosine 0.4 → distance 0.6.
    const v1 = f(1, 0);
    const v2 = f(0.4, Math.sqrt(1 - 0.16));
    // the old 0.5 default left them as two "speakers" (0.6 > 0.5) — the over-splitting bug.
    expect(new Set(clusterEmbeddings([v1, v2], { threshold: 0.5 })).size).toBe(
      2
    );
    // the current default (0.65) merges them back into one (0.6 ≤ 0.65).
    expect(new Set(clusterEmbeddings([v1, v2])).size).toBe(1);
  });

  it('handles empty + single inputs', () => {
    expect(clusterEmbeddings([])).toEqual([]);
    expect(clusterEmbeddings([f(1, 0)])).toEqual([0]);
  });
});

describe('labelClusters / attributeSegments / mergeTurns', () => {
  it('names known clusters and falls back to Speaker N', () => {
    const labels = labelClusters([0, 0, 1], { 0: 'Dr. Smith' });
    expect(labels).toEqual(['Dr. Smith', 'Speaker 2']);
  });

  it('attributes segments and merges consecutive same-speaker turns', () => {
    const segments = [
      { start: 0, end: 1, text: 'hello' },
      { start: 1, end: 2, text: 'how are you' },
      { start: 2, end: 3, text: 'fine thanks' },
    ];
    const clusters = [0, 0, 1];
    const labels = labelClusters(clusters, { 0: 'Doctor' });
    const attributed: DiarizedSegment[] = attributeSegments(
      segments,
      clusters,
      labels
    );
    expect(attributed.map((s) => s.speaker)).toEqual([
      'Doctor',
      'Doctor',
      'Speaker 2',
    ]);

    const turns = mergeTurns(attributed);
    expect(turns).toHaveLength(2);
    expect(turns[0]).toMatchObject({
      speaker: 'Doctor',
      text: 'hello how are you',
      start: 0,
      end: 2,
    });
    expect(turns[1]).toMatchObject({
      speaker: 'Speaker 2',
      text: 'fine thanks',
    });
  });
});

describe('inferSpeakerRoles', () => {
  const segs: DiarizedSegment[] = [
    {
      start: 0,
      end: 1,
      text: 'what brings you in?',
      cluster: 0,
      speaker: 'Dr. Smith',
    },
    {
      start: 1,
      end: 2,
      text: 'my knee has been hurting',
      cluster: 1,
      speaker: 'Speaker 2',
    },
  ];

  it('relabels generic speakers, leaves named ones', async () => {
    let called = 0;
    const ask = async () => {
      called++;
      return '{"Speaker 2":"Patient"}';
    };
    const out = await inferSpeakerRoles(segs, ask);
    expect(called).toBe(1);
    expect(out.map((s) => s.speaker)).toEqual(['Dr. Smith', 'Patient']);
  });

  it('parses JSON wrapped in prose / code fences', async () => {
    const ask = async () => 'Sure —\n```json\n{"Speaker 2":"Caregiver"}\n```';
    const out = await inferSpeakerRoles(segs, ask);
    expect(out[1].speaker).toBe('Caregiver');
  });

  it('leaves segments unchanged on unparseable replies', async () => {
    const out = await inferSpeakerRoles(segs, async () => 'no idea, sorry');
    expect(out.map((s) => s.speaker)).toEqual(['Dr. Smith', 'Speaker 2']);
  });

  it('does not call the LLM when every speaker is already named', async () => {
    let called = 0;
    const named = segs.map((s) => ({ ...s, speaker: 'Dr. Smith' }));
    await inferSpeakerRoles(named, async () => {
      called++;
      return '{}';
    });
    expect(called).toBe(0);
  });
});
