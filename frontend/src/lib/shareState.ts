import type { MonthAssignment } from '../components/headcount/RolePill';
import type { MonthlyExpenseValues } from '../components/headcount/ExpensesSidebar';
import type { FinancialInputs } from '../components/headcount/FinancialInputsRow';
import type { View } from '../components/headcount/ViewToggle';
import type { LocationKey } from './salaryApi';

export interface ShareableState {
  financials: FinancialInputs;
  expenseValues: MonthlyExpenseValues;
  assignments: Record<number, MonthAssignment[]>;
  roleSalaryOverrides: Record<string, number>;
  view: View;
  focusedYear: number;
  manualLocation: LocationKey | null;
}

export function stripAssignments(
  assignments: Record<number, MonthAssignment[]>,
): Record<number, MonthAssignment[]> {
  const out: Record<number, MonthAssignment[]> = {};
  for (const [k, list] of Object.entries(assignments)) {
    out[Number(k)] = list.map((a) => {
      const { flipFrom, ...rest } = a;
      void flipFrom;
      return rest;
    });
  }
  return out;
}

export function encodeState(state: ShareableState): string {
  const json = JSON.stringify({
    financials: state.financials,
    expenseValues: state.expenseValues,
    assignments: stripAssignments(state.assignments),
    roleSalaryOverrides: state.roleSalaryOverrides,
    view: state.view,
    focusedYear: state.focusedYear,
    manualLocation: state.manualLocation,
  });
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeState(encoded: string): Partial<ShareableState> | null {
  try {
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function decodeShareUrl(shareUrl: string): Partial<ShareableState> | null {
  try {
    const url = new URL(shareUrl);
    const raw = url.searchParams.get('state');
    return raw ? decodeState(raw) : null;
  } catch {
    return null;
  }
}
