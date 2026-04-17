import { Badge } from '@/components/ui/badge';
import { STATUS_COLOR, type HireStatus } from '../../data/headcount';

export function StatusBadge({ status }: { status: HireStatus }) {
  const c = STATUS_COLOR[status];
  return (
    <Badge
      variant="outline"
      className="h-[22px] rounded-lg border-0"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </Badge>
  );
}
