import { FONT_FAMILIES, RADIUS } from '../../constants/design';

function LabeledMoneyInput({
  label,
  value,
  prefix,
}: {
  label: string;
  value: string;
  prefix: string;
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
        <input
          type="text"
          defaultValue={value}
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

export function FinancialInputsRow() {
  return (
    <div className="grid grid-cols-1 tablet:grid-cols-3 gap-[16px] tablet:gap-[14px] laptop:gap-[30px]">
      <LabeledMoneyInput label="Company Balance" value="1,000,000" prefix="$" />
      <LabeledMoneyInput label="MRR" value="150,000" prefix="$" />
      <LabeledMoneyInput label="MoM Growth" value="20" prefix="%" />
    </div>
  );
}
