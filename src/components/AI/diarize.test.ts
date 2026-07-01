import { describe, it, expect } from 'vitest';
import {
  cosine,
  centroid,
  clusterEmbeddings,
  labelClusters,
  attributeSegments,
  mergeTurns,
  type DiarizedSegment,
} from './diarize';

const f = (...xs: number[]) => Float32Array.from(xs);

// two clearly-separated speaker groups: group A dominated by dim 0, group B by dim 1.
const A = [f(1, 0, 0, 0), f(1, 0, 0.05, 0), f(0.98, 0, 0, 0.05), f(1, 0.02, 0, 0.03)];
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
    const labels = clusterEmbeddings([...A, ...B], { threshold: 0.5, maxSpeakers: 1 });
    expect(new Set(labels).size).toBe(1);
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
    const attributed: DiarizedSegment[] = attributeSegments(segments, clusters, labels);
    expect(attributed.map((s) => s.speaker)).toEqual(['Doctor', 'Doctor', 'Speaker 2']);

    const turns = mergeTurns(attributed);
    expect(turns).toHaveLength(2);
    expect(turns[0]).toMatchObject({ speaker: 'Doctor', text: 'hello how are you', start: 0, end: 2 });
    expect(turns[1]).toMatchObject({ speaker: 'Speaker 2', text: 'fine thanks' });
  });
});
