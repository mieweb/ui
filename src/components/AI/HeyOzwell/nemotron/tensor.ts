// Ported from khawjaahmad/nemotron-diarization-web@0dc1980 (MIT, see ./LICENSE).

/** Minimal row-major float matrix helpers, enough for the diarization streaming state. */
export interface Matrix {
  readonly data: Float32Array;
  readonly rows: number;
  readonly cols: number;
}

export function createMatrix(rows: number, cols: number): Matrix {
  return { data: new Float32Array(rows * cols), rows, cols };
}

export function wrapMatrix(data: Float32Array, cols: number): Matrix {
  return { data, rows: data.length / cols, cols };
}

export function sliceRows(source: Matrix, start: number, end: number): Matrix {
  const rows = Math.max(0, end - start);
  return {
    data: source.data.slice(start * source.cols, (start + rows) * source.cols),
    rows,
    cols: source.cols,
  };
}

export function concatRows(first: Matrix, second: Matrix): Matrix {
  const data = new Float32Array(first.data.length + second.data.length);
  data.set(first.data, 0);
  data.set(second.data, first.data.length);
  return { data, rows: first.rows + second.rows, cols: first.cols };
}

export function copyRowsInto(
  target: Matrix,
  source: Matrix,
  targetStart = 0
): void {
  target.data.set(source.data, targetStart * target.cols);
}

/** Gathers `indices` rows out of `source`, in the given order. */
export function gatherRows(source: Matrix, indices: Int32Array): Matrix {
  const result = createMatrix(indices.length, source.cols);
  for (let row = 0; row < indices.length; row++) {
    const offset = indices[row] * source.cols;
    result.data.set(
      source.data.subarray(offset, offset + source.cols),
      row * source.cols
    );
  }
  return result;
}

/** Indices of the `count` largest values, unordered. Ties resolve to the lower index. */
export function topKIndices(values: Float32Array, count: number): Int32Array {
  const order = new Int32Array(values.length);
  for (let i = 0; i < order.length; i++) order[i] = i;
  order.sort((a, b) => values[b] - values[a] || a - b);
  return order.slice(0, count);
}
