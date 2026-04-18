import { FONT_FAMILIES, RADIUS } from '../../constants/design';

const AXIS_MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

export function RunwayCard() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 466,
        minHeight: 386,
        background: '#f9f9f9',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div
        style={{
          minHeight: 105,
          background: '#fff',
          border: '0.5px solid #f9f9f9',
          borderRadius: RADIUS.lg,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          padding: '15px 26px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 18,
            lineHeight: '27px',
            color: 'rgba(0, 0, 0, 0.61)',
          }}
        >
          runway remaining
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 35,
            lineHeight: '40px',
            fontWeight: 700,
            color: '#e21200',
          }}
        >
          2.9 Months
        </span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 225,
          background: '#fff',
          border: '0.5px solid #f9f9f9',
          borderRadius: RADIUS.lg,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          padding: '17px 20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5fcf3',
            borderRadius: 20,
            height: 21,
            padding: '0 16px',
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 10,
            fontWeight: 600,
            color: '#008500',
            whiteSpace: 'nowrap',
          }}
        >
          runway over time
        </span>

        <div
          style={{
            flex: 1,
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              flex: 1,
              borderLeft: '1px solid #d9d9d9',
              borderBottom: '1px solid #d9d9d9',
              minHeight: 112,
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 6,
            }}
          >
            {AXIS_MONTHS.map((m) => (
              <span
                key={m}
                style={{
                  fontFamily: FONT_FAMILIES.sans,
                  fontSize: 8,
                  fontWeight: 600,
                  color: '#d9d9d9',
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
