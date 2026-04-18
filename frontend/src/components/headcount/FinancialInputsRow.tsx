import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import { MoneyInput } from './MoneyInput';
import { ViewToggle, type View } from './ViewToggle';

function LabeledMoneyInput({
  label,
  value,
  prefix,
  onChange,
}: {
  label: string;
  value: number;
  prefix: string;
  onChange: (next: number) => void;
}) {
  return (
    <label className="flex flex-col gap-[7px] min-w-0">
      <span
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 13,
          fontWeight: 500,
          color: '#000',
        }}
      >
        {label}
      </span>
      <div
        className="flex items-center"
        style={{
          width: '100%',
          maxWidth: 180,
          height: 28,
          border: '0.5px solid rgba(0, 0, 0, 0.3)',
          borderRadius: RADIUS.lg,
          padding: '0 12px',
          background: '#fff',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 11,
            color: '#aeaeae',
          }}
        >
          {prefix}
        </span>
        <MoneyInput
          value={value}
          onChange={onChange}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: FONT_FAMILIES.mono,
            fontSize: 11,
            fontWeight: 500,
            color: '#1e1e1e',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
      </div>
    </label>
  );
}

export interface FinancialInputs {
  companyBalance: number;
  mrr: number;
  momGrowthPct: number;
}

interface FinancialInputsRowProps {
  values: FinancialInputs;
  onChange: (patch: Partial<FinancialInputs>) => void;
  view: View;
  onViewChange: (next: View) => void;
}

export function FinancialInputsRow({
  values,
  onChange,
  view,
  onViewChange,
}: FinancialInputsRowProps) {
  const isYear = view === 'year';

  const revenueLabel = isYear ? 'ARR' : 'MRR';
  const revenueValue = isYear ? values.mrr * 12 : values.mrr;
  const onRevenueChange = (next: number) =>
    onChange({ mrr: isYear ? Math.round(next / 12) : next });

  const growthLabel = isYear ? 'YoY Growth' : 'MoM Growth';
  const growthValue = isYear
    ? Math.round(
        (Math.pow(1 + values.momGrowthPct / 100, 12) - 1) * 100,
      )
    : values.momGrowthPct;
  const onGrowthChange = (next: number) =>
    onChange({
      momGrowthPct: isYear
        ? Math.round((Math.pow(1 + next / 100, 1 / 12) - 1) * 10000) / 100
        : next,
    });

  return (
    <div className="flex flex-col tablet:flex-row tablet:items-end gap-[16px] tablet:gap-[14px] laptop:gap-[30px]">
      <LabeledMoneyInput
        label="Company Balance"
        value={values.companyBalance}
        prefix="$"
        onChange={(next) => onChange({ companyBalance: next })}
      />
      <LabeledMoneyInput
        label={revenueLabel}
        value={revenueValue}
        prefix="$"
        onChange={onRevenueChange}
      />
      <LabeledMoneyInput
        label={growthLabel}
        value={growthValue}
        prefix="%"
        onChange={onGrowthChange}
      />
      <div className="tablet:ml-auto flex-shrink-0">
        <ViewToggle value={view} onChange={onViewChange} />
      </div>
    </div>
  );
}
