export interface TilePosition {
  code: string;
  name: string;
  /** Zero-based grid row. */
  row: number;
  /** Zero-based grid column. */
  col: number;
}

// The widely used 11 × 8 US tile-grid layout (50 states + DC).
const grid: Array<[string, string, number, number]> = [
  ['AK', 'Alaska', 0, 0],
  ['ME', 'Maine', 0, 10],
  ['VT', 'Vermont', 1, 9],
  ['NH', 'New Hampshire', 1, 10],
  ['WA', 'Washington', 2, 0],
  ['ID', 'Idaho', 2, 1],
  ['MT', 'Montana', 2, 2],
  ['ND', 'North Dakota', 2, 3],
  ['MN', 'Minnesota', 2, 4],
  ['IL', 'Illinois', 2, 5],
  ['WI', 'Wisconsin', 2, 6],
  ['MI', 'Michigan', 2, 8],
  ['NY', 'New York', 2, 9],
  ['MA', 'Massachusetts', 2, 10],
  ['OR', 'Oregon', 3, 0],
  ['NV', 'Nevada', 3, 1],
  ['WY', 'Wyoming', 3, 2],
  ['SD', 'South Dakota', 3, 3],
  ['IA', 'Iowa', 3, 4],
  ['IN', 'Indiana', 3, 5],
  ['OH', 'Ohio', 3, 6],
  ['PA', 'Pennsylvania', 3, 7],
  ['NJ', 'New Jersey', 3, 8],
  ['CT', 'Connecticut', 3, 9],
  ['RI', 'Rhode Island', 3, 10],
  ['CA', 'California', 4, 0],
  ['UT', 'Utah', 4, 1],
  ['CO', 'Colorado', 4, 2],
  ['NE', 'Nebraska', 4, 3],
  ['MO', 'Missouri', 4, 4],
  ['KY', 'Kentucky', 4, 5],
  ['WV', 'West Virginia', 4, 6],
  ['VA', 'Virginia', 4, 7],
  ['MD', 'Maryland', 4, 8],
  ['DE', 'Delaware', 4, 9],
  ['AZ', 'Arizona', 5, 1],
  ['NM', 'New Mexico', 5, 2],
  ['KS', 'Kansas', 5, 3],
  ['AR', 'Arkansas', 5, 4],
  ['TN', 'Tennessee', 5, 5],
  ['NC', 'North Carolina', 5, 6],
  ['SC', 'South Carolina', 5, 7],
  ['DC', 'District of Columbia', 5, 8],
  ['OK', 'Oklahoma', 6, 3],
  ['LA', 'Louisiana', 6, 4],
  ['MS', 'Mississippi', 6, 5],
  ['AL', 'Alabama', 6, 6],
  ['GA', 'Georgia', 6, 7],
  ['HI', 'Hawaii', 7, 0],
  ['TX', 'Texas', 7, 3],
  ['FL', 'Florida', 7, 7],
];

/** US states and DC on an 11-column tile grid, every state the same size. */
export const usStateTiles: TilePosition[] = grid.map(
  ([code, name, row, col]) => ({ code, name, row, col })
);

export type TileBucket = 0 | 1 | 2 | 3 | 4;

/**
 * Quartile buckets for a set of values: 1 (lowest) to 4 (highest), and 0 for
 * a missing value. Run it in the data layer; pass the result to `TileCartogramSection`.
 */
export function quartileBuckets(
  values: Record<string, number | null | undefined>
): Record<string, TileBucket> {
  const sorted = Object.values(values)
    .filter((v): v is number => typeof v === 'number')
    .sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];
  const out: Record<string, TileBucket> = {};
  for (const [code, v] of Object.entries(values)) {
    out[code] =
      typeof v !== 'number' || sorted.length === 0
        ? 0
        : v <= q(0.25)
          ? 1
          : v <= q(0.5)
            ? 2
            : v <= q(0.75)
              ? 3
              : 4;
  }
  return out;
}
