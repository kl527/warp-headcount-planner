import type { Hire } from '../../data/headcount';
import { HireRow } from './HireRow';

export function HireList({ hires }: { hires: Hire[] }) {
  if (hires.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          minHeight: 160,
          color: 'var(--color-gray-10)',
          fontSize: 14,
          lineHeight: '20px',
        }}
      >
        No hires scheduled for this month.
      </div>
    );
  }
  return (
    <div
      style={{
        boxShadow: 'inset 0 1px 0 #00000014',
      }}
    >
      {hires.map((h) => (
        <HireRow key={h.id} hire={h} />
      ))}
    </div>
  );
}
