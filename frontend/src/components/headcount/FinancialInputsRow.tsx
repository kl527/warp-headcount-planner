import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import { MoneyInput } from './MoneyInput';

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
    <label className="flex flex-col gap-[9px] min-w-0">
      <span
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 15,
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
          maxWidth: 260,
          height: 32,
          border: '0.5px solid rgba(0, 0, 0, 0.3)',
          borderRadius: RADIUS.lg,
          padding: '0 14px',
          background: '#fff',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 12,
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
            fontSize: 12,
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
}

export function FinancialInputsRow({ values, onChange }: FinancialInputsRowProps) {
  return (
    <div className="grid grid-cols-1 tablet:grid-cols-3 gap-[16px] tablet:gap-[14px] laptop:gap-[30px]">
      <LabeledMoneyInput
        label="Company Balance"
        value={values.companyBalance}
        prefix="$"
        onChange={(next) => onChange({ companyBalance: next })}
      />
      <LabeledMoneyInput
        label="MRR"
        value={values.mrr}
        prefix="$"
        onChange={(next) => onChange({ mrr: next })}
      />
      <LabeledMoneyInput
        label="MoM Growth"
        value={values.momGrowthPct}
        prefix="%"
        onChange={(next) => onChange({ momGrowthPct: next })}
      />
    </div>
  );
}
