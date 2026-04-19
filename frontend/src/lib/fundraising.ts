export interface RaiseInputs {
  endOfMonthBalances: number[];
  targetMonths: number;
  bufferPct: number;
}

export interface RaiseResult {
  requiredRaise: number;
  bufferedRaise: number;
  worstDeficit: number;
  worstDeficitMonth: number;
  alreadyFunded: boolean;
}

export function computeRequiredRaise(input: RaiseInputs): RaiseResult {
  const windowLen = Math.min(input.targetMonths, input.endOfMonthBalances.length);
  let worst = 0;
  let worstMonth = 0;
  for (let m = 0; m < windowLen; m++) {
    const bal = input.endOfMonthBalances[m];
    if (bal < worst) {
      worst = bal;
      worstMonth = m;
    }
  }
  const requiredRaise = Math.max(0, -worst);
  return {
    requiredRaise,
    bufferedRaise: requiredRaise * (1 + input.bufferPct),
    worstDeficit: worst,
    worstDeficitMonth: worstMonth,
    alreadyFunded: requiredRaise === 0,
  };
}

export function formatCompactUsd(amount: number): string {
  if (!Number.isFinite(amount)) return '$0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}$${stripTrailingZero((abs / 1_000_000_000).toFixed(2))}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${stripTrailingZero((abs / 1_000_000).toFixed(2))}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${Math.round(abs / 1_000)}K`;
  }
  return `${sign}$${Math.round(abs)}`;
}

function stripTrailingZero(s: string): string {
  return s.replace(/\.?0+$/, '');
}

export function monthIndexToLabel(monthIndex: number, baseYear: number): string {
  const year = baseYear + Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  const date = new Date(year, month, 1);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}
