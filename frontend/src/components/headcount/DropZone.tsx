import { FONT_FAMILIES, RADIUS } from '../../constants/design';

export function DropZone() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        width: '100%',
        maxWidth: 359,
        height: 73,
        background: '#f9f9f9',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        boxShadow: '0 4px 4px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 20,
          fontWeight: 600,
          color: '#9b9b9b',
        }}
      >
        drag & drop
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 15,
          fontWeight: 400,
          color: '#9b9b9b',
        }}
      >
        .xlsx files supported
      </div>
    </div>
  );
}
