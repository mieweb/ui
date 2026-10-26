// Ported from khawjaahmad/nemotron-diarization-web@0dc1980 (MIT, see ./LICENSE).

/** In-place iterative radix-2 FFT, sized once and reused across frames. */
export class Fft {
  private readonly cosTable: Float64Array;
  private readonly sinTable: Float64Array;
  private readonly reversed: Uint32Array;
  private readonly real: Float64Array;
  private readonly imag: Float64Array;

  constructor(readonly size: number) {
    if (size < 2 || (size & (size - 1)) !== 0) {
      throw new Error(`FFT size must be a power of two, got ${size}`);
    }
    const half = size / 2;
    this.cosTable = new Float64Array(half);
    this.sinTable = new Float64Array(half);
    for (let i = 0; i < half; i++) {
      this.cosTable[i] = Math.cos((2 * Math.PI * i) / size);
      this.sinTable[i] = Math.sin((2 * Math.PI * i) / size);
    }

    const bits = Math.log2(size);
    this.reversed = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
      let value = i;
      let mirrored = 0;
      for (let bit = 0; bit < bits; bit++) {
        mirrored = (mirrored << 1) | (value & 1);
        value >>= 1;
      }
      this.reversed[i] = mirrored;
    }

    this.real = new Float64Array(size);
    this.imag = new Float64Array(size);
  }

  /**
   * Power spectrum of a real signal, `size / 2 + 1` bins written into `out`.
   * `signal` must hold exactly `size` samples.
   */
  powerSpectrum(signal: Float32Array, out: Float32Array): void {
    const { size, real, imag, reversed, cosTable, sinTable } = this;

    for (let i = 0; i < size; i++) real[i] = signal[reversed[i]];
    imag.fill(0);

    for (let span = 2; span <= size; span <<= 1) {
      const half = span >> 1;
      const step = size / span;
      for (let start = 0; start < size; start += span) {
        for (
          let offset = 0, twiddle = 0;
          offset < half;
          offset++, twiddle += step
        ) {
          const even = start + offset;
          const odd = even + half;
          const cos = cosTable[twiddle];
          const sin = sinTable[twiddle];
          const oddReal = real[odd] * cos + imag[odd] * sin;
          const oddImag = imag[odd] * cos - real[odd] * sin;
          real[odd] = real[even] - oddReal;
          imag[odd] = imag[even] - oddImag;
          real[even] += oddReal;
          imag[even] += oddImag;
        }
      }
    }

    for (let bin = 0; bin <= size / 2; bin++) {
      out[bin] = real[bin] * real[bin] + imag[bin] * imag[bin];
    }
  }
}
