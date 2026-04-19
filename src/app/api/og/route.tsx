import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #000003 0%, #000036 38%, #143f79 82%, #496d93 100%)',
          position: 'relative',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 300,
            color: 'white',
            letterSpacing: '-1px',
            marginBottom: 20,
          }}
        >
          DeFi Triangle
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.65)',
          }}
        >
          Your DeFi execution and exposure app.
        </div>

        {/* Divider */}
        <div
          style={{
            width: 120,
            height: 1,
            background: 'rgba(255, 255, 255, 0.15)',
            marginTop: 40,
            marginBottom: 20,
          }}
        />

        {/* Built on Solana */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.35)',
            letterSpacing: '3px',
            textTransform: 'uppercase' as const,
          }}
        >
          BUILT ON SOLANA
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
