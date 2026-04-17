import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type View = 'year' | 'month';

interface ViewToggleProps {
  value: View;
  onChange: (v: View) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as View)}
      aria-label="View"
    >
      <TabsList>
        <TabsTrigger value="year">Yearly</TabsTrigger>
        <TabsTrigger value="month">Monthly</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
