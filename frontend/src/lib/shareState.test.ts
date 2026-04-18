import { describe, expect, it } from 'vitest';
import { encodeState, decodeState, type ShareableState } from './shareState';

function makeState(): ShareableState {
  return {
    financials: {
      companyBalance: 1_000_000,
      mrr: 150_000,
      momGrowthPct: 7,
    },
    expenseValues: {
      rent: 5000,
      ads: 4000,
      tools: 3000,
      custom: [{ id: 'c1', label: 'legal', value: 1500 }],
    },
    assignments: {
      3: [
        { id: 'a1', roleKey: 'engineer', label: 'Eng', team: 'Engineering' },
      ],
      7: [
        { id: 'a2', roleKey: 'designer', label: 'Design', team: 'Design' },
      ],
    },
    roleSalaryOverrides: { engineer: 200_000 },
    view: 'month',
    focusedYear: 1,
    manualLocation: 'NYC',
  };
}

describe('shareState encode/decode', () => {
  it('round-trips a representative state', () => {
    const state = makeState();
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).toEqual(state);
  });

  it('produces a URL-safe token (no + / or =)', () => {
    const encoded = encodeState(makeState());
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('returns null for malformed input', () => {
    expect(decodeState('not base64!!!')).toBeNull();
  });
});
