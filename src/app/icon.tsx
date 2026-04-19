import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #467FFF, #5F7CF8, #1847BB)',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'white',
            lineHeight: 1,
          }}
        >
          △
        </div>
      </div>
    ),
    { ...size }
  );
}
